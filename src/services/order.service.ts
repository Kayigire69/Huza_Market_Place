import { z } from "zod";
import {
  DeliverySlot,
  DeliveryZone,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@prisma/client";
import { getBusinessStatus } from "@/lib/business-hours";
import { initiateMobileMoneyPayment, normalizeMsisdn } from "@/lib/payments/mobile-money";
import { prisma } from "@/lib/prisma";
import { productRepository, availableQty } from "@/repositories/product.repository";
import { enqueueAnalytics, enqueueJob, enqueueSms } from "@/jobs/queue";
import { cacheDel, CacheKeys } from "@/lib/redis";
import { generateOrderNumber, getDeliveryFee } from "@/services/settings.service";
import { writeAuditLog } from "@/lib/audit";

export const createOrderSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  phone: z.string().min(8, "Enter a valid phone number (e.g. 078xxxxxxx)"),
  address: z.string().min(5, "Delivery address is required"),
  deliveryZone: z.enum(["KIGALI", "KAMONYI_RUYENZI", "BUGESERA_NYAMATA"]),
  deliverySlot: z.enum(["TODAY", "TOMORROW", "SCHEDULED"]).optional(),
  scheduledFor: z.string().optional(),
  gpsLat: z.string().optional(),
  gpsLng: z.string().optional(),
  instructions: z.string().optional(),
  paymentMethod: z.enum(["MTN_MOMO", "AIRTEL_MONEY", "CASH_ON_DELIVERY"]),
  paymentPhone: z.string().optional(),
  items: z.array(z.object({ productId: z.string(), quantity: z.number().positive() })).min(1),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

function huzaPayee() {
  const phone =
    process.env.HUZA_MERCHANT_PHONE ||
    process.env.NEXT_PUBLIC_HUZA_MERCHANT_PHONE ||
    "0788000000";
  return {
    phone,
    name: process.env.HUZA_MERCHANT_NAME || "Youth Huza — HUZA FRESH",
  };
}

/**
 * Checkout business logic:
 * 1) Create PENDING order (reserve stock)
 * 2) Return quickly to the customer
 * 3) MoMo initiation + verification continue via background jobs
 */
export const orderService = {
  async createOrder(input: CreateOrderInput, userId?: string) {
    const data = createOrderSchema.parse(input);
    if (data.paymentMethod !== "CASH_ON_DELIVERY") {
      if (!data.paymentPhone || data.paymentPhone.length < 8) {
        throw new Error("Enter your MoMo / Airtel phone number (e.g. 078xxxxxxx)");
      }
    }

    const status = await getBusinessStatus();
    const slot = (data.deliverySlot || "TODAY") as DeliverySlot;

    let scheduledFor: Date | null = null;
    let estimatedDelivery = "Today";
    if (slot === "TOMORROW") {
      const next = new Date();
      next.setDate(next.getDate() + 1);
      next.setHours(status.openHour ?? 6, 0, 0, 0);
      scheduledFor = next;
      estimatedDelivery = "Tomorrow";
    } else if (slot === "SCHEDULED" && data.scheduledFor) {
      scheduledFor = new Date(data.scheduledFor);
      estimatedDelivery = scheduledFor.toLocaleString();
    } else if (!status.canCheckout) {
      const next = new Date();
      next.setDate(next.getDate() + 1);
      next.setHours(status.openHour ?? 6, 0, 0, 0);
      scheduledFor = next;
      estimatedDelivery = "Tomorrow (outside business hours)";
    }

    const productIds = data.items.map((i) => i.productId);
    const products = await productRepository.findActiveByIds(productIds);
    if (products.length !== data.items.length) {
      throw new Error("Some products are unavailable");
    }

    const productMap = Object.fromEntries(products.map((p) => [p.id, p]));
    let subtotal = 0;
    const lineItems = data.items.map((item) => {
      const product = productMap[item.productId];
      const available = availableQty(product.stockQty, product.reservedQty);
      if (available < item.quantity) {
        throw new Error(`Insufficient stock for ${product.nameEn} (${available} available)`);
      }
      const lineTotal = Math.round(product.price * item.quantity);
      subtotal += lineTotal;
      return {
        productId: product.id,
        supplierId: product.supplierId,
        quantity: item.quantity,
        unitPrice: product.price,
        lineTotal,
      };
    });

    const merchant = huzaPayee();
    const deliveryFee = await getDeliveryFee(data.deliveryZone);
    const total = subtotal + deliveryFee;
    const orderNumber = await generateOrderNumber();
    const isCod = data.paymentMethod === "CASH_ON_DELIVERY";
    const payPhone = isCod ? data.phone : data.paymentPhone!;

    // Step 1 — create pending order
    // MoMo: reserve stock (reservedQty↑). COD: sell immediately (stockQty↓).
    const order = await prisma.$transaction(async (tx) => {
      for (const item of lineItems) {
        if (isCod) {
          const updated = await productRepository.sellNow(tx, item.productId, item.quantity);
          await tx.stockHistory.create({
            data: {
              productId: item.productId,
              change: -item.quantity,
              reason: `Order ${orderNumber} (COD sale)`,
            },
          });
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              type: "SALE",
              quantity: -Math.floor(item.quantity),
              reason: `Order ${orderNumber}`,
            },
          });
          if (updated.stockQty <= updated.lowStockAt) {
            await tx.notification.create({
              data: {
                type: "LOW_STOCK",
                channel: "IN_APP",
                title: "Low stock alert",
                body: `Product ${updated.nameEn} is low (${updated.stockQty} left).`,
              },
            });
          }
        } else {
          const updated = await productRepository.reserveStock(tx, item.productId, item.quantity);
          await tx.stockHistory.create({
            data: {
              productId: item.productId,
              change: 0,
              reason: `Reserved ${item.quantity} for pending order ${orderNumber}`,
            },
          });
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              type: "ADJUST",
              quantity: 0,
              reason: `Reservation ${orderNumber} (+${item.quantity} reserved; available ${availableQty(updated.stockQty, updated.reservedQty)})`,
            },
          });
        }
      }

      return tx.order.create({
        data: {
          orderNumber,
          userId,
          guestName: data.fullName,
          guestPhone: data.phone,
          deliveryAddress: data.address,
          deliveryZone: data.deliveryZone as DeliveryZone,
          deliveryFee,
          gpsLat: data.gpsLat ? Number(data.gpsLat) : null,
          gpsLng: data.gpsLng ? Number(data.gpsLng) : null,
          deliveryInstructions: data.instructions || null,
          deliverySlot: slot,
          estimatedDelivery,
          subtotal,
          total,
          status: isCod ? OrderStatus.CONFIRMED : OrderStatus.PENDING,
          scheduledFor,
          items: { create: lineItems },
          payment: {
            create: {
              method: data.paymentMethod as PaymentMethod,
              phoneNumber: normalizeMsisdn(payPhone),
              amount: total,
              status: PaymentStatus.PENDING,
              payeePhone: isCod ? null : normalizeMsisdn(merchant.phone),
              payeeName: merchant.name,
              providerMessage: isCod
                ? "Cash on delivery — collect from customer"
                : "Payment request queued — stock reserved for 10 minutes",
            },
          },
          delivery: {
            create: {
              status: OrderStatus.PENDING,
              estimatedMinutes: data.deliveryZone === "KIGALI" ? 45 : 75,
            },
          },
          statusLog: {
            create: [
              {
                status: isCod ? OrderStatus.CONFIRMED : OrderStatus.PENDING,
                note: isCod
                  ? "Order placed — cash on delivery"
                  : "Pending order — stock reserved awaiting payment",
              },
            ],
          },
        },
        include: { payment: true },
      });
    });

    await writeAuditLog({
      actorId: userId,
      actorName: data.fullName,
      action: isCod ? "order.create_cod" : "order.create_pending",
      entity: "Order",
      entityId: order.id,
      details: `${orderNumber} · ${total} RWF · ${data.paymentMethod}`,
    });

    // MoMo: auto-release reservation if unpaid after 10 minutes
    if (!isCod && order.payment?.id) {
      await enqueueJob(
        "PAYMENT_VERIFY",
        { paymentId: order.payment.id, orderNumber, expireIfPending: true },
        { runAfter: new Date(Date.now() + 10 * 60 * 1000), maxAttempts: 3 }
      );
    }

    await cacheDel(CacheKeys.homeCatalog);
    await enqueueAnalytics("order.created", {
      orderNumber,
      total,
      method: data.paymentMethod,
      isCod,
    });

    if (isCod) {
      if (userId) {
        await prisma.notification.create({
          data: {
            userId,
            type: "ORDER_CONFIRMATION",
            channel: "IN_APP",
            title: "Order confirmed",
            body: `Order ${order.orderNumber} placed. Pay cash on delivery. ETA: ${estimatedDelivery}.`,
          },
        });
      }
      await enqueueSms(
        data.phone,
        `HUZA FRESH: Order ${order.orderNumber} confirmed (cash on delivery). ETA: ${estimatedDelivery}.`
      );

      return {
        orderNumber: order.orderNumber,
        id: order.id,
        paymentId: order.payment?.id,
        scheduledFor,
        total,
        paymentStatus: "PENDING" as const,
        paymentMode: "demo" as const,
        paymentMessage: "Cash on delivery confirmed. Youth Huza will deliver your order.",
        payerPhone: data.phone,
        payeeName: merchant.name,
        payeePhone: merchant.phone,
        method: data.paymentMethod,
      };
    }

    // Step 2 — initiate MoMo promptly so the phone prompt appears, then queue verification
    let paymentResult;
    try {
      paymentResult = await initiateMobileMoneyPayment({
        method: data.paymentMethod as "MTN_MOMO" | "AIRTEL_MONEY",
        payerPhone: data.paymentPhone!,
        payeePhone: merchant.phone,
        payeeName: merchant.name,
        amount: total,
        orderNumber,
      });
    } catch (payErr) {
      await prisma.payment.update({
        where: { orderId: order.id },
        data: {
          status: PaymentStatus.FAILED,
          providerMessage: payErr instanceof Error ? payErr.message : "Payment request failed",
        },
      });
      // Release reservation if MoMo initiation fails
      await prisma.$transaction(async (tx) => {
        for (const item of lineItems) {
          await productRepository.releaseReservation(tx, item.productId, item.quantity);
        }
      });
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.CANCELLED,
          statusLog: {
            create: { status: OrderStatus.CANCELLED, note: "Payment initiation failed" },
          },
        },
      });
      throw payErr;
    }

    await prisma.payment.update({
      where: { orderId: order.id },
      data: {
        status: PaymentStatus.PENDING,
        externalId: paymentResult.externalId,
        transactionRef: paymentResult.transactionRef,
        providerMessage: paymentResult.message,
      },
    });

    // Step 3 — verify in background (customer does not wait here)
    if (order.payment?.id) {
      await enqueueJob(
        "PAYMENT_VERIFY",
        { paymentId: order.payment.id, orderNumber },
        { runAfter: new Date(Date.now() + 3_000), maxAttempts: 20 }
      );
    }

    if (userId) {
      await prisma.notification.create({
        data: {
          userId,
          type: "ORDER_CONFIRMATION",
          channel: "IN_APP",
          title: "Approve payment on your phone",
          body: `Order ${order.orderNumber}: approve ${data.paymentMethod === "MTN_MOMO" ? "MTN MoMo" : "Airtel Money"} on ${data.paymentPhone}. You are paying Youth Huza (HUZA FRESH). ETA: ${estimatedDelivery}.`,
        },
      });
    }

    return {
      orderNumber: order.orderNumber,
      id: order.id,
      paymentId: order.payment?.id,
      scheduledFor,
      total,
      paymentStatus: "PENDING" as const,
      paymentMode: paymentResult.mode,
      paymentMessage: paymentResult.message,
      payerPhone: data.paymentPhone,
      payeeName: merchant.name,
      payeePhone: merchant.phone,
      method: data.paymentMethod,
    };
  },
};
