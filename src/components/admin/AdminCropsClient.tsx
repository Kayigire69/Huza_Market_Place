"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Search } from "lucide-react";

type CropRow = {
  id: string;
  nameEn: string;
  plantingDate: string | null;
  expectedHarvestDate: string | null;
  expectedQty: number | null;
  actualQty: number | null;
  unit: string;
  growthStage: string | null;
  farmStatus: string | null;
  diseases: string | null;
  pests: string | null;
  notes: string | null;
  productId: string | null;
  product: {
    id: string;
    nameEn: string;
    reviewStatus: string | null;
    isActive: boolean;
  } | null;
  supplier: {
    id: string;
    businessName: string;
    district: string;
    phone: string;
    status: string;
    user: { fullName: string; phone: string } | null;
  };
};

type FilterKey = "all" | "harvest_soon" | "ready" | "harvested";

function parseFilter(raw: string | null): FilterKey {
  if (raw === "harvest_soon" || raw === "ready" || raw === "harvested") return raw;
  return "all";
}

export function AdminCropsClient() {
  const searchParams = useSearchParams();
  const [crops, setCrops] = useState<CropRow[]>([]);
  const [counts, setCounts] = useState({ total: 0, harvestSoon: 0, ready: 0 });
  const [filter, setFilter] = useState<FilterKey>(() => parseFilter(searchParams.get("filter")));
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setFilter(parseFilter(searchParams.get("filter")));
  }, [searchParams]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ filter });
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`/api/admin/crops?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setCrops(Array.isArray(data.crops) ? data.crops : []);
      setCounts(data.counts || { total: 0, harvestSoon: 0, ready: 0 });
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [filter, q]);

  useEffect(() => {
    void load();
  }, [load]);

  const filters: { id: FilterKey; label: string }[] = [
    { id: "all", label: `All (${counts.total})` },
    { id: "harvest_soon", label: `Harvest soon (${counts.harvestSoon})` },
    { id: "ready", label: `Ready (${counts.ready})` },
    { id: "harvested", label: "Harvested" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="admin-panel-title">Crop Monitoring</h1>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {filters.map((f) => (
          <Button
            key={f.id}
            type="button"
            size="sm"
            variant={filter === f.id ? "primary" : "ghost"}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </Button>
        ))}
        <div className="relative ml-auto min-w-[200px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[var(--admin-muted)]" />
          <input
            className="admin-input w-full pl-8"
            placeholder="Search crop or farmer…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {msg ? (
        <p className="rounded-lg border border-[var(--admin-line)] bg-[var(--admin-soft)] px-3 py-2 text-sm">
          {msg}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-[var(--admin-muted)]">Loading crops…</p>
      ) : crops.length === 0 ? (
        <div className="admin-panel p-6 text-sm text-[var(--admin-muted)]">
          No crops match this filter.
        </div>
      ) : (
        <div className="admin-panel overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--admin-line)] text-[11px] uppercase tracking-wide text-[var(--admin-muted)]">
                <th className="px-3 py-2 font-semibold">Crop</th>
                <th className="px-3 py-2 font-semibold">Farmer</th>
                <th className="px-3 py-2 font-semibold">Stage</th>
                <th className="px-3 py-2 font-semibold">Expected harvest</th>
                <th className="px-3 py-2 font-semibold">Qty</th>
                <th className="px-3 py-2 font-semibold">Listing</th>
              </tr>
            </thead>
            <tbody>
              {crops.map((c) => (
                <tr key={c.id} className="border-b border-[var(--admin-line)] last:border-0">
                  <td className="px-3 py-3">
                    <p className="font-medium">{c.nameEn}</p>
                    {c.farmStatus ? (
                      <p className="text-xs text-[var(--admin-muted)]">{c.farmStatus}</p>
                    ) : null}
                    {c.diseases || c.pests ? (
                      <p className="mt-1 text-xs text-amber-800">
                        {[c.diseases, c.pests].filter(Boolean).join(" · ")}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-3 py-3">
                    <Link
                      href={`/admin/suppliers?id=${c.supplier.id}`}
                      className="font-medium text-[var(--admin-ink)] underline-offset-2 hover:underline"
                    >
                      {c.supplier.businessName}
                    </Link>
                    <p className="text-xs text-[var(--admin-muted)]">
                      {c.supplier.user?.fullName || "—"} · {c.supplier.district}
                    </p>
                  </td>
                  <td className="px-3 py-3">
                    <span className="admin-status">{c.growthStage || "—"}</span>
                  </td>
                  <td className="px-3 py-3 text-[var(--admin-muted)]">
                    {c.expectedHarvestDate
                      ? new Date(c.expectedHarvestDate).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-3 py-3 text-[var(--admin-muted)]">
                    {c.expectedQty != null ? `${c.expectedQty} ${c.unit}` : "—"}
                    {c.actualQty != null ? ` · actual ${c.actualQty}` : ""}
                  </td>
                  <td className="px-3 py-3 text-[var(--admin-muted)]">
                    {c.product ? (
                      <span>
                        {c.product.nameEn}
                        {c.product.reviewStatus ? ` · ${c.product.reviewStatus}` : ""}
                      </span>
                    ) : (
                      "Not submitted"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
