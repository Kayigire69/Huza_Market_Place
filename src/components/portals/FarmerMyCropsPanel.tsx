"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { OptimizedImage } from "@/components/media/OptimizedImage";
import { Button } from "@/components/ui/Button";
import { FarmerPanel } from "@/components/portals/FarmerUi";
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
  category?: { nameEn: string } | null;
  images?: ProductImage[];
};

type CropGroup = {
  key: string;
  name: string;
  unit: string;
  totalStock: number;
  avgPrice: number;
  category?: string | null;
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
    // Prefer APPROVED, then PENDING, else latest rejection shown if all rejected
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
 * Volume-first crop supply view.
 * Most Huza farmers supply one crop (or a few) in large quantity — not a product catalog.
 */
export function FarmerMyCropsPanel({ products: initial }: { products: FarmerCropProduct[] }) {
  const router = useRouter();
  const [products, setProducts] = useState(initial);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const crops = useMemo(() => groupCrops(products), [products]);
  const primary = crops[0];
  const totalVolume = crops.reduce((n, c) => n + c.totalStock, 0);

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

  if (crops.length === 0) {
    return (
      <FarmerPanel className="max-w-2xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--huza-green-dark)]">
          Your harvest supply
        </p>
        <h2 className="mt-2 font-[family-name:var(--font-display)] text-xl font-bold text-[var(--huza-ink)]">
          Start with your main crop
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--huza-muted)]">
          Most Youth Huza partners sell <strong>one crop in large quantity</strong> (for example tomatoes,
          bananas, or cabbage) — not a shop full of many small items. Submit your main harvest and keep
          the available quantity up to date.
        </p>
        <Link href="/farmer/products/submit" className="mt-5 inline-block">
          <Button>Submit my main crop</Button>
        </Link>
      </FarmerPanel>
    );
  }

  return (
    <div className="space-y-5">
      <FarmerPanel className="!p-4 sm:!p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--huza-muted)]">
              Harvest supply
            </p>
            <p className="mt-1 text-sm text-[var(--huza-muted)]">
              {crops.length === 1
                ? "You are set up as a single-crop supplier — update quantity when harvest changes."
                : `${crops.length} crops on record. Most partners keep one main crop and large volume.`}
            </p>
          </div>
          <div className="rounded-xl bg-[var(--huza-mint)] px-4 py-2 text-right">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--huza-muted)]">
              Total available
            </p>
            <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--huza-green-dark)]">
              {totalVolume.toLocaleString()}
              <span className="ml-1 text-sm font-semibold">
                {formatUnit(primary?.unit || "kg")}
              </span>
            </p>
          </div>
        </div>
      </FarmerPanel>

      {msg ? <p className="text-sm font-medium text-[var(--huza-green-dark)]">{msg}</p> : null}

      <div className="space-y-4">
        {crops.map((crop, index) => {
          const lead = crop.items[0];
          return (
            <FarmerPanel
              key={crop.key}
              className={index === 0 ? "border-[var(--huza-green)]/40 shadow-md" : ""}
            >
              {index === 0 && crops.length > 1 ? (
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--huza-green-dark)]">
                  Main crop
                </p>
              ) : null}

              <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch">
                <div className="relative h-36 w-full shrink-0 overflow-hidden rounded-xl bg-[var(--huza-mint)] sm:h-40 sm:w-40">
                  {crop.photo ? (
                    <OptimizedImage
                      src={crop.photo}
                      alt={crop.name}
                      fill
                      className="object-cover"
                      sizes="160px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-[var(--huza-muted)]">
                      No photo
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--huza-ink)]">
                        {crop.name}
                      </h2>
                      <p className="mt-1 text-sm text-[var(--huza-muted)]">
                        {crop.category || "Crop"} · Asking {formatRwf(crop.avgPrice)}/
                        {formatUnit(crop.unit)}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusTone(crop.latestStatus)}`}
                    >
                      {crop.latestStatus}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 sm:max-w-md">
                    <div className="rounded-xl bg-[var(--huza-mint)]/60 px-3 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--huza-muted)]">
                        Available quantity
                      </p>
                      <p className="mt-0.5 font-[family-name:var(--font-display)] text-3xl font-bold tabular-nums text-[var(--huza-green-dark)]">
                        {crop.totalStock.toLocaleString()}
                      </p>
                      <p className="text-xs font-semibold text-[var(--huza-muted)]">
                        {formatUnit(crop.unit)} ready for Huza
                      </p>
                    </div>
                    <div className="rounded-xl border border-[var(--huza-line)] px-3 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--huza-muted)]">
                        Supply style
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[var(--huza-ink)]">
                        Volume supplier
                      </p>
                      <p className="mt-1 text-xs text-[var(--huza-muted)]">
                        Focus on quantity of this crop, not many SKUs.
                      </p>
                    </div>
                  </div>

                  {crop.items.length === 1 ? (
                    <form
                      className="mt-4 flex flex-wrap items-end gap-2"
                      onSubmit={(e: FormEvent<HTMLFormElement>) => {
                        e.preventDefault();
                        const form = new FormData(e.currentTarget);
                        updateStock(lead.id, Number(form.get("stockQty")));
                      }}
                    >
                      <label className="text-xs font-semibold text-[var(--huza-muted)]">
                        Update available quantity
                        <input
                          name="stockQty"
                          type="number"
                          min={0}
                          step="1"
                          defaultValue={lead.stockQty}
                          className="input-field mt-1 w-40"
                          required
                        />
                      </label>
                      <Button type="submit" size="sm" disabled={busyId === lead.id}>
                        {busyId === lead.id ? "Saving…" : "Save quantity"}
                      </Button>
                    </form>
                  ) : (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs text-[var(--huza-muted)]">
                        Combined from {crop.items.length} harvest submissions of the same crop:
                      </p>
                      {crop.items.map((item) => (
                        <form
                          key={item.id}
                          className="flex flex-wrap items-end justify-between gap-2 rounded-lg border border-[var(--huza-line)] px-3 py-2"
                          onSubmit={(e: FormEvent<HTMLFormElement>) => {
                            e.preventDefault();
                            const form = new FormData(e.currentTarget);
                            updateStock(item.id, Number(form.get("stockQty")));
                          }}
                        >
                          <div className="text-xs">
                            <p className="font-medium text-[var(--huza-ink)]">
                              Batch · {item.reviewStatus || "PENDING"}
                            </p>
                            <p className="text-[var(--huza-muted)]">
                              {formatRwf(item.price)}/{formatUnit(item.unit)}
                            </p>
                          </div>
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
          );
        })}
      </div>

      <FarmerPanel className="max-w-2xl border-dashed">
        <p className="text-sm text-[var(--huza-muted)]">
          Need to offer a <strong>different crop</strong>? Most farmers keep one main crop. Only submit
          another if Huza asked for a second harvest type.
        </p>
        <Link
          href="/farmer/products/submit"
          className="mt-3 inline-block text-sm font-bold text-[var(--huza-green-dark)] underline underline-offset-4"
        >
          Submit another crop
        </Link>
      </FarmerPanel>
    </div>
  );
}
