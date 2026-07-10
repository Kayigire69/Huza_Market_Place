"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { formatRwf } from "@/lib/utils";

type AnyObj = Record<string, unknown>;

type Tab =
  | "suppliers"
  | "procurement"
  | "orders"
  | "delivery"
  | "payments"
  | "reviews"
  | "inventory"
  | "hours"
  | "promos"
  | "reports"
  | "audit";

export function AdminClient(props: {
  pendingSuppliers: AnyObj[];
  allSuppliers: AnyObj[];
  orders: AnyObj[];
  deliveries: AnyObj[];
  payments: AnyObj[];
  reviews: AnyObj[];
  lowStock: AnyObj[];
  topProducts: AnyObj[];
  promotions: AnyObj[];
  businessHours: AnyObj[];
  holidays: AnyObj[];
  emergency: AnyObj[];
  deliveryPeople: { id: string; fullName: string; phone: string }[];
  auditLogs: AnyObj[];
  procurementOffers: AnyObj[];
  purchaseOrders: AnyObj[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("procurement");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const hash = window.location.hash.replace("#", "") as Tab;
    const valid: Tab[] = [
      "suppliers",
      "procurement",
      "orders",
      "delivery",
      "payments",
      "reviews",
      "inventory",
      "hours",
      "promos",
      "reports",
      "audit",
    ];
    if (valid.includes(hash)) setTab(hash);
  }, []);

  const refresh = () => router.refresh();

  const selectTab = (t: Tab) => {
    setTab(t);
    window.history.replaceState(null, "", `#${t}`);
  };

  const supplierAction = async (
    id: string,
    action: string,
    reason?: string,
    extra?: { adminNotes?: string; inspectionScheduledAt?: string }
  ) => {
    const res = await fetch("/api/admin/suppliers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, reason, ...extra }),
    });
    setMsg(res.ok ? `Supplier ${action}` : "Action failed");
    refresh();
  };

  const offerAction = async (
    offerId: string,
    action: "accept" | "reject" | "purchase",
    extra?: {
      retailPrice?: number;
      purchasedQty?: number;
      negotiatedPrice?: number;
      adminNote?: string;
    }
  ) => {
    const res = await fetch("/api/admin/procurement", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offerId, action, ...extra }),
    });
    const data = await res.json();
    setMsg(res.ok ? `Offer ${action} OK` : data.error || "Failed");
    refresh();
  };

  const poAction = async (poId: string, poAction: string, extra?: Record<string, string>) => {
    const res = await fetch("/api/admin/procurement", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ poId, poAction, ...extra }),
    });
    const data = await res.json();
    setMsg(res.ok ? `PO ${poAction} OK` : data.error || "Failed");
    refresh();
  };

  const updateOrder = async (id: string, status: string) => {
    await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    refresh();
  };

  const assignDelivery = async (deliveryId: string, deliveryPersonId: string) => {
    await fetch("/api/admin/deliveries", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deliveryId, deliveryPersonId, status: "OUT_FOR_DELIVERY" }),
    });
    refresh();
  };

  const paymentAction = async (id: string, action: string) => {
    await fetch("/api/admin/payments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    refresh();
  };

  const reviewAction = async (id: string, action: string) => {
    await fetch("/api/admin/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    refresh();
  };

  const createPromo = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await fetch("/api/admin/promotions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: form.get("code"),
        titleEn: form.get("titleEn"),
        titleFr: form.get("titleEn"),
        titleRw: form.get("titleEn"),
        discountPct: Number(form.get("discountPct")) || null,
        freeDelivery: form.get("freeDelivery") === "on",
        isFlashSale: form.get("isFlashSale") === "on",
      }),
    });
    (e.target as HTMLFormElement).reset();
    refresh();
  };

  const setEmergency = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await fetch("/api/admin/hours", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "emergency", reason: form.get("reason") }),
    });
    refresh();
  };

  const tabs = [
    "procurement",
    "suppliers",
    "orders",
    "delivery",
    "payments",
    "reviews",
    "inventory",
    "hours",
    "promos",
    "reports",
    "audit",
  ] as const;

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((t) => (
          <button
            key={t}
            id={t}
            onClick={() => selectTab(t)}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold capitalize ${
              tab === t ? "bg-[var(--huza-green)] text-white" : "bg-white border border-[var(--huza-line)]"
            }`}
          >
            {t === "suppliers" ? "Verification" : t === "procurement" ? "Procurement" : t}
          </button>
        ))}
      </div>
      {msg && <p className="mb-4 text-sm text-[var(--huza-green-dark)]">{msg}</p>}

      {tab === "procurement" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[var(--huza-line)] bg-white p-5 space-y-3">
            <h2 className="font-semibold mb-1">Procurement Management</h2>
            <p className="text-sm text-[var(--huza-muted)] mb-4">
              Review farm offers, negotiate wholesale price, purchase into Huza stock, then manage
              purchase orders (receive, inspect, pay).
            </p>
            {(props.procurementOffers || []).length === 0 ? (
              <p className="text-sm text-[var(--huza-muted)]">No offers yet.</p>
            ) : (
              props.procurementOffers.map((o) => {
                const supplier = o.supplier as { businessName?: string };
                return (
                  <div key={String(o.id)} className="rounded-xl border border-[var(--huza-line)] p-4">
                    <div className="flex flex-wrap justify-between gap-2">
                      <div>
                        <p className="font-semibold">{String(o.title)}</p>
                        <p className="text-sm text-[var(--huza-muted)]">
                          {supplier?.businessName} · {String(o.quantityOffered)} {String(o.unit)} · Ask{" "}
                          {formatRwf(Number(o.askPrice))}/{String(o.unit).toLowerCase()}
                          {o.suggestedRetail
                            ? ` · Suggested retail ${formatRwf(Number(o.suggestedRetail))}`
                            : ""}
                        </p>
                      </div>
                      <span className="text-xs rounded-full bg-[var(--huza-mint)] px-2 py-1 h-fit">
                        {String(o.status)}
                      </span>
                    </div>
                    {o.description ? (
                      <p className="text-sm text-[var(--huza-muted)] mt-2">{String(o.description)}</p>
                    ) : null}
                    {(o.status === "PENDING" || o.status === "ACCEPTED") && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {o.status === "PENDING" && (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => offerAction(String(o.id), "accept")}>
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() =>
                                offerAction(String(o.id), "reject", { adminNote: "Not needed now" })
                              }
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          onClick={() => {
                            const wholesale = window.prompt(
                              "Negotiated wholesale price (RWF per unit)",
                              String(o.askPrice)
                            );
                            if (!wholesale) return;
                            const retail = window.prompt(
                              "Huza retail price (RWF per unit)",
                              String(o.suggestedRetail || Math.round(Number(wholesale) * 1.25))
                            );
                            if (!retail) return;
                            offerAction(String(o.id), "purchase", {
                              negotiatedPrice: Number(wholesale),
                              retailPrice: Number(retail),
                              purchasedQty: Number(o.quantityOffered),
                            });
                          }}
                        >
                          Create PO &amp; stock
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="rounded-2xl border border-[var(--huza-line)] bg-white p-5 space-y-3">
            <h2 className="font-semibold mb-1">Purchase orders</h2>
            <p className="text-sm text-[var(--huza-muted)] mb-4">
              Record receipt, quality inspection, and supplier payment.
            </p>
            {(props.purchaseOrders || []).length === 0 ? (
              <p className="text-sm text-[var(--huza-muted)]">No purchase orders yet.</p>
            ) : (
              props.purchaseOrders.map((po) => {
                const supplier = po.supplier as { businessName?: string };
                return (
                  <div key={String(po.id)} className="rounded-xl border border-[var(--huza-line)] p-4">
                    <div className="flex flex-wrap justify-between gap-2">
                      <div>
                        <p className="font-semibold">
                          {String(po.poNumber)} · {String(po.productName)}
                        </p>
                        <p className="text-sm text-[var(--huza-muted)]">
                          {supplier?.businessName} · {String(po.quantity)} {String(po.unit)} ·{" "}
                          {formatRwf(Number(po.negotiatedPrice))}/unit · Total{" "}
                          {formatRwf(Number(po.totalAmount))}
                        </p>
                      </div>
                      <span className="text-xs rounded-full bg-[var(--huza-mint)] px-2 py-1 h-fit">
                        {String(po.status)}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {po.status !== "PAID" && po.status !== "CANCELLED" && po.status !== "REJECTED" && (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => poAction(String(po.id), "receive")}>
                            Mark received
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              poAction(String(po.id), "inspect_accept", {
                                qualityNotes: "Passed inspection",
                              })
                            }
                          >
                            Inspect OK
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => {
                              const reason = window.prompt("Rejection reason", "Quality below standard");
                              if (!reason) return;
                              poAction(String(po.id), "inspect_reject", { rejectionReason: reason });
                            }}
                          >
                            Reject delivery
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              const ref = window.prompt("Payment reference", `PAY-${String(po.poNumber)}`);
                              if (!ref) return;
                              poAction(String(po.id), "pay", {
                                paymentRef: ref,
                                paymentMethod: "MTN_MOMO",
                              });
                            }}
                          >
                            Record payment
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {tab === "suppliers" && (
        <div className="space-y-6">
          <section className="rounded-2xl border border-[var(--huza-line)] bg-white p-5">
            <h2 className="font-semibold mb-1">Supplier Verification &amp; Approval</h2>
            <p className="text-sm text-[var(--huza-muted)] mb-4">
              Review documents, request more info, schedule farm inspection, then approve or reject.
            </p>
            {props.pendingSuppliers.length === 0 ? (
              <p className="text-sm text-[var(--huza-muted)]">No pending requests.</p>
            ) : (
              props.pendingSuppliers.map((s) => (
                <div key={String(s.id)} className="border-b border-[var(--huza-line)] py-4 space-y-2">
                  <p className="font-medium">{String(s.businessName)}</p>
                  <p className="text-sm text-[var(--huza-muted)]">
                    {(s.user as { fullName?: string })?.fullName} · {String(s.location)}
                    {s.sector ? `, ${String(s.sector)}` : ""} · {String(s.district)} · {String(s.phone)}
                  </p>
                  <p className="text-xs text-[var(--huza-muted)]">
                    ID: {String(s.nationalId || "—")} · Categories: {String(s.productCategories || "—")} ·
                    MoMo: {String(s.paymentMomo || "—")}
                  </p>
                  <div className="flex flex-wrap gap-3 text-xs">
                    {s.nationalIdUrl ? (
                      <a href={String(s.nationalIdUrl)} target="_blank" rel="noreferrer" className="text-[var(--huza-green)] underline">
                        National ID
                      </a>
                    ) : null}
                    {s.businessCertUrl ? (
                      <a href={String(s.businessCertUrl)} target="_blank" rel="noreferrer" className="text-[var(--huza-green)] underline">
                        Business cert
                      </a>
                    ) : null}
                    {s.foodSafetyUrl ? (
                      <a href={String(s.foodSafetyUrl)} target="_blank" rel="noreferrer" className="text-[var(--huza-green)] underline">
                        Food safety
                      </a>
                    ) : null}
                    {s.organicCertUrl ? (
                      <a href={String(s.organicCertUrl)} target="_blank" rel="noreferrer" className="text-[var(--huza-green)] underline">
                        Organic cert
                      </a>
                    ) : null}
                  </div>
                  {s.adminNotes ? (
                    <p className="text-xs text-[var(--huza-muted)]">Admin notes: {String(s.adminNotes)}</p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => supplierAction(String(s.id), "approve")}>
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const note = window.prompt(
                          "What additional info do you need?",
                          "Please upload National ID and farm photos"
                        );
                        if (!note) return;
                        supplierAction(String(s.id), "request_info", note, { adminNotes: note });
                      }}
                    >
                      Request info
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const when = window.prompt(
                          "Inspection date/time (ISO or local)",
                          new Date(Date.now() + 86400000).toISOString().slice(0, 16)
                        );
                        if (!when) return;
                        supplierAction(String(s.id), "schedule_inspection", undefined, {
                          inspectionScheduledAt: new Date(when).toISOString(),
                        });
                      }}
                    >
                      Schedule inspection
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        const reason = window.prompt("Rejection reason", "Documents incomplete");
                        if (!reason) return;
                        supplierAction(String(s.id), "reject", reason);
                      }}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))
            )}
          </section>
          <section className="rounded-2xl border border-[var(--huza-line)] bg-white p-5">
            <h2 className="font-semibold mb-4">All suppliers</h2>
            <div className="space-y-2">
              {props.allSuppliers.map((s) => (
                <div
                  key={String(s.id)}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--huza-line)] p-3"
                >
                  <div>
                    <p className="font-medium">
                      {String(s.businessName)}
                      {s.isVerified ? (
                        <span className="ml-2 text-[10px] uppercase text-[var(--huza-green)] font-bold">
                          Verified
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-[var(--huza-muted)]">
                      {String(s.status)} · {(s._count as { products?: number })?.products ?? 0} products
                      {s.inspectionScheduledAt
                        ? ` · Inspection ${new Date(String(s.inspectionScheduledAt)).toLocaleDateString()}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => supplierAction(String(s.id), "suspend")}>
                      Suspend
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => supplierAction(String(s.id), "remove")}>
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {tab === "orders" && (
        <div className="rounded-2xl border border-[var(--huza-line)] bg-white p-5 space-y-3">
          <h2 className="font-semibold mb-2">Order management</h2>
          {props.orders.map((o) => (
            <div key={String(o.id)} className="rounded-xl border border-[var(--huza-line)] p-3">
              <div className="flex flex-wrap justify-between gap-2">
                <p className="font-semibold">{String(o.orderNumber)}</p>
                <span className="text-xs bg-[var(--huza-mint)] px-2 py-1 rounded-full">{String(o.status)}</span>
              </div>
              <p className="text-sm text-[var(--huza-muted)]">
                {formatRwf(Number(o.total))} · {String(o.deliveryZone)} ·{" "}
                {String(o.guestName || "Account order")}
              </p>
              <select
                className="input-field mt-2 max-w-xs"
                defaultValue={String(o.status)}
                onChange={(e) => updateOrder(String(o.id), e.target.value)}
              >
                {[
                  "PENDING",
                  "CONFIRMED",
                  "PREPARING",
                  "READY_FOR_PICKUP",
                  "OUT_FOR_DELIVERY",
                  "DELIVERED",
                  "CANCELLED",
                ].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      {tab === "delivery" && (
        <div className="rounded-2xl border border-[var(--huza-line)] bg-white p-5 space-y-3">
          <h2 className="font-semibold mb-2">Delivery management</h2>
          <p className="text-sm text-[var(--huza-muted)] mb-4">
            Youth Huza delivers directly — assign your delivery personnel here.
          </p>
          {props.deliveries.map((d) => {
            const order = d.order as { orderNumber?: string; deliveryAddress?: string };
            return (
              <div key={String(d.id)} className="rounded-xl border border-[var(--huza-line)] p-3">
                <p className="font-semibold">{order?.orderNumber}</p>
                <p className="text-sm text-[var(--huza-muted)]">{order?.deliveryAddress}</p>
                <p className="text-xs mt-1">Status: {String(d.status)}</p>
                <select
                  className="input-field mt-2 max-w-xs"
                  defaultValue={String(d.deliveryPersonId || "")}
                  onChange={(e) => assignDelivery(String(d.id), e.target.value)}
                >
                  <option value="">Assign delivery person</option>
                  {props.deliveryPeople.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({p.phone})
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      )}

      {tab === "payments" && (
        <div className="rounded-2xl border border-[var(--huza-line)] bg-white p-5 space-y-3">
          <h2 className="font-semibold mb-2">Payment management</h2>
          {props.payments.map((p) => (
            <div key={String(p.id)} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--huza-line)] p-3">
              <div>
                <p className="font-medium">
                  {(p.order as { orderNumber?: string })?.orderNumber} · {String(p.method)}
                </p>
                <p className="text-sm text-[var(--huza-muted)]">
                  {formatRwf(Number(p.amount))} · {String(p.status)} · {String(p.phoneNumber)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => paymentAction(String(p.id), "confirm")}>
                  Confirm
                </Button>
                <Button size="sm" variant="ghost" onClick={() => paymentAction(String(p.id), "refund")}>
                  Refund
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "reviews" && (
        <div className="rounded-2xl border border-[var(--huza-line)] bg-white p-5 space-y-3">
          <h2 className="font-semibold mb-2">Reviews & ratings</h2>
          <p className="text-sm text-[var(--huza-muted)]">Bad comments can be deleted or hidden.</p>
          {props.reviews.map((r) => (
            <div key={String(r.id)} className="rounded-xl border border-[var(--huza-line)] p-3">
              <p className="font-medium">
                {(r.user as { fullName?: string })?.fullName} · {"★".repeat(Number(r.rating))}
                {r.isReported ? " · REPORTED" : ""}
                {r.isHidden ? " · HIDDEN" : ""}
              </p>
              <p className="text-sm text-[var(--huza-muted)]">{String(r.comment || "")}</p>
              <div className="mt-2 flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => reviewAction(String(r.id), "hide")}>
                  Hide
                </Button>
                <Button size="sm" variant="danger" onClick={() => reviewAction(String(r.id), "delete")}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "inventory" && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-[var(--huza-line)] bg-white p-5">
            <h2 className="font-semibold mb-3">Low-stock products</h2>
            {props.lowStock.map((p) => (
              <p key={String(p.id)} className="text-sm border-b border-[var(--huza-line)] py-2">
                {String(p.nameEn)} — {String(p.stockQty)} left
              </p>
            ))}
          </div>
          <div className="rounded-2xl border border-[var(--huza-line)] bg-white p-5">
            <h2 className="font-semibold mb-3">Top-selling products</h2>
            {props.topProducts.map((p) => (
              <p key={String(p.id)} className="text-sm border-b border-[var(--huza-line)] py-2">
                {String(p.nameEn)} · ★ {Number(p.ratingAvg).toFixed(1)}
              </p>
            ))}
          </div>
        </div>
      )}

      {tab === "hours" && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-[var(--huza-line)] bg-white p-5">
            <h2 className="font-semibold mb-3">Business hours (default 6:00–21:00)</h2>
            {props.businessHours.map((h) => (
              <p key={String(h.id)} className="text-sm py-1">
                Day {String(h.dayOfWeek)}: {String(h.openHour)}:00 – {String(h.closeHour)}:00
                {h.isClosed ? " (closed)" : ""}
              </p>
            ))}
          </div>
          <form onSubmit={setEmergency} className="rounded-2xl border border-[var(--huza-line)] bg-white p-5 space-y-3">
            <h2 className="font-semibold">Emergency closure</h2>
            {props.emergency.length > 0 && (
              <p className="text-sm text-red-700">
                Active: {String((props.emergency[0] as { reason?: string }).reason)}
              </p>
            )}
            <input name="reason" placeholder="Reason" className="input-field" required />
            <Button type="submit">Activate emergency closure</Button>
          </form>
        </div>
      )}

      {tab === "promos" && (
        <div className="grid md:grid-cols-2 gap-4">
          <form onSubmit={createPromo} className="rounded-2xl border border-[var(--huza-line)] bg-white p-5 space-y-3">
            <h2 className="font-semibold">Create promotion</h2>
            <input name="code" placeholder="Code (optional)" className="input-field" />
            <input name="titleEn" placeholder="Title" className="input-field" required />
            <input name="discountPct" type="number" placeholder="Discount %" className="input-field" />
            <label className="flex gap-2 text-sm">
              <input type="checkbox" name="freeDelivery" /> Free delivery
            </label>
            <label className="flex gap-2 text-sm">
              <input type="checkbox" name="isFlashSale" /> Flash sale
            </label>
            <Button type="submit">Create</Button>
          </form>
          <div className="rounded-2xl border border-[var(--huza-line)] bg-white p-5">
            <h2 className="font-semibold mb-3">Active promotions</h2>
            {props.promotions.map((p) => (
              <p key={String(p.id)} className="text-sm border-b border-[var(--huza-line)] py-2">
                {String(p.titleEn)} {p.code ? `(${String(p.code)})` : ""} ·{" "}
                {p.isActive ? "Active" : "Off"}
              </p>
            ))}
          </div>
        </div>
      )}

      {tab === "reports" && (
        <div className="rounded-2xl border border-[var(--huza-line)] bg-white p-5 space-y-4">
          <h2 className="font-semibold">Reports & analytics</h2>
          <p className="text-sm text-[var(--huza-muted)]">
            Snapshot of platform performance. Expand with date-range exports as you grow.
          </p>
          <ul className="text-sm space-y-2">
            <li>Total orders: {props.orders.length}+ (latest page)</li>
            <li>
              Confirmed revenue (non-cancelled): see dashboard revenue card above
            </li>
            <li>Supplier count: {props.allSuppliers.length}</li>
            <li>Low-stock SKUs: {props.lowStock.length}</li>
            <li>Deliveries tracked: {props.deliveries.length}</li>
            <li>Payments recorded: {props.payments.length}</li>
          </ul>
        </div>
      )}

      {tab === "audit" && (
        <div className="rounded-2xl border border-[var(--huza-line)] bg-white p-5 space-y-3">
          <h2 className="font-semibold mb-2">Admin audit logs</h2>
          <p className="text-sm text-[var(--huza-muted)] mb-3">
            Track who approved suppliers, changed orders, and other admin actions.
          </p>
          {(props.auditLogs || []).length === 0 ? (
            <p className="text-sm text-[var(--huza-muted)]">No audit events yet.</p>
          ) : (
            props.auditLogs.map((log) => (
              <div key={String(log.id)} className="rounded-xl border border-[var(--huza-line)] p-3 text-sm">
                <p className="font-medium">
                  {String(log.action)} · {String(log.entity)}
                  {log.entityId ? ` #${String(log.entityId).slice(0, 8)}` : ""}
                </p>
                <p className="text-[var(--huza-muted)]">
                  {String(log.actorName || "System")} — {String(log.details || "")}
                </p>
                <p className="text-xs text-[var(--huza-muted)] mt-1">
                  {new Date(String(log.createdAt)).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
