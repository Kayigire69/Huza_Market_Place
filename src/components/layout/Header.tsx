"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ShoppingCart,
  User,
  Menu,
  X,
  Heart,
  Package,
  ChevronDown,
  Truck,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useCart } from "@/lib/cart-store";
import { useLocale } from "@/lib/locale-context";
import { locales, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { SmartSearch } from "@/components/layout/SmartSearch";
import { CategoriesMenu } from "@/components/layout/CategoriesMenu";

const LOCALE_SHORT: Record<Locale, string> = {
  en: "EN",
  fr: "FR",
  rw: "RW",
  sw: "SW",
};

function IconBtn({
  href,
  label,
  children,
  className,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        "inline-flex size-10 items-center justify-center rounded-full text-[var(--huza-ink)] transition hover:bg-[var(--huza-mint)]",
        className
      )}
    >
      {children}
    </Link>
  );
}

export function Header() {
  const { t, locale, setLocale } = useLocale();
  const items = useCart((s) => s.items);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 56);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--huza-line)] bg-[rgba(247,251,248,0.96)] backdrop-blur-md">
      {/* Delivery strip — shopping utility, not marketing nav */}
      <div
        className={cn(
          "border-b border-[var(--huza-line)]/70 bg-[var(--huza-mint)]/70 transition-[max-height,opacity] duration-200",
          compact ? "max-h-0 overflow-hidden opacity-0" : "max-h-10 opacity-100"
        )}
      >
        <p className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-3 py-1.5 text-xs font-semibold text-[var(--huza-green-dark)] sm:px-6 sm:text-[13px]">
          <Truck className="size-3.5 shrink-0" />
          {t("deliveryBanner")}
        </p>
      </div>

      <div className="mx-auto max-w-7xl px-3 sm:px-6">
        {/* Main shopping row */}
        <div
          className={cn(
            "flex items-center gap-3 transition-[height] duration-200",
            compact ? "h-14" : "h-14 sm:h-[4.25rem]"
          )}
        >
          <Link
            href="/"
            className="mr-1 flex shrink-0 items-center gap-2.5 sm:mr-3"
            aria-label="HUZA FRESH home"
          >
            <Image
              src="/logo.svg"
              alt="HUZA FRESH"
              width={40}
              height={40}
              className="h-9 w-9 sm:h-10 sm:w-10"
              priority
            />
            <div className="hidden leading-tight min-[420px]:block">
              <p className="font-[family-name:var(--font-display)] text-base font-bold tracking-tight text-[var(--huza-green-dark)] sm:text-lg">
                HUZA FRESH
              </p>
              {!compact && (
                <p className="hidden text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--huza-green)] sm:block">
                  {t("poweredBy")}
                </p>
              )}
            </div>
          </Link>

          {/* Dominant search — desktop */}
          <div className="mx-2 hidden min-w-0 flex-1 md:block lg:mx-6">
            <SmartSearch size="lg" />
          </div>

          <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
            <label className="sr-only" htmlFor="huza-lang">
              {t("language")}
            </label>
            <div
              className={cn(
                "relative hidden items-center sm:flex",
                compact && "md:hidden lg:flex"
              )}
            >
              <select
                id="huza-lang"
                value={locale}
                onChange={(e) => setLocale(e.target.value as Locale)}
                className="h-10 appearance-none rounded-full border border-[var(--huza-line)] bg-white py-0 pl-3 pr-8 text-sm font-semibold text-[var(--huza-ink)] outline-none hover:border-[var(--huza-green)]"
              >
                {locales.map((l) => (
                  <option key={l} value={l}>
                    {LOCALE_SHORT[l]}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 size-3.5 text-[var(--huza-muted)]" />
            </div>

            <IconBtn
              href="/wishlist"
              label={t("wishlist")}
              className={cn(compact && "hidden md:hidden lg:inline-flex", "hidden sm:inline-flex")}
            >
              <Heart className="size-5" />
            </IconBtn>

            <IconBtn
              href="/track"
              label={t("trackOrder")}
              className={cn(compact ? "hidden lg:inline-flex" : "hidden sm:inline-flex")}
            >
              <Package className="size-5" />
            </IconBtn>

            <Link
              href="/cart"
              aria-label={t("cart")}
              className="relative inline-flex size-10 items-center justify-center rounded-full text-[var(--huza-ink)] transition hover:bg-[var(--huza-mint)]"
            >
              <ShoppingCart className="size-5" />
              {count > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 translate-x-0.5 -translate-y-0.5 items-center justify-center rounded-full bg-[var(--huza-gold)] px-1 text-[10px] font-bold leading-none text-[var(--huza-ink)] ring-2 ring-[rgba(247,251,248,0.96)]">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </Link>

            {session?.user ? (
              <div className="relative group">
                <Link
                  href="/account"
                  aria-label={t("account")}
                  className="inline-flex size-10 items-center justify-center rounded-full text-[var(--huza-ink)] transition hover:bg-[var(--huza-mint)]"
                >
                  <User className="size-5" />
                </Link>
                <div className="invisible absolute right-0 z-50 mt-1 w-48 rounded-xl border border-[var(--huza-line)] bg-white p-2 shadow-lg group-hover:visible group-focus-within:visible">
                  <p className="truncate px-2 py-1 text-xs text-[var(--huza-muted)]">
                    {session.user.name}
                  </p>
                  <Link href="/account" className="block rounded-lg px-2 py-1.5 text-sm hover:bg-[var(--huza-mint)]">
                    {t("account")}
                  </Link>
                  <Link href="/wishlist" className="block rounded-lg px-2 py-1.5 text-sm hover:bg-[var(--huza-mint)]">
                    {t("wishlist")}
                  </Link>
                  <Link href="/track" className="block rounded-lg px-2 py-1.5 text-sm hover:bg-[var(--huza-mint)]">
                    {t("trackOrder")}
                  </Link>
                  {session.user.role === "SUPPLIER" && (
                    <Link href="/farmer" className="block rounded-lg px-2 py-1.5 text-sm hover:bg-[var(--huza-mint)]">
                      {t("farmerPortal")}
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-[var(--huza-mint)]"
                  >
                    {t("logout")}
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href="/auth/login"
                aria-label={t("login")}
                className="inline-flex size-10 items-center justify-center rounded-full text-[var(--huza-ink)] transition hover:bg-[var(--huza-mint)] sm:size-auto sm:gap-1.5 sm:rounded-full sm:bg-[var(--huza-green)] sm:px-3.5 sm:py-2 sm:text-sm sm:font-semibold sm:text-white sm:hover:bg-[var(--huza-green-dark)]"
              >
                <User className="size-5 sm:hidden" />
                <span className="hidden sm:inline">{t("login")}</span>
              </Link>
            )}

            <button
              type="button"
              className="inline-flex size-10 items-center justify-center rounded-full hover:bg-[var(--huza-mint)] md:hidden"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={t("menu")}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {/* Mobile search — always available */}
        <div className="pb-2.5 md:hidden">
          <SmartSearch size="lg" />
        </div>

        {/* Desktop secondary nav — shopping only */}
        <nav
          className={cn(
            "hidden items-center gap-5 border-t border-[var(--huza-line)]/80 text-sm font-semibold transition-[max-height,opacity,padding] duration-200 md:flex",
            compact
              ? "max-h-0 overflow-hidden border-0 py-0 opacity-0"
              : "max-h-12 py-2.5 opacity-100"
          )}
        >
          <CategoriesMenu variant="desktop" />
          <Link
            href="/products?featured=1"
            className="text-[var(--huza-ink)] transition hover:text-[var(--huza-green-dark)]"
          >
            {t("specialOffers")}
          </Link>
          <Link
            href="/track"
            className="text-[var(--huza-muted)] transition hover:text-[var(--huza-green-dark)]"
          >
            {t("trackOrder")}
          </Link>
        </nav>

        {/* Compact mobile overflow menu — secondary links only */}
        {menuOpen && (
          <div className="space-y-1 border-t border-[var(--huza-line)] pb-3 pt-2 md:hidden">
            <label className="flex items-center justify-between gap-3 rounded-xl border border-[var(--huza-line)] bg-white px-3 py-2 text-sm">
              <span className="text-[var(--huza-muted)]">{t("language")}</span>
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value as Locale)}
                className="rounded-md border border-[var(--huza-line)] bg-white px-2 py-1 text-sm font-semibold"
              >
                {locales.map((l) => (
                  <option key={l} value={l}>
                    {LOCALE_SHORT[l]}
                  </option>
                ))}
              </select>
            </label>
            <CategoriesMenu variant="mobile" onNavigate={() => setMenuOpen(false)} />
            {[
              { href: "/products?featured=1", label: t("specialOffers") },
              { href: "/track", label: t("trackOrder") },
              { href: "/wishlist", label: t("wishlist") },
              { href: "/support", label: t("support") },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="block rounded-lg px-2 py-2.5 font-medium hover:bg-[var(--huza-mint)]"
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
