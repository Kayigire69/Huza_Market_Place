import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isAdminPortalRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { getAdminDashboardAnalytics } from "@/services/admin-analytics.service";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");
  if (!isAdminPortalRole(session.user.role)) redirect("/");

  const analytics = await getAdminDashboardAnalytics();
  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  return (
    <AdminDashboardClient
      initial={{
        counts: analytics.counts,
        recentOrders: analytics.recentOrders,
        notifications: notifications.map((n) => ({
          id: n.id,
          title: n.title,
          body: n.body,
          createdAt: n.createdAt.toISOString(),
        })),
        ordersLast7Days: analytics.ordersLast7Days,
        topProducts: analytics.topProducts,
        salesByCategory: analytics.salesByCategory,
        todaySchedule: analytics.todaySchedule,
      }}
      lowStockPreview={analytics.lowStockPreview}
    />
  );
}
