import { NextResponse } from "next/server";
import type { UnitType } from "@prisma/client";
import { requireAdminSession } from "@/lib/rbac-server";
import { prisma } from "@/lib/prisma";
import { auditAdminAction } from "@/lib/audit";
import { stockService } from "@/services/stock.service";
import { cacheDel, CacheKeys } from "@/lib/redis";

const UNIT_TYPES: UnitType[] = ["KG", "PIECE", "BUNCH", "LITRE", "PACK", "DOZEN"];

function parseUnitType(raw: unknown): UnitType {
  const s = String(raw || "KG")
    .trim()
    .toUpperCase()
    .replace(/S$/, "");
  const aliases: Record<string, UnitType> = {
    KG: "KG",
    KILO: "KG",
    KILOGRAM: "KG",
    PIECE: "PIECE",
    PC: "PIECE",
    BUNCH: "BUNCH",
    LITRE: "LITRE",
    LITER: "LITRE",
    L: "LITRE",
    PACK: "PACK",
    DOZEN: "DOZEN",
  };
  const mapped = aliases[s] || (UNIT_TYPES.includes(s as UnitType) ? (s as UnitType) : null);
  return mapped || "KG";
}

async function requireAdmin() {
  return requireAdminSession({
    modules: ["products", "approvals", "inventory", "purchase_orders"],
  });
}

/** List catalog products for admin price & stock management */
export async function GET(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") || "pending";
  const categoryId = searchParams.get("categoryId") || undefined;
  const q = searchParams.get("q")?.trim() || "";
  const filter = searchParams.get("filter") || "all"; // all | active | out | low | hidden | featured | bestseller
  const sort = searchParams.get("sort") || "name"; // name | price | stock

  if (mode === "by_category") {
    if (!categoryId) {
      return NextResponse.json({ error: "categoryId required" }, { status: 400 });
    }

    const statusWhere =
      filter === "active"
        ? { isActive: true }
        : filter === "hidden"
          ? { isActive: false }
          : filter === "featured"
            ? { isFeatured: true }
            : filter === "bestseller"
              ? { isBestSeller: true }
              : {};

    const products = await prisma.product.findMany({
      where: {
        deletedAt: null,
        categoryId,
        ...statusWhere,
        ...(q
          ? {
              OR: [
                { nameEn: { contains: q, mode: "insensitive" } },
                { nameFr: { contains: q, mode: "insensitive" } },
                { nameRw: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        nameEn: true,
        nameFr: true,
        nameRw: true,
        descriptionEn: true,
        price: true,
        unit: true,
        stockQty: true,
        reservedQty: true,
        lowStockAt: true,
        isActive: true,
        isFeatured: true,
        isBestSeller: true,
        isNewArrival: true,
        isOrganic: true,
        reviewStatus: true,
        categoryId: true,
        category: { select: { id: true, nameEn: true, slug: true } },
        images: {
          where: { kind: "STOREFRONT" },
          orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
          take: 5,
          select: { id: true, url: true, isCover: true, sortOrder: true },
        },
      },
      orderBy:
        sort === "price"
          ? { price: "asc" }
          : sort === "stock"
            ? { stockQty: "desc" }
            : { nameEn: "asc" },
      take: 300,
    });

    const filtered =
      filter === "out" || filter === "low"
        ? products.filter((p) => {
            const available = Math.max(0, p.stockQty - p.reservedQty);
            if (filter === "out") return available <= 0;
            return available > 0 && available <= (p.lowStockAt ?? 5);
          })
        : products;

    return NextResponse.json({ products: filtered });
  }

  if (mode === "catalog") {
    const products = await prisma.product.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        nameEn: true,
        price: true,
        unit: true,
        stockQty: true,
        reservedQty: true,
        isActive: true,
        isFeatured: true,
        isBestSeller: true,
        reviewStatus: true,
        updatedAt: true,
        category: { select: { id: true, nameEn: true, slug: true } },
        supplier: { select: { id: true, businessName: true, farmingType: true } },
        images: {
          orderBy: { sortOrder: "asc" },
          take: 1,
          select: { url: true },
        },
      },
      orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
      take: 120,
    });
    return NextResponse.json(products);
  }

  const products = await prisma.product.findMany({
    where: { reviewStatus: "PENDING", isActive: false },
    select: {
      id: true,
      nameEn: true,
      descriptionEn: true,
      price: true,
      unit: true,
      stockQty: true,
      isOrganic: true,
      reviewStatus: true,
      reviewNote: true,
      createdAt: true,
      supplier: {
        select: {
          id: true,
          businessName: true,
          district: true,
          phone: true,
          farmingType: true,
          user: { select: { fullName: true, phone: true } },
        },
      },
      category: { select: { id: true, nameEn: true, slug: true } },
      images: {
        orderBy: { sortOrder: "asc" },
        take: 4,
        select: { id: true, url: true, alt: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json(products);
}

/** Create a catalog product (admin) */
export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const nameEn = String(body.nameEn || "").trim();
  const categoryId = String(body.categoryId || "");
  const price = Math.round(Number(body.price));
  if (!nameEn || !categoryId) {
    return NextResponse.json({ error: "Name and category are required" }, { status: 400 });
  }
  if (!Number.isFinite(price) || price < 0) {
    return NextResponse.json({ error: "Invalid price" }, { status: 400 });
  }

  const category = await prisma.category.findFirst({
    where: { id: categoryId, deletedAt: null },
  });
  if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });

  // Prefer Youth Huza retail supplier if present; otherwise first approved supplier
  const supplier =
    (await prisma.supplier.findFirst({
      where: { status: "APPROVED", businessName: { contains: "Huza", mode: "insensitive" } },
    })) ||
    (await prisma.supplier.findFirst({ where: { status: "APPROVED" } }));
  if (!supplier) {
    return NextResponse.json(
      { error: "No approved supplier available to own this product" },
      { status: 400 }
    );
  }

  const stockQty = Math.max(0, Math.floor(Number(body.stockQty) || 0));
  const unit = parseUnitType(body.unit);

  const product = await prisma.product.create({
    data: {
      supplierId: supplier.id,
      categoryId,
      nameEn,
      nameFr: String(body.nameFr || nameEn).trim(),
      nameRw: String(body.nameRw || nameEn).trim(),
      descriptionEn: String(body.descriptionEn || body.description || "").trim() || nameEn,
      descriptionFr: String(body.descriptionFr || body.description || "").trim() || nameEn,
      descriptionRw: String(body.descriptionRw || body.description || "").trim() || nameEn,
      price,
      unit,
      stockQty,
      isActive: Boolean(body.isActive ?? true),
      isFeatured: Boolean(body.isFeatured ?? false),
      isBestSeller: Boolean(body.isBestSeller ?? false),
      isNewArrival: Boolean(body.isNewArrival ?? true),
      isOrganic: Boolean(body.isOrganic ?? false),
      reviewStatus: "APPROVED",
      reviewedAt: new Date(),
    },
    include: {
      category: { select: { id: true, nameEn: true, slug: true } },
      images: true,
    },
  });

  await auditAdminAction(req, session, {
    action: "product.create",
    entity: "Product",
    entityId: product.id,
    details: `${product.nameEn} · ${category.nameEn}`,
  });
  await cacheDel(CacheKeys.homeCatalog);
  return NextResponse.json(product, { status: 201 });
}

export async function PATCH(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { id, action, note, recommendation } = body as {
    id?: string;
    action?: string;
    note?: string;
    /** Actionable next step shown to the farmer after rejection */
    recommendation?: string;
    price?: number;
    quantity?: number;
    reason?: string;
    isFeatured?: boolean;
    isBestSeller?: boolean;
    isActive?: boolean;
  };

  if (!action) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Bulk ops don't need a single product id
  if (action === "bulk") {
    const ids = Array.isArray(body.ids) ? (body.ids as string[]).map(String) : [];
    const bulkAction = String(body.bulkAction || "");
    if (!ids.length || !bulkAction) {
      return NextResponse.json({ error: "ids and bulkAction required" }, { status: 400 });
    }
    if (bulkAction === "hide") {
      await prisma.product.updateMany({
        where: { id: { in: ids }, deletedAt: null },
        data: { isActive: false },
      });
    } else if (bulkAction === "show") {
      await prisma.product.updateMany({
        where: { id: { in: ids }, deletedAt: null },
        data: { isActive: true },
      });
    } else if (bulkAction === "delete") {
      await prisma.product.updateMany({
        where: { id: { in: ids } },
        data: { deletedAt: new Date(), isActive: false },
      });
    } else if (bulkAction === "price") {
      const price = Math.round(Number(body.price));
      if (!Number.isFinite(price) || price < 0) {
        return NextResponse.json({ error: "Invalid price" }, { status: 400 });
      }
      await prisma.product.updateMany({
        where: { id: { in: ids }, deletedAt: null },
        data: { price },
      });
    } else {
      return NextResponse.json({ error: "Unknown bulkAction" }, { status: 400 });
    }
    await auditAdminAction(req, session, {
      action: `product.bulk_${bulkAction}`,
      entity: "Product",
      details: `${ids.length} products`,
    });
    await cacheDel(CacheKeys.homeCatalog);
    return NextResponse.json({ ok: true, count: ids.length });
  }

  if (!id) {
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
        reviewRecommendation:
          action === "reject"
            ? String(recommendation || "").trim() || null
            : null,
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
            : `${product.nameEn} was rejected. Reason: ${note || "See Approval Status."}${
                recommendation ? ` Recommendation: ${recommendation}` : ""
              } Open Approval Status for details.`,
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
        reviewRecommendation: product.reviewRecommendation,
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
    const limited = imageUrls.slice(0, 5);
    const coverIndex = Math.max(0, Math.min(Number(body.coverIndex) || 0, limited.length - 1));
    await prisma.$transaction([
      prisma.productImage.deleteMany({ where: { productId: id, kind: "STOREFRONT" } }),
      prisma.productImage.createMany({
        data: limited.map((url, i) => ({
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
      details: `${existing.nameEn}: ${limited.length} storefront image(s)`,
    });
    await cacheDel(CacheKeys.homeCatalog);
    const product = await prisma.product.findUnique({
      where: { id },
      include: { images: { orderBy: [{ kind: "asc" }, { sortOrder: "asc" }] } },
    });
    return NextResponse.json(product);
  }

  // --- Append storefront images (max 5 total) ---
  if (action === "append_storefront_images") {
    const imageUrls = Array.isArray(body.imageUrls)
      ? (body.imageUrls as unknown[]).map(String).map((u) => u.trim()).filter(Boolean)
      : [];
    if (imageUrls.length === 0) {
      return NextResponse.json({ error: "Upload at least one image" }, { status: 400 });
    }
    const current = await prisma.productImage.findMany({
      where: { productId: id, kind: "STOREFRONT" },
      orderBy: { sortOrder: "asc" },
    });
    const slots = Math.max(0, 5 - current.length);
    if (slots === 0) {
      return NextResponse.json({ error: "Maximum 5 images per product" }, { status: 400 });
    }
    const toAdd = imageUrls.slice(0, slots);
    const startOrder = current.length;
    await prisma.productImage.createMany({
      data: toAdd.map((url, i) => ({
        productId: id,
        url,
        alt: `${existing.nameEn} ${startOrder + i + 1}`,
        sortOrder: startOrder + i,
        kind: "STOREFRONT",
        isCover: current.length === 0 && i === 0,
      })),
    });
    await cacheDel(CacheKeys.homeCatalog);
    const images = await prisma.productImage.findMany({
      where: { productId: id, kind: "STOREFRONT" },
      orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
    });
    return NextResponse.json({ ok: true, images });
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

  // --- Full catalog edit (side panel) ---
  if (action === "update_details") {
    const nextCategoryId =
      body.categoryId !== undefined ? String(body.categoryId) : undefined;
    if (nextCategoryId) {
      const cat = await prisma.category.findFirst({
        where: { id: nextCategoryId, deletedAt: null },
      });
      if (!cat) return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(body.nameEn !== undefined ? { nameEn: String(body.nameEn).trim() } : {}),
        ...(body.nameFr !== undefined ? { nameFr: String(body.nameFr).trim() } : {}),
        ...(body.nameRw !== undefined ? { nameRw: String(body.nameRw).trim() } : {}),
        ...(body.descriptionEn !== undefined || body.description !== undefined
          ? {
              descriptionEn: String(body.descriptionEn ?? body.description ?? "").trim(),
              descriptionFr: String(
                body.descriptionFr ?? body.descriptionEn ?? body.description ?? ""
              ).trim(),
              descriptionRw: String(
                body.descriptionRw ?? body.descriptionEn ?? body.description ?? ""
              ).trim(),
            }
          : {}),
        ...(nextCategoryId ? { category: { connect: { id: nextCategoryId } } } : {}),
        ...(body.price !== undefined ? { price: Math.round(Number(body.price)) } : {}),
        ...(body.unit !== undefined ? { unit: parseUnitType(body.unit) } : {}),
        ...(body.stockQty !== undefined
          ? { stockQty: Math.max(0, Math.floor(Number(body.stockQty))) }
          : {}),
        ...(body.isActive !== undefined ? { isActive: Boolean(body.isActive) } : {}),
        ...(body.isFeatured !== undefined ? { isFeatured: Boolean(body.isFeatured) } : {}),
        ...(body.isBestSeller !== undefined ? { isBestSeller: Boolean(body.isBestSeller) } : {}),
        ...(body.isNewArrival !== undefined ? { isNewArrival: Boolean(body.isNewArrival) } : {}),
        ...(body.isOrganic !== undefined ? { isOrganic: Boolean(body.isOrganic) } : {}),
        ...(body.lowStockAt !== undefined
          ? { lowStockAt: Math.max(0, Math.floor(Number(body.lowStockAt))) }
          : {}),
      },
      include: {
        category: { select: { id: true, nameEn: true, slug: true } },
        images: {
          where: { kind: "STOREFRONT" },
          orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
        },
      },
    });
    await auditAdminAction(req, session, {
      action: "product.update_details",
      entity: "Product",
      entityId: id,
      details: product.nameEn,
    });
    await cacheDel(CacheKeys.homeCatalog);
    return NextResponse.json(product);
  }

  if (action === "delete_image") {
    const imageId = String(body.imageId || "");
    if (!imageId) return NextResponse.json({ error: "imageId required" }, { status: 400 });
    await prisma.productImage.deleteMany({
      where: { id: imageId, productId: id, kind: "STOREFRONT" },
    });
    let remaining = await prisma.productImage.findMany({
      where: { productId: id, kind: "STOREFRONT" },
      orderBy: { sortOrder: "asc" },
    });
    if (remaining.length && !remaining.some((i) => i.isCover)) {
      await prisma.productImage.update({
        where: { id: remaining[0].id },
        data: { isCover: true },
      });
      remaining = await prisma.productImage.findMany({
        where: { productId: id, kind: "STOREFRONT" },
        orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
      });
    }
    await cacheDel(CacheKeys.homeCatalog);
    return NextResponse.json({ ok: true, images: remaining });
  }

  if (action === "reorder_images") {
    const order = Array.isArray(body.imageIds) ? (body.imageIds as string[]) : [];
    await prisma.$transaction(
      order.map((imageId, i) =>
        prisma.productImage.updateMany({
          where: { id: imageId, productId: id, kind: "STOREFRONT" },
          data: { sortOrder: i },
        })
      )
    );
    await cacheDel(CacheKeys.homeCatalog);
    return NextResponse.json({ ok: true });
  }

  if (action === "soft_delete") {
    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    await auditAdminAction(req, session, {
      action: "product.soft_delete",
      entity: "Product",
      entityId: id,
      details: existing.nameEn,
    });
    await cacheDel(CacheKeys.homeCatalog);
    return NextResponse.json({ ok: true });
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
