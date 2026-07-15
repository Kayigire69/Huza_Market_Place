"use client";

import Image from "next/image";
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

export function FarmerPortalChrome(props: FarmerPortalChromeProps) {
  const { t } = useLocale();

  if (props.mode === "landing") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <div className="text-center">
          <div className="mx-auto mb-4 inline-flex rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-[var(--huza-line)]">
            <Image
              src="/images/youth-huza-logo.png"
              alt="Youth Huza — Connecting you to freshness"
              width={220}
              height={110}
              className="mx-auto h-24 w-auto sm:h-28"
              priority
            />
          </div>
          <p className="inline-block rounded-lg bg-[var(--huza-mint)] px-3 py-1.5 text-sm font-bold uppercase tracking-[0.14em] text-[var(--huza-green-dark)] ring-1 ring-[var(--huza-green)]/40">
            {t("farmersPortalBadge")}
          </p>
          <h1 className="section-title mt-3">{t("farmerPortal")}</h1>
          <p className="mt-3 font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--huza-green-dark)] sm:text-2xl">
            Grow Better. Sell Better. Earn Better.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[var(--huza-muted)]">
            Youth Huza is your agricultural partner — quality guidance, fair purchasing, and a reliable
            market. HUZA FRESH is the customer brand shoppers see.
          </p>
        </div>

        <div className="mt-8 space-y-3 rounded-2xl border border-[var(--huza-line)] bg-white/95 p-6 shadow-sm backdrop-blur-sm">
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
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="text-center">
          <p className="inline-block rounded-lg bg-[var(--huza-mint)] px-3 py-1.5 text-sm font-bold uppercase tracking-[0.14em] text-[var(--huza-green-dark)] ring-1 ring-[var(--huza-green)]/40">
            {t("farmersPortalBadge")}
          </p>
          <h1 className="section-title mt-3">{t("farmerPortal")}</h1>
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
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-white/60 bg-white/90 p-5 shadow-sm backdrop-blur-sm">
        <div>
          <p className="inline-block rounded-lg bg-[var(--huza-mint)] px-3 py-1.5 text-sm font-bold uppercase tracking-[0.14em] text-[var(--huza-green-dark)] ring-1 ring-[var(--huza-green)]/40">
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

      <div className="mb-6 rounded-xl border border-[var(--huza-line)] bg-white/95 p-4 text-sm text-[var(--huza-muted)] backdrop-blur-sm">
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
