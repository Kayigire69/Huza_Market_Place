import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { stockService } from "@/services/stock.service";
import { cacheDel, CacheKeys } from "@/lib/redis";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "PROCUREMENT")) {
    return null;
  }
  return session;
}

/** List catalog products for admin price & stock management */
export async function GET(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") || "pending";

  if (mode === "catalog") {
    const products = await prisma.product.findMany({
      where: { deletedAt: null },
      include: {
        category: true,
        supplier: { select: { id: true, businessName: true, farmingType: true } },
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
      },
      orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
      take: 120,
    });
    return NextResponse.json(products);
  }

  const products = await prisma.product.findMany({
    where: { reviewStatus: "PENDING", isActive: false },
    include: {
      supplier: true,
      category: true,
      images: { orderBy: { sortOrder: "asc" }, take: 4 },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json(products);
}

export async function PATCH(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { id, action, note } = body as {
    id?: string;
    action?: string;
    note?: string;
    price?: number;
    quantity?: number;
    reason?: string;
    isFeatured?: boolean;
    isBestSeller?: boolean;
    isActive?: boolean;
  };

  if (!id || !action) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // --- Review approve / reject ---
  if (action === "approve" || action === "reject") {
    const product = await prisma.product.update({
      where: { id },
      data: {
        reviewStatus: action === "approve" ? "APPROVED" : "REJECTED",
        reviewNote: note || null,
        reviewedAt: new Date(),
        ...(action === "approve"
          ? {
              isActive: true,
              isNewArrival: true,
              isFeatured: true,
            }
          : {
              isActive: false,
              isFeatured: false,
            }),
      },
      include: { supplier: true, images: true },
    });

    // Auto stock-in when approving a product with no inventory yet
    if (action === "approve" && existing.stockQty <= 0) {
      await stockService.stockIn(
        id,
        1,
        "Initial stock on product approval (admin)",
        session.user.id,
        "RECEIVE"
      );
    }

    await prisma.notification.create({
      data: {
        userId: product.supplier.userId,
        type: "SUPPLIER_STATUS",
        channel: "IN_APP",
        title: action === "approve" ? "Product accepted by Huza" : "Product rejected by Huza",
        body:
          action === "approve"
            ? `${product.nameEn} was accepted and may be sold on HUZA FRESH.`
            : `${product.nameEn} was rejected. ${note || "See admin notes."}`,
      },
    });

    await writeAuditLog({
      actorId: session.user.id,
      actorName: session.user.name,
      action: `product.${action}`,
      entity: "Product",
      entityId: id,
      details: note || action,
    });

    await cacheDel(CacheKeys.homeCatalog);
    return NextResponse.json(product);
  }

  // --- Admin sets retail price ---
  if (action === "update_price") {
    const price = Number(body.price);
    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json({ error: "Invalid price" }, { status: 400 });
    }
    const product = await prisma.product.update({
      where: { id },
      data: { price: Math.round(price) },
    });
    await writeAuditLog({
      actorId: session.user.id,
      actorName: session.user.name,
      action: "product.update_price",
      entity: "Product",
      entityId: id,
      details: `${existing.price} → ${product.price} RWF`,
    });
    await cacheDel(CacheKeys.homeCatalog);
    return NextResponse.json(product);
  }

  // --- Manual stock in / out (also writes automatic ledger rows) ---
  if (action === "stock_in" || action === "stock_out") {
    const quantity = Math.abs(Number(body.quantity));
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return NextResponse.json({ error: "Enter a positive quantity" }, { status: 400 });
    }
    const reason =
      (typeof body.reason === "string" && body.reason.trim()) ||
      (action === "stock_in" ? "Admin stock in" : "Admin stock out");

    try {
      const product =
        action === "stock_in"
          ? await stockService.stockIn(id, quantity, reason, session.user.id, "RECEIVE")
          : await stockService.stockOut(id, quantity, reason, session.user.id, "ADJUST");

      await writeAuditLog({
        actorId: session.user.id,
        actorName: session.user.name,
        action: `product.${action}`,
        entity: "Product",
        entityId: id,
        details: `${quantity} · ${reason}`,
      });
      await cacheDel(CacheKeys.homeCatalog);
      return NextResponse.json(product);
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Stock update failed" },
        { status: 400 }
      );
    }
  }

  // --- Flags ---
  if (action === "update_flags") {
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(body.isFeatured !== undefined ? { isFeatured: Boolean(body.isFeatured) } : {}),
        ...(body.isBestSeller !== undefined ? { isBestSeller: Boolean(body.isBestSeller) } : {}),
        ...(body.isActive !== undefined ? { isActive: Boolean(body.isActive) } : {}),
      },
    });
    await writeAuditLog({
      actorId: session.user.id,
      actorName: session.user.name,
      action: "product.update_flags",
      entity: "Product",
      entityId: id,
      details: JSON.stringify({
        isFeatured: body.isFeatured,
        isBestSeller: body.isBestSeller,
        isActive: body.isActive,
      }),
    });
    await cacheDel(CacheKeys.homeCatalog);
    return NextResponse.json(product);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
