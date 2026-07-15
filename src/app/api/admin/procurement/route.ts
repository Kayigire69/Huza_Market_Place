import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { requireAdminSession } from "@/lib/rbac-server";
import { prisma } from "@/lib/prisma";
import { auditAdminAction } from "@/lib/audit";
import { OfferStatus, PurchaseOrderStatus, UnitType } from "@prisma/client";

function poNumber() {
  const n = Date.now().toString(36).toUpperCase();
  return `PO-${n.slice(-8)}`;
}

/**
 * Admin procurement:
 * - offer actions: accept | reject | purchase (creates PO + inventory)
 * - PO actions: receive | inspect_accept | inspect_reject | pay | cancel
 */

export async function GET(req: Request) {
  const session = await requireAdminSession({
    modules: ["purchase_requests", "purchase_orders", "goods_received", "farmers"],
  });
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const view = searchParams.get("view") || "requests";

  if (view === "requests") {
    const offers = await prisma.supplierOffer.findMany({
      where: { status: { in: ["PENDING", "ACCEPTED"] } },
      include: { supplier: { select: { businessName: true } }, category: true },
      orderBy: { createdAt: "desc" },
      take: 80,
    });
    return NextResponse.json({ offers, purchaseOrders: [] });
  }

  if (view === "received") {
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: { status: { in: ["RECEIVED", "INSPECTED", "ACCEPTED", "PAID"] } },
      include: {
        supplier: { select: { businessName: true } },
        offer: { select: { title: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 80,
    });
    return NextResponse.json({ offers: [], purchaseOrders });
  }

  // Active POs awaiting receive / inspect / pay
  const purchaseOrders = await prisma.purchaseOrder.findMany({
    where: { status: { in: ["DRAFT", "ORDERED", "RECEIVED", "INSPECTED"] } },
    include: {
      supplier: { select: { businessName: true } },
      offer: { select: { title: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 80,
  });
  return NextResponse.json({ offers: [], purchaseOrders });
}

export async function PATCH(req: Request) {
  const session = await requireAdminSession({
    modules: ["purchase_requests", "purchase_orders", "goods_received"],
  });
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  if (body.poId && body.poAction) {
    return handlePoAction(req, session, body);
  }

  const { offerId, action, adminNote, retailPrice, purchasedQty, negotiatedPrice } = body as {
    offerId: string;
    action: "accept" | "reject" | "purchase";
    adminNote?: string;
    retailPrice?: number;
    purchasedQty?: number;
    negotiatedPrice?: number;
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
    const unitPrice = negotiatedPrice ?? offer.askPrice;
    const sellPrice = retailPrice ?? offer.suggestedRetail ?? Math.round(unitPrice * 1.25);
    const categoryId =
      offer.categoryId ||
      (await prisma.category.findFirst({ orderBy: { sortOrder: "asc" } }))?.id;

    if (!categoryId) {
      return NextResponse.json({ error: "No category available" }, { status: 400 });
    }

    // Draft product: not sold on the shop until goods are received & quality-checked
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
        purchasePrice: unitPrice,
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
        reviewNote: "From procurement — awaiting delivery & QC before shop publish",
      },
    });

    const totalAmount = Math.round(unitPrice * qty);
    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        poNumber: poNumber(),
        supplierId: offer.supplierId,
        offerId: offer.id,
        status: PurchaseOrderStatus.ORDERED,
        productName: offer.title,
        category: offer.categoryId || null,
        unit: offer.unit as UnitType,
        quantity: qty,
        negotiatedPrice: unitPrice,
        totalAmount,
        retailPrice: sellPrice,
        orderedAt: new Date(),
        notes: adminNote || null,
        productId: product.id,
        createdById: session.user.id,
      },
    });

    const updated = await prisma.supplierOffer.update({
      where: { id: offerId },
      data: {
        status: OfferStatus.PURCHASED,
        purchasedQty: qty,
        productId: product.id,
        adminNote:
          adminNote ||
          `PO ${purchaseOrder.poNumber}: ordered at ${unitPrice} RWF; retail ${sellPrice} RWF — awaiting delivery`,
      },
    });

    await prisma.notification.create({
      data: {
        userId: offer.supplier.userId,
        type: "SUPPLIER_STATUS",
        channel: "IN_APP",
        title: "Youth Huza created a purchase order",
        body: `PO ${purchaseOrder.poNumber}: Huza ordered ${qty} ${offer.unit.toLowerCase()} of ${offer.title} at ${unitPrice} RWF/${offer.unit.toLowerCase()}. Please deliver for inspection.`,
      },
    });

    await auditAdminAction(req, session, {
      action: "offer.purchase",
      entity: "PurchaseOrder",
      entityId: purchaseOrder.id,
      details: `PO ${purchaseOrder.poNumber}; product ${product.id}; qty ${qty}; wholesale ${unitPrice}; retail ${sellPrice}; status ORDERED`,
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
  }
) {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: body.poId },
    include: { supplier: true },
  });
  if (!po) return NextResponse.json({ error: "PO not found" }, { status: 404 });

  const now = new Date();
  let data: Record<string, unknown> = {};

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
        // Keep off the shop until quality inspection passes
        await prisma.product.update({
          where: { id: po.productId },
          data: { isActive: false },
        });
        // Track batch for juices/salads expiry workflows
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
          },
        });
        const { cacheDel, CacheKeys } = await import("@/lib/redis");
        await cacheDel(CacheKeys.homeCatalog);
      }
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
      break;
    }
    case "pay":
      data = {
        status: PurchaseOrderStatus.PAID,
        paidAt: now,
        paymentRef: body.paymentRef || `PAY-${po.poNumber}`,
        paymentMethod: body.paymentMethod || "MTN_MOMO",
      };
      break;
    case "cancel":
      data = { status: PurchaseOrderStatus.CANCELLED, notes: body.notes || po.notes };
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
      title: `Purchase order ${updated.status}`,
      body: `PO ${po.poNumber} is now ${updated.status}.`,
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
  } = body as {
    supplierId: string;
    offerId?: string;
    productName: string;
    quantity: number;
    unit?: UnitType;
    negotiatedPrice: number;
    retailPrice?: number;
    notes?: string;
  };

  if (!supplierId || !productName || !quantity || !negotiatedPrice) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const po = await prisma.purchaseOrder.create({
    data: {
      poNumber: poNumber(),
      supplierId,
      offerId: offerId || null,
      status: PurchaseOrderStatus.DRAFT,
      productName,
      unit: (unit as UnitType) || UnitType.KG,
      quantity,
      negotiatedPrice,
      totalAmount: Math.round(negotiatedPrice * quantity),
      retailPrice: retailPrice || null,
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
