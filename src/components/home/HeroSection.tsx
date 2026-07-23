"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, Truck, BadgeCheck, Smartphone } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { cn } from "@/lib/utils";
import {
  DEFAULT_SHOP_HERO_SLIDES,
  enabledShopHeroSlides,
  shopHeroCopy,
  type ShopHeroSlide,
} from "@/lib/shop-hero";

const PROMO_KEYS = ["heroPromoDelivery", "heroPromoCheckout", "heroPromoQuality"] as const;

const ROTATE_MS = 5500;

/**
 * Phase 2 Hero. CMS-driven slides (Admin → Website Content).
 * Copy follows locale (EN / Kinyarwanda) and the active slide.
 */
export function HeroSection() {
  const { t, locale } = useLocale();
  const [promoIndex, setPromoIndex] = useState(0);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [slides, setSlides] = useState<ShopHeroSlide[]>(() =>
    enabledShopHeroSlides(DEFAULT_SHOP_HERO_SLIDES)
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/public/hero", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        const next = Array.isArray(data.slides) ? (data.slides as ShopHeroSlide[]) : [];
        // CMS configured → always apply (even if empty / all disabled).
        // Unconfigured → keep built-in defaults already in state.
        if (data.source === "cms" || data.configured) {
          setSlides(next);
          setBannerIndex(0);
        } else if (next.length > 0) {
          setSlides(next);
          setBannerIndex(0);
        }
      } catch {
        /* keep defaults */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setPromoIndex((i) => (i + 1) % PROMO_KEYS.length);
    }, 5000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const id = window.setInterval(() => {
      setBannerIndex((i) => (i + 1) % slides.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [paused, slides.length]);

  const go = useCallback(
    (next: number) => {
      if (slides.length === 0) return;
      setBannerIndex((next + slides.length) % slides.length);
    },
    [slides.length]
  );

  const active = slides[bannerIndex] || slides[0];
  const copy = useMemo(
    () => (active ? shopHeroCopy(active, locale) : null),
    [active, locale]
  );

  if (!active || !copy) return null;

  return (
    <div>
      <div className="border-b border-[var(--huza-line)] bg-[#f3f6f4]">
        <p
          key={PROMO_KEYS[promoIndex]}
          className="hero-promo-fade mx-auto flex max-w-7xl items-center justify-center gap-1.5 px-3 py-1 text-center text-[11px] font-medium tracking-wide text-[var(--huza-muted)] sm:text-xs"
        >
          <span>{t(PROMO_KEYS[promoIndex])}</span>
        </p>
      </div>

      <section aria-label="HUZA FRESH hero" className="border-b border-[var(--huza-line)] bg-white">
        <div className="mx-auto grid max-w-7xl items-center gap-4 px-4 py-3 sm:gap-6 sm:px-6 sm:py-4 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] md:gap-8 md:py-5">
          <div className="hero-fade-in order-1 min-w-0">
            <h1 className="font-[family-name:var(--font-display)] text-[1.5rem] font-extrabold leading-[1.15] tracking-tight text-[var(--huza-green-dark)] sm:text-[1.85rem] lg:text-[2rem]">
              {copy.heading}
            </h1>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-[var(--huza-muted)] sm:text-[15px]">
              {copy.support}
            </p>

            <div className="mt-4 flex flex-wrap gap-3 sm:mt-5">
              <Link
                href={copy.primaryHref}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--huza-green)] px-6 text-sm font-semibold text-white transition-colors hover:bg-[var(--huza-green-dark)] sm:h-[52px] sm:px-7 sm:text-[15px]"
              >
                {copy.primaryCta}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              {copy.secondaryCta.trim() ? (
                <Link
                  href={copy.secondaryHref}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[var(--huza-green)] bg-white px-6 text-sm font-semibold text-[var(--huza-green-dark)] transition-colors hover:bg-[var(--huza-mint)] sm:h-[52px] sm:px-7 sm:text-[15px]"
                >
                  {copy.secondaryCta}
                </Link>
              ) : null}
            </div>

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

          <div
            className="hero-fade-in order-2 md:justify-self-end md:w-[92%]"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <div className="relative h-[170px] overflow-hidden rounded-3xl bg-[var(--huza-mint)] shadow-[0_8px_28px_rgba(11,92,52,0.12)] sm:h-[210px] md:h-[290px] lg:h-[315px]">
              {slides.map((banner, i) => (
                <Link
                  key={banner.id}
                  href={banner.href || "/products"}
                  tabIndex={i === bannerIndex ? 0 : -1}
                  aria-hidden={i !== bannerIndex}
                  className={cn(
                    "absolute inset-0 transition-opacity duration-500 ease-out",
                    i === bannerIndex ? "opacity-100" : "pointer-events-none opacity-0"
                  )}
                >
                  <Image
                    src={banner.imageUrl}
                    alt={shopHeroCopy(banner, locale).badgeLabel}
                    fill
                    priority={i === 0}
                    sizes="(max-width: 768px) 100vw, 42vw"
                    quality={78}
                    className="object-cover object-[center_40%]"
                  />
                </Link>
              ))}

              <span className="pointer-events-none absolute left-3 top-3 z-[2] inline-flex max-w-[70%] items-center gap-1.5 truncate rounded-full bg-white/92 px-2.5 py-1 text-[11px] font-semibold text-[var(--huza-green-dark)] shadow-sm sm:left-4 sm:top-4 sm:text-xs">
                <span aria-hidden>{active.emoji || "🌿"}</span>
                <span className="truncate">{copy.badgeLabel}</span>
              </span>

              {slides.length > 1 ? (
                <div
                  className="absolute inset-x-0 bottom-3 z-[2] flex items-center justify-center gap-2 sm:bottom-4"
                  role="tablist"
                  aria-label="Hero banners"
                >
                  {slides.map((banner, i) => (
                    <button
                      key={banner.id}
                      type="button"
                      role="tab"
                      aria-selected={i === bannerIndex}
                      aria-label={shopHeroCopy(banner, locale).badgeLabel}
                      onClick={() => go(i)}
                      className={cn(
                        "size-2.5 rounded-full border border-white/70 shadow-sm transition-colors",
                        i === bannerIndex
                          ? "bg-[var(--huza-green)]"
                          : "bg-white/75 hover:bg-white"
                      )}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
