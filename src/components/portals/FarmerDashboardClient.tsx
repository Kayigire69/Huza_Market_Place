"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Package,
  Upload,
  Wallet,
} from "lucide-react";
import { FarmerPageHeader, FarmerPanel } from "@/components/portals/FarmerUi";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/lib/locale-context";
import { formatRwf, formatUnit } from "@/lib/utils";

export type FarmerDashboardData = {
  fullName: string;
  businessName: string;
  status: string;
  isVerified: boolean;
  farmingType: string | null;
  rejectionReason: string | null;
  inspectionScheduledAt: string | null;
  accountApproved: boolean;
  hasCrop: boolean;
  mainCropName: string | null;
  primaryUnit: string;
  availableVolume: number;
  pendingReviews: number;
  rejectedProducts: number;
  approvedProducts: number;
  openPurchaseOrders: number;
  unpaidOrders: number;
  paidOrders: number;
  pendingPayoutAmount: number;
  paidAmount: number;
  listed: number;
  latestPo: {
    poNumber: string;
    totalAmount: number;
    status: string;
    paymentStatus: string;
  } | null;
  workflow: {
    step: string;
    titleKey: string;
    bodyKey: string;
    href: string;
    done: boolean;
    active?: boolean;
  }[];
};

function fill(template: string, vars: Record<string, string | number>) {
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replace(new RegExp(`\\{${k}\\}`, "g"), String(v)),
    template
  );
}

export function FarmerDashboardClient({ data }: { data: FarmerDashboardData }) {
  const { t } = useLocale();

  type AttentionItem = {
    tone: "warn" | "info" | "ok";
    title: string;
    body: string;
    href: string;
    cta: string;
  };

  const attention: AttentionItem[] = [];
  if (!data.accountApproved) {
    attention.push({
      tone: "warn",
      title: t("attentionAwaitingApproval"),
      body:
        data.status === "REJECTED"
          ? data.rejectionReason || t("attentionRejectedBody")
          : t("attentionPendingBody"),
      href: "/farmer/profile",
      cta: t("viewProfile"),
    });
  }
  if (data.accountApproved && !data.hasCrop) {
    attention.push({
      tone: "info",
      title: t("attentionAddCrop"),
      body: t("attentionAddCropBody"),
      href: "/farmer/products/submit",
      cta: t("submitMyMainCrop"),
    });
  }
  if (data.pendingReviews > 0) {
    attention.push({
      tone: "info",
      title: fill(t("attentionReviewsTitle"), { n: data.pendingReviews }),
      body: t("attentionReviewsBody"),
      href: "/farmer/approvals",
      cta: t("openApprovalStatus"),
    });
  }
  if (data.rejectedProducts > 0) {
    attention.push({
      tone: "warn",
      title: fill(t("attentionRejectedCrops"), { n: data.rejectedProducts }),
      body: t("attentionRejectedCropsBody"),
      href: "/farmer/approvals",
      cta: t("seeFeedback"),
    });
  }
  if (data.unpaidOrders > 0) {
    attention.push({
      tone: "info",
      title: fill(t("attentionUnpaid"), { n: data.unpaidOrders }),
      body: fill(t("attentionUnpaidBody"), {
        amount: formatRwf(data.pendingPayoutAmount),
      }),
      href: "/farmer/payments",
      cta: t("checkPayments"),
    });
  }
  if (attention.length === 0) {
    attention.push({
      tone: "ok",
      title: t("attentionAllClear"),
      body: t("attentionAllClearBody"),
      href: "/farmer/products",
      cta: t("updateCropSupply"),
    });
  }

  const nextAction = attention[0];

  const kpis = [
    {
      label: t("kpiMyFarm"),
      value: t("navAccount"),
      hint: t("kpiMyFarmHint"),
      href: "/farmer/my-farm",
      icon: Package,
    },
    {
      label: t("kpiMyCrops"),
      value: t("navMyCrops"),
      hint: t("kpiMyCropsHint"),
      href: "/farmer/crops",
      icon: Package,
    },
    {
      label: t("kpiSellToHuza"),
      value: "2",
      hint: t("kpiSellHint"),
      href: "/farmer/sell",
      icon: ClipboardList,
    },
    {
      label: t("kpiGrowBetter"),
      value: t("navGrowBetter"),
      hint: t("kpiGrowHint"),
      href: "/farmer/grow-better",
      icon: ClipboardList,
    },
    {
      label: t("kpiAvailableVolume"),
      value: data.hasCrop ? data.availableVolume.toLocaleString() : "—",
      hint: data.hasCrop ? formatUnit(data.primaryUnit) : t("kpiNoCropYet"),
      href: "/farmer/products",
      icon: Package,
    },
    {
      label: t("kpiInReview"),
      value: String(data.pendingReviews),
      hint:
        data.rejectedProducts > 0
          ? `${data.rejectedProducts}`
          : t("kpiQualityChecks"),
      href: "/farmer/approvals",
      icon: ClipboardList,
    },
    {
      label: t("kpiMessages"),
      value: t("kpiInbox"),
      hint: t("kpiHuzaUpdates"),
      href: "/farmer/messages",
      icon: ClipboardList,
    },
    {
      label: t("kpiPaidToYou"),
      value: formatRwf(data.paidAmount),
      hint: `${data.paidOrders} ${t("kpiPaidOrders")}`,
      href: "/farmer/payments",
      icon: Wallet,
    },
  ];

  return (
    <div>
      <FarmerPageHeader title={`${t("welcomeFarmer")} ${data.fullName}`} />

      <FarmerPanel className="mb-5 border-[var(--huza-green)]/35 bg-gradient-to-br from-white to-[var(--huza-mint)]/50">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--huza-green-dark)]">
              {t("recommendedNextStep")}
            </p>
            <h2 className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold text-[var(--huza-ink)]">
              {nextAction.title}
            </h2>
            <p className="mt-1 max-w-xl text-sm text-[var(--huza-muted)]">{nextAction.body}</p>
          </div>
          <Link href={nextAction.href}>
            <Button className="gap-2">
              {nextAction.cta}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </FarmerPanel>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Link key={`${kpi.label}-${kpi.href}`} href={kpi.href} className="block">
              <FarmerPanel className="!p-4 transition hover:border-[var(--huza-green)] hover:shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--huza-muted)]">
                    {kpi.label}
                  </p>
                  <Icon className="h-4 w-4 text-[var(--huza-green)]" />
                </div>
                <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--huza-green-dark)]">
                  {kpi.value}
                </p>
                <p className="mt-0.5 text-xs text-[var(--huza-muted)]">{kpi.hint}</p>
              </FarmerPanel>
            </Link>
          );
        })}
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-5">
        <FarmerPanel className="lg:col-span-3">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <h3 className="font-semibold text-[var(--huza-ink)]">{t("needsAttention")}</h3>
          </div>
          <ul className="space-y-3">
            {attention.map((item) => (
              <li
                key={item.title}
                className={`rounded-xl border px-3 py-3 ${
                  item.tone === "warn"
                    ? "border-amber-200 bg-amber-50/80"
                    : item.tone === "ok"
                      ? "border-[var(--huza-line)] bg-[var(--huza-mint)]/40"
                      : "border-[var(--huza-line)] bg-white"
                }`}
              >
                <p className="text-sm font-semibold text-[var(--huza-ink)]">{item.title}</p>
                <p className="mt-1 text-xs text-[var(--huza-muted)]">{item.body}</p>
                <Link
                  href={item.href}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[var(--huza-green-dark)] underline underline-offset-4"
                >
                  {item.cta}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </li>
            ))}
          </ul>
        </FarmerPanel>

        <FarmerPanel className="lg:col-span-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--huza-muted)]">
            {t("mainCropSupply")}
          </p>
          {data.mainCropName ? (
            <>
              <h3 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--huza-ink)]">
                {data.mainCropName}
              </h3>
              <p className="mt-2 text-sm text-[var(--huza-muted)]">
                {data.availableVolume.toLocaleString()} {formatUnit(data.primaryUnit)}{" "}
                {t("availableUnit")}
              </p>
              <p className="mt-2 text-xs text-[var(--huza-muted)]">{t("updateQtyAfterHarvest")}</p>
              <Link href="/farmer/products" className="mt-4 inline-block">
                <Button size="sm" variant="ghost" className="gap-1 px-0">
                  {t("manageCropSupply")} <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </>
          ) : (
            <>
              <h3 className="mt-1 font-semibold text-[var(--huza-ink)]">{t("noCropListedYet")}</h3>
              <p className="mt-2 text-sm text-[var(--huza-muted)]">{t("submitMainCropHint")}</p>
              <Link href="/farmer/products/submit" className="mt-4 inline-block">
                <Button size="sm" className="gap-2">
                  <Upload className="h-4 w-4" />
                  {t("submitCrop")}
                </Button>
              </Link>
            </>
          )}
        </FarmerPanel>
      </div>

      <FarmerPanel className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--huza-green-dark)]">
          {t("sellingWorkflow")}
        </p>
        <h2 className="mt-1 font-[family-name:var(--font-display)] text-lg font-bold text-[var(--huza-ink)]">
          {t("keepBusinessCenter")}
        </h2>
        <p className="mt-1 text-sm text-[var(--huza-muted)]">{t("sellFirstSupportSecond")}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {data.workflow.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-xl border p-4 transition hover:border-[var(--huza-green)] hover:bg-[var(--huza-mint)] ${
                item.done
                  ? "border-[var(--huza-green)]/30 bg-[var(--huza-mint)]/50"
                  : item.active
                    ? "border-[var(--huza-gold)] bg-[#FFF8E6]"
                    : "border-[var(--huza-line)] bg-white"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-[var(--huza-green-dark)]">
                  {t("stepLabel")} {item.step}
                </p>
                {item.done ? (
                  <CheckCircle2 className="h-4 w-4 text-[var(--huza-green)]" />
                ) : item.active ? (
                  <span className="rounded-full bg-[var(--huza-gold)]/30 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                    {t("nowLabel")}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 font-semibold text-[var(--huza-ink)]">{t(item.titleKey)}</p>
              <p className="mt-1 text-xs text-[var(--huza-muted)]">{t(item.bodyKey)}</p>
            </Link>
          ))}
        </div>
      </FarmerPanel>
    </div>
  );
}
