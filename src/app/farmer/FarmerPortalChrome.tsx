"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useLocale } from "@/lib/locale-context";
import { FarmerLandingPage } from "./FarmerLandingPage";

type LandingProps = {
  mode: "landing";
  children?: ReactNode;
};

type RegisterProps = {
  mode: "register";
  children: ReactNode;
};

type ApplyProps = {
  mode: "apply";
};

type DashboardProps = {
  mode: "dashboard";
  businessName: string;
  status: string;
  isVerified: boolean;
  farmingType?: string | null;
  rejectionReason?: string | null;
  adminNotes?: string | null;
  inspectionScheduledAt?: string | null;
  listed: number;
  children: ReactNode;
};

export type FarmerPortalChromeProps =
  | LandingProps
  | RegisterProps
  | ApplyProps
  | DashboardProps;

function farmingTypeLabel(t: (k: string) => string, farmingType?: string | null) {
  if (farmingType === "STANDARD") return t("standardFarmerPath");
  if (farmingType === "CONVERSION") return t("conversionFarmerPath");
  return t("organicFarmerPath");
}

export function FarmerPortalChrome(props: FarmerPortalChromeProps) {
  const { t } = useLocale();

  if (props.mode === "landing") {
    return <FarmerLandingPage />;
  }

  if (props.mode === "register") {
    return (
      <div className="mx-auto max-w-xl px-3 py-4 sm:max-w-3xl sm:px-4 sm:py-10">
        <div className="text-center">
          <h1 className="text-lg font-bold text-[var(--huza-ink)] sm:text-2xl">{t("farmerPortal")}</h1>
          <p className="mt-1 text-xs text-[var(--huza-muted)] sm:mt-2 sm:text-sm">
            {t("farmerRegistrationHint")}
          </p>
        </div>
        {props.children}
      </div>
    );
  }

  if (props.mode === "apply") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="section-title">{t("becomeVerifiedFarmer")}</h1>
        <p className="mt-4 text-[var(--huza-muted)]">{t("becomeVerifiedBody")}</p>
        <Link
          href="/farmer/register"
          className="mt-6 inline-block font-bold text-[var(--huza-green-dark)] underline decoration-[var(--huza-green)] underline-offset-4"
        >
          {t("apply")}
        </Link>
      </div>
    );
  }

  const {
    businessName,
    status,
    isVerified,
    farmingType,
    rejectionReason,
    adminNotes,
    inspectionScheduledAt,
    listed,
    children,
  } = props;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-white/60 bg-white p-5 shadow-sm">
        <div>
          <p className="inline-block rounded-lg bg-[var(--huza-mint)] px-3 py-1.5 text-sm font-bold uppercase tracking-[0.14em] text-[var(--huza-green-dark)] ring-1 ring-[var(--huza-green)]/40">
            {t("farmersPortalSellBadge")}
          </p>
          <h1 className="section-title mt-1">{businessName}</h1>
          <p className="mt-1 text-sm text-[var(--huza-muted)]">
            {t("status")}: {status}
            {isVerified ? ` · ${t("verified")}` : ""} · {farmingTypeLabel(t, farmingType)}
          </p>
          {rejectionReason && (
            <p className="mt-1 text-sm text-red-700">
              {t("reason")}: {rejectionReason}
            </p>
          )}
          {adminNotes && (
            <p className="mt-1 text-sm text-[var(--huza-muted)]">
              {t("adminNote")}: {adminNotes}
            </p>
          )}
          {inspectionScheduledAt && (
            <p className="mt-1 text-sm text-[var(--huza-muted)]">
              {t("agentVisitScheduled")}: {new Date(inspectionScheduledAt).toLocaleString()}
            </p>
          )}
        </div>
        <div className="rounded-xl bg-[var(--huza-mint)] px-4 py-3 text-sm">
          <p className="text-[var(--huza-muted)]">{t("productsListed")}</p>
          <p className="text-xl font-bold text-[var(--huza-green-dark)]">{listed}</p>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-[var(--huza-line)] bg-white p-4 text-sm text-[var(--huza-muted)]">
        <strong className="text-[var(--huza-ink)]">{t("howItWorks")}</strong>{" "}
        {farmingType === "STANDARD" ? t("howItWorksStandardBody") : t("howItWorksBody")}
      </div>

      {status !== "APPROVED" && (
        <div className="mb-6 rounded-xl border border-[var(--huza-gold)] bg-[#FFF8E6] p-4 text-sm">
          {t("pendingApprovalBanner")}
        </div>
      )}

      {children}
    </div>
  );
}
