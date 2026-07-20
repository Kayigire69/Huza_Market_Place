"use client";

import Link from "next/link";
import { FarmerPageHeader, FarmerPanel } from "@/components/portals/FarmerUi";
import { useLocale } from "@/lib/locale-context";
import { formatRwf } from "@/lib/utils";

type PoTip = {
  id: string;
  productName: string | null;
  poNumber: string;
  rejectionReason: string | null;
  recommendation: string | null;
};

type Props = {
  businessName: string;
  ratingAvg: number;
  totalEarnings: number;
  qtySold: number;
  commissionFees: number;
  outstanding: number;
  paidCount: number;
  commissionSettledCount: number;
  rejectedPoCount: number;
  poCount: number;
  approved: number;
  rejected: number;
  acceptanceRate: number | null;
  score: number | null;
  recentTips: PoTip[];
};

function bandKeys(score: number) {
  if (score >= 85) return { label: "reportsBandExcellent", hint: "reportsBandExcellentHint" };
  if (score >= 70) return { label: "reportsBandGood", hint: "reportsBandGoodHint" };
  if (score >= 50) return { label: "reportsBandNeedsWork", hint: "reportsBandNeedsWorkHint" };
  return { label: "reportsBandAtRisk", hint: "reportsBandAtRiskHint" };
}

export function FarmerReportsClient(props: Props) {
  const { t } = useLocale();
  const band = props.score != null ? bandKeys(props.score) : null;

  return (
    <div>
      <FarmerPageHeader title={t("reportsTitle")} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <FarmerPanel className="!p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--huza-muted)]">
            {t("reportsTotalEarnings")}
          </p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--huza-green-dark)]">
            {formatRwf(props.totalEarnings)}
          </p>
        </FarmerPanel>
        <FarmerPanel className="!p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--huza-muted)]">
            {t("reportsQtySold")}
          </p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--huza-ink)]">
            {props.qtySold.toLocaleString()}
          </p>
        </FarmerPanel>
        <FarmerPanel className="!p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--huza-muted)]">
            {t("reportsCommissionPaid")}
          </p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--huza-ink)]">
            {formatRwf(props.commissionFees)}
          </p>
        </FarmerPanel>
        <FarmerPanel className="!p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--huza-muted)]">
            {t("reportsOutstanding")}
          </p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-amber-900">
            {formatRwf(props.outstanding)}
          </p>
        </FarmerPanel>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <FarmerPanel>
          <h2 className="font-semibold text-[var(--huza-ink)]">{t("reportsSalesTitle")}</h2>
          <ul className="mt-3 space-y-2 text-sm text-[var(--huza-ink)]">
            <li className="flex justify-between gap-3">
              <span>{t("reportsPaidPos")}</span>
              <strong>{props.paidCount}</strong>
            </li>
            <li className="flex justify-between gap-3">
              <span>{t("reportsCommissionSettled")}</span>
              <strong>{props.commissionSettledCount}</strong>
            </li>
            <li className="flex justify-between gap-3">
              <span>{t("reportsRejectedPos")}</span>
              <strong>{props.rejectedPoCount}</strong>
            </li>
          </ul>
        </FarmerPanel>

        <FarmerPanel>
          <h2 className="font-semibold text-[var(--huza-ink)]">{t("reportsScoreTitle")}</h2>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <p className="font-[family-name:var(--font-display)] text-4xl font-bold text-[var(--huza-green-dark)]">
              {props.score != null ? props.score : "—"}
              <span className="ml-1 text-base font-semibold text-[var(--huza-muted)]">/ 100</span>
            </p>
            <span className="rounded-lg bg-[var(--huza-mint)] px-2.5 py-1 text-xs font-bold text-[var(--huza-green-dark)]">
              {band ? t(band.label) : t("reportsNotScored")}
            </span>
          </div>
          <p className="mt-2 text-sm text-[var(--huza-muted)]">
            {band ? t(band.hint) : t("reportsScoreUnlock")}
          </p>
          <ul className="mt-3 space-y-2 text-sm text-[var(--huza-ink)]">
            <li className="flex justify-between gap-3">
              <span>{t("reportsProductsApproved")}</span>
              <strong>{props.approved}</strong>
            </li>
            <li className="flex justify-between gap-3">
              <span>{t("reportsProductsRejected")}</span>
              <strong>{props.rejected}</strong>
            </li>
            <li className="flex justify-between gap-3">
              <span>{t("reportsAcceptanceRate")}</span>
              <strong>{props.acceptanceRate != null ? `${props.acceptanceRate}%` : "—"}</strong>
            </li>
            <li className="flex justify-between gap-3">
              <span>{t("reportsPoFrequency")}</span>
              <strong>{props.poCount}</strong>
            </li>
            <li className="flex justify-between gap-3">
              <span>{t("reportsQualityRating")}</span>
              <strong>
                {props.ratingAvg > 0
                  ? `${props.ratingAvg.toFixed(1)} / 5`
                  : t("reportsNotRated")}
              </strong>
            </li>
          </ul>
          {props.recentTips.length > 0 ? (
            <div className="mt-4 space-y-2 border-t border-[var(--huza-line)] pt-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--huza-muted)]">
                {t("reportsRecentTips")}
              </p>
              {props.recentTips.map((po) => (
                <p key={po.id} className="text-sm text-[var(--huza-ink)]">
                  <strong>{po.productName || po.poNumber}:</strong>{" "}
                  {po.recommendation || po.rejectionReason}
                </p>
              ))}
            </div>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/farmer/training?topic=quality-standards"
              className="inline-flex rounded-xl bg-[var(--huza-green)] px-3 py-2 text-sm font-bold text-white"
            >
              {t("reportsImproveQuality")}
            </Link>
            <Link
              href="/farmer/agronomy"
              className="inline-flex rounded-xl border border-[var(--huza-line)] bg-white px-3 py-2 text-sm font-semibold text-[var(--huza-ink)]"
            >
              {t("reportsAskAgronomist")}
            </Link>
          </div>
        </FarmerPanel>
      </div>
    </div>
  );
}
