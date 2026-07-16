"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { formatRwf } from "@/lib/utils";
import { Search, X } from "lucide-react";

type OrderRow = {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: string;
  guestName?: string | null;
  guestPhone?: string | null;
  deliveryAddress?: string;
  user?: { fullName: string; phone: string; email?: string | null } | null;
  payment?: { status: string; method: string; amount: number } | null;
  delivery?: {
    id: string;
    status: string;
    deliveryPersonId: string | null;
    deliveryPerson?: { id: string; fullName: string; phone: string } | null;
  } | null;
  items?: { id: string; quantity: number; product?: { nameEn: string } | null }[];
};

type TabKey = "all" | "pending" | "confirmed" | "preparing" | "out" | "delivered" | "cancelled";
type Driver = { id: string; fullName: string; phone: string };

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "preparing", label: "Preparing" },
  { key: "out", label: "Out for Delivery" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
];

/** Guided next step — not a free-for-all status dump */
const FLOW: Record<string, { next: string; label: string }[]> = {
  PENDING: [{ next: "CONFIRMED", label: "Confirm order" }],
  PAID: [{ next: "CONFIRMED", label: "Confirm order" }],
  CONFIRMED: [{ next: "PREPARING", label: "Start preparing" }],
  PREPARING: [
    { next: "PACKED", label: "Mark packed" },
    { next: "READY_FOR_DISPATCH", label: "Ready for dispatch" },
  ],
  PACKED: [{ next: "READY_FOR_DISPATCH", label: "Ready for dispatch" }],
  READY_FOR_DISPATCH: [{ next: "OUT_FOR_DELIVERY", label: "Out for delivery" }],
  READY_FOR_PICKUP: [{ next: "DELIVERED", label: "Mark picked up" }],
  OUT_FOR_DELIVERY: [{ next: "DELIVERED", label: "Mark delivered" }],
};

function customerName(o: OrderRow) {
  return o.user?.fullName || o.guestName || "Guest";
}

function customerPhone(o: OrderRow) {
  return o.user?.phone || o.guestPhone || "—";
}

function statusClass(status: string) {
  if (status === "DELIVERED") return "admin-status admin-status-ok";
  if (status === "CANCELLED" || status === "REFUNDED") return "admin-status admin-status-muted";
  if (status === "OUT_FOR_DELIVERY") return "admin-status admin-status-warn";
  return "admin-status admin-status-warn";
}

export function AdminOrdersClient() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as TabKey) || "all";
  const [tab, setTab] = useState<TabKey>(
    TABS.some((t) => t.key === initialTab) ? initialTab : "all"
  );
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [viewing, setViewing] = useState<OrderRow | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ tab });
      if (debouncedQ) params.set("q", debouncedQ);
      const res = await fetch(`/api/admin/orders?${params}`);
      const data = await res.json();
      if (res.ok) setOrders(data.orders || []);
      else setMsg(data.error || "Failed to load orders");
    } catch {
      setMsg("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [tab, debouncedQ]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void fetch("/api/admin/deliveries?tab=pending")
      .then((r) => r.json())
      .then((d) => setDrivers(d.drivers || []))
      .catch(() => undefined);
  }, []);

  const updateStatus = async (id: string, status: string) => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setMsg(`Order → ${status.replace(/_/g, " ")}`);
      setViewing(null);
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  };

  const cancelOrder = async (o: OrderRow) => {
    if (!confirm(`Cancel order ${o.orderNumber}?`)) return;
    await updateStatus(o.id, "CANCELLED");
  };

  const assignDriver = async (deliveryId: string | undefined, deliveryPersonId: string) => {
    if (!deliveryId || !deliveryPersonId) {
      setMsg("No delivery record yet — confirm & prepare the order first.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/deliveries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryId, deliveryPersonId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Assign failed");
      setMsg("Driver assigned");
      setViewing(null);
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Assign failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="admin-panel-title">Orders</h1>
      </div>

      {msg ? (
        <p className="rounded-lg border border-[var(--admin-line)] bg-[var(--admin-soft)] px-3 py-2 text-sm">
          {msg}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`admin-filter-chip ${tab === t.key ? "is-active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <label className="relative block max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--admin-muted)]" />
        <input
          className="admin-input pl-9"
          placeholder="Search order ID, customer, phone…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </label>

      <div className="admin-panel overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-[var(--admin-muted)]">Loading orders…</p>
        ) : orders.length === 0 ? (
          <p className="p-6 text-sm text-[var(--admin-muted)]">No orders in this view.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Time</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="font-mono text-xs font-semibold">{o.orderNumber}</td>
                    <td>
                      <p className="font-medium">{customerName(o)}</p>
                      <p className="text-xs text-[var(--admin-muted)]">{customerPhone(o)}</p>
                    </td>
                    <td className="tabular-nums font-semibold">{formatRwf(o.total)}</td>
                    <td className="text-xs">
                      {o.payment ? (
                        <>
                          <span className="font-medium">{o.payment.status}</span>
                          <span className="text-[var(--admin-muted)]"> · {o.payment.method}</span>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <span className={statusClass(o.status)}>
                        {o.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="whitespace-nowrap text-xs text-[var(--admin-muted)]">
                      {new Date(o.createdAt).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="text-right">
                      <Button type="button" size="sm" variant="ghost" onClick={() => setViewing(o)}>
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {viewing ? (
        <div className="admin-drawer-backdrop" onClick={() => setViewing(null)}>
          <aside
            className="admin-drawer"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label={`Order ${viewing.orderNumber}`}
          >
            <div className="flex items-center justify-between border-b border-[var(--admin-line)] px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold">{viewing.orderNumber}</h2>
                <p className="text-xs text-[var(--admin-muted)]">
                  {formatRwf(viewing.total)} ·{" "}
                  <span className={statusClass(viewing.status)}>
                    {viewing.status.replace(/_/g, " ")}
                  </span>
                </p>
              </div>
              <button type="button" className="admin-icon-btn" onClick={() => setViewing(null)}>
                <X className="size-4" />
              </button>
            </div>
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase text-[var(--admin-muted)]">Customer</p>
                <p className="font-medium">{customerName(viewing)}</p>
                <p className="text-[var(--admin-muted)]">{customerPhone(viewing)}</p>
                {viewing.user?.email ? (
                  <p className="text-[var(--admin-muted)]">{viewing.user.email}</p>
                ) : null}
              </div>
              {viewing.deliveryAddress ? (
                <div>
                  <p className="text-xs font-semibold uppercase text-[var(--admin-muted)]">Address</p>
                  <p>{viewing.deliveryAddress}</p>
                </div>
              ) : null}
              <div>
                <p className="mb-1 text-xs font-semibold uppercase text-[var(--admin-muted)]">Items</p>
                <ul className="space-y-1">
                  {(viewing.items || []).map((i) => (
                    <li key={i.id} className="flex justify-between gap-2">
                      <span>{i.product?.nameEn || "Item"}</span>
                      <span className="tabular-nums text-[var(--admin-muted)]">×{i.quantity}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {viewing.status !== "CANCELLED" && viewing.status !== "DELIVERED" ? (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase text-[var(--admin-muted)]">
                    Next step
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(FLOW[viewing.status] || []).map((step) => (
                      <Button
                        key={step.next}
                        type="button"
                        size="sm"
                        disabled={busy}
                        onClick={() => void updateStatus(viewing.id, step.next)}
                      >
                        {step.label}
                      </Button>
                    ))}
                    <Button
                      type="button"
                      size="sm"
                      variant="danger"
                      disabled={busy}
                      onClick={() => void cancelOrder(viewing)}
                    >
                      Cancel order
                    </Button>
                  </div>
                </div>
              ) : null}

              {viewing.delivery ? (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase text-[var(--admin-muted)]">
                    Delivery
                  </p>
                  {viewing.delivery.deliveryPerson ? (
                    <p className="mb-2">
                      Driver: <strong>{viewing.delivery.deliveryPerson.fullName}</strong>
                    </p>
                  ) : (
                    <select
                      className="admin-input"
                      defaultValue=""
                      disabled={busy}
                      onChange={(e) => {
                        if (e.target.value)
                          void assignDriver(viewing.delivery?.id, e.target.value);
                      }}
                    >
                      <option value="">Assign driver…</option>
                      {drivers.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.fullName}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ) : null}

              <div className="mt-auto space-y-3 border-t border-[var(--admin-line)] pt-4">
                <div className="flex flex-wrap gap-3">
                  <a
                    className="text-xs font-semibold text-[var(--huza-green-dark)]"
                    href={`/api/receipts/${encodeURIComponent(viewing.orderNumber)}?format=pdf`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Receipt PDF
                  </a>
                  <a
                    className="text-xs font-semibold text-[var(--huza-green-dark)]"
                    href={`/api/invoices/${encodeURIComponent(viewing.orderNumber)}?format=pdf`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Invoice PDF
                  </a>
                  <a
                    className="text-xs font-semibold text-[var(--huza-green-dark)]"
                    href={`/admin/support`}
                  >
                    Open support inbox
                  </a>
                </div>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
