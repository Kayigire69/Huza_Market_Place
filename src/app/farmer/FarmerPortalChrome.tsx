"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useLocale } from "@/lib/locale-context";
import { DemoCredentials } from "@/components/portals/DemoCredentials";
import { Button } from "@/components/ui/Button";

type DemoCredential = {
  label: string;
  email: string;
  password: string;
  note: string;
};

type LandingProps = {
  mode: "landing";
  demoCredentials?: DemoCredential[];
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

export function FarmerPortalChrome(props: FarmerPortalChromeProps) {
  const { t } = useLocale();

  if (props.mode === "landing") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--huza-green)]">
            {t("farmersPortalBadge")}
          </p>
          <h1 className="section-title mt-2">{t("farmerPortal")}</h1>
          <p className="mt-4 text-[var(--huza-muted)] leading-relaxed">{t("farmerLoginWallBody")}</p>
        </div>

        <div className="mt-8 space-y-3 rounded-2xl border border-[var(--huza-line)] bg-white p-6">
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
          <p className="text-center text-xs text-[var(--huza-muted)]">{t("farmerPortalPrivateHint")}</p>
        </div>

        {props.demoCredentials && (
          <DemoCredentials title={t("demoFarmerLogins")} credentials={props.demoCredentials} />
        )}
      </div>
    );
  }

  if (props.mode === "register") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--huza-green)]">
            {t("farmersPortalBadge")}
          </p>
          <h1 className="section-title mt-2">{t("farmerPortal")}</h1>
          <p className="mt-4 text-[var(--huza-muted)] leading-relaxed max-w-2xl mx-auto">
            {t("farmerLandingBody")}
          </p>
          <p className="mt-3 text-sm">
            <Link href="/auth/login?callbackUrl=/farmer" className="font-semibold text-[var(--huza-green)]">
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
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="section-title">{t("becomeVerifiedFarmer")}</h1>
        <p className="mt-4 text-[var(--huza-muted)]">{t("becomeVerifiedBody")}</p>
        <Link
          href="/farmer/register"
          className="inline-block mt-6 text-[var(--huza-green)] font-semibold"
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
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--huza-green)]">
            {t("farmersPortalSellBadge")}
          </p>
          <h1 className="section-title mt-1">{businessName}</h1>
          <p className="text-sm text-[var(--huza-muted)] mt-1">
            {t("status")}: {status}
            {isVerified ? ` · ${t("verified")}` : ""} · {t("agentAssistedSelling")}
            {farmingType === "STANDARD"
              ? ` · ${t("standardFarmerPath")}`
              : ` · ${t("organicFarmerPath")}`}
          </p>
          {rejectionReason && (
            <p className="text-sm text-red-700 mt-1">
              {t("reason")}: {rejectionReason}
            </p>
          )}
          {adminNotes && (
            <p className="text-sm text-[var(--huza-muted)] mt-1">
              {t("adminNote")}: {adminNotes}
            </p>
          )}
          {inspectionScheduledAt && (
            <p className="text-sm text-[var(--huza-muted)] mt-1">
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
