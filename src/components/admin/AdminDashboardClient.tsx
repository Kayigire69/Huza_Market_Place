"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatRwf } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

type DayStat = { date: string; label: string; orders: number; revenue: number };
type TopProduct = {
  productId: string;
  name: string;
  category: string;
  unitsSold: number;
  revenue: number;
};
type CategorySale = {
  categoryId: string;
  name: string;
  units: number;
  revenue: number;
};
type ScheduleItem = {
  id: string;
  timeLabel: string;
  title: string;
  detail: string;
  tone: "prepare" | "delivery" | "farmer" | "stock";
  href: string;
};

type LivePayload = {
  counts: {
    todayOrders: number;
    pendingPayment: number;
    paidReady: number;
    preparing: number;
    outForDelivery: number;
    deliveredToday: number;
    revenueToday: number;
    revenueYesterday?: number;
    revenueVsYesterdayPct?: number | null;
    lowStock: number;
    pendingFarmers?: number;
    pendingSuppliers?: number;
    completedOrders?: number;
    revenueThisMonth?: number;
    revenuePrevMonth?: number;
    revenueGrowthPct?: number | null;
    newCustomersMonth?: number;
    suppliersApproved?: number;
    suppliersPending?: number;
    suppliersTotal?: number;
    warehouseProducts?: number;
    warehouseOutOfStock?: number;
    warehouseLowStock?: number;
  };
  recentOrders: {
    id: string;
    orderNumber: string;
    receiptNumber: string | null;
    customer: string;
    total: number;
    status: string;
    paymentStatus: string | null;
    createdAt: string;
  }[];
  notifications: { id: string; title: string; body: string; createdAt: string }[];
  ordersLast7Days?: DayStat[];
  topProducts?: TopProduct[];
  salesByCategory?: CategorySale[];
  lowStockPreview?: { name: string; stockQty: number; unit: string }[];
  todaySchedule?: { dateLabel: string; items: ScheduleItem[] };
};

function actionForStatus(status: string) {
  if (status === "PENDING") return "Waiting for payment";
  if (status === "PAID" || status === "CONFIRMED") return "Prepare";
  if (status === "PREPARING" || status === "PACKED") return "Assign driver";
  if (status === "OUT_FOR_DELIVERY") return "Track delivery";
  return "View";
}

function scheduleToneClass(tone: ScheduleItem["tone"]) {
  if (tone === "prepare") return "bg-emerald-50 text-emerald-800";
  if (tone === "delivery") return "bg-sky-50 text-sky-800";
  if (tone === "farmer") return "bg-amber-50 text-amber-900";
  return "bg-orange-50 text-orange-900";
}

const QUICK_ACTIONS: { href: string; label: string }[] = [
  { href: "/admin/products", label: "+ Add product" },
  { href: "/admin/offers", label: "+ Create offer" },
  { href: "/admin/customers", label: "+ Add customer" },
  { href: "/admin/suppliers", label: "+ Register farmer" },
  { href: "/admin/reports", label: "+ Generate report" },
];

export function AdminDashboardClient({
  initial,
  lowStockPreview,
}: {
  initial: LivePayload;
  lowStockPreview: { name: string; stockQty: number; unit: string }[];
}) {
  const [data, setData] = useState(initial);

  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch("/api/admin/live?full=1");
        if (res.ok) setData(await res.json());
      } catch {
        /* ignore */
      }
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  const c = data.counts;
  const pendingFarmers = c.pendingFarmers ?? c.pendingSuppliers ?? 0;
  const week = data.ordersLast7Days || [];
  const topProducts = data.topProducts || [];
  const salesByCategory = data.salesByCategory || [];
  const stockPreview = data.lowStockPreview || lowStockPreview;
  const schedule = data.todaySchedule;

  const maxOrders = Math.max(1, ...week.map((d) => d.orders));
  const maxCategoryRevenue = Math.max(1, ...salesByCategory.map((d) => d.revenue));

  const vsYesterday =
    c.revenueVsYesterdayPct == null
      ? null
      : `${c.revenueVsYesterdayPct > 0 ? "↑" : c.revenueVsYesterdayPct < 0 ? "↓" : "→"} ${Math.abs(
          c.revenueVsYesterdayPct,
        )}% vs yesterday`;

  const cards = [
    { label: "Today's orders", value: String(c.todayOrders), tone: "bg-emerald-50 text-emerald-900", href: "/admin/orders" },
    {
      label: "Today's revenue",
      value: formatRwf(c.revenueToday),
      tone: "bg-sky-50 text-sky-900",
      href: "/admin/reports",
      hint: vsYesterday,
    },
    {
      label: "MoM revenue growth",
      value:
        c.revenueGrowthPct == null
          ? "—"
          : `${c.revenueGrowthPct > 0 ? "+" : ""}${c.revenueGrowthPct}%`,
      tone: "bg-violet-50 text-violet-900",
      href: "/admin/reports",
    },
    { label: "Pending payment", value: String(c.pendingPayment), tone: "bg-amber-50 text-amber-900", href: "/admin/payments" },
    {
      label: "Completed orders",
      value: String(c.completedOrders ?? c.deliveredToday),
      tone: "bg-lime-50 text-lime-900",
      href: "/admin/orders",
    },
    {
      label: "New customers (month)",
      value: String(c.newCustomersMonth ?? 0),
      tone: "bg-teal-50 text-teal-900",
      href: "/admin/customers",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="admin-panel-title text-2xl sm:text-3xl">Dashboard</h1>
          <p className="admin-panel-sub">
            Live business data from real orders, stock, and farmers — updates every 30 seconds.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/orders">
            <Button size="sm">View all orders</Button>
          </Link>
          <Link href="/admin/reports">
            <Button size="sm" variant="ghost">
              Generate report
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className={`admin-kpi ${card.tone} transition hover:brightness-[0.98]`}>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] opacity-80">{card.label}</p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight">
              {card.value}
            </p>
            {"hint" in card && card.hint ? (
              <p className="mt-1 text-[11px] font-semibold opacity-75">{card.hint}</p>
            ) : null}
          </Link>
        ))}
      </div>

      {/* Phase 11–12 summary cards: Farmers + Warehouse */}
      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/admin/suppliers" className="admin-panel block p-5 transition hover:shadow-md">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--huza-green-dark)]">
              Farmers
            </h2>
            <span className="text-sm font-semibold text-[var(--huza-green)]">Manage →</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-[#f8fbf9] px-3 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--huza-muted)]">Total</p>
              <p className="mt-1 text-xl font-bold text-[var(--huza-green-dark)]">
                {c.suppliersTotal ?? (c.suppliersApproved ?? 0) + (c.suppliersPending ?? pendingFarmers)}
              </p>
            </div>
            <div className="rounded-2xl bg-emerald-50 px-3 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700/80">Approved</p>
              <p className="mt-1 text-xl font-bold text-emerald-900">{c.suppliersApproved ?? 0}</p>
            </div>
            <div className="rounded-2xl bg-amber-50 px-3 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-amber-800/80">Pending</p>
              <p className="mt-1 text-xl font-bold text-amber-950">{c.suppliersPending ?? pendingFarmers}</p>
            </div>
          </div>
        </Link>

        <Link href="/admin/inventory" className="admin-panel block p-5 transition hover:shadow-md">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--huza-green-dark)]">
              Warehouse
            </h2>
            <span className="text-sm font-semibold text-[var(--huza-green)]">Inventory →</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-[#f8fbf9] px-3 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--huza-muted)]">Products</p>
              <p className="mt-1 text-xl font-bold text-[var(--huza-green-dark)]">
                {c.warehouseProducts ?? "—"}
              </p>
            </div>
            <div className="rounded-2xl bg-rose-50 px-3 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-rose-800/80">Out of stock</p>
              <p className="mt-1 text-xl font-bold text-rose-950">{c.warehouseOutOfStock ?? 0}</p>
            </div>
            <div className="rounded-2xl bg-orange-50 px-3 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-orange-800/80">Low stock</p>
              <p className="mt-1 text-xl font-bold text-orange-950">
                {c.warehouseLowStock ?? c.lowStock}
              </p>
            </div>
          </div>
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="admin-panel p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--huza-green-dark)]">
              Recent orders
            </h2>
            <Link href="/admin/orders" className="text-sm font-semibold text-[var(--huza-green)]">
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {data.recentOrders.length === 0 ? (
              <p className="text-sm text-[var(--huza-muted)]">No orders yet.</p>
            ) : (
              data.recentOrders.map((o) => (
                <div key={o.id} className="admin-row !py-3">
                  <div>
                    <p className="font-mono text-sm font-semibold text-[var(--huza-green-dark)]">
                      {o.orderNumber}
                    </p>
                    <p className="text-xs text-[var(--huza-muted)]">
                      {o.customer} · {formatRwf(o.total)} · {new Date(o.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[var(--huza-mint)] px-2 py-1 text-xs font-medium">
                      {o.status}
                    </span>
                    <Link
                      href={`/admin/orders?focus=${encodeURIComponent(o.orderNumber)}`}
                      className="text-xs font-semibold text-[var(--huza-green)]"
                    >
                      {actionForStatus(o.status)} →
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="admin-panel p-5">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--huza-green-dark)]">
              Alerts
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="rounded-xl bg-red-50 px-3 py-2 text-red-800">
                {c.pendingPayment} pending payment
              </li>
              <li className="rounded-xl bg-orange-50 px-3 py-2 text-orange-800">
                {c.lowStock} low stock products
              </li>
              <li className="rounded-xl bg-emerald-50 px-3 py-2 text-emerald-800">
                {c.paidReady} paid — ready to prepare
              </li>
              <li className="rounded-xl bg-sky-50 px-3 py-2 text-sky-800">
                {pendingFarmers} farmer applications
              </li>
            </ul>
          </div>

          <div className="admin-panel p-5">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--huza-green-dark)]">
              Low stock
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              {stockPreview.length === 0 ? (
                <li className="text-[var(--huza-muted)]">Stock levels look healthy.</li>
              ) : (
                stockPreview.map((p) => (
                  <li key={p.name} className="flex justify-between gap-2">
                    <span>{p.name}</span>
                    <span className="font-semibold text-orange-700">
                      {p.stockQty} {p.unit}
                    </span>
                  </li>
                ))
              )}
            </ul>
            <Link href="/admin/inventory" className="mt-3 inline-block text-sm font-semibold text-[var(--huza-green)]">
              Open inventory →
            </Link>
          </div>
        </div>
      </div>

      {/* Phase 10 — Today's schedule from real ops */}
      <div className="admin-panel p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--huza-green-dark)]">
              Today&apos;s schedule
            </h2>
            <p className="text-sm text-[var(--huza-muted)]">
              {schedule?.dateLabel || "Today"} — prepared from live orders, deliveries, farmers, and stock.
            </p>
          </div>
          <Link href="/admin/orders" className="text-sm font-semibold text-[var(--huza-green)]">
            Open ops →
          </Link>
        </div>
        {!schedule?.items?.length ? (
          <p className="text-sm text-[var(--huza-muted)]">No urgent tasks queued right now.</p>
        ) : (
          <ul className="space-y-2">
            {schedule.items.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="flex flex-wrap items-start gap-3 rounded-2xl border border-[var(--huza-line)] bg-[#fbfdfc] px-3 py-3 transition hover:border-[var(--huza-green)]/40"
                >
                  <span
                    className={`min-w-[4.5rem] rounded-full px-2.5 py-1 text-center text-[11px] font-bold ${scheduleToneClass(item.tone)}`}
                  >
                    {item.timeLabel}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-[var(--huza-green-dark)]">
                      {item.title}
                    </span>
                    <span className="block text-xs text-[var(--huza-muted)]">{item.detail}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="admin-panel p-5">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--huza-green-dark)]">
            Orders last 7 days
          </h2>
          <div className="mt-4 flex h-40 items-end gap-2">
            {week.length === 0 ? (
              <p className="text-sm text-[var(--huza-muted)]">No order data yet.</p>
            ) : (
              week.map((day) => {
                const h = Math.max(4, Math.round((day.orders / maxOrders) * 120));
                return (
                  <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-[10px] font-semibold text-[var(--huza-green-dark)]">
                      {day.orders || ""}
                    </span>
                    <div
                      className="w-full rounded-t-lg bg-[var(--huza-green)]/80"
                      style={{ height: h }}
                      title={`${day.orders} orders · ${formatRwf(day.revenue)}`}
                    />
                    <span className="text-[10px] text-[var(--huza-muted)]">{day.label}</span>
                  </div>
                );
              })
            )}
          </div>
          <p className="mt-2 text-xs text-[var(--huza-muted)]">
            Real order counts from the database (excludes cancelled / refunded).
          </p>
        </div>

        <div className="admin-panel p-5">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--huza-green-dark)]">
            Sales by category
          </h2>
          <div className="mt-3 space-y-2">
            {salesByCategory.length === 0 ? (
              <p className="text-sm text-[var(--huza-muted)]">No paid sales yet.</p>
            ) : (
              salesByCategory.map((cat) => {
                const pct = Math.round((cat.revenue / maxCategoryRevenue) * 100);
                return (
                  <div key={cat.categoryId}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-medium">{cat.name}</span>
                      <span className="text-[var(--huza-muted)]">
                        {formatRwf(cat.revenue)} · {cat.units} sold
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[var(--huza-mint)]">
                      <div
                        className="h-full rounded-full bg-[var(--huza-green)]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="admin-panel p-5">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--huza-green-dark)]">
          Top products (by units sold)
        </h2>
        <ol className="mt-3 space-y-2 text-sm">
          {topProducts.length === 0 ? (
            <li className="text-[var(--huza-muted)]">No product sales yet.</li>
          ) : (
            topProducts.map((p, idx) => (
              <li
                key={p.productId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#f8fbf9] px-3 py-2"
              >
                <span>
                  <span className="mr-2 font-bold text-[var(--huza-green)]">{idx + 1}</span>
                  {p.name}
                  <span className="ml-2 text-xs text-[var(--huza-muted)]">{p.category}</span>
                </span>
                <span className="text-[var(--huza-muted)]">
                  {p.unitsSold} sold · {formatRwf(p.revenue)}
                </span>
              </li>
            ))
          )}
        </ol>
      </div>

      {/* Phase 7 — Quick actions */}
      <div className="admin-panel p-5">
        <h2 className="mb-3 font-[family-name:var(--font-display)] text-lg font-bold text-[var(--huza-green-dark)]">
          Quick actions
        </h2>
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((action) => (
            <Link key={action.href + action.label} href={action.href}>
              <Button size="sm" variant="ghost">
                {action.label}
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
