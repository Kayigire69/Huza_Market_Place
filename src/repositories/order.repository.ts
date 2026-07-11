import { prisma } from "@/lib/prisma";
import type { OrderStatus, Prisma } from "@prisma/client";

export const orderRepository = {
  async createWithRelations(
    tx: Prisma.TransactionClient,
    data: Prisma.OrderCreateInput
  ) {
    return tx.order.create({
      data,
      include: { payment: true, items: true },
    });
  },

  async findByIdOrNumber(opts: { id?: string; orderNumber?: string }) {
    return prisma.order.findFirst({
      where: opts.id ? { id: opts.id } : { orderNumber: opts.orderNumber || undefined },
      include: { payment: true, items: true },
    });
  },

  async updateStatus(
    orderId: string,
    status: OrderStatus,
    note: string,
    deliveryStatus?: OrderStatus
  ) {
    return prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        statusLog: { create: { status, note } },
        ...(deliveryStatus
          ? { delivery: { update: { status: deliveryStatus } } }
          : {}),
      },
    });
  },
};
