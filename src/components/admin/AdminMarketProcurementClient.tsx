"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatRwf, formatUnit } from "@/lib/utils";

type MarketPurchase = {
  id: string;
  purchaseNumber: string;
  marketName: string;
  vendorName: string;
  purchaseDate: string;
  productName: string;
  category: string | null;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  retailPrice: number | null;
  qualityGrade: string | null;
  inspectionNotes: string | null;
  photoUrls: string[];
  status: string;
  productId: string | null;
  notes: string | null;
};

const emptyForm = {
  marketName: "",
  vendorName: "",
  purchaseDate: new Date().toISOString().slice(0, 10),
  productName: "",
  category: "",
  unit: "KG",
  quantity: "",
  unitPrice: "",
  retailPrice: "",
  qualityGrade: "",
  inspectionNotes: "",
  notes: "",
};

export function AdminMarketProcurementClient() {
  const [purchases, setPurchases] = useState<MarketPurchase[]>([]);
  const [counts, setCounts] = useState({ recorded: 0, inspected: 0, stocked: 0 });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/market-purchases");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setPurchases(Array.isArray(data.purchases) ? data.purchases : []);
      setCounts(data.counts || { recorded: 0, inspected: 0, stocked: 0 });
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    setBusy("create");
    try {
      const res = await fetch("/api/admin/market-purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          quantity: Number(form.quantity),
          unitPrice: Number(form.unitPrice),
          retailPrice: form.retailPrice ? Number(form.retailPrice) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Create failed");
      setMsg(`Recorded ${data.purchaseNumber || "market purchase"}`);
      setForm(emptyForm);
      setShowForm(false);
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Create failed");
    } finally {
      setBusy(null);
    }
  };

  const act = async (id: string, action: string, extra?: Record<string, string>) => {
    setBusy(id);
    try {
      const res = await fetch("/api/admin/market-purchases", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      setMsg(
        action === "stock"
          ? "Stocked to inventory"
          : action === "inspect"
            ? "Inspection saved"
            : "Updated"
      );
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(null);
    }
  };

  const inspect = (p: MarketPurchase) => {
    const grade =
      window.prompt("Quality grade required (1 / 2 / 3 or A / B / C)", p.qualityGrade || "1") ||
      "";
    if (!grade.trim()) {
      setMsg("Inspection cancelled — grade is required");
      return;
    }
    const notes =
      window.prompt("Inspection notes", p.inspectionNotes || "") || undefined;
    void act(p.id, "inspect", {
      qualityGrade: grade.trim(),
      ...(notes != null ? { inspectionNotes: notes } : {}),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="admin-panel-title">Market Procurement</h1>
          <p className="mt-1 text-sm text-[var(--admin-muted)]">
            Wholesale / open-market buys — tracked separately from farmer purchases ·{" "}
            {counts.recorded} recorded · {counts.inspected} inspected · {counts.stocked} stocked
          </p>
        </div>
        <Button type="button" size="sm" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Close form" : "Record market buy"}
        </Button>
      </div>

      {msg ? (
        <p className="rounded-lg border border-[var(--admin-line)] bg-[var(--admin-soft)] px-3 py-2 text-sm">
          {msg}
        </p>
      ) : null}

      {showForm ? (
        <form onSubmit={create} className="admin-panel grid gap-3 p-4 sm:grid-cols-2">
          {(
            [
              ["marketName", "Market name", "Kimironko Market"],
              ["vendorName", "Vendor", "Vendor name"],
              ["productName", "Product", "Tomatoes"],
              ["category", "Category (optional)", "Vegetables"],
            ] as const
          ).map(([key, label, ph]) => (
            <label key={key} className="block text-sm">
              <span className="mb-1 block text-[var(--admin-muted)]">{label}</span>
              <input
                className="admin-input w-full"
                required={key !== "category"}
                placeholder={ph}
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              />
            </label>
          ))}
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--admin-muted)]">Purchase date</span>
            <input
              type="date"
              className="admin-input w-full"
              required
              value={form.purchaseDate}
              onChange={(e) => setForm((f) => ({ ...f, purchaseDate: e.target.value }))}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--admin-muted)]">Unit</span>
            <select
              className="admin-input w-full"
              value={form.unit}
              onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
            >
              {["KG", "PIECE", "BUNCH", "LITRE", "PACK", "DOZEN"].map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--admin-muted)]">Quantity</span>
            <input
              className="admin-input w-full"
              required
              inputMode="decimal"
              value={form.quantity}
              onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--admin-muted)]">Unit price (RWF)</span>
            <input
              className="admin-input w-full"
              required
              inputMode="numeric"
              value={form.unitPrice}
              onChange={(e) => setForm((f) => ({ ...f, unitPrice: e.target.value }))}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--admin-muted)]">Retail price (optional)</span>
            <input
              className="admin-input w-full"
              inputMode="numeric"
              value={form.retailPrice}
              onChange={(e) => setForm((f) => ({ ...f, retailPrice: e.target.value }))}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--admin-muted)]">Grade (optional)</span>
            <input
              className="admin-input w-full"
              placeholder="A / B / C"
              value={form.qualityGrade}
              onChange={(e) => setForm((f) => ({ ...f, qualityGrade: e.target.value }))}
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block text-[var(--admin-muted)]">Notes</span>
            <textarea
              className="admin-input min-h-[72px] w-full"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </label>
          <div className="sm:col-span-2">
            <Button type="submit" size="sm" disabled={busy === "create"}>
              Save market purchase
            </Button>
          </div>
        </form>
      ) : null}

      {loading ? (
        <p className="text-sm text-[var(--admin-muted)]">Loading market purchases…</p>
      ) : purchases.length === 0 ? (
        <div className="admin-panel p-6 text-sm text-[var(--admin-muted)]">
          No market purchases yet. Record a wholesale buy to track it independently of farmers.
        </div>
      ) : (
        <div className="space-y-3">
          {purchases.map((p) => (
            <article key={p.id} className="admin-panel space-y-2 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold">
                    {p.productName}{" "}
                    <span className="text-sm font-normal text-[var(--admin-muted)]">
                      · {p.purchaseNumber}
                    </span>
                  </h2>
                  <p className="text-sm text-[var(--admin-muted)]">
                    {p.marketName} · {p.vendorName} ·{" "}
                    {new Date(p.purchaseDate).toLocaleDateString()} · {p.quantity}{" "}
                    {formatUnit(p.unit)} @ {formatRwf(p.unitPrice)} = {formatRwf(p.totalAmount)}
                    {p.qualityGrade ? ` · Grade ${p.qualityGrade}` : ""}
                  </p>
                </div>
                <span
                  className={
                    p.status === "STOCKED"
                      ? "admin-status admin-status-ok"
                      : p.status === "CANCELLED"
                        ? "admin-status admin-status-muted"
                        : "admin-status admin-status-warn"
                  }
                >
                  {p.status}
                </span>
              </div>
              {p.inspectionNotes || p.notes ? (
                <p className="text-sm text-[var(--admin-muted)]">
                  {p.inspectionNotes || p.notes}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2 border-t border-[var(--admin-line)] pt-3">
                {p.status === "RECORDED" || p.status === "INSPECTED" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={busy === p.id}
                    onClick={() => inspect(p)}
                  >
                    Inspect / grade
                  </Button>
                ) : null}
                {p.status === "INSPECTED" ? (
                  <Button
                    type="button"
                    size="sm"
                    disabled={busy === p.id}
                    onClick={() => void act(p.id, "stock")}
                  >
                    Stock to inventory
                  </Button>
                ) : null}
                {p.status === "RECORDED" ? (
                  <span className="self-center text-xs text-[var(--admin-muted)]">
                    Inspect &amp; grade first
                  </span>
                ) : null}
                {p.status !== "STOCKED" && p.status !== "CANCELLED" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="danger"
                    disabled={busy === p.id}
                    onClick={() => void act(p.id, "cancel")}
                  >
                    Cancel
                  </Button>
                ) : null}
                {p.productId ? (
                  <span className="self-center text-xs text-[var(--admin-muted)]">
                    Linked product {p.productId.slice(0, 8)}…
                  </span>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
