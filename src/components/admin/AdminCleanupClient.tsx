"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { AlertTriangle, RefreshCw, Trash2 } from "lucide-react";

type Summary = {
  customers: number;
  farmers: number;
  staff: number;
  orders: number;
  cancelledOrFailedOrders: number;
  payments: number;
  products: number;
  softDeletedProducts: number;
  notifications: number;
  stockMovements: number;
};

type CustomerRow = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string;
  isActive: boolean;
  createdAt: string;
  _count: { orders: number };
};

type FarmerRow = {
  id: string;
  businessName: string;
  phone: string;
  email: string | null;
  status: string;
  createdAt: string;
  user: { id: string; fullName: string; isActive: boolean; deletedAt: string | null };
  _count: { products: number; purchaseOrders: number };
};

type OrderRow = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  guestName: string | null;
  guestPhone: string | null;
  createdAt: string;
  payment: { status: string; method: string } | null;
  user: { fullName: string; phone: string } | null;
};

function confirmDelete(label: string): boolean {
  const typed = window.prompt(
    `${label}\n\nThis cannot be undone. Type DELETE to confirm.`,
    ""
  );
  return typed === "DELETE";
}

export function AdminCleanupClient() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [farmers, setFarmers] = useState<FarmerRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [customerQ, setCustomerQ] = useState("");
  const [farmerQ, setFarmerQ] = useState("");
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadSummary = useCallback(async () => {
    const res = await fetch("/api/admin/cleanup");
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to load");
    setSummary(data.summary);
  }, []);

  const loadLists = useCallback(async () => {
    const [cRes, fRes, oRes] = await Promise.all([
      fetch(`/api/admin/cleanup?view=customers&q=${encodeURIComponent(customerQ)}`),
      fetch(`/api/admin/cleanup?view=farmers&q=${encodeURIComponent(farmerQ)}`),
      fetch("/api/admin/cleanup?view=orders"),
    ]);
    const [cData, fData, oData] = await Promise.all([cRes.json(), fRes.json(), oRes.json()]);
    if (!cRes.ok) throw new Error(cData.error || "Failed to load customers");
    if (!fRes.ok) throw new Error(fData.error || "Failed to load farmers");
    if (!oRes.ok) throw new Error(oData.error || "Failed to load orders");
    setCustomers(cData.customers || []);
    setFarmers(fData.farmers || []);
    setOrders(oData.orders || []);
  }, [customerQ, farmerQ]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      await Promise.all([loadSummary(), loadLists()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [loadSummary, loadLists]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function runAction(body: Record<string, unknown>, okMsg: string) {
    setBusy(true);
    setError("");
    setMsg("");
    try {
      const res = await fetch("/api/admin/cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.suggestion === "soft" && body.action === "delete_farmer" && !body.soft) {
          const soft = window.confirm(
            `${data.error}\n\nSoft-remove this farmer instead? (products hidden, account deactivated)`
          );
          if (soft) {
            const softRes = await fetch("/api/admin/cleanup", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...body, soft: true, confirm: "DELETE" }),
            });
            const softData = await softRes.json();
            if (!softRes.ok) throw new Error(softData.error || "Soft remove failed");
            setMsg("Farmer soft-removed");
            await refresh();
            return;
          }
        }
        throw new Error(data.error || "Action failed");
      }
      setMsg(okMsg);
      setSelectedCustomers(new Set());
      setSelectedOrders(new Set());
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  const onSearchCustomers = (e: FormEvent) => {
    e.preventDefault();
    void refresh();
  };

  const onSearchFarmers = (e: FormEvent) => {
    e.preventDefault();
    void refresh();
  };

  const toggleCustomer = (id: string) => {
    setSelectedCustomers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleOrder = (id: string) => {
    setSelectedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="admin-panel-title">System cleanup</h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--admin-muted)]">
            Super Admin only. Permanently remove test and unwanted data before production. Every
            destructive action asks you to type <strong>DELETE</strong>.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="ghost" disabled={busy || loading} onClick={() => void refresh()}>
            <RefreshCw className="mr-1 size-3.5" />
            Refresh
          </Button>
          <Link href="/admin/staff">
            <Button size="sm" variant="ghost">
              Staff accounts
            </Button>
          </Link>
          <Link href="/admin/audit">
            <Button size="sm" variant="ghost">
              Audit trail
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        <p>
          Orders with paid sales history should not be purged casually. Failed/cancelled orders and
          unused test accounts are safe targets. Farmers with sales history can only be soft-removed.
        </p>
      </div>

      {msg ? (
        <p className="rounded-lg border border-[var(--admin-line)] bg-[var(--admin-soft)] px-3 py-2 text-sm text-emerald-800">
          {msg}
        </p>
      ) : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <section className="admin-panel p-5">
        <h2 className="font-semibold">Platform counts</h2>
        {loading && !summary ? (
          <p className="mt-2 text-sm text-[var(--admin-muted)]">Loading…</p>
        ) : summary ? (
          <dl className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5 text-sm">
            {(
              [
                ["Customers", summary.customers],
                ["Farmers", summary.farmers],
                ["Staff", summary.staff],
                ["Orders", summary.orders],
                ["Failed/cancelled orders", summary.cancelledOrFailedOrders],
                ["Payments", summary.payments],
                ["Active products", summary.products],
                ["Soft-deleted products", summary.softDeletedProducts],
                ["Notifications", summary.notifications],
                ["Stock movements", summary.stockMovements],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="rounded-lg border border-[var(--admin-line)] px-3 py-2">
                <dt className="text-xs text-[var(--admin-muted)]">{label}</dt>
                <dd className="text-lg font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </section>

      <section className="admin-panel space-y-3 p-5">
        <h2 className="font-semibold">Bulk test-data tools</h2>
        <p className="text-sm text-[var(--admin-muted)]">
          Each button requires typing DELETE. Payments are removed when their parent order is
          deleted.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={busy}
            className="text-red-700"
            onClick={() => {
              if (!confirmDelete("Delete all cancelled orders and orders with failed/refunded payments?"))
                return;
              void runAction(
                { action: "delete_orders", confirm: "DELETE" },
                "Failed/cancelled test orders deleted"
              );
            }}
          >
            <Trash2 className="mr-1 size-3.5" />
            Delete failed/cancelled orders
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={busy}
            className="text-red-700"
            onClick={() => {
              if (!confirmDelete("Delete all in-app notifications?")) return;
              void runAction(
                { action: "delete_notifications", confirm: "DELETE" },
                "Notifications cleared"
              );
            }}
          >
            Clear all notifications
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={busy}
            className="text-red-700"
            onClick={() => {
              if (!confirmDelete("Delete stock movements for soft-deleted products?")) return;
              void runAction(
                { action: "delete_inventory_movements", confirm: "DELETE" },
                "Inventory movements cleaned"
              );
            }}
          >
            Clear inventory for soft-deleted products
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={busy}
            className="text-red-700"
            onClick={() => {
              if (
                !confirmDelete(
                  "Permanently purge soft-deleted products that have no sales/receipt history?"
                )
              )
                return;
              void runAction(
                { action: "purge_soft_deleted_products", confirm: "DELETE" },
                "Soft-deleted products purged where safe"
              );
            }}
          >
            Purge soft-deleted products
          </Button>
        </div>
      </section>

      <section className="admin-panel space-y-3 p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-semibold">Test customers</h2>
            <p className="text-sm text-[var(--admin-muted)]">
              Permanently delete selected customer accounts. Order history is kept (customer link
              cleared).
            </p>
          </div>
          <form onSubmit={onSearchCustomers} className="flex gap-2">
            <input
              className="admin-input"
              placeholder="Search customers…"
              value={customerQ}
              onChange={(e) => setCustomerQ(e.target.value)}
            />
            <Button type="submit" size="sm" variant="ghost" disabled={busy}>
              Search
            </Button>
          </form>
        </div>
        {selectedCustomers.size > 0 ? (
          <Button
            type="button"
            size="sm"
            disabled={busy}
            className="bg-red-700 text-white hover:bg-red-800"
            onClick={() => {
              if (!confirmDelete(`Permanently delete ${selectedCustomers.size} customer(s)?`))
                return;
              void runAction(
                {
                  action: "delete_customers",
                  ids: [...selectedCustomers],
                  confirm: "DELETE",
                },
                `Deleted ${selectedCustomers.size} customer(s)`
              );
            }}
          >
            Delete selected ({selectedCustomers.size})
          </Button>
        ) : null}
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th></th>
                <th>Name</th>
                <th>Contact</th>
                <th>Orders</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedCustomers.has(c.id)}
                      onChange={() => toggleCustomer(c.id)}
                    />
                  </td>
                  <td>
                    <p className="font-medium">{c.fullName}</p>
                    <p className="text-[10px] text-[var(--admin-muted)]">
                      {c.isActive ? "Active" : "Inactive"}
                    </p>
                  </td>
                  <td>
                    <p className="text-sm">{c.email || "—"}</p>
                    <p className="text-xs text-[var(--admin-muted)]">{c.phone}</p>
                  </td>
                  <td>{c._count.orders}</td>
                  <td className="text-right">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      className="text-red-700"
                      onClick={() => {
                        if (!confirmDelete(`Permanently delete customer ${c.fullName}?`)) return;
                        void runAction(
                          { action: "delete_customer", id: c.id, confirm: "DELETE" },
                          `Deleted ${c.fullName}`
                        );
                      }}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
              {!customers.length ? (
                <tr>
                  <td colSpan={5} className="text-sm text-[var(--admin-muted)]">
                    No customers found
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-panel space-y-3 p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-semibold">Test farmers</h2>
            <p className="text-sm text-[var(--admin-muted)]">
              Permanent delete when there is no sales history; otherwise soft-remove is offered.
            </p>
          </div>
          <form onSubmit={onSearchFarmers} className="flex gap-2">
            <input
              className="admin-input"
              placeholder="Search farmers…"
              value={farmerQ}
              onChange={(e) => setFarmerQ(e.target.value)}
            />
            <Button type="submit" size="sm" variant="ghost" disabled={busy}>
              Search
            </Button>
          </form>
        </div>
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Farm / contact</th>
                <th>Status</th>
                <th>Products</th>
                <th>POs</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {farmers.map((f) => (
                <tr key={f.id}>
                  <td>
                    <p className="font-medium">{f.businessName}</p>
                    <p className="text-xs text-[var(--admin-muted)]">
                      {f.user.fullName} · {f.phone}
                    </p>
                  </td>
                  <td>{f.status}</td>
                  <td>{f._count.products}</td>
                  <td>{f._count.purchaseOrders}</td>
                  <td className="text-right">
                    <div className="flex flex-wrap justify-end gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={busy}
                        onClick={() => {
                          if (!confirmDelete(`Soft-remove farmer ${f.businessName}?`)) return;
                          void runAction(
                            {
                              action: "delete_farmer",
                              id: f.id,
                              soft: true,
                              confirm: "DELETE",
                            },
                            `Soft-removed ${f.businessName}`
                          );
                        }}
                      >
                        Soft remove
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={busy}
                        className="text-red-700"
                        onClick={() => {
                          if (!confirmDelete(`Permanently delete farmer ${f.businessName}?`))
                            return;
                          void runAction(
                            { action: "delete_farmer", id: f.id, confirm: "DELETE" },
                            `Deleted ${f.businessName}`
                          );
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!farmers.length ? (
                <tr>
                  <td colSpan={5} className="text-sm text-[var(--admin-muted)]">
                    No farmers found
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-panel space-y-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Failed / cancelled orders</h2>
            <p className="text-sm text-[var(--admin-muted)]">
              Select rows to delete, or use the bulk tool above. Linked payments are removed with the
              order.
            </p>
          </div>
          {selectedOrders.size > 0 ? (
            <Button
              type="button"
              size="sm"
              disabled={busy}
              className="bg-red-700 text-white hover:bg-red-800"
              onClick={() => {
                if (!confirmDelete(`Delete ${selectedOrders.size} selected order(s)?`)) return;
                void runAction(
                  {
                    action: "delete_orders",
                    ids: [...selectedOrders],
                    confirm: "DELETE",
                  },
                  `Deleted ${selectedOrders.size} order(s)`
                );
              }}
            >
              Delete selected ({selectedOrders.size})
            </Button>
          ) : null}
        </div>
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th></th>
                <th>Order</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedOrders.has(o.id)}
                      onChange={() => toggleOrder(o.id)}
                    />
                  </td>
                  <td className="font-medium">{o.orderNumber}</td>
                  <td className="text-sm">
                    {o.user?.fullName || o.guestName || "—"}
                    <span className="block text-xs text-[var(--admin-muted)]">
                      {o.user?.phone || o.guestPhone || ""}
                    </span>
                  </td>
                  <td>{o.status}</td>
                  <td>{o.payment?.status || "—"}</td>
                  <td>{o.total.toLocaleString()} RWF</td>
                </tr>
              ))}
              {!orders.length ? (
                <tr>
                  <td colSpan={6} className="text-sm text-[var(--admin-muted)]">
                    No failed/cancelled orders
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
