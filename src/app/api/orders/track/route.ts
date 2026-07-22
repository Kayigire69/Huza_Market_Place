import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { canAccessOrder, verifyOrderDocToken } from "@/lib/security-access";

/**
 * Track order by orderNumber + phone, or by checkout docAccessToken.
 * Returns a slim payload (no guest phone / payment PII / full product rows).
 */
export async function GET(req: Request) {
  const ip = clientIp(req);
  const rl = await rateLimit({
    key: `order-track:${ip}`,
    limit: 20,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const orderNumber = searchParams.get("orderNumber")?.trim();
  const phone = searchParams.get("phone")?.trim() || undefined;
  const token = searchParams.get("token")?.trim() || undefined;

  if (!orderNumber) {
    return NextResponse.json({ error: "Order number required" }, { status: 400 });
  }

  const hasToken = Boolean(token && verifyOrderDocToken(orderNumber, token));
  if (!hasToken && !phone) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Order number and phone required (or a valid tracking link)" },
        { status: 400 }
      );
    }
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    select: {
      id: true,
      orderNumber: true,
      userId: true,
      guestPhone: true,
      status: true,
      total: true,
      deliveryAddress: true,
      deliveryZone: true,
      fulfillmentMethod: true,
      createdAt: true,
      scheduledFor: true,
      estimatedDelivery: true,
      items: {
        select: {
          quantity: true,
          lineTotal: true,
          product: { select: { nameEn: true } },
        },
      },
      payment: {
        select: {
          status: true,
          method: true,
          payeeName: true,
          phoneNumber: true,
        },
      },
      delivery: {
        select: {
          status: true,
          estimatedMinutes: true,
          deliveryPerson: { select: { fullName: true, phone: true } },
        },
      },
      statusLog: {
        orderBy: { createdAt: "asc" },
        select: { status: true, note: true, createdAt: true },
      },
      user: { select: { phone: true } },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const allowed = await canAccessOrder(order, {
    req,
    orderNumber: order.orderNumber,
    phone,
    token,
  });

  if (!allowed) {
    // Same message for wrong phone vs not found reduces enumeration signal slightly
    // after the order exists check; still rate-limited above.
    return NextResponse.json({ error: "Order not found or phone does not match" }, { status: 403 });
  }

  return NextResponse.json({
    orderNumber: order.orderNumber,
    status: order.status,
    total: order.total,
    deliveryAddress: order.deliveryAddress,
    deliveryZone: order.deliveryZone,
    fulfillmentMethod: order.fulfillmentMethod,
    createdAt: order.createdAt,
    scheduledFor: order.scheduledFor,
    estimatedDelivery: order.estimatedDelivery,
    payment: order.payment
      ? {
          status: order.payment.status,
          method: order.payment.method,
          payeeName: order.payment.payeeName,
        }
      : null,
    delivery: order.delivery
      ? {
          status: order.delivery.status,
          estimatedMinutes: order.delivery.estimatedMinutes,
          deliveryPerson: order.delivery.deliveryPerson,
        }
      : null,
    statusLog: order.statusLog,
    items: order.items.map((it) => ({
      quantity: it.quantity,
      lineTotal: it.lineTotal,
      product: { nameEn: it.product.nameEn },
    })),
  });
}
