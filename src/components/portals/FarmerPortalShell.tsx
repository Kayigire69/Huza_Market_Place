"use client";

import Image from "next/image";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useLocale } from "@/lib/locale-context";
import { locales, localeLabels, type Locale } from "@/lib/i18n";

const CROP_BACKGROUNDS = [
  "/images/hero/hero-crops.png",
  "/images/hero/hero-greenhouse.png",
  "/images/hero/hero-goods.png",
];

/**
 * Private Farmers Portal shell — Youth Huza branding only (not HUZA FRESH shop chrome).
 */
export function FarmerPortalShell({ children }: { children: React.ReactNode }) {
  const { t, locale, setLocale } = useLocale();
  const { data: session } = useSession();

  return (
    <div className="farmer-portal relative min-h-screen overflow-hidden">
      {/* Soft crop atmosphere — different images, low opacity so forms stay readable */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute inset-0 farmer-portal-wash" />
        <div className="absolute -right-8 top-24 h-64 w-64 overflow-hidden rounded-full opacity-[0.22] sm:h-80 sm:w-80">
          <Image src={CROP_BACKGROUNDS[0]} alt="" fill className="object-cover" sizes="320px" />
        </div>
        <div className="absolute -left-10 bottom-40 h-72 w-72 overflow-hidden rounded-[2rem] opacity-[0.18] sm:h-96 sm:w-96">
          <Image src={CROP_BACKGROUNDS[1]} alt="" fill className="object-cover" sizes="384px" />
        </div>
        <div className="absolute right-[12%] bottom-8 hidden h-48 w-72 overflow-hidden rounded-3xl opacity-[0.16] lg:block">
          <Image src={CROP_BACKGROUNDS[2]} alt="" fill className="object-cover" sizes="288px" />
        </div>
      </div>

      <header className="border-b border-[var(--huza-line)]/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/farmer" className="flex items-center gap-3">
            <Image
              src="/logo.svg"
              alt="Youth Huza"
              width={44}
              height={44}
              className="rounded-full ring-1 ring-[var(--huza-line)]"
              priority
            />
            <div>
              <p className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-[var(--huza-green-dark)] sm:text-xl">
                Youth Huza
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--huza-muted)]">
                {t("farmerPortal")}
              </p>
            </div>
          </Link>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <select
              className="rounded-lg border border-[var(--huza-line)] bg-white px-2 py-1.5 text-xs font-semibold"
              value={locale}
              onChange={(e) => setLocale(e.target.value as Locale)}
              aria-label="Language"
            >
              {locales.map((l) => (
                <option key={l} value={l}>
                  {localeLabels[l]}
                </option>
              ))}
            </select>

            {session?.user ? (
              <>
                <span className="hidden text-xs text-[var(--huza-muted)] sm:inline max-w-[140px] truncate">
                  {session.user.name}
                </span>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/farmer" })}
                  className="rounded-lg border border-[var(--huza-line)] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--huza-mint)]"
                >
                  {t("logout")}
                </button>
              </>
            ) : (
              <Link
                href="/auth/login?callbackUrl=/farmer"
                className="rounded-lg bg-[var(--huza-green)] px-3 py-1.5 text-xs font-semibold text-white"
              >
                {t("farmerLogin")}
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="relative z-10">{children}</div>

      <footer className="relative z-10 mt-16 border-t border-[var(--huza-line)]/70 bg-white/80 py-6 text-center text-xs text-[var(--huza-muted)] backdrop-blur-sm">
        <p>
          © {new Date().getFullYear()} Youth Huza · {t("farmerPortal")} — partner entry only
        </p>
        <p className="mt-1">{t("farmerPortalPrivateHint")}</p>
      </footer>
    </div>
  );
}
