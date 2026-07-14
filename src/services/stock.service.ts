import type { Prisma, StockMovementType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { notifyAdmins } from "@/lib/notify-admins";
import { availableQty } from "@/repositories/product.repository";

type Tx = Prisma.TransactionClient;

export type StockAdjustInput = {
  productId: string;
  /** Positive = stock in, negative = stock out */
  quantity: number;
  type: StockMovementType;
  reason: string;
  actorId?: string | null;
};

async function maybeNotifyLowStock(product: {
  id: string;
  nameEn: string;
  stockQty: number;
  reservedQty: number;
  lowStockAt: number;
}) {
  const available = availableQty(product.stockQty, product.reservedQty);
  if (available > 0 && available <= product.lowStockAt) {
    void notifyAdmins({
      type: "LOW_STOCK",
      title: `Low stock: ${product.nameEn}`,
      body: `Only ${available} units left (threshold ${product.lowStockAt}).`,
    });
  }
}

/**
 * Central stock ledger: always writes StockMovement + StockHistory together.
 * Used by admin stock in/out and automatic flows (sales, receive, damage).
 */
export const stockService = {
  async adjust(input: StockAdjustInput, tx?: Tx) {
    const run = async (client: Tx) => {
      const qty = Math.trunc(input.quantity);
      if (qty === 0) {
        throw new Error("Quantity cannot be zero");
      }

      const product = await client.product.findUniqueOrThrow({
        where: { id: input.productId },
      });

      const nextStock = product.stockQty + qty;
      if (nextStock < 0) {
        throw new Error(
          `Insufficient stock for ${product.nameEn} (have ${product.stockQty}, need ${Math.abs(qty)})`
        );
      }

      const updated = await client.product.update({
        where: { id: input.productId },
        data: { stockQty: nextStock },
      });

      await client.stockHistory.create({
        data: {
          productId: input.productId,
          change: qty,
          reason: input.reason,
        },
      });

      await client.stockMovement.create({
        data: {
          productId: input.productId,
          type: input.type,
          quantity: qty,
          reason: input.reason,
          actorId: input.actorId || null,
        },
      });

      return updated;
    };

    const updated = tx ? await run(tx) : await prisma.$transaction(run);
    await maybeNotifyLowStock(updated);
    return updated;
  },

  async stockIn(
    productId: string,
    quantity: number,
    reason: string,
    actorId?: string | null,
    type: StockMovementType = "RECEIVE"
  ) {
    return this.adjust({
      productId,
      quantity: Math.abs(quantity),
      type,
      reason,
      actorId,
    });
  },

  async stockOut(
    productId: string,
    quantity: number,
    reason: string,
    actorId?: string | null,
    type: StockMovementType = "ADJUST"
  ) {
    return this.adjust({
      productId,
      quantity: -Math.abs(quantity),
      type,
      reason,
      actorId,
    });
  },

  async recentMovements(take = 40) {
    return prisma.stockMovement.findMany({
      include: {
        product: { select: { id: true, nameEn: true, stockQty: true, unit: true } },
      },
      orderBy: { createdAt: "desc" },
      take,
    });
  },
};
