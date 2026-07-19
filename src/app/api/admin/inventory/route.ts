import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/rbac-server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { deriveInventoryOpsStatus } from "@/lib/inventory-meta";

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
  price: true,
  purchasePrice: true,
  ownershipMode: true,
  inventorySource: true,
  purchaseMethod: true,
  qualityGrade: true,
  reviewStatus: true,
  category: { select: { nameEn: true } },
  supplier: {
    select: {
      id: true,
      businessName: true,
      user: { select: { fullName: true } },
    },
  },
} satisfies Prisma.ProductSelect;

function mapInventoryRow<
  T extends {
    id: string;
    nameEn: string;
    unit: string;
    stockQty: number;
    reservedQty: number;
    lowStockAt: number | null;
    isActive: boolean;
    price?: number | null;
    purchasePrice?: number | null;
    ownershipMode?: string | null;
    inventorySource?: string | null;
    purchaseMethod?: string | null;
    qualityGrade?: string | null;
    reviewStatus?: string | null;
    category?: { nameEn: string } | null;
    supplier?: {
      id: string;
      businessName: string;
      user?: { fullName: string } | null;
    } | null;
  },
>(p: T) {
  const inventoryStatus = deriveInventoryOpsStatus(p);

  return {
    id: p.id,
    nameEn: p.nameEn,
    unit: p.unit,
    stockQty: p.stockQty,
    reservedQty: p.reservedQty,
    lowStockAt: p.lowStockAt,
    isActive: p.isActive,
    price: p.price ?? null,
    purchasePrice: p.purchasePrice ?? null,
    ownershipMode: p.ownershipMode ?? null,
    inventorySource: p.inventorySource ?? null,
    purchaseMethod: p.purchaseMethod ?? null,
    qualityGrade: p.qualityGrade ?? null,
    reviewStatus: p.reviewStatus ?? null,
    inventoryStatus,
    category: p.category ? { nameEn: p.category.nameEn } : null,
    supplier: p.supplier
      ? {
          id: p.supplier.id,
          businessName: p.supplier.businessName,
          farmerName: p.supplier.user?.fullName ?? null,
        }
      : null,
  };
}

export async function GET(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") || "stock";
  const filter = searchParams.get("filter") || "all";
  const q = searchParams.get("q")?.trim() || "";
  const productId = searchParams.get("productId") || undefined;
  const source = searchParams.get("source")?.trim().toUpperCase() || "";
  const method = searchParams.get("method")?.trim().toUpperCase() || "";
  const grade = searchParams.get("grade")?.trim() || "";
  const statusFilter = searchParams.get("status")?.trim() || "";

  const metaWhere: Prisma.ProductWhereInput = {
    ...(source === "FARMER" || source === "MARKET" ? { inventorySource: source } : {}),
    ...(method === "DIRECT" || method === "COMMISSION" || method === "MARKET"
      ? { purchaseMethod: method }
      : {}),
    ...(grade === "1" || grade === "2" || grade === "3" ? { qualityGrade: grade } : {}),
  };

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

  const sourceSql =
    source === "FARMER" || source === "MARKET"
      ? Prisma.sql`AND p."inventorySource" = ${source}`
      : Prisma.empty;
  const methodSql =
    method === "DIRECT" || method === "COMMISSION" || method === "MARKET"
      ? Prisma.sql`AND p."purchaseMethod" = ${method}`
      : Prisma.empty;
  const gradeSql =
    grade === "1" || grade === "2" || grade === "3"
      ? Prisma.sql`AND p."qualityGrade" = ${grade}`
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
        price: number;
        purchasePrice: number | null;
        ownershipMode: string | null;
        inventorySource: string | null;
        purchaseMethod: string | null;
        qualityGrade: string | null;
        reviewStatus: string | null;
        categoryNameEn: string | null;
        supplierId: string | null;
        supplierName: string | null;
        farmerName: string | null;
      }>
    >`
      SELECT p.id, p."nameEn", p.unit, p."stockQty", p."reservedQty", p."lowStockAt", p."isActive",
             p.price, p."purchasePrice", p."ownershipMode", p."inventorySource", p."purchaseMethod",
             p."qualityGrade", p."reviewStatus",
             c."nameEn" AS "categoryNameEn",
             s.id AS "supplierId", s."businessName" AS "supplierName", u."fullName" AS "farmerName"
      FROM "Product" p
      LEFT JOIN "Category" c ON c.id = p."categoryId"
      LEFT JOIN "Supplier" s ON s.id = p."supplierId"
      LEFT JOIN "User" u ON u.id = s."userId"
      WHERE p."deletedAt" IS NULL
        ${searchSql}
        ${sourceSql}
        ${methodSql}
        ${gradeSql}
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
      products: rows
        .map((p) =>
          mapInventoryRow({
            id: p.id,
            nameEn: p.nameEn,
            unit: p.unit,
            stockQty: p.stockQty,
            reservedQty: p.reservedQty,
            lowStockAt: p.lowStockAt,
            isActive: p.isActive,
            price: p.price,
            purchasePrice: p.purchasePrice,
            ownershipMode: p.ownershipMode,
            inventorySource: p.inventorySource,
            purchaseMethod: p.purchaseMethod,
            qualityGrade: p.qualityGrade,
            reviewStatus: p.reviewStatus,
            category: p.categoryNameEn ? { nameEn: p.categoryNameEn } : null,
            supplier: p.supplierId
              ? {
                  id: p.supplierId,
                  businessName: p.supplierName || "",
                  user: p.farmerName ? { fullName: p.farmerName } : null,
                }
              : null,
          })
        )
        .filter((p) =>
          statusFilter === "Available" ||
          statusFilter === "Reserved" ||
          statusFilter === "Sold Out" ||
          statusFilter === "Rejected"
            ? p.inventoryStatus === statusFilter
            : true
        ),
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
    where: { deletedAt: null, ...search, ...metaWhere },
    select: productStockSelect,
    orderBy: { nameEn: "asc" },
    take: 400,
  });

  let mapped = products.map(mapInventoryRow);
  if (
    statusFilter === "Available" ||
    statusFilter === "Reserved" ||
    statusFilter === "Sold Out" ||
    statusFilter === "Rejected"
  ) {
    mapped = mapped.filter((p) => p.inventoryStatus === statusFilter);
  }

  return NextResponse.json({ products: mapped.slice(0, 200) });
}
