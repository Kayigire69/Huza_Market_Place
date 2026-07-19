"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { FarmerPageHeader, FarmerPanel } from "@/components/portals/FarmerUi";
import { Button } from "@/components/ui/Button";
import { harvestReadiness } from "@/lib/harvest-estimate";
import { useLocale } from "@/lib/locale-context";

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

function fill(template: string, vars: Record<string, string | number>) {
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replace(new RegExp(`\\{${k}\\}`, "g"), String(v)),
    template
  );
}

export function FarmerCropsClient() {
  const { t } = useLocale();
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [showForm, setShowForm] = useState(false);

  const readinessLabel = (days: number | null) => {
    const r = harvestReadiness(days);
    if (r === "ready") return t("cropsReady");
    if (r === "soon") return t("cropsSoon");
    if (r === "overdue") return t("cropsOverdue");
    if (r === "growing") return t("cropsGrowing");
    return t("cropsSetPlanting");
  };

  const stageLabel = (stage: string | null) => {
    if (!stage) return "—";
    const map: Record<string, string> = {
      nursery: t("stageNursery"),
      vegetative: t("stageVegetative"),
      flowering: t("stageFlowering"),
      fruiting: t("stageFruiting"),
      ready: t("stageReady"),
      harvested: t("stageHarvested"),
    };
    return map[stage] || stage;
  };

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/supplier/crops");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || t("cropsLoadError"));
      setLoading(false);
      return;
    }
    setCrops(data.crops || []);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markHarvested = async (crop: Crop) => {
    const raw = window.prompt(
      t("cropsHarvestQtyPrompt"),
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
      setError(data.error || t("cropsHarvestError"));
      return;
    }
    setMsg(t("cropsHarvestedMsg"));
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
      setError(data.error || t("cropsSaveError"));
      return;
    }
    setMsg(t("cropsSavedMsg"));
    setShowForm(false);
    (e.target as HTMLFormElement).reset();
    await load();
  };

  return (
    <div className="space-y-6">
      <FarmerPageHeader
        title={t("cropsTitle")}
        subtitle={t("cropsSubtitle")}
        action={
          <Button type="button" size="sm" onClick={() => setShowForm((v) => !v)}>
            {showForm ? t("cropsClose") : t("cropsAdd")}
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
          <h2 className="font-bold text-[var(--huza-ink)]">{t("cropsRegisterTitle")}</h2>
          <form onSubmit={onCreate} className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block text-sm sm:col-span-2">
              <span className="font-semibold">{t("cropsName")}</span>
              <input
                name="nameEn"
                className="input-field mt-1"
                required
                placeholder={t("cropsNamePlaceholder")}
              />
            </label>
            <label className="block text-sm">
              <span className="font-semibold">{t("cropsPlantingDate")}</span>
              <input name="plantingDate" type="date" className="input-field mt-1" />
            </label>
            <label className="block text-sm">
              <span className="font-semibold">{t("cropsExpectedHarvestOpt")}</span>
              <input name="expectedHarvestDate" type="date" className="input-field mt-1" />
              <span className="mt-1 block text-xs text-[var(--huza-muted)]">
                {t("cropsExpectedHarvestHint")}
              </span>
            </label>
            <label className="block text-sm">
              <span className="font-semibold">{t("cropsExpectedQty")}</span>
              <input name="expectedQty" type="number" min={1} className="input-field mt-1" />
            </label>
            <label className="block text-sm">
              <span className="font-semibold">{t("cropsGrowthStage")}</span>
              <select name="growthStage" className="input-field mt-1" defaultValue="vegetative">
                <option value="nursery">{t("stageNursery")}</option>
                <option value="vegetative">{t("stageVegetative")}</option>
                <option value="flowering">{t("stageFlowering")}</option>
                <option value="fruiting">{t("stageFruiting")}</option>
                <option value="ready">{t("stageReady")}</option>
                <option value="harvested">{t("stageHarvested")}</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="font-semibold">{t("cropsFarmStatus")}</span>
              <select name="farmStatus" className="input-field mt-1" defaultValue="">
                <option value="">{t("cropsSelect")}</option>
                <option value="open_field">{t("fieldOpen")}</option>
                <option value="greenhouse">{t("fieldGreenhouse")}</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="font-semibold">{t("cropsFertilizer")}</span>
              <input name="fertilizerUsed" className="input-field mt-1" />
            </label>
            <label className="block text-sm">
              <span className="font-semibold">{t("cropsPesticides")}</span>
              <input name="pesticidesUsed" className="input-field mt-1" />
            </label>
            <label className="block text-sm">
              <span className="font-semibold">{t("cropsDiseases")}</span>
              <input name="diseases" className="input-field mt-1" />
            </label>
            <label className="block text-sm">
              <span className="font-semibold">{t("cropsPests")}</span>
              <input name="pests" className="input-field mt-1" />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="font-semibold">{t("cropsIrrigation")}</span>
              <input name="irrigation" className="input-field mt-1" />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="font-semibold">{t("cropsNotes")}</span>
              <textarea name="notes" className="input-field mt-1 min-h-[80px]" />
            </label>
            <div className="sm:col-span-2">
              <Button type="submit" className="w-full sm:w-auto" size="lg">
                {t("cropsSave")}
              </Button>
            </div>
          </form>
        </FarmerPanel>
      )}

      {loading ? (
        <p className="text-sm text-[var(--huza-muted)]">{t("cropsLoading")}</p>
      ) : crops.length === 0 ? (
        <FarmerPanel>
          <p className="text-sm text-[var(--huza-muted)]">{t("cropsEmpty")}</p>
        </FarmerPanel>
      ) : (
        <div className="grid gap-3">
          {crops.map((c) => (
            <FarmerPanel key={c.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-[var(--huza-ink)]">{c.nameEn}</h3>
                  <p className="mt-1 text-sm text-[var(--huza-muted)]">
                    {t("cropsStage")}: {stageLabel(c.growthStage)} ·{" "}
                    {c.farmStatus === "greenhouse"
                      ? t("fieldGreenhouse")
                      : c.farmStatus === "open_field"
                        ? t("fieldOpen")
                        : t("cropsFarmStatusDash")}
                  </p>
                </div>
                <div className="rounded-xl bg-[var(--huza-mint)] px-3 py-2 text-right text-sm">
                  <p className="font-bold text-[var(--huza-green-dark)]">
                    {readinessLabel(c.daysRemaining)}
                  </p>
                  {c.daysRemaining !== null && (
                    <p className="text-xs text-[var(--huza-muted)]">
                      {fill(t("cropsDaysRemaining"), { n: c.daysRemaining })}
                    </p>
                  )}
                </div>
              </div>
              <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-[var(--huza-muted)]">{t("cropsPlanted")}</dt>
                  <dd className="font-medium">
                    {c.plantingDate ? new Date(c.plantingDate).toLocaleDateString() : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[var(--huza-muted)]">{t("cropsExpectedHarvest")}</dt>
                  <dd className="font-medium">
                    {c.expectedHarvestDate
                      ? new Date(c.expectedHarvestDate).toLocaleDateString()
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[var(--huza-muted)]">{t("cropsExpectedQtyShort")}</dt>
                  <dd className="font-medium">
                    {c.expectedQty != null ? `${c.expectedQty} ${c.unit}` : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[var(--huza-muted)]">{t("cropsActualQty")}</dt>
                  <dd className="font-medium">
                    {c.actualQty != null ? `${c.actualQty} ${c.unit}` : "—"}
                  </dd>
                </div>
              </dl>
              {(c.fertilizerUsed || c.pests || c.diseases || c.notes) && (
                <p className="mt-3 text-xs leading-relaxed text-[var(--huza-muted)]">
                  {[
                    c.fertilizerUsed && `${t("cropsFertilizer")}: ${c.fertilizerUsed}`,
                    c.pesticidesUsed && `${t("cropsPesticides")}: ${c.pesticidesUsed}`,
                    c.diseases && `${t("cropsDiseases")}: ${c.diseases}`,
                    c.pests && `${t("cropsPests")}: ${c.pests}`,
                    c.irrigation && `${t("cropsIrrigation")}: ${c.irrigation}`,
                    c.notes && `${t("cropsNotes")}: ${c.notes}`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}

              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                {c.growthStage !== "harvested" && (
                  <Button type="button" size="sm" variant="secondary" onClick={() => markHarvested(c)}>
                    {t("cropsMarkHarvested")}
                  </Button>
                )}
                {c.productId ? (
                  <Link
                    href="/farmer/produce?tab=approvals"
                    className="inline-flex items-center justify-center rounded-xl border border-[var(--huza-line)] bg-white px-3 py-2 text-sm font-semibold text-[var(--huza-ink)]"
                  >
                    {t("cropsAlreadyInProduce")}
                  </Link>
                ) : c.growthStage === "harvested" ? (
                  <Link
                    href={`/farmer/produce?tab=submit&fromCrop=${encodeURIComponent(c.id)}`}
                    className="inline-flex items-center justify-center rounded-xl bg-[var(--huza-green)] px-3 py-2 text-sm font-bold text-white"
                  >
                    {t("cropsSendToProduce")}
                  </Link>
                ) : (
                  <p className="text-xs text-[var(--huza-muted)]">{t("cropsAfterHarvestHint")}</p>
                )}
              </div>
            </FarmerPanel>
          ))}
        </div>
      )}
    </div>
  );
}
