import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/rbac-server";
import { prisma } from "@/lib/prisma";
import { OrderStatus, Prisma } from "@prisma/client";
import { auditAdminAction } from "@/lib/audit";

async function requireAdmin() {
  return requireAdminSession({ modules: ["orders"] });
}

const TAB_STATUSES: Record<string, OrderStatus[]> = {
  pending: ["PENDING", "PAID"],
  confirmed: ["CONFIRMED"],
  preparing: ["PREPARING", "PACKED", "READY_FOR_DISPATCH", "READY_FOR_PICKUP"],
  out: ["OUT_FOR_DELIVERY"],
  delivered: ["DELIVERED"],
  cancelled: ["CANCELLED", "RETURNED", "REFUNDED"],
};

/** List orders for admin Orders module */
export async function GET(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const tab = searchParams.get("tab") || "all";
  const q = searchParams.get("q")?.trim() || "";

  const statusFilter =
    tab !== "all" && TAB_STATUSES[tab]
      ? { status: { in: TAB_STATUSES[tab] } }
      : {};

  const searchFilter: Prisma.OrderWhereInput = q
    ? {
        OR: [
          { orderNumber: { contains: q, mode: "insensitive" } },
          { guestName: { contains: q, mode: "insensitive" } },
          { guestPhone: { contains: q, mode: "insensitive" } },
          { user: { fullName: { contains: q, mode: "insensitive" } } },
          { user: { phone: { contains: q, mode: "insensitive" } } },
        ],
      }
    : {};

  const orders = await prisma.order.findMany({
    where: {
      ...statusFilter,
      ...searchFilter,
    },
    include: {
      user: { select: { id: true, fullName: true, phone: true, email: true } },
      payment: { select: { id: true, status: true, method: true, amount: true } },
      delivery: {
        select: {
          id: true,
          status: true,
          deliveryPersonId: true,
          deliveryPerson: { select: { id: true, fullName: true, phone: true } },
        },
      },
      items: {
        select: {
          id: true,
          quantity: true,
          unitPrice: true,
          product: { select: { nameEn: true } },
        },
        take: 8,
      },
    },
    orderBy: { createdAt: "desc" },
    take: 120,
  });

  return NextResponse.json({ orders });
}

export async function PATCH(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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
