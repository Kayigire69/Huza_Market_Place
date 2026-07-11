"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useLocale } from "@/lib/locale-context";
import { Button } from "@/components/ui/Button";

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

function statusClass(status: string) {
  if (status === "APPROVED") return "farmer-status farmer-status-ok";
  if (status === "REJECTED") return "farmer-status farmer-status-muted";
  return "farmer-status farmer-status-warn";
}

export function FarmerPortalChrome(props: FarmerPortalChromeProps) {
  const { t } = useLocale();

  if (props.mode === "landing") {
    return (
      <div className="mx-auto max-w-lg px-4 py-14 sm:py-16">
        <div className="text-center">
          <p className="farmer-badge">{t("farmersPortalBadge")}</p>
          <h1 className="farmer-panel-title mt-4 text-3xl sm:text-4xl">{t("farmerPortal")}</h1>
          <p className="farmer-panel-sub mx-auto mt-2 max-w-md">
            {t("farmersPortalSellBadge")}
          </p>
        </div>

        <div className="farmer-panel mt-8 space-y-3 p-6 sm:p-7">
          <Link href="/auth/login?callbackUrl=/farmer" className="block">
            <Button className="w-full" size="lg">
              {t("farmerLogin")}
            </Button>
          </Link>
          <Link href="/farmer/register" className="block">
            <Button className="w-full" variant="ghost" size="lg">
              {t("newFarmerApplication")}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (props.mode === "register") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <div className="text-center">
          <p className="farmer-badge">{t("farmersPortalBadge")}</p>
          <h1 className="farmer-panel-title mt-4 text-3xl">{t("farmerPortal")}</h1>
          <p className="mt-3 text-sm">
            <Link
              href="/auth/login?callbackUrl=/farmer"
              className="font-bold text-[var(--huza-green-dark)] underline decoration-[var(--huza-green)] underline-offset-4"
            >
              {t("farmerLogin")}
            </Link>
          </p>
        </div>
        {props.children}
      </div>
    );
  }

  if (props.mode === "apply") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <div className="farmer-panel p-7 text-center sm:p-8">
          <h1 className="farmer-panel-title text-2xl sm:text-3xl">{t("becomeVerifiedFarmer")}</h1>
          <p className="farmer-panel-sub mt-3">{t("becomeVerifiedBody")}</p>
          <Link
            href="/farmer/register"
            className="mt-6 inline-flex rounded-xl bg-[var(--huza-green)] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(11,92,52,0.22)] hover:bg-[var(--huza-green-dark)]"
          >
            {t("apply")}
          </Link>
        </div>
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
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="farmer-panel mb-6 flex flex-wrap items-end justify-between gap-4 p-5 sm:p-6">
        <div className="min-w-0">
          <p className="farmer-badge">{t("farmersPortalSellBadge")}</p>
          <h1 className="farmer-panel-title mt-3 text-2xl sm:text-3xl">{businessName}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[var(--huza-muted)]">
            <span className={statusClass(status)}>
              {t("status")}: {status}
            </span>
            {isVerified && <span className="farmer-status farmer-status-ok">{t("verified")}</span>}
            <span>
              {t("agentAssistedSelling")}
              {farmingType === "STANDARD"
                ? ` · ${t("standardFarmerPath")}`
                : ` · ${t("organicFarmerPath")}`}
            </span>
          </div>
          {rejectionReason && (
            <p className="mt-2 text-sm font-medium text-red-700">
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
        <div className="farmer-stat">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--huza-muted)]">
            {t("productsListed")}
          </p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--huza-green-dark)]">
            {listed}
          </p>
        </div>
      </div>

      <div className="farmer-panel mb-6 p-4 text-sm text-[var(--huza-muted)] sm:px-5">
        <strong className="text-[var(--huza-ink)]">{t("howItWorks")}</strong>{" "}
        {farmingType === "STANDARD" ? t("howItWorksStandardBody") : t("howItWorksBody")}
      </div>

      {status !== "APPROVED" && (
        <div className="mb-6 rounded-xl border border-[var(--huza-gold)] bg-[#FFF8E6] px-4 py-3.5 text-sm shadow-sm">
          {t("pendingApprovalBanner")}
        </div>
      )}

      {children}
    </div>
  );
}
