"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";

type Promo = {
  id: string;
  code?: string | null;
  titleEn: string;
  titleFr?: string;
  titleRw?: string;
  descriptionEn?: string | null;
  descriptionFr?: string | null;
  descriptionRw?: string | null;
  discountPct?: number | null;
  discountAmt?: number | null;
  freeDelivery?: boolean;
  isFlashSale?: boolean;
  isActive?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
};

/**
 * Admin CMS for homepage Special offers — each card is a DB promotion, not hardcoded.
 */
export function AdminOffersPanel({
  promotions,
  onDone,
}: {
  promotions: Promo[];
  onDone: (msg: string) => void;
}) {
  const [busy, setBusy] = useState(false);

  const createPromo = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/promotions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: form.get("code") || null,
        titleEn: form.get("titleEn"),
        titleFr: form.get("titleFr") || form.get("titleEn"),
        titleRw: form.get("titleRw") || form.get("titleEn"),
        descriptionEn: form.get("descriptionEn") || null,
        descriptionFr: form.get("descriptionFr") || form.get("descriptionEn") || null,
        descriptionRw: form.get("descriptionRw") || form.get("descriptionEn") || null,
        discountPct: form.get("discountPct") || null,
        discountAmt: form.get("discountAmt") || null,
        freeDelivery: form.get("freeDelivery") === "on",
        isFlashSale: form.get("isFlashSale") === "on",
        isActive: form.get("isActive") === "on",
        startsAt: form.get("startsAt") || null,
        endsAt: form.get("endsAt") || null,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (res.ok) {
      (e.target as HTMLFormElement).reset();
      onDone("Special offer published to homepage");
    } else {
      onDone(data.error || "Could not create offer");
    }
  };

  const toggle = async (id: string) => {
    const res = await fetch("/api/admin/promotions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "toggle" }),
    });
    onDone(res.ok ? "Offer visibility updated" : "Toggle failed");
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this special offer? It will leave the homepage.")) return;
    const res = await fetch(`/api/admin/promotions?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    onDone(res.ok ? "Offer deleted" : "Delete failed");
  };

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <form onSubmit={createPromo} className="admin-panel p-5 space-y-3">
        <h2 className="font-semibold text-lg">Post a special offer</h2>
        <input name="titleEn" placeholder="Title (English)" className="input-field" required />
        <input name="titleFr" placeholder="Title (French, optional)" className="input-field" />
        <input name="titleRw" placeholder="Title (Kinyarwanda, optional)" className="input-field" />
        <textarea
          name="descriptionEn"
          placeholder="Short description shown on the homepage card"
          className="input-field min-h-20"
          required
        />
        <div className="grid sm:grid-cols-2 gap-3">
          <input name="code" placeholder="Promo code (optional)" className="input-field" />
          <input name="discountPct" type="number" min={0} max={100} placeholder="Discount %" className="input-field" />
          <input name="discountAmt" type="number" min={0} placeholder="Discount amount RWF" className="input-field" />
          <input name="startsAt" type="datetime-local" className="input-field" title="Starts at" />
          <input name="endsAt" type="datetime-local" className="input-field" title="Ends at" />
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="freeDelivery" /> Free delivery
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="isFlashSale" /> Flash sale badge
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="isActive" defaultChecked /> Publish now
          </label>
        </div>
        <Button type="submit" disabled={busy}>
          {busy ? "Publishing…" : "Publish to homepage"}
        </Button>
      </form>

      <div className="space-y-3">
        <h2 className="font-semibold text-lg">Homepage offers</h2>
        {promotions.length === 0 ? (
          <p className="text-sm text-[var(--huza-muted)]">No offers yet — post the first one.</p>
        ) : (
          promotions.map((p, i) => (
            <div
              key={p.id}
              className={`rounded-2xl p-5 text-white ${
                i % 2 === 0 ? "bg-[var(--huza-green-dark)]" : "bg-[#166B3F]"
              }`}
            >
              {p.isFlashSale && (
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--huza-gold)]">
                  Flash sale
                </span>
              )}
              <h3 className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold">
                {p.titleEn}
              </h3>
              <p className="mt-2 text-sm text-[#C8E8D4]">{p.descriptionEn || "—"}</p>
              {(p.code || p.discountPct || p.freeDelivery) && (
                <p className="mt-3 inline-block rounded-md bg-white/15 px-3 py-1 text-sm font-mono">
                  {[
                    p.code,
                    p.discountPct ? `${p.discountPct}%` : null,
                    p.freeDelivery ? "Free delivery" : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  type="button"
                  onClick={() => toggle(p.id)}
                >
                  {p.isActive ? "Unpublish" : "Publish"}
                </Button>
                <Button size="sm" variant="ghost" type="button" onClick={() => remove(p.id)}>
                  Delete
                </Button>
                <span className="text-xs self-center text-white/70">
                  {p.isActive ? "Live on homepage" : "Hidden"}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
