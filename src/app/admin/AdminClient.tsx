"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { formatRwf } from "@/lib/utils";

type AnyObj = Record<string, unknown>;

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
}) {
  const router = useRouter();
  const [tab, setTab] = useState<
    | "suppliers"
    | "orders"
    | "delivery"
    | "payments"
    | "reviews"
    | "inventory"
    | "hours"
    | "promos"
    | "reports"
    | "audit"
  >("suppliers");
  const [msg, setMsg] = useState("");

  const refresh = () => router.refresh();

  const supplierAction = async (id: string, action: string, reason?: string) => {
    const res = await fetch("/api/admin/suppliers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, reason }),
    });
    setMsg(res.ok ? `Supplier ${action}` : "Action failed");
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
            onClick={() => setTab(t)}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold capitalize ${
              tab === t ? "bg-[var(--huza-green)] text-white" : "bg-white border border-[var(--huza-line)]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      {msg && <p className="mb-4 text-sm text-[var(--huza-green-dark)]">{msg}</p>}

      {tab === "suppliers" && (
        <div className="space-y-6">
          <section className="rounded-2xl border border-[var(--huza-line)] bg-white p-5">
            <h2 className="font-semibold mb-4">Pending supplier applications</h2>
            {props.pendingSuppliers.length === 0 ? (
              <p className="text-sm text-[var(--huza-muted)]">No pending requests.</p>
            ) : (
              props.pendingSuppliers.map((s) => (
                <div key={String(s.id)} className="border-b border-[var(--huza-line)] py-3">
                  <p className="font-medium">{String(s.businessName)}</p>
                  <p className="text-sm text-[var(--huza-muted)]">
                    {(s.user as { fullName?: string })?.fullName} · {String(s.location)} ·{" "}
                    {String(s.phone)}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" onClick={() => supplierAction(String(s.id), "approve")}>
                      Approve
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => supplierAction(String(s.id), "reject", "Documents incomplete")}>
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
                <div key={String(s.id)} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--huza-line)] p-3">
                  <div>
                    <p className="font-medium">{String(s.businessName)}</p>
                    <p className="text-xs text-[var(--huza-muted)]">
                      {String(s.status)} · {(s._count as { products?: number })?.products ?? 0} products
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
                {String(p.nameEn)} — {String(p.stockQty)} left (
                {(p.supplier as { businessName?: string })?.businessName})
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
