"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Search, ShoppingCart, User, Menu, X } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useCart } from "@/lib/cart-store";
import { useLocale } from "@/lib/locale-context";
import { localeFlags, locales, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function Header() {
  const { t, locale, setLocale } = useLocale();
  const items = useCart((s) => s.items);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    router.push(query ? `/products?q=${encodeURIComponent(query)}` : "/products");
    setOpen(false);
  };

  const nav = [
    { href: "/", label: t("home") },
    { href: "/products", label: t("products") },
    { href: "/categories", label: t("categories") },
    { href: "/supplier", label: t("supplierPortal") },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--huza-line)] bg-[rgba(247,251,248,0.92)] backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center gap-3 sm:gap-6">
          <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="Youth Huza">
            <Image src="/logo.svg" alt="Youth Huza" width={40} height={40} priority />
            <div className="hidden sm:block leading-tight">
              <p className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--huza-green-dark)] tracking-tight">
                YOUTH HUZA
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--huza-green)]">
                Huza Market Place
              </p>
            </div>
          </Link>

          <form onSubmit={onSearch} className="hidden md:flex flex-1 max-w-xl mx-auto">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--huza-muted)]" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="w-full rounded-full border border-[var(--huza-line)] bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[var(--huza-green)]"
              />
            </div>
          </form>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <label className="sr-only" htmlFor="lang">
              {t("language")}
            </label>
            <select
              id="lang"
              value={locale}
              onChange={(e) => setLocale(e.target.value as Locale)}
              className="rounded-md border border-[var(--huza-line)] bg-white px-2 py-1.5 text-sm"
            >
              {locales.map((l) => (
                <option key={l} value={l}>
                  {localeFlags[l]} {l.toUpperCase()}
                </option>
              ))}
            </select>

            <Link
              href="/cart"
              className="relative inline-flex items-center justify-center rounded-full p-2 hover:bg-[var(--huza-mint)]"
              aria-label={t("cart")}
            >
              <ShoppingCart className="size-5" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--huza-gold)] px-1 text-[10px] font-bold text-[var(--huza-ink)]">
                  {count}
                </span>
              )}
            </Link>

            {session?.user ? (
              <div className="relative group">
                <Link
                  href="/account"
                  className="inline-flex items-center gap-1 rounded-full p-2 hover:bg-[var(--huza-mint)]"
                >
                  <User className="size-5" />
                </Link>
                <div className="invisible group-hover:visible absolute right-0 mt-1 w-44 rounded-lg border border-[var(--huza-line)] bg-white p-2 shadow-lg">
                  <p className="px-2 py-1 text-xs text-[var(--huza-muted)] truncate">
                    {session.user.name}
                  </p>
                  <Link href="/account" className="block rounded px-2 py-1.5 text-sm hover:bg-[var(--huza-mint)]">
                    {t("account")}
                  </Link>
                  {session.user.role === "ADMIN" && (
                    <Link href="/admin" className="block rounded px-2 py-1.5 text-sm hover:bg-[var(--huza-mint)]">
                      {t("admin")}
                    </Link>
                  )}
                  {(session.user.role === "SUPPLIER" || session.user.role === "ADMIN") && (
                    <Link href="/supplier" className="block rounded px-2 py-1.5 text-sm hover:bg-[var(--huza-mint)]">
                      {t("supplierPortal")}
                    </Link>
                  )}
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-[var(--huza-mint)]"
                  >
                    {t("logout")}
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="hidden sm:inline-flex rounded-full bg-[var(--huza-green)] px-3 py-1.5 text-sm font-semibold text-white"
              >
                {t("login")}
              </Link>
            )}

            <button
              className="md:hidden p-2"
              onClick={() => setOpen((v) => !v)}
              aria-label="Menu"
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6 pb-3 text-sm font-medium">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "pb-1 border-b-2 border-transparent hover:text-[var(--huza-green)]",
                pathname === item.href && "border-[var(--huza-green)] text-[var(--huza-green-dark)]"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {open && (
          <div className="md:hidden pb-4 space-y-3">
            <form onSubmit={onSearch}>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="w-full rounded-lg border border-[var(--huza-line)] bg-white px-3 py-2 text-sm"
              />
            </form>
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block py-1 font-medium"
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
