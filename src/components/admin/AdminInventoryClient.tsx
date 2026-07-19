"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { formatUnit } from "@/lib/utils";
import { Search, X } from "lucide-react";

type StockProduct = {
  id: string;
  nameEn: string;
  stockQty: number;
  reservedQty: number;
  lowStockAt: number | null;
  unit: string;
  isActive: boolean;
  inventorySource?: string | null;
  purchaseMethod?: string | null;
  qualityGrade?: string | null;
  inventoryStatus?: string | null;
  category?: { nameEn: string } | null;
};

type Movement = {
  id: string;
  type: string;
  quantity: number;
  reason: string | null;
  createdAt: string;
  product?: { nameEn: string; unit: string } | null;
};

type ExpiryBatch = {
  id: string;
  batchNumber: string;
  quantity: number;
  expiryDate: string | null;
  expired: boolean;
  product?: {
    id: string;
    nameEn: string;
    unit: string;
    category?: { nameEn: string; slug: string } | null;
  } | null;
};

type TabKey = "all" | "low" | "out" | "recent" | "expiring";

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "All Stock" },
  { key: "low", label: "Low Stock" },
  { key: "out", label: "Out of Stock" },
  { key: "expiring", label: "Expiring Soon" },
  { key: "recent", label: "Recent Stock Changes" },
];

function available(p: StockProduct) {
  return Math.max(0, p.stockQty - (p.reservedQty || 0));
}

function stockStatus(p: StockProduct) {
  const avail = available(p);
  const min = p.lowStockAt ?? 5;
  if (avail <= 0) return { label: "Out of Stock", className: "admin-status admin-status-warn" };
  if (avail <= min) return { label: "Low Stock", className: "admin-status admin-status-warn" };
  return { label: "OK", className: "admin-status admin-status-ok" };
}

export function AdminInventoryClient() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as TabKey) || "all";
  const [tab, setTab] = useState<TabKey>(
    TABS.some((t) => t.key === initialTab) ? initialTab : "all"
  );
  const [q, setQ] = useState("");
  const [source, setSource] = useState("");
  const [method, setMethod] = useState("");
  const [grade, setGrade] = useState("");
  const [opsStatus, setOpsStatus] = useState("");
  const [products, setProducts] = useState<StockProduct[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [batches, setBatches] = useState<ExpiryBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [editing, setEditing] = useState<StockProduct | null>(null);
  const [qty, setQty] = useState("");
  const [action, setAction] = useState<"stock_in" | "stock_out">("stock_in");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [historyFor, setHistoryFor] = useState<StockProduct | null>(null);
  const [history, setHistory] = useState<Movement[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === "recent") {
        const res = await fetch("/api/admin/inventory?mode=movements");
        const data = await res.json();
        if (res.ok) setMovements(data.movements || []);
        else setMsg(data.error || "Failed to load");
      } else if (tab === "expiring") {
        const res = await fetch("/api/admin/inventory?mode=expiring");
        const data = await res.json();
        if (res.ok) setBatches(data.batches || []);
        else setMsg(data.error || "Failed to load");
      } else {
        const params = new URLSearchParams({ mode: "stock", filter: tab });
        if (q.trim()) params.set("q", q.trim());
        if (source) params.set("source", source);
        if (method) params.set("method", method);
        if (grade) params.set("grade", grade);
        if (opsStatus) params.set("status", opsStatus);
        const res = await fetch(`/api/admin/inventory?${params}`);
        const data = await res.json();
        if (res.ok) setProducts(data.products || []);
        else setMsg(data.error || "Failed to load");
      }
    } catch {
      setMsg("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  }, [tab, q, source, method, grade, opsStatus]);

  useEffect(() => {
    const t = setTimeout(() => void load(), tab === "recent" ? 0 : 200);
    return () => clearTimeout(t);
  }, [load, tab]);

  const submitStock = async (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing.id,
          action,
          quantity: Number(qty),
          reason: reason || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Stock update failed");
      setMsg(`Stock updated for ${editing.nameEn}`);
      setEditing(null);
      setQty("");
      setReason("");
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Stock update failed");
    } finally {
      setBusy(false);
    }
  };

  const openHistory = async (p: StockProduct) => {
    setHistoryFor(p);
    const res = await fetch(`/api/admin/inventory?mode=movements&productId=${p.id}`);
    const data = await res.json();
    if (res.ok) setHistory(data.movements || []);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="admin-panel-title">Inventory</h1>
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

      {tab !== "recent" && tab !== "expiring" ? (
        <div className="flex flex-wrap items-end gap-2">
          <label className="relative block min-w-[200px] flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--admin-muted)]" />
            <input
              className="admin-input pl-9"
              placeholder="Search products…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </label>
          <select
            className="admin-input w-auto"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            aria-label="Source"
          >
            <option value="">All sources</option>
            <option value="FARMER">Farmer</option>
            <option value="MARKET">Market</option>
          </select>
          <select
            className="admin-input w-auto"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            aria-label="Purchase method"
          >
            <option value="">All methods</option>
            <option value="DIRECT">Direct</option>
            <option value="COMMISSION">Commission</option>
            <option value="MARKET">Market</option>
          </select>
          <select
            className="admin-input w-auto"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            aria-label="Grade"
          >
            <option value="">All grades</option>
            <option value="1">Grade 1</option>
            <option value="2">Grade 2</option>
            <option value="3">Grade 3</option>
          </select>
          <select
            className="admin-input w-auto"
            value={opsStatus}
            onChange={(e) => setOpsStatus(e.target.value)}
            aria-label="Ops status"
          >
            <option value="">All statuses</option>
            <option value="Available">Available</option>
            <option value="Reserved">Reserved</option>
            <option value="Sold Out">Sold Out</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      ) : null}

      <div className="admin-panel overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-[var(--admin-muted)]">Loading…</p>
        ) : tab === "expiring" ? (
          batches.length === 0 ? (
            <p className="p-6 text-sm text-[var(--admin-muted)]">
              No batches expiring in the next 7 days. (Especially useful for juices &amp; salads.)
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Batch</th>
                    <th>Qty</th>
                    <th>Expiry</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <p className="font-medium">{b.product?.nameEn || "—"}</p>
                        <p className="text-xs text-[var(--admin-muted)]">
                          {b.product?.category?.nameEn || "—"}
                        </p>
                      </td>
                      <td className="font-mono text-xs">{b.batchNumber}</td>
                      <td className="tabular-nums">
                        {b.quantity}{" "}
                        {b.product ? formatUnit(b.product.unit) : ""}
                      </td>
                      <td className="whitespace-nowrap text-xs">
                        {b.expiryDate
                          ? new Date(b.expiryDate).toLocaleDateString()
                          : "—"}
                      </td>
                      <td>
                        <span
                          className={
                            b.expired
                              ? "admin-status admin-status-warn"
                              : "admin-status admin-status-ok"
                          }
                        >
                          {b.expired ? "Expired" : "Expiring soon"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : tab === "recent" ? (
          movements.length === 0 ? (
            <p className="p-6 text-sm text-[var(--admin-muted)]">No recent stock changes.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Type</th>
                    <th>Qty</th>
                    <th>Reason</th>
                    <th>When</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => (
                    <tr key={m.id}>
                      <td className="font-medium">{m.product?.nameEn || "—"}</td>
                      <td>
                        <span
                          className={
                            m.type === "RECEIVE" || m.type === "STOCK_IN"
                              ? "font-semibold text-[var(--huza-green-dark)]"
                              : "font-semibold text-rose-700"
                          }
                        >
                          {m.type === "RECEIVE" || m.type === "STOCK_IN"
                            ? "Incoming"
                            : m.type === "SALE" || m.type === "STOCK_OUT"
                              ? "Outgoing"
                              : m.type}
                        </span>
                      </td>
                      <td className="tabular-nums">
                        {m.quantity} {m.product ? formatUnit(m.product.unit) : ""}
                      </td>
                      <td className="text-xs text-[var(--admin-muted)]">{m.reason || "—"}</td>
                      <td className="whitespace-nowrap text-xs text-[var(--admin-muted)]">
                        {new Date(m.createdAt).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : products.length === 0 ? (
          <p className="p-6 text-sm text-[var(--admin-muted)]">No products in this view.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Source</th>
                  <th>Method</th>
                  <th>Grade</th>
                  <th>Current Stock</th>
                  <th>Ops status</th>
                  <th>Stock</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const st = stockStatus(p);
                  const ops = p.inventoryStatus || "—";
                  return (
                    <tr key={p.id}>
                      <td>
                        <p className="font-medium">{p.nameEn}</p>
                        <p className="text-xs text-[var(--admin-muted)]">
                          {p.category?.nameEn || "—"}
                        </p>
                      </td>
                      <td className="text-xs">{p.inventorySource || "—"}</td>
                      <td className="text-xs">{p.purchaseMethod || "—"}</td>
                      <td className="text-xs tabular-nums">
                        {p.qualityGrade ? `G${p.qualityGrade}` : "—"}
                      </td>
                      <td className="tabular-nums font-semibold">
                        {available(p)} {formatUnit(p.unit)}
                      </td>
                      <td>
                        <span
                          className={
                            ops === "Available"
                              ? "admin-status admin-status-ok"
                              : ops === "Rejected" || ops === "Sold Out"
                                ? "admin-status admin-status-warn"
                                : "admin-status"
                          }
                        >
                          {ops}
                        </span>
                      </td>
                      <td>
                        <span className={st.className}>{st.label}</span>
                      </td>
                      <td className="space-x-1 text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditing(p);
                            setQty("");
                            setAction("stock_in");
                          }}
                        >
                          Update Stock
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => void openHistory(p)}
                        >
                          History
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing ? (
        <div className="admin-drawer-backdrop" onClick={() => setEditing(null)}>
          <aside className="admin-drawer" onClick={(e) => e.stopPropagation()} role="dialog">
            <div className="flex items-center justify-between border-b border-[var(--admin-line)] px-5 py-4">
              <h2 className="text-lg font-semibold">Update Stock · {editing.nameEn}</h2>
              <button type="button" className="admin-icon-btn" onClick={() => setEditing(null)}>
                <X className="size-4" />
              </button>
            </div>
            <form onSubmit={submitStock} className="flex flex-1 flex-col gap-4 p-5">
              <p className="text-sm text-[var(--admin-muted)]">
                Current: {available(editing)} {formatUnit(editing.unit)}
              </p>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Action</span>
                <select
                  className="admin-input"
                  value={action}
                  onChange={(e) => setAction(e.target.value as "stock_in" | "stock_out")}
                >
                  <option value="stock_in">Stock in</option>
                  <option value="stock_out">Stock out</option>
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Quantity</span>
                <input
                  className="admin-input"
                  type="number"
                  min={0.01}
                  step="any"
                  required
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Reason</span>
                <input
                  className="admin-input"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Optional note"
                />
              </label>
              <div className="mt-auto flex gap-2 border-t border-[var(--admin-line)] pt-4">
                <Button type="submit" disabled={busy} className="flex-1">
                  Save
                </Button>
                <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
              </div>
            </form>
          </aside>
        </div>
      ) : null}

      {historyFor ? (
        <div className="admin-drawer-backdrop" onClick={() => setHistoryFor(null)}>
          <aside className="admin-drawer" onClick={(e) => e.stopPropagation()} role="dialog">
            <div className="flex items-center justify-between border-b border-[var(--admin-line)] px-5 py-4">
              <h2 className="text-lg font-semibold">History · {historyFor.nameEn}</h2>
              <button type="button" className="admin-icon-btn" onClick={() => setHistoryFor(null)}>
                <X className="size-4" />
              </button>
            </div>
            <ul className="flex-1 space-y-2 overflow-y-auto p-5 text-sm">
              {history.length === 0 ? (
                <li className="text-[var(--admin-muted)]">No movements yet.</li>
              ) : (
                history.map((m) => (
                  <li
                    key={m.id}
                    className="rounded-lg border border-[var(--admin-line)] px-3 py-2"
                  >
                    <p className="font-semibold">
                      {m.type} · {m.quantity}
                    </p>
                    <p className="text-xs text-[var(--admin-muted)]">
                      {m.reason || "—"} · {new Date(m.createdAt).toLocaleString()}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
