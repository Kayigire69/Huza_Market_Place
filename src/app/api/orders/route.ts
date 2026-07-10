import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getBusinessStatus } from "@/lib/business-hours";
import { DELIVERY_FEES, generateOrderNumber } from "@/lib/utils";
import { initiateMobileMoneyPayment, normalizeMsisdn } from "@/lib/payments/mobile-money";
import { DeliverySlot, DeliveryZone, OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";

const schema = z.object({
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

/** Youth Huza merchant number that receives customer payments */
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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = schema.parse(body);
    if (data.paymentMethod !== "CASH_ON_DELIVERY") {
      if (!data.paymentPhone || data.paymentPhone.length < 8) {
        return NextResponse.json(
          { error: "Enter your MoMo / Airtel phone number (e.g. 078xxxxxxx)" },
          { status: 400 }
        );
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

    const session = await getServerSession(authOptions);
    const productIds = data.items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      include: { supplier: true },
    });

    if (products.length !== data.items.length) {
      return NextResponse.json({ error: "Some products are unavailable" }, { status: 400 });
    }

    const productMap = Object.fromEntries(products.map((p) => [p.id, p]));
    let subtotal = 0;
    const lineItems = data.items.map((item) => {
      const product = productMap[item.productId];
      if (product.stockQty < item.quantity) {
        throw new Error(`Insufficient stock for ${product.nameEn}`);
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
    const deliveryFee = DELIVERY_FEES[data.deliveryZone as keyof typeof DELIVERY_FEES];
    const total = subtotal + deliveryFee;
    const orderNumber = generateOrderNumber();
    const isCod = data.paymentMethod === "CASH_ON_DELIVERY";
    const payPhone = isCod ? data.phone : data.paymentPhone!;

    const order = await prisma.$transaction(async (tx) => {
      for (const item of lineItems) {
        const updated = await tx.product.update({
          where: { id: item.productId },
          data: { stockQty: { decrement: item.quantity } },
        });
        await tx.stockHistory.create({
          data: {
            productId: item.productId,
            change: -item.quantity,
            reason: `Order ${orderNumber}`,
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
      }

      return tx.order.create({
        data: {
          orderNumber,
          userId: session?.user?.id,
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
              status: isCod ? PaymentStatus.PENDING : PaymentStatus.PENDING,
              payeePhone: isCod ? null : normalizeMsisdn(merchant.phone),
              payeeName: merchant.name,
              providerMessage: isCod
                ? "Cash on delivery — collect from customer"
                : "Initiating mobile money request to Youth Huza...",
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
                  : "Order placed — awaiting payment to Youth Huza",
              },
            ],
          },
        },
        include: { payment: true },
      });
    });

    if (isCod) {
      if (session?.user?.id) {
        await prisma.notification.create({
          data: {
            userId: session.user.id,
            type: "ORDER_CONFIRMATION",
            channel: "IN_APP",
            title: "Order confirmed",
            body: `Order ${order.orderNumber} placed. Pay cash on delivery. ETA: ${estimatedDelivery}.`,
          },
        });
      }
      return NextResponse.json({
        orderNumber: order.orderNumber,
        id: order.id,
        paymentId: order.payment?.id,
        scheduledFor,
        total,
        paymentStatus: "PENDING",
        paymentMode: "demo",
        paymentMessage: "Cash on delivery confirmed. Youth Huza will deliver your order.",
        payerPhone: data.phone,
        payeeName: merchant.name,
        payeePhone: merchant.phone,
        method: data.paymentMethod,
      });
    }

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

    if (session?.user?.id) {
      await prisma.notification.create({
        data: {
          userId: session.user.id,
          type: "ORDER_CONFIRMATION",
          channel: "IN_APP",
          title: "Approve payment on your phone",
          body: `Order ${order.orderNumber}: approve ${data.paymentMethod === "MTN_MOMO" ? "MTN MoMo" : "Airtel Money"} on ${data.paymentPhone}. You are paying Youth Huza (HUZA FRESH). ETA: ${estimatedDelivery}.`,
        },
      });
    }

    return NextResponse.json({
      orderNumber: order.orderNumber,
      id: order.id,
      paymentId: order.payment?.id,
      scheduledFor,
      total,
      paymentStatus: "PENDING",
      paymentMode: paymentResult.mode,
      paymentMessage: paymentResult.message,
      payerPhone: data.paymentPhone,
      payeeName: merchant.name,
      payeePhone: merchant.phone,
      method: data.paymentMethod,
    });
  } catch (err) {
    console.error(err);
    if (err instanceof z.ZodError) {
      const message = err.issues.map((i) => i.message).join(". ");
      return NextResponse.json({ error: message }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Failed to place order";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
