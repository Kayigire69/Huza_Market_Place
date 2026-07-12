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

type LivePayload = {
  counts: {
    todayOrders: number;
    pendingPayment: number;
    paidReady: number;
    preparing: number;
    outForDelivery: number;
    deliveredToday: number;
    revenueToday: number;
    lowStock: number;
    pendingFarmers?: number;
    pendingSuppliers?: number;
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
};

function actionForStatus(status: string) {
  if (status === "PENDING") return "Waiting for payment";
  if (status === "PAID" || status === "CONFIRMED") return "Prepare";
  if (status === "PREPARING" || status === "PACKED") return "Assign driver";
  if (status === "OUT_FOR_DELIVERY") return "Track delivery";
  return "View";
}

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

  const maxOrders = Math.max(1, ...week.map((d) => d.orders));
  const maxCategoryRevenue = Math.max(1, ...salesByCategory.map((d) => d.revenue));

  const cards = [
    { label: "Today's orders", value: String(c.todayOrders), tone: "bg-emerald-50 text-emerald-900" },
    { label: "Today's revenue", value: formatRwf(c.revenueToday), tone: "bg-sky-50 text-sky-900" },
    { label: "Pending payment", value: String(c.pendingPayment), tone: "bg-amber-50 text-amber-900" },
    { label: "Paid / ready", value: String(c.paidReady), tone: "bg-lime-50 text-lime-900" },
    { label: "Preparing", value: String(c.preparing), tone: "bg-teal-50 text-teal-900" },
    { label: "Out for delivery", value: String(c.outForDelivery), tone: "bg-indigo-50 text-indigo-900" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="admin-panel-title text-2xl sm:text-3xl">Dashboard</h1>
          <p className="admin-panel-sub">
            Live business data from real orders, stock, and farmers — updates every 15 seconds.
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
          <div key={card.label} className={`admin-kpi ${card.tone}`}>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] opacity-80">{card.label}</p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="admin-panel p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--huza-green-dark)]">Recent orders</h2>
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
            <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--huza-green-dark)]">Alerts</h2>
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
            <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--huza-green-dark)]">Low stock</h2>
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

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="admin-panel p-5">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--huza-green-dark)]">Orders last 7 days</h2>
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
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--huza-green-dark)]">Sales by category</h2>
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
        <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--huza-green-dark)]">Top products (by units sold)</h2>
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

      <div className="admin-panel p-5">
        <h2 className="mb-3 font-[family-name:var(--font-display)] text-lg font-bold text-[var(--huza-green-dark)]">Quick actions</h2>
        <div className="flex flex-wrap gap-2">
          {[
            ["/admin/products", "Manage products"],
            ["/admin/suppliers", "Review farmers"],
            ["/admin/inventory", "Stock in / out"],
            ["/admin/reports", "PDF reports"],
            ["/admin/settings", "Settings"],
          ].map(([href, label]) => (
            <Link key={href} href={href}>
              <Button size="sm" variant="ghost">
                {label}
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
