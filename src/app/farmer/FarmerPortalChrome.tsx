"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useLocale } from "@/lib/locale-context";
import { DemoCredentials } from "@/components/portals/DemoCredentials";

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

type ApplyProps = {
  mode: "apply";
};

type DashboardProps = {
  mode: "dashboard";
  businessName: string;
  status: string;
  isVerified: boolean;
  rejectionReason?: string | null;
  adminNotes?: string | null;
  inspectionScheduledAt?: string | null;
  listed: number;
  children: ReactNode;
};

export type FarmerPortalChromeProps = LandingProps | ApplyProps | DashboardProps;

export function FarmerPortalChrome(props: FarmerPortalChromeProps) {
  const { t } = useLocale();

  if (props.mode === "landing") {
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
            <Link href="/" className="text-[var(--huza-muted)] hover:underline">
              {t("customerStorefront")}
            </Link>
            {" · "}
            <Link href="/auth/login" className="font-semibold text-[var(--huza-green)]">
              {t("farmerLogin")}
            </Link>
          </p>
        </div>
        {props.demoCredentials && (
          <DemoCredentials title={t("demoFarmerLogins")} credentials={props.demoCredentials} />
        )}
        {props.children}
      </div>
    );
  }

  if (props.mode === "apply") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="section-title">{t("becomeVerifiedFarmer")}</h1>
        <p className="mt-4 text-[var(--huza-muted)]">{t("becomeVerifiedBody")}</p>
        <Link href="/farmer" className="inline-block mt-6 text-[var(--huza-green)] font-semibold">
          {t("apply")}
        </Link>
      </div>
    );
  }

  const {
    businessName,
    status,
    isVerified,
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
        <strong className="text-[var(--huza-ink)]">{t("howItWorks")}</strong> {t("howItWorksBody")}
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
