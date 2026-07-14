"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Truck, BadgeCheck, Smartphone } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { cn } from "@/lib/utils";

const PROMO_KEYS = ["heroPromoDelivery", "heroPromoQuality", "heroPromoFlatFee"] as const;

const ROTATE_MS = 5500;

/** Five matching hero banners — same lighting, color, and composition. */
const HERO_BANNERS = [
  {
    src: "/images/hero/banner-fruits-vegetables.jpg",
    emoji: "🍎",
    labelKey: "bannerFruitsVeg",
    href: "/products?category=fresh-fruits",
  },
  {
    src: "/images/hero/banner-juices.jpg",
    emoji: "🥤",
    labelKey: "bannerJuices",
    href: "/products?category=fresh-juices",
  },
  {
    src: "/images/hero/banner-fruit-salads.jpg",
    emoji: "🥗",
    labelKey: "bannerSalads",
    href: "/products?category=fruit-salads",
  },
  {
    src: "/images/hero/banner-seedlings.jpg",
    emoji: "🌱",
    labelKey: "bannerSeedlings",
    href: "/products?category=fruit-seedlings",
  },
  {
    src: "/images/hero/banner-ornamental-plants.jpg",
    emoji: "🪴",
    labelKey: "bannerOrnamental",
    href: "/products?category=ornamental-plants",
  },
] as const;

/**
 * Phase 2 Hero — refined compact shopping hero + rotating category banners.
 * Only the banner image area rotates; layout/copy/CTAs unchanged.
 */
export function HeroSection() {
  const { t } = useLocale();
  const [promoIndex, setPromoIndex] = useState(0);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => {
      setPromoIndex((i) => (i + 1) % PROMO_KEYS.length);
    }, 5000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setBannerIndex((i) => (i + 1) % HERO_BANNERS.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [paused]);

  const go = useCallback((next: number) => {
    setBannerIndex((next + HERO_BANNERS.length) % HERO_BANNERS.length);
  }, []);

  const active = HERO_BANNERS[bannerIndex];

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

          {/* Rotating category banners — arrows + dots */}
          <div
            className="hero-fade-in order-2 md:justify-self-end md:w-[92%]"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <div className="relative h-[170px] overflow-hidden rounded-3xl bg-[var(--huza-mint)] shadow-[0_8px_28px_rgba(11,92,52,0.12)] sm:h-[210px] md:h-[290px] lg:h-[315px]">
              {HERO_BANNERS.map((banner, i) => (
                <Link
                  key={banner.src}
                  href={banner.href}
                  tabIndex={i === bannerIndex ? 0 : -1}
                  aria-hidden={i !== bannerIndex}
                  className={cn(
                    "absolute inset-0 transition-opacity duration-500 ease-out",
                    i === bannerIndex ? "opacity-100" : "pointer-events-none opacity-0"
                  )}
                >
                  <Image
                    src={banner.src}
                    alt={t(banner.labelKey)}
                    fill
                    priority={i === 0}
                    sizes="(max-width: 768px) 100vw, 42vw"
                    quality={78}
                    className="object-cover object-center brightness-[1.06] contrast-[1.02] saturate-[1.05]"
                  />
                  <span className="absolute bottom-3 left-3 z-[1] inline-flex items-center gap-1.5 rounded-full bg-white/92 px-2.5 py-1 text-[11px] font-semibold text-[var(--huza-green-dark)] shadow-sm sm:bottom-4 sm:left-4 sm:text-xs">
                    <span aria-hidden>{banner.emoji}</span>
                    {t(banner.labelKey)}
                  </span>
                </Link>
              ))}

              <button
                type="button"
                aria-label="Previous banner"
                onClick={() => go(bannerIndex - 1)}
                className="absolute left-2 top-1/2 z-[2] flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[var(--huza-ink)] shadow-sm transition-colors hover:bg-white sm:left-3 sm:size-9"
              >
                <ChevronLeft className="size-5" aria-hidden />
              </button>
              <button
                type="button"
                aria-label="Next banner"
                onClick={() => go(bannerIndex + 1)}
                className="absolute right-2 top-1/2 z-[2] flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[var(--huza-ink)] shadow-sm transition-colors hover:bg-white sm:right-3 sm:size-9"
              >
                <ChevronRight className="size-5" aria-hidden />
              </button>

              <div
                className="absolute bottom-3 right-3 z-[2] flex items-center gap-1.5 sm:bottom-4 sm:right-4"
                role="tablist"
                aria-label="Hero banners"
              >
                {HERO_BANNERS.map((banner, i) => (
                  <button
                    key={banner.src}
                    type="button"
                    role="tab"
                    aria-selected={i === bannerIndex}
                    aria-label={t(banner.labelKey)}
                    onClick={() => go(i)}
                    className={cn(
                      "h-1.5 rounded-full transition-[width,background-color] duration-300",
                      i === bannerIndex
                        ? "w-5 bg-[var(--huza-green)]"
                        : "w-1.5 bg-white/80 hover:bg-white"
                    )}
                  />
                ))}
              </div>

              <span className="sr-only">
                {active.emoji} {t(active.labelKey)}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
