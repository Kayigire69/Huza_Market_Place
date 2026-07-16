"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

type Promo = {
  id: string;
  code?: string | null;
  titleEn: string;
  descriptionEn?: string | null;
  discountPct?: number | null;
  discountAmt?: number | null;
  freeDelivery?: boolean;
  isFlashSale?: boolean;
  isActive?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
};

export function AdminPromotionsClient() {
  const [promotions, setPromotions] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/promotions");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setPromotions(Array.isArray(data) ? data : data.promotions || []);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Failed to load promotions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const createPromo = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/admin/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.get("code") || null,
          titleEn: form.get("titleEn"),
          titleFr: form.get("titleFr") || form.get("titleEn"),
          titleRw: form.get("titleRw") || form.get("titleEn"),
          descriptionEn: form.get("descriptionEn") || null,
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
      if (!res.ok) throw new Error(data.error || "Could not create offer");
      (e.target as HTMLFormElement).reset();
      setMsg("Offer published");
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Create failed");
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (id: string) => {
    const res = await fetch("/api/admin/promotions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "toggle" }),
    });
    setMsg(res.ok ? "Visibility updated" : "Toggle failed");
    if (res.ok) await load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this promotion?")) return;
    const res = await fetch(`/api/admin/promotions?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    setMsg(res.ok ? "Offer deleted" : "Delete failed");
    if (res.ok) await load();
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="admin-panel-title">Promotions</h1>
      </div>

      {msg ? (
        <p className="rounded-lg border border-[var(--admin-line)] bg-[var(--admin-soft)] px-3 py-2 text-sm">
          {msg}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <form onSubmit={createPromo} className="admin-panel space-y-3 p-5">
          <h2 className="font-semibold">Create promotion</h2>
          <input name="titleEn" placeholder="Title" className="admin-input" required />
          <textarea
            name="descriptionEn"
            placeholder="Short description"
            className="admin-input min-h-[80px]"
            required
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <input name="code" placeholder="Promo code (optional)" className="admin-input" />
            <input
              name="discountPct"
              type="number"
              min={0}
              max={100}
              placeholder="Discount %"
              className="admin-input"
            />
            <input
              name="discountAmt"
              type="number"
              min={0}
              placeholder="Discount amount RWF"
              className="admin-input"
            />
            <input name="startsAt" type="datetime-local" className="admin-input" title="Starts" />
            <input name="endsAt" type="datetime-local" className="admin-input" title="Ends" />
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="freeDelivery" /> Free delivery
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="isFlashSale" /> Flash sale
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="isActive" defaultChecked /> Publish now
            </label>
          </div>
          <Button type="submit" disabled={busy}>
            {busy ? "Publishing…" : "Publish offer"}
          </Button>
        </form>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--admin-muted)]">
            Active &amp; scheduled
          </h2>
          {loading ? (
            <p className="text-sm text-[var(--admin-muted)]">Loading…</p>
          ) : promotions.length === 0 ? (
            <div className="admin-panel p-6 text-sm text-[var(--admin-muted)]">
              No promotions yet.
            </div>
          ) : (
            promotions.map((p) => (
              <article key={p.id} className="admin-panel p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    {p.isFlashSale ? (
                      <span className="text-[10px] font-bold uppercase tracking-wide text-amber-700">
                        Flash sale
                      </span>
                    ) : null}
                    <h3 className="font-semibold">{p.titleEn}</h3>
                    <p className="mt-1 text-sm text-[var(--admin-muted)]">
                      {p.descriptionEn || "—"}
                    </p>
                    <p className="mt-2 text-xs font-mono text-[var(--admin-muted)]">
                      {[
                        p.code,
                        p.discountPct != null ? `${p.discountPct}%` : null,
                        p.discountAmt != null ? `RWF ${p.discountAmt}` : null,
                        p.freeDelivery ? "Free delivery" : null,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "No code / discount set"}
                    </p>
                  </div>
                  <span
                    className={
                      p.isActive
                        ? "admin-status admin-status-ok"
                        : "admin-status admin-status-muted"
                    }
                  >
                    {p.isActive ? "Live" : "Hidden"}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="ghost" onClick={() => void toggle(p.id)}>
                    {p.isActive ? "Unpublish" : "Publish"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="danger"
                    onClick={() => void remove(p.id)}
                  >
                    Delete
                  </Button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
