"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatRwf, formatUnit } from "@/lib/utils";
import { AdminProductImages } from "@/components/admin/AdminProductImages";

type ProductRow = {
  id: string;
  nameEn: string;
  price: number;
  stockQty: number;
  reservedQty?: number;
  unit: string;
  isActive: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  isOrganic: boolean;
  reviewStatus?: string | null;
  category?: { nameEn?: string } | null;
  supplier?: { businessName?: string } | null;
  images?: { id?: string; url: string; kind?: string; isCover?: boolean }[];
};

/**
 * Admin catalog: set retail prices and manage listing flags.
 * Huza staff. Not farmers. Control customer-facing prices.
 */
export function AdminCatalogPanel({
  products,
  onDone,
}: {
  products: ProductRow[];
  onDone: (msg: string) => void;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [prices, setPrices] = useState<Record<string, string>>(() =>
    Object.fromEntries(products.map((p) => [p.id, String(p.price)]))
  );

  const savePrice = async (id: string) => {
    setBusyId(id);
    const price = Number(prices[id]);
    const res = await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "update_price", price }),
    });
    const data = await res.json();
    setBusyId(null);
    onDone(res.ok ? `Price updated to ${formatRwf(price)}` : data.error || "Price update failed");
  };

  const toggleFlag = async (
    id: string,
    field: "isFeatured" | "isBestSeller" | "isActive",
    value: boolean
  ) => {
    setBusyId(id);
    const res = await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "update_flags", [field]: value }),
    });
    const data = await res.json().catch(() => ({}));
    setBusyId(null);
    onDone(res.ok ? "Listing flags updated" : (data as { error?: string }).error || "Update failed");
  };

  return (
    <div className="admin-panel p-5 space-y-4">
      <div>
        <h2 className="font-semibold text-lg">Catalog &amp; prices</h2>
      </div>

      {products.length === 0 ? (
        <p className="text-sm text-[var(--huza-muted)]">No products yet.</p>
      ) : (
        <div className="space-y-4">
          {products.map((p) => (
            <div key={p.id} className="rounded-xl border border-[var(--huza-line)] p-4 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{p.nameEn}</p>
                  <p className="text-xs text-[var(--huza-muted)]">
                    {p.category?.nameEn || "—"}
                    {p.isOrganic ? " · Organic" : ""}
                    {p.reviewStatus ? ` · ${p.reviewStatus}` : ""}
                    {!p.isActive ? " · Hidden" : ""}
                    {" · "}
                    {p.stockQty} {formatUnit(p.unit)}
                  </p>
                </div>
                <div className="flex flex-wrap items-end gap-2">
                  <div>
                    <label className="label">Retail price (RWF)</label>
                    <input
                      className="input-field max-w-[140px]"
                      type="number"
                      min={0}
                      value={prices[p.id] ?? String(p.price)}
                      onChange={(e) => setPrices((s) => ({ ...s, [p.id]: e.target.value }))}
                    />
                  </div>
                  <Button size="sm" disabled={busyId === p.id} onClick={() => savePrice(p.id)}>
                    Save price
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-xs">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={p.isActive}
                    disabled={busyId === p.id}
                    onChange={(e) => toggleFlag(p.id, "isActive", e.target.checked)}
                  />
                  Active on shop
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={p.isFeatured}
                    disabled={busyId === p.id}
                    onChange={(e) => toggleFlag(p.id, "isFeatured", e.target.checked)}
                  />
                  Featured
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={p.isBestSeller}
                    disabled={busyId === p.id}
                    onChange={(e) => toggleFlag(p.id, "isBestSeller", e.target.checked)}
                  />
                  Best seller
                </label>
              </div>

              <AdminProductImages
                productId={p.id}
                images={p.images || []}
                onDone={(msg) => {
                  onDone(msg);
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type Movement = {
  id: string;
  type: string;
  quantity: number;
  reason?: string | null;
  createdAt: string;
  product?: { nameEn?: string; stockQty?: number; unit?: string } | null;
};

/**
 * Admin stock in / stock out. Every change writes StockMovement + StockHistory.
 * Sales and warehouse receives also write movements automatically.
 */
export function AdminInventoryPanel({
  products,
  movements,
  onDone,
}: {
  products: ProductRow[];
  movements: Movement[];
  onDone: (msg: string) => void;
}) {
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    const form = new FormData(e.currentTarget);
    const action = String(form.get("action"));
    const res = await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: form.get("productId"),
        action,
        quantity: Number(form.get("quantity")),
        reason: form.get("reason"),
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (res.ok) {
      (e.target as HTMLFormElement).reset();
      onDone(action === "stock_in" ? "Stock in recorded" : "Stock out recorded");
    } else {
      onDone(data.error || "Stock update failed");
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <form onSubmit={submit} className="admin-panel p-5 space-y-3">
        <h2 className="font-semibold text-lg">Stock in / stock out</h2>
        <div>
          <label className="label">Product</label>
          <select name="productId" className="input-field" required>
            <option value="">Select product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nameEn} · {p.stockQty} {formatUnit(p.unit)}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Action</label>
            <select name="action" className="input-field" required>
              <option value="stock_in">Stock in (+)</option>
              <option value="stock_out">Stock out (−)</option>
            </select>
          </div>
          <div>
            <label className="label">Quantity</label>
            <input name="quantity" type="number" min={1} step={1} className="input-field" required />
          </div>
        </div>
        <div>
          <label className="label">Reason</label>
          <input
            name="reason"
            className="input-field"
            placeholder="e.g. Farm delivery count, spoilage, recount"
            required
          />
        </div>
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Post stock movement"}
        </Button>
      </form>

      <div className="admin-panel p-5">
        <h2 className="font-semibold text-lg mb-3">Recent stock movements</h2>
        <p className="text-xs text-[var(--huza-muted)] mb-3">
          Includes automatic SALE / RECEIVE rows from checkout and warehouse. Plus admin
          adjustments.
        </p>
        <div className="max-h-[420px] overflow-y-auto space-y-2">
          {movements.length === 0 ? (
            <p className="text-sm text-[var(--huza-muted)]">No movements yet.</p>
          ) : (
            movements.map((m) => (
              <div
                key={m.id}
                className="rounded-xl border border-[var(--huza-line)] px-3 py-2 text-sm"
              >
                <div className="flex justify-between gap-2">
                  <p className="font-medium">{m.product?.nameEn || "Product"}</p>
                  <p
                    className={
                      m.quantity >= 0
                        ? "font-semibold text-[var(--huza-green-dark)]"
                        : "font-semibold text-red-700"
                    }
                  >
                    {m.quantity >= 0 ? "+" : ""}
                    {m.quantity}
                  </p>
                </div>
                <p className="text-xs text-[var(--huza-muted)] mt-0.5">
                  {m.type} · {m.reason || "—"} · {new Date(m.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
