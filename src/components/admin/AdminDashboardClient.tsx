"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { formatRwf } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { roleCanAccessModule, type AdminModule } from "@/lib/admin-nav";
import {
  AlertTriangle,
  PackagePlus,
  ShoppingBag,
  UserCheck,
  ClipboardPlus,
  ClipboardCheck,
  LifeBuoy,
} from "lucide-react";

type DayStat = { date: string; label: string; orders: number; revenue: number };

type LivePayload = {
  counts: {
    todayOrders: number;
    pendingPayment: number;
    pendingOrders?: number;
    pendingApprovals?: number;
    openTickets?: number;
    pendingPayments?: number;
    paidReady: number;
    preparing: number;
    outForDelivery: number;
    deliveredToday: number;
    revenueToday: number;
    lowStock: number;
    pendingFarmers?: number;
    pendingSuppliers?: number;
    pendingDeliveries?: number;
    delayedOrders?: number;
    refundRequests?: number;
    completedOrders?: number;
    revenueGrowthPct?: number | null;
  };
  recentOrders: {
    id: string;
    orderNumber: string;
    customer: string;
    total: number;
    status: string;
    createdAt: string;
  }[];
  notifications: { id: string; title: string; body: string; createdAt: string }[];
  ordersLast7Days?: DayStat[];
  ordersByStatus?: {
    pending: number;
    preparing: number;
    outForDelivery: number;
    delivered: number;
  };
  recentActivity?: { id: string; time: string; title: string; body: string }[];
  lowStockPreview?: { name: string; stockQty: number; unit: string }[];
};

function formatCompactRwf(n: number) {
  if (n >= 1_000_000) return `RWF ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `RWF ${(n / 1_000).toFixed(0)}K`;
  return formatRwf(n);
}

function SalesTrendChart({ days }: { days: DayStat[] }) {
  const max = Math.max(1, ...days.map((d) => d.revenue || d.orders));
  return (
    <div className="admin-card h-full">
      <h3 className="admin-card-title">Sales Trend</h3>
      <p className="mb-4 text-xs text-[var(--admin-muted)]">Revenue · last 7 days</p>
      {days.every((d) => !d.revenue && !d.orders) ? (
        <p className="py-10 text-center text-sm text-[var(--admin-muted)]">No sales in the last 7 days yet.</p>
      ) : (
        <div className="flex h-44 items-end gap-2">
          {days.map((d) => {
            const value = d.revenue || d.orders;
            const h = Math.max(6, Math.round((value / max) * 140));
            return (
              <div key={d.date} className="flex flex-1 flex-col items-center justify-end gap-1">
                <div
                  className="w-full max-w-[40px] rounded-t-md bg-[var(--huza-green)]/85"
                  style={{ height: `${h}px` }}
                  title={`${formatRwf(d.revenue)} · ${d.orders} orders`}
                />
                <span className="text-[10px] font-semibold text-[var(--admin-muted)]">{d.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatusDonut({
  data,
}: {
  data: { pending: number; preparing: number; outForDelivery: number; delivered: number };
}) {
  const slices = [
    { key: "Pending", value: data.pending, color: "#F59E0B" },
    { key: "Preparing", value: data.preparing, color: "#0B5C34" },
    { key: "Out for Delivery", value: data.outForDelivery, color: "#E86B1A" },
    { key: "Delivered", value: data.delivered, color: "#1FA65A" },
  ];
  const total = slices.reduce((s, x) => s + x.value, 0);
  let angle = 0;
  const gradients = slices.map((s) => {
    const start = angle;
    const sweep = ((s.value / Math.max(1, total)) * 360);
    angle += sweep;
    return `${s.color} ${start}deg ${angle}deg`;
  });

  return (
    <div className="admin-card h-full">
      <h3 className="admin-card-title">Orders by Status</h3>
      <p className="mb-4 text-xs text-[var(--admin-muted)]">Live pipeline snapshot</p>
      {total === 0 ? (
        <p className="py-10 text-center text-sm text-[var(--admin-muted)]">No open orders in the pipeline.</p>
      ) : (
        <div className="flex flex-col items-center gap-5 sm:flex-row">
          <div
            className="size-36 shrink-0 rounded-full"
            style={{
              background: `conic-gradient(${gradients.join(", ")})`,
              mask: "radial-gradient(circle at center, transparent 52%, black 53%)",
              WebkitMask: "radial-gradient(circle at center, transparent 52%, black 53%)",
            }}
            aria-hidden
          />
          <ul className="w-full space-y-2 text-sm">
            {slices.map((s) => (
              <li key={s.key} className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2">
                  <span className="size-2.5 rounded-full" style={{ background: s.color }} />
                  {s.key}
                </span>
                <span className="font-semibold tabular-nums">{s.value}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

type Kpi = {
  label: string;
  value: string;
  href?: string;
  module?: AdminModule;
  hint?: string;
};

export function AdminDashboardClient({
  initial,
}: {
  initial: LivePayload;
  lowStockPreview: { name: string; stockQty: number; unit: string }[];
}) {
  const { data: session } = useSession();
  const role = session?.user?.role;
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
  const pendingOrders =
    c.pendingOrders ??
    c.pendingPayment + c.paidReady + c.preparing + c.outForDelivery;
  const week = data.ordersLast7Days || [];
  const status = data.ordersByStatus || {
    pending: c.pendingPayment,
    preparing: c.preparing,
    outForDelivery: c.outForDelivery,
    delivered: c.deliveredToday,
  };

  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
    []
  );

  const attention = useMemo(() => {
    const rows = [
      pendingFarmers > 0 && {
        tone: "red",
        label: `${pendingFarmers} farmer${pendingFarmers === 1 ? "" : "s"} waiting approval`,
        href: "/admin/suppliers",
        module: "farmers" as AdminModule,
      },
      (c.pendingApprovals || 0) > 0 && {
        tone: "red",
        label: `${c.pendingApprovals} product${c.pendingApprovals === 1 ? "" : "s"} awaiting inspection`,
        href: "/admin/approvals",
        module: "approvals" as AdminModule,
      },
      (c.delayedOrders || 0) > 0 && {
        tone: "orange",
        label: `${c.delayedOrders} order${c.delayedOrders === 1 ? "" : "s"} delayed (>2h)`,
        href: "/admin/orders",
        module: "orders" as AdminModule,
      },
      c.lowStock > 0 && {
        tone: "amber",
        label: `${c.lowStock} product${c.lowStock === 1 ? "" : "s"} low in stock`,
        href: "/admin/inventory",
        module: "inventory" as AdminModule,
      },
      (c.pendingPayments ?? c.pendingPayment) > 0 && {
        tone: "blue",
        label: `${c.pendingPayments ?? c.pendingPayment} pending payment${(c.pendingPayments ?? c.pendingPayment) === 1 ? "" : "s"}`,
        href: "/admin/payments",
        module: "payments" as AdminModule,
      },
      (c.refundRequests || 0) > 0 && {
        tone: "blue",
        label: `${c.refundRequests} refund request${c.refundRequests === 1 ? "" : "s"}`,
        href: "/admin/payments?tab=refunds",
        module: "payments" as AdminModule,
      },
      (c.openTickets || 0) > 0 && {
        tone: "orange",
        label: `${c.openTickets} open support ticket${c.openTickets === 1 ? "" : "s"}`,
        href: "/admin/support",
        module: "support" as AdminModule,
      },
    ].filter(Boolean) as {
      tone: string;
      label: string;
      href: string;
      module: AdminModule;
    }[];

    return rows.filter((r) => roleCanAccessModule(role, r.module));
  }, [c, pendingFarmers, role]);

  const activity =
    data.recentActivity && data.recentActivity.length > 0
      ? data.recentActivity
      : [
          ...data.notifications.slice(0, 4).map((n) => ({
            id: n.id,
            time: n.createdAt,
            title: n.title,
            body: n.body,
          })),
          ...data.recentOrders.slice(0, 4).map((o) => ({
            id: o.id,
            time: o.createdAt,
            title: `Order ${o.orderNumber}`,
            body: `${o.status} · ${o.customer}`,
          })),
        ].slice(0, 8);

  const kpis: Kpi[] = [
    {
      label: "Today's Sales",
      value: formatCompactRwf(c.revenueToday),
      href: "/admin/reports",
      module: "reports",
      hint: c.revenueGrowthPct != null ? `Month ${c.revenueGrowthPct > 0 ? "+" : ""}${c.revenueGrowthPct}%` : undefined,
    },
    {
      label: "Orders Today",
      value: String(c.todayOrders),
      href: "/admin/orders",
      module: "orders",
    },
    {
      label: "Pending Orders",
      value: String(pendingOrders),
      href: "/admin/orders?tab=pending",
      module: "orders",
      hint: "Not yet delivered",
    },
    {
      label: "Low Stock",
      value: String(c.lowStock),
      href: "/admin/inventory?tab=low",
      module: "inventory",
    },
    {
      label: "Farmers Waiting",
      value: String(pendingFarmers),
      href: "/admin/suppliers",
      module: "farmers",
    },
  ].filter((k) => !k.module || roleCanAccessModule(role, k.module));

  const quick = [
    { href: "/admin/orders", label: "View Orders", icon: ShoppingBag, module: "orders" as const },
    { href: "/admin/approvals", label: "Product Approvals", icon: ClipboardCheck, module: "approvals" as const },
    { href: "/admin/suppliers", label: "Approve Farmer", icon: UserCheck, module: "farmers" as const },
    { href: "/admin/products", label: "Add Product", icon: PackagePlus, module: "products" as const },
    {
      href: "/admin/procurement/orders",
      label: "Purchase Orders",
      icon: ClipboardPlus,
      module: "purchase_orders" as const,
    },
    { href: "/admin/support", label: "Support Inbox", icon: LifeBuoy, module: "support" as const },
  ].filter((q) => roleCanAccessModule(role, q.module));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--admin-muted)]">
            {todayLabel}
          </p>
          <h1 className="admin-panel-title mt-1">Dashboard</h1>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {quick.slice(0, 4).map((q) => (
            <Link key={q.href + q.label} href={q.href}>
              <Button size="sm" variant="ghost" className="gap-1.5">
                <q.icon className="size-3.5" />
                {q.label}
              </Button>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {kpis.map((card) => {
          const inner = (
            <>
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--admin-muted)]">
                {card.label}
              </p>
              <p className="mt-2 font-[family-name:var(--font-admin,var(--font-body))] text-2xl font-bold tracking-tight text-[var(--admin-ink)]">
                {card.value}
              </p>
              {card.hint ? (
                <p className="mt-1 text-[11px] text-[var(--admin-muted)]">{card.hint}</p>
              ) : null}
            </>
          );
          return card.href ? (
            <Link key={card.label} href={card.href} className="admin-kpi-card block transition hover:border-[#b7dcc6]">
              {inner}
            </Link>
          ) : (
            <div key={card.label} className="admin-kpi-card">
              {inner}
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="admin-card">
          <div className="mb-4">
            <h2 className="admin-card-title">Needs Attention</h2>
            <p className="text-xs text-[var(--admin-muted)]">Do these first — ranked by urgency</p>
          </div>
          {attention.length === 0 ? (
            <p className="rounded-xl bg-[var(--admin-soft)] px-4 py-6 text-sm text-[var(--admin-muted)]">
              Nothing urgent — nice work.
            </p>
          ) : (
            <ul className="space-y-2">
              {attention.map((a) => (
                <li key={a.label}>
                  <Link href={a.href} className={`admin-attention-row admin-attention-${a.tone}`}>
                    <AlertTriangle className="size-4 shrink-0" />
                    <span className="flex-1 font-medium">{a.label}</span>
                    <span className="text-xs font-semibold opacity-70">Open →</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="admin-card">
          <h2 className="admin-card-title mb-1">Recent Activity</h2>
          <p className="mb-4 text-xs text-[var(--admin-muted)]">Latest staff actions & updates</p>
          {activity.length === 0 ? (
            <p className="text-sm text-[var(--admin-muted)]">No recent activity yet.</p>
          ) : (
            <ul className="divide-y divide-[var(--admin-line)]">
              {activity.map((a) => (
                <li key={a.id} className="flex gap-3 py-2.5 text-sm">
                  <time className="w-12 shrink-0 text-[11px] font-semibold tabular-nums text-[var(--admin-muted)]">
                    {new Date(a.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </time>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[var(--admin-ink)]">{a.title}</p>
                    <p className="truncate text-xs text-[var(--admin-muted)]">{a.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SalesTrendChart days={week} />
        <StatusDonut data={status} />
      </div>
    </div>
  );
}
