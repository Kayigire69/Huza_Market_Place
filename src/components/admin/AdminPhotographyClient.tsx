"use client";

import { useCallback, useEffect, useState } from "react";
import { formatRwf, formatUnit } from "@/lib/utils";
import { AdminProductImages } from "@/components/admin/AdminProductImages";

type PhotoProduct = {
  id: string;
  nameEn: string;
  price: number;
  unit: string;
  stockQty: number;
  reviewStatus: string | null;
  isActive: boolean;
  updatedAt: string;
  category?: { nameEn?: string } | null;
  supplier?: {
    businessName?: string;
    phone?: string;
    user?: { fullName?: string; phone?: string } | null;
  } | null;
  images?: { id?: string; url: string; kind?: string; isCover?: boolean }[];
};

export function AdminPhotographyClient() {
  const [products, setProducts] = useState<PhotoProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/photography");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setProducts(Array.isArray(data.products) ? data.products : []);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="admin-panel-title">Photography Queue</h1>
        <p className="mt-1 text-sm text-[var(--admin-muted)]">
          Approved products missing customer-facing storefront photos
        </p>
      </div>

      {msg ? (
        <p className="rounded-lg border border-[var(--admin-line)] bg-[var(--admin-soft)] px-3 py-2 text-sm">
          {msg}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-[var(--admin-muted)]">Loading photography queue…</p>
      ) : products.length === 0 ? (
        <div className="admin-panel p-6 text-sm text-[var(--admin-muted)]">
          All approved products have storefront photos. Queue empty.
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((p) => (
            <article key={p.id} className="admin-panel space-y-3 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold">{p.nameEn}</h2>
                  <p className="text-sm text-[var(--admin-muted)]">
                    {p.supplier?.businessName || p.supplier?.user?.fullName || "Farmer"} ·{" "}
                    {p.category?.nameEn || "—"} · {formatRwf(p.price)}/{formatUnit(p.unit)} · stock{" "}
                    {p.stockQty}
                  </p>
                </div>
                <span className="admin-status admin-status-warn">Needs storefront photo</span>
              </div>

              <AdminProductImages
                productId={p.id}
                images={p.images || []}
                onDone={(m) => {
                  setMsg(m);
                  void load();
                }}
              />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
