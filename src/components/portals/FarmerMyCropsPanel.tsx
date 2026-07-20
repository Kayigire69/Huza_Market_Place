"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { OptimizedImage } from "@/components/media/OptimizedImage";
import { Button } from "@/components/ui/Button";
import { FarmerPanel } from "@/components/portals/FarmerUi";
import { farmerSupplyCategoryHint } from "@/lib/farmer-supply";
import { formatRwf, formatUnit } from "@/lib/utils";

type ProductImage = { id?: string; url: string; alt?: string | null };

export type FarmerCropProduct = {
  id: string;
  nameEn: string;
  price: number;
  unit: string;
  stockQty: number;
  reviewStatus?: string;
  reviewNote?: string | null;
  reviewedAt?: string | Date | null;
  qualityGeneral?: string | null;
  category?: { nameEn: string; slug?: string } | null;
  images?: ProductImage[];
};

type CropGroup = {
  key: string;
  name: string;
  unit: string;
  totalStock: number;
  avgPrice: number;
  category?: string | null;
  categorySlug?: string | null;
  latestStatus: string;
  photo?: string | null;
  items: FarmerCropProduct[];
};

function normalizeCropName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function groupCrops(products: FarmerCropProduct[]): CropGroup[] {
  const map = new Map<string, CropGroup>();
  for (const p of products) {
    const key = normalizeCropName(p.nameEn || "crop");
    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        key,
        name: p.nameEn,
        unit: p.unit,
        totalStock: Number(p.stockQty) || 0,
        avgPrice: Number(p.price) || 0,
        category: p.category?.nameEn ?? null,
        categorySlug: p.category?.slug ?? null,
        latestStatus: p.reviewStatus || "PENDING",
        photo: p.images?.[0]?.url ?? null,
        items: [p],
      });
      continue;
    }
    existing.totalStock += Number(p.stockQty) || 0;
    existing.items.push(p);
    existing.avgPrice =
      existing.items.reduce((sum, item) => sum + (Number(item.price) || 0), 0) / existing.items.length;
    if (!existing.photo && p.images?.[0]?.url) existing.photo = p.images[0].url;
    const rank = (s: string) => (s === "APPROVED" ? 3 : s === "PENDING" || !s ? 2 : 1);
    if (rank(p.reviewStatus || "PENDING") >= rank(existing.latestStatus)) {
      existing.latestStatus = p.reviewStatus || "PENDING";
    }
  }
  return Array.from(map.values()).sort((a, b) => b.totalStock - a.totalStock);
}

function statusTone(status: string) {
  if (status === "APPROVED") return "text-[var(--huza-green-dark)] bg-[var(--huza-mint)]";
  if (status === "REJECTED") return "text-red-800 bg-red-50";
  return "text-amber-800 bg-amber-50";
}

/**
 * Real farm supply view: one main crop in volume.
 * Prepared shop lines (salads, juices) never appear here.
 */
export function FarmerMyCropsPanel({ products: initial }: { products: FarmerCropProduct[] }) {
  const router = useRouter();
  const [products, setProducts] = useState(initial);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [showOtherCrops, setShowOtherCrops] = useState(false);

  const crops = useMemo(() => groupCrops(products), [products]);
  const main = crops[0];
  const otherCrops = crops.slice(1);

  const updateStock = async (id: string, stockQty: number) => {
    setBusyId(id);
    setMsg("");
    const res = await fetch(`/api/supplier/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stockQty }),
    });
    const data = await res.json().catch(() => ({}));
    setBusyId(null);
    if (!res.ok) {
      setMsg(data.error || "Could not update quantity");
      return;
    }
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, stockQty } : p)));
    setMsg("Available quantity updated");
    router.refresh();
  };

  if (!main) {
    return (
      <FarmerPanel className="max-w-2xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--huza-green-dark)]">
          Your farm supply
        </p>
        <h2 className="mt-2 font-[family-name:var(--font-display)] text-xl font-bold text-[var(--huza-ink)]">
          Register your main crop
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--huza-muted)]">
          Youth Huza partners usually grow <strong>one main crop</strong> in large volume, for
          example tomatoes, potatoes, bananas, or cabbage. Fruit salads and juices are prepared by
          HUZA FRESH, not by farmers.
        </p>
        <Link href="/farmer/products/submit" className="mt-5 inline-block">
          <Button>Submit my main crop</Button>
        </Link>
      </FarmerPanel>
    );
  }

  const lead = main.items[0];

  return (
    <div className="space-y-5">
      <FarmerPanel className="!p-4 border-[var(--huza-green)]/30 bg-gradient-to-br from-white to-[var(--huza-mint)]/40">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--huza-green-dark)]">
          How Youth Huza buys
        </p>
        <p className="mt-1 text-sm text-[var(--huza-muted)]">
          One main crop in large quantity. You do not need a shop catalog. Prepared items
          (fruit salads, juices) are made by HUZA FRESH after buying raw produce.
        </p>
      </FarmerPanel>

      {msg ? <p className="text-sm font-medium text-[var(--huza-green-dark)]">{msg}</p> : null}

      {/* Main crop. Hero */}
      <FarmerPanel className="border-[var(--huza-green)]/45 shadow-md">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--huza-green-dark)]">
          Main crop
        </p>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row">
          <div className="relative h-44 w-full shrink-0 overflow-hidden rounded-xl bg-[var(--huza-mint)] sm:h-48 sm:w-48">
            {main.photo ? (
              <OptimizedImage
                src={main.photo}
                alt={main.name}
                fill
                className="object-cover"
                sizes="192px"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-[var(--huza-muted)]">
                Add harvest photos
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--huza-ink)]">
                  {main.name}
                </h2>
                <p className="mt-1 text-sm text-[var(--huza-muted)]">
                  {farmerSupplyCategoryHint(main.categorySlug)} · {main.category || "Farm crop"}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusTone(main.latestStatus)}`}
              >
                {main.latestStatus}
              </span>
            </div>

            <div className="mt-5 rounded-2xl bg-[var(--huza-mint)] px-4 py-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--huza-muted)]">
                Available for Huza to buy
              </p>
              <p className="mt-1 font-[family-name:var(--font-display)] text-4xl font-bold tabular-nums text-[var(--huza-green-dark)]">
                {main.totalStock.toLocaleString()}
                <span className="ml-2 text-lg font-semibold">{formatUnit(main.unit)}</span>
              </p>
              <p className="mt-1 text-sm text-[var(--huza-muted)]">
                Asking {formatRwf(main.avgPrice)} / {formatUnit(main.unit)}
              </p>
            </div>

            {main.items.length === 1 ? (
              <form
                className="mt-4 flex flex-wrap items-end gap-2"
                onSubmit={(e: FormEvent<HTMLFormElement>) => {
                  e.preventDefault();
                  const form = new FormData(e.currentTarget);
                  updateStock(lead.id, Number(form.get("stockQty")));
                }}
              >
                <label className="text-xs font-semibold text-[var(--huza-muted)]">
                  Update harvest quantity
                  <input
                    name="stockQty"
                    type="number"
                    min={0}
                    step="1"
                    defaultValue={lead.stockQty}
                    className="input-field mt-1 w-44 text-lg font-semibold"
                    required
                  />
                </label>
                <Button type="submit" disabled={busyId === lead.id}>
                  {busyId === lead.id ? "Saving…" : "Save quantity"}
                </Button>
              </form>
            ) : (
              <div className="mt-4 space-y-2">
                <p className="text-xs text-[var(--huza-muted)]">
                  Same crop · {main.items.length} harvest batches (update each quantity):
                </p>
                {main.items.map((item) => (
                  <form
                    key={item.id}
                    className="flex flex-wrap items-end justify-between gap-2 rounded-lg border border-[var(--huza-line)] px-3 py-2"
                    onSubmit={(e: FormEvent<HTMLFormElement>) => {
                      e.preventDefault();
                      const form = new FormData(e.currentTarget);
                      updateStock(item.id, Number(form.get("stockQty")));
                    }}
                  >
                    <p className="text-xs font-medium text-[var(--huza-ink)]">
                      Batch · {item.reviewStatus || "PENDING"}
                    </p>
                    <div className="flex items-end gap-2">
                      <input
                        name="stockQty"
                        type="number"
                        min={0}
                        defaultValue={item.stockQty}
                        className="input-field w-28"
                        required
                      />
                      <Button type="submit" size="sm" disabled={busyId === item.id}>
                        Update
                      </Button>
                    </div>
                  </form>
                ))}
              </div>
            )}
          </div>
        </div>
      </FarmerPanel>

      {/* Other crops. Discouraged */}
      {otherCrops.length > 0 ? (
        <FarmerPanel className="max-w-2xl border-amber-200 bg-amber-50/50">
          <p className="text-sm font-semibold text-amber-950">
            You have {otherCrops.length} extra crop type{otherCrops.length === 1 ? "" : "s"} on file
          </p>
          <p className="mt-1 text-sm text-amber-900/90">
            Most Huza farm partners stick to <strong>one main crop</strong>. Extra lines are unusual.
            Only keep them if Huza specifically asked.
          </p>
          <button
            type="button"
            className="mt-3 text-sm font-bold text-[var(--huza-green-dark)] underline underline-offset-4"
            onClick={() => setShowOtherCrops((v) => !v)}
          >
            {showOtherCrops ? "Hide other crops" : "Show other crops"}
          </button>
          {showOtherCrops ? (
            <ul className="mt-3 space-y-2">
              {otherCrops.map((c) => (
                <li
                  key={c.key}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm"
                >
                  <span className="font-medium text-[var(--huza-ink)]">{c.name}</span>
                  <span className="text-[var(--huza-muted)]">
                    {c.totalStock.toLocaleString()} {formatUnit(c.unit)} · {c.latestStatus}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </FarmerPanel>
      ) : (
        <FarmerPanel className="max-w-2xl border-dashed">
          <p className="text-sm text-[var(--huza-muted)]">
            Need a second crop only if Huza requested it. Prefer updating quantity on your main crop
            after each harvest.
          </p>
          <Link
            href="/farmer/products/submit"
            className="mt-2 inline-block text-sm font-bold text-[var(--huza-green-dark)] underline underline-offset-4"
          >
            Request / submit another crop
          </Link>
        </FarmerPanel>
      )}
    </div>
  );
}
