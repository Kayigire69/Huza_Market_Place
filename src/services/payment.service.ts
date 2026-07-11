import { OrderStatus } from "@prisma/client";
import { checkMtnPaymentStatus, disburseToSeller } from "@/lib/payments/mobile-money";
import { orderRepository } from "@/repositories/order.repository";
import { paymentRepository } from "@/repositories/payment.repository";
import { productRepository } from "@/repositories/product.repository";
import { prisma } from "@/lib/prisma";
import { enqueueAnalytics, enqueueEmail, enqueueSms } from "@/jobs/queue";
import { cacheDel, CacheKeys } from "@/lib/redis";

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

    // Outbound messaging happens in the background — customer already got a fast response
    await enqueueSms(
      payment.phoneNumber,
      `HUZA FRESH: Payment of ${payment.amount} RWF for ${payment.order.orderNumber} confirmed.`
    );
    if (payment.order.guestPhone || payment.order.userId) {
      await enqueueEmail(
        `${payment.order.guestPhone || "customer"}@notify.huza.local`,
        `Payment confirmed — ${payment.order.orderNumber}`,
        `Your payment of ${payment.amount} RWF was confirmed. Youth Huza is preparing your order.`
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
    if (!payment || payment.status === "CONFIRMED") return payment;

    await paymentRepository.markFailed(paymentId, reason);
    await orderRepository.updateStatus(payment.orderId, OrderStatus.CANCELLED, reason);

    // Restore reserved stock
    await prisma.$transaction(async (tx) => {
      for (const item of payment.order.items) {
        await productRepository.incrementStock(tx, item.productId, item.quantity);
        await tx.stockHistory.create({
          data: {
            productId: item.productId,
            change: item.quantity,
            reason: `Payment failed — ${payment.order.orderNumber}`,
          },
        });
      }
    });

    await cacheDel(CacheKeys.homeCatalog);
    await enqueueAnalytics("payment.failed", {
      orderNumber: payment.order.orderNumber,
      reason,
    });

    return payment;
  },

  /** Poll provider (or no-op in demo) and confirm/fail as needed */
  async verifyPendingPayment(paymentId: string) {
    const payment = await paymentRepository.findById(paymentId);
    if (!payment) return { status: "NOT_FOUND" as const };
    if (payment.status === "CONFIRMED") return { status: "CONFIRMED" as const };
    if (payment.status === "FAILED") return { status: "FAILED" as const };

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

    // Kick a background verify when still pending (non-blocking for callers that enqueue)
    if (order.payment.status === "PENDING") {
      await this.verifyPendingPayment(order.payment.id);
    }

    const fresh = await orderRepository.findByIdOrNumber(opts);
    return fresh;
  },
};
