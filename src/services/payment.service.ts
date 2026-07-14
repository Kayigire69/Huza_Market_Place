import { OrderStatus } from "@prisma/client";
import { checkMtnPaymentStatus, disburseToSeller } from "@/lib/payments/mobile-money";
import { orderRepository } from "@/repositories/order.repository";
import { paymentRepository } from "@/repositories/payment.repository";
import { productRepository } from "@/repositories/product.repository";
import { prisma } from "@/lib/prisma";
import { enqueueAnalytics, enqueueEmail, enqueueSms } from "@/jobs/queue";
import { cacheDel, CacheKeys } from "@/lib/redis";
import { writeAuditLog } from "@/lib/audit";
import { notifyAdmins } from "@/lib/notify-admins";

export const paymentService = {
  async confirmPayment(paymentId: string) {
    const payment = await paymentRepository.findById(paymentId);
    if (!payment) return null;
    if (payment.status === "CONFIRMED") return payment;

    const disbursed = await disburseToSeller({
      method: payment.method,
      payeePhone: payment.payeePhone || payment.phoneNumber,
      amount: payment.amount,
      orderNumber: payment.order.orderNumber,
      externalId: payment.externalId || payment.id,
    });

    // Commit reservations → physical stock sale
    await prisma.$transaction(async (tx) => {
      for (const item of payment.order.items) {
        const updated = await productRepository.commitReservation(tx, item.productId, item.quantity);
        await tx.stockHistory.create({
          data: {
            productId: item.productId,
            change: -item.quantity,
            reason: `Payment confirmed — ${payment.order.orderNumber}`,
          },
        });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: "SALE",
            quantity: -Math.floor(item.quantity),
            reason: `Order ${payment.order.orderNumber}`,
          },
        });
        const available = Math.max(0, updated.stockQty - updated.reservedQty);
        if (available > 0 && available <= updated.lowStockAt) {
          void notifyAdmins({
            type: "LOW_STOCK",
            title: `Low stock: ${updated.nameEn}`,
            body: `Only ${available} units left after order ${payment.order.orderNumber}.`,
          });
        }
      }
    });

    // Loyalty: 1 point per 1,000 RWF paid
    if (payment.order.userId && payment.amount > 0) {
      const points = Math.floor(payment.amount / 1000);
      if (points > 0) {
        await prisma.user.update({
          where: { id: payment.order.userId },
          data: { loyaltyPoints: { increment: points } },
        });
      }
    }

    const updated = await paymentRepository.markConfirmed(payment.id, disbursed.message);

    const nextStatus = payment.order.scheduledFor ? OrderStatus.PENDING : OrderStatus.CONFIRMED;
    await orderRepository.updateStatus(
      payment.orderId,
      nextStatus,
      payment.order.scheduledFor
        ? "Payment confirmed — scheduled for next business day"
        : "Mobile money approved — payment confirmed to Youth Huza",
      OrderStatus.READY_FOR_PICKUP
    );

    await writeAuditLog({
      action: "payment.confirm",
      entity: "Payment",
      entityId: payment.id,
      details: `${payment.order.orderNumber} · ${payment.amount} RWF`,
    });

    await cacheDel(CacheKeys.homeCatalog);

    if (payment.order.userId) {
      await prisma.notification.create({
        data: {
          userId: payment.order.userId,
          type: "PAYMENT_CONFIRMATION",
          channel: "IN_APP",
          title: "Payment confirmed",
          body: `Payment of ${payment.amount} RWF for ${payment.order.orderNumber} confirmed. Paid to Youth Huza.`,
        },
      });
    }

    await notifyAdmins({
      type: "PAYMENT_CONFIRMATION",
      title: "Payment received",
      body: `${payment.order.orderNumber} · ${payment.amount} RWF · Paid — ready to prepare`,
    });

    await enqueueSms(
      payment.phoneNumber,
      `HUZA FRESH: Payment of ${payment.amount} RWF for ${payment.order.orderNumber} confirmed.`
    );
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const receiptLink = `${baseUrl}/api/receipts/${payment.order.orderNumber}?format=pdf`;
    const invoiceLink = `${baseUrl}/api/invoices/${payment.order.orderNumber}?format=pdf`;
    if (payment.order.guestPhone || payment.order.userId) {
      await enqueueEmail(
        `${payment.order.guestPhone || "customer"}@notify.huza.local`,
        `Payment confirmed — ${payment.order.orderNumber}`,
        `Your payment of ${payment.amount} RWF was confirmed. Youth Huza is preparing your order.\n\nDownload receipt: ${receiptLink}\nDownload invoice: ${invoiceLink}`
      );
    }
    await enqueueAnalytics("payment.confirmed", {
      orderNumber: payment.order.orderNumber,
      amount: payment.amount,
      method: payment.method,
    });

    return updated;
  },

  async failPayment(paymentId: string, reason: string) {
    const payment = await paymentRepository.findById(paymentId);
    if (!payment || payment.status === "CONFIRMED" || payment.status === "FAILED") return payment;

    await paymentRepository.markFailed(paymentId, reason);
    await orderRepository.updateStatus(payment.orderId, OrderStatus.CANCELLED, reason);

    // Release reservation (physical stockQty unchanged)
    await prisma.$transaction(async (tx) => {
      for (const item of payment.order.items) {
        await productRepository.releaseReservation(tx, item.productId, item.quantity);
        await tx.stockHistory.create({
          data: {
            productId: item.productId,
            change: 0,
            reason: `Reservation released — ${payment.order.orderNumber}: ${reason}`,
          },
        });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: "ADJUST",
            quantity: 0,
            reason: `Released reservation ${payment.order.orderNumber}`,
          },
        });
      }
    });

    await writeAuditLog({
      action: "payment.fail",
      entity: "Payment",
      entityId: payment.id,
      details: `${payment.order.orderNumber} · ${reason}`,
    });

    await cacheDel(CacheKeys.homeCatalog);
    await enqueueAnalytics("payment.failed", {
      orderNumber: payment.order.orderNumber,
      reason,
    });

    return payment;
  },

  /** Poll provider (or expire unpaid reservations after 10 min) */
  async verifyPendingPayment(paymentId: string, opts?: { expireIfPending?: boolean }) {
    const payment = await paymentRepository.findById(paymentId);
    if (!payment) return { status: "NOT_FOUND" as const };
    if (payment.status === "CONFIRMED") return { status: "CONFIRMED" as const };
    if (payment.status === "FAILED") return { status: "FAILED" as const };

    if (opts?.expireIfPending) {
      await this.failPayment(payment.id, "Payment timed out after 10 minutes — stock reservation released");
      return { status: "FAILED" as const };
    }

    if (
      payment.method === "MTN_MOMO" &&
      payment.externalId &&
      process.env.MTN_MOMO_SUBSCRIPTION_KEY
    ) {
      const providerStatus = await checkMtnPaymentStatus(payment.externalId);
      if (providerStatus === "SUCCESSFUL") {
        await this.confirmPayment(payment.id);
        return { status: "CONFIRMED" as const };
      }
      if (providerStatus === "FAILED") {
        await this.failPayment(payment.id, "Customer declined or payment failed on phone");
        return { status: "FAILED" as const };
      }
    }

    return { status: "PENDING" as const };
  },

  async getStatus(opts: { orderId?: string; orderNumber?: string }) {
    const order = await orderRepository.findByIdOrNumber(opts);
    if (!order?.payment) return null;

    if (order.payment.status === "PENDING") {
      await this.verifyPendingPayment(order.payment.id);
    }

    const fresh = await orderRepository.findByIdOrNumber(opts);
    return fresh;
  },
};
