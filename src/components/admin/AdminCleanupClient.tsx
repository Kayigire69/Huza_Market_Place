"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { AlertTriangle, Archive, RefreshCw, RotateCcw, Trash2 } from "lucide-react";

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

type TestCounts = {
  customers: number;
  farmers: number;
  orders: number;
  inventory: number;
  readNotifications: number;
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

type Archived = {
  customers: Array<{
    id: string;
    fullName: string;
    email: string | null;
    phone: string;
    deletedAt: string | null;
    _count: { orders: number };
  }>;
  farmers: Array<{
    id: string;
    businessName: string;
    phone: string;
    user: { fullName: string };
    _count: { products: number };
  }>;
  products: Array<{
    id: string;
    nameEn: string;
    deletedAt: string | null;
    category: { nameEn: string } | null;
  }>;
};

type WizardSel = {
  testCustomers: boolean;
  testFarmers: boolean;
  testOrders: boolean;
  testInventory: boolean;
  readNotifications: boolean;
};

type WizardPreview = {
  customers: number;
  farmers: number;
  orders: number;
  inventory: number;
  notifications: number;
};

type SectionId =
  | "wizard"
  | "test"
  | "orders"
  | "customers"
  | "farmers"
  | "inventory"
  | "notifications"
  | "archived";

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: "wizard", label: "Cleanup Wizard" },
  { id: "test", label: "Test Data" },
  { id: "orders", label: "Orders" },
  { id: "customers", label: "Customers" },
  { id: "farmers", label: "Farmers" },
  { id: "inventory", label: "Inventory" },
  { id: "notifications", label: "Notifications" },
  { id: "archived", label: "Archived Records" },
];

function confirmTyped(label: string, word = "DELETE"): boolean {
  const typed = window.prompt(
    `${label}\n\nThis action cannot be undone.\nAre you sure you want to permanently delete these records?\n\nType ${word} to confirm.`,
    ""
  );
  return typed === word;
}

function confirmArchive(label: string): boolean {
  return confirmTyped(label, "ARCHIVE");
}

export function AdminCleanupClient() {
  const [section, setSection] = useState<SectionId>("wizard");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [testCounts, setTestCounts] = useState<TestCounts | null>(null);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [farmers, setFarmers] = useState<FarmerRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [archived, setArchived] = useState<Archived | null>(null);
  const [customerQ, setCustomerQ] = useState("");
  const [farmerQ, setFarmerQ] = useState("");
  const [orderQ, setOrderQ] = useState("");
  const [showRemovedFarmers, setShowRemovedFarmers] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [wizard, setWizard] = useState<WizardSel>({
    testCustomers: false,
    testFarmers: false,
    testOrders: false,
    testInventory: false,
    readNotifications: false,
  });
  const [wizardPreview, setWizardPreview] = useState<WizardPreview | null>(null);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadSummary = useCallback(async () => {
    const res = await fetch("/api/admin/cleanup");
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to load");
    setSummary(data.summary);
    setTestCounts(data.testCounts || null);
  }, []);

  const loadLists = useCallback(async () => {
    const farmerQs = new URLSearchParams({
      view: "farmers",
      q: farmerQ,
      ...(showRemovedFarmers ? { includeRemoved: "1" } : {}),
    });
    const [cRes, fRes, oRes, aRes] = await Promise.all([
      fetch(`/api/admin/cleanup?view=customers&q=${encodeURIComponent(customerQ)}`),
      fetch(`/api/admin/cleanup?${farmerQs.toString()}`),
      fetch(`/api/admin/cleanup?view=orders&q=${encodeURIComponent(orderQ)}`),
      fetch("/api/admin/cleanup?view=archived"),
    ]);
    const [cData, fData, oData, aData] = await Promise.all([
      cRes.json(),
      fRes.json(),
      oRes.json(),
      aRes.json(),
    ]);
    if (!cRes.ok) throw new Error(cData.error || "Failed to load customers");
    if (!fRes.ok) throw new Error(fData.error || "Failed to load farmers");
    if (!oRes.ok) throw new Error(oData.error || "Failed to load orders");
    if (!aRes.ok) throw new Error(aData.error || "Failed to load archived");
    setCustomers(cData.customers || []);
    setFarmers(fData.farmers || []);
    setOrders(oData.orders || []);
    setArchived({
      customers: aData.customers || [],
      farmers: aData.farmers || [],
      products: aData.products || [],
    });
  }, [customerQ, farmerQ, orderQ, showRemovedFarmers]);

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
            `${data.error}\n\nArchive (soft-remove) this farmer instead? Sales history is kept.`
          );
          if (soft) {
            await runAction({ ...body, soft: true, confirm: "DELETE" }, "Farmer archived");
            return;
          }
        }
        throw new Error(data.error || "Action failed");
      }
      if (body.action === "delete_customers") {
        const deleted = Number(data.deleted || 0);
        const errors = Array.isArray(data.errors) ? (data.errors as string[]) : [];
        if (errors.length) {
          setError(
            `Deleted ${deleted}. ${errors.length} failed: ${errors.slice(0, 3).join("; ")}`
          );
        } else setMsg(`Deleted ${deleted} customer(s)`);
      } else if (body.action === "purge_soft_deleted_products") {
        setMsg(
          `Permanently removed ${data.hardDeleted || 0}. Kept ${data.keptSoft || 0} tied to sales history.`
        );
      } else if (body.action === "wizard_run") {
        setMsg("Cleanup wizard finished successfully.");
        setWizardPreview(null);
      } else {
        setMsg(okMsg);
      }
      setSelectedCustomers(new Set());
      setSelectedOrders(new Set());
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  const wizardSelected = useMemo(
    () => Object.values(wizard).some(Boolean),
    [wizard]
  );

  async function previewWizard() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "wizard_preview", selection: wizard }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Preview failed");
      setWizardPreview(data.preview);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preview failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="admin-panel-title">System cleanup</h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--admin-muted)]">
            Super Admin only. Maintenance console for test data, archives, and safe permanent
            deletion. Completed paid orders are never targeted by bulk tools.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={busy || loading}
            onClick={() => void refresh()}
          >
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
          Prefer <strong>Archive</strong> before permanent delete. Use the Cleanup Wizard for
          seed/demo data. Type <strong>DELETE</strong> or <strong>ARCHIVE</strong> to confirm
          destructive actions.
        </p>
      </div>

      {msg ? (
        <p className="rounded-lg border border-[var(--admin-line)] bg-[var(--admin-soft)] px-3 py-2 text-sm text-emerald-800">
          {msg}
        </p>
      ) : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <nav className="flex flex-wrap gap-2 border-b border-[var(--admin-line)] pb-3">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSection(s.id)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              section === s.id
                ? "bg-[var(--admin-ink)] text-white"
                : "bg-[var(--admin-soft)] text-[var(--admin-ink)] hover:bg-[var(--admin-line)]"
            }`}
          >
            {s.label}
          </button>
        ))}
      </nav>

      {section === "wizard" ? (
        <section className="admin-panel space-y-4 p-5">
          <div>
            <h2 className="font-semibold">Cleanup Wizard</h2>
            <p className="mt-1 text-sm text-[var(--admin-muted)]">
              Select categories, preview counts, then confirm before anything is removed.
            </p>
          </div>
          <div className="space-y-2 text-sm">
            {(
              [
                ["testCustomers", "Test Customers", testCounts?.customers],
                ["testFarmers", "Test Farmers", testCounts?.farmers],
                ["testOrders", "Test Orders", testCounts?.orders],
                ["testInventory", "Demo / duplicate inventory", testCounts?.inventory],
                ["readNotifications", "Read Notifications", testCounts?.readNotifications],
              ] as const
            ).map(([key, label, count]) => (
              <label key={key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={wizard[key]}
                  onChange={(e) =>
                    setWizard((w) => ({ ...w, [key]: e.target.checked }))
                  }
                />
                <span>
                  {label}
                  {typeof count === "number" ? (
                    <span className="text-[var(--admin-muted)]"> ({count} found)</span>
                  ) : null}
                </span>
              </label>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={busy || !wizardSelected}
              onClick={() => void previewWizard()}
            >
              Preview selected
            </Button>
            {wizardPreview ? (
              <Button
                type="button"
                size="sm"
                disabled={busy}
                className="bg-red-700 text-white hover:bg-red-800"
                onClick={() => {
                  const lines = [
                    `Customers to delete: ${wizardPreview.customers}`,
                    `Farmers to delete: ${wizardPreview.farmers}`,
                    `Orders to delete: ${wizardPreview.orders}`,
                    `Inventory records: ${wizardPreview.inventory}`,
                    `Notifications: ${wizardPreview.notifications}`,
                  ].join("\n");
                  if (
                    !confirmTyped(
                      `This action cannot be undone.\n\n${lines}\n\nAre you sure you want to permanently delete these records?`
                    )
                  )
                    return;
                  void runAction(
                    { action: "wizard_run", selection: wizard, confirm: "DELETE" },
                    "Wizard complete"
                  );
                }}
              >
                <Trash2 className="mr-1 size-3.5" />
                Confirm &amp; run
              </Button>
            ) : null}
          </div>
          {wizardPreview ? (
            <dl className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5 text-sm">
              {(
                [
                  ["Customers to delete", wizardPreview.customers],
                  ["Farmers to delete", wizardPreview.farmers],
                  ["Orders to delete", wizardPreview.orders],
                  ["Inventory records", wizardPreview.inventory],
                  ["Notifications", wizardPreview.notifications],
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
      ) : null}

      {section === "test" ? (
        <section className="admin-panel space-y-3 p-5">
          <h2 className="font-semibold">Test Data</h2>
          <p className="text-sm text-[var(--admin-muted)]">
            Seed and demo accounts only (example.com customers, known demo farmer phones, DEMO
            payment refs). Prefer the Cleanup Wizard for multi-select cleanup.
          </p>
          {testCounts ? (
            <dl className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5 text-sm">
              {(
                [
                  ["Test customers", testCounts.customers],
                  ["Test farmers", testCounts.farmers],
                  ["Test orders", testCounts.orders],
                  ["Demo/dup inventory", testCounts.inventory],
                  ["Read notifications", testCounts.readNotifications],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="rounded-lg border border-[var(--admin-line)] px-3 py-2">
                  <dt className="text-xs text-[var(--admin-muted)]">{label}</dt>
                  <dd className="text-lg font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          <p className="text-xs text-[var(--admin-muted)]">
            Open <button type="button" className="underline" onClick={() => setSection("wizard")}>Cleanup Wizard</button> to select and delete only the test categories you choose.
          </p>
        </section>
      ) : null}

      {section === "customers" ? (
        <section className="admin-panel space-y-3 p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-semibold">Customers</h2>
              <p className="text-sm text-[var(--admin-muted)]">
                Search and manage customer accounts. Archive first when possible; permanent delete
                clears the account (order history stays, customer link cleared).
              </p>
            </div>
            <form
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                void refresh();
              }}
              className="flex gap-2"
            >
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
                if (
                  !confirmTyped(
                    `Permanently delete ${selectedCustomers.size} customer(s)?\n\nThis action cannot be undone.`
                  )
                )
                  return;
                void runAction(
                  { action: "delete_customers", ids: [...selectedCustomers], confirm: "DELETE" },
                  "Customers deleted"
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
                        onChange={() =>
                          setSelectedCustomers((prev) => {
                            const next = new Set(prev);
                            if (next.has(c.id)) next.delete(c.id);
                            else next.add(c.id);
                            return next;
                          })
                        }
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
                      <div className="flex flex-wrap justify-end gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={busy}
                          onClick={() => {
                            if (!confirmArchive(`Archive customer ${c.fullName}?`)) return;
                            void runAction(
                              { action: "archive_customer", id: c.id, confirm: "ARCHIVE" },
                              `Archived ${c.fullName}`
                            );
                          }}
                        >
                          <Archive className="mr-1 size-3.5" />
                          Archive
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={busy}
                          className="text-red-700"
                          onClick={() => {
                            if (
                              !confirmTyped(
                                `Permanently delete customer ${c.fullName}?\n\nThis action cannot be undone.`
                              )
                            )
                              return;
                            void runAction(
                              { action: "delete_customer", id: c.id, confirm: "DELETE" },
                              `Deleted ${c.fullName}`
                            );
                          }}
                        >
                          Delete
                        </Button>
                      </div>
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
      ) : null}

      {section === "farmers" ? (
        <section className="admin-panel space-y-3 p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-semibold">Farmers</h2>
              <p className="text-sm text-[var(--admin-muted)]">
                Soft-remove (archive) when there is sales history. Permanent delete only when no
                order lines remain.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex items-center gap-2 text-xs text-[var(--admin-muted)]">
                <input
                  type="checkbox"
                  checked={showRemovedFarmers}
                  onChange={(e) => setShowRemovedFarmers(e.target.checked)}
                />
                Show archived
              </label>
              <form
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  void refresh();
                }}
                className="flex gap-2"
              >
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
                  <tr key={f.id} className={f.status === "REMOVED" ? "opacity-60" : undefined}>
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
                        {f.status !== "REMOVED" ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={busy}
                            onClick={() => {
                              if (!confirmTyped(`Archive farmer ${f.businessName}?`)) return;
                              void runAction(
                                {
                                  action: "delete_farmer",
                                  id: f.id,
                                  soft: true,
                                  confirm: "DELETE",
                                },
                                `Archived ${f.businessName}`
                              );
                            }}
                          >
                            Archive
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={busy}
                          className="text-red-700"
                          onClick={() => {
                            if (
                              !confirmTyped(
                                `Permanently delete farmer ${f.businessName}?\n\nThis action cannot be undone.`
                              )
                            )
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
      ) : null}

      {section === "orders" ? (
        <section className="admin-panel space-y-3 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Orders</h2>
              <p className="text-sm text-[var(--admin-muted)]">
                Only cancelled, failed, refunded, or unpaid leftovers appear here. Completed paid
                business orders are protected.
              </p>
            </div>
            <form
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                void refresh();
              }}
              className="flex gap-2"
            >
              <input
                className="admin-input"
                placeholder="Search orders…"
                value={orderQ}
                onChange={(e) => setOrderQ(e.target.value)}
              />
              <Button type="submit" size="sm" variant="ghost" disabled={busy}>
                Search
              </Button>
            </form>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={busy}
              className="text-red-700"
              onClick={() => {
                if (
                  !confirmTyped(
                    "Delete all cancelled / failed / refunded leftover orders?\n\nThis action cannot be undone."
                  )
                )
                  return;
                void runAction(
                  { action: "delete_orders", confirm: "DELETE" },
                  "Safe leftover orders deleted"
                );
              }}
            >
              Delete all listed leftovers
            </Button>
            {selectedOrders.size > 0 ? (
              <Button
                type="button"
                size="sm"
                disabled={busy}
                className="bg-red-700 text-white hover:bg-red-800"
                onClick={() => {
                  if (
                    !confirmTyped(
                      `Delete ${selectedOrders.size} selected order(s)?\n\nThis action cannot be undone.`
                    )
                  )
                    return;
                  void runAction(
                    { action: "delete_orders", ids: [...selectedOrders], confirm: "DELETE" },
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
                        onChange={() =>
                          setSelectedOrders((prev) => {
                            const next = new Set(prev);
                            if (next.has(o.id)) next.delete(o.id);
                            else next.add(o.id);
                            return next;
                          })
                        }
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
                      No deletable leftover orders
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {section === "inventory" ? (
        <section className="admin-panel space-y-3 p-5">
          <h2 className="font-semibold">Inventory</h2>
          <p className="text-sm text-[var(--admin-muted)]">
            Archive test/demo stock and duplicate product rows. Real unique catalog stock is not
            bulk-deleted here.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => {
                if (!confirmArchive("Archive duplicate inventory records (same name + category)?"))
                  return;
                void runAction(
                  { action: "archive_duplicate_inventory", confirm: "ARCHIVE" },
                  "Duplicates archived"
                );
              }}
            >
              <Archive className="mr-1 size-3.5" />
              Archive duplicates
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => {
                if (!confirmArchive("Archive inventory belonging to known demo/test farmers?"))
                  return;
                void runAction(
                  { action: "archive_test_inventory", confirm: "ARCHIVE" },
                  "Test inventory archived"
                );
              }}
            >
              Archive test inventory
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={busy}
              className="text-red-700"
              onClick={() => {
                if (
                  !confirmTyped(
                    "Clear stock movements for already-archived products?\n\nThis action cannot be undone."
                  )
                )
                  return;
                void runAction(
                  { action: "delete_inventory_movements", confirm: "DELETE" },
                  "Inventory movements cleaned"
                );
              }}
            >
              Clear movements for archived products
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={busy}
              className="text-red-700"
              onClick={() => {
                if (
                  !confirmTyped(
                    "Permanently purge archived products with no sales/receipt history?\n\nThis action cannot be undone."
                  )
                )
                  return;
                void runAction(
                  { action: "purge_soft_deleted_products", confirm: "DELETE" },
                  "Archived products purged where safe"
                );
              }}
            >
              Permanently purge archived products
            </Button>
          </div>
          {summary ? (
            <p className="text-sm text-[var(--admin-muted)]">
              Active products: {summary.products} · Archived products:{" "}
              {summary.softDeletedProducts} · Stock movements: {summary.stockMovements}
            </p>
          ) : null}
        </section>
      ) : null}

      {section === "notifications" ? (
        <section className="admin-panel space-y-3 p-5">
          <h2 className="font-semibold">Notifications</h2>
          <p className="text-sm text-[var(--admin-muted)]">
            Clear read, old, or test-user alerts. Use carefully — staff may still need recent unread
            alerts.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={busy}
              className="text-red-700"
              onClick={() => {
                if (!confirmTyped("Delete all read notifications?\n\nThis action cannot be undone."))
                  return;
                void runAction(
                  { action: "delete_read_notifications", confirm: "DELETE" },
                  "Read notifications deleted"
                );
              }}
            >
              Delete read
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={busy}
              className="text-red-700"
              onClick={() => {
                if (
                  !confirmTyped(
                    "Delete notifications older than 30 days?\n\nThis action cannot be undone."
                  )
                )
                  return;
                void runAction(
                  { action: "delete_old_notifications", days: 30, confirm: "DELETE" },
                  "Old notifications deleted"
                );
              }}
            >
              Delete older than 30 days
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={busy}
              className="text-red-700"
              onClick={() => {
                if (
                  !confirmTyped(
                    "Delete notifications for known test accounts?\n\nThis action cannot be undone."
                  )
                )
                  return;
                void runAction(
                  { action: "delete_test_notifications", confirm: "DELETE" },
                  "Test notifications deleted"
                );
              }}
            >
              Delete test notifications
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={busy}
              className="text-red-700"
              onClick={() => {
                if (
                  !confirmTyped(
                    "Delete ALL in-app notifications?\n\nThis action cannot be undone."
                  )
                )
                  return;
                void runAction(
                  { action: "delete_notifications", confirm: "DELETE" },
                  "All notifications cleared"
                );
              }}
            >
              Clear all
            </Button>
          </div>
          {summary ? (
            <p className="text-sm text-[var(--admin-muted)]">
              Total notifications: {summary.notifications}
              {testCounts ? ` · Read: ${testCounts.readNotifications}` : ""}
            </p>
          ) : null}
        </section>
      ) : null}

      {section === "archived" ? (
        <section className="admin-panel space-y-5 p-5">
          <div>
            <h2 className="font-semibold">Archived Records</h2>
            <p className="mt-1 text-sm text-[var(--admin-muted)]">
              Restore archived records, or permanently delete when you are sure.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Archived customers</h3>
            <div className="mt-2 overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Contact</th>
                    <th>Orders</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {(archived?.customers || []).map((c) => (
                    <tr key={c.id}>
                      <td className="font-medium">{c.fullName}</td>
                      <td className="text-sm">
                        {c.email || "—"}
                        <span className="block text-xs text-[var(--admin-muted)]">{c.phone}</span>
                      </td>
                      <td>{c._count.orders}</td>
                      <td className="text-right">
                        <div className="flex flex-wrap justify-end gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={busy}
                            onClick={() =>
                              void runAction(
                                { action: "restore_customer", id: c.id },
                                `Restored ${c.fullName}`
                              )
                            }
                          >
                            <RotateCcw className="mr-1 size-3.5" />
                            Restore
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={busy}
                            className="text-red-700"
                            onClick={() => {
                              if (
                                !confirmTyped(
                                  `Permanently delete archived customer ${c.fullName}?\n\nThis action cannot be undone.`
                                )
                              )
                                return;
                              void runAction(
                                { action: "delete_customer", id: c.id, confirm: "DELETE" },
                                `Deleted ${c.fullName}`
                              );
                            }}
                          >
                            Delete forever
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!archived?.customers?.length ? (
                    <tr>
                      <td colSpan={4} className="text-sm text-[var(--admin-muted)]">
                        No archived customers
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Archived farmers</h3>
            <div className="mt-2 overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Farm</th>
                    <th>Products</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {(archived?.farmers || []).map((f) => (
                    <tr key={f.id}>
                      <td>
                        <p className="font-medium">{f.businessName}</p>
                        <p className="text-xs text-[var(--admin-muted)]">
                          {f.user.fullName} · {f.phone}
                        </p>
                      </td>
                      <td>{f._count.products}</td>
                      <td className="text-right">
                        <div className="flex flex-wrap justify-end gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={busy}
                            onClick={() =>
                              void runAction(
                                { action: "restore_farmer", id: f.id },
                                `Restored ${f.businessName}`
                              )
                            }
                          >
                            <RotateCcw className="mr-1 size-3.5" />
                            Restore
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={busy}
                            className="text-red-700"
                            onClick={() => {
                              if (
                                !confirmTyped(
                                  `Permanently delete farmer ${f.businessName}?\n\nThis action cannot be undone.`
                                )
                              )
                                return;
                              void runAction(
                                { action: "delete_farmer", id: f.id, confirm: "DELETE" },
                                `Deleted ${f.businessName}`
                              );
                            }}
                          >
                            Delete forever
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!archived?.farmers?.length ? (
                    <tr>
                      <td colSpan={3} className="text-sm text-[var(--admin-muted)]">
                        No archived farmers
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Archived products</h3>
            <div className="mt-2 overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {(archived?.products || []).map((p) => (
                    <tr key={p.id}>
                      <td className="font-medium">{p.nameEn}</td>
                      <td>{p.category?.nameEn || "—"}</td>
                      <td className="text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={busy}
                          onClick={() =>
                            void runAction(
                              { action: "restore_product", id: p.id },
                              `Restored ${p.nameEn}`
                            )
                          }
                        >
                          <RotateCcw className="mr-1 size-3.5" />
                          Restore
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {!archived?.products?.length ? (
                    <tr>
                      <td colSpan={3} className="text-sm text-[var(--admin-muted)]">
                        No archived products
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-[var(--admin-muted)]">
              Permanent product purge is under Inventory (only rows with no sales history).
            </p>
          </div>
        </section>
      ) : null}

      {summary && section === "wizard" ? (
        <section className="admin-panel p-5">
          <h2 className="font-semibold">Platform snapshot</h2>
          <dl className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5 text-sm">
            {(
              [
                ["Customers", summary.customers],
                ["Farmers", summary.farmers],
                ["Orders", summary.orders],
                ["Safe leftover orders", summary.cancelledOrFailedOrders],
                ["Active products", summary.products],
                ["Archived products", summary.softDeletedProducts],
                ["Notifications", summary.notifications],
                ["Staff", summary.staff],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="rounded-lg border border-[var(--admin-line)] px-3 py-2">
                <dt className="text-xs text-[var(--admin-muted)]">{label}</dt>
                <dd className="text-lg font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}
    </div>
  );
}
