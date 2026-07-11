import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Live admin feed — poll every ~15–30s for new orders, payments, alerts. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    todayOrders,
    pendingPayment,
    paidReady,
    preparing,
    outForDelivery,
    deliveredToday,
    revenueToday,
    lowStock,
    pendingSuppliers,
    recentOrders,
    notifications,
  ] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({
      where: { status: { in: ["PAID", "CONFIRMED"] } },
    }),
    prisma.order.count({ where: { status: { in: ["PREPARING", "PACKED"] } } }),
    prisma.order.count({ where: { status: "OUT_FOR_DELIVERY" } }),
    prisma.order.count({
      where: { status: "DELIVERED", updatedAt: { gte: startOfDay } },
    }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: {
        createdAt: { gte: startOfDay },
        status: { notIn: ["CANCELLED", "REFUNDED"] },
      },
    }),
    prisma.product.count({
      where: { isActive: true, deletedAt: null, stockQty: { lte: 5 } },
    }),
    prisma.supplier.count({ where: { status: "PENDING" } }),
    prisma.order.findMany({
      include: {
        payment: true,
        items: { include: { product: { select: { nameEn: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    counts: {
      todayOrders,
      pendingPayment,
      paidReady,
      preparing,
      outForDelivery,
      deliveredToday,
      revenueToday: revenueToday._sum.total ?? 0,
      lowStock,
      pendingSuppliers,
    },
    recentOrders: recentOrders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      receiptNumber: o.receiptNumber,
      customer: o.guestName || "Customer",
      phone: o.guestPhone,
      total: o.total,
      status: o.status,
      paymentStatus: o.payment?.status ?? null,
      paymentMethod: o.payment?.method ?? null,
      createdAt: o.createdAt,
      itemCount: o.items.length,
    })),
    notifications: notifications.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      type: n.type,
      createdAt: n.createdAt,
      isRead: n.isRead,
    })),
  });
}
