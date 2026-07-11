"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { formatRwf } from "@/lib/utils";
import { AdminCatalogPanel, AdminInventoryPanel } from "./AdminCatalogPanels";
import { AdminOffersPanel } from "./AdminOffersPanel";

type AnyObj = Record<string, unknown>;

type Tab =
  | "overview"
  | "suppliers"
  | "products"
  | "catalog"
  | "inventory"
  | "procurement"
  | "orders"
  | "delivery"
  | "payments"
  | "reviews"
  | "promos"
  | "hours"
  | "reports"
  | "audit";

const WORKSPACES: { title: string; hint: string; tabs: { id: Tab; label: string }[] }[] = [
  {
    title: "Overview",
    hint: "Shared snapshot for every admin on shift",
    tabs: [
      { id: "overview", label: "How to use" },
      { id: "reports", label: "Reports" },
      { id: "audit", label: "Audit log" },
    ],
  },
  {
    title: "Farmers & sourcing",
    hint: "Approve partners and buy stock",
    tabs: [
      { id: "suppliers", label: "Farmer approval" },
      { id: "products", label: "Product review" },
      { id: "procurement", label: "Procurement / POs" },
    ],
  },
  {
    title: "Catalog & warehouse",
    hint: "Prices, stock in/out, listing flags",
    tabs: [
      { id: "catalog", label: "Prices & listings" },
      { id: "inventory", label: "Stock movements" },
    ],
  },
  {
    title: "Customer operations",
    hint: "Orders, drivers, payments, reviews",
    tabs: [
      { id: "orders", label: "Orders" },
      { id: "delivery", label: "Delivery" },
      { id: "payments", label: "Payments" },
      { id: "reviews", label: "Reviews" },
    ],
  },
  {
    title: "Marketing & settings",
    hint: "Homepage offers and shop hours",
    tabs: [
      { id: "promos", label: "Special offers" },
      { id: "hours", label: "Business hours" },
    ],
  },
];

export function AdminClient(props: {
  pendingSuppliers: AnyObj[];
  allSuppliers: AnyObj[];
  pendingFarmerProducts?: AnyObj[];
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
  catalogProducts?: AnyObj[];
  recentMovements?: AnyObj[];
  adminName?: string | null;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const hash = window.location.hash.replace("#", "") as Tab;
    const valid = WORKSPACES.flatMap((w) => w.tabs.map((t) => t.id));
    if (valid.includes(hash)) setTab(hash);
  }, []);

  const refresh = () => router.refresh();
  const done = (message: string) => {
    setMsg(message);
    refresh();
  };

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
    setMsg(res.ok ? `Farmer ${action}` : "Action failed");
    refresh();
  };

  const productReview = async (id: string, action: "approve" | "reject") => {
    const note =
      action === "reject"
        ? window.prompt("Rejection reason", "Quality / field information incomplete") || undefined
        : undefined;
    if (action === "reject" && !note) return;
    const res = await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, note }),
    });
    setMsg(res.ok ? `Product ${action}d` : "Product review failed");
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

  const reviewAction = async (id: string, action: string, adminReply?: string) => {
    await fetch("/api/admin/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, adminReply }),
    });
    refresh();
  };

  const createPromo = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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

  return (
    <div className="grid lg:grid-cols-[240px_1fr] gap-6 items-start">
      <aside className="rounded-2xl border border-[var(--huza-line)] bg-white p-4 sticky top-24 space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--huza-green)]">
            Admin workspaces
          </p>
          <p className="mt-1 text-xs text-[var(--huza-muted)]">
            {props.adminName ? `Signed in as ${props.adminName}` : "Youth Huza staff"} — pick a
            lane so multiple people can work at once.
          </p>
        </div>
        {WORKSPACES.map((group) => (
          <div key={group.title}>
            <p className="text-xs font-semibold text-[var(--huza-ink)]">{group.title}</p>
            <p className="text-[11px] text-[var(--huza-muted)] mb-2">{group.hint}</p>
            <div className="space-y-1">
              {group.tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  id={t.id}
                  onClick={() => selectTab(t.id)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium ${
                    tab === t.id
                      ? "bg-[var(--huza-green)] text-white"
                      : "hover:bg-[var(--huza-mint)] text-[var(--huza-ink)]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        ))}
        <div className="border-t border-[var(--huza-line)] pt-3 space-y-1 text-xs">
          <a href="/warehouse" className="block text-[var(--huza-green)] font-semibold">
            Warehouse portal →
          </a>
          <a href="/procurement" className="block text-[var(--huza-green)] font-semibold">
            Procurement portal →
          </a>
          <a href="/delivery-portal" className="block text-[var(--huza-green)] font-semibold">
            Delivery portal →
          </a>
        </div>
      </aside>

      <div className="min-w-0">
      {msg && (
        <p className="mb-4 rounded-xl bg-[var(--huza-mint)] px-4 py-2 text-sm text-[var(--huza-green-dark)]">
          {msg}
        </p>
      )}

      {tab === "overview" && (
        <div className="rounded-2xl border border-[var(--huza-line)] bg-white p-6 space-y-4">
          <h2 className="font-semibold text-lg">Team playbook</h2>
          <p className="text-sm text-[var(--huza-muted)]">
            Several staff can use admin at the same time. Use the left menu so each person stays in
            their lane — audit log records who did what.
          </p>
          <ul className="text-sm space-y-2 list-disc pl-5 text-[var(--huza-muted)]">
            <li>
              <strong className="text-[var(--huza-ink)]">Farmer approval / product review</strong> —
              verify partners and accept listings before they sell on HUZA FRESH.
            </li>
            <li>
              <strong className="text-[var(--huza-ink)]">Prices &amp; listings</strong> — only Huza
              staff set customer retail prices.
            </li>
            <li>
              <strong className="text-[var(--huza-ink)]">Stock movements</strong> — stock in / out
              here; sales and warehouse receives also write movements automatically.
            </li>
            <li>
              <strong className="text-[var(--huza-ink)]">Special offers</strong> — publish homepage
              cards from Marketing (not hardcoded).
            </li>
            <li>
              <strong className="text-[var(--huza-ink)]">Orders / delivery / payments</strong> —
              day-to-day customer fulfillment.
            </li>
          </ul>
          <div className="grid sm:grid-cols-2 gap-3 pt-2">
            {[
              { id: "catalog" as Tab, label: "Set product prices" },
              { id: "inventory" as Tab, label: "Stock in / out" },
              { id: "promos" as Tab, label: "Post a special offer" },
              { id: "suppliers" as Tab, label: "Review farmers" },
            ].map((q) => (
              <button
                key={q.id}
                type="button"
                onClick={() => selectTab(q.id)}
                className="rounded-xl border border-[var(--huza-line)] px-4 py-3 text-left text-sm font-semibold hover:border-[var(--huza-green)]"
              >
                {q.label} →
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === "catalog" && (
        <AdminCatalogPanel
          products={(props.catalogProducts || []) as never}
          onDone={done}
        />
      )}

      {tab === "inventory" && (
        <AdminInventoryPanel
          products={(props.catalogProducts || props.lowStock || []) as never}
          movements={(props.recentMovements || []) as never}
          onDone={done}
        />
      )}

      {tab === "promos" && (
        <AdminOffersPanel promotions={props.promotions as never} onDone={done} />
      )}

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
              Record receipt, quality inspection, and farmer payment.
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
            <h2 className="font-semibold mb-1">Farmer Approval (Module 10)</h2>
            <p className="text-sm text-[var(--huza-muted)] mb-4">
              Review farmer applications. Organic farms use the full dossier; standard (non-organic)
              farms submit name, ID, products, and the Huza purchase agreement.
            </p>
            {props.pendingSuppliers.length === 0 ? (
              <p className="text-sm text-[var(--huza-muted)]">No pending requests.</p>
            ) : (
              props.pendingSuppliers.map((s) => (
                <div key={String(s.id)} className="border-b border-[var(--huza-line)] py-5 space-y-3">
                  <div className="flex flex-wrap gap-4 items-start">
                    {s.profilePhotoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={String(s.profilePhotoUrl)}
                        alt=""
                        className="h-20 w-20 rounded-full object-cover border border-[var(--huza-line)]"
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-full bg-[var(--huza-mint)]" />
                    )}
                    <div>
                      <p className="font-medium text-lg">{String(s.businessName)}</p>
                      <p className="text-sm text-[var(--huza-muted)]">
                        {(s.user as { fullName?: string })?.fullName} · {String(s.phone)}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-[var(--huza-green-dark)]">
                        Path:{" "}
                        {String(s.farmingType || "ORGANIC") === "STANDARD"
                          ? "Other crops (non-organic)"
                          : "Organic products"}
                      </p>
                    </div>
                  </div>

                  {String(s.farmingType || "ORGANIC") === "STANDARD" && (
                    <div className="rounded-xl bg-[var(--huza-mint)] p-3 text-sm space-y-2">
                      <p>
                        <strong>ID:</strong> {String(s.nationalId || "—")}
                      </p>
                      <p>
                        <strong>Products offered:</strong>{" "}
                        <span className="whitespace-pre-wrap">{String(s.productsOffered || "—")}</span>
                      </p>
                      <p>
                        <strong>Huza purchase agreement:</strong>{" "}
                        <span className="whitespace-pre-wrap">
                          {String(s.huzaPurchaseAgreement || "—")}
                        </span>
                      </p>
                      <p className="text-xs">
                        Terms accepted: {s.agreedToHuzaTerms ? "Yes" : "No"}
                      </p>
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs text-[var(--huza-muted)]">
                    <p>
                      <strong className="text-[var(--huza-ink)]">ID:</strong> {String(s.nationalId || "—")}
                    </p>
                    <p>
                      <strong className="text-[var(--huza-ink)]">Gender:</strong> {String(s.gender || "—")}
                    </p>
                    <p>
                      <strong className="text-[var(--huza-ink)]">Age:</strong> {String(s.ageRange || "—")}
                    </p>
                    <p>
                      <strong className="text-[var(--huza-ink)]">Province:</strong> {String(s.province || "—")}
                    </p>
                    <p>
                      <strong className="text-[var(--huza-ink)]">District:</strong> {String(s.district || "—")}
                    </p>
                    <p>
                      <strong className="text-[var(--huza-ink)]">Sector:</strong> {String(s.sector || "—")}
                    </p>
                    <p>
                      <strong className="text-[var(--huza-ink)]">Cell:</strong> {String(s.cell || "—")}
                    </p>
                    <p>
                      <strong className="text-[var(--huza-ink)]">Village:</strong> {String(s.village || "—")}
                    </p>
                    <p>
                      <strong className="text-[var(--huza-ink)]">Field:</strong> {String(s.fieldType || "—")} ·{" "}
                      {String(s.farmSize || "—")}
                    </p>
                    <p>
                      <strong className="text-[var(--huza-ink)]">Current crop:</strong>{" "}
                      {String(s.currentCrop || "—")}
                    </p>
                    <p>
                      <strong className="text-[var(--huza-ink)]">Past crops:</strong>{" "}
                      {[s.pastCropsSeason1, s.pastCropsSeason2, s.pastCropsSeason3]
                        .filter(Boolean)
                        .map(String)
                        .join(" / ") || "—"}
                    </p>
                    <p>
                      <strong className="text-[var(--huza-ink)]">Chemicals/week:</strong>{" "}
                      {String(s.chemicalsPerWeek || "—")} ({String(s.chemicalsWhy || "—")}) · Dosage{" "}
                      {String(s.chemicalsDosage || "—")}
                    </p>
                    <p>
                      <strong className="text-[var(--huza-ink)]">Fertilizer/week:</strong>{" "}
                      {String(s.fertilizerPerWeek || "—")}
                    </p>
                    <p>
                      <strong className="text-[var(--huza-ink)]">Irrigation:</strong>{" "}
                      {String(s.irrigationMethod || "—")}
                    </p>
                    <p>
                      <strong className="text-[var(--huza-ink)]">Diseases:</strong>{" "}
                      {String(s.diseasesIdentified || "—")}
                    </p>
                    <p>
                      <strong className="text-[var(--huza-ink)]">Pests:</strong>{" "}
                      {String(s.pestsIdentified || "—")}
                    </p>
                    <p>
                      <strong className="text-[var(--huza-ink)]">Harvested:</strong>{" "}
                      {String(s.totalQuantityHarvested || "—")} · Quality{" "}
                      {String(s.qualityGeneral || "—")}
                    </p>
                    <p>
                      <strong className="text-[var(--huza-ink)]">Price:</strong>{" "}
                      {s.pricePerUnit != null
                        ? `${formatRwf(Number(s.pricePerUnit))}/${String(s.priceUnit || "unit")}`
                        : "—"}
                    </p>
                    <p>
                      <strong className="text-[var(--huza-ink)]">Kgs bought by Huza:</strong>{" "}
                      {String(s.totalKgsBoughtByHuza ?? 0)}
                    </p>
                    <p>
                      <strong className="text-[var(--huza-ink)]">Payment option:</strong>{" "}
                      {String(s.paymentOption || "—")}
                    </p>
                    <p>
                      <strong className="text-[var(--huza-ink)]">Farm gate / delivery / after sale:</strong>{" "}
                      {[s.farmGatePrice, s.priceUponDelivery, s.priceAfterSale]
                        .map((v) => (v != null ? formatRwf(Number(v)) : "—"))
                        .join(" / ")}
                    </p>
                  </div>

                  {s.farmerComments ? (
                    <p className="text-sm">
                      <strong>Comments:</strong> {String(s.farmerComments)}
                    </p>
                  ) : null}
                  {s.proofOfPaymentUrl ? (
                    <a
                      href={String(s.proofOfPaymentUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[var(--huza-green)] underline"
                    >
                      View proof of payment
                    </a>
                  ) : null}
                  {s.adminNotes ? (
                    <p className="text-xs text-[var(--huza-muted)]">Admin notes: {String(s.adminNotes)}</p>
                  ) : null}

                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => supplierAction(String(s.id), "approve")}>
                      Approve farmer
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const note = window.prompt(
                          "What additional info do you need?",
                          "Please complete farmer dossier fields"
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
                          "Agent visit date/time",
                          new Date(Date.now() + 86400000).toISOString().slice(0, 16)
                        );
                        if (!when) return;
                        supplierAction(String(s.id), "schedule_inspection", undefined, {
                          inspectionScheduledAt: new Date(when).toISOString(),
                        });
                      }}
                    >
                      Schedule agent visit
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        const reason = window.prompt("Rejection reason", "Dossier incomplete");
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
            <h2 className="font-semibold mb-4">All farmers</h2>
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
                      {s.currentCrop ? ` · Crop: ${String(s.currentCrop)}` : ""}
                      {s.qualityGeneral ? ` · Quality: ${String(s.qualityGeneral)}` : ""}
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

      {tab === "products" && (
        <div className="rounded-2xl border border-[var(--huza-line)] bg-white p-5 space-y-4">
          <h2 className="font-semibold mb-1">Product review</h2>
          <p className="text-sm text-[var(--huza-muted)] mb-4">
            Accept a product to publish its photos on the HUZA FRESH home page and shop. Reject keeps
            it hidden from customers.
          </p>
          {(props.pendingFarmerProducts || []).length === 0 ? (
            <p className="text-sm text-[var(--huza-muted)]">No products waiting for review.</p>
          ) : (
            (props.pendingFarmerProducts || []).map((p) => {
              const supplier = p.supplier as AnyObj | undefined;
              const images = (p.images as { url?: string }[]) || [];
              return (
                <div key={String(p.id)} className="rounded-xl border border-[var(--huza-line)] p-4 space-y-3">
                  <div className="flex flex-wrap gap-3">
                    {images.slice(0, 4).map((img) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={String(img.url)}
                        src={String(img.url)}
                        alt=""
                        className="h-16 w-16 rounded-lg object-cover border border-[var(--huza-line)]"
                      />
                    ))}
                    <div>
                      <p className="font-semibold">{String(p.nameEn)}</p>
                      <p className="text-sm text-[var(--huza-muted)]">
                        {String(supplier?.businessName || "Farmer")} ·{" "}
                        {formatRwf(Number(p.pricePerUnit || p.price || 0))}/
                        {String(p.priceUnit || p.unit || "unit")}
                      </p>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs text-[var(--huza-muted)]">
                    <p>
                      <strong className="text-[var(--huza-ink)]">Field:</strong> {String(p.fieldType || "—")} ·{" "}
                      {String(p.fieldSize || "—")}
                    </p>
                    <p>
                      <strong className="text-[var(--huza-ink)]">Current crop:</strong>{" "}
                      {String(p.currentCrop || "—")}
                    </p>
                    <p>
                      <strong className="text-[var(--huza-ink)]">Past crops:</strong>{" "}
                      {[p.pastCropsSeason1, p.pastCropsSeason2, p.pastCropsSeason3]
                        .filter(Boolean)
                        .map(String)
                        .join(" / ") || "—"}
                    </p>
                    <p>
                      <strong className="text-[var(--huza-ink)]">Chemicals:</strong>{" "}
                      {String(p.chemicalsPerWeek || "—")} / {String(p.chemicalsWhy || "—")} /{" "}
                      {String(p.chemicalsDosage || "—")}
                    </p>
                    <p>
                      <strong className="text-[var(--huza-ink)]">Fertilizer:</strong>{" "}
                      {String(p.fertilizerPerWeek || "—")}
                    </p>
                    <p>
                      <strong className="text-[var(--huza-ink)]">Irrigation:</strong>{" "}
                      {String(p.irrigationMethod || "—")}
                    </p>
                    <p>
                      <strong className="text-[var(--huza-ink)]">Diseases / pests:</strong>{" "}
                      {String(p.diseasesIdentified || "—")} / {String(p.pestsIdentified || "—")}
                    </p>
                    <p>
                      <strong className="text-[var(--huza-ink)]">Harvested / quality:</strong>{" "}
                      {String(p.totalQuantityHarvested || "—")} / {String(p.qualityGeneral || "—")}
                    </p>
                    <p>
                      <strong className="text-[var(--huza-ink)]">Payment:</strong>{" "}
                      {String(p.paymentOption || "—")} · gate{" "}
                      {p.farmGatePrice != null ? formatRwf(Number(p.farmGatePrice)) : "—"}
                    </p>
                    <p>
                      <strong className="text-[var(--huza-ink)]">Kgs bought by Huza:</strong>{" "}
                      {String(p.totalKgsBoughtByHuza ?? 0)}
                    </p>
                  </div>
                  {p.farmerComments ? (
                    <p className="text-sm">
                      <strong>Comments:</strong> {String(p.farmerComments)}
                    </p>
                  ) : null}
                  {p.proofOfPaymentUrl ? (
                    <a
                      href={String(p.proofOfPaymentUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[var(--huza-green)] underline"
                    >
                      Proof of payment
                    </a>
                  ) : null}
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => productReview(String(p.id), "approve")}>
                      Accept &amp; show on home
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => productReview(String(p.id), "reject")}>
                      Reject product
                    </Button>
                  </div>
                </div>
              );
            })
          )}
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
                  "PAID",
                  "CONFIRMED",
                  "PREPARING",
                  "PACKED",
                  "READY_FOR_DISPATCH",
                  "READY_FOR_PICKUP",
                  "OUT_FOR_DELIVERY",
                  "DELIVERED",
                  "CANCELLED",
                  "RETURNED",
                  "REFUNDED",
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
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const reply = window.prompt("Admin reply", String(r.adminReply || ""));
                    if (reply == null) return;
                    reviewAction(String(r.id), "reply", reply);
                  }}
                >
                  Reply
                </Button>
                <Button size="sm" variant="danger" onClick={() => reviewAction(String(r.id), "delete")}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
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
            <li>Farmer count: {props.allSuppliers.length}</li>
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
            Track who approved farmers, changed orders, and other admin actions.
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
    </div>
  );
}
