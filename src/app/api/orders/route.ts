import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getBusinessStatus } from "@/lib/business-hours";
import { DELIVERY_FEES, generateOrderNumber } from "@/lib/utils";
import { initiateMobileMoneyPayment, normalizeMsisdn } from "@/lib/payments/mobile-money";
import { DeliveryZone, OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";

const schema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  phone: z.string().min(8, "Enter a valid phone number (e.g. 078xxxxxxx)"),
  address: z.string().min(5, "Delivery address is required"),
  deliveryZone: z.enum(["KIGALI", "KAMONYI_RUYENZI", "BUGESERA_NYAMATA"]),
  gpsLat: z.string().optional(),
  gpsLng: z.string().optional(),
  instructions: z.string().optional(),
  paymentMethod: z.enum(["MTN_MOMO", "AIRTEL_MONEY"]),
  paymentPhone: z
    .string()
    .min(8, "Enter your MoMo / Airtel phone number (e.g. 078xxxxxxx), not the network name"),
  items: z.array(z.object({ productId: z.string(), quantity: z.number().positive() })).min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = schema.parse(body);
    const status = await getBusinessStatus();

    let scheduledFor: Date | null = null;
    if (!status.canCheckout) {
      const next = new Date();
      next.setDate(next.getDate() + 1);
      next.setHours(status.openHour ?? 6, 0, 0, 0);
      scheduledFor = next;
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

    // Primary seller = supplier with the largest line total (money goes to their number)
    const totalsBySupplier = new Map<string, number>();
    for (const item of lineItems) {
      totalsBySupplier.set(
        item.supplierId,
        (totalsBySupplier.get(item.supplierId) || 0) + item.lineTotal
      );
    }
    const primarySupplierId = [...totalsBySupplier.entries()].sort((a, b) => b[1] - a[1])[0][0];
    const primarySupplier = products.find((p) => p.supplierId === primarySupplierId)!.supplier;

    const deliveryFee = DELIVERY_FEES[data.deliveryZone as keyof typeof DELIVERY_FEES];
    const total = subtotal + deliveryFee;
    const orderNumber = generateOrderNumber();

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
          subtotal,
          total,
          status: OrderStatus.PENDING,
          scheduledFor,
          items: { create: lineItems },
          payment: {
            create: {
              method: data.paymentMethod as PaymentMethod,
              phoneNumber: normalizeMsisdn(data.paymentPhone),
              amount: total,
              status: PaymentStatus.PENDING,
              payeePhone: normalizeMsisdn(primarySupplier.phone),
              payeeName: primarySupplier.businessName,
              providerMessage: "Initiating mobile money request...",
            },
          },
          delivery: {
            create: {
              status: OrderStatus.PENDING,
              estimatedMinutes: data.deliveryZone === "KIGALI" ? 45 : 75,
            },
          },
          statusLog: {
            create: [{ status: OrderStatus.PENDING, note: "Order placed — awaiting mobile money approval" }],
          },
        },
        include: { payment: true },
      });
    });

    let paymentResult;
    try {
      paymentResult = await initiateMobileMoneyPayment({
        method: data.paymentMethod as PaymentMethod,
        payerPhone: data.paymentPhone,
        payeePhone: primarySupplier.phone,
        payeeName: primarySupplier.businessName,
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
          body: `Order ${order.orderNumber}: check ${data.paymentPhone} for the ${data.paymentMethod === "MTN_MOMO" ? "MTN MoMo" : "Airtel Money"} prompt and enter your PIN. Money goes to ${primarySupplier.businessName}.`,
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
      payeeName: primarySupplier.businessName,
      payeePhone: primarySupplier.phone,
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
