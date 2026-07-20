"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useLocale } from "@/lib/locale-context";
import { cn } from "@/lib/utils";

export type FarmerHubTab = {
  href: string;
  labelKey: string;
  match?: (pathname: string, tab: string | null) => boolean;
};

export function FarmerHubTabs({ tabs }: { tabs: FarmerHubTab[] }) {
  const pathname = usePathname() || "";
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");
  const { t } = useLocale();

  return (
    <div className="mb-5 flex flex-wrap gap-2">
      {tabs.map((item) => {
        const active = item.match
          ? item.match(pathname, tab)
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-bold transition",
              active
                ? "bg-[var(--huza-green)] text-white"
                : "bg-white text-[var(--huza-green-dark)] ring-1 ring-[var(--huza-line)]"
            )}
          >
            {t(item.labelKey)}
          </Link>
        );
      })}
    </div>
  );
}

export const PRODUCE_TABS: FarmerHubTab[] = [
  {
    href: "/farmer/produce",
    labelKey: "tabAllProduce",
    match: (p, tab) => (p.startsWith("/farmer/produce") && !tab) || p === "/farmer/products",
  },
  {
    href: "/farmer/produce?tab=submit",
    labelKey: "tabSubmitCrop",
    match: (p, tab) => tab === "submit" || p.startsWith("/farmer/products/submit"),
  },
  {
    href: "/farmer/produce?tab=approvals",
    labelKey: "tabApprovalStatus",
    match: (p, tab) => tab === "approvals" || p.startsWith("/farmer/approvals"),
  },
];

export const SALES_TABS: FarmerHubTab[] = [
  {
    href: "/farmer/sales",
    labelKey: "tabPurchaseOrders",
    match: (p, tab) =>
      (p.startsWith("/farmer/sales") && tab !== "payments") || p.startsWith("/farmer/orders"),
  },
  {
    href: "/farmer/sales?tab=payments",
    labelKey: "tabPayments",
    match: (p, tab) => tab === "payments" || p.startsWith("/farmer/payments"),
  },
];
