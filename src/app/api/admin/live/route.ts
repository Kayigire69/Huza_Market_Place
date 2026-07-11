import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminPortalRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { getAdminDashboardAnalytics } from "@/services/admin-analytics.service";

/** Live admin feed — poll every ~15–30s for new orders, payments, alerts. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isAdminPortalRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const analytics = await getAdminDashboardAnalytics();
  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    counts: analytics.counts,
    recentOrders: analytics.recentOrders,
    notifications: notifications.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      type: n.type,
      createdAt: n.createdAt.toISOString(),
      isRead: n.isRead,
    })),
    ordersLast7Days: analytics.ordersLast7Days,
    topProducts: analytics.topProducts,
    salesByCategory: analytics.salesByCategory,
    lowStockPreview: analytics.lowStockPreview,
  });
}
