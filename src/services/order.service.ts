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
import {
  LIVE_PAYMENT_TIMEOUT_MS,
  MANUAL_PAYMENT_TIMEOUT_MS,
} from "@/lib/payments/huza-payee";
import { isValidRwandaMomoPhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { productRepository, availableQty } from "@/repositories/product.repository";
import { enqueueAnalytics, enqueueJob } from "@/jobs/queue";
import { cacheDel, CacheKeys } from "@/lib/redis";
import { generateOrderNumber, getHuzaPayee, getPickupInfo, isPaymentMethodEnabled } from "@/services/settings.service";
import { HOME_DELIVERY_FEE_NOTICE } from "@/lib/pickup-info";
import { writeAuditLog } from "@/lib/audit";
import { notifyAdmins } from "@/lib/notify-admins";
import { createOrderDocToken } from "@/lib/security-access";
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
  // Fallback estimate when cost not yet set. ~65% of retail for internal margin visibility
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
  /** Required for home delivery; for pickup we store the Youth Huza pickup address */
  address: z.string().optional(),
  fulfillmentMethod: z.enum(["PICKUP", "HOME_DELIVERY"]).default("HOME_DELIVERY"),
  deliveryDistrict: z.string().optional(),
  deliverySector: z.string().optional(),
  deliveryCell: z.string().optional(),
  deliveryVillage: z.string().optional(),
  deliveryZone: z.enum(["KIGALI", "KAMONYI_RUYENZI", "BUGESERA_NYAMATA"]).optional(),
  deliverySlot: z.enum(["TODAY", "TOMORROW", "SCHEDULED"]).optional(),
  scheduledFor: z.string().optional(),
  gpsLat: z.string().optional(),
  gpsLng: z.string().optional(),
  instructions: z.string().optional(),
  paymentMethod: z.enum(["MTN_MOMO", "AIRTEL_MONEY"]),
  paymentPhone: z.string().optional(),
  promoCode: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.coerce.number().int().positive().max(999),
      })
    )
    .min(1),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

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
    if (!isValidRwandaMomoPhone(data.paymentPhone)) {
      throw new Error("Enter a valid MTN (078/079) or Airtel (072/073) phone number");
    }
    if (!isValidRwandaMomoPhone(data.phone)) {
      throw new Error("Enter a valid Rwandan mobile number for contact");
    }

    const fulfillmentMethod = data.fulfillmentMethod || "HOME_DELIVERY";
    const pickupInfo = await getPickupInfo();

    if (fulfillmentMethod === "HOME_DELIVERY") {
      if (!data.address || data.address.trim().length < 5) {
        throw new Error("Delivery address is required for home delivery");
      }
    }

    const resolvedAddress =
      fulfillmentMethod === "PICKUP"
        ? `Pickup: ${pickupInfo.locationName} — ${pickupInfo.address}`
        : data.address!.trim();

    // Merge duplicate product lines before stock lookup
    const mergedQty = new Map<string, number>();
    for (const item of data.items) {
      const qty = Math.max(0.01, Number(item.quantity) || 0);
      mergedQty.set(item.productId, (mergedQty.get(item.productId) || 0) + qty);
    }
    data.items = [...mergedQty.entries()].map(([productId, quantity]) => ({
      productId,
      quantity,
    }));

    const methodOk = await isPaymentMethodEnabled(
      data.paymentMethod as "MTN_MOMO" | "AIRTEL_MONEY"
    );
    if (!methodOk) {
      throw new Error(
        data.paymentMethod === "MTN_MOMO"
          ? "MTN MoMo is temporarily unavailable. Try Airtel Money."
          : "Airtel Money is temporarily unavailable. Try MTN MoMo."
      );
    }

    const status = await getBusinessStatus();
    const slot = (data.deliverySlot || "TODAY") as DeliverySlot;
    const zoneKey = (data.deliveryZone || "KIGALI") as DeliveryZoneKey;

    let scheduledFor: Date | null = null;
    let estimatedDelivery =
      fulfillmentMethod === "PICKUP"
        ? "Ready for collection — we will notify you"
        : formatZoneEta(zoneKey);
    if (fulfillmentMethod === "HOME_DELIVERY" && slot === "TOMORROW") {
      const next = new Date();
      next.setDate(next.getDate() + 1);
      next.setHours(status.openHour ?? 6, 0, 0, 0);
      scheduledFor = next;
      estimatedDelivery = "Tomorrow (delivery time confirmed by phone)";
    } else if (fulfillmentMethod === "HOME_DELIVERY" && slot === "SCHEDULED" && data.scheduledFor) {
      scheduledFor = new Date(data.scheduledFor);
      estimatedDelivery = scheduledFor.toLocaleString();
    } else if (fulfillmentMethod === "HOME_DELIVERY" && !status.canCheckout) {
      const next = new Date();
      next.setDate(next.getDate() + 1);
      next.setHours(status.openHour ?? 6, 0, 0, 0);
      scheduledFor = next;
      estimatedDelivery = "Tomorrow (outside business hours — we will call you)";
    } else if (fulfillmentMethod === "HOME_DELIVERY") {
      estimatedDelivery = "Our team will confirm delivery time by phone";
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
      if (!product.price || product.price <= 0) {
        throw new Error(`Invalid price for ${product.nameEn}`);
      }
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

    // Any restock line → customer soft ETA (never “unavailable”)
    if (needsRestock && fulfillmentMethod === "PICKUP") {
      estimatedDelivery = `Ready for collection after stock arrives (${formatBackorderEta()})`;
    } else if (needsRestock && (slot === "TODAY" || !data.deliverySlot)) {
      estimatedDelivery = formatBackorderEta();
    } else if (
      fulfillmentMethod === "HOME_DELIVERY" &&
      !needsRestock &&
      slot === "TODAY" &&
      status.canCheckout
    ) {
      estimatedDelivery = "Our team will confirm delivery time by phone";
    }

    const fulfillment = cartFulfillmentEta(
      data.items.map((i) => ({
        stockQty: productMap[i.productId].stockQty,
        reservedQty: productMap[i.productId].reservedQty,
        quantity: i.quantity,
      })),
      zoneKey,
      slot
    );
    if (fulfillment.needsRestock && slot === "TODAY" && fulfillmentMethod === "HOME_DELIVERY") {
      estimatedDelivery = fulfillment.etaLabel;
    }

    const merchant = await getHuzaPayee();
    // No system-calculated delivery fee: pickup is free; home delivery fee is agreed offline.
    let deliveryFee = 0;
    let discount = 0;
    let appliedPromo: string | null = null;
    let loyaltyPointsToSpend = 0;

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
        if (promo.discountPct) discount += Math.round((subtotal * promo.discountPct) / 100);
        if (promo.discountAmt) discount += promo.discountAmt;
        if (promo.isLoyalty && promo.loyaltyPoints) {
          if (!userId) {
            throw new Error("Log in to redeem loyalty rewards");
          }
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { loyaltyPoints: true },
          });
          if (!user || user.loyaltyPoints < promo.loyaltyPoints) {
            throw new Error(`Need ${promo.loyaltyPoints} loyalty points to use this reward`);
          }
          loyaltyPointsToSpend = promo.loyaltyPoints;
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

    // Step 1. Create pending order and reserve stock (backorders allowed)
    const order = await prisma.$transaction(async (tx) => {
      if (loyaltyPointsToSpend > 0 && userId) {
        const updated = await tx.user.updateMany({
          where: { id: userId, loyaltyPoints: { gte: loyaltyPointsToSpend } },
          data: { loyaltyPoints: { decrement: loyaltyPointsToSpend } },
        });
        if (updated.count === 0) {
          throw new Error(`Need ${loyaltyPointsToSpend} loyalty points to use this reward`);
        }
      }

      for (const item of lineItems) {
        const updated = await productRepository.reserveStock(tx, item.productId, item.quantity, {
          allowBackorder: item.allowBackorder,
        });
        await tx.stockHistory.create({
          data: {
            productId: item.productId,
            change: 0,
            reason: item.allowBackorder
              ? `Backorder reserved ${item.quantity} for ${orderNumber} (ETA: ${formatBackorderEta()})`
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
          deliveryAddress: resolvedAddress,
          deliveryDistrict: data.deliveryDistrict || null,
          deliverySector: data.deliverySector || null,
          deliveryCell: data.deliveryCell || null,
          deliveryVillage: data.deliveryVillage || null,
          deliveryZone: zoneKey as DeliveryZone,
          deliveryFee,
          fulfillmentMethod,
          gpsLat: data.gpsLat ? Number(data.gpsLat) : null,
          gpsLng: data.gpsLng ? Number(data.gpsLng) : null,
          deliveryInstructions:
            fulfillmentMethod === "HOME_DELIVERY"
              ? [data.instructions?.trim(), HOME_DELIVERY_FEE_NOTICE].filter(Boolean).join("\n\n")
              : data.instructions || null,
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
                ? `Payment request queued. Restock ETA: ${formatBackorderEta()} after payment`
                : "Payment request queued. Stock reserved",
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
                note:
                  fulfillmentMethod === "PICKUP"
                    ? needsRestock
                      ? `Pickup Required. Pending payment. Collection: ${estimatedDelivery}`
                      : "Pickup Required. Pending payment. Free collection at Youth Huza"
                    : needsRestock
                      ? `Delivery Required. Pending payment. Fee confirmed by phone. ${estimatedDelivery}`
                      : "Delivery Required. Pending payment. Delivery fee confirmed by phone before dispatch",
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
      details: `${orderNumber} · ${receiptNumber} · ${total} RWF · ${fulfillmentMethod} · ${data.paymentMethod}`,
    });

    // Do not block the customer response on admin inbox writes.
    // Admin notify runs after payment initiation succeeds (see below).

    // Auto-expire unpaid reservations after MoMo timeout (scheduled after initiate knows live vs manual)
    // Initiate MoMo/Airtel (or manual pay-in), then queue verification + expire
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
        if (userId && loyaltyPointsToSpend > 0) {
          await tx.user.update({
            where: { id: userId },
            data: { loyaltyPoints: { increment: loyaltyPointsToSpend } },
          });
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

    const networkLabel = data.paymentMethod === "MTN_MOMO" ? "MTN MoMo" : "Airtel Money";
    const fulfillLabel = fulfillmentMethod === "PICKUP" ? "Pickup Required" : "Delivery Required";
    void notifyAdmins({
      type: "ORDER_CONFIRMATION",
      title:
        paymentResult.mode === "manual"
          ? `Pending MoMo: ${orderNumber}`
          : `New order: ${orderNumber}`,
      body:
        paymentResult.mode === "manual"
          ? `${fulfillLabel} · ${total.toLocaleString("en-RW")} RWF · ${data.fullName} · payer ${data.paymentPhone} · ${networkLabel}. Confirm in Payments when money arrives.`
          : `${fulfillLabel} · ${total.toLocaleString("en-RW")} RWF · ${data.fullName} · ${data.paymentPhone} · awaiting phone approval.`,
    }).catch(() => undefined);

    const expireMs =
      paymentResult.mode === "manual" ? MANUAL_PAYMENT_TIMEOUT_MS : LIVE_PAYMENT_TIMEOUT_MS;

    if (order.payment?.id) {
      await enqueueJob(
        "PAYMENT_VERIFY",
        { paymentId: order.payment.id, orderNumber, expireIfPending: true },
        { runAfter: new Date(Date.now() + expireMs), maxAttempts: 3 }
      );
      await enqueueJob(
        "PAYMENT_VERIFY",
        { paymentId: order.payment.id, orderNumber },
        { runAfter: new Date(Date.now() + 3_000), maxAttempts: 20 }
      );
    }

    if (userId) {
      const notifyBody =
        paymentResult.mode === "manual"
          ? `Order ${order.orderNumber}: send ${total} RWF via ${data.paymentMethod === "MTN_MOMO" ? "MTN MoMo" : "Airtel Money"} to ${merchant.name} (${merchant.phone}). Use the order number as the payment message. We will confirm when payment arrives.`
          : `Order ${order.orderNumber}: approve ${data.paymentMethod === "MTN_MOMO" ? "MTN MoMo" : "Airtel Money"} on ${data.paymentPhone}. You are paying Youth Huza (HUZA FRESH). ETA: ${estimatedDelivery}.`;
      await prisma.notification.create({
        data: {
          userId,
          type: "ORDER_CONFIRMATION",
          channel: "IN_APP",
          title:
            paymentResult.mode === "manual"
              ? "Send MoMo payment to Youth Huza"
              : "Approve payment on your phone",
          body: notifyBody,
        },
      });
    }

    await cacheDel(CacheKeys.homeCatalog);
    await enqueueAnalytics("order.created", {
      orderNumber,
      total,
      method: data.paymentMethod,
    });

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
      fulfillmentMethod,
      docAccessToken: createOrderDocToken(order.orderNumber),
    };
  },
};
