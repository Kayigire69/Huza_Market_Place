"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ShoppingCart,
  User,
  Heart,
  Package,
  ChevronDown,
  LogIn,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useCart } from "@/lib/cart-store";
import { useLocale } from "@/lib/locale-context";
import { locales, localeFlags, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { NAV_CATEGORIES } from "@/lib/nav-categories";
import { SmartSearch } from "@/components/layout/SmartSearch";
import { HuzaFreshLogo } from "@/components/brand/HuzaFreshLogo";

/** Orange accent. Cart / wishlist badges only (Phase 1). */
const BADGE = "bg-[#F97316] text-white";

function IconButton({
  href,
  label,
  children,
  className,
}: {
  href: string;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        "relative inline-flex size-10 items-center justify-center rounded-full text-[var(--huza-ink)] transition-colors hover:bg-[var(--huza-mint)] hover:text-[var(--huza-green-dark)]",
        className
      )}
    >
      {children}
    </Link>
  );
}

/**
 * Phase 1 Navigation (locked design). Scroll-stable sticky.
 *
 * Only the top bar is sticky (fixed height). The second row / mobile
 * category rail are NOT sticky. They leave the viewport naturally.
 * No scroll listeners, no height/padding/shadow toggles → no shake.
 */
export function Header() {
  const { t, locale, setLocale } = useLocale();
  const items = useCart((s) => s.items);
  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const { data: session } = useSession();
  const pathname = usePathname();
  const [catsOpen, setCatsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [wishCount, setWishCount] = useState(0);
  const catsRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  const firstName =
    session?.user?.name?.trim().split(/\s+/)[0] ||
    session?.user?.email?.split("@")[0] ||
    "";

  useEffect(() => {
    setCatsOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!session?.user?.id) {
      setWishCount(0);
      return;
    }
    let cancelled = false;
    fetch("/api/wishlist")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.items) setWishCount(data.items.length);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, pathname]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (catsRef.current && !catsRef.current.contains(target)) setCatsOpen(false);
      if (accountRef.current && !accountRef.current.contains(target)) setAccountOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const catLabel = (c: (typeof NAV_CATEGORIES)[number]) => {
    if (locale === "fr") return c.nameFr;
    if (locale === "rw") return c.nameRw;
    if (locale === "sw") return c.nameSw;
    return c.nameEn;
  };

  return (
    <header className="relative z-50 bg-white">
      {/* Sticky top bar ONLY. Fixed heights, no scroll-driven class changes */}
      <div className="sticky top-0 z-50 border-b border-[var(--huza-line)] bg-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-3 sm:h-16 sm:gap-4 sm:px-6">
          <Link
            href="/shop"
            className="flex min-w-0 shrink items-center"
            aria-label="HUZA FRESH Home"
          >
            <HuzaFreshLogo size="sm" showTagline className="max-w-full" />
          </Link>

          <div className="mx-auto hidden min-w-0 flex-1 md:block md:max-w-2xl">
            <SmartSearch size="lg" />
          </div>

          <div className="ml-auto hidden shrink-0 items-center gap-0.5 md:flex">
            <label className="sr-only" htmlFor="header-lang">
              {t("language")}
            </label>
            <select
              id="header-lang"
              value={locale}
              onChange={(e) => setLocale(e.target.value as Locale)}
              className="mr-1 cursor-pointer rounded-lg border border-[var(--huza-line)] bg-white py-1.5 pl-2 pr-2 text-sm font-semibold text-[var(--huza-ink)] outline-none hover:bg-[var(--huza-mint)]"
              aria-label={t("language")}
            >
              {locales.map((l) => (
                <option key={l} value={l}>
                  {localeFlags[l]} {l.toUpperCase()}
                </option>
              ))}
            </select>

            <IconButton href="/wishlist" label={t("wishlist")}>
              <Heart
                className={cn("size-5", wishCount > 0 && "fill-[#F97316] text-[#F97316]")}
              />
              {wishCount > 0 && (
                <span
                  className={cn(
                    "absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold",
                    BADGE
                  )}
                >
                  {wishCount > 9 ? "9+" : wishCount}
                </span>
              )}
            </IconButton>

            <IconButton href="/track" label={t("trackOrder")}>
              <Package className="size-5" />
            </IconButton>

            <IconButton href="/cart" label={t("cart")}>
              <ShoppingCart className="size-5" />
              {cartCount > 0 && (
                <span
                  className={cn(
                    "absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold",
                    BADGE
                  )}
                >
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </IconButton>

            <div className="relative" ref={accountRef}>
              <button
                type="button"
                onClick={() => setAccountOpen((v) => !v)}
                aria-label={t("account")}
                aria-expanded={accountOpen}
                className="inline-flex items-center gap-1 rounded-full px-1.5 py-1.5 text-[var(--huza-ink)] transition-colors hover:bg-[var(--huza-mint)]"
              >
                <span className="inline-flex size-10 items-center justify-center">
                  <User className="size-5" />
                </span>
                {session?.user && firstName ? (
                  <span className="hidden max-w-[7rem] truncate text-left text-xs font-semibold lg:block">
                    {t("hello")} {firstName}
                  </span>
                ) : null}
                <ChevronDown className="hidden size-3.5 text-[var(--huza-muted)] lg:block" />
              </button>

              {accountOpen && (
                <div className="absolute right-0 z-50 mt-1 w-52 overflow-hidden rounded-xl border border-[var(--huza-line)] bg-white py-1 shadow-lg">
                  {session?.user ? (
                    <>
                      <p className="truncate border-b border-[var(--huza-line)] px-3 py-2 text-xs text-[var(--huza-muted)]">
                        {t("hello")} {firstName}
                      </p>
                      <Link
                        href="/account#orders"
                        className="block px-3 py-2.5 text-sm hover:bg-[var(--huza-mint)]"
                        onClick={() => setAccountOpen(false)}
                      >
                        {t("orders")}
                      </Link>
                      <Link
                        href="/account#addresses"
                        className="block px-3 py-2.5 text-sm hover:bg-[var(--huza-mint)]"
                        onClick={() => setAccountOpen(false)}
                      >
                        {t("savedAddresses")}
                      </Link>
                      <Link
                        href="/wishlist"
                        className="block px-3 py-2.5 text-sm hover:bg-[var(--huza-mint)]"
                        onClick={() => setAccountOpen(false)}
                      >
                        {t("wishlist")}
                      </Link>
                      <button
                        type="button"
                        className="block w-full px-3 py-2.5 text-left text-sm hover:bg-[var(--huza-mint)]"
                        onClick={() => {
                          setAccountOpen(false);
                          signOut({ callbackUrl: "/" });
                        }}
                      >
                        {t("logout")}
                      </button>
                    </>
                  ) : (
                    <Link
                      href="/auth/login"
                      className="flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-[var(--huza-green-dark)] hover:bg-[var(--huza-mint)]"
                      onClick={() => setAccountOpen(false)}
                    >
                      <LogIn className="size-4" />
                      {t("login")}
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-0.5 md:hidden">
            <IconButton href="/cart" label={t("cart")}>
              <ShoppingCart className="size-5" />
              {cartCount > 0 && (
                <span
                  className={cn(
                    "absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold",
                    BADGE
                  )}
                >
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </IconButton>
            <IconButton
              href={session?.user ? "/account" : "/auth/login"}
              label={session?.user ? t("account") : t("login")}
            >
              <User className="size-5" aria-hidden />
            </IconButton>
          </div>
        </div>

        {/* Mobile search. Fixed padding (part of sticky top) */}
        <div className="h-[60px] border-t border-[var(--huza-line)] px-3 py-2 md:hidden">
          <SmartSearch size="lg" />
        </div>
      </div>

      {/* Not sticky: scrolls away naturally (no JS hide = no shake) */}
      <div className="hidden border-b border-[var(--huza-line)] bg-white md:block">
        <div className="relative mx-auto flex h-11 max-w-7xl items-center gap-6 px-3 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--huza-ink)] transition-colors hover:text-[var(--huza-green)]"
          >
            <span aria-hidden>🏠</span>
            {t("youthHuzaHome")}
          </Link>

          <div className="relative" ref={catsRef}>
            <button
              type="button"
              onClick={() => setCatsOpen((v) => !v)}
              aria-expanded={catsOpen}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--huza-mint)] px-3.5 text-sm font-semibold text-[var(--huza-green-dark)] transition-colors hover:bg-[#d8f0e0]",
                catsOpen && "ring-2 ring-[var(--huza-green)]/30"
              )}
            >
              <span aria-hidden>🥬</span>
              {t("categories")}
            </button>

            {catsOpen && (
              <div className="absolute left-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-[var(--huza-line)] bg-white py-1 shadow-lg">
                {NAV_CATEGORIES.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/products?category=${c.slug}`}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-[var(--huza-mint)]"
                    onClick={() => setCatsOpen(false)}
                  >
                    <span className="text-lg" aria-hidden>
                      {c.emoji}
                    </span>
                    <span className="font-medium">{catLabel(c)}</span>
                  </Link>
                ))}
                <Link
                  href="/categories"
                  className="block border-t border-[var(--huza-line)] px-3 py-2.5 text-sm font-semibold text-[var(--huza-green-dark)] hover:bg-[var(--huza-mint)]"
                  onClick={() => setCatsOpen(false)}
                >
                  {t("allCategories")} →
                </Link>
              </div>
            )}
          </div>

          <Link
            href="/#special-offers"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--huza-ink)] transition-colors hover:text-[var(--huza-green)]"
          >
            <span aria-hidden>🔥</span>
            {t("navOffers")}
          </Link>

          <Link
            href="/#fresh-today"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--huza-ink)] transition-colors hover:text-[var(--huza-green)]"
          >
            <span aria-hidden>🌱</span>
            {t("navFreshToday")}
          </Link>
        </div>
      </div>

      <div className="border-b border-[var(--huza-line)] bg-white md:hidden">
        <div
          className="flex gap-2 overflow-x-auto px-3 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="navigation"
          aria-label={t("categories")}
        >
          <Link
            href="/"
            className="flex w-[4.75rem] shrink-0 flex-col items-center gap-1 rounded-xl px-1 py-1 text-center active:bg-[var(--huza-mint)]"
          >
            <span
              className="flex size-11 items-center justify-center rounded-full bg-[var(--huza-mint)] text-lg"
              aria-hidden
            >
              🏠
            </span>
            <span className="w-full truncate text-[10px] font-semibold leading-tight text-[var(--huza-ink)]">
              {t("youthHuzaHome")}
            </span>
          </Link>
          {NAV_CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/products?category=${c.slug}`}
              className="flex w-[4.25rem] shrink-0 flex-col items-center gap-1 rounded-xl px-1 py-1 text-center active:bg-[var(--huza-mint)]"
            >
              <span
                className="flex size-11 items-center justify-center rounded-full bg-[var(--huza-mint)] text-xl"
                aria-hidden
              >
                {c.emoji}
              </span>
              <span className="w-full truncate text-[10px] font-semibold leading-tight text-[var(--huza-ink)]">
                {catLabel(c)}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
