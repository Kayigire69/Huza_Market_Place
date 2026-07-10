import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orderId, accept } = await req.json();
  const supplier = await prisma.supplier.findUnique({ where: { userId: session.user.id } });
  if (!supplier && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const status = accept ? OrderStatus.PREPARING : OrderStatus.CANCELLED;
  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      status,
      statusLog: {
        create: {
          status,
          note: accept ? "Accepted by supplier" : "Rejected by supplier",
        },
      },
    },
  });

  if (!accept) {
    const items = await prisma.orderItem.findMany({ where: { orderId } });
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stockQty: { increment: item.quantity } },
      });
      await prisma.stockHistory.create({
        data: {
          productId: item.productId,
          change: item.quantity,
          reason: `Order ${order.orderNumber} cancelled`,
        },
      });
    }
  }

  return NextResponse.json(order);
}
