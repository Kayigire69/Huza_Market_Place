"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Heart, Package, User } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const { t } = useLocale();
  const pathname = usePathname() || "/";

  const tabs = [
    {
      href: "/",
      label: t("home"),
      icon: Home,
      active: pathname === "/",
    },
    {
      href: "/categories",
      label: t("categories"),
      icon: LayoutGrid,
      active: pathname.startsWith("/categories") || pathname.startsWith("/products"),
    },
    {
      href: "/wishlist",
      label: t("wishlist"),
      icon: Heart,
      active: pathname.startsWith("/wishlist"),
    },
    {
      href: "/account#orders",
      label: t("orders"),
      icon: Package,
      active: pathname.startsWith("/track"),
    },
    {
      href: "/account",
      label: t("account"),
      icon: User,
      active: pathname.startsWith("/account") || pathname.startsWith("/auth"),
    },
  ];

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-[var(--huza-line)] bg-[rgba(247,251,248,0.96)] pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <li key={`${tab.href}-${tab.label}`}>
              <Link
                href={tab.href}
                prefetch
                className={cn(
                  "relative flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-semibold transition",
                  tab.active ? "text-[var(--huza-green-dark)]" : "text-[var(--huza-muted)]"
                )}
              >
                <Icon className={cn("size-5", tab.active && "stroke-[2.5]")} aria-hidden />
                <span className="max-w-[4.5rem] truncate">{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
