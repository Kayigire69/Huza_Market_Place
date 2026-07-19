"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { FarmerPageHeader, FarmerPanel } from "@/components/portals/FarmerUi";
import { Button } from "@/components/ui/Button";
import { harvestReadiness } from "@/lib/harvest-estimate";

type Crop = {
  id: string;
  nameEn: string;
  plantingDate: string | null;
  expectedHarvestDate: string | null;
  expectedQty: number | null;
  actualQty: number | null;
  unit: string;
  growthStage: string | null;
  farmStatus: string | null;
  fertilizerUsed: string | null;
  pesticidesUsed: string | null;
  diseases: string | null;
  pests: string | null;
  irrigation: string | null;
  notes: string | null;
  productId: string | null;
  daysRemaining: number | null;
};

function readinessLabel(days: number | null) {
  const r = harvestReadiness(days);
  if (r === "ready") return "Ready to harvest";
  if (r === "soon") return "Harvest soon — HUZA preparing";
  if (r === "overdue") return "Past expected date";
  if (r === "growing") return "Still growing";
  return "Set planting date";
}

export function FarmerCropsClient() {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/supplier/crops");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not load crops");
      setLoading(false);
      return;
    }
    setCrops(data.crops || []);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const markHarvested = async (crop: Crop) => {
    const raw = window.prompt(
      "Actual harvested quantity (kg). Leave blank to keep expected amount.",
      crop.actualQty != null
        ? String(crop.actualQty)
        : crop.expectedQty != null
          ? String(crop.expectedQty)
          : ""
    );
    if (raw === null) return;
    setError("");
    setMsg("");
    const actualQty = raw.trim() === "" ? crop.actualQty : Number(raw);
    const res = await fetch("/api/supplier/crops", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: crop.id,
        growthStage: "harvested",
        actualQty: Number.isFinite(actualQty as number) ? actualQty : crop.actualQty,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not mark harvested");
      return;
    }
    setMsg("Marked as harvested. Next: send to My Produce when you are ready to sell to HUZA.");
    await load();
  };

  const onCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMsg("");
    setError("");
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/supplier/crops", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nameEn: form.get("nameEn"),
        plantingDate: form.get("plantingDate") || null,
        expectedHarvestDate: form.get("expectedHarvestDate") || null,
        expectedQty: form.get("expectedQty") || null,
        growthStage: form.get("growthStage") || "vegetative",
        farmStatus: form.get("farmStatus") || null,
        fertilizerUsed: form.get("fertilizerUsed") || null,
        pesticidesUsed: form.get("pesticidesUsed") || null,
        diseases: form.get("diseases") || null,
        pests: form.get("pests") || null,
        irrigation: form.get("irrigation") || null,
        notes: form.get("notes") || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Save failed");
      return;
    }
    setMsg("Crop saved. Expected harvest is calculated when you set a planting date.");
    setShowForm(false);
    (e.target as HTMLFormElement).reset();
    await load();
  };

  return (
    <div className="space-y-6">
      <FarmerPageHeader
        title="My Crops"
        subtitle="Track each crop through the season. After harvest, send it to My Produce so HUZA can inspect and buy — nothing is listed automatically."
        action={
          <Button type="button" size="sm" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Close" : "Add crop"}
          </Button>
        }
      />

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}
      {msg && (
        <p className="rounded-xl border border-[var(--huza-green)]/30 bg-[var(--huza-mint)]/40 px-4 py-3 text-sm text-[var(--huza-green-dark)]">
          {msg}
        </p>
      )}

      {showForm && (
        <FarmerPanel>
          <h2 className="font-bold text-[var(--huza-ink)]">Register a crop</h2>
          <form onSubmit={onCreate} className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block text-sm sm:col-span-2">
              <span className="font-semibold">Crop name</span>
              <input name="nameEn" className="input-field mt-1" required placeholder="e.g. Tomatoes" />
            </label>
            <label className="block text-sm">
              <span className="font-semibold">Planting date</span>
              <input name="plantingDate" type="date" className="input-field mt-1" />
            </label>
            <label className="block text-sm">
              <span className="font-semibold">Expected harvest (optional)</span>
              <input name="expectedHarvestDate" type="date" className="input-field mt-1" />
              <span className="mt-1 block text-xs text-[var(--huza-muted)]">
                Leave blank — we estimate from planting date.
              </span>
            </label>
            <label className="block text-sm">
              <span className="font-semibold">Expected quantity</span>
              <input name="expectedQty" type="number" min={1} className="input-field mt-1" />
            </label>
            <label className="block text-sm">
              <span className="font-semibold">Growth stage</span>
              <select name="growthStage" className="input-field mt-1" defaultValue="vegetative">
                <option value="nursery">Nursery</option>
                <option value="vegetative">Vegetative</option>
                <option value="flowering">Flowering</option>
                <option value="fruiting">Fruiting</option>
                <option value="ready">Ready</option>
                <option value="harvested">Harvested</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="font-semibold">Farm status</span>
              <select name="farmStatus" className="input-field mt-1" defaultValue="">
                <option value="">Select…</option>
                <option value="open_field">Open field</option>
                <option value="greenhouse">Greenhouse</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="font-semibold">Fertilizer used</span>
              <input name="fertilizerUsed" className="input-field mt-1" />
            </label>
            <label className="block text-sm">
              <span className="font-semibold">Pesticides used</span>
              <input name="pesticidesUsed" className="input-field mt-1" />
            </label>
            <label className="block text-sm">
              <span className="font-semibold">Diseases</span>
              <input name="diseases" className="input-field mt-1" />
            </label>
            <label className="block text-sm">
              <span className="font-semibold">Pests</span>
              <input name="pests" className="input-field mt-1" />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="font-semibold">Irrigation</span>
              <input name="irrigation" className="input-field mt-1" />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="font-semibold">Current notes</span>
              <textarea name="notes" className="input-field mt-1 min-h-[80px]" />
            </label>
            <div className="sm:col-span-2">
              <Button type="submit" className="w-full sm:w-auto" size="lg">
                Save crop
              </Button>
            </div>
          </form>
        </FarmerPanel>
      )}

      {loading ? (
        <p className="text-sm text-[var(--huza-muted)]">Loading crops…</p>
      ) : crops.length === 0 ? (
        <FarmerPanel>
          <p className="text-sm text-[var(--huza-muted)]">
            No crops yet. Add your first crop to track growth and harvest timing.
          </p>
        </FarmerPanel>
      ) : (
        <div className="grid gap-3">
          {crops.map((c) => (
            <FarmerPanel key={c.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-[var(--huza-ink)]">{c.nameEn}</h3>
                  <p className="mt-1 text-sm text-[var(--huza-muted)]">
                    Stage: {c.growthStage || "—"} ·{" "}
                    {c.farmStatus === "greenhouse"
                      ? "Greenhouse"
                      : c.farmStatus === "open_field"
                        ? "Open field"
                        : "Farm status —"}
                  </p>
                </div>
                <div className="rounded-xl bg-[var(--huza-mint)] px-3 py-2 text-right text-sm">
                  <p className="font-bold text-[var(--huza-green-dark)]">
                    {readinessLabel(c.daysRemaining)}
                  </p>
                  {c.daysRemaining !== null && (
                    <p className="text-xs text-[var(--huza-muted)]">
                      {c.daysRemaining} day(s) remaining
                    </p>
                  )}
                </div>
              </div>
              <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-[var(--huza-muted)]">Planted</dt>
                  <dd className="font-medium">
                    {c.plantingDate ? new Date(c.plantingDate).toLocaleDateString() : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[var(--huza-muted)]">Expected harvest</dt>
                  <dd className="font-medium">
                    {c.expectedHarvestDate
                      ? new Date(c.expectedHarvestDate).toLocaleDateString()
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[var(--huza-muted)]">Expected qty</dt>
                  <dd className="font-medium">
                    {c.expectedQty != null ? `${c.expectedQty} ${c.unit}` : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[var(--huza-muted)]">Actual qty</dt>
                  <dd className="font-medium">
                    {c.actualQty != null ? `${c.actualQty} ${c.unit}` : "—"}
                  </dd>
                </div>
              </dl>
              {(c.fertilizerUsed || c.pests || c.diseases || c.notes) && (
                <p className="mt-3 text-xs leading-relaxed text-[var(--huza-muted)]">
                  {[
                    c.fertilizerUsed && `Fertilizer: ${c.fertilizerUsed}`,
                    c.pesticidesUsed && `Pesticides: ${c.pesticidesUsed}`,
                    c.diseases && `Diseases: ${c.diseases}`,
                    c.pests && `Pests: ${c.pests}`,
                    c.irrigation && `Irrigation: ${c.irrigation}`,
                    c.notes && `Notes: ${c.notes}`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}

              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                {c.growthStage !== "harvested" && (
                  <Button type="button" size="sm" variant="secondary" onClick={() => markHarvested(c)}>
                    Mark as harvested
                  </Button>
                )}
                {c.productId ? (
                  <Link
                    href="/farmer/produce?tab=approvals"
                    className="inline-flex items-center justify-center rounded-xl border border-[var(--huza-line)] bg-white px-3 py-2 text-sm font-semibold text-[var(--huza-ink)]"
                  >
                    Already in My Produce →
                  </Link>
                ) : c.growthStage === "harvested" ? (
                  <Link
                    href={`/farmer/produce?tab=submit&fromCrop=${encodeURIComponent(c.id)}`}
                    className="inline-flex items-center justify-center rounded-xl bg-[var(--huza-green)] px-3 py-2 text-sm font-bold text-white"
                  >
                    Send to My Produce →
                  </Link>
                ) : (
                  <p className="text-xs text-[var(--huza-muted)]">
                    After harvest, mark as harvested, then send to My Produce for HUZA review.
                  </p>
                )}
              </div>
            </FarmerPanel>
          ))}
        </div>
      )}
    </div>
  );
}
