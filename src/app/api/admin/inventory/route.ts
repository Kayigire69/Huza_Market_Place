import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/rbac-server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  deriveInventoryOpsStatus,
  resolveInventorySource,
  resolvePurchaseMethod,
} from "@/lib/inventory-meta";

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
  categoryId: true,
  procurementMarketName: true,
  procurementFarmName: true,
  procurementFarmerName: true,
  procurementPurchaseDate: true,
  purchasedById: true,
  purchasedBy: { select: { id: true, fullName: true } },
  category: { select: { id: true, nameEn: true, slug: true } },
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
    categoryId?: string | null;
    procurementMarketName?: string | null;
    procurementFarmName?: string | null;
    procurementFarmerName?: string | null;
    procurementPurchaseDate?: Date | string | null;
    purchasedById?: string | null;
    purchasedBy?: { id: string; fullName: string } | null;
    category?: { id?: string; nameEn: string; slug?: string } | null;
    supplier?: {
      id: string;
      businessName: string;
      user?: { fullName: string } | null;
    } | null;
  },
>(p: T) {
  const inventoryStatus = deriveInventoryOpsStatus(p);
  const inventorySource = resolveInventorySource(p.inventorySource);
  const purchaseMethod = resolvePurchaseMethod(
    p.purchaseMethod,
    p.ownershipMode,
    p.inventorySource
  );

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
    inventorySource,
    purchaseMethod,
    qualityGrade: p.qualityGrade ?? null,
    reviewStatus: p.reviewStatus ?? null,
    inventoryStatus,
    categoryId: p.categoryId || p.category?.id || null,
    procurementMarketName: p.procurementMarketName ?? null,
    procurementFarmName: p.procurementFarmName ?? null,
    procurementFarmerName: p.procurementFarmerName ?? null,
    procurementPurchaseDate: p.procurementPurchaseDate
      ? new Date(p.procurementPurchaseDate).toISOString()
      : null,
    purchasedById: p.purchasedById ?? null,
    purchasedByName: p.purchasedBy?.fullName ?? null,
    category: p.category
      ? { id: p.category.id, nameEn: p.category.nameEn, slug: p.category.slug }
      : null,
    supplier: p.supplier
      ? {
          id: p.supplier.id,
          businessName: p.supplier.businessName,
          farmerName: p.supplier.user?.fullName ?? null,
        }
      : null,
  };
}

/** Persist missing source/method so inventory rows never stay blank. */
async function backfillMissingInventoryMeta() {
  await prisma.product.updateMany({
    where: {
      deletedAt: null,
      OR: [{ inventorySource: null }, { inventorySource: "" }],
    },
    data: { inventorySource: "FARMER" },
  });
  await prisma.product.updateMany({
    where: {
      deletedAt: null,
      inventorySource: "MARKET",
      OR: [{ purchaseMethod: null }, { purchaseMethod: "" }],
    },
    data: { purchaseMethod: "MARKET" },
  });
  await prisma.product.updateMany({
    where: {
      deletedAt: null,
      ownershipMode: "COMMISSION",
      OR: [{ purchaseMethod: null }, { purchaseMethod: "" }],
    },
    data: { purchaseMethod: "COMMISSION" },
  });
  await prisma.product.updateMany({
    where: {
      deletedAt: null,
      OR: [{ purchaseMethod: null }, { purchaseMethod: "" }],
    },
    data: { purchaseMethod: "DIRECT" },
  });
}

export async function GET(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") || "stock";
  const filter = searchParams.get("filter") || "all";
  const q = searchParams.get("q")?.trim() || "";
  const productId = searchParams.get("productId") || undefined;
  const categoryId = searchParams.get("categoryId")?.trim() || "";
  const source = searchParams.get("source")?.trim().toUpperCase() || "";
  const method = searchParams.get("method")?.trim().toUpperCase() || "";
  const grade = searchParams.get("grade")?.trim() || "";
  const statusFilter = searchParams.get("status")?.trim() || "";

  if (mode === "stock") {
    await backfillMissingInventoryMeta();
  }

  const metaWhere: Prisma.ProductWhereInput = {
    ...(categoryId ? { categoryId } : {}),
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
        ...(categoryId ? { product: { categoryId } } : {}),
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
            category: { select: { id: true, nameEn: true, slug: true } },
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

  const categorySql = categoryId
    ? Prisma.sql`AND p."categoryId" = ${categoryId}`
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
        categoryId: string | null;
        categoryNameEn: string | null;
        categorySlug: string | null;
        procurementMarketName: string | null;
        procurementFarmName: string | null;
        procurementFarmerName: string | null;
        procurementPurchaseDate: Date | null;
        purchasedById: string | null;
        purchasedByName: string | null;
        supplierId: string | null;
        supplierName: string | null;
        farmerName: string | null;
      }>
    >`
      SELECT p.id, p."nameEn", p.unit, p."stockQty", p."reservedQty", p."lowStockAt", p."isActive",
             p.price, p."purchasePrice", p."ownershipMode", p."inventorySource", p."purchaseMethod",
             p."qualityGrade", p."reviewStatus", p."categoryId",
             p."procurementMarketName", p."procurementFarmName", p."procurementFarmerName",
             p."procurementPurchaseDate", p."purchasedById",
             c."nameEn" AS "categoryNameEn", c.slug AS "categorySlug",
             buyer."fullName" AS "purchasedByName",
             s.id AS "supplierId", s."businessName" AS "supplierName", u."fullName" AS "farmerName"
      FROM "Product" p
      LEFT JOIN "Category" c ON c.id = p."categoryId"
      LEFT JOIN "Supplier" s ON s.id = p."supplierId"
      LEFT JOIN "User" u ON u.id = s."userId"
      LEFT JOIN "User" buyer ON buyer.id = p."purchasedById"
      WHERE p."deletedAt" IS NULL
        ${categorySql}
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
            categoryId: p.categoryId,
            procurementMarketName: p.procurementMarketName,
            procurementFarmName: p.procurementFarmName,
            procurementFarmerName: p.procurementFarmerName,
            procurementPurchaseDate: p.procurementPurchaseDate,
            purchasedById: p.purchasedById,
            purchasedBy: p.purchasedByName
              ? { id: p.purchasedById || "", fullName: p.purchasedByName }
              : null,
            category: p.categoryNameEn
              ? {
                  id: p.categoryId || undefined,
                  nameEn: p.categoryNameEn,
                  slug: p.categorySlug || undefined,
                }
              : null,
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
