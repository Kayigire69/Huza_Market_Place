import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isAdminPortalRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");
  if (!isAdminPortalRole(session.user.role)) redirect("/");

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
    lowStockCount,
    pendingSuppliers,
    recentOrders,
    notifications,
    lowStockPreview,
    topProducts,
  ] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: { in: ["PAID", "CONFIRMED"] } } }),
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
      include: { payment: true, items: true },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    prisma.product.findMany({
      where: { isActive: true, deletedAt: null, stockQty: { lte: 5 } },
      orderBy: { stockQty: "asc" },
      take: 6,
      select: { nameEn: true, stockQty: true, unit: true },
    }),
    prisma.product.findMany({
      where: { isBestSeller: true },
      orderBy: { ratingCount: "desc" },
      take: 5,
      select: { nameEn: true, ratingCount: true },
    }),
  ]);

  const initial = {
    counts: {
      todayOrders,
      pendingPayment,
      paidReady,
      preparing,
      outForDelivery,
      deliveredToday,
      revenueToday: revenueToday._sum.total ?? 0,
      lowStock: lowStockCount,
      pendingSuppliers,
    },
    recentOrders: recentOrders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      receiptNumber: o.receiptNumber,
      customer: o.guestName || "Customer",
      total: o.total,
      status: o.status,
      paymentStatus: o.payment?.status ?? null,
      createdAt: o.createdAt.toISOString(),
    })),
    notifications: notifications.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      createdAt: n.createdAt.toISOString(),
    })),
  };

  return (
    <AdminDashboardClient
      initial={initial}
      lowStockPreview={lowStockPreview.map((p) => ({
        name: p.nameEn,
        stockQty: p.stockQty,
        unit: p.unit,
      }))}
      topProducts={topProducts.map((p) => ({
        name: p.nameEn,
        soldHint: p.ratingCount,
      }))}
    />
  );
}
