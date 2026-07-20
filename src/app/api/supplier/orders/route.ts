import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

/** Only early statuses may be accepted/rejected by a farmer. */
const MUTABLE_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.PAID,
  OrderStatus.CONFIRMED,
];

/**
 * Farmer accept/reject for an order that belongs entirely to their farm.
 * Ownership is enforced via OrderItem.supplierId (IDOR-safe).
 */
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Staff must use admin order APIs. Do not allow open-ended cancel here.
  if (session.user.role !== "SUPPLIER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supplier = await prisma.supplier.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!supplier) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const orderId =
    body && typeof body === "object" && typeof (body as { orderId?: unknown }).orderId === "string"
      ? (body as { orderId: string }).orderId.trim()
      : "";
  const accept = Boolean(
    body && typeof body === "object" && (body as { accept?: unknown }).accept
  );

  if (!orderId) {
    return NextResponse.json({ error: "orderId is required" }, { status: 400 });
  }

  const existing = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        select: { id: true, productId: true, quantity: true, supplierId: true },
      },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Every line must belong to this farmer. Blocks cross-farm cancel/accept.
  if (
    existing.items.length === 0 ||
    existing.items.some((item) => item.supplierId !== supplier.id)
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!MUTABLE_STATUSES.includes(existing.status)) {
    return NextResponse.json(
      { error: "Order can no longer be accepted or cancelled" },
      { status: 409 }
    );
  }

  const status = accept ? OrderStatus.PREPARING : OrderStatus.CANCELLED;

  const order = await prisma.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id: orderId },
      data: {
        status,
        statusLog: {
          create: {
            status,
            note: accept ? "Accepted by farmer" : "Rejected by farmer",
          },
        },
      },
    });

    if (!accept) {
      for (const item of existing.items) {
        const qty = Math.max(0, Math.round(Number(item.quantity)) || 0);
        if (qty <= 0) continue;
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQty: { increment: qty } },
        });
        await tx.stockHistory.create({
          data: {
            productId: item.productId,
            change: qty,
            reason: `Order ${updated.orderNumber} cancelled`,
          },
        });
      }
    }

    return updated;
  });

  return NextResponse.json(order);
}
