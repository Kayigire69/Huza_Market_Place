"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/lib/locale-context";
import { formatRwf, formatUnit } from "@/lib/utils";

type Offer = {
  id: string;
  title: string;
  description: string | null;
  unit: string;
  quantityOffered: number;
  askPrice: number;
  suggestedRetail: number | null;
  status: string;
  supplier: { id: string; businessName: string };
  category: { nameEn: string } | null;
};

type PO = {
  id: string;
  poNumber: string;
  status: string;
  productName: string;
  quantity: number;
  unit: string;
  negotiatedPrice: number;
  totalAmount: number;
  paymentRef: string | null;
  supplier: { id: string; businessName: string };
};

type SupplierOpt = { id: string; businessName: string; phone: string; district: string };

type CompareGroup = {
  title: string;
  unit: string;
  offers: { id: string; askPrice: number; supplierName: string; qty: number }[];
};

type Msg = {
  id: string;
  supplierId: string;
  senderRole: string;
  senderName: string;
  body: string;
  createdAt: string | Date;
  supplier: { businessName: string };
};

export function ProcurementClient({
  pendingOffers,
  purchaseOrders,
  suppliers,
  compareGroups,
  messages,
}: {
  pendingOffers: Offer[];
  purchaseOrders: PO[];
  suppliers: SupplierOpt[];
  compareGroups: CompareGroup[];
  messages: Msg[];
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [threadSupplierId, setThreadSupplierId] = useState(suppliers[0]?.id || "");

  const refresh = () => router.refresh();

  const offerAction = async (
    offerId: string,
    action: "accept" | "reject" | "purchase",
    extra?: Record<string, unknown>
  ) => {
    setLoading(true);
    const res = await fetch("/api/admin/procurement", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offerId, action, ...extra }),
    });
    const data = await res.json();
    setLoading(false);
    setMsg(res.ok ? `Offer ${action} OK` : data.error || "Failed");
    if (res.ok) refresh();
  };

  const poAction = async (poId: string, poAction: string, extra?: Record<string, string>) => {
    setLoading(true);
    const res = await fetch("/api/admin/procurement", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ poId, poAction, ...extra }),
    });
    const data = await res.json();
    setLoading(false);
    setMsg(res.ok ? `PO ${poAction} OK` : data.error || "Failed");
    if (res.ok) refresh();
  };

  const createPo = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setLoading(true);
    const res = await fetch("/api/admin/procurement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        supplierId: form.get("supplierId"),
        productName: form.get("productName"),
        quantity: Number(form.get("quantity")),
        unit: form.get("unit") || "KG",
        negotiatedPrice: Number(form.get("negotiatedPrice")),
        retailPrice: form.get("retailPrice") ? Number(form.get("retailPrice")) : undefined,
        notes: form.get("notes") || undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);
    setMsg(res.ok ? `Created ${data.poNumber}` : data.error || "Failed");
    if (res.ok) {
      (e.target as HTMLFormElement).reset();
      refresh();
    }
  };

  const sendMessage = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setLoading(true);
    const res = await fetch("/api/procurement/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        supplierId: form.get("supplierId"),
        body: form.get("body"),
      }),
    });
    const data = await res.json();
    setLoading(false);
    setMsg(res.ok ? "Message sent" : data.error || "Failed");
    if (res.ok) {
      (e.target as HTMLFormElement).reset();
      refresh();
    }
  };

  const threadMessages = messages.filter((m) => m.supplierId === threadSupplierId);

  return (
    <div className="space-y-8">
      {msg && <p className="text-sm text-[var(--huza-green-dark)]">{msg}</p>}

      <section className="rounded-2xl border border-[var(--huza-line)] bg-white p-5 space-y-3">
        <h2 className="font-semibold text-[var(--huza-green-dark)]">Pending offers</h2>
        <p className="text-sm text-[var(--huza-muted)] mb-2">
          Accept, reject, or purchase into Huza stock via PO.
        </p>
        {pendingOffers.length === 0 ? (
          <p className="text-sm text-[var(--huza-muted)]">No pending offers.</p>
        ) : (
          pendingOffers.map((o) => (
            <div key={o.id} className="rounded-xl border border-[var(--huza-line)] p-4">
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <p className="font-semibold">{o.title}</p>
                  <p className="text-sm text-[var(--huza-muted)]">
                    {o.supplier.businessName} · {o.quantityOffered} {formatUnit(o.unit)} · Ask{" "}
                    {formatRwf(o.askPrice)}/{formatUnit(o.unit)}
                    {o.suggestedRetail
                      ? ` · Suggested retail ${formatRwf(o.suggestedRetail)}`
                      : ""}
                  </p>
                </div>
                <span className="text-xs rounded-full bg-[var(--huza-mint)] px-2 py-1 h-fit">
                  {o.status}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {o.status === "PENDING" && (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={loading}
                      onClick={() => offerAction(o.id, "accept")}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={loading}
                      onClick={() =>
                        offerAction(o.id, "reject", { adminNote: "Not needed now" })
                      }
                    >
                      Reject
                    </Button>
                  </>
                )}
                <Button
                  size="sm"
                  disabled={loading}
                  onClick={() => {
                    const wholesale = window.prompt(
                      "Negotiated wholesale (RWF/unit)",
                      String(o.askPrice)
                    );
                    if (!wholesale) return;
                    const retail = window.prompt(
                      "Huza retail (RWF/unit)",
                      String(o.suggestedRetail || Math.round(Number(wholesale) * 1.25))
                    );
                    if (!retail) return;
                    offerAction(o.id, "purchase", {
                      negotiatedPrice: Number(wholesale),
                      retailPrice: Number(retail),
                      purchasedQty: o.quantityOffered,
                    });
                  }}
                >
                  Create PO &amp; stock
                </Button>
              </div>
            </div>
          ))
        )}
      </section>

      <section className="rounded-2xl border border-[var(--huza-line)] bg-white p-5">
        <h2 className="font-semibold text-[var(--huza-green-dark)]">Compare ask prices</h2>
        <p className="text-sm text-[var(--huza-muted)] mt-1 mb-4">
          Same product title from multiple farmers.
        </p>
        {compareGroups.length === 0 ? (
          <p className="text-sm text-[var(--huza-muted)]">No overlapping offers to compare.</p>
        ) : (
          <ul className="space-y-4">
            {compareGroups.map((g) => (
              <li key={`${g.title}-${g.unit}`}>
                <p className="font-medium">
                  {g.title} ({formatUnit(g.unit)})
                </p>
                <ul className="mt-2 text-sm space-y-1">
                  {[...g.offers]
                    .sort((a, b) => a.askPrice - b.askPrice)
                    .map((o) => (
                      <li key={o.id} className="flex justify-between gap-2 text-[var(--huza-muted)]">
                        <span>{o.supplierName} · {o.qty} {formatUnit(g.unit)}</span>
                        <span className="font-semibold text-[var(--huza-green-dark)]">
                          {formatRwf(o.askPrice)}
                        </span>
                      </li>
                    ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-[var(--huza-line)] bg-white p-5">
        <h2 className="font-semibold text-[var(--huza-green-dark)] mb-1">Create purchase order</h2>
        <p className="text-sm text-[var(--huza-muted)] mb-4">Draft a PO without an offer.</p>
        <form onSubmit={createPo} className="grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="label">{t("farmer")}</label>
            <select name="supplierId" className="input-field" required>
              <option value="">Select</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.businessName} ({s.district})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Product name</label>
            <input name="productName" className="input-field" required />
          </div>
          <div>
            <label className="label">Unit</label>
            <select name="unit" className="input-field" defaultValue="KG">
              {["KG", "PIECE", "BUNCH", "LITRE", "PACK", "DOZEN"].map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Quantity</label>
            <input name="quantity" type="number" min={0.1} step="0.1" className="input-field" required />
          </div>
          <div>
            <label className="label">Negotiated price (RWF)</label>
            <input name="negotiatedPrice" type="number" min={1} className="input-field" required />
          </div>
          <div>
            <label className="label">Retail price (optional)</label>
            <input name="retailPrice" type="number" min={1} className="input-field" />
          </div>
          <div>
            <label className="label">Notes</label>
            <input name="notes" className="input-field" />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={loading}>
              Create PO
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-[var(--huza-line)] bg-white p-5 space-y-3">
        <h2 className="font-semibold text-[var(--huza-green-dark)]">Purchase orders</h2>
        {purchaseOrders.length === 0 ? (
          <p className="text-sm text-[var(--huza-muted)]">No POs yet.</p>
        ) : (
          purchaseOrders.map((po) => (
            <div key={po.id} className="rounded-xl border border-[var(--huza-line)] p-4">
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <p className="font-semibold">
                    {po.poNumber} · {po.productName}
                  </p>
                  <p className="text-sm text-[var(--huza-muted)]">
                    {po.supplier.businessName} · {po.quantity} {formatUnit(po.unit)} ·{" "}
                    {formatRwf(po.negotiatedPrice)}/unit · Total {formatRwf(po.totalAmount)}
                  </p>
                </div>
                <span className="text-xs rounded-full bg-[var(--huza-mint)] px-2 py-1 h-fit">
                  {po.status}
                </span>
              </div>
              {po.status !== "PAID" && po.status !== "CANCELLED" && po.status !== "REJECTED" && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={loading}
                    onClick={() => poAction(po.id, "receive")}
                  >
                    Mark received
                  </Button>
                  <Button
                    size="sm"
                    disabled={loading}
                    onClick={() => {
                      const ref = window.prompt("Payment reference", `PAY-${po.poNumber}`);
                      if (!ref) return;
                      poAction(po.id, "pay", {
                        paymentRef: ref,
                        paymentMethod: "MTN_MOMO",
                      });
                    }}
                  >
                    Record payment
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </section>

      <section className="rounded-2xl border border-[var(--huza-line)] bg-white p-5">
        <h2 className="font-semibold text-[var(--huza-green-dark)]">{t("messageFarmers")}</h2>
        <p className="text-sm text-[var(--huza-muted)] mt-1 mb-4">
          Send procurement notes to verified farms.
        </p>
        <div className="mb-3">
          <label className="label">{t("farmerThread")}</label>
          <select
            className="input-field"
            value={threadSupplierId}
            onChange={(e) => setThreadSupplierId(e.target.value)}
          >
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.businessName}
              </option>
            ))}
          </select>
        </div>
        <ul className="mb-4 max-h-48 overflow-y-auto space-y-2 text-sm border border-[var(--huza-line)] rounded-xl p-3 bg-[var(--huza-mint)]/20">
          {threadMessages.length === 0 ? (
            <li className="text-[var(--huza-muted)]">No messages yet.</li>
          ) : (
            threadMessages.map((m) => (
              <li key={m.id}>
                <span className="font-medium">{m.senderName}</span>{" "}
                <span className="text-xs text-[var(--huza-muted)]">
                  ({m.senderRole}) · {new Date(m.createdAt).toLocaleString()}
                </span>
                <p>{m.body}</p>
              </li>
            ))
          )}
        </ul>
        <form onSubmit={sendMessage} className="space-y-3">
          <input type="hidden" name="supplierId" value={threadSupplierId} />
          <textarea
            name="body"
            className="input-field min-h-24"
            placeholder={t("messageToFarmer")}
            required
          />
          <Button type="submit" size="sm" disabled={loading || !threadSupplierId}>
            Send message
          </Button>
        </form>
      </section>
    </div>
  );
}
