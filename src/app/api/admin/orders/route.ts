import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, status } = await req.json();
  const order = await prisma.order.update({
    where: { id },
    data: {
      status: status as OrderStatus,
      statusLog: { create: { status: status as OrderStatus, note: "Updated by admin" } },
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
