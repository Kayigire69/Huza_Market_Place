import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/rbac-server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

async function requireAdmin() {
  return requireAdminSession({ modules: ["inventory"] });
}

const productStockSelect = {
  id: true,
  nameEn: true,
  unit: true,
  stockQty: true,
  reservedQty: true,
  lowStockAt: true,
  isActive: true,
  category: { select: { nameEn: true } },
} satisfies Prisma.ProductSelect;

export async function GET(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") || "stock";
  const filter = searchParams.get("filter") || "all";
  const q = searchParams.get("q")?.trim() || "";
  const productId = searchParams.get("productId") || undefined;

  if (mode === "movements") {
    const movements = await prisma.stockMovement.findMany({
      where: productId ? { productId } : undefined,
      select: {
        id: true,
        type: true,
        quantity: true,
        reason: true,
        createdAt: true,
        productId: true,
        product: { select: { id: true, nameEn: true, unit: true, stockQty: true } },
      },
      orderBy: { createdAt: "desc" },
      take: productId ? 50 : 60,
    });
    return NextResponse.json({ movements });
  }

  if (mode === "expiring") {
    const now = new Date();
    const in7 = new Date();
    in7.setDate(in7.getDate() + 7);
    const batches = await prisma.stockBatch.findMany({
      where: {
        quantity: { gt: 0 },
        expiryDate: { not: null, lte: in7 },
      },
      select: {
        id: true,
        batchNumber: true,
        quantity: true,
        expiryDate: true,
        product: {
          select: {
            id: true,
            nameEn: true,
            unit: true,
            category: { select: { nameEn: true, slug: true } },
          },
        },
      },
      orderBy: { expiryDate: "asc" },
      take: 100,
    });
    return NextResponse.json({
      batches: batches.map((b) => ({
        id: b.id,
        batchNumber: b.batchNumber,
        quantity: b.quantity,
        expiryDate: b.expiryDate,
        expired: b.expiryDate ? b.expiryDate < now : false,
        product: b.product,
      })),
    });
  }

  const searchSql = q
    ? Prisma.sql`AND (
        p."nameEn" ILIKE ${"%" + q + "%"}
        OR p."nameFr" ILIKE ${"%" + q + "%"}
        OR p."nameRw" ILIKE ${"%" + q + "%"}
      )`
    : Prisma.empty;

  // Push stock filters into SQL (same available = stockQty - reservedQty rule as before).
  if (filter === "out" || filter === "low") {
    const rows = await prisma.$queryRaw<
      Array<{
        id: string;
        nameEn: string;
        unit: string;
        stockQty: number;
        reservedQty: number;
        lowStockAt: number | null;
        isActive: boolean;
        categoryNameEn: string | null;
      }>
    >`
      SELECT p.id, p."nameEn", p.unit, p."stockQty", p."reservedQty", p."lowStockAt", p."isActive",
             c."nameEn" AS "categoryNameEn"
      FROM "Product" p
      LEFT JOIN "Category" c ON c.id = p."categoryId"
      WHERE p."deletedAt" IS NULL
        ${searchSql}
        AND (
          ${
            filter === "out"
              ? Prisma.sql`(p."stockQty" - p."reservedQty") <= 0`
              : Prisma.sql`(p."stockQty" - p."reservedQty") > 0
                  AND (p."stockQty" - p."reservedQty") <= COALESCE(p."lowStockAt", 5)`
          }
        )
      ORDER BY p."nameEn" ASC
      LIMIT 200
    `;

    return NextResponse.json({
      products: rows.map((p) => ({
        id: p.id,
        nameEn: p.nameEn,
        unit: p.unit,
        stockQty: p.stockQty,
        reservedQty: p.reservedQty,
        lowStockAt: p.lowStockAt,
        isActive: p.isActive,
        category: p.categoryNameEn ? { nameEn: p.categoryNameEn } : null,
      })),
    });
  }

  const search: Prisma.ProductWhereInput = q
    ? {
        OR: [
          { nameEn: { contains: q, mode: "insensitive" } },
          { nameFr: { contains: q, mode: "insensitive" } },
          { nameRw: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const products = await prisma.product.findMany({
    where: { deletedAt: null, ...search },
    select: productStockSelect,
    orderBy: { nameEn: "asc" },
    take: 200,
  });

  return NextResponse.json({ products });
}
