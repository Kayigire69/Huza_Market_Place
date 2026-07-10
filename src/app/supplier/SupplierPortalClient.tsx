"use client";

import { FormEvent, useState } from "react";
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

type Supplier = {
  id: string;
  businessName: string;
  description: string | null;
  location: string;
  district: string;
  phone: string;
  availability: string;
  openHour: number;
  closeHour: number;
  status: string;
  offers: Offer[];
};

export function SupplierPortalClient({
  supplier,
  categories,
}: {
  supplier: Supplier;
  categories: Category[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"offers" | "profile">("offers");
  const [msg, setMsg] = useState("");

  const refresh = () => router.refresh();

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
        phone: form.get("phone"),
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
      <div className="flex gap-2 mb-6">
        {(["offers", "profile"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${
              tab === t ? "bg-[var(--huza-green)] text-white" : "bg-white border border-[var(--huza-line)]"
            }`}
          >
            {t === "offers" ? "My offers to Huza" : "Profile"}
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
              Ask price = what Youth Huza pays you. Suggested retail = optional price Huza may sell at.
            </p>
            <input name="title" placeholder="Product name (e.g. Fresh Avocados)" className="input-field" required />
            <textarea name="description" placeholder="Quality, harvest date, notes..." className="input-field min-h-16" />
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
              <p className="text-xs text-[var(--huza-muted)]">Offers unlock after partner approval.</p>
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

      {tab === "profile" && (
        <form
          onSubmit={updateProfile}
          className="max-w-xl rounded-2xl border border-[var(--huza-line)] bg-white p-5 space-y-3"
        >
          <h2 className="font-semibold">Farm partner profile</h2>
          <input name="businessName" defaultValue={supplier.businessName} className="input-field" required />
          <textarea
            name="description"
            defaultValue={supplier.description ?? ""}
            className="input-field min-h-20"
          />
          <input name="location" defaultValue={supplier.location} className="input-field" required />
          <input name="district" defaultValue={supplier.district} className="input-field" required />
          <input name="phone" defaultValue={supplier.phone} className="input-field" required />
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
          <Button type="submit">Save profile</Button>
        </form>
      )}
    </div>
  );
}
