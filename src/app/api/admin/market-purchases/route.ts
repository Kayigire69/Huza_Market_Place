import { NextResponse } from "next/server";
import { MarketPurchaseStatus, UnitType } from "@prisma/client";
import { requireAdminSession } from "@/lib/rbac-server";
import { prisma } from "@/lib/prisma";
import { auditAdminAction } from "@/lib/audit";
import { ensureMarketDeskSupplier, marketPurchaseNumber } from "@/lib/market-desk";
import { normalizeQualityGrade } from "@/lib/inventory-meta";

const UNIT_TYPES: UnitType[] = ["KG", "PIECE", "BUNCH", "LITRE", "PACK", "DOZEN"];

function parseUnit(raw: unknown): UnitType {
  const s = String(raw || "KG")
    .trim()
    .toUpperCase()
    .replace(/S$/, "");
  return UNIT_TYPES.includes(s as UnitType) ? (s as UnitType) : "KG";
}

async function requireMarketAdmin() {
  return requireAdminSession({
    modules: ["market_procurement", "purchase_orders", "goods_received", "farmers"],
  });
}

/** List / create market (wholesale) purchases — separate from farmer POs. */
export async function GET(req: Request) {
  const session = await requireMarketAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "";

  const purchases = await prisma.marketPurchase.findMany({
    where: status
      ? { status: status as MarketPurchaseStatus }
      : { status: { not: MarketPurchaseStatus.CANCELLED } },
    orderBy: { purchaseDate: "desc" },
    take: 100,
    include: {
      product: {
        select: {
          id: true,
          nameEn: true,
          stockQty: true,
          isActive: true,
          qualityGrade: true,
          inventorySource: true,
          purchaseMethod: true,
        },
      },
    },
  });

  const [recorded, inspected, stocked] = await Promise.all([
    prisma.marketPurchase.count({ where: { status: MarketPurchaseStatus.RECORDED } }),
    prisma.marketPurchase.count({ where: { status: MarketPurchaseStatus.INSPECTED } }),
    prisma.marketPurchase.count({ where: { status: MarketPurchaseStatus.STOCKED } }),
  ]);

  return NextResponse.json({
    purchases: purchases.map((p) => ({
      ...p,
      purchaseDate: p.purchaseDate.toISOString(),
      inspectedAt: p.inspectedAt?.toISOString() ?? null,
      stockedAt: p.stockedAt?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    })),
    counts: { recorded, inspected, stocked },
  });
}

export async function POST(req: Request) {
  const session = await requireMarketAdmin();
  if (!session?.user?.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const marketName = String(body.marketName || "").trim();
  const vendorName = String(body.vendorName || "").trim();
  const productName = String(body.productName || "").trim();
  const quantity = Number(body.quantity);
  const unitPrice = Math.round(Number(body.unitPrice));
  const purchaseDate = body.purchaseDate ? new Date(String(body.purchaseDate)) : new Date();

  if (!marketName || !vendorName || !productName) {
    return NextResponse.json(
      { error: "marketName, vendorName, and productName are required" },
      { status: 400 }
    );
  }
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return NextResponse.json({ error: "Valid quantity required" }, { status: 400 });
  }
  if (!Number.isFinite(unitPrice) || unitPrice < 0) {
    return NextResponse.json({ error: "Valid unitPrice required" }, { status: 400 });
  }
  if (Number.isNaN(purchaseDate.getTime())) {
    return NextResponse.json({ error: "Invalid purchaseDate" }, { status: 400 });
  }

  const unit = parseUnit(body.unit);
  const retailPrice =
    body.retailPrice != null && body.retailPrice !== ""
      ? Math.round(Number(body.retailPrice))
      : Math.round(unitPrice * 1.25);
  const totalAmount = Math.round(unitPrice * quantity);
  const photoUrls = Array.isArray(body.photoUrls)
    ? body.photoUrls.map(String).filter(Boolean).slice(0, 12)
    : [];

  const purchase = await prisma.marketPurchase.create({
    data: {
      purchaseNumber: marketPurchaseNumber(),
      marketName,
      vendorName,
      purchaseDate,
      productName,
      category: body.category ? String(body.category).trim() : null,
      unit,
      quantity,
      unitPrice,
      totalAmount,
      retailPrice: Number.isFinite(retailPrice) ? retailPrice : null,
      qualityGrade: body.qualityGrade ? String(body.qualityGrade).trim() : null,
      inspectionNotes: body.inspectionNotes ? String(body.inspectionNotes).trim() : null,
      photoUrls,
      notes: body.notes ? String(body.notes).trim() : null,
      createdById: session.user.id,
      status: MarketPurchaseStatus.RECORDED,
    },
  });

  await auditAdminAction(req, session, {
    action: "market_purchase.create",
    entity: "MarketPurchase",
    entityId: purchase.id,
    details: `${purchase.purchaseNumber}: ${marketName} / ${vendorName} — ${productName}`,
  });

  return NextResponse.json(purchase);
}

export async function PATCH(req: Request) {
  const session = await requireMarketAdmin();
  if (!session?.user?.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { id, action } = body as { id?: string; action?: string };
  if (!id || !action) {
    return NextResponse.json({ error: "id and action required" }, { status: 400 });
  }

  const purchase = await prisma.marketPurchase.findUnique({ where: { id } });
  if (!purchase) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "inspect") {
    const grade = normalizeQualityGrade(body.qualityGrade) || normalizeQualityGrade(purchase.qualityGrade);
    if (!grade) {
      return NextResponse.json(
        { error: "Quality grade (1 / 2 / 3) is required before inspection can be saved" },
        { status: 400 }
      );
    }
    const updated = await prisma.marketPurchase.update({
      where: { id },
      data: {
        status: MarketPurchaseStatus.INSPECTED,
        inspectedAt: new Date(),
        qualityGrade: grade,
        inspectionNotes: body.inspectionNotes
          ? String(body.inspectionNotes).trim()
          : purchase.inspectionNotes,
        photoUrls: Array.isArray(body.photoUrls)
          ? body.photoUrls.map(String).filter(Boolean).slice(0, 12)
          : purchase.photoUrls,
      },
    });
    await auditAdminAction(req, session, {
      action: "market_purchase.inspect",
      entity: "MarketPurchase",
      entityId: id,
      details: `grade ${grade}`,
    });
    return NextResponse.json(updated);
  }

  if (action === "stock") {
    if (purchase.status === MarketPurchaseStatus.STOCKED && purchase.productId) {
      return NextResponse.json({ error: "Already stocked", productId: purchase.productId }, { status: 400 });
    }
    if (purchase.status === MarketPurchaseStatus.CANCELLED) {
      return NextResponse.json({ error: "Cancelled purchase cannot be stocked" }, { status: 400 });
    }
    if (purchase.status !== MarketPurchaseStatus.INSPECTED) {
      return NextResponse.json(
        { error: "Inspect and grade this purchase before stocking to inventory" },
        { status: 400 }
      );
    }
    const grade = normalizeQualityGrade(purchase.qualityGrade);
    if (!grade) {
      return NextResponse.json(
        { error: "Quality grade is required — re-inspect with grade 1 / 2 / 3" },
        { status: 400 }
      );
    }

    const desk = await ensureMarketDeskSupplier();
    const categoryId =
      (body.categoryId ? String(body.categoryId) : null) ||
      (await prisma.category.findFirst({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }))
        ?.id;
    if (!categoryId) {
      return NextResponse.json({ error: "No category available" }, { status: 400 });
    }

    const sellPrice =
      purchase.retailPrice ?? Math.round(purchase.unitPrice * 1.25);
    const qty = Math.max(1, Math.floor(purchase.quantity));

    const product = await prisma.product.create({
      data: {
        supplierId: desk.id,
        categoryId,
        nameEn: purchase.productName,
        nameFr: purchase.productName,
        nameRw: purchase.productName,
        descriptionEn: `Market purchase from ${purchase.marketName} (${purchase.vendorName}).`,
        descriptionFr: `Achat marché — ${purchase.marketName} (${purchase.vendorName}).`,
        descriptionRw: `Ibicuruzwa byaguzwe kuri ${purchase.marketName} (${purchase.vendorName}).`,
        price: sellPrice,
        purchasePrice: purchase.unitPrice,
        ownershipMode: "OWNED",
        inventorySource: "MARKET",
        purchaseMethod: "MARKET",
        qualityGrade: grade,
        unit: purchase.unit,
        stockQty: 0,
        isNewArrival: true,
        isActive: false,
        location: purchase.marketName,
        originDistrict: purchase.marketName,
        availableDistricts: ["Kigali"],
        reviewStatus: "APPROVED",
        reviewNote: `Market purchase ${purchase.purchaseNumber}`,
      },
    });

    const { stockService } = await import("@/services/stock.service");
    await stockService.stockIn(
      product.id,
      qty,
      `Market purchase ${purchase.purchaseNumber} stocked`,
      session.user.id,
      "RECEIVE"
    );

    const batchNumber = `B-${purchase.purchaseNumber}-${Date.now().toString(36).toUpperCase().slice(-4)}`;
    await prisma.stockBatch.create({
      data: {
        productId: product.id,
        batchNumber,
        quantity: qty,
        qualityGrade: grade,
        notes: `${purchase.marketName} · ${purchase.vendorName} · Grade ${grade}`,
        officialImageUrls: purchase.photoUrls,
      },
    });

    if (purchase.photoUrls.length) {
      await prisma.productImage.createMany({
        data: purchase.photoUrls.map((url, i) => ({
          productId: product.id,
          url,
          kind: "STOREFRONT" as const,
          isCover: i === 0,
          sortOrder: i,
        })),
      });
      await prisma.product.update({
        where: { id: product.id },
        data: { isActive: true },
      });
    }

    const updated = await prisma.marketPurchase.update({
      where: { id },
      data: {
        status: MarketPurchaseStatus.STOCKED,
        stockedAt: new Date(),
        productId: product.id,
        inspectedAt: purchase.inspectedAt || new Date(),
      },
    });

    await auditAdminAction(req, session, {
      action: "market_purchase.stock",
      entity: "MarketPurchase",
      entityId: id,
      details: `product ${product.id}; qty ${qty}`,
    });

    return NextResponse.json({ purchase: updated, product });
  }

  if (action === "cancel") {
    if (purchase.status === MarketPurchaseStatus.STOCKED) {
      return NextResponse.json({ error: "Cannot cancel a stocked purchase" }, { status: 400 });
    }
    const updated = await prisma.marketPurchase.update({
      where: { id },
      data: { status: MarketPurchaseStatus.CANCELLED },
    });
    await auditAdminAction(req, session, {
      action: "market_purchase.cancel",
      entity: "MarketPurchase",
      entityId: id,
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
