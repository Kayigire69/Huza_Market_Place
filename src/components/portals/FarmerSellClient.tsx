"use client";

import Link from "next/link";
import { ArrowRight, Handshake, ShoppingCart } from "lucide-react";
import { FarmerPageHeader, FarmerPanel } from "@/components/portals/FarmerUi";
import { useLocale } from "@/lib/locale-context";

export function FarmerSellClient() {
  const { t } = useLocale();

  const directSteps = [
    t("sellStepSubmit"),
    t("sellStepInspect"),
    t("sellStepPrice"),
    t("sellStepPayFull"),
    t("sellStepOwnership"),
  ];
  const partnerSteps = [
    t("sellStepSubmit"),
    t("sellStepInspect"),
    t("sellStepListed"),
    t("sellStepSales"),
    t("sellStepCommission"),
  ];
  const grades = [
    { g: t("sellGrade1"), d: t("sellGrade1d") },
    { g: t("sellGrade2"), d: t("sellGrade2d") },
    { g: t("sellGrade3"), d: t("sellGrade3d") },
  ];

  return (
    <div className="space-y-6">
      <FarmerPageHeader title={t("sellTitle")} />

      <div className="grid gap-4 lg:grid-cols-2">
        <FarmerPanel className="border-[var(--huza-green)]/40 bg-[var(--huza-mint)]/25">
          <div className="flex items-start gap-3">
            <span className="rounded-xl bg-white p-2.5 shadow-sm">
              <ShoppingCart className="size-6 text-[var(--huza-green-dark)]" />
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--huza-green-dark)]">
                {t("sellOptionA")}
              </p>
              <h2 className="mt-1 text-xl font-bold text-[var(--huza-ink)]">{t("sellDirectTitle")}</h2>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-[var(--huza-muted)]">{t("sellDirectBody")}</p>
          <ol className="mt-4 space-y-2 text-sm text-[var(--huza-ink)]">
            {directSteps.map((step, i) => (
              <li key={step} className="flex gap-2">
                <span className="font-bold text-[var(--huza-green-dark)]">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-xs text-[var(--huza-muted)]">
            {t("sellDirectPayNote")}{" "}
            <strong className="text-[var(--huza-ink)]">{t("sellNoCommission")}</strong>
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Link
              href="/farmer/produce?tab=submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--huza-green)] px-4 py-3 text-sm font-bold text-white"
            >
              {t("sellCtaDirect")} <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/farmer/sales"
              className="inline-flex items-center justify-center rounded-xl border border-[var(--huza-line)] bg-white px-4 py-3 text-sm font-semibold text-[var(--huza-ink)]"
            >
              {t("sellViewOrders")}
            </Link>
          </div>
        </FarmerPanel>

        <FarmerPanel className="border-[#c9a227]/50 bg-[#FFF8E6]/60">
          <div className="flex items-start gap-3">
            <span className="rounded-xl bg-white p-2.5 shadow-sm">
              <Handshake className="size-6 text-[#8a6a10]" />
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8a6a10]">
                {t("sellOptionB")}
              </p>
              <h2 className="mt-1 text-xl font-bold text-[var(--huza-ink)]">{t("sellPartnerTitle")}</h2>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-[var(--huza-muted)]">{t("sellPartnerBody")}</p>
          <ol className="mt-4 space-y-2 text-sm text-[var(--huza-ink)]">
            {partnerSteps.map((step, i) => (
              <li key={step} className="flex gap-2">
                <span className="font-bold text-[#8a6a10]">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-xs text-[var(--huza-muted)]">{t("sellPartnerTrackNote")}</p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Link
              href="/farmer/produce?tab=submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#c9a227] px-4 py-3 text-sm font-bold text-[var(--huza-ink)]"
            >
              {t("sellCtaPartner")} <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/farmer/sales?tab=payments"
              className="inline-flex items-center justify-center rounded-xl border border-[var(--huza-line)] bg-white px-4 py-3 text-sm font-semibold text-[var(--huza-ink)]"
            >
              {t("sellPartnerPayments")}
            </Link>
          </div>
        </FarmerPanel>
      </div>

      <FarmerPanel>
        <h3 className="font-bold text-[var(--huza-ink)]">{t("sellGradesTitle")}</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {grades.map((x) => (
            <div key={x.g} className="rounded-xl bg-[var(--huza-mint)]/40 px-3 py-3 text-sm">
              <p className="font-bold text-[var(--huza-green-dark)]">{x.g}</p>
              <p className="mt-1 text-[var(--huza-muted)]">{x.d}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-[var(--huza-muted)]">{t("sellGradesNote")}</p>
      </FarmerPanel>
    </div>
  );
}
