import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getBusinessStatus } from "@/lib/business-hours";
import { DELIVERY_FEES, generateOrderNumber } from "@/lib/utils";
import { DeliveryZone, OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";

const schema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(8),
  address: z.string().min(5),
  deliveryZone: z.enum(["KIGALI", "KAMONYI_RUYENZI", "BUGESERA_NYAMATA"]),
  gpsLat: z.string().optional(),
  gpsLng: z.string().optional(),
  instructions: z.string().optional(),
  paymentMethod: z.enum(["MTN_MOMO", "AIRTEL_MONEY"]),
  paymentPhone: z.string().min(8),
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
          status: scheduledFor ? OrderStatus.PENDING : OrderStatus.CONFIRMED,
          scheduledFor,
          items: { create: lineItems },
          payment: {
            create: {
              method: data.paymentMethod as PaymentMethod,
              phoneNumber: data.paymentPhone,
              amount: total,
              status: PaymentStatus.VERIFIED,
              transactionRef: `${data.paymentMethod}-${Date.now()}`,
              verifiedAt: new Date(),
            },
          },
          delivery: {
            create: {
              status: OrderStatus.READY_FOR_PICKUP,
              estimatedMinutes:
                data.deliveryZone === "KIGALI" ? 45 : 75,
            },
          },
          statusLog: {
            create: [
              { status: OrderStatus.PENDING, note: "Order placed" },
              {
                status: scheduledFor ? OrderStatus.PENDING : OrderStatus.CONFIRMED,
                note: scheduledFor
                  ? `Scheduled for next business day (${scheduledFor.toISOString()})`
                  : "Payment verified",
              },
            ],
          },
        },
      });
    });

    if (session?.user?.id) {
      await prisma.notification.create({
        data: {
          userId: session.user.id,
          type: "ORDER_CONFIRMATION",
          channel: "IN_APP",
          title: "Order confirmation",
          body: `Order ${order.orderNumber} placed successfully. Total ${total} RWF.`,
        },
      });
      await prisma.notification.create({
        data: {
          userId: session.user.id,
          type: "PAYMENT_CONFIRMATION",
          channel: "SMS",
          title: "Payment confirmation",
          body: `Payment of ${total} RWF received via ${data.paymentMethod}.`,
        },
      });
    }

    return NextResponse.json({
      orderNumber: order.orderNumber,
      id: order.id,
      scheduledFor,
      total,
    });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Failed to place order";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
