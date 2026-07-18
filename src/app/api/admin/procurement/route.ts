import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { requireAdminSession } from "@/lib/rbac-server";
import { prisma } from "@/lib/prisma";
import { auditAdminAction } from "@/lib/audit";
import {
  OfferStatus,
  ProcurementDealType,
  PurchaseOrderStatus,
  UnitType,
} from "@prisma/client";

function poNumber() {
  const n = Date.now().toString(36).toUpperCase();
  return `PO-${n.slice(-8)}`;
}

const PAID_ORDER_STATUSES = [
  "PAID",
  "CONFIRMED",
  "PREPARING",
  "PACKED",
  "READY_FOR_DISPATCH",
  "READY_FOR_PICKUP",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
] as const;

async function customerSalesForProduct(productId: string | null | undefined) {
  if (!productId) return 0;
  const agg = await prisma.orderItem.aggregate({
    where: {
      productId,
      order: { status: { in: [...PAID_ORDER_STATUSES] } },
    },
    _sum: { lineTotal: true },
  });
  return agg._sum.lineTotal ?? 0;
}

function calcCommission(saleAmount: number, ratePercent: number) {
  const commissionAmount = Math.round((saleAmount * ratePercent) / 100);
  const farmerNetAmount = Math.max(0, saleAmount - commissionAmount);
  return { commissionAmount, farmerNetAmount };
}

/**
 * Admin procurement:
 * - offer actions: accept | reject | purchase (creates PO + draft product)
 * - PO actions: receive | inspect_accept | inspect_reject | settle | pay | cancel
 * - views: requests | orders | received | commission | payments | history
 */
export async function GET(req: Request) {
  const session = await requireAdminSession({
    modules: [
      "purchase_requests",
      "purchase_orders",
      "goods_received",
      "commission_sales",
      "farmer_payments",
      "procurement_history",
      "farmers",
    ],
  });
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const view = searchParams.get("view") || "requests";

  const poInclude = {
    supplier: {
      select: {
        businessName: true,
        defaultCommissionRate: true,
        paymentMomo: true,
        bankAccount: true,
      },
    },
    offer: { select: { title: true } },
  } as const;

  if (view === "requests") {
    const offers = await prisma.supplierOffer.findMany({
      where: { status: { in: ["PENDING", "ACCEPTED"] } },
      include: {
        supplier: {
          select: { businessName: true, defaultCommissionRate: true },
        },
        category: true,
      },
      orderBy: { createdAt: "desc" },
      take: 80,
    });
    return NextResponse.json({ offers, purchaseOrders: [] });
  }

  if (view === "received") {
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: { status: { in: ["RECEIVED", "INSPECTED", "ACCEPTED", "PAID"] } },
      include: poInclude,
      orderBy: { updatedAt: "desc" },
      take: 80,
    });
    return NextResponse.json({ offers: [], purchaseOrders });
  }

  if (view === "commission") {
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: {
        dealType: ProcurementDealType.COMMISSION,
        status: { in: ["INSPECTED", "ACCEPTED", "PAID", "RECEIVED", "ORDERED"] },
      },
      include: poInclude,
      orderBy: { updatedAt: "desc" },
      take: 100,
    });

    const enriched = await Promise.all(
      purchaseOrders.map(async (po) => {
        const liveSales = await customerSalesForProduct(po.productId);
        return { ...po, liveSales };
      })
    );

    return NextResponse.json({ offers: [], purchaseOrders: enriched });
  }

  if (view === "payments") {
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: {
        status: { in: ["INSPECTED", "ACCEPTED", "PAID"] },
      },
      include: poInclude,
      orderBy: [{ paidAt: "desc" }, { updatedAt: "desc" }],
      take: 100,
    });
    return NextResponse.json({ offers: [], purchaseOrders });
  }

  if (view === "history") {
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      include: poInclude,
      orderBy: { updatedAt: "desc" },
      take: 120,
    });
    return NextResponse.json({ offers: [], purchaseOrders });
  }

  // Active POs awaiting receive / inspect / pay (outright buy pay on orders)
  const purchaseOrders = await prisma.purchaseOrder.findMany({
    where: { status: { in: ["DRAFT", "ORDERED", "RECEIVED", "INSPECTED"] } },
    include: poInclude,
    orderBy: { createdAt: "desc" },
    take: 80,
  });
  return NextResponse.json({ offers: [], purchaseOrders });
}

export async function PATCH(req: Request) {
  const session = await requireAdminSession({
    modules: [
      "purchase_requests",
      "purchase_orders",
      "goods_received",
      "commission_sales",
      "farmer_payments",
    ],
  });
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  if (body.poId && body.poAction) {
    return handlePoAction(req, session, body);
  }

  const {
    offerId,
    action,
    adminNote,
    retailPrice,
    purchasedQty,
    negotiatedPrice,
    dealType,
    commissionRate,
  } = body as {
    offerId: string;
    action: "accept" | "reject" | "purchase";
    adminNote?: string;
    retailPrice?: number;
    purchasedQty?: number;
    negotiatedPrice?: number;
    dealType?: "OUTRIGHT_BUY" | "COMMISSION";
    commissionRate?: number;
  };

  const offer = await prisma.supplierOffer.findUnique({
    where: { id: offerId },
    include: { supplier: true },
  });
  if (!offer) return NextResponse.json({ error: "Offer not found" }, { status: 404 });

  if (action === "accept" || action === "reject") {
    const status = action === "accept" ? OfferStatus.ACCEPTED : OfferStatus.REJECTED;
    const updated = await prisma.supplierOffer.update({
      where: { id: offerId },
      data: { status, adminNote: adminNote || null },
    });
    await auditAdminAction(req, session, {
      action: `offer.${action}`,
      entity: "SupplierOffer",
      entityId: offerId,
      details: adminNote || status,
    });
    return NextResponse.json(updated);
  }

  if (action === "purchase") {
    const qty = purchasedQty ?? offer.quantityOffered;
    const deal =
      dealType === "COMMISSION"
        ? ProcurementDealType.COMMISSION
        : ProcurementDealType.OUTRIGHT_BUY;
    const rate =
      deal === ProcurementDealType.COMMISSION
        ? Math.max(
            0,
            Math.min(
              100,
              commissionRate ?? offer.supplier.defaultCommissionRate ?? 10
            )
          )
        : null;
    const unitPrice =
      deal === ProcurementDealType.COMMISSION
        ? Math.max(0, negotiatedPrice ?? 0)
        : (negotiatedPrice ?? offer.askPrice);
    const sellPrice = retailPrice ?? offer.suggestedRetail ?? Math.round((unitPrice || offer.askPrice) * 1.25);
    const categoryId =
      offer.categoryId ||
      (await prisma.category.findFirst({ orderBy: { sortOrder: "asc" } }))?.id;

    if (!categoryId) {
      return NextResponse.json({ error: "No category available" }, { status: 400 });
    }

    if (deal === ProcurementDealType.COMMISSION && (rate == null || Number.isNaN(rate))) {
      return NextResponse.json({ error: "Commission rate required" }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        supplierId: offer.supplierId,
        categoryId,
        nameEn: offer.title,
        nameFr: offer.title,
        nameRw: offer.title,
        descriptionEn:
          offer.description ||
          `Fresh ${offer.title} sold by Youth Huza on HUZA FRESH.`,
        descriptionFr:
          offer.description ||
          `${offer.title} frais vendu par Youth Huza sur HUZA FRESH.`,
        descriptionRw:
          offer.description ||
          `${offer.title} bishya bigurishwa na Youth Huza kuri HUZA FRESH.`,
        price: sellPrice,
        purchasePrice: deal === ProcurementDealType.OUTRIGHT_BUY ? unitPrice : null,
        ownershipMode: deal === ProcurementDealType.COMMISSION ? "COMMISSION" : "OWNED",
        unit: offer.unit as UnitType,
        stockQty: 0,
        isNewArrival: true,
        isActive: false,
        location: offer.supplier.location,
        originDistrict: offer.supplier.district,
        availableDistricts:
          offer.availableDistricts.length > 0
            ? offer.availableDistricts
            : [offer.supplier.district],
        images: {
          create: [
            {
              url: "/images/products/mushroom.svg",
              alt: offer.title,
              sortOrder: 0,
              kind: "STOREFRONT",
              isCover: true,
            },
          ],
        },
        reviewStatus: "APPROVED",
        reviewNote:
          deal === ProcurementDealType.COMMISSION
            ? "Commission listing — awaiting delivery & QC before shop publish"
            : "From procurement — awaiting delivery & QC before shop publish",
      },
    });

    const totalAmount =
      deal === ProcurementDealType.COMMISSION ? 0 : Math.round(unitPrice * qty);
    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        poNumber: poNumber(),
        supplierId: offer.supplierId,
        offerId: offer.id,
        status: PurchaseOrderStatus.ORDERED,
        dealType: deal,
        productName: offer.title,
        category: offer.categoryId || null,
        unit: offer.unit as UnitType,
        quantity: qty,
        negotiatedPrice: unitPrice,
        totalAmount,
        retailPrice: sellPrice,
        commissionRate: rate,
        orderedAt: new Date(),
        notes: adminNote || null,
        productId: product.id,
        createdById: session.user.id,
      },
    });

    const dealLabel =
      deal === ProcurementDealType.COMMISSION
        ? `Commission sale (${rate}%)`
        : `Outright buy at ${unitPrice} RWF`;

    const updated = await prisma.supplierOffer.update({
      where: { id: offerId },
      data: {
        status: OfferStatus.PURCHASED,
        purchasedQty: qty,
        productId: product.id,
        adminNote:
          adminNote ||
          `PO ${purchaseOrder.poNumber}: ${dealLabel}; retail ${sellPrice} RWF — awaiting delivery`,
      },
    });

    await prisma.notification.create({
      data: {
        userId: offer.supplier.userId,
        type: "SUPPLIER_STATUS",
        channel: "IN_APP",
        title:
          deal === ProcurementDealType.COMMISSION
            ? "Youth Huza will sell on commission"
            : "Youth Huza created a purchase order",
        body:
          deal === ProcurementDealType.COMMISSION
            ? `PO ${purchaseOrder.poNumber}: Huza will sell ${qty} ${offer.unit.toLowerCase()} of ${offer.title} on commission (${rate}%). Deliver for inspection. Customers still buy from HUZA FRESH only.`
            : `PO ${purchaseOrder.poNumber}: Huza ordered ${qty} ${offer.unit.toLowerCase()} of ${offer.title} at ${unitPrice} RWF/${offer.unit.toLowerCase()}. Please deliver for inspection.`,
      },
    });

    await auditAdminAction(req, session, {
      action: "offer.purchase",
      entity: "PurchaseOrder",
      entityId: purchaseOrder.id,
      details: `PO ${purchaseOrder.poNumber}; ${deal}; product ${product.id}; qty ${qty}; wholesale ${unitPrice}; retail ${sellPrice}; rate ${rate ?? "-"}`,
    });

    return NextResponse.json({ offer: updated, product, purchaseOrder });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

async function handlePoAction(
  req: Request,
  session: Session,
  body: {
    poId: string;
    poAction: string;
    qualityNotes?: string;
    rejectionReason?: string;
    recommendation?: string;
    paymentRef?: string;
    paymentMethod?: string;
    notes?: string;
    expiryDate?: string;
    saleAmount?: number;
    commissionRate?: number;
  }
) {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: body.poId },
    include: { supplier: true },
  });
  if (!po) return NextResponse.json({ error: "PO not found" }, { status: 404 });

  const now = new Date();
  let data: Record<string, unknown> = {};
  let notifyTitle = `Purchase order ${body.poAction}`;
  let notifyBody = `PO ${po.poNumber} is now ${body.poAction}.`;

  switch (body.poAction) {
    case "receive": {
      data = {
        status: PurchaseOrderStatus.RECEIVED,
        receivedAt: now,
        notes: body.notes || po.notes,
      };
      if (
        po.productId &&
        po.quantity > 0 &&
        po.status !== PurchaseOrderStatus.RECEIVED &&
        po.status !== PurchaseOrderStatus.INSPECTED &&
        po.status !== PurchaseOrderStatus.ACCEPTED &&
        po.status !== PurchaseOrderStatus.PAID
      ) {
        const { stockService } = await import("@/services/stock.service");
        await stockService.stockIn(
          po.productId,
          Math.floor(po.quantity),
          `PO ${po.poNumber} received into warehouse (awaiting QC)`,
          session.user.id,
          "RECEIVE"
        );
        await prisma.product.update({
          where: { id: po.productId },
          data: { isActive: false },
        });
        const batchNumber = `B-${po.poNumber}-${Date.now().toString(36).toUpperCase().slice(-4)}`;
        await prisma.stockBatch.create({
          data: {
            productId: po.productId,
            batchNumber,
            quantity: Math.floor(po.quantity),
            expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
            notes: `From PO ${po.poNumber}`,
          },
        });
      }
      notifyTitle = "Goods received";
      notifyBody = `PO ${po.poNumber}: Youth Huza received your delivery. Quality inspection is next.`;
      break;
    }
    case "inspect_accept": {
      data = {
        status: PurchaseOrderStatus.INSPECTED,
        inspectedAt: now,
        qualityNotes: body.qualityNotes || "Quality accepted — ready for shop",
      };
      if (po.productId) {
        await prisma.product.update({
          where: { id: po.productId },
          data: {
            isActive: true,
            isNewArrival: true,
            reviewStatus: "APPROVED",
            reviewNote: "Passed QC — published to HUZA FRESH shop",
            reviewedAt: now,
            ownershipMode:
              po.dealType === ProcurementDealType.COMMISSION ? "COMMISSION" : "OWNED",
          },
        });
        const { cacheDel, CacheKeys } = await import("@/lib/redis");
        await cacheDel(CacheKeys.homeCatalog);
      }
      notifyTitle = "Quality passed — live on HUZA FRESH";
      notifyBody =
        po.dealType === ProcurementDealType.COMMISSION
          ? `PO ${po.poNumber}: Your produce passed QC and is selling on HUZA FRESH. Payment after sales (commission ${po.commissionRate ?? 10}%).`
          : `PO ${po.poNumber}: Quality accepted. Product is live. Farmer payment can be processed.`;
      break;
    }
    case "inspect_reject": {
      data = {
        status: PurchaseOrderStatus.REJECTED,
        inspectedAt: now,
        rejectionReason: body.rejectionReason || "Quality rejected",
        qualityNotes: body.qualityNotes || null,
        recommendation: body.recommendation?.trim() || null,
      };
      if (po.productId) {
        await prisma.product.update({
          where: { id: po.productId },
          data: {
            isActive: false,
            stockQty: 0,
            reviewStatus: "REJECTED",
            reviewNote: body.rejectionReason || "Quality rejected",
            reviewRecommendation: body.recommendation?.trim() || null,
            reviewedAt: now,
          },
        });
      }
      notifyTitle = "Quality rejected";
      notifyBody = `PO ${po.poNumber}: ${body.rejectionReason || "Quality rejected"}${
        body.recommendation ? ` Recommendation: ${body.recommendation}` : ""
      }`;
      break;
    }
    case "settle": {
      if (po.dealType !== ProcurementDealType.COMMISSION) {
        return NextResponse.json(
          { error: "Settle applies only to commission sales" },
          { status: 400 }
        );
      }
      if (po.status === PurchaseOrderStatus.PAID) {
        return NextResponse.json({ error: "Already paid" }, { status: 400 });
      }
      if (
        po.status !== PurchaseOrderStatus.INSPECTED &&
        po.status !== PurchaseOrderStatus.ACCEPTED
      ) {
        return NextResponse.json(
          { error: "Settle after QC pass (INSPECTED)" },
          { status: 400 }
        );
      }

      const liveSales = await customerSalesForProduct(po.productId);
      const saleAmount = Math.max(
        0,
        Math.round(body.saleAmount != null ? Number(body.saleAmount) : liveSales)
      );
      const rate = Math.max(
        0,
        Math.min(
          100,
          body.commissionRate ?? po.commissionRate ?? po.supplier.defaultCommissionRate ?? 10
        )
      );
      const { commissionAmount, farmerNetAmount } = calcCommission(saleAmount, rate);

      data = {
        saleAmount,
        commissionRate: rate,
        commissionAmount,
        farmerNetAmount,
        totalAmount: farmerNetAmount,
        notes:
          body.notes ||
          po.notes ||
          `Commission settlement: sale ${saleAmount}, rate ${rate}%, Huza ${commissionAmount}, farmer ${farmerNetAmount}`,
      };
      notifyTitle = "Commission calculated";
      notifyBody = `PO ${po.poNumber}: Sales ${saleAmount.toLocaleString()} RWF. Huza commission ${rate}% = ${commissionAmount.toLocaleString()} RWF. You receive ${farmerNetAmount.toLocaleString()} RWF (pending payout).`;
      break;
    }
    case "pay": {
      if (po.dealType === ProcurementDealType.COMMISSION) {
        const liveSales = await customerSalesForProduct(po.productId);
        const saleAmount = Math.max(
          0,
          Math.round(
            body.saleAmount != null
              ? Number(body.saleAmount)
              : (po.saleAmount ?? liveSales)
          )
        );
        const rate = Math.max(
          0,
          Math.min(
            100,
            body.commissionRate ?? po.commissionRate ?? po.supplier.defaultCommissionRate ?? 10
          )
        );
        const { commissionAmount, farmerNetAmount } = calcCommission(saleAmount, rate);
        data = {
          status: PurchaseOrderStatus.PAID,
          paidAt: now,
          paymentRef: body.paymentRef || `PAY-${po.poNumber}`,
          paymentMethod: body.paymentMethod || "MTN_MOMO",
          saleAmount,
          commissionRate: rate,
          commissionAmount,
          farmerNetAmount,
          totalAmount: farmerNetAmount,
        };
        notifyTitle = "Commission payment sent";
        notifyBody = `PO ${po.poNumber}: Paid. Sale ${saleAmount.toLocaleString()} RWF − commission ${commissionAmount.toLocaleString()} RWF (${rate}%) = ${farmerNetAmount.toLocaleString()} RWF to you. Ref ${data.paymentRef}.`;
      } else {
        data = {
          status: PurchaseOrderStatus.PAID,
          paidAt: now,
          paymentRef: body.paymentRef || `PAY-${po.poNumber}`,
          paymentMethod: body.paymentMethod || "MTN_MOMO",
          farmerNetAmount: po.totalAmount,
        };
        notifyTitle = "Payment sent";
        notifyBody = `PO ${po.poNumber}: Youth Huza paid ${po.totalAmount.toLocaleString()} RWF. Ref ${data.paymentRef}.`;
      }
      break;
    }
    case "cancel":
      data = { status: PurchaseOrderStatus.CANCELLED, notes: body.notes || po.notes };
      notifyTitle = "Purchase order cancelled";
      notifyBody = `PO ${po.poNumber} was cancelled.`;
      break;
    default:
      return NextResponse.json({ error: "Invalid PO action" }, { status: 400 });
  }

  const updated = await prisma.purchaseOrder.update({
    where: { id: body.poId },
    data,
  });

  await prisma.notification.create({
    data: {
      userId: po.supplier.userId,
      type: "SUPPLIER_STATUS",
      channel: "IN_APP",
      title: notifyTitle,
      body: notifyBody,
    },
  });

  await auditAdminAction(req, session, {
    action: `po.${body.poAction}`,
    entity: "PurchaseOrder",
    entityId: body.poId,
    details: JSON.stringify(data),
  });

  return NextResponse.json(updated);
}

export async function POST(req: Request) {
  const session = await requireAdminSession({
    modules: ["purchase_orders", "purchase_requests"],
  });
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const {
    supplierId,
    offerId,
    productName,
    quantity,
    unit,
    negotiatedPrice,
    retailPrice,
    notes,
    dealType,
    commissionRate,
  } = body as {
    supplierId: string;
    offerId?: string;
    productName: string;
    quantity: number;
    unit?: UnitType;
    negotiatedPrice: number;
    retailPrice?: number;
    notes?: string;
    dealType?: "OUTRIGHT_BUY" | "COMMISSION";
    commissionRate?: number;
  };

  if (!supplierId || !productName || !quantity || negotiatedPrice == null) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const deal =
    dealType === "COMMISSION"
      ? ProcurementDealType.COMMISSION
      : ProcurementDealType.OUTRIGHT_BUY;

  const po = await prisma.purchaseOrder.create({
    data: {
      poNumber: poNumber(),
      supplierId,
      offerId: offerId || null,
      status: PurchaseOrderStatus.DRAFT,
      dealType: deal,
      productName,
      unit: (unit as UnitType) || UnitType.KG,
      quantity,
      negotiatedPrice,
      totalAmount:
        deal === ProcurementDealType.COMMISSION
          ? 0
          : Math.round(negotiatedPrice * quantity),
      retailPrice: retailPrice || null,
      commissionRate:
        deal === ProcurementDealType.COMMISSION
          ? commissionRate ?? 10
          : null,
      notes: notes || null,
      createdById: session.user.id,
    },
  });

  await auditAdminAction(req, session, {
    action: "po.create",
    entity: "PurchaseOrder",
    entityId: po.id,
    details: po.poNumber,
  });

  return NextResponse.json(po);
}
