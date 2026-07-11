import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { auditAdminAction } from "@/lib/audit";

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { deliveryId, deliveryPersonId, status } = await req.json();
  const before = await prisma.delivery.findUnique({
    where: { id: deliveryId },
    include: { order: { select: { orderNumber: true } }, deliveryPerson: { select: { fullName: true } } },
  });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const delivery = await prisma.delivery.update({
    where: { id: deliveryId },
    data: {
      deliveryPersonId: deliveryPersonId || undefined,
      status: (status as OrderStatus) || undefined,
      pickedAt: status === "OUT_FOR_DELIVERY" ? new Date() : undefined,
      deliveredAt: status === "DELIVERED" ? new Date() : undefined,
    },
    include: {
      order: true,
      deliveryPerson: { select: { fullName: true, phone: true } },
    },
  });

  if (status) {
    await prisma.order.update({
      where: { id: delivery.orderId },
      data: {
        status: status as OrderStatus,
        statusLog: {
          create: {
            status: status as OrderStatus,
            note: `Delivery update by ${session.user.name || session.user.email}`,
          },
        },
      },
    });
  }

  await auditAdminAction(req, session, {
    action: deliveryPersonId ? "delivery.assign" : "delivery.status_change",
    entity: "Delivery",
    entityId: delivery.id,
    details: `${before.order.orderNumber}: driver=${delivery.deliveryPerson?.fullName || "—"} status=${delivery.status}`,
    before: {
      status: before.status,
      deliveryPersonId: before.deliveryPersonId,
      driver: before.deliveryPerson?.fullName || null,
    },
    after: {
      status: delivery.status,
      deliveryPersonId: delivery.deliveryPersonId,
      driver: delivery.deliveryPerson?.fullName || null,
    },
  });

  return NextResponse.json(delivery);
}
