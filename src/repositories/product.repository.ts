import { prisma } from "@/lib/prisma";
import type { Prisma, ProductAvailability } from "@prisma/client";

/** Sellable units = physical stock minus pending reservations */
export function availableQty(stockQty: number, reservedQty: number) {
  return Math.max(0, stockQty - reservedQty);
}

export function deriveAvailability(
  stockQty: number,
  reservedQty: number,
  lowStockAt: number,
  override?: ProductAvailability | null
): ProductAvailability {
  if (override) return override;
  const available = availableQty(stockQty, reservedQty);
  if (available <= 0) return "OUT_OF_STOCK";
  if (available <= lowStockAt) return "LOW_STOCK";
  return "IN_STOCK";
}

/** Columns needed by ProductCard — avoids loading farmer dossier / long descriptions. */
export const productCardSelect = {
  id: true,
  nameEn: true,
  nameFr: true,
  nameRw: true,
  price: true,
  unit: true,
  stockQty: true,
  reservedQty: true,
  lowStockAt: true,
  isOrganic: true,
  ratingAvg: true,
  availableDistricts: true,
  originDistrict: true,
  nutritionalInfo: true,
  reviewStatus: true,
  reviewedAt: true,
  harvestDate: true,
  images: {
    where: { kind: "STOREFRONT" as const },
    orderBy: [{ isCover: "desc" as const }, { sortOrder: "asc" as const }],
    take: 2,
    select: { url: true, isCover: true },
  },
  supplier: { select: { id: true } },
  category: {
    select: { nameEn: true, nameFr: true, nameRw: true, slug: true },
  },
} satisfies Prisma.ProductSelect;

export const productRepository = {
  async findActiveByIds(ids: string[]) {
    return prisma.product.findMany({
      where: { id: { in: ids }, isActive: true, deletedAt: null },
      select: {
        id: true,
        supplierId: true,
        price: true,
        stockQty: true,
        reservedQty: true,
        purchasePrice: true,
        farmGatePrice: true,
        pricePerUnit: true,
        nameEn: true,
      },
    });
  },

  /** Legacy hard decrement — prefer reserve/commit helpers */
  async decrementStock(tx: Prisma.TransactionClient, productId: string, quantity: number) {
    return tx.product.update({
      where: { id: productId },
      data: { stockQty: { decrement: quantity } },
    });
  },

  async incrementStock(tx: Prisma.TransactionClient, productId: string, quantity: number) {
    return tx.product.update({
      where: { id: productId },
      data: { stockQty: { increment: quantity } },
    });
  },

  /**
   * Hold demand for a pending payment.
   * When `allowBackorder` is true, reservedQty may exceed stockQty (6–12h restock path).
   */
  async reserveStock(
    tx: Prisma.TransactionClient,
    productId: string,
    quantity: number,
    options?: { allowBackorder?: boolean }
  ) {
    const updated = await tx.product.updateMany({
      where: {
        id: productId,
        deletedAt: null,
        isActive: true,
      },
      data: { reservedQty: { increment: quantity } },
    });
    if (updated.count !== 1) {
      throw new Error("Unable to reserve stock");
    }
    const product = await tx.product.findUniqueOrThrow({ where: { id: productId } });
    if (!options?.allowBackorder && product.reservedQty > product.stockQty) {
      await tx.product.update({
        where: { id: productId },
        data: { reservedQty: { decrement: quantity } },
      });
      throw new Error(`Insufficient stock for ${product.nameEn}`);
    }
    return product;
  },

  /** Payment confirmed — convert reservation into a sale (stock floored at 0) */
  async commitReservation(tx: Prisma.TransactionClient, productId: string, quantity: number) {
    const product = await tx.product.findUniqueOrThrow({ where: { id: productId } });
    const nextStock = Math.max(0, product.stockQty - quantity);
    const nextReserved = Math.max(0, product.reservedQty - quantity);
    return tx.product.update({
      where: { id: productId },
      data: {
        stockQty: nextStock,
        reservedQty: nextReserved,
      },
    });
  },

  /** Payment failed / timed out — release reservation */
  async releaseReservation(tx: Prisma.TransactionClient, productId: string, quantity: number) {
    const product = await tx.product.findUniqueOrThrow({ where: { id: productId } });
    const release = Math.min(quantity, product.reservedQty);
    return tx.product.update({
      where: { id: productId },
      data: { reservedQty: { decrement: release } },
    });
  },

  /** Immediate physical sale helper (legacy / warehouse) — checkout uses reserve → commit */
  async sellNow(tx: Prisma.TransactionClient, productId: string, quantity: number) {
    const product = await tx.product.findUniqueOrThrow({ where: { id: productId } });
    if (availableQty(product.stockQty, product.reservedQty) < quantity) {
      throw new Error(`Insufficient stock for ${product.nameEn}`);
    }
    return tx.product.update({
      where: { id: productId },
      data: { stockQty: { decrement: quantity } },
    });
  },

  async softDelete(productId: string) {
    return prisma.product.update({
      where: { id: productId },
      data: { isActive: false, deletedAt: new Date() },
    });
  },

  async findHomeLists(take = 8) {
    const active = {
      isActive: true,
      deletedAt: null,
      images: { some: { kind: "STOREFRONT" as const } },
    };

    const [categories, bestSellers, featured, readyToEat] = await Promise.all([
      prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.product.findMany({
        where: { ...active, isBestSeller: true },
        select: productCardSelect,
        take,
      }),
      prisma.product.findMany({
        where: { ...active, isFeatured: true },
        select: productCardSelect,
        take,
      }),
      prisma.product.findMany({
        where: {
          ...active,
          category: { slug: { in: ["fruit-salads", "fresh-juices"] } },
        },
        select: productCardSelect,
        orderBy: [{ isBestSeller: "desc" }, { isFeatured: "desc" }, { updatedAt: "desc" }],
        take: 8,
      }),
    ]);

    // Product names under each category (homepage “Shop by Category”)
    const categoryPreviews = await Promise.all(
      categories.map(async (category) => {
        const products = await prisma.product.findMany({
          where: { ...active, categoryId: category.id },
          select: {
            id: true,
            nameEn: true,
            nameFr: true,
            nameRw: true,
          },
          orderBy: [{ isBestSeller: "desc" }, { nameEn: "asc" }],
          take: 8,
        });
        return { category, products };
      })
    );

    // One curated "Popular now" rail — prefer bestsellers, fill from featured
    const seen = new Set<string>();
    const popularNow: typeof bestSellers = [];
    for (const p of [...bestSellers, ...featured]) {
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      popularNow.push(p);
      if (popularNow.length >= take) break;
    }

    return {
      categories,
      popularNow,
      readyToEat,
      bestSellers,
      featured: popularNow.slice(0, 4),
      freshToday: [],
      shopProducts: popularNow,
      categoryPreviews,
    };
  },
};
