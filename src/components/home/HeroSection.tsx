"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Truck, BadgeCheck, Smartphone } from "lucide-react";
import { useLocale } from "@/lib/locale-context";

const PROMO_KEYS = ["heroPromoDelivery", "heroPromoQuality", "heroPromoFlatFee"] as const;

/**
 * Phase 2 Hero — refined compact shopping hero.
 */
export function HeroSection() {
  const { t } = useLocale();
  const [promoIndex, setPromoIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setPromoIndex((i) => (i + 1) % PROMO_KEYS.length);
    }, 5000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div>
      {/* Amazon-style slim promo — one message, small type */}
      <div className="border-b border-[var(--huza-line)] bg-[#f3f6f4]">
        <p
          key={PROMO_KEYS[promoIndex]}
          className="hero-promo-fade mx-auto flex max-w-7xl items-center justify-center gap-1.5 px-3 py-1 text-center text-[11px] font-medium tracking-wide text-[var(--huza-muted)] sm:text-xs"
        >
          <span aria-hidden className="text-[var(--huza-green)]">
            ·
          </span>
          <span>{t(PROMO_KEYS[promoIndex])}</span>
        </p>
      </div>

      <section aria-label="HUZA FRESH hero" className="border-b border-[var(--huza-line)] bg-white">
        {/* Tighter gap under banner; 55/45 desktop split */}
        <div className="mx-auto grid max-w-7xl items-center gap-4 px-4 py-3 sm:gap-6 sm:px-6 sm:py-4 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] md:gap-8 md:py-5">
          {/* Copy + CTAs */}
          <div className="hero-fade-in order-1 min-w-0">
            <h1 className="font-[family-name:var(--font-display)] text-[1.5rem] font-extrabold leading-[1.15] tracking-tight text-[var(--huza-green-dark)] sm:text-[1.85rem] lg:text-[2rem]">
              {t("heroHeadline")}
            </h1>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-[var(--huza-muted)] sm:text-[15px]">
              {t("heroSupport")}
            </p>

            <div className="mt-4 flex flex-wrap gap-2.5 sm:mt-5 sm:gap-3">
              <Link
                href="/products"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--huza-green)] px-6 text-sm font-semibold text-white transition-colors hover:bg-[var(--huza-green-dark)] sm:h-[52px] sm:px-7 sm:text-[15px]"
              >
                {t("heroCta")}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link
                href="/#categories"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-[var(--huza-line)] bg-white px-6 text-sm font-semibold text-[var(--huza-green-dark)] transition-colors hover:border-[var(--huza-green)] hover:bg-[var(--huza-mint)] sm:h-[52px] sm:px-7 sm:text-[15px]"
              >
                {t("browseCategories")}
              </Link>
            </div>

            {/* Trust row — icons + short labels only */}
            <ul className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 sm:mt-5 sm:gap-x-5">
              <li className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[var(--huza-ink)] sm:text-xs">
                <BadgeCheck className="size-3.5 text-[var(--huza-green)]" aria-hidden />
                {t("trustQuality")}
              </li>
              <li className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[var(--huza-ink)] sm:text-xs">
                <Truck className="size-3.5 text-[var(--huza-green)]" aria-hidden />
                {t("trustDelivery")}
              </li>
              <li className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[var(--huza-ink)] sm:text-xs">
                <Smartphone className="size-3.5 text-[var(--huza-green)]" aria-hidden />
                {t("trustMomo")}
              </li>
            </ul>
          </div>

          {/* Image — slightly narrower column, brighter crop, shadow + radius */}
          <div className="hero-fade-in order-2 md:justify-self-end md:w-[92%]">
            <div className="relative h-[170px] overflow-hidden rounded-3xl bg-[var(--huza-mint)] shadow-[0_8px_28px_rgba(11,92,52,0.12)] sm:h-[210px] md:h-[290px] lg:h-[315px]">
              <Image
                src="/images/hero/hero-crops.jpg"
                alt={t("heroImageAlt")}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 42vw"
                quality={78}
                className="object-cover object-center brightness-[1.06] contrast-[1.02] saturate-[1.05]"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
