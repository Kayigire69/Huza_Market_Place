import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { OfferStatus, UnitType } from "@prisma/client";

/**
 * Admin procurement actions on supplier offers:
 * accept | reject | purchase
 * purchase = Huza buys stock and creates/updates Huza inventory product
 */
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { offerId, action, adminNote, retailPrice, purchasedQty } = body as {
    offerId: string;
    action: "accept" | "reject" | "purchase";
    adminNote?: string;
    retailPrice?: number;
    purchasedQty?: number;
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
    await writeAuditLog({
      actorId: session.user.id,
      actorName: session.user.name,
      action: `offer.${action}`,
      entity: "SupplierOffer",
      entityId: offerId,
      details: adminNote || status,
    });
    return NextResponse.json(updated);
  }

  if (action === "purchase") {
    const qty = purchasedQty ?? offer.quantityOffered;
    const sellPrice = retailPrice ?? offer.suggestedRetail ?? Math.round(offer.askPrice * 1.25);
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
          `Sourced by Youth Huza from ${offer.supplier.businessName}. Sold by HUZA MARKETPLACE.`,
        descriptionFr:
          offer.description ||
          `Approvisionné par Youth Huza auprès de ${offer.supplier.businessName}.`,
        descriptionRw:
          offer.description ||
          `Byaguzwe na Youth Huza kuri ${offer.supplier.businessName}.`,
        price: sellPrice,
        unit: offer.unit as UnitType,
        stockQty: Math.floor(qty),
        isNewArrival: true,
        isActive: true,
        location: offer.supplier.location,
        availableDistricts:
          offer.availableDistricts.length > 0
            ? offer.availableDistricts
            : [offer.supplier.district],
        images: {
          create: [{ url: "/images/products/mushroom.svg", alt: offer.title }],
        },
        stockLogs: {
          create: {
            change: Math.floor(qty),
            reason: `Purchased from supplier offer ${offer.id}`,
          },
        },
      },
    });

    const updated = await prisma.supplierOffer.update({
      where: { id: offerId },
      data: {
        status: OfferStatus.PURCHASED,
        purchasedQty: qty,
        productId: product.id,
        adminNote: adminNote || `Purchased into Huza inventory at retail ${sellPrice} RWF`,
      },
    });

    await prisma.notification.create({
      data: {
        userId: offer.supplier.userId,
        type: "SUPPLIER_STATUS",
        channel: "IN_APP",
        title: "Youth Huza purchased your offer",
        body: `Huza bought ${qty} ${offer.unit.toLowerCase()} of ${offer.title} at ${offer.askPrice} RWF/${offer.unit.toLowerCase()}.`,
      },
    });

    await writeAuditLog({
      actorId: session.user.id,
      actorName: session.user.name,
      action: "offer.purchase",
      entity: "SupplierOffer",
      entityId: offerId,
      details: `Created product ${product.id}; qty ${qty}; retail ${sellPrice}`,
    });

    return NextResponse.json({ offer: updated, product });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
