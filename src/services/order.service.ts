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
import { enqueueAnalytics, enqueueJob } from "@/jobs/queue";
import { cacheDel, CacheKeys } from "@/lib/redis";
import { generateOrderNumber, getDeliveryFee } from "@/services/settings.service";
import { writeAuditLog } from "@/lib/audit";
import { notifyAdmins } from "@/lib/notify-admins";
import {
  cartFulfillmentEta,
  formatBackorderEta,
  formatZoneEta,
  zoneEtaMinutes,
} from "@/lib/delivery-eta";
import type { DeliveryZoneKey } from "@/lib/utils";

function resolveUnitCost(product: {
  purchasePrice: number | null;
  farmGatePrice: number | null;
  pricePerUnit: number | null;
  price: number;
}) {
  if (product.purchasePrice != null && product.purchasePrice > 0) return product.purchasePrice;
  if (product.farmGatePrice != null && product.farmGatePrice > 0) return product.farmGatePrice;
  if (product.pricePerUnit != null && product.pricePerUnit > 0) return product.pricePerUnit;
  // Fallback estimate when cost not yet set — ~65% of retail for internal margin visibility
  return Math.round(product.price * 0.65);
}

async function nextReceiptNumber(year: number) {
  const prefix = `RCP-${year}-`;
  const latest = await prisma.order.findFirst({
    where: { receiptNumber: { startsWith: prefix } },
    orderBy: { receiptNumber: "desc" },
    select: { receiptNumber: true },
  });
  const last = latest?.receiptNumber ? Number(latest.receiptNumber.slice(prefix.length)) : 0;
  const n = Number.isFinite(last) ? last + 1 : 1;
  return `${prefix}${String(n).padStart(6, "0")}`;
}

export const createOrderSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  phone: z.string().min(8, "Enter a valid phone number (e.g. 078xxxxxxx)"),
  address: z.string().min(5, "Delivery address is required"),
  deliveryDistrict: z.string().optional(),
  deliverySector: z.string().optional(),
  deliveryCell: z.string().optional(),
  deliveryVillage: z.string().optional(),
  deliveryZone: z.enum(["KIGALI", "KAMONYI_RUYENZI", "BUGESERA_NYAMATA"]),
  deliverySlot: z.enum(["TODAY", "TOMORROW", "SCHEDULED"]).optional(),
  scheduledFor: z.string().optional(),
  gpsLat: z.string().optional(),
  gpsLng: z.string().optional(),
  instructions: z.string().optional(),
  paymentMethod: z.enum(["MTN_MOMO", "AIRTEL_MONEY"]),
  paymentPhone: z.string().optional(),
  promoCode: z.string().optional(),
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
    if (!data.paymentPhone || data.paymentPhone.length < 8) {
      throw new Error("Enter your MoMo / Airtel phone number (e.g. 078xxxxxxx)");
    }

    const status = await getBusinessStatus();
    const slot = (data.deliverySlot || "TODAY") as DeliverySlot;
    const zoneKey = data.deliveryZone as DeliveryZoneKey;

    let scheduledFor: Date | null = null;
    let estimatedDelivery = formatZoneEta(zoneKey);
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
      throw new Error("Some products could not be found");
    }

    const productMap = Object.fromEntries(products.map((p) => [p.id, p]));
    let subtotal = 0;
    let needsRestock = false;
    const lineItems = data.items.map((item) => {
      const product = productMap[item.productId];
      const available = availableQty(product.stockQty, product.reservedQty);
      if (available < item.quantity) {
        needsRestock = true;
      }
      const lineTotal = Math.round(product.price * item.quantity);
      const unitCostPrice = resolveUnitCost(product);
      const costTotal = Math.round(unitCostPrice * item.quantity);
      const marginTotal = lineTotal - costTotal;
      subtotal += lineTotal;
      return {
        productId: product.id,
        supplierId: product.supplierId,
        quantity: item.quantity,
        unitPrice: product.price,
        lineTotal,
        unitCostPrice,
        costTotal,
        marginTotal,
        allowBackorder: available < item.quantity,
      };
    });

    // Any restock line → customer sees 6–12 hours (never “unavailable”)
    if (needsRestock && (slot === "TODAY" || !data.deliverySlot)) {
      estimatedDelivery = formatBackorderEta();
    } else if (!needsRestock && slot === "TODAY" && status.canCheckout) {
      estimatedDelivery = formatZoneEta(zoneKey);
    }

    const fulfillment = cartFulfillmentEta(
      data.items.map((i) => ({
        stockQty: productMap[i.productId].stockQty,
        quantity: i.quantity,
      })),
      zoneKey,
      slot
    );
    if (fulfillment.needsRestock && slot === "TODAY") {
      estimatedDelivery = fulfillment.etaLabel;
    }

    const merchant = huzaPayee();
    let deliveryFee = await getDeliveryFee(data.deliveryZone);
    let discount = 0;
    let appliedPromo: string | null = null;

    if (data.promoCode) {
      const code = data.promoCode.trim().toUpperCase();
      const promo = await prisma.promotion.findFirst({
        where: {
          code,
          isActive: true,
          OR: [{ startsAt: null }, { startsAt: { lte: new Date() } }],
        },
      });
      if (promo && (!promo.endsAt || promo.endsAt >= new Date())) {
        appliedPromo = promo.code;
        if (promo.freeDelivery) deliveryFee = 0;
        if (promo.discountPct) discount += Math.round((subtotal * promo.discountPct) / 100);
        if (promo.discountAmt) discount += promo.discountAmt;
        if (promo.isLoyalty && promo.loyaltyPoints && userId) {
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { loyaltyPoints: true },
          });
          if (!user || user.loyaltyPoints < promo.loyaltyPoints) {
            throw new Error(`Need ${promo.loyaltyPoints} loyalty points to use this reward`);
          }
          await prisma.user.update({
            where: { id: userId },
            data: { loyaltyPoints: { decrement: promo.loyaltyPoints } },
          });
        }
      }
    }

    discount = Math.min(discount, subtotal);
    const total = Math.max(0, subtotal - discount + deliveryFee);
    const orderNumber = await generateOrderNumber();
    const receiptNumber = await nextReceiptNumber(new Date().getFullYear());
    const payPhone = data.paymentPhone!;
    const estimatedMinutes = needsRestock
      ? fulfillment.estimatedMinutes
      : zoneEtaMinutes(zoneKey);

    // Step 1 — create pending order and reserve stock (backorders allowed)
    const order = await prisma.$transaction(async (tx) => {
      for (const item of lineItems) {
        const updated = await productRepository.reserveStock(tx, item.productId, item.quantity, {
          allowBackorder: item.allowBackorder,
        });
        await tx.stockHistory.create({
          data: {
            productId: item.productId,
            change: 0,
            reason: item.allowBackorder
              ? `Backorder reserved ${item.quantity} for ${orderNumber} (ETA 6–12h)`
              : `Reserved ${item.quantity} for pending order ${orderNumber}`,
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

      const createItems = lineItems.map(({ allowBackorder: _a, ...rest }) => rest);

      return tx.order.create({
        data: {
          orderNumber,
          receiptNumber,
          userId,
          guestName: data.fullName,
          guestPhone: data.phone,
          deliveryAddress: data.address,
          deliveryDistrict: data.deliveryDistrict || null,
          deliverySector: data.deliverySector || null,
          deliveryCell: data.deliveryCell || null,
          deliveryVillage: data.deliveryVillage || null,
          deliveryZone: data.deliveryZone as DeliveryZone,
          deliveryFee,
          gpsLat: data.gpsLat ? Number(data.gpsLat) : null,
          gpsLng: data.gpsLng ? Number(data.gpsLng) : null,
          deliveryInstructions: data.instructions || null,
          deliverySlot: slot,
          estimatedDelivery,
          subtotal,
          discountAmt: discount,
          promoCode: appliedPromo,
          total,
          status: OrderStatus.PENDING,
          scheduledFor,
          items: { create: createItems },
          payment: {
            create: {
              method: data.paymentMethod as PaymentMethod,
              phoneNumber: normalizeMsisdn(payPhone),
              amount: total,
              status: PaymentStatus.PENDING,
              payeePhone: normalizeMsisdn(merchant.phone),
              payeeName: merchant.name,
              providerMessage: needsRestock
                ? "Payment request queued — restock ETA 6–12 hours after payment"
                : "Payment request queued — stock reserved for 10 minutes",
            },
          },
          delivery: {
            create: {
              status: OrderStatus.PENDING,
              estimatedMinutes,
            },
          },
          statusLog: {
            create: [
              {
                status: OrderStatus.PENDING,
                note: needsRestock
                  ? `Pending payment — delivery ETA ${estimatedDelivery} (fresh stock being prepared)`
                  : "Pending order — stock reserved awaiting MoMo/Airtel payment",
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
      action: "order.create_pending",
      entity: "Order",
      entityId: order.id,
      details: `${orderNumber} · ${receiptNumber} · ${total} RWF · ${data.paymentMethod}`,
    });

    // Do not block the customer response on admin inbox writes.
    void notifyAdmins({
      type: "ORDER_CONFIRMATION",
      title: "New order received",
      body: `${orderNumber} · ${data.fullName} · ${total} RWF · Pending payment`,
    }).catch(() => undefined);

    // Auto-release reservation if unpaid after 10 minutes
    if (order.payment?.id) {
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
    });

    // Step 2 — initiate MoMo/Airtel promptly so the phone prompt appears, then queue verification
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
      // Release reservation if payment initiation fails
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
      estimatedDelivery,
      needsRestock,
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
