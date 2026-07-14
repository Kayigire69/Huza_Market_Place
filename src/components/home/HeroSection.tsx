"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Leaf, Truck, BadgeCheck } from "lucide-react";
import { useLocale } from "@/lib/locale-context";

const PROMO_KEYS = ["heroPromoDelivery", "heroPromoQuality", "heroPromoFlatFee"] as const;

const PROMO_ICONS = [Truck, BadgeCheck, Leaf] as const;

/**
 * Phase 2 Hero (locked Version 1.0)
 * Compact shopping hero — one headline, one image, two shopping CTAs.
 * Does not alter Phase 1 header.
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

  const PromoIcon = PROMO_ICONS[promoIndex];

  return (
    <div>
      {/* Slim rotating promo bar — one message at a time */}
      <div className="border-b border-[var(--huza-line)] bg-white">
        <p
          key={PROMO_KEYS[promoIndex]}
          className="hero-promo-fade mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-2 text-center text-xs font-semibold text-[var(--huza-green-dark)] sm:text-sm"
        >
          <PromoIcon className="size-3.5 shrink-0 text-[var(--huza-green)] sm:size-4" aria-hidden />
          <span>{t(PROMO_KEYS[promoIndex])}</span>
        </p>
      </div>

      <section
        aria-label="HUZA FRESH hero"
        className="border-b border-[var(--huza-line)] bg-white"
      >
        <div className="mx-auto grid max-w-7xl items-center gap-5 px-4 py-5 sm:gap-8 sm:px-6 sm:py-8 md:grid-cols-2 md:gap-10 md:py-10">
          {/* Copy + CTAs */}
          <div className="hero-fade-in order-1 min-w-0 md:order-1">
            <h1 className="font-[family-name:var(--font-display)] text-[1.65rem] font-extrabold leading-[1.15] tracking-tight text-[var(--huza-green-dark)] sm:text-3xl lg:text-[2.15rem]">
              {t("heroHeadline")}
            </h1>
            <p className="mt-2.5 max-w-md text-sm leading-relaxed text-[var(--huza-muted)] sm:mt-3 sm:text-[15px]">
              {t("heroSupport")}
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5 sm:mt-5 sm:gap-3">
              <Link
                href="/products"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--huza-green)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--huza-green-dark)] sm:h-12 sm:px-6 sm:text-[15px]"
              >
                {t("heroCta")}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link
                href="/#categories"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-[var(--huza-line)] bg-white px-5 text-sm font-semibold text-[var(--huza-green-dark)] transition hover:border-[var(--huza-green)] hover:bg-[var(--huza-mint)] sm:h-12 sm:px-6 sm:text-[15px]"
              >
                {t("browseCategories")}
              </Link>
            </div>
          </div>

          {/* Single hero image — ~350–450px desktop, compact on mobile */}
          <div className="hero-fade-in order-2 md:order-2">
            <div className="relative h-[220px] overflow-hidden rounded-2xl bg-[var(--huza-mint)] sm:h-[280px] md:h-[380px] lg:h-[420px]">
              <Image
                src="/images/hero/hero-crops.jpg"
                alt={t("heroImageAlt")}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                quality={75}
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
