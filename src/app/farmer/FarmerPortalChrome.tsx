"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { useLocale } from "@/lib/locale-context";
import { Button } from "@/components/ui/Button";
import { Leaf, RefreshCw, Sprout, CheckCircle2 } from "lucide-react";

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

const BENEFITS = [
  { key: "farmVisits", fallback: "Farm visits by Youth Huza teams" },
  { key: "agronomySupport", fallback: "Agronomy support for healthier crops" },
  { key: "farmerTraining", fallback: "Practical farmer training" },
  { key: "betterPractices", fallback: "Better farming practices guidance" },
  { key: "marketAccess", fallback: "Better market access through HUZA FRESH" },
  { key: "reliableBuyers", fallback: "A reliable buyer for accepted produce" },
  { key: "harvestPlanning", fallback: "Harvest planning support" },
  { key: "fairPricing", fallback: "Fair, clear pricing discussions" },
] as const;

function farmingTypeLabel(t: (k: string) => string, farmingType?: string | null) {
  if (farmingType === "STANDARD") return t("standardFarmerPath");
  if (farmingType === "CONVERSION") return t("conversionFarmerPath");
  return t("organicFarmerPath");
}

export function FarmerPortalChrome(props: FarmerPortalChromeProps) {
  const { t } = useLocale();

  if (props.mode === "landing") {
    return (
      <div className="mx-auto max-w-3xl space-y-5 overflow-y-auto px-4 py-4 sm:py-6">
        <div className="rounded-3xl border border-[var(--huza-line)] bg-white p-5 text-center shadow-md sm:p-7">
          <div className="mx-auto mb-3 inline-flex rounded-2xl bg-white px-2 py-1">
            <Image
              src="/images/youth-huza-logo.png"
              alt="Youth Huza"
              width={220}
              height={110}
              className="mx-auto h-14 w-auto sm:h-16"
              priority
            />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--huza-green-dark)]">
            Youth Huza · Farmers Portal
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-[var(--huza-ink)] sm:text-3xl">
            {t("farmerPortalWelcomeTitle") !== "farmerPortalWelcomeTitle"
              ? t("farmerPortalWelcomeTitle")
              : "Your digital farming companion"}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[var(--huza-muted)] sm:text-base">
            {t("farmerPortalWelcomeBody") !== "farmerPortalWelcomeBody"
              ? t("farmerPortalWelcomeBody")
              : "Youth Huza is an agricultural partner: we visit farms, share agronomy advice, train farmers, plan harvests, and buy or market produce through HUZA FRESH — so you grow better and sell with confidence."}
          </p>
          <Link
            href="/farmer/login"
            className="mt-4 inline-block text-sm font-bold text-[var(--huza-green-dark)] underline underline-offset-4"
          >
            {t("farmerLogin")}
          </Link>
        </div>

        <div className="rounded-3xl border border-[var(--huza-line)] bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--huza-ink)]">
            {t("howHuzaSupportsFarmers") !== "howHuzaSupportsFarmers"
              ? t("howHuzaSupportsFarmers")
              : "How Youth Huza supports farmers"}
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {BENEFITS.map((b) => (
              <li
                key={b.key}
                className="flex gap-2.5 rounded-2xl bg-[var(--huza-mint)]/40 px-3 py-3 text-sm text-[var(--huza-ink)]"
              >
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[var(--huza-green)]" />
                <span>{t(b.key) !== b.key ? t(b.key) : b.fallback}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-[var(--huza-line)] bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--huza-ink)]">
            {t("chooseFarmingType") !== "chooseFarmingType"
              ? t("chooseFarmingType")
              : "Choose your farming type"}
          </h2>
          <p className="mt-1 text-sm text-[var(--huza-muted)]">
            {t("chooseFarmingTypeHint") !== "chooseFarmingTypeHint"
              ? t("chooseFarmingTypeHint")
              : "Pick the path that matches your farm. You will complete registration next — simple steps, large buttons."}
          </p>

          <div className="mt-5 grid gap-4">
            <div className="rounded-2xl border border-[var(--huza-green)]/35 bg-[var(--huza-mint)]/30 p-4 text-left">
              <Leaf className="size-7 text-[var(--huza-green-dark)]" />
              <h3 className="mt-2 text-base font-bold text-[var(--huza-ink)]">
                {t("organicFarmerPath")}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-[var(--huza-muted)]">
                {t("organicFarmerPathHint")}
              </p>
              <Link href="/farmer/register?type=ORGANIC" className="mt-4 block">
                <Button className="w-full" size="lg">
                  {t("registerOrganicFarmer") !== "registerOrganicFarmer"
                    ? t("registerOrganicFarmer")
                    : "Register as Organic Farmer"}
                </Button>
              </Link>
            </div>

            <div className="rounded-2xl border border-[var(--huza-line)] bg-[#f8faf9] p-4 text-left">
              <RefreshCw className="size-7 text-[var(--huza-green-dark)]" />
              <h3 className="mt-2 text-base font-bold text-[var(--huza-ink)]">
                {t("conversionFarmerPath") !== "conversionFarmerPath"
                  ? t("conversionFarmerPath")
                  : "In Organic Conversion"}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-[var(--huza-muted)]">
                {t("conversionFarmerPathHint") !== "conversionFarmerPathHint"
                  ? t("conversionFarmerPathHint")
                  : "You are moving toward organic practices. We walk with you on the conversion journey — farm visits, training, and clear next steps."}
              </p>
              <Link href="/farmer/register?type=CONVERSION" className="mt-4 block">
                <Button className="w-full" size="lg" variant="secondary">
                  {t("startOrganicJourney") !== "startOrganicJourney"
                    ? t("startOrganicJourney")
                    : "Start Organic Journey"}
                </Button>
              </Link>
            </div>

            <div className="rounded-2xl border border-[var(--huza-line)] bg-white p-4 text-left">
              <Sprout className="size-7 text-[var(--huza-green-dark)]" />
              <h3 className="mt-2 text-base font-bold text-[var(--huza-ink)]">
                {t("standardFarmerPath")}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-[var(--huza-muted)]">
                {t("standardFarmerPathHint")}
              </p>
              <Link href="/farmer/register?type=STANDARD" className="mt-4 block">
                <Button className="w-full" size="lg" variant="secondary">
                  {t("registerConventionalFarmer") !== "registerConventionalFarmer"
                    ? t("registerConventionalFarmer")
                    : "Register as Conventional Farmer"}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (props.mode === "register") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <div className="text-center">
          <h1 className="section-title">{t("farmerPortal")}</h1>
          <p className="mt-2 text-sm text-[var(--huza-muted)]">
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
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-white/60 bg-white/90 p-5 shadow-sm backdrop-blur-sm">
        <div>
          <p className="inline-block rounded-lg bg-[var(--huza-mint)] px-3 py-1.5 text-sm font-bold uppercase tracking-[0.14em] text-[var(--huza-green-dark)] ring-1 ring-[var(--huza-green)]/40">
            {t("farmersPortalSellBadge")}
          </p>
          <h1 className="section-title mt-1">{businessName}</h1>
          <p className="text-sm text-[var(--huza-muted)] mt-1">
            {t("status")}: {status}
            {isVerified ? ` · ${t("verified")}` : ""} · {farmingTypeLabel(t, farmingType)}
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
