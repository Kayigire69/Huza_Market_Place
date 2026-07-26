"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Home, LayoutGrid, ShoppingCart, Package, User } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { useLocale } from "@/lib/locale-context";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const { t } = useLocale();
  const { data: session, status } = useSession();
  const pathname = usePathname() || "/";
  const items = useCart((s) => s.items);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const [hash, setHash] = useState("");
  const [accountSheetOpen, setAccountSheetOpen] = useState(false);
  const signedIn = status === "authenticated" && Boolean(session?.user?.id);

  useEffect(() => {
    const sync = () => setHash(typeof window !== "undefined" ? window.location.hash : "");
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [pathname]);

  useEffect(() => {
    setAccountSheetOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!accountSheetOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [accountSheetOpen]);

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
      href: signedIn ? "/account#orders" : "/auth/login?callbackUrl=/account%23orders",
      label: t("orders"),
      icon: Package,
      active: onTrack || (onAccount && hash === "#orders"),
    },
    {
      href: signedIn ? "/account" : "/auth/login",
      label: signedIn ? t("account") : t("login"),
      icon: User,
      active: onAuth || (onAccount && hash !== "#orders") || accountSheetOpen,
      showSignedInDot: signedIn,
      isAccount: true as const,
    },
  ];

  return (
    <>
      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-[70] border-t border-[var(--huza-line)] bg-[rgba(247,251,248,0.97)] px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md md:hidden"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const content = (
              <>
                <span className="relative">
                  <Icon className={cn("size-5", tab.active && "stroke-[2.5]")} aria-hidden />
                  {"badge" in tab && tab.badge && tab.badge > 0 ? (
                    <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--huza-gold)] px-1 text-[9px] font-bold text-[var(--huza-ink)]">
                      {tab.badge > 9 ? "9+" : tab.badge}
                    </span>
                  ) : null}
                  {"showSignedInDot" in tab && tab.showSignedInDot ? (
                    <span
                      className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-[var(--huza-green)] ring-2 ring-[rgba(247,251,248,0.97)]"
                      aria-hidden
                    />
                  ) : null}
                </span>
                <span className="max-w-[4.5rem] truncate">{tab.label}</span>
              </>
            );
            const className = cn(
              "relative flex w-full flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-semibold transition",
              tab.active ? "text-[var(--huza-green-dark)]" : "text-[var(--huza-muted)]"
            );

            return (
              <li key={`${tab.label}-${tab.href}`}>
                {"isAccount" in tab && tab.isAccount && signedIn ? (
                  <button
                    type="button"
                    aria-label={tab.label}
                    aria-expanded={accountSheetOpen}
                    className={className}
                    onClick={() => setAccountSheetOpen(true)}
                  >
                    {content}
                  </button>
                ) : (
                  <Link href={tab.href} prefetch className={className}>
                    {content}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {accountSheetOpen && signedIn ? (
        <div
          className="fixed inset-0 z-[80] md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label={t("account")}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/35"
            aria-label="Close"
            onClick={() => setAccountSheetOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl border border-[var(--huza-line)] bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-xl">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[var(--huza-line)]" aria-hidden />
            <nav className="flex flex-col gap-0.5 pb-2">
              <Link
                href="/account"
                className="rounded-xl px-3 py-3 text-sm font-medium hover:bg-[var(--huza-mint)]"
                onClick={() => setAccountSheetOpen(false)}
              >
                {t("account")}
              </Link>
              <Link
                href="/account#orders"
                className="rounded-xl px-3 py-3 text-sm font-medium hover:bg-[var(--huza-mint)]"
                onClick={() => setAccountSheetOpen(false)}
              >
                {t("orders")}
              </Link>
              <button
                type="button"
                className="rounded-xl px-3 py-3 text-left text-sm font-medium hover:bg-[var(--huza-mint)]"
                onClick={() => {
                  setAccountSheetOpen(false);
                  signOut({ callbackUrl: "/" });
                }}
              >
                {t("logout")}
              </button>
            </nav>
          </div>
        </div>
      ) : null}
    </>
  );
}
