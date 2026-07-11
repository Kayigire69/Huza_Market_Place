"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatRwf } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

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
    pendingSuppliers: number;
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
  topProducts,
}: {
  initial: LivePayload;
  lowStockPreview: { name: string; stockQty: number; unit: string }[];
  topProducts: { name: string; soldHint: number }[];
}) {
  const [data, setData] = useState(initial);

  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch("/api/admin/live");
        if (res.ok) setData(await res.json());
      } catch {
        /* ignore */
      }
    }, 15_000);
    return () => clearInterval(id);
  }, []);

  const c = data.counts;
  const cards = [
    { label: "Today's orders", value: String(c.todayOrders), tone: "bg-emerald-50 text-emerald-900" },
    { label: "Today's revenue", value: formatRwf(c.revenueToday), tone: "bg-sky-50 text-sky-900" },
    { label: "Pending payment", value: String(c.pendingPayment), tone: "bg-amber-50 text-amber-900" },
    { label: "Paid / ready", value: String(c.paidReady), tone: "bg-lime-50 text-lime-900" },
    { label: "Preparing", value: String(c.preparing), tone: "bg-teal-50 text-teal-900" },
    { label: "Out for delivery", value: String(c.outForDelivery), tone: "bg-indigo-50 text-indigo-900" },
  ];

  const maxOrders = Math.max(
    ...["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((_, i) => {
      const day = (new Date().getDay() + 6) % 7;
      return i === day ? c.todayOrders || 1 : Math.max(1, Math.round((c.todayOrders || 3) * (0.4 + i * 0.08)));
    }),
    1
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--huza-green-dark)] sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-[var(--huza-muted)]">
            What is happening in the business right now — updates every 15 seconds.
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
          <div key={card.label} className={`rounded-2xl border border-white/60 p-4 shadow-sm ${card.tone}`}>
            <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{card.label}</p>
            <p className="mt-2 text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-[var(--huza-line)] bg-white p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Recent orders</h2>
            <Link href="/admin/orders" className="text-sm font-semibold text-[var(--huza-green)]">
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {data.recentOrders.map((o) => (
              <div
                key={o.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--huza-line)] px-3 py-3"
              >
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
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-[var(--huza-line)] bg-white p-5">
            <h2 className="font-semibold">Alerts</h2>
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
                {c.pendingSuppliers} supplier applications
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-[var(--huza-line)] bg-white p-5">
            <h2 className="font-semibold">Low stock</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {lowStockPreview.length === 0 ? (
                <li className="text-[var(--huza-muted)]">Stock levels look healthy.</li>
              ) : (
                lowStockPreview.map((p) => (
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
        <div className="rounded-2xl border border-[var(--huza-line)] bg-white p-5">
          <h2 className="font-semibold">Orders this week (snapshot)</h2>
          <div className="mt-4 flex h-40 items-end gap-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => {
              const dayIdx = (new Date().getDay() + 6) % 7;
              const value =
                i === dayIdx
                  ? c.todayOrders
                  : Math.max(1, Math.round((c.todayOrders || 3) * (0.45 + ((i * 17) % 5) * 0.12)));
              const h = Math.max(8, Math.round((value / maxOrders) * 120));
              return (
                <div key={day} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-lg bg-[var(--huza-green)]/80"
                    style={{ height: h }}
                    title={`${value} orders`}
                  />
                  <span className="text-[10px] text-[var(--huza-muted)]">{day}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-[var(--huza-muted)]">
            Today highlighted. Historical bars are operational placeholders until daily aggregates are stored.
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--huza-line)] bg-white p-5">
          <h2 className="font-semibold">Top products</h2>
          <ol className="mt-3 space-y-2 text-sm">
            {topProducts.map((p, idx) => (
              <li key={p.name} className="flex items-center justify-between rounded-xl bg-[#f8fbf9] px-3 py-2">
                <span>
                  <span className="mr-2 font-bold text-[var(--huza-green)]">{idx + 1}</span>
                  {p.name}
                </span>
                <span className="text-[var(--huza-muted)]">{p.soldHint} sold hint</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--huza-line)] bg-white p-5">
        <h2 className="mb-3 font-semibold">Quick actions</h2>
        <div className="flex flex-wrap gap-2">
          {[
            ["/admin/products", "Manage products"],
            ["/admin/suppliers", "Review suppliers"],
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
