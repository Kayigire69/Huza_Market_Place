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
  async reserveStock(tx: Prisma.TransactionClient, productId: string, quantity: number) {
    const updated = await tx.product.updateMany({
      where: {
        id: productId,
        deletedAt: null,
        isActive: true,
        // available = stockQty - reservedQty >= quantity
        // Prisma can't express column math in where easily — check after read
      },
      data: { reservedQty: { increment: quantity } },
    });
    if (updated.count !== 1) {
      throw new Error("Unable to reserve stock");
    }
    const product = await tx.product.findUniqueOrThrow({ where: { id: productId } });
    if (product.reservedQty > product.stockQty) {
      // Roll back this reservation within the same transaction
      await tx.product.update({
        where: { id: productId },
        data: { reservedQty: { decrement: quantity } },
      });
      throw new Error(`Insufficient stock for ${product.nameEn}`);
    }
    return product;
  },

  /** Payment confirmed — convert reservation into a sale */
  async commitReservation(tx: Prisma.TransactionClient, productId: string, quantity: number) {
    return tx.product.update({
      where: { id: productId },
      data: {
        stockQty: { decrement: quantity },
        reservedQty: { decrement: quantity },
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
    const active = { isActive: true, deletedAt: null, stockQty: { gt: 0 } };
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
