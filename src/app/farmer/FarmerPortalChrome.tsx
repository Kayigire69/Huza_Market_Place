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
      <div className="mx-auto flex h-full max-w-2xl flex-col justify-center gap-2.5 overflow-hidden px-4 py-2 sm:gap-3 sm:py-3">
        {/* Middle lockup — logo, title, CTAs */}
        <div className="rounded-2xl border border-[var(--huza-line)] bg-white p-3.5 text-center shadow-md sm:p-4">
          <div className="mx-auto mb-1.5 inline-flex rounded-2xl bg-white px-2 py-0.5">
            <Image
              src="/images/youth-huza-logo.png"
              alt="Youth Huza"
              width={220}
              height={110}
              className="mx-auto h-12 w-auto sm:h-14"
              priority
            />
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-[var(--huza-ink)] sm:text-2xl">
            {t("farmerPortal")}
          </h1>
          <p className="mt-1 font-[family-name:var(--font-display)] text-sm font-semibold text-[var(--huza-green-dark)] sm:text-base">
            Grow Better. Sell Better. Earn Better.
          </p>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
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

        {/* Exhibition: success story + partnership reasons */}
        <div className="rounded-2xl border border-[var(--huza-line)] bg-white p-3.5 shadow-sm sm:p-4">
          <h2 className="font-[family-name:var(--font-display)] text-base font-bold text-[var(--huza-ink)] sm:text-lg">
            Farmer Success Stories
          </h2>
          <p className="mt-0.5 text-xs text-[var(--huza-muted)]">
            What changes when farms partner with Youth Huza
          </p>

          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
            <div className="rounded-xl border border-[var(--huza-line)] bg-[#f8faf9] px-3 py-2.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--huza-muted)]">
                Before partnering with Youth Huza
              </p>
              <ul className="mt-2 space-y-1.5 text-left text-sm leading-snug text-[var(--huza-ink)]">
                {["High rejection rates", "Limited market access"].map((item) => (
                  <li key={item} className="flex gap-2">
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c45c3a]"
                      aria-hidden
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-[var(--huza-green)]/30 bg-[var(--huza-mint)]/50 px-3 py-2.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--huza-green-dark)]">
                After partnering
              </p>
              <ul className="mt-2 space-y-1.5 text-left text-sm leading-snug text-[var(--huza-ink)]">
                {[
                  "Improved quality through guidance",
                  "Consistent sales to HUZA",
                  "Better income",
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--huza-green)]"
                      aria-hidden
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-3 border-t border-[var(--huza-line)] pt-3">
            <h3 className="text-sm font-bold text-[var(--huza-ink)]">
              Why Farmers Partner With Youth Huza
            </h3>
            <ul className="mt-2 grid gap-1.5 text-left text-xs leading-snug text-[var(--huza-ink)] sm:grid-cols-2 sm:text-sm">
              {[
                "Practical farming guidance from experienced professionals.",
                "Quality standards that help improve marketability.",
                "Fair purchasing process.",
                "Reliable buyer for accepted produce.",
                "Long-term partnership focused on growth.",
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--huza-green)]"
                    aria-hidden
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (props.mode === "register") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="text-center">
          <h1 className="section-title">{t("farmerPortal")}</h1>
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
