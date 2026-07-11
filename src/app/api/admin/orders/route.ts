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

  const { id, status } = await req.json();
  const before = await prisma.order.findUnique({
    where: { id },
    select: { id: true, orderNumber: true, status: true },
  });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const order = await prisma.order.update({
    where: { id },
    data: {
      status: status as OrderStatus,
      statusLog: {
        create: {
          status: status as OrderStatus,
          note: `Updated by ${session.user.name || session.user.email || "admin"}`,
        },
      },
      ...(status === "OUT_FOR_DELIVERY" || status === "DELIVERED" || status === "READY_FOR_PICKUP"
        ? {
            delivery: {
              update: {
                status: status as OrderStatus,
                ...(status === "DELIVERED" ? { deliveredAt: new Date() } : {}),
                ...(status === "OUT_FOR_DELIVERY" ? { pickedAt: new Date() } : {}),
              },
            },
          }
        : {}),
    },
  });

  await auditAdminAction(req, session, {
    action: "order.status_change",
    entity: "Order",
    entityId: order.id,
    details: `${order.orderNumber}: ${before.status} → ${status}`,
    before: { status: before.status },
    after: { status: order.status },
  });

  if (order.userId) {
    await prisma.notification.create({
      data: {
        userId: order.userId,
        type: "DELIVERY_UPDATE",
        channel: "IN_APP",
        title: "Order update",
        body: `Order ${order.orderNumber} is now ${status}.`,
      },
    });
  }

  return NextResponse.json(order);
}
