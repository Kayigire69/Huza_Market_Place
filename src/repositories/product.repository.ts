import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const productRepository = {
  async findActiveByIds(ids: string[]) {
    return prisma.product.findMany({
      where: { id: { in: ids }, isActive: true },
      include: { supplier: true },
    });
  },

  async decrementStock(
    tx: Prisma.TransactionClient,
    productId: string,
    quantity: number
  ) {
    return tx.product.update({
      where: { id: productId },
      data: { stockQty: { decrement: quantity } },
    });
  },

  async incrementStock(
    tx: Prisma.TransactionClient,
    productId: string,
    quantity: number
  ) {
    return tx.product.update({
      where: { id: productId },
      data: { stockQty: { increment: quantity } },
    });
  },

  async findHomeLists(take = 16) {
    const include = {
      images: { orderBy: { sortOrder: "asc" as const } },
      supplier: true,
      category: true,
    };
    const active = { isActive: true, stockQty: { gt: 0 } };
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
