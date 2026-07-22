import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/rbac-server";
import { prisma } from "@/lib/prisma";
import { OrderStatus, Prisma } from "@prisma/client";
import { auditAdminAction } from "@/lib/audit";
import { enqueueSms } from "@/jobs/queue";
import { getPickupInfo } from "@/services/settings.service";

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
    select: {
      id: true,
      orderNumber: true,
      status: true,
      fulfillmentMethod: true,
      guestPhone: true,
      userId: true,
    },
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

  const notifyUserId = order.userId || before.userId;
  const isPickupReady =
    status === "READY_FOR_PICKUP" && before.fulfillmentMethod === "PICKUP";
  const isOrderReady =
    status === "PACKED" ||
    status === "READY_FOR_DISPATCH" ||
    status === "READY_FOR_PICKUP";

  if (notifyUserId) {
    await prisma.notification.create({
      data: {
        userId: notifyUserId,
        type: isPickupReady
          ? "DELIVERY_UPDATE"
          : status === "PACKED"
            ? "ORDER_PACKED"
            : "DELIVERY_UPDATE",
        channel: "IN_APP",
        title: isPickupReady
          ? "Pickup ready"
          : isOrderReady
            ? "Order ready"
            : "Order update",
        body: isPickupReady
          ? `Order ${order.orderNumber} is ready for pickup at Youth Huza. Bring your order number.`
          : isOrderReady
            ? `Order ${order.orderNumber} is ready. ${
                before.fulfillmentMethod === "PICKUP"
                  ? "You can collect soon — we will confirm pickup details."
                  : "We are preparing dispatch to your address."
              }`
            : `Order ${order.orderNumber} is now ${String(status).replace(/_/g, " ")}.`,
      },
    });
  }

  if (isPickupReady) {
    let smsPhone = before.guestPhone || "";
    if (!smsPhone && notifyUserId) {
      const user = await prisma.user.findUnique({
        where: { id: notifyUserId },
        select: { phone: true },
      });
      smsPhone = user?.phone || "";
    }
    if (smsPhone) {
      const pickup = await getPickupInfo();
      void enqueueSms(
        smsPhone,
        `HUZA FRESH: Order ${order.orderNumber} is ready for pickup at ${pickup.locationName}. ${pickup.address}. Bring your order number.`
      ).catch(() => undefined);
    }
  }

  return NextResponse.json(order);
}
