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
import {
  DEFAULT_SHOP_NAV_SHORTCUTS,
  shopNavShortcutLabel,
  type ShopNavShortcut,
} from "@/lib/shop-nav-shortcuts";
import { SmartSearch } from "@/components/layout/SmartSearch";
import { HuzaFreshLogo } from "@/components/brand/HuzaFreshLogo";
import { useNotificationChime } from "@/hooks/useNotificationChime";

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

function accountInitials(name?: string | null, email?: string | null): string {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  if (parts.length === 1 && parts[0]!.length > 0) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  const local = (email || "").split("@")[0] || "";
  return (local.slice(0, 2) || "?").toUpperCase();
}

function AccountAvatar({
  signedIn,
  initials,
}: {
  signedIn: boolean;
  initials: string;
}) {
  if (!signedIn) {
    return (
      <span className="inline-flex size-10 items-center justify-center">
        <User className="size-5" aria-hidden />
      </span>
    );
  }
  return (
    <span className="relative inline-flex size-10 items-center justify-center">
      <span
        className="inline-flex size-8 items-center justify-center rounded-full bg-[var(--huza-mint)] text-[11px] font-bold tracking-wide text-[var(--huza-green-dark)] ring-1 ring-[var(--huza-green)]/35"
        aria-hidden
      >
        {initials}
      </span>
      <span
        className="absolute bottom-0.5 right-0.5 size-2.5 rounded-full bg-[var(--huza-green)] ring-2 ring-white"
        aria-hidden
      />
    </span>
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
  const [accountSheetOpen, setAccountSheetOpen] = useState(false);
  const [wishCount, setWishCount] = useState(0);
  const [navShortcuts, setNavShortcuts] = useState<ShopNavShortcut[]>(
    () => DEFAULT_SHOP_NAV_SHORTCUTS.filter((s) => s.visible)
  );
  const catsRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const accountHoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isCustomer =
    Boolean(session?.user?.id) &&
    (!session?.user?.role || session.user.role === "CUSTOMER");
  useNotificationChime({ portal: "customer", enabled: isCustomer });

  const signedIn = Boolean(session?.user?.id);
  const firstName =
    session?.user?.name?.trim().split(/\s+/)[0] ||
    session?.user?.email?.split("@")[0] ||
    "";
  const initials = accountInitials(session?.user?.name, session?.user?.email);

  useEffect(() => {
    setCatsOpen(false);
    setAccountOpen(false);
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

  useEffect(() => {
    let cancelled = false;
    fetch("/api/public/nav-shortcuts")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !Array.isArray(data?.items)) return;
        setNavShortcuts(data.items as ShopNavShortcut[]);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

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

  const catLabel = (c: ShopNavShortcut) => shopNavShortcutLabel(c, locale);

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

            <div
              className="relative"
              ref={accountRef}
              onMouseEnter={() => {
                if (!signedIn) return;
                if (accountHoverTimer.current) clearTimeout(accountHoverTimer.current);
                accountHoverTimer.current = setTimeout(() => setAccountOpen(true), 120);
              }}
              onMouseLeave={() => {
                if (accountHoverTimer.current) clearTimeout(accountHoverTimer.current);
                accountHoverTimer.current = setTimeout(() => setAccountOpen(false), 180);
              }}
            >
              {signedIn ? (
                <button
                  type="button"
                  onClick={() => setAccountOpen((v) => !v)}
                  aria-label={`${t("account")} — ${t("hello")} ${firstName}`}
                  aria-expanded={accountOpen}
                  aria-haspopup="menu"
                  className="inline-flex items-center gap-1 rounded-full px-1.5 py-1.5 text-[var(--huza-ink)] transition-colors hover:bg-[var(--huza-mint)]"
                >
                  <AccountAvatar signedIn initials={initials} />
                  {firstName ? (
                    <span className="hidden max-w-[7rem] truncate text-left text-xs font-semibold lg:block">
                      {t("hello")} {firstName}
                    </span>
                  ) : null}
                  <ChevronDown className="hidden size-3.5 text-[var(--huza-muted)] lg:block" />
                </button>
              ) : (
                <Link
                  href="/auth/login"
                  aria-label={t("login")}
                  className="inline-flex items-center gap-1 rounded-full px-1.5 py-1.5 text-[var(--huza-ink)] transition-colors hover:bg-[var(--huza-mint)]"
                >
                  <AccountAvatar signedIn={false} initials="" />
                  <span className="hidden items-center gap-1 text-xs font-semibold lg:inline-flex">
                    <LogIn className="size-3.5" aria-hidden />
                    {t("login")}
                  </span>
                </Link>
              )}

              {signedIn && accountOpen && (
                <div
                  role="menu"
                  className="absolute right-0 z-50 mt-1 w-52 overflow-hidden rounded-xl border border-[var(--huza-line)] bg-white py-1 shadow-lg"
                >
                  <p className="truncate border-b border-[var(--huza-line)] px-3 py-2 text-xs text-[var(--huza-muted)]">
                    {t("hello")} {firstName}
                  </p>
                  <Link
                    role="menuitem"
                    href="/account"
                    className="block px-3 py-2.5 text-sm hover:bg-[var(--huza-mint)]"
                    onClick={() => setAccountOpen(false)}
                  >
                    {t("account")}
                  </Link>
                  <Link
                    role="menuitem"
                    href="/account#orders"
                    className="block px-3 py-2.5 text-sm hover:bg-[var(--huza-mint)]"
                    onClick={() => setAccountOpen(false)}
                  >
                    {t("orders")}
                  </Link>
                  <Link
                    role="menuitem"
                    href="/account#addresses"
                    className="block px-3 py-2.5 text-sm hover:bg-[var(--huza-mint)]"
                    onClick={() => setAccountOpen(false)}
                  >
                    {t("viewProfile")}
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    className="block w-full px-3 py-2.5 text-left text-sm hover:bg-[var(--huza-mint)]"
                    onClick={() => {
                      setAccountOpen(false);
                      signOut({ callbackUrl: "/" });
                    }}
                  >
                    {t("logout")}
                  </button>
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
            {signedIn ? (
              <button
                type="button"
                aria-label={`${t("account")} — ${t("hello")} ${firstName}`}
                aria-expanded={accountSheetOpen}
                onClick={() => setAccountSheetOpen(true)}
                className="relative inline-flex size-10 items-center justify-center rounded-full text-[var(--huza-ink)] transition-colors hover:bg-[var(--huza-mint)] hover:text-[var(--huza-green-dark)]"
              >
                <AccountAvatar signedIn initials={initials} />
              </button>
            ) : (
              <IconButton href="/auth/login" label={t("login")}>
                <User className="size-5" aria-hidden />
              </IconButton>
            )}
          </div>
        </div>

        {accountSheetOpen && signedIn ? (
          <div className="fixed inset-0 z-[80] md:hidden" role="dialog" aria-modal="true" aria-label={t("account")}>
            <button
              type="button"
              className="absolute inset-0 bg-black/35"
              aria-label="Close"
              onClick={() => setAccountSheetOpen(false)}
            />
            <div className="absolute inset-x-0 bottom-0 rounded-t-2xl border border-[var(--huza-line)] bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-xl">
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[var(--huza-line)]" aria-hidden />
              <div className="mb-3 flex items-center gap-3 px-1">
                <AccountAvatar signedIn initials={initials} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--huza-ink)]">
                    {t("hello")} {firstName}
                  </p>
                  <p className="text-xs text-[var(--huza-muted)]">{t("account")}</p>
                </div>
              </div>
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
                <Link
                  href="/account#addresses"
                  className="rounded-xl px-3 py-3 text-sm font-medium hover:bg-[var(--huza-mint)]"
                  onClick={() => setAccountSheetOpen(false)}
                >
                  {t("viewProfile")}
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
                {navShortcuts.map((c) => (
                  <Link
                    key={c.id || c.slug}
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
          {navShortcuts.map((c) => (
            <Link
              key={c.id || c.slug}
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
