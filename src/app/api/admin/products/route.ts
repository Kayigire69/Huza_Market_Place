import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminPortalRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { auditAdminAction } from "@/lib/audit";
import { stockService } from "@/services/stock.service";
import { cacheDel, CacheKeys } from "@/lib/redis";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (!isAdminPortalRole(session.user.role) && session.user.role !== "PROCUREMENT")) {
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
    if (action === "approve") {
      const storefrontCount = await prisma.productImage.count({
        where: { productId: id, kind: "STOREFRONT" },
      });
      if (storefrontCount === 0) {
        return NextResponse.json(
          {
            error:
              "Upload at least one HUZA storefront image before publishing. Farmer photos are for inspection only.",
          },
          { status: 400 }
        );
      }
    }

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

    await auditAdminAction(req, session, {
      action: `product.${action}`,
      entity: "Product",
      entityId: id,
      details: note || action,
      before: {
        reviewStatus: existing.reviewStatus,
        isActive: existing.isActive,
        price: existing.price,
      },
      after: {
        reviewStatus: product.reviewStatus,
        isActive: product.isActive,
        price: product.price,
        reviewNote: product.reviewNote,
      },
    });

    await cacheDel(CacheKeys.homeCatalog);
    return NextResponse.json(product);
  }

  // --- Set / replace customer-facing HUZA images ---
  if (action === "set_storefront_images") {
    const imageUrls = Array.isArray(body.imageUrls)
      ? (body.imageUrls as unknown[]).map(String).map((u) => u.trim()).filter(Boolean)
      : [];
    if (imageUrls.length === 0) {
      return NextResponse.json({ error: "Upload at least one storefront image" }, { status: 400 });
    }
    const coverIndex = Math.max(0, Math.min(Number(body.coverIndex) || 0, imageUrls.length - 1));
    await prisma.$transaction([
      prisma.productImage.deleteMany({ where: { productId: id, kind: "STOREFRONT" } }),
      prisma.productImage.createMany({
        data: imageUrls.map((url, i) => ({
          productId: id,
          url,
          alt: `${existing.nameEn} ${i + 1}`,
          sortOrder: i,
          kind: "STOREFRONT",
          isCover: i === coverIndex,
        })),
      }),
    ]);
    await auditAdminAction(req, session, {
      action: "product.set_storefront_images",
      entity: "Product",
      entityId: id,
      details: `${existing.nameEn}: ${imageUrls.length} storefront image(s)`,
    });
    await cacheDel(CacheKeys.homeCatalog);
    const product = await prisma.product.findUnique({
      where: { id },
      include: { images: { orderBy: [{ kind: "asc" }, { sortOrder: "asc" }] } },
    });
    return NextResponse.json(product);
  }

  // --- Promote farmer inspection photos into storefront (temporary draft) ---
  if (action === "promote_inspection_images") {
    const inspection = await prisma.productImage.findMany({
      where: { productId: id, kind: "INSPECTION" },
      orderBy: { sortOrder: "asc" },
    });
    if (inspection.length === 0) {
      return NextResponse.json({ error: "No farmer inspection photos to copy" }, { status: 400 });
    }
    await prisma.$transaction([
      prisma.productImage.deleteMany({ where: { productId: id, kind: "STOREFRONT" } }),
      prisma.productImage.createMany({
        data: inspection.map((img, i) => ({
          productId: id,
          url: img.url,
          alt: img.alt || `${existing.nameEn} ${i + 1}`,
          sortOrder: i,
          kind: "STOREFRONT",
          isCover: i === 0,
        })),
      }),
    ]);
    await auditAdminAction(req, session, {
      action: "product.promote_inspection_images",
      entity: "Product",
      entityId: id,
      details: `${existing.nameEn}: copied ${inspection.length} inspection photo(s) to storefront (replace with HUZA photos when ready)`,
    });
    await cacheDel(CacheKeys.homeCatalog);
    const product = await prisma.product.findUnique({
      where: { id },
      include: { images: { orderBy: [{ kind: "asc" }, { sortOrder: "asc" }] } },
    });
    return NextResponse.json(product);
  }

  // --- Set cover image among storefront gallery ---
  if (action === "set_cover") {
    const imageId = String(body.imageId || "");
    if (!imageId) return NextResponse.json({ error: "imageId required" }, { status: 400 });
    const img = await prisma.productImage.findFirst({
      where: { id: imageId, productId: id, kind: "STOREFRONT" },
    });
    if (!img) return NextResponse.json({ error: "Storefront image not found" }, { status: 404 });
    await prisma.$transaction([
      prisma.productImage.updateMany({
        where: { productId: id, kind: "STOREFRONT" },
        data: { isCover: false },
      }),
      prisma.productImage.update({ where: { id: imageId }, data: { isCover: true } }),
    ]);
    await cacheDel(CacheKeys.homeCatalog);
    return NextResponse.json({ ok: true });
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
    await auditAdminAction(req, session, {
      action: "product.update_price",
      entity: "Product",
      entityId: id,
      details: `${existing.nameEn}: ${existing.price} → ${product.price} RWF`,
      before: { price: existing.price, name: existing.nameEn },
      after: { price: product.price, name: product.nameEn },
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

      await auditAdminAction(req, session, {
        action: `product.${action}`,
        entity: "Product",
        entityId: id,
        details: `${existing.nameEn}: ${quantity} · ${reason}`,
        before: { stockQty: existing.stockQty },
        after: { stockQty: product.stockQty, quantity, reason },
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
    if (body.isActive === true) {
      const storefrontCount = await prisma.productImage.count({
        where: { productId: id, kind: "STOREFRONT" },
      });
      if (storefrontCount === 0) {
        return NextResponse.json(
          { error: "Add at least one HUZA storefront image before activating on the shop" },
          { status: 400 }
        );
      }
    }
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(body.isFeatured !== undefined ? { isFeatured: Boolean(body.isFeatured) } : {}),
        ...(body.isBestSeller !== undefined ? { isBestSeller: Boolean(body.isBestSeller) } : {}),
        ...(body.isActive !== undefined ? { isActive: Boolean(body.isActive) } : {}),
      },
    });
    await auditAdminAction(req, session, {
      action: "product.update_flags",
      entity: "Product",
      entityId: id,
      details: `${existing.nameEn} flags updated`,
      before: {
        isFeatured: existing.isFeatured,
        isBestSeller: existing.isBestSeller,
        isActive: existing.isActive,
      },
      after: {
        isFeatured: product.isFeatured,
        isBestSeller: product.isBestSeller,
        isActive: product.isActive,
      },
    });
    await cacheDel(CacheKeys.homeCatalog);
    return NextResponse.json(product);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
