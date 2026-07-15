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
  supplier?: { businessName?: string } | null;
};

type PO = {
  id: string;
  poNumber: string;
  status: string;
  quantity: number;
  negotiatedPrice: number;
  totalAmount?: number;
  retailPrice?: number | null;
  productName?: string;
  productId?: string | null;
  qualityNotes?: string | null;
  supplier?: { businessName?: string } | null;
  offer?: { title?: string } | null;
};

const PIPELINE = [
  { step: "1", label: "Approve", href: "/admin/approvals" },
  { step: "2", label: "Purchase request", href: "/admin/procurement/requests" },
  { step: "3", label: "Purchase order", href: "/admin/procurement/orders" },
  { step: "4", label: "Receive & inspect", href: "/admin/procurement/orders" },
  { step: "5", label: "Goods received", href: "/admin/procurement/received" },
  { step: "6", label: "Live in shop", href: "/admin/products" },
];

function statusTone(status: string) {
  if (status === "PAID" || status === "INSPECTED" || status === "ACCEPTED")
    return "admin-status admin-status-ok";
  if (status === "REJECTED" || status === "CANCELLED") return "admin-status admin-status-muted";
  return "admin-status admin-status-warn";
}

export function AdminProcurementClient({
  view,
}: {
  view: "requests" | "orders" | "received";
}) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [orders, setOrders] = useState<PO[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [buying, setBuying] = useState<Offer | null>(null);
  const [buyForm, setBuyForm] = useState({ wholesale: "", retail: "", qty: "" });
  const [receivePo, setReceivePo] = useState<PO | null>(null);
  const [expiryDate, setExpiryDate] = useState("");

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
          ? `PO created — await farmer delivery, then receive & inspect`
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
    poAction: string,
    extra?: Record<string, unknown>
  ) => {
    setBusy(poId);
    try {
      const res = await fetch("/api/admin/procurement", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ poId, poAction, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      if (poAction === "inspect_accept") {
        setMsg("Quality passed — product is now live in the shop");
      } else if (poAction === "receive") {
        setMsg("Goods received into warehouse — inspect quality next");
      } else {
        setMsg("Purchase order updated");
      }
      setReceivePo(null);
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
      negotiatedPrice: Number(buyForm.wholesale),
      retailPrice: Number(buyForm.retail),
      purchasedQty: Number(buyForm.qty) || buying.quantityOffered,
    });
  };

  const title =
    view === "requests"
      ? "Purchase Requests"
      : view === "orders"
        ? "Purchase Orders"
        : "Goods Received";

  const sub =
    view === "requests"
      ? "Accept farm offers, negotiate price, then create a purchase order."
      : view === "orders"
        ? "Receive delivery → quality inspect → publish to shop → pay farmer."
        : "History of received, inspected, and paid purchase orders.";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="admin-panel-title">{title}</h1>
        <p className="admin-panel-sub">{sub}</p>
      </div>

      {/* Pipeline explanation */}
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
                  (view === "requests" && p.step === "2") ||
                  (view === "orders" && (p.step === "3" || p.step === "4")) ||
                  (view === "received" && p.step === "5")
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
          Product Approvals is step 1 for farmer-listed items.{" "}
          <Link href="/admin/approvals" className="font-semibold text-[var(--huza-green-dark)]">
            Open approvals →
          </Link>
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
                          wholesale: String(o.askPrice),
                          retail: String(
                            o.suggestedRetail || Math.round(o.askPrice * 1.25)
                          ),
                          qty: String(o.quantityOffered),
                        });
                      }}
                    >
                      Create purchase order
                    </Button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )
      ) : orders.length === 0 ? (
        <div className="admin-panel p-6 text-sm text-[var(--admin-muted)]">
          No {view === "received" ? "received goods" : "open purchase orders"} yet.
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((po) => (
            <article key={po.id} className="admin-panel p-4">
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <p className="font-mono text-sm font-bold">{po.poNumber}</p>
                  <p className="font-semibold">
                    {po.productName || po.offer?.title || "Purchase order"}
                  </p>
                  <p className="text-sm text-[var(--admin-muted)]">
                    {po.supplier?.businessName} · Qty {po.quantity} ·{" "}
                    {formatRwf(po.negotiatedPrice)}/unit wholesale
                    {po.retailPrice ? ` · retail ${formatRwf(po.retailPrice)}` : ""}
                  </p>
                  {po.qualityNotes ? (
                    <p className="mt-1 text-xs text-[var(--admin-muted)]">QC: {po.qualityNotes}</p>
                  ) : null}
                </div>
                <span className={statusTone(po.status)}>{po.status}</span>
              </div>

              {/* Mini stage indicators */}
              <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-semibold uppercase tracking-wide">
                {["ORDERED", "RECEIVED", "INSPECTED", "PAID"].map((s) => {
                  const order = ["ORDERED", "RECEIVED", "INSPECTED", "PAID"];
                  const cur = order.indexOf(po.status === "ACCEPTED" ? "INSPECTED" : po.status);
                  const idx = order.indexOf(s);
                  const done = cur >= idx && po.status !== "REJECTED" && po.status !== "CANCELLED";
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
                            window.prompt("Rejection reason", "Quality below standard") ||
                            undefined;
                          void poAction(po.id, "inspect_reject", {
                            rejectionReason: reason,
                          });
                        }}
                      >
                        QC reject
                      </Button>
                    </>
                  ) : null}
                  {po.status === "INSPECTED" ? (
                    <Button
                      size="sm"
                      disabled={busy === po.id}
                      onClick={() => void poAction(po.id, "pay")}
                    >
                      Mark farmer paid
                    </Button>
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
            </article>
          ))}
        </div>
      )}

      {buying ? (
        <div className="admin-drawer-backdrop" onClick={() => setBuying(null)}>
          <aside className="admin-drawer" onClick={(e) => e.stopPropagation()} role="dialog">
            <div className="flex items-center justify-between border-b border-[var(--admin-line)] px-5 py-4">
              <h2 className="text-lg font-semibold">Create PO · {buying.title}</h2>
              <button type="button" className="admin-icon-btn" onClick={() => setBuying(null)}>
                <X className="size-4" />
              </button>
            </div>
            <form onSubmit={submitBuy} className="flex flex-1 flex-col gap-4 p-5">
              <p className="text-sm text-[var(--admin-muted)]">
                Creates an <strong>ORDERED</strong> purchase order. Stock stays off the shop until
                you receive delivery and pass QC.
              </p>
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
    </div>
  );
}
