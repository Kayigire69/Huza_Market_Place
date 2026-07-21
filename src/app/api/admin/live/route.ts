import { NextResponse } from "next/server";
import { requirePortalSession } from "@/lib/rbac-server";
import { prisma } from "@/lib/prisma";
import {
  getAdminDashboardAnalytics,
  getAdminLiveLite,
} from "@/services/admin-analytics.service";
import { cacheGet, cacheSet, CacheKeys } from "@/lib/redis";

/** Live admin feed. Use ?full=1 for dashboard charts; default is lite for chrome. */
export async function GET(req: Request) {
  const session = await requirePortalSession();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const full = searchParams.get("full") === "1";
  const userId = session.user.id;

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 12,
  });
  const notificationPayload = notifications.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    type: n.type,
    createdAt: n.createdAt.toISOString(),
    isRead: n.isRead,
  }));

  if (!full) {
    const cacheKey = CacheKeys.adminLiveLite(userId);
    type Lite = Awaited<ReturnType<typeof getAdminLiveLite>>;
    const cached = await cacheGet<Lite>(cacheKey);
    const lite = cached || (await getAdminLiveLite());
    if (!cached) await cacheSet(cacheKey, lite, 8);
    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      counts: lite.counts,
      notifications: notificationPayload,
    });
  }

  const analytics = await getAdminDashboardAnalytics();
  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    counts: analytics.counts,
    recentOrders: analytics.recentOrders,
    notifications: notificationPayload,
    ordersLast7Days: analytics.ordersLast7Days,
    topProducts: analytics.topProducts,
    salesByCategory: analytics.salesByCategory,
    lowStockPreview: analytics.lowStockPreview,
    ordersByStatus: analytics.ordersByStatus,
    recentActivity: analytics.recentActivity,
  });
}
