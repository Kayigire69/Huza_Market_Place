"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { formatRwf } from "@/lib/utils";
import { AlertTriangle, Search, X } from "lucide-react";

type PaymentRow = {
  id: string;
  method: string;
  methodLabel?: string;
  amount: number;
  status: string;
  phoneNumber?: string;
  transactionRef?: string | null;
  externalId?: string | null;
  providerMessage?: string | null;
  verifiedAt?: string | null;
  refundedAt?: string | null;
  refundReason?: string | null;
  createdAt: string;
  amountMismatch?: boolean;
  customerName?: string;
  customerPhone?: string;
  order?: {
    id: string;
    orderNumber: string;
    total: number;
    status?: string;
  } | null;
};

type TabKey = "all" | "successful" | "pending" | "failed" | "refunds";
type MethodFilter = "" | "MTN_MOMO" | "AIRTEL_MONEY";

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "successful", label: "Successful" },
  { key: "pending", label: "Pending" },
  { key: "failed", label: "Failed" },
  { key: "refunds", label: "Refunds" },
];

type ReturnReq = {
  id: string;
  reason: string;
  status: string;
  refundAmt: number | null;
  createdAt: string;
  order: {
    orderNumber: string;
    total: number;
    payment?: { id: string; status: string; amount: number } | null;
  };
};

type ReconcileData = {
  amountMismatches: {
    id: string;
    orderNumber: string;
    paymentAmount: number;
    orderTotal: number;
    method: string;
    status: string;
  }[];
  missingRef: { id: string; orderNumber: string; amount: number; method: string; status: string }[];
  stuckPending: { id: string; orderNumber: string; amount: number; method: string; createdAt: string }[];
  byMethod: { method: string; methodLabel: string; status: string; count: number; total: number }[];
};

export function AdminPaymentsClient() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as TabKey) || "all";
  const [tab, setTab] = useState<TabKey>(
    TABS.some((t) => t.key === initialTab) ? initialTab : "all"
  );
  const [method, setMethod] = useState<MethodFilter>("");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [totals, setTotals] = useState<Record<string, number>>({});
  const [returnRequests, setReturnRequests] = useState<ReturnReq[]>([]);
  const [providers, setProviders] = useState({ mtnConfigured: false, airtelConfigured: false });
  const [reconcile, setReconcile] = useState<ReconcileData | null>(null);
  const [showReconcile, setShowReconcile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [viewing, setViewing] = useState<PaymentRow | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ tab });
      if (method) params.set("method", method);
      if (debouncedQ) params.set("q", debouncedQ);
      const res = await fetch(`/api/admin/payments?${params}`);
      const data = await res.json();
      if (res.ok) {
        setPayments(data.payments || []);
        setCounts(data.counts || {});
        setTotals(data.totals || {});
        setReturnRequests(data.returnRequests || []);
        setProviders(data.providers || { mtnConfigured: false, airtelConfigured: false });
      } else setMsg(data.error || "Failed to load payments");
    } catch {
      setMsg("Failed to load payments");
    } finally {
      setLoading(false);
    }
  }, [tab, method, debouncedQ]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadReconcile = async () => {
    setShowReconcile(true);
    try {
      const res = await fetch("/api/admin/payments?view=reconcile");
      const data = await res.json();
      if (res.ok) setReconcile(data.reconcile);
      else setMsg(data.error || "Reconcile failed");
    } catch {
      setMsg("Reconcile failed");
    }
  };

  const act = async (
    id: string,
    action: "confirm" | "refund" | "fail" | "sync" | "set_ref",
    extra?: Record<string, unknown>
  ) => {
    setBusy(id);
    try {
      let payload: Record<string, unknown> = { id, action, ...extra };
      if (action === "refund" && !extra?.reason) {
        const reason = window.prompt("Refund reason", "Customer request");
        if (!reason) {
          setBusy(null);
          return;
        }
        payload = { ...payload, reason };
      }
      if (action === "fail" && !extra?.reason) {
        const reason = window.prompt("Failure reason", "Customer did not approve payment");
        if (!reason) {
          setBusy(null);
          return;
        }
        payload = { ...payload, reason };
      }
      if (action === "set_ref") {
        const ref = window.prompt("Transaction reference", viewing?.transactionRef || "");
        if (ref == null) {
          setBusy(null);
          return;
        }
        payload = { ...payload, transactionRef: ref };
      }

      const res = await fetch("/api/admin/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      const labels: Record<string, string> = {
        confirm: "Payment confirmed",
        refund: "Refund recorded",
        fail: "Marked failed",
        sync: `Sync: ${data.result?.status || "done"}`,
        set_ref: "Reference saved",
      };
      setMsg(labels[action] || "Updated");
      setViewing(null);
      await load();
      if (showReconcile) await loadReconcile();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(null);
    }
  };

  const openView = async (p: PaymentRow) => {
    setViewing(p);
    try {
      const res = await fetch(`/api/admin/payments?id=${p.id}`);
      const data = await res.json();
      if (res.ok && data.payment) setViewing(data.payment);
    } catch {
      /* keep list row */
    }
  };

  const tabTotal =
    tab === "successful"
      ? totals.successful
      : tab === "pending"
        ? totals.pending
        : tab === "failed"
          ? totals.failed
          : tab === "refunds"
            ? totals.refunds
            : (totals.successful || 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="admin-panel-title">Payments</h1>
          <p className="admin-panel-sub">
            MTN MoMo & Airtel Money — history, refunds, failed payments, and reconciliation.
          </p>
        </div>
        <Button type="button" size="sm" variant="ghost" onClick={() => void loadReconcile()}>
          Reconciliation
        </Button>
      </div>

      {msg ? (
        <p className="rounded-lg border border-[var(--admin-line)] bg-[var(--admin-soft)] px-3 py-2 text-sm">
          {msg}
        </p>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div className="admin-panel p-3">
          <p className="text-[10px] uppercase text-[var(--admin-muted)]">Successful</p>
          <p className="text-lg font-bold tabular-nums">{formatRwf(totals.successful || 0)}</p>
          <p className="text-xs text-[var(--admin-muted)]">{counts.successful ?? 0} payments</p>
        </div>
        <div className="admin-panel p-3">
          <p className="text-[10px] uppercase text-[var(--admin-muted)]">Pending</p>
          <p className="text-lg font-bold tabular-nums">{formatRwf(totals.pending || 0)}</p>
          <p className="text-xs text-[var(--admin-muted)]">{counts.pending ?? 0} awaiting</p>
        </div>
        <div className="admin-panel p-3">
          <p className="text-[10px] uppercase text-[var(--admin-muted)]">Failed</p>
          <p className="text-lg font-bold tabular-nums">{formatRwf(totals.failed || 0)}</p>
          <p className="text-xs text-[var(--admin-muted)]">{counts.failed ?? 0} failed</p>
        </div>
        <div className="admin-panel p-3">
          <p className="text-[10px] uppercase text-[var(--admin-muted)]">Refunds</p>
          <p className="text-lg font-bold tabular-nums">{formatRwf(totals.refunds || 0)}</p>
          <p className="text-xs text-[var(--admin-muted)]">{counts.refunds ?? 0} refunded</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-[var(--admin-muted)]">
        <span
          className={`rounded-md border px-2 py-1 ${
            providers.mtnConfigured
              ? "border-emerald-300 text-emerald-800"
              : "border-[var(--admin-line)]"
          }`}
        >
          MTN MoMo {providers.mtnConfigured ? "· live" : "· demo"}
        </span>
        <span
          className={`rounded-md border px-2 py-1 ${
            providers.airtelConfigured
              ? "border-emerald-300 text-emerald-800"
              : "border-[var(--admin-line)]"
          }`}
        >
          Airtel Money {providers.airtelConfigured ? "· live" : "· demo"}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`admin-filter-chip ${tab === t.key ? "is-active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            {counts[t.key] != null ? (
              <span className="ml-1 tabular-nums opacity-70">{counts[t.key]}</span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="relative block min-w-[200px] flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--admin-muted)]" />
          <input
            className="admin-input pl-9"
            placeholder="Order, phone, transaction ref…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <select
          className="admin-input w-auto"
          value={method}
          onChange={(e) => setMethod(e.target.value as MethodFilter)}
        >
          <option value="">All methods</option>
          <option value="MTN_MOMO">MTN MoMo</option>
          <option value="AIRTEL_MONEY">Airtel Money</option>
        </select>
        {tab !== "all" ? (
          <p className="text-sm text-[var(--admin-muted)]">
            Tab total: <strong className="text-[var(--admin-ink)]">{formatRwf(tabTotal || 0)}</strong>
          </p>
        ) : null}
      </div>

      {showReconcile && reconcile ? (
        <section className="admin-panel space-y-4 p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <AlertTriangle className="size-4 text-amber-600" />
              Reconciliation
            </h2>
            <Button type="button" size="sm" variant="ghost" onClick={() => setShowReconcile(false)}>
              Close
            </Button>
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-[var(--admin-muted)]">
              Amount mismatches ({reconcile.amountMismatches.length})
            </p>
            {reconcile.amountMismatches.length === 0 ? (
              <p className="text-xs text-[var(--admin-muted)]">None</p>
            ) : (
              <ul className="space-y-1 text-xs">
                {reconcile.amountMismatches.map((m) => (
                  <li key={m.id} className="flex flex-wrap justify-between gap-2">
                    <span className="font-mono font-semibold">{m.orderNumber}</span>
                    <span>
                      Pay {formatRwf(m.paymentAmount)} ≠ Order {formatRwf(m.orderTotal)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-[var(--admin-muted)]">
              Missing transaction ref ({reconcile.missingRef.length})
            </p>
            {reconcile.missingRef.length === 0 ? (
              <p className="text-xs text-[var(--admin-muted)]">None</p>
            ) : (
              <ul className="space-y-1 text-xs">
                {reconcile.missingRef.slice(0, 15).map((m) => (
                  <li key={m.id} className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono font-semibold">{m.orderNumber}</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={busy === m.id}
                      onClick={() => void act(m.id, "set_ref")}
                    >
                      Set ref
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-[var(--admin-muted)]">
              Stuck pending &gt; 1h ({reconcile.stuckPending.length})
            </p>
            {reconcile.stuckPending.length === 0 ? (
              <p className="text-xs text-[var(--admin-muted)]">None</p>
            ) : (
              <ul className="space-y-1 text-xs">
                {reconcile.stuckPending.map((m) => (
                  <li key={m.id} className="flex flex-wrap items-center justify-between gap-2">
                    <span>
                      <span className="font-mono font-semibold">{m.orderNumber}</span> ·{" "}
                      {formatRwf(m.amount)}
                    </span>
                    <span className="flex gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={busy === m.id}
                        onClick={() => void act(m.id, "sync")}
                      >
                        Sync
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="danger"
                        disabled={busy === m.id}
                        onClick={() => void act(m.id, "fail")}
                      >
                        Fail
                      </Button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-[var(--admin-muted)]">
              By method / status
            </p>
            <div className="overflow-x-auto">
              <table className="admin-table text-xs">
                <thead>
                  <tr>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Count</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {reconcile.byMethod.map((r, i) => (
                    <tr key={`${r.method}-${r.status}-${i}`}>
                      <td>{r.methodLabel}</td>
                      <td>{r.status}</td>
                      <td className="tabular-nums">{r.count}</td>
                      <td className="tabular-nums font-semibold">{formatRwf(r.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : null}

      {tab === "refunds" && returnRequests.length > 0 ? (
        <section className="admin-panel p-4">
          <h2 className="mb-2 text-sm font-semibold">Open return / refund requests</h2>
          <ul className="space-y-2 text-sm">
            {returnRequests.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--admin-line)] px-3 py-2"
              >
                <div>
                  <p className="font-mono text-xs font-bold">{r.order.orderNumber}</p>
                  <p className="text-xs text-[var(--admin-muted)]">{r.reason}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="admin-status admin-status-warn">{r.status}</span>
                  {r.order.payment &&
                  (r.order.payment.status === "CONFIRMED" ||
                    r.order.payment.status === "VERIFIED") ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={busy === r.order.payment.id}
                      onClick={() =>
                        void act(r.order.payment!.id, "refund", {
                          reason: `Return request: ${r.reason}`,
                        })
                      }
                    >
                      Refund {formatRwf(r.refundAmt || r.order.payment.amount)}
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="admin-panel overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-[var(--admin-muted)]">Loading payments…</p>
        ) : payments.length === 0 ? (
          <p className="p-6 text-sm text-[var(--admin-muted)]">No payments in this view.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Method</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <p className="font-mono text-xs font-semibold">
                        {p.order?.orderNumber || "—"}
                      </p>
                      {p.amountMismatch ? (
                        <p className="text-[10px] text-amber-700">Amount ≠ order total</p>
                      ) : null}
                      {p.transactionRef ? (
                        <p className="text-[10px] text-[var(--admin-muted)]">Ref {p.transactionRef}</p>
                      ) : null}
                    </td>
                    <td>
                      <p className="text-sm font-medium">{p.customerName}</p>
                      <p className="text-xs text-[var(--admin-muted)]">{p.customerPhone}</p>
                    </td>
                    <td>{p.methodLabel || p.method}</td>
                    <td className="tabular-nums font-semibold">{formatRwf(p.amount)}</td>
                    <td>
                      <span
                        className={
                          p.status === "CONFIRMED" || p.status === "VERIFIED"
                            ? "admin-status admin-status-ok"
                            : p.status === "REFUNDED" || p.status === "FAILED"
                              ? "admin-status admin-status-muted"
                              : "admin-status admin-status-warn"
                        }
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap text-xs text-[var(--admin-muted)]">
                      {new Date(p.createdAt).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="text-right">
                      <div className="flex flex-wrap justify-end gap-1">
                        {p.status === "PENDING" ? (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              disabled={busy === p.id}
                              onClick={() => void act(p.id, "sync")}
                            >
                              Sync
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              disabled={busy === p.id}
                              onClick={() => void act(p.id, "confirm")}
                            >
                              Confirm
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="danger"
                              disabled={busy === p.id}
                              onClick={() => void act(p.id, "fail")}
                            >
                              Fail
                            </Button>
                          </>
                        ) : null}
                        {p.status === "CONFIRMED" || p.status === "VERIFIED" ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={busy === p.id}
                            onClick={() => void act(p.id, "refund")}
                          >
                            Refund
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => void openView(p)}
                        >
                          View
                        </Button>
                      </div>
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
            style={{ width: "min(440px, 100%)" }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
          >
            <div className="flex items-center justify-between border-b border-[var(--admin-line)] px-5 py-4">
              <div>
                <h2 className="font-mono text-lg font-semibold">
                  {viewing.order?.orderNumber}
                </h2>
                <p className="text-xs text-[var(--admin-muted)]">
                  {viewing.methodLabel || viewing.method} · {viewing.status}
                </p>
              </div>
              <button type="button" className="admin-icon-btn" onClick={() => setViewing(null)}>
                <X className="size-4" />
              </button>
            </div>
            <div className="space-y-3 p-5 text-sm">
              <p>
                <span className="text-[var(--admin-muted)]">Amount:</span>{" "}
                <strong>{formatRwf(viewing.amount)}</strong>
                {viewing.order ? (
                  <span className="text-xs text-[var(--admin-muted)]">
                    {" "}
                    (order {formatRwf(viewing.order.total)})
                  </span>
                ) : null}
              </p>
              <p>
                <span className="text-[var(--admin-muted)]">Payer phone:</span>{" "}
                {viewing.phoneNumber || "—"}
              </p>
              <p>
                <span className="text-[var(--admin-muted)]">Transaction ref:</span>{" "}
                {viewing.transactionRef || "—"}
              </p>
              <p>
                <span className="text-[var(--admin-muted)]">External ID:</span>{" "}
                <span className="break-all font-mono text-xs">{viewing.externalId || "—"}</span>
              </p>
              {viewing.providerMessage ? (
                <p className="text-xs text-[var(--admin-muted)]">{viewing.providerMessage}</p>
              ) : null}
              {viewing.refundReason ? (
                <p className="text-xs text-amber-800">Refund: {viewing.refundReason}</p>
              ) : null}
              <p className="text-xs text-[var(--admin-muted)]">
                Created {new Date(viewing.createdAt).toLocaleString()}
                {viewing.verifiedAt
                  ? ` · Verified ${new Date(viewing.verifiedAt).toLocaleString()}`
                  : ""}
                {viewing.refundedAt
                  ? ` · Refunded ${new Date(viewing.refundedAt).toLocaleString()}`
                  : ""}
              </p>
              <div className="flex flex-wrap gap-2 border-t border-[var(--admin-line)] pt-3">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={busy === viewing.id}
                  onClick={() => void act(viewing.id, "set_ref")}
                >
                  Set / edit ref
                </Button>
                {viewing.status === "PENDING" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={busy === viewing.id}
                    onClick={() => void act(viewing.id, "sync")}
                  >
                    Sync provider
                  </Button>
                ) : null}
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
