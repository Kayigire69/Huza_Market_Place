"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useLocale } from "@/lib/locale-context";
import { Button } from "@/components/ui/Button";
import { ProductCard, type ProductCardData } from "@/components/products/ProductCard";
import { HeroSection } from "@/components/home/HeroSection";
import { categoryName } from "@/lib/i18n";
import {
  ArrowRight,
  MapPin,
  ChevronRight,
  ShoppingBasket,
  BadgeCheck,
  Bike,
} from "lucide-react";
import { RecentlyViewedSection } from "@/components/products/RecentlyViewedSection";
import { resolveCategoryImage } from "@/lib/catalog-images";
import { FLAT_DELIVERY_FEE_RWF, formatRwf } from "@/lib/utils";

type Category = {
  id: string;
  slug: string;
  nameEn: string;
  nameFr: string;
  nameRw: string;
  imageUrl?: string | null;
};

type Promo = {
  id: string;
  titleEn: string;
  titleFr: string;
  titleRw: string;
  descriptionEn: string | null;
  descriptionFr: string | null;
  descriptionRw: string | null;
  discountPct: number | null;
  freeDelivery: boolean;
  isFlashSale: boolean;
  code: string | null;
};

type Testimonial = {
  id: string;
  name: string;
  role: string | null;
  commentEn: string;
  commentFr: string;
  commentRw: string;
  rating: number;
};

function SectionHeader({
  title,
  href,
  viewAllLabel,
  hint,
}: {
  title: string;
  href: string;
  viewAllLabel: string;
  hint?: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3 sm:mb-5">
      <div className="min-w-0">
        <h2 className="section-title text-[1.35rem] sm:text-[clamp(1.5rem,2.5vw,2rem)]">{title}</h2>
        {hint ? <p className="mt-1 text-sm text-[var(--huza-muted)]">{hint}</p> : null}
      </div>
      <Link
        href={href}
        className="group inline-flex shrink-0 items-center gap-0.5 text-sm font-semibold text-[var(--huza-green-dark)]"
      >
        {viewAllLabel}
        <ChevronRight className="size-4 transition group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}

function ProductRail({ products }: { products: ProductCardData[] }) {
  return (
    <div className="-mx-4 flex items-stretch gap-3 overflow-x-auto px-4 pb-1 snap-x snap-mandatory sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-4">
      {products.map((p) => (
        <div key={p.id} className="flex w-[46%] shrink-0 snap-start sm:w-auto sm:shrink">
          <div className="w-full">
            <ProductCard product={p} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function HomePage({
  popularNow,
  readyToEat,
  categories,
  promotions,
  testimonials,
  isOpen,
}: {
  popularNow: ProductCardData[];
  readyToEat: ProductCardData[];
  categories: Category[];
  promotions: Promo[];
  testimonials: Testimonial[];
  isOpen: boolean;
}) {
  const { t, locale } = useLocale();
  const [newsletterMsg, setNewsletterMsg] = useState("");

  const promoTitle = (p: Promo) =>
    locale === "fr" ? p.titleFr : locale === "rw" ? p.titleRw : p.titleEn;
  const promoDesc = (p: Promo) =>
    locale === "fr" ? p.descriptionFr : locale === "rw" ? p.descriptionRw : p.descriptionEn;
  const comment = (x: Testimonial) =>
    locale === "fr" ? x.commentFr : locale === "rw" ? x.commentRw : x.commentEn;

  const subscribe = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), phone: form.get("phone") }),
    });
    setNewsletterMsg(res.ok ? t("thanksSubscribed") : t("subscribeFailed"));
    if (res.ok) (e.target as HTMLFormElement).reset();
  };

  const howSteps = [
    { n: "1", title: t("howStep1Title"), body: t("howStep1Body"), icon: ShoppingBasket },
    { n: "2", title: t("howStep2Title"), body: t("howStep2Body"), icon: BadgeCheck },
    { n: "3", title: t("howStep3Title"), body: t("howStep3Body"), icon: Bike },
  ];

  return (
    <div className="home-surface">
      {!isOpen && (
        <div className="bg-[var(--huza-gold)] px-4 py-2 text-center text-sm font-medium text-[var(--huza-ink)]">
          {t("closedNotice")}
        </div>
      )}

      {/* Phase 2 — compact shopping hero (Version 1.0 locked) */}
      <HeroSection />

      {/* 1. Categories first */}
      <section
        id="categories"
        className="mx-auto mt-8 max-w-7xl scroll-mt-28 px-4 sm:mt-12 sm:px-6"
      >
        <SectionHeader
          title={t("shopByCategory")}
          href="/categories"
          viewAllLabel={t("viewAll")}
          hint={t("shopByCategoryHint")}
        />
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/products?category=${c.slug}`}
              className="group relative overflow-hidden rounded-[22px] bg-[var(--huza-mint)] ring-1 ring-[var(--huza-line)] transition hover:ring-[var(--huza-green)]"
            >
              <div className="relative aspect-square">
                <Image
                  src={resolveCategoryImage(c.slug, c.imageUrl)}
                  alt={categoryName(c, locale)}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                <p className="absolute inset-x-0 bottom-0 p-2.5 text-xs font-semibold leading-snug text-white sm:p-3 sm:text-sm">
                  {categoryName(c, locale)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 2. One popular rail — anchor for header "Fresh Today" */}
      {popularNow.length > 0 && (
        <section
          id="fresh-today"
          className="mx-auto mt-10 max-w-7xl scroll-mt-28 px-4 sm:mt-14 sm:px-6"
        >
          <SectionHeader
            title={t("popularNow")}
            href="/products?best=1"
            viewAllLabel={t("viewAll")}
            hint={t("popularNowHint")}
          />
          <ProductRail products={popularNow} />
        </section>
      )}

      {/* 3. Ready to eat */}
      {readyToEat.length > 0 && (
        <section className="mx-auto mt-10 max-w-7xl px-4 sm:mt-14 sm:px-6">
          <SectionHeader
            title={t("readyToEat")}
            href="/products?category=fruit-salads"
            viewAllLabel={t("viewAll")}
            hint={t("readyToEatHint")}
          />
          <ProductRail products={readyToEat} />
          <div className="mt-3 flex flex-wrap gap-2">
            {(["fruit-salads", "fresh-juices"] as const).map((slug) => {
              const cat = categories.find((c) => c.slug === slug);
              if (!cat) return null;
              return (
                <Link
                  key={slug}
                  href={`/products?category=${slug}`}
                  className="rounded-lg border border-[var(--huza-line)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--huza-green-dark)] transition hover:border-[var(--huza-green)] hover:bg-[var(--huza-mint)]"
                >
                  {categoryName(cat, locale)}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* 4. How Huza works */}
      <section className="mx-auto mt-10 max-w-7xl px-4 sm:mt-14 sm:px-6">
        <h2 className="section-title mb-4 text-[1.35rem] sm:mb-5">{t("howHuzaWorks")}</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {howSteps.map((step) => (
            <div
              key={step.n}
              className="rounded-2xl border border-[var(--huza-line)] bg-white/90 p-4 sm:p-5"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--huza-mint)] text-sm font-bold text-[var(--huza-green-dark)]">
                  {step.n}
                </span>
                <step.icon className="size-5 text-[var(--huza-green)]" aria-hidden />
              </div>
              <h3 className="mt-3 font-semibold text-[var(--huza-ink)]">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--huza-muted)]">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {promotions.length > 0 && (
        <section
          id="special-offers"
          className="mx-auto mt-10 max-w-7xl scroll-mt-28 px-4 sm:mt-14 sm:px-6"
        >
          <h2 className="section-title mb-4 text-[1.35rem] sm:mb-5">{t("specialOffers")}</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {promotions.slice(0, 3).map((p, i) => (
              <Link
                key={p.id}
                href="/products"
                className={`rounded-2xl p-5 text-white transition hover:brightness-110 ${
                  i % 2 === 0 ? "bg-[var(--huza-green-dark)]" : "bg-[#166B3F]"
                }`}
              >
                {p.isFlashSale && (
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--huza-gold)]">
                    {t("flashSale")}
                  </span>
                )}
                <h3 className="mt-1 font-[family-name:var(--font-display)] text-lg font-bold sm:text-xl">
                  {promoTitle(p)}
                </h3>
                <p className="mt-2 text-sm text-[#C8E8D4]">{promoDesc(p)}</p>
                {p.code && (
                  <p className="mt-3 inline-block rounded-md bg-white/15 px-3 py-1 text-sm font-mono">
                    {p.code}
                    {p.discountPct ? ` · ${p.discountPct}%` : ""}
                    {p.freeDelivery ? ` · ${t("freeDelivery")}` : ""}
                  </p>
                )}
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--huza-gold)]">
                  {t("heroCta")} <ArrowRight className="size-4" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Delivery — flat fee; ETAs are shown at checkout, not under product photos */}
      <section className="mx-auto mt-10 max-w-7xl px-4 sm:mt-14 sm:px-6">
        <h2 className="section-title mb-4 text-[1.35rem] sm:mb-5">{t("deliveryCoverage")}</h2>
        <div className="mb-3 rounded-xl border border-[var(--huza-line)] bg-white/90 px-4 py-3 text-sm sm:flex sm:items-center sm:justify-between">
          <p className="font-semibold text-[var(--huza-green-dark)]">
            {t("deliveryFeeLabel")}: {formatRwf(FLAT_DELIVERY_FEE_RWF)}
          </p>
          <p className="mt-1 text-xs text-[var(--huza-muted)] sm:mt-0">{t("flatDeliveryFeeHint")}</p>
        </div>
        <div className="grid gap-2.5 sm:grid-cols-3">
          {[t("zoneKigali"), t("zoneKamonyi"), t("zoneBugesera")].map((zone) => (
            <div
              key={zone}
              className="flex items-center gap-3 rounded-xl border border-[var(--huza-line)] bg-white/90 px-3.5 py-3"
            >
              <MapPin className="size-4 shrink-0 text-[var(--huza-green)]" aria-hidden />
              <p className="truncate text-sm font-semibold">{zone}</p>
            </div>
          ))}
        </div>
        <p className="mt-2.5 text-xs text-[var(--huza-muted)] sm:text-sm">{t("deliveryFeeAtCheckoutHint")}</p>
      </section>

      {testimonials.length > 0 && (
        <section className="mx-auto mt-10 max-w-7xl px-4 sm:mt-14 sm:px-6">
          <h2 className="section-title mb-4 text-[1.35rem] sm:mb-5">{t("testimonials")}</h2>
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 snap-x sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
            {testimonials.map((x) => (
              <blockquote
                key={x.id}
                className="w-[85%] shrink-0 snap-start rounded-2xl border border-[var(--huza-line)] bg-white/90 p-4 sm:w-auto"
              >
                <p className="text-[var(--huza-gold)]">{"★".repeat(x.rating)}</p>
                <p className="mt-2 text-sm leading-relaxed">&ldquo;{comment(x)}&rdquo;</p>
                <footer className="mt-3">
                  <p className="text-sm font-semibold">{x.name}</p>
                  <p className="text-xs text-[var(--huza-muted)]">{x.role}</p>
                </footer>
              </blockquote>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto mb-8 mt-10 max-w-7xl px-4 sm:mt-14 sm:px-6">
        <div className="grid items-center gap-6 rounded-3xl bg-[var(--huza-green-dark)] p-6 text-white sm:gap-8 sm:p-10 md:grid-cols-[1.2fr_0.8fr]">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold sm:text-3xl">
              {t("newsletter")}
            </h2>
            <p className="mt-2 text-sm text-[#C8E8D4]">{t("newsletterBody")}</p>
          </div>
          <form onSubmit={subscribe} className="space-y-3">
            <input
              name="email"
              type="email"
              required
              placeholder={t("emailAddress")}
              className="w-full rounded-lg border-0 px-4 py-2.5 text-[var(--huza-ink)]"
            />
            <input
              name="phone"
              placeholder={t("phoneOptional")}
              className="w-full rounded-lg border-0 px-4 py-2.5 text-[var(--huza-ink)]"
            />
            <Button type="submit" variant="secondary" className="w-full">
              {t("subscribe")}
            </Button>
            {newsletterMsg && <p className="text-sm text-[var(--huza-gold)]">{newsletterMsg}</p>}
          </form>
        </div>
      </section>

      <RecentlyViewedSection />
    </div>
  );
}
