import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/rbac-server";
import { prisma } from "@/lib/prisma";
import { auditAdminAction } from "@/lib/audit";
import { cacheDel, CacheKeys } from "@/lib/redis";

async function requireAdmin() {
  return requireAdminSession({ modules: ["categories", "products"] });
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

/** GET. Categories with product stats for Catalog */
export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [categories, productRows] = await Promise.all([
    prisma.category.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }],
      include: {
        _count: {
          select: { products: { where: { deletedAt: null } } },
        },
      },
    }),
    prisma.product.findMany({
      where: { deletedAt: null },
      select: {
        categoryId: true,
        isActive: true,
        stockQty: true,
        reservedQty: true,
        lowStockAt: true,
      },
    }),
  ]);

  const byCategory = new Map<
    string,
    { lowStock: number; outOfStock: number; hidden: number }
  >();
  for (const p of productRows) {
    if (!p.categoryId) continue;
    const cur = byCategory.get(p.categoryId) || { lowStock: 0, outOfStock: 0, hidden: 0 };
    if (!p.isActive) cur.hidden += 1;
    const available = Math.max(0, p.stockQty - p.reservedQty);
    if (available <= 0) cur.outOfStock += 1;
    else if (available <= (p.lowStockAt ?? 5)) cur.lowStock += 1;
    byCategory.set(p.categoryId, cur);
  }

  const payload = categories.map((c) => {
    const stats = byCategory.get(c.id) || { lowStock: 0, outOfStock: 0, hidden: 0 };
    return {
      id: c.id,
      slug: c.slug,
      nameEn: c.nameEn,
      nameFr: c.nameFr,
      nameRw: c.nameRw,
      description: c.description,
      imageUrl: c.imageUrl,
      sortOrder: c.sortOrder,
      isActive: c.isActive,
      stats: {
        products: c._count.products,
        lowStock: stats.lowStock,
        outOfStock: stats.outOfStock,
        hidden: stats.hidden,
      },
    };
  });

  return NextResponse.json({ categories: payload });
}

/** POST. Create category */
export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const nameEn = String(body.nameEn || "").trim();
  if (!nameEn) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  let slug = String(body.slug || slugify(nameEn));
  if (!slug) slug = `category-${Date.now()}`;

  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing && !existing.deletedAt) {
    return NextResponse.json({ error: "A category with this slug already exists" }, { status: 409 });
  }

  const maxSort = await prisma.category.aggregate({ _max: { sortOrder: true } });
  const category = await prisma.category.create({
    data: {
      slug,
      nameEn,
      nameFr: String(body.nameFr || nameEn).trim(),
      nameRw: String(body.nameRw || nameEn).trim(),
      description: body.description ? String(body.description) : null,
      imageUrl: body.imageUrl ? String(body.imageUrl) : null,
      sortOrder: Number.isFinite(Number(body.sortOrder))
        ? Number(body.sortOrder)
        : (maxSort._max.sortOrder ?? 0) + 1,
      isActive: body.isActive !== false,
    },
  });

  await auditAdminAction(req, session, {
    action: "category.create",
    entity: "Category",
    entityId: category.id,
    details: category.nameEn,
  });
  await cacheDel(CacheKeys.homeCatalog);
  return NextResponse.json(category, { status: 201 });
}

/** PATCH. Update / soft-delete */
export async function PATCH(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const id = String(body.id || "");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing || existing.deletedAt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (body.action === "delete") {
    await prisma.category.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    await auditAdminAction(req, session, {
      action: "category.delete",
      entity: "Category",
      entityId: id,
      details: existing.nameEn,
    });
    await cacheDel(CacheKeys.homeCatalog);
    return NextResponse.json({ ok: true });
  }

  const category = await prisma.category.update({
    where: { id },
    data: {
      ...(body.nameEn !== undefined ? { nameEn: String(body.nameEn).trim() } : {}),
      ...(body.nameFr !== undefined ? { nameFr: String(body.nameFr).trim() } : {}),
      ...(body.nameRw !== undefined ? { nameRw: String(body.nameRw).trim() } : {}),
      ...(body.description !== undefined
        ? { description: body.description ? String(body.description) : null }
        : {}),
      ...(body.imageUrl !== undefined
        ? { imageUrl: body.imageUrl ? String(body.imageUrl) : null }
        : {}),
      ...(body.sortOrder !== undefined ? { sortOrder: Number(body.sortOrder) || 0 } : {}),
      ...(body.isActive !== undefined ? { isActive: Boolean(body.isActive) } : {}),
      ...(body.slug !== undefined ? { slug: slugify(String(body.slug)) } : {}),
    },
  });

  await auditAdminAction(req, session, {
    action: "category.update",
    entity: "Category",
    entityId: id,
    details: category.nameEn,
  });
  await cacheDel(CacheKeys.homeCatalog);
  return NextResponse.json(category);
}
