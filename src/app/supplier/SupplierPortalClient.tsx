"use client";

import { FormEvent, useEffect, useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { formatRwf, formatUnit } from "@/lib/utils";

type Category = { id: string; nameEn: string; slug: string };
type Offer = {
  id: string;
  title: string;
  description: string | null;
  unit: string;
  quantityOffered: number;
  askPrice: number;
  suggestedRetail: number | null;
  status: string;
  adminNote: string | null;
  purchasedQty: number | null;
  category: { nameEn: string } | null;
};

type PurchaseOrder = {
  id: string;
  poNumber: string;
  status: string;
  productName: string;
  quantity: number;
  unit: string;
  negotiatedPrice: number;
  totalAmount: number;
  paymentRef: string | null;
  paymentMethod: string | null;
  paidAt: string | Date | null;
  notes: string | null;
  orderedAt: string | Date | null;
};

type ProcurementMsg = {
  id: string;
  senderRole: string;
  senderName: string;
  body: string;
  createdAt: string;
};

type Supplier = {
  id: string;
  businessName: string;
  description: string | null;
  location: string;
  district: string;
  sector: string | null;
  phone: string;
  email: string | null;
  nationalId: string | null;
  companyRegNo: string | null;
  tin: string | null;
  farmSize: string | null;
  productionCapacity: string | null;
  productCategories: string | null;
  paymentMomo: string | null;
  bankAccount: string | null;
  bankName: string | null;
  nationalIdUrl: string | null;
  businessCertUrl: string | null;
  foodSafetyUrl: string | null;
  organicCertUrl: string | null;
  availability: string;
  openHour: number;
  closeHour: number;
  status: string;
  offers: Offer[];
  purchaseOrders?: PurchaseOrder[];
};

type Tab = "offers" | "pos" | "deliveries" | "payments" | "messages" | "profile";

const TABS: { key: Tab; label: string }[] = [
  { key: "offers", label: "Offers" },
  { key: "pos", label: "Purchase Orders" },
  { key: "deliveries", label: "Deliveries" },
  { key: "payments", label: "Payments" },
  { key: "messages", label: "Messages" },
  { key: "profile", label: "Profile" },
];

export function SupplierPortalClient({
  supplier,
  categories,
}: {
  supplier: Supplier;
  categories: Category[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("offers");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<ProcurementMsg[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const refresh = () => startTransition(() => router.refresh());
  const purchaseOrders = supplier.purchaseOrders || [];
  const paidOrders = purchaseOrders.filter((po) => po.status === "PAID");
  const schedulable = purchaseOrders.filter(
    (po) => !["CANCELLED", "REJECTED", "PAID"].includes(po.status)
  );

  useEffect(() => {
    if (tab !== "messages") return;
    let cancelled = false;
    (async () => {
      setMessagesLoading(true);
      const res = await fetch("/api/procurement/messages");
      const data = await res.json();
      if (!cancelled) {
        setMessages(Array.isArray(data) ? data : []);
        setMessagesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab]);

  const submitOffer = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/supplier/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.get("title"),
        description: form.get("description"),
        categoryId: form.get("categoryId") || null,
        unit: form.get("unit"),
        quantityOffered: Number(form.get("quantityOffered")),
        askPrice: Number(form.get("askPrice")),
        suggestedRetail: form.get("suggestedRetail")
          ? Number(form.get("suggestedRetail"))
          : null,
      }),
    });
    const data = await res.json();
    setMsg(res.ok ? "Offer sent to Youth Huza" : data.error || "Failed");
    if (res.ok) {
      (e.target as HTMLFormElement).reset();
      refresh();
    }
  };

  const acceptPo = async (poId: string) => {
    setBusy(true);
    const res = await fetch("/api/supplier/pos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ poId, action: "accept" }),
    });
    const data = await res.json();
    setBusy(false);
    setMsg(res.ok ? "Purchase order accepted" : data.error || "Accept failed");
    if (res.ok) refresh();
  };

  const scheduleDelivery = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/supplier/pos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        poId: form.get("poId"),
        action: "schedule",
        deliveryDate: form.get("deliveryDate") || null,
        notes: form.get("notes") || null,
      }),
    });
    const data = await res.json();
    setBusy(false);
    setMsg(res.ok ? "Delivery scheduled / note sent" : data.error || "Schedule failed");
    if (res.ok) {
      (e.target as HTMLFormElement).reset();
      refresh();
    }
  };

  const sendMessage = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/procurement/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: form.get("body") }),
    });
    const data = await res.json();
    setBusy(false);
    if (res.ok) {
      setMessages((prev) => [...prev, data]);
      (e.target as HTMLFormElement).reset();
      setMsg("Message sent to Huza procurement");
    } else {
      setMsg(data.error || "Failed to send");
    }
  };

  const updateProfile = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/supplier/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessName: form.get("businessName"),
        description: form.get("description"),
        location: form.get("location"),
        district: form.get("district"),
        sector: form.get("sector"),
        phone: form.get("phone"),
        email: form.get("email"),
        nationalId: form.get("nationalId"),
        companyRegNo: form.get("companyRegNo"),
        tin: form.get("tin"),
        farmSize: form.get("farmSize"),
        productionCapacity: form.get("productionCapacity"),
        productCategories: form.get("productCategories"),
        paymentMomo: form.get("paymentMomo"),
        bankAccount: form.get("bankAccount"),
        bankName: form.get("bankName"),
        nationalIdUrl: form.get("nationalIdUrl"),
        businessCertUrl: form.get("businessCertUrl"),
        foodSafetyUrl: form.get("foodSafetyUrl"),
        organicCertUrl: form.get("organicCertUrl"),
        availability: form.get("availability"),
        openHour: Number(form.get("openHour")),
        closeHour: Number(form.get("closeHour")),
      }),
    });
    setMsg(res.ok ? "Profile updated" : "Update failed");
    refresh();
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              tab === key
                ? "bg-[var(--huza-green)] text-white"
                : "bg-white border border-[var(--huza-line)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {msg && <p className="mb-4 text-sm text-[var(--huza-green-dark)]">{msg}</p>}

      {tab === "offers" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <form
            onSubmit={submitOffer}
            className="rounded-2xl border border-[var(--huza-line)] bg-white p-5 space-y-3"
          >
            <h2 className="font-semibold">Offer produce for Huza to buy</h2>
            <p className="text-xs text-[var(--huza-muted)]">
              Ask price = what Youth Huza pays you (wholesale). You sell to Huza only — not to
              customers. Huza sets retail prices and handles customer delivery.
            </p>
            <input
              name="title"
              placeholder="Product name (e.g. Fresh Avocados)"
              className="input-field"
              required
            />
            <textarea
              name="description"
              placeholder="Quality, harvest date, notes..."
              className="input-field min-h-16"
            />
            <select name="categoryId" className="input-field">
              <option value="">Category (optional)</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameEn}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input
                name="quantityOffered"
                type="number"
                step="0.1"
                placeholder="Quantity"
                className="input-field"
                required
              />
              <select name="unit" className="input-field" defaultValue="KG">
                {["KG", "PIECE", "BUNCH", "LITRE", "PACK", "DOZEN"].map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                name="askPrice"
                type="number"
                placeholder="Ask price (RWF / unit)"
                className="input-field"
                required
              />
              <input
                name="suggestedRetail"
                type="number"
                placeholder="Suggested retail (optional)"
                className="input-field"
              />
            </div>
            <Button type="submit" className="w-full" disabled={supplier.status !== "APPROVED"}>
              Submit offer to Youth Huza
            </Button>
            {supplier.status !== "APPROVED" && (
              <p className="text-xs text-[var(--huza-muted)]">
                Offers unlock after verification &amp; approval.
              </p>
            )}
          </form>

          <div className="rounded-2xl border border-[var(--huza-line)] bg-white p-5">
            <h2 className="font-semibold mb-4">Offer status</h2>
            <div className="space-y-3 max-h-[520px] overflow-y-auto">
              {supplier.offers.length === 0 ? (
                <p className="text-sm text-[var(--huza-muted)]">No offers yet.</p>
              ) : (
                supplier.offers.map((o) => (
                  <div key={o.id} className="rounded-xl border border-[var(--huza-line)] p-3">
                    <div className="flex justify-between gap-2">
                      <p className="font-medium">{o.title}</p>
                      <span className="text-xs rounded-full bg-[var(--huza-mint)] px-2 py-1 h-fit">
                        {o.status}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--huza-muted)] mt-1">
                      {o.quantityOffered} {formatUnit(o.unit)} · Ask {formatRwf(o.askPrice)}/
                      {formatUnit(o.unit)}
                      {o.category ? ` · ${o.category.nameEn}` : ""}
                    </p>
                    {o.purchasedQty != null && (
                      <p className="text-xs text-[var(--huza-green-dark)] mt-1">
                        Huza purchased {o.purchasedQty} {formatUnit(o.unit)}
                      </p>
                    )}
                    {o.adminNote && (
                      <p className="text-xs text-[var(--huza-muted)] mt-1">Note: {o.adminNote}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "pos" && (
        <div className="rounded-2xl border border-[var(--huza-line)] bg-white p-5">
          <h2 className="font-semibold mb-1">Purchase orders from Youth Huza</h2>
          <p className="text-xs text-[var(--huza-muted)] mb-4">
            These are Huza buying from you — not customer orders.
          </p>
          {purchaseOrders.length === 0 ? (
            <p className="text-sm text-[var(--huza-muted)]">No purchase orders yet.</p>
          ) : (
            <div className="space-y-3">
              {purchaseOrders.map((po) => (
                <div key={po.id} className="rounded-xl border border-[var(--huza-line)] p-3">
                  <div className="flex flex-wrap justify-between gap-2">
                    <p className="font-medium">
                      {po.poNumber} · {po.productName}
                    </p>
                    <span className="text-xs rounded-full bg-[var(--huza-mint)] px-2 py-1 h-fit">
                      {po.status}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--huza-muted)] mt-1">
                    {po.quantity} {formatUnit(po.unit)} · {formatRwf(po.negotiatedPrice)}/
                    {formatUnit(po.unit)} · Total {formatRwf(po.totalAmount)}
                  </p>
                  {po.notes && (
                    <p className="text-xs text-[var(--huza-muted)] mt-1 whitespace-pre-wrap">
                      {po.notes}
                    </p>
                  )}
                  {po.status === "DRAFT" && (
                    <div className="mt-3">
                      <Button
                        type="button"
                        size="sm"
                        disabled={busy}
                        onClick={() => acceptPo(po.id)}
                      >
                        Accept PO
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "deliveries" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <form
            onSubmit={scheduleDelivery}
            className="rounded-2xl border border-[var(--huza-line)] bg-white p-5 space-y-3"
          >
            <h2 className="font-semibold">Schedule delivery to Huza</h2>
            <p className="text-xs text-[var(--huza-muted)]">
              Deliver to the Huza warehouse only. Do not arrange customer delivery.
            </p>
            <select name="poId" className="input-field" required>
              <option value="">Select purchase order</option>
              {schedulable.map((po) => (
                <option key={po.id} value={po.id}>
                  {po.poNumber} · {po.productName} ({po.status})
                </option>
              ))}
            </select>
            <div>
              <label className="label">Delivery date</label>
              <input name="deliveryDate" type="date" className="input-field" required />
            </div>
            <textarea
              name="notes"
              className="input-field min-h-24"
              placeholder="Delivery note (driver, vehicle, batch, document URL…)"
              required
            />
            <Button type="submit" className="w-full" disabled={busy || schedulable.length === 0}>
              Submit delivery schedule
            </Button>
          </form>
          <div className="rounded-2xl border border-[var(--huza-line)] bg-white p-5">
            <h2 className="font-semibold mb-4">PO notes &amp; schedules</h2>
            <div className="space-y-3 max-h-[420px] overflow-y-auto">
              {purchaseOrders.filter((po) => po.notes).length === 0 ? (
                <p className="text-sm text-[var(--huza-muted)]">No delivery notes yet.</p>
              ) : (
                purchaseOrders
                  .filter((po) => po.notes)
                  .map((po) => (
                    <div key={po.id} className="rounded-xl border border-[var(--huza-line)] p-3">
                      <p className="font-medium text-sm">
                        {po.poNumber} · {po.productName}
                      </p>
                      <p className="text-xs text-[var(--huza-muted)] mt-1 whitespace-pre-wrap">
                        {po.notes}
                      </p>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "payments" && (
        <div className="rounded-2xl border border-[var(--huza-line)] bg-white p-5">
          <h2 className="font-semibold mb-1">Payments from Youth Huza</h2>
          <p className="text-xs text-[var(--huza-muted)] mb-4">
            Paid purchase orders and payment references.
          </p>
          {paidOrders.length === 0 ? (
            <p className="text-sm text-[var(--huza-muted)]">No paid purchase orders yet.</p>
          ) : (
            <div className="space-y-3">
              {paidOrders.map((po) => (
                <div key={po.id} className="rounded-xl border border-[var(--huza-line)] p-3">
                  <div className="flex flex-wrap justify-between gap-2">
                    <p className="font-medium">
                      {po.poNumber} · {po.productName}
                    </p>
                    <span className="text-xs rounded-full bg-[var(--huza-mint)] px-2 py-1 h-fit">
                      PAID
                    </span>
                  </div>
                  <p className="text-xs text-[var(--huza-muted)] mt-1">
                    Total {formatRwf(po.totalAmount)}
                    {po.paidAt
                      ? ` · Paid ${new Date(po.paidAt).toLocaleDateString()}`
                      : ""}
                    {po.paymentMethod ? ` · ${po.paymentMethod}` : ""}
                  </p>
                  {po.paymentRef && (
                    <p className="text-sm text-[var(--huza-green-dark)] mt-1 font-medium">
                      Ref: {po.paymentRef}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "messages" && (
        <div className="rounded-2xl border border-[var(--huza-line)] bg-white p-5">
          <h2 className="font-semibold mb-1">Messages with Huza procurement</h2>
          <p className="text-xs text-[var(--huza-muted)] mb-4">
            Ask about offers, purchase orders, delivery, or payment.
          </p>
          <ul className="mb-4 max-h-64 overflow-y-auto space-y-2 text-sm border border-[var(--huza-line)] rounded-xl p-3 bg-[var(--huza-mint)]/20">
            {messagesLoading ? (
              <li className="text-[var(--huza-muted)]">Loading…</li>
            ) : messages.length === 0 ? (
              <li className="text-[var(--huza-muted)]">No messages yet.</li>
            ) : (
              messages.map((m) => (
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
            <textarea
              name="body"
              className="input-field min-h-24"
              placeholder="Message to Youth Huza procurement…"
              required
            />
            <Button type="submit" size="sm" disabled={busy}>
              Send message
            </Button>
          </form>
        </div>
      )}

      {tab === "profile" && (
        <form
          onSubmit={updateProfile}
          className="max-w-3xl rounded-2xl border border-[var(--huza-line)] bg-white p-5 space-y-3"
        >
          <h2 className="font-semibold">Verification &amp; farm profile</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              name="businessName"
              defaultValue={supplier.businessName}
              className="input-field"
              required
            />
            <input name="phone" defaultValue={supplier.phone} className="input-field" required />
            <input
              name="email"
              defaultValue={supplier.email ?? ""}
              className="input-field"
              placeholder="Email"
            />
            <input
              name="nationalId"
              defaultValue={supplier.nationalId ?? ""}
              className="input-field"
              placeholder="National ID"
            />
            <input
              name="location"
              defaultValue={supplier.location}
              className="input-field"
              required
            />
            <input
              name="district"
              defaultValue={supplier.district}
              className="input-field"
              required
            />
            <input
              name="sector"
              defaultValue={supplier.sector ?? ""}
              className="input-field"
              placeholder="Sector"
            />
            <input
              name="productCategories"
              defaultValue={supplier.productCategories ?? ""}
              className="input-field"
              placeholder="Product categories"
            />
            <input
              name="farmSize"
              defaultValue={supplier.farmSize ?? ""}
              className="input-field"
              placeholder="Farm size"
            />
            <input
              name="productionCapacity"
              defaultValue={supplier.productionCapacity ?? ""}
              className="input-field"
              placeholder="Production capacity"
            />
            <input
              name="paymentMomo"
              defaultValue={supplier.paymentMomo ?? ""}
              className="input-field"
              placeholder="MoMo number"
            />
            <input
              name="bankAccount"
              defaultValue={supplier.bankAccount ?? ""}
              className="input-field"
              placeholder="Bank account"
            />
            <input
              name="bankName"
              defaultValue={supplier.bankName ?? ""}
              className="input-field"
              placeholder="Bank name"
            />
            <input
              name="tin"
              defaultValue={supplier.tin ?? ""}
              className="input-field"
              placeholder="TIN"
            />
            <input
              name="companyRegNo"
              defaultValue={supplier.companyRegNo ?? ""}
              className="input-field"
              placeholder="Company reg. no."
            />
            <input
              name="nationalIdUrl"
              defaultValue={supplier.nationalIdUrl ?? ""}
              className="input-field"
              placeholder="National ID doc URL"
            />
            <input
              name="businessCertUrl"
              defaultValue={supplier.businessCertUrl ?? ""}
              className="input-field"
              placeholder="Business cert URL"
            />
            <input
              name="foodSafetyUrl"
              defaultValue={supplier.foodSafetyUrl ?? ""}
              className="input-field"
              placeholder="Food safety cert URL"
            />
            <input
              name="organicCertUrl"
              defaultValue={supplier.organicCertUrl ?? ""}
              className="input-field"
              placeholder="Organic cert URL"
            />
          </div>
          <textarea
            name="description"
            defaultValue={supplier.description ?? ""}
            className="input-field min-h-20"
          />
          <select name="availability" defaultValue={supplier.availability} className="input-field">
            <option value="OPEN">Open / available</option>
            <option value="BUSY">Busy</option>
            <option value="CLOSED">Closed</option>
          </select>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">Open hour</label>
              <input
                name="openHour"
                type="number"
                min={0}
                max={23}
                defaultValue={supplier.openHour}
                className="input-field"
              />
            </div>
            <div>
              <label className="label">Close hour</label>
              <input
                name="closeHour"
                type="number"
                min={0}
                max={23}
                defaultValue={supplier.closeHour}
                className="input-field"
              />
            </div>
          </div>
          <Button type="submit">Save verification profile</Button>
        </form>
      )}
    </div>
  );
}
