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

  const { deliveryId, deliveryPersonId, status } = await req.json();
  const delivery = await prisma.delivery.update({
    where: { id: deliveryId },
    data: {
      deliveryPersonId: deliveryPersonId || undefined,
      status: (status as OrderStatus) || undefined,
      pickedAt: status === "OUT_FOR_DELIVERY" ? new Date() : undefined,
      deliveredAt: status === "DELIVERED" ? new Date() : undefined,
    },
    include: { order: true },
  });

  if (status) {
    await prisma.order.update({
      where: { id: delivery.orderId },
      data: {
        status: status as OrderStatus,
        statusLog: { create: { status: status as OrderStatus, note: "Delivery update" } },
      },
    });
  }

  return NextResponse.json(delivery);
}
