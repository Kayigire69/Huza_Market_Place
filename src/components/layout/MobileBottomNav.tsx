"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, LayoutGrid, ShoppingCart, Package, User } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { useLocale } from "@/lib/locale-context";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const { t } = useLocale();
  const pathname = usePathname() || "/";
  const items = useCart((s) => s.items);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const [hash, setHash] = useState("");

  useEffect(() => {
    const sync = () => setHash(typeof window !== "undefined" ? window.location.hash : "");
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [pathname]);

  const onAccount = pathname.startsWith("/account");
  const onAuth = pathname.startsWith("/auth");
  const onTrack = pathname.startsWith("/track");

  const tabs = [
    {
      href: "/shop",
      label: t("home"),
      icon: Home,
      active: pathname === "/shop",
    },
    {
      href: "/categories",
      label: t("categories"),
      icon: LayoutGrid,
      active: pathname.startsWith("/categories") || pathname.startsWith("/products"),
    },
    {
      href: "/cart",
      label: t("cart"),
      icon: ShoppingCart,
      active: pathname.startsWith("/cart") || pathname.startsWith("/checkout"),
      badge: count,
    },
    {
      href: "/account#orders",
      label: t("orders"),
      icon: Package,
      active: onTrack || (onAccount && hash === "#orders"),
    },
    {
      href: "/account",
      label: t("account"),
      icon: User,
      active: onAuth || (onAccount && hash !== "#orders"),
    },
  ];

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-[70] border-t border-[var(--huza-line)] bg-[rgba(247,251,248,0.97)] px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md md:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                prefetch
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-semibold transition",
                  tab.active ? "text-[var(--huza-green-dark)]" : "text-[var(--huza-muted)]"
                )}
              >
                <span className="relative">
                  <Icon className={cn("size-5", tab.active && "stroke-[2.5]")} aria-hidden />
                  {tab.badge && tab.badge > 0 ? (
                    <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--huza-gold)] px-1 text-[9px] font-bold text-[var(--huza-ink)]">
                      {tab.badge > 9 ? "9+" : tab.badge}
                    </span>
                  ) : null}
                </span>
                <span className="max-w-[4.5rem] truncate">{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
