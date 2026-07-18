"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatRwf, formatUnit } from "@/lib/utils";
import { X } from "lucide-react";

type Offer = {
  id: string;
  title: string;
  description?: string | null;
  quantityOffered: number;
  unit: string;
  askPrice: number;
  suggestedRetail?: number | null;
  status: string;
  supplier?: { businessName?: string; defaultCommissionRate?: number | null } | null;
};

type PO = {
  id: string;
  poNumber: string;
  status: string;
  dealType?: string;
  quantity: number;
  negotiatedPrice: number;
  totalAmount?: number;
  retailPrice?: number | null;
  commissionRate?: number | null;
  saleAmount?: number | null;
  commissionAmount?: number | null;
  farmerNetAmount?: number | null;
  paymentRef?: string | null;
  paymentMethod?: string | null;
  paidAt?: string | null;
  productName?: string;
  productId?: string | null;
  qualityNotes?: string | null;
  liveSales?: number;
  supplier?: {
    businessName?: string;
    defaultCommissionRate?: number | null;
    paymentMomo?: string | null;
  } | null;
  offer?: { title?: string } | null;
};

export type ProcurementView =
  | "requests"
  | "orders"
  | "received"
  | "commission"
  | "payments"
  | "history";

const PIPELINE = [
  { step: "1", label: "Approve", href: "/admin/approvals" },
  { step: "2", label: "Purchase request", href: "/admin/procurement/requests" },
  { step: "3", label: "Purchase order", href: "/admin/procurement/orders" },
  { step: "4", label: "Receive & inspect", href: "/admin/procurement/orders" },
  { step: "5", label: "Commission / pay", href: "/admin/procurement/commission" },
  { step: "6", label: "History", href: "/admin/procurement/history" },
];

function statusTone(status: string) {
  if (status === "PAID" || status === "INSPECTED" || status === "ACCEPTED")
    return "admin-status admin-status-ok";
  if (status === "REJECTED" || status === "CANCELLED") return "admin-status admin-status-muted";
  return "admin-status admin-status-warn";
}

function dealLabel(dealType?: string) {
  return dealType === "COMMISSION" ? "Commission sale" : "Outright buy";
}

export function AdminProcurementClient({ view }: { view: ProcurementView }) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [orders, setOrders] = useState<PO[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [buying, setBuying] = useState<Offer | null>(null);
  const [buyForm, setBuyForm] = useState({
    dealType: "OUTRIGHT_BUY" as "OUTRIGHT_BUY" | "COMMISSION",
    wholesale: "",
    retail: "",
    qty: "",
    commissionRate: "10",
  });
  const [receivePo, setReceivePo] = useState<PO | null>(null);
  const [expiryDate, setExpiryDate] = useState("");
  const [settlePo, setSettlePo] = useState<PO | null>(null);
  const [saleAmount, setSaleAmount] = useState("");
  const [settleRate, setSettleRate] = useState("10");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/procurement?view=${view}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setOffers(data.offers || []);
      setOrders(data.purchaseOrders || []);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [view]);

  useEffect(() => {
    void load();
  }, [load]);

  const offerAction = async (
    offerId: string,
    action: string,
    extra?: Record<string, unknown>
  ) => {
    setBusy(offerId);
    try {
      const res = await fetch("/api/admin/procurement", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId, action, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      setMsg(
        action === "purchase"
          ? buyForm.dealType === "COMMISSION"
            ? "Commission PO created — receive, QC, sell, then settle & pay"
            : "PO created — await farmer delivery, then receive & inspect"
          : "Updated"
      );
      setBuying(null);
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(null);
    }
  };

  const poAction = async (
    poId: string,
    poActionName: string,
    extra?: Record<string, unknown>
  ) => {
    setBusy(poId);
    try {
      const res = await fetch("/api/admin/procurement", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ poId, poAction: poActionName, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      if (poActionName === "inspect_accept") {
        setMsg("Quality passed — product is now live in the shop");
      } else if (poActionName === "receive") {
        setMsg("Goods received into warehouse — inspect quality next");
      } else if (poActionName === "settle") {
        setMsg(
          `Settlement ready — farmer receives ${formatRwf(data.farmerNetAmount || 0)}`
        );
      } else if (poActionName === "pay") {
        setMsg("Farmer marked as paid");
      } else {
        setMsg("Purchase order updated");
      }
      setReceivePo(null);
      setSettlePo(null);
      setExpiryDate("");
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(null);
    }
  };

  const submitBuy = (e: FormEvent) => {
    e.preventDefault();
    if (!buying) return;
    void offerAction(buying.id, "purchase", {
      dealType: buyForm.dealType,
      negotiatedPrice:
        buyForm.dealType === "COMMISSION"
          ? Number(buyForm.wholesale) || 0
          : Number(buyForm.wholesale),
      retailPrice: Number(buyForm.retail),
      purchasedQty: Number(buyForm.qty) || buying.quantityOffered,
      commissionRate:
        buyForm.dealType === "COMMISSION" ? Number(buyForm.commissionRate) : undefined,
    });
  };

  const title =
    view === "requests"
      ? "Purchase Requests"
      : view === "orders"
        ? "Purchase Orders"
        : view === "received"
          ? "Goods Received"
          : view === "commission"
            ? "Commission Sales"
            : view === "payments"
              ? "Farmer Payments"
              : "Procurement History";

  const pipelineActive = (step: string) => {
    if (view === "requests" && step === "2") return true;
    if (view === "orders" && (step === "3" || step === "4")) return true;
    if (view === "received" && step === "4") return true;
    if ((view === "commission" || view === "payments") && step === "5") return true;
    if (view === "history" && step === "6") return true;
    return false;
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="admin-panel-title">{title}</h1>
      </div>

      <div className="admin-panel overflow-x-auto p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--admin-muted)]">
          Buying pipeline
        </p>
        <ol className="flex min-w-max gap-2">
          {PIPELINE.map((p, i) => (
            <li key={p.step} className="flex items-center gap-2">
              <Link
                href={p.href}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                  pipelineActive(p.step)
                    ? "border-[var(--huza-green)] bg-[var(--huza-green)] text-white"
                    : "border-[var(--admin-line)] bg-[var(--admin-soft)] text-[var(--admin-ink)] hover:border-[#b7dcc6]"
                }`}
              >
                <span className="opacity-70">{p.step}.</span> {p.label}
              </Link>
              {i < PIPELINE.length - 1 ? (
                <span className="text-[var(--admin-muted)]" aria-hidden>
                  →
                </span>
              ) : null}
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-[var(--admin-muted)]">
          Customers always buy from HUZA FRESH. Commission settlement stays in Admin only.
        </p>
      </div>

      {msg ? (
        <p className="rounded-lg border border-[var(--admin-line)] bg-[var(--admin-soft)] px-3 py-2 text-sm">
          {msg}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-[var(--admin-muted)]">Loading…</p>
      ) : view === "requests" ? (
        offers.length === 0 ? (
          <div className="admin-panel p-6 text-sm text-[var(--admin-muted)]">
            No purchase requests yet. Farmers submit offers from their portal.
          </div>
        ) : (
          <div className="space-y-3">
            {offers.map((o) => (
              <article key={o.id} className="admin-panel p-4">
                <div className="flex flex-wrap justify-between gap-2">
                  <div>
                    <p className="font-semibold">{o.title}</p>
                    <p className="text-sm text-[var(--admin-muted)]">
                      {o.supplier?.businessName} · {o.quantityOffered} {formatUnit(o.unit)} · Ask{" "}
                      {formatRwf(o.askPrice)}/{formatUnit(o.unit)}
                    </p>
                    {o.description ? (
                      <p className="mt-1 text-sm text-[var(--admin-muted)]">{o.description}</p>
                    ) : null}
                  </div>
                  <span className={statusTone(o.status)}>{o.status}</span>
                </div>
                {(o.status === "PENDING" || o.status === "ACCEPTED") && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {o.status === "PENDING" ? (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busy === o.id}
                          onClick={() => void offerAction(o.id, "accept")}
                        >
                          Accept offer
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          disabled={busy === o.id}
                          onClick={() =>
                            void offerAction(o.id, "reject", { adminNote: "Not needed now" })
                          }
                        >
                          Reject
                        </Button>
                      </>
                    ) : null}
                    <Button
                      size="sm"
                      disabled={busy === o.id}
                      onClick={() => {
                        setBuying(o);
                        setBuyForm({
                          dealType: "OUTRIGHT_BUY",
                          wholesale: String(o.askPrice),
                          retail: String(o.suggestedRetail || Math.round(o.askPrice * 1.25)),
                          qty: String(o.quantityOffered),
                          commissionRate: String(o.supplier?.defaultCommissionRate ?? 10),
                        });
                      }}
                    >
                      Create agreement / PO
                    </Button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )
      ) : orders.length === 0 ? (
        <div className="admin-panel p-6 text-sm text-[var(--admin-muted)]">
          {view === "commission"
            ? "No commission sales yet. Create a PO with “Commission sale” from Purchase Requests."
            : view === "payments"
              ? "No farmer payments pending or recorded yet."
              : view === "history"
                ? "No procurement history yet."
                : `No ${view === "received" ? "received goods" : "open purchase orders"} yet.`}
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((po) => {
            const isCommission = po.dealType === "COMMISSION";
            const sales = po.saleAmount ?? po.liveSales ?? 0;
            const rate = po.commissionRate ?? po.supplier?.defaultCommissionRate ?? 10;
            const commission =
              po.commissionAmount ?? Math.round((sales * rate) / 100);
            const farmerGets =
              po.farmerNetAmount ?? Math.max(0, sales - commission);

            return (
              <article key={po.id} className="admin-panel p-4">
                <div className="flex flex-wrap justify-between gap-2">
                  <div>
                    <p className="font-mono text-sm font-bold">{po.poNumber}</p>
                    <p className="font-semibold">
                      {po.productName || po.offer?.title || "Purchase order"}
                    </p>
                    <p className="text-sm text-[var(--admin-muted)]">
                      {po.supplier?.businessName} · Qty {po.quantity} · {dealLabel(po.dealType)}
                      {!isCommission
                        ? ` · ${formatRwf(po.negotiatedPrice)}/unit wholesale`
                        : ` · commission ${rate}%`}
                      {po.retailPrice ? ` · retail ${formatRwf(po.retailPrice)}` : ""}
                    </p>
                    {isCommission && (view === "commission" || view === "payments" || view === "history") ? (
                      <div className="mt-2 grid gap-1 text-xs text-[var(--admin-ink)] sm:grid-cols-2">
                        <p>
                          Sales: <strong>{formatRwf(sales)}</strong>
                          {po.liveSales != null && po.saleAmount == null
                            ? " (from paid orders)"
                            : ""}
                        </p>
                        <p>
                          HUZA commission ({rate}%): <strong>{formatRwf(commission)}</strong>
                        </p>
                        <p>
                          Farmer receives: <strong>{formatRwf(farmerGets)}</strong>
                        </p>
                        {po.paidAt ? (
                          <p>
                            Paid: {new Date(po.paidAt).toLocaleDateString()} · {po.paymentRef}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                    {!isCommission && view === "payments" && po.status === "PAID" ? (
                      <p className="mt-1 text-xs text-[var(--admin-muted)]">
                        Paid {formatRwf(po.farmerNetAmount ?? po.totalAmount ?? 0)}
                        {po.paidAt ? ` · ${new Date(po.paidAt).toLocaleDateString()}` : ""}
                        {po.paymentRef ? ` · ${po.paymentRef}` : ""}
                      </p>
                    ) : null}
                    {po.qualityNotes ? (
                      <p className="mt-1 text-xs text-[var(--admin-muted)]">QC: {po.qualityNotes}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={statusTone(po.status)}>{po.status}</span>
                    <span className="rounded-full bg-[var(--admin-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--admin-muted)]">
                      {dealLabel(po.dealType)}
                    </span>
                  </div>
                </div>

                {(view === "orders" || view === "history") && (
                  <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-semibold uppercase tracking-wide">
                    {["ORDERED", "RECEIVED", "INSPECTED", "PAID"].map((s) => {
                      const order = ["ORDERED", "RECEIVED", "INSPECTED", "PAID"];
                      const cur = order.indexOf(
                        po.status === "ACCEPTED" ? "INSPECTED" : po.status
                      );
                      const idx = order.indexOf(s);
                      const done =
                        cur >= idx && po.status !== "REJECTED" && po.status !== "CANCELLED";
                      return (
                        <span
                          key={s}
                          className={`rounded-full px-2 py-0.5 ${
                            done
                              ? "bg-[var(--huza-green)] text-white"
                              : "bg-[var(--admin-soft)] text-[var(--admin-muted)]"
                          }`}
                        >
                          {s}
                        </span>
                      );
                    })}
                  </div>
                )}

                {view === "orders" ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {po.status === "ORDERED" || po.status === "DRAFT" ? (
                      <Button
                        size="sm"
                        disabled={busy === po.id}
                        onClick={() => {
                          setReceivePo(po);
                          setExpiryDate("");
                        }}
                      >
                        Mark received
                      </Button>
                    ) : null}
                    {po.status === "RECEIVED" ? (
                      <>
                        <Button
                          size="sm"
                          disabled={busy === po.id}
                          onClick={() => void poAction(po.id, "inspect_accept")}
                        >
                          QC pass → publish to shop
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          disabled={busy === po.id}
                          onClick={() => {
                            const reason =
                              window.prompt(
                                "Rejection reason (shown to farmer)",
                                "Quality below Huza standard"
                              ) || undefined;
                            if (!reason) return;
                            const recommendation =
                              window.prompt(
                                "Recommendation — what should the farmer do next?",
                                "Improve harvest handling and cleanliness, then offer the next batch."
                              ) || undefined;
                            void poAction(po.id, "inspect_reject", {
                              rejectionReason: reason,
                              recommendation,
                            });
                          }}
                        >
                          QC reject
                        </Button>
                      </>
                    ) : null}
                    {po.status === "INSPECTED" && !isCommission ? (
                      <Button
                        size="sm"
                        disabled={busy === po.id}
                        onClick={() => void poAction(po.id, "pay")}
                      >
                        Mark farmer paid
                      </Button>
                    ) : null}
                    {po.status === "INSPECTED" && isCommission ? (
                      <Link href="/admin/procurement/commission">
                        <Button size="sm" type="button">
                          Open commission settlement
                        </Button>
                      </Link>
                    ) : null}
                    {po.productId ? (
                      <Link href="/admin/products">
                        <Button size="sm" variant="ghost" type="button">
                          Open catalog
                        </Button>
                      </Link>
                    ) : null}
                  </div>
                ) : null}

                {view === "commission" &&
                isCommission &&
                (po.status === "INSPECTED" || po.status === "ACCEPTED") ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy === po.id}
                      onClick={() => {
                        setSettlePo(po);
                        setSaleAmount(String(po.saleAmount ?? po.liveSales ?? 0));
                        setSettleRate(String(rate));
                      }}
                    >
                      Calculate settlement
                    </Button>
                    <Button
                      size="sm"
                      disabled={busy === po.id}
                      onClick={() => {
                        setSettlePo(po);
                        setSaleAmount(String(po.saleAmount ?? po.liveSales ?? 0));
                        setSettleRate(String(rate));
                      }}
                    >
                      Pay farmer
                    </Button>
                  </div>
                ) : null}

                {view === "payments" &&
                (po.status === "INSPECTED" || po.status === "ACCEPTED") ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {isCommission ? (
                      <Link href="/admin/procurement/commission">
                        <Button size="sm" type="button">
                          Settle &amp; pay (commission)
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        size="sm"
                        disabled={busy === po.id}
                        onClick={() => void poAction(po.id, "pay")}
                      >
                        Mark farmer paid
                      </Button>
                    )}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}

      {buying ? (
        <div className="admin-drawer-backdrop" onClick={() => setBuying(null)}>
          <aside className="admin-drawer" onClick={(e) => e.stopPropagation()} role="dialog">
            <div className="flex items-center justify-between border-b border-[var(--admin-line)] px-5 py-4">
              <h2 className="text-lg font-semibold">Agreement · {buying.title}</h2>
              <button type="button" className="admin-icon-btn" onClick={() => setBuying(null)}>
                <X className="size-4" />
              </button>
            </div>
            <form onSubmit={submitBuy} className="flex flex-1 flex-col gap-4 p-5">
              <p className="text-sm text-[var(--admin-muted)]">
                Choose how Youth Huza takes this produce. Customers always see HUZA FRESH only.
              </p>
              <fieldset className="space-y-2">
                <legend className="mb-1 text-sm font-medium">Deal type</legend>
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="radio"
                    name="dealType"
                    checked={buyForm.dealType === "OUTRIGHT_BUY"}
                    onChange={() => setBuyForm((f) => ({ ...f, dealType: "OUTRIGHT_BUY" }))}
                  />
                  <span>
                    <strong>Outright buy</strong> — Huza pays farmer now (or on delivery), owns
                    stock, keeps 100% of retail sales.
                  </span>
                </label>
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="radio"
                    name="dealType"
                    checked={buyForm.dealType === "COMMISSION"}
                    onChange={() => setBuyForm((f) => ({ ...f, dealType: "COMMISSION" }))}
                  />
                  <span>
                    <strong>Commission sale</strong> — Huza sells on HUZA FRESH, then settles farmer
                    after sales (commission deducted automatically).
                  </span>
                </label>
              </fieldset>
              {buyForm.dealType === "OUTRIGHT_BUY" ? (
                <label className="block text-sm">
                  <span className="mb-1 block font-medium">Wholesale (RWF / unit)</span>
                  <input
                    className="admin-input"
                    type="number"
                    min={0}
                    required
                    value={buyForm.wholesale}
                    onChange={(e) => setBuyForm((f) => ({ ...f, wholesale: e.target.value }))}
                  />
                </label>
              ) : (
                <label className="block text-sm">
                  <span className="mb-1 block font-medium">Commission rate (%)</span>
                  <input
                    className="admin-input"
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={buyForm.commissionRate}
                    onChange={(e) =>
                      setBuyForm((f) => ({ ...f, commissionRate: e.target.value }))
                    }
                  />
                </label>
              )}
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Retail price (RWF / unit)</span>
                <input
                  className="admin-input"
                  type="number"
                  min={0}
                  required
                  value={buyForm.retail}
                  onChange={(e) => setBuyForm((f) => ({ ...f, retail: e.target.value }))}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Quantity</span>
                <input
                  className="admin-input"
                  type="number"
                  min={0.01}
                  step="any"
                  required
                  value={buyForm.qty}
                  onChange={(e) => setBuyForm((f) => ({ ...f, qty: e.target.value }))}
                />
              </label>
              <div className="mt-auto flex gap-2 border-t border-[var(--admin-line)] pt-4">
                <Button type="submit" disabled={busy === buying.id} className="flex-1">
                  Create PO
                </Button>
                <Button type="button" variant="ghost" onClick={() => setBuying(null)}>
                  Cancel
                </Button>
              </div>
            </form>
          </aside>
        </div>
      ) : null}

      {receivePo ? (
        <div className="admin-drawer-backdrop" onClick={() => setReceivePo(null)}>
          <aside className="admin-drawer" onClick={(e) => e.stopPropagation()} role="dialog">
            <div className="flex items-center justify-between border-b border-[var(--admin-line)] px-5 py-4">
              <h2 className="text-lg font-semibold">Receive · {receivePo.poNumber}</h2>
              <button type="button" className="admin-icon-btn" onClick={() => setReceivePo(null)}>
                <X className="size-4" />
              </button>
            </div>
            <div className="flex flex-1 flex-col gap-4 p-5">
              <p className="text-sm text-[var(--admin-muted)]">
                Records stock into the warehouse. Product stays hidden from customers until QC
                passes.
              </p>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">
                  Batch expiry (optional — juices &amp; salads)
                </span>
                <input
                  type="date"
                  className="admin-input"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </label>
              <div className="mt-auto flex gap-2 border-t border-[var(--admin-line)] pt-4">
                <Button
                  type="button"
                  className="flex-1"
                  disabled={busy === receivePo.id}
                  onClick={() =>
                    void poAction(receivePo.id, "receive", {
                      expiryDate: expiryDate || undefined,
                    })
                  }
                >
                  Confirm received
                </Button>
                <Button type="button" variant="ghost" onClick={() => setReceivePo(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          </aside>
        </div>
      ) : null}

      {settlePo ? (
        <div className="admin-drawer-backdrop" onClick={() => setSettlePo(null)}>
          <aside className="admin-drawer" onClick={(e) => e.stopPropagation()} role="dialog">
            <div className="flex items-center justify-between border-b border-[var(--admin-line)] px-5 py-4">
              <h2 className="text-lg font-semibold">Settle · {settlePo.poNumber}</h2>
              <button type="button" className="admin-icon-btn" onClick={() => setSettlePo(null)}>
                <X className="size-4" />
              </button>
            </div>
            <div className="flex flex-1 flex-col gap-4 p-5">
              <p className="text-sm text-[var(--admin-muted)]">
                Sale amount defaults from paid customer orders for this product. Adjust if needed,
                then pay the farmer.
              </p>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Sale amount (RWF)</span>
                <input
                  className="admin-input"
                  type="number"
                  min={0}
                  value={saleAmount}
                  onChange={(e) => setSaleAmount(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Commission %</span>
                <input
                  className="admin-input"
                  type="number"
                  min={0}
                  max={100}
                  value={settleRate}
                  onChange={(e) => setSettleRate(e.target.value)}
                />
              </label>
              <div className="rounded-lg border border-[var(--admin-line)] bg-[var(--admin-soft)] p-3 text-sm">
                {(() => {
                  const sale = Number(saleAmount) || 0;
                  const rate = Number(settleRate) || 0;
                  const huza = Math.round((sale * rate) / 100);
                  const farmer = Math.max(0, sale - huza);
                  return (
                    <>
                      <p>HUZA commission: {formatRwf(huza)}</p>
                      <p className="font-semibold">Farmer receives: {formatRwf(farmer)}</p>
                    </>
                  );
                })()}
              </div>
              <div className="mt-auto flex flex-wrap gap-2 border-t border-[var(--admin-line)] pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={busy === settlePo.id}
                  onClick={() =>
                    void poAction(settlePo.id, "settle", {
                      saleAmount: Number(saleAmount) || 0,
                      commissionRate: Number(settleRate) || 0,
                    })
                  }
                >
                  Save calculation
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  disabled={busy === settlePo.id}
                  onClick={() =>
                    void poAction(settlePo.id, "pay", {
                      saleAmount: Number(saleAmount) || 0,
                      commissionRate: Number(settleRate) || 0,
                      paymentMethod: "MTN_MOMO",
                    })
                  }
                >
                  Pay farmer
                </Button>
                <Button type="button" variant="ghost" onClick={() => setSettlePo(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
