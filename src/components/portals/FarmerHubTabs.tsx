"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export type FarmerHubTab = {
  href: string;
  label: string;
  match?: (pathname: string, tab: string | null) => boolean;
};

export function FarmerHubTabs({ tabs }: { tabs: FarmerHubTab[] }) {
  const pathname = usePathname() || "";
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");

  return (
    <div className="mb-5 flex flex-wrap gap-2">
      {tabs.map((t) => {
        const active = t.match
          ? t.match(pathname, tab)
          : pathname === t.href || pathname.startsWith(`${t.href}/`);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-bold transition",
              active
                ? "bg-[var(--huza-green)] text-white"
                : "bg-white text-[var(--huza-green-dark)] ring-1 ring-[var(--huza-line)]"
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}

export const PRODUCE_TABS: FarmerHubTab[] = [
  {
    href: "/farmer/produce",
    label: "All produce",
    match: (p, tab) => (p.startsWith("/farmer/produce") && !tab) || p === "/farmer/products",
  },
  {
    href: "/farmer/produce?tab=submit",
    label: "Submit crop",
    match: (p, tab) => tab === "submit" || p.startsWith("/farmer/products/submit"),
  },
  {
    href: "/farmer/produce?tab=approvals",
    label: "Approval status",
    match: (p, tab) => tab === "approvals" || p.startsWith("/farmer/approvals"),
  },
];

export const SALES_TABS: FarmerHubTab[] = [
  {
    href: "/farmer/sales",
    label: "Purchase orders",
    match: (p, tab) => (p.startsWith("/farmer/sales") && tab !== "payments") || p.startsWith("/farmer/orders"),
  },
  {
    href: "/farmer/sales?tab=payments",
    label: "Payments",
    match: (p, tab) => tab === "payments" || p.startsWith("/farmer/payments"),
  },
];
