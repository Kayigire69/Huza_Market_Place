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

export const productRepository = {
  async findActiveByIds(ids: string[]) {
    return prisma.product.findMany({
      where: { id: { in: ids }, isActive: true, deletedAt: null },
      include: { supplier: true },
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
   * Hold stock for a pending payment (does not reduce physical stockQty).
   * Uses conditional update to prevent overselling races.
   */
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

  async findHomeLists(take = 16) {
    const include = {
      images: { orderBy: { sortOrder: "asc" as const } },
      supplier: true,
      category: true,
    };
    // Include zero-stock items — storefront shows a 6–12h arrival window instead of hiding them
    const active = { isActive: true, deletedAt: null };
    const [shopProducts, featured, bestSellers, freshToday] = await Promise.all([
      prisma.product.findMany({
        where: active,
        include,
        orderBy: [{ updatedAt: "desc" }],
        take,
      }),
      prisma.product.findMany({
        where: { ...active, isFeatured: true },
        include,
        take: 8,
      }),
      prisma.product.findMany({
        where: { ...active, isBestSeller: true },
        include,
        take: 8,
      }),
      prisma.product.findMany({
        where: { ...active, isNewArrival: true },
        include,
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
    ]);
    return { shopProducts, featured, bestSellers, freshToday };
  },
};
