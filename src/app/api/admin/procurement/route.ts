import { NextResponse } from "next/server";
import { getServerSession, type Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminPortalRole } from "@/lib/rbac";
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
function canProcure(role?: string) {
  return role === "ADMIN" || role === "SUPER_ADMIN" || role === "PROCUREMENT";
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !canProcure(session.user.role)) {
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
        unit: offer.unit as UnitType,
        stockQty: Math.floor(qty),
        isNewArrival: true,
        isActive: true,
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
        // Placeholder image — replace with professional HUZA photos in Catalog before featuring
        reviewStatus: "APPROVED",
        reviewNote: "Created from procurement — replace placeholder image with HUZA photos",
      },
    });

    // Automatic stock ledger (RECEIVE) when Huza purchases into inventory
    await prisma.stockHistory.create({
      data: {
        productId: product.id,
        change: Math.floor(qty),
        reason: `Purchased from farmer offer ${offer.id}`,
      },
    });
    await prisma.stockMovement.create({
      data: {
        productId: product.id,
        type: "RECEIVE",
        quantity: Math.floor(qty),
        reason: `Purchased from farmer offer ${offer.id}`,
        actorId: session.user.id,
      },
    });

    const totalAmount = Math.round(unitPrice * qty);
    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        poNumber: poNumber(),
        supplierId: offer.supplierId,
        offerId: offer.id,
        status: PurchaseOrderStatus.ACCEPTED,
        productName: offer.title,
        category: offer.categoryId || null,
        unit: offer.unit as UnitType,
        quantity: qty,
        negotiatedPrice: unitPrice,
        totalAmount,
        retailPrice: sellPrice,
        orderedAt: new Date(),
        receivedAt: new Date(),
        inspectedAt: new Date(),
        notes: adminNote || null,
        productId: product.id,
        createdById: session.user.id,
        qualityNotes: "Accepted into Huza inventory on purchase",
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
          `PO ${purchaseOrder.poNumber}: purchased at ${unitPrice} RWF; retail ${sellPrice} RWF`,
      },
    });

    await prisma.notification.create({
      data: {
        userId: offer.supplier.userId,
        type: "SUPPLIER_STATUS",
        channel: "IN_APP",
        title: "Youth Huza purchased your offer",
        body: `PO ${purchaseOrder.poNumber}: Huza bought ${qty} ${offer.unit.toLowerCase()} of ${offer.title} at ${unitPrice} RWF/${offer.unit.toLowerCase()}.`,
      },
    });

    await auditAdminAction(req, session, {
      action: "offer.purchase",
      entity: "PurchaseOrder",
      entityId: purchaseOrder.id,
      details: `PO ${purchaseOrder.poNumber}; product ${product.id}; qty ${qty}; wholesale ${unitPrice}; retail ${sellPrice}`,
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
    paymentRef?: string;
    paymentMethod?: string;
    notes?: string;
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
    case "receive":
      data = {
        status: PurchaseOrderStatus.RECEIVED,
        receivedAt: now,
        notes: body.notes || po.notes,
      };
      // Auto stock-in only when first receiving (not already in warehouse from purchase)
      if (
        po.productId &&
        po.quantity > 0 &&
        po.status !== PurchaseOrderStatus.RECEIVED &&
        po.status !== PurchaseOrderStatus.ACCEPTED &&
        po.status !== PurchaseOrderStatus.PAID
      ) {
        const { stockService } = await import("@/services/stock.service");
        await stockService.stockIn(
          po.productId,
          Math.floor(po.quantity),
          `PO ${po.poNumber} received into warehouse`,
          session.user.id,
          "RECEIVE"
        );
      }
      break;
    case "inspect_accept":
      data = {
        status: PurchaseOrderStatus.ACCEPTED,
        inspectedAt: now,
        qualityNotes: body.qualityNotes || "Quality accepted",
      };
      break;
    case "inspect_reject":
      data = {
        status: PurchaseOrderStatus.REJECTED,
        inspectedAt: now,
        rejectionReason: body.rejectionReason || "Quality rejected",
        qualityNotes: body.qualityNotes || null,
      };
      if (po.productId) {
        await prisma.product.update({
          where: { id: po.productId },
          data: { isActive: false, stockQty: 0 },
        });
      }
      break;
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
  const session = await getServerSession(authOptions);
  if (!session?.user || !canProcure(session.user.role)) {
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
