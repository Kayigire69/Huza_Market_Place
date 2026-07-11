import { prisma } from "@/lib/prisma";
import type { PaymentStatus, Prisma } from "@prisma/client";

export const paymentRepository = {
  async findById(id: string) {
    return prisma.payment.findUnique({
      where: { id },
      include: { order: { include: { items: true } } },
    });
  },

  async findByExternalId(externalId: string) {
    return prisma.payment.findFirst({
      where: { OR: [{ externalId }, { transactionRef: externalId }] },
      include: { order: { include: { items: true } } },
    });
  },

  async update(id: string, data: Prisma.PaymentUpdateInput) {
    return prisma.payment.update({ where: { id }, data });
  },

  async markConfirmed(id: string, providerMessage: string) {
    return prisma.payment.update({
      where: { id },
      data: {
        status: "CONFIRMED" as PaymentStatus,
        verifiedAt: new Date(),
        providerMessage,
      },
    });
  },

  async markFailed(id: string, providerMessage: string) {
    return prisma.payment.update({
      where: { id },
      data: { status: "FAILED" as PaymentStatus, providerMessage },
    });
  },
};
