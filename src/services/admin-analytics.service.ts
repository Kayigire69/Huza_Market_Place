import { prisma } from "@/lib/prisma";

function startOfLocalDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** Unread agronomy requests still needing staff action. */
async function countOpenAgronomyRequests() {
  return prisma.agronomyRequest.count({
    where: { status: { in: ["OPEN", "REPLIED", "SCHEDULED"] } },
  });
}

async function farmOpsCounts() {
  const now = new Date();
  const in14 = new Date(now);
  in14.setDate(in14.getDate() + 14);
  const [openAgronomy, harvestSoonCrops, readyCrops, needingPhotos] = await Promise.all([
    countOpenAgronomyRequests(),
    prisma.farmCrop.count({
      where: {
        expectedHarvestDate: { gte: now, lte: in14 },
        growthStage: { not: "harvested" },
      },
    }),
    prisma.farmCrop.count({ where: { growthStage: "ready" } }),
    prisma.product.count({
      where: {
        deletedAt: null,
        reviewStatus: "APPROVED",
        images: { none: { kind: "STOREFRONT" } },
      },
    }),
  ]);
  return { openAgronomy, harvestSoonCrops, readyCrops, needingPhotos };
}

/** Last 7 calendar days (Mon–Sun style labels relative to today). */
export async function getOrdersLast7Days() {
  const today = startOfLocalDay();
  const from = new Date(today);
  from.setDate(from.getDate() - 6);

  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: from },
      status: { notIn: ["CANCELLED", "REFUNDED"] },
    },
    select: { createdAt: true, total: true },
  });

  const byDay = new Map<string, { orders: number; revenue: number }>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(from);
    d.setDate(from.getDate() + i);
    byDay.set(dayKey(d), { orders: 0, revenue: 0 });
  }

  for (const o of orders) {
    const key = dayKey(startOfLocalDay(o.createdAt));
    const row = byDay.get(key);
    if (row) {
      row.orders += 1;
      row.revenue += o.total;
    }
  }

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return Array.from(byDay.entries()).map(([date, stats]) => {
    const d = new Date(date + "T12:00:00");
    return {
      date,
      label: dayNames[d.getDay()],
      orders: stats.orders,
      revenue: stats.revenue,
    };
  });
}

/** Top products by units sold from paid/confirmed+ order items (recent window). */
export async function getTopProductsBySales(take = 5) {
  const since = new Date();
  since.setDate(since.getDate() - 90);

  const items = await prisma.orderItem.groupBy({
    by: ["productId"],
    _sum: { quantity: true, lineTotal: true },
    where: {
      order: {
        status: { notIn: ["CANCELLED", "REFUNDED", "PENDING"] },
        createdAt: { gte: since },
      },
    },
    orderBy: { _sum: { quantity: "desc" } },
    take,
  });

  if (items.length === 0) return [];

  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.productId) } },
    select: { id: true, nameEn: true, category: { select: { nameEn: true } } },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  return items.map((i) => {
    const p = byId.get(i.productId);
    return {
      productId: i.productId,
      name: p?.nameEn || "Product",
      category: p?.category?.nameEn || "Uncategorized",
      unitsSold: i._sum.quantity ?? 0,
      revenue: i._sum.lineTotal ?? 0,
    };
  });
}

/** Sales totals grouped by product category (real order lines, recent window). */
export async function getSalesByCategory(take = 8) {
  const since = new Date();
  since.setDate(since.getDate() - 90);

  const lines = await prisma.orderItem.findMany({
    where: {
      order: {
        status: { notIn: ["CANCELLED", "REFUNDED", "PENDING"] },
        createdAt: { gte: since },
      },
    },
    select: {
      quantity: true,
      lineTotal: true,
      product: { select: { category: { select: { id: true, nameEn: true } } } },
    },
  });

  const map = new Map<string, { categoryId: string; name: string; units: number; revenue: number }>();
  for (const line of lines) {
    const cat = line.product.category;
    const id = cat?.id || "none";
    const name = cat?.nameEn || "Uncategorized";
    const row = map.get(id) || { categoryId: id, name, units: 0, revenue: 0 };
    row.units += line.quantity;
    row.revenue += line.lineTotal;
    map.set(id, row);
  }

  return Array.from(map.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, take);
}

/** Lightweight counts + recent list for admin chrome polling. */
export async function getAdminLiveLite() {
  const startOfDay = startOfLocalDay();
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

  const [
    todayOrders,
    pendingPayment,
    paidReady,
    preparing,
    outForDelivery,
    deliveredToday,
    revenueToday,
    lowStockCount,
    pendingFarmers,
    delayedOrders,
    farmOps,
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
    prisma.order.count({
      where: {
        status: { in: ["CONFIRMED", "PAID", "PREPARING", "OUT_FOR_DELIVERY"] },
        updatedAt: { lt: twoHoursAgo },
      },
    }),
    farmOpsCounts(),
  ]);

  const pendingOrders = pendingPayment + paidReady + preparing;

  return {
    counts: {
      todayOrders,
      pendingPayment,
      pendingOrders,
      paidReady,
      preparing,
      outForDelivery,
      deliveredToday,
      revenueToday: revenueToday._sum.total ?? 0,
      lowStock: lowStockCount,
      pendingFarmers,
      pendingSuppliers: pendingFarmers,
      pendingDeliveries: outForDelivery + preparing,
      delayedOrders,
      ...farmOps,
    },
  };
}

export async function getAdminDashboardAnalytics() {
  const startOfDay = startOfLocalDay();
  const monthStart = new Date(startOfDay.getFullYear(), startOfDay.getMonth(), 1);
  const prevMonthStart = new Date(startOfDay.getFullYear(), startOfDay.getMonth() - 1, 1);
  const prevMonthEnd = new Date(monthStart.getTime() - 1);

  const [
    todayOrders,
    pendingPayment,
    paidReady,
    preparing,
    outForDelivery,
    deliveredToday,
    revenueToday,
    lowStockCount,
    pendingFarmers,
    recentOrders,
    lowStockPreview,
    ordersLast7Days,
    topProducts,
    salesByCategory,
    revenueThisMonth,
    revenuePrevMonth,
    completedOrders,
    supplierStats,
    newCustomersMonth,
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
    prisma.product.findMany({
      where: { isActive: true, deletedAt: null, stockQty: { lte: 5 } },
      orderBy: { stockQty: "asc" },
      take: 6,
      select: { nameEn: true, stockQty: true, unit: true },
    }),
    getOrdersLast7Days(),
    getTopProductsBySales(5),
    getSalesByCategory(8),
    prisma.order.aggregate({
      _sum: { total: true },
      where: {
        createdAt: { gte: monthStart },
        status: { notIn: ["CANCELLED", "REFUNDED"] },
      },
    }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: {
        createdAt: { gte: prevMonthStart, lte: prevMonthEnd },
        status: { notIn: ["CANCELLED", "REFUNDED"] },
      },
    }),
    prisma.order.count({ where: { status: "DELIVERED" } }),
    prisma.supplier.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.user.count({
      where: { role: "CUSTOMER", createdAt: { gte: monthStart } },
    }),
  ]);

  const thisMonth = revenueThisMonth._sum.total ?? 0;
  const prevMonth = revenuePrevMonth._sum.total ?? 0;
  const revenueGrowthPct =
    prevMonth > 0 ? Math.round(((thisMonth - prevMonth) / prevMonth) * 1000) / 10 : null;

  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const [
    ordersByStatusRows,
    delayedOrders,
    refundRequests,
    recentActivity,
    pendingApprovals,
    openTickets,
    pendingPaymentsCount,
    farmOps,
  ] = await Promise.all([
    prisma.order.groupBy({
      by: ["status"],
      _count: { _all: true },
      where: { status: { notIn: ["CANCELLED", "REFUNDED", "RETURNED"] } },
    }),
    prisma.order.count({
      where: {
        status: { in: ["CONFIRMED", "PAID", "PREPARING", "OUT_FOR_DELIVERY"] },
        updatedAt: { lt: twoHoursAgo },
      },
    }),
    prisma.returnRequest.count({ where: { status: "PENDING" } }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        action: true,
        details: true,
        entity: true,
        createdAt: true,
        actorName: true,
      },
    }),
    prisma.product.count({
      where: { reviewStatus: "PENDING", deletedAt: null },
    }),
    prisma.supportTicket.count({
      where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
    }),
    prisma.payment.count({ where: { status: "PENDING" } }),
    farmOpsCounts(),
  ]);

  const statusMap = Object.fromEntries(
    ordersByStatusRows.map((r) => [r.status, r._count._all])
  ) as Record<string, number>;

  const ordersByStatus = {
    pending: (statusMap.PENDING || 0) + (statusMap.PAID || 0),
    preparing:
      (statusMap.CONFIRMED || 0) +
      (statusMap.PREPARING || 0) +
      (statusMap.PACKED || 0) +
      (statusMap.READY_FOR_DISPATCH || 0) +
      (statusMap.READY_FOR_PICKUP || 0),
    outForDelivery: statusMap.OUT_FOR_DELIVERY || 0,
    delivered: statusMap.DELIVERED || 0,
  };

  const pendingOrders =
    (statusMap.PENDING || 0) +
    (statusMap.PAID || 0) +
    (statusMap.CONFIRMED || 0) +
    (statusMap.PREPARING || 0) +
    (statusMap.PACKED || 0) +
    (statusMap.READY_FOR_DISPATCH || 0) +
    (statusMap.READY_FOR_PICKUP || 0) +
    (statusMap.OUT_FOR_DELIVERY || 0);

  return {
    counts: {
      todayOrders,
      pendingPayment,
      pendingOrders,
      pendingApprovals,
      openTickets,
      pendingPayments: pendingPaymentsCount,
      paidReady,
      preparing,
      outForDelivery,
      deliveredToday,
      revenueToday: revenueToday._sum.total ?? 0,
      lowStock: lowStockCount,
      pendingFarmers,
      /** @deprecated alias kept for older clients */
      pendingSuppliers: pendingFarmers,
      pendingDeliveries: outForDelivery + preparing,
      delayedOrders,
      refundRequests,
      completedOrders,
      revenueThisMonth: thisMonth,
      revenuePrevMonth: prevMonth,
      revenueGrowthPct,
      newCustomersMonth,
      suppliersApproved: supplierStats.find((s) => s.status === "APPROVED")?._count._all ?? 0,
      suppliersPending: supplierStats.find((s) => s.status === "PENDING")?._count._all ?? 0,
      ...farmOps,
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
    lowStockPreview: lowStockPreview.map((p) => ({
      name: p.nameEn,
      stockQty: p.stockQty,
      unit: p.unit,
    })),
    ordersLast7Days,
    topProducts,
    salesByCategory,
    ordersByStatus,
    recentActivity: recentActivity.map((a) => ({
      id: a.id,
      time: a.createdAt.toISOString(),
      title: a.action.replace(/\./g, " · "),
      body: a.details || `${a.entity}${a.actorName ? ` · ${a.actorName}` : ""}`,
    })),
  };
}
