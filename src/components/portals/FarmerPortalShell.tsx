"use client";

import Image from "next/image";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useLocale } from "@/lib/locale-context";
import { locales, localeLabels, type Locale } from "@/lib/i18n";

const CROP_BACKGROUNDS = [
  "/images/hero/hero-crops.jpg",
  "/images/hero/hero-greenhouse.jpg",
  "/images/hero/hero-goods.jpg",
  "/images/hero/hero-shoppers.jpg",
];

/**
 * Private Farmers Portal shell — Youth Huza branding only (not HUZA FRESH shop chrome).
 */
export function FarmerPortalShell({ children }: { children: React.ReactNode }) {
  const { t, locale, setLocale } = useLocale();
  const { data: session } = useSession();

  return (
    <div className="farmer-portal relative min-h-screen overflow-hidden">
      {/* Clear crop atmosphere — readable farm imagery behind the workspace */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute inset-0">
          <Image
            src={CROP_BACKGROUNDS[0]}
            alt=""
            fill
            className="object-cover object-center"
            sizes="100vw"
            priority
          />
        </div>
        <div className="absolute inset-0 farmer-portal-wash" />
        <div className="absolute -right-4 top-20 h-72 w-72 overflow-hidden rounded-full border-4 border-white/40 shadow-lg opacity-90 sm:h-96 sm:w-96">
          <Image src={CROP_BACKGROUNDS[1]} alt="" fill className="object-cover" sizes="384px" />
        </div>
        <div className="absolute -left-6 bottom-28 h-80 w-80 overflow-hidden rounded-[2rem] border-4 border-white/40 shadow-lg opacity-90 sm:h-[26rem] sm:w-[26rem]">
          <Image src={CROP_BACKGROUNDS[2]} alt="" fill className="object-cover" sizes="416px" />
        </div>
        <div className="absolute right-[10%] bottom-6 hidden h-56 w-80 overflow-hidden rounded-3xl border-4 border-white/40 shadow-lg opacity-90 lg:block">
          <Image src={CROP_BACKGROUNDS[3]} alt="" fill className="object-cover" sizes="320px" />
        </div>
      </div>

      <header className="relative z-20 bg-[var(--huza-green-dark)] shadow-[0_8px_24px_rgba(7,44,27,0.22)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
          <Link href="/farmer" className="flex items-center gap-3">
            <span className="rounded-xl bg-white px-2 py-1.5 shadow-sm ring-1 ring-white/40">
              <Image
                src="/images/youth-huza-logo.png"
                alt="Youth Huza — Connecting you to freshness"
                width={148}
                height={72}
                className="h-12 w-auto sm:h-14"
                priority
              />
            </span>
            <p className="hidden text-[10px] font-semibold uppercase tracking-[0.16em] text-white/75 sm:block">
              {t("farmerPortal")}
            </p>
          </Link>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <select
              className="rounded-lg border border-white/20 bg-white/10 px-2 py-1.5 text-xs font-semibold text-white"
              value={locale}
              onChange={(e) => setLocale(e.target.value as Locale)}
              aria-label="Language"
            >
              {locales.map((l) => (
                <option key={l} value={l} className="text-[var(--huza-ink)]">
                  {localeLabels[l]}
                </option>
              ))}
            </select>

            {session?.user ? (
              <>
                <span className="hidden max-w-[140px] truncate text-xs text-white/75 sm:inline">
                  {session.user.name}
                </span>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/farmer" })}
                  className="rounded-lg border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20"
                >
                  {t("logout")}
                </button>
              </>
            ) : (
              <Link
                href="/auth/login?callbackUrl=/farmer"
                className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-[var(--huza-green-dark)] hover:bg-[var(--huza-mint)]"
              >
                {t("farmerLogin")}
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="relative z-10">{children}</div>

      <footer className="relative z-10 mt-16 border-t border-[var(--huza-line)]/70 bg-white/85 py-6 text-center text-xs text-[var(--huza-muted)] backdrop-blur-sm">
        <p>
          © {new Date().getFullYear()} Youth Huza · {t("farmerPortal")}. {t("allRightsReserved")}
        </p>
      </footer>
    </div>
  );
}
