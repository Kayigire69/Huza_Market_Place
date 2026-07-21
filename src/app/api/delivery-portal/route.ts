import { NextResponse } from "next/server";
import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireDeliverySession } from "@/lib/rbac-server";

export async function PATCH(req: Request) {
  const session = await requireDeliverySession();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const deliveryId = String(body.deliveryId || "");
  const status = body.status as OrderStatus | undefined;
  const podNotes = body.podNotes != null ? String(body.podNotes) : undefined;
  const podPhotoUrl = body.podPhotoUrl != null ? String(body.podPhotoUrl) : undefined;
  const notes = body.notes != null ? String(body.notes) : undefined;

  if (!deliveryId) {
    return NextResponse.json({ error: "deliveryId required" }, { status: 400 });
  }

  const existing = await prisma.delivery.findUnique({
    where: { id: deliveryId },
    include: { order: true },
  });
  if (!existing) return NextResponse.json({ error: "Delivery not found" }, { status: 404 });

  if (
    session.user.role === "DELIVERY" &&
    existing.deliveryPersonId &&
    existing.deliveryPersonId !== session.user.id
  ) {
    return NextResponse.json({ error: "Not your delivery" }, { status: 403 });
  }

  if (status && status !== OrderStatus.OUT_FOR_DELIVERY && status !== OrderStatus.DELIVERED) {
    return NextResponse.json(
      { error: "Status must be OUT_FOR_DELIVERY or DELIVERED" },
      { status: 400 }
    );
  }

  const delivery = await prisma.delivery.update({
    where: { id: deliveryId },
    data: {
      ...(session.user.role === "DELIVERY" && !existing.deliveryPersonId
        ? { deliveryPersonId: session.user.id }
        : {}),
      status: status || undefined,
      podNotes,
      podPhotoUrl,
      notes,
      pickedAt: status === OrderStatus.OUT_FOR_DELIVERY ? new Date() : undefined,
      deliveredAt: status === OrderStatus.DELIVERED ? new Date() : undefined,
    },
    include: {
      order: {
        include: {
          user: { select: { fullName: true, phone: true } },
        },
      },
    },
  });

  if (status) {
    await prisma.order.update({
      where: { id: delivery.orderId },
      data: {
        status,
        statusLog: {
          create: {
            status,
            note:
              status === OrderStatus.DELIVERED
                ? podNotes || "Delivered with POD"
                : "Out for delivery",
          },
        },
      },
    });

    if (delivery.order.userId) {
      await prisma.notification.create({
        data: {
          userId: delivery.order.userId,
          type: status === OrderStatus.DELIVERED ? "ORDER_DELIVERED" : "ORDER_OUT_FOR_DELIVERY",
          channel: "IN_APP",
          title: status === OrderStatus.DELIVERED ? "Order delivered" : "Out for delivery",
          body: `Order ${delivery.order.orderNumber} is ${status}.`,
        },
      });
    }
  }

  return NextResponse.json(delivery);
}

export async function GET() {
  const session = await requireDeliverySession();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const where =
    session.user.role === "ADMIN" ||
    session.user.role === "SUPER_ADMIN" ||
    session.user.role === "MANAGER"
      ? {}
      : {
          OR: [
            { deliveryPersonId: session.user.id },
            { deliveryPersonId: null, status: { in: ["READY_FOR_DISPATCH", "OUT_FOR_DELIVERY"] as OrderStatus[] } },
          ],
        };

  const deliveries = await prisma.delivery.findMany({
    where,
    include: {
      order: {
        include: {
          user: { select: { fullName: true, phone: true } },
          items: { include: { product: { select: { nameEn: true } } } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return NextResponse.json(deliveries);
}
