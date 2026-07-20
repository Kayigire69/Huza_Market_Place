"use client";

import Link from "next/link";
import { FarmerPageHeader, FarmerPanel } from "@/components/portals/FarmerUi";
import { useLocale } from "@/lib/locale-context";

const CATEGORIES = [
  { slug: "soil", titleKey: "trainingCatSoil", bodyKey: "trainingCatSoilBody" },
  { slug: "organic", titleKey: "trainingCatOrganic", bodyKey: "trainingCatOrganicBody" },
  { slug: "pests", titleKey: "trainingCatPests", bodyKey: "trainingCatPestsBody" },
  { slug: "fertilizer", titleKey: "trainingCatFertilizer", bodyKey: "trainingCatFertilizerBody" },
  { slug: "irrigation", titleKey: "trainingCatIrrigation", bodyKey: "trainingCatIrrigationBody" },
  { slug: "harvest", titleKey: "trainingCatHarvest", bodyKey: "trainingCatHarvestBody" },
  { slug: "post-harvest", titleKey: "trainingCatPostHarvest", bodyKey: "trainingCatPostHarvestBody" },
  { slug: "market", titleKey: "trainingCatMarket", bodyKey: "trainingCatMarketBody" },
] as const;

export function FarmerTrainingClient({ qualityFocus }: { qualityFocus: boolean }) {
  const { t } = useLocale();

  return (
    <div>
      <FarmerPageHeader title={t("trainingTitle")} />

      {qualityFocus ? (
        <FarmerPanel className="mb-5 max-w-2xl border-[var(--huza-green)]/35">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--huza-green-dark)]">
            {t("trainingFeatured")}
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold text-[var(--huza-ink)]">
            {t("trainingQualityTitle")}
          </h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--huza-ink)]">
            <li>{t("trainingQuality1")}</li>
            <li>{t("trainingQuality2")}</li>
            <li>{t("trainingQuality3")}</li>
            <li>{t("trainingQuality4")}</li>
            <li>{t("trainingQuality5")}</li>
          </ul>
          <Link
            href="/farmer/agronomy"
            className="mt-4 inline-block text-sm font-bold text-[var(--huza-green-dark)] underline underline-offset-4"
          >
            {t("trainingStillUnsure")}
          </Link>
        </FarmerPanel>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((c) => (
          <FarmerPanel key={c.slug} className="!p-4">
            <h3 className="font-semibold text-[var(--huza-ink)]">{t(c.titleKey)}</h3>
            <p className="mt-1 text-sm text-[var(--huza-muted)]">{t(c.bodyKey)}</p>
            <p className="mt-3 text-[11px] font-bold uppercase tracking-wide text-[var(--huza-green-dark)]">
              {t("trainingMeta")}
            </p>
          </FarmerPanel>
        ))}
      </div>

      <FarmerPanel className="mt-5 max-w-2xl">
        <p className="text-sm text-[var(--huza-muted)]">
          {t("trainingFooterBefore")}{" "}
          <Link href="/farmer/agronomy" className="font-bold text-[var(--huza-green-dark)] underline">
            {t("trainingFooterLink")}
          </Link>
          .
        </p>
      </FarmerPanel>
    </div>
  );
}
