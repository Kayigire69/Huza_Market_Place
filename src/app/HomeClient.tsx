"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useLocale } from "@/lib/locale-context";
import { Button } from "@/components/ui/Button";
import { ProductCard, type ProductCardData } from "@/components/products/ProductCard";
import { HeroGallery } from "@/components/home/HeroGallery";
import { categoryName } from "@/lib/i18n";
import {
  ArrowRight,
  Leaf,
  Truck,
  ShieldCheck,
  BadgeCheck,
  MapPin,
  Clock,
  ChevronRight,
} from "lucide-react";
import { RecentlyViewedSection } from "@/components/products/RecentlyViewedSection";

type Category = {
  id: string;
  slug: string;
  nameEn: string;
  nameFr: string;
  nameRw: string;
  imageUrl?: string | null;
};

type CategoryPreview = {
  category: Category;
  products: ProductCardData[];
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
    <div className="mb-5 flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="section-title">{title}</h2>
        {hint ? <p className="mt-1 text-sm text-[var(--huza-muted)]">{hint}</p> : null}
      </div>
      <Link
        href={href}
        className="group inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-[var(--huza-green-dark)]"
      >
        {viewAllLabel}
        <ChevronRight className="size-4 transition group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}

export function HomePage({
  featured,
  bestSellers,
  freshToday,
  categoryPreviews,
  categories,
  promotions,
  testimonials,
  isOpen,
}: {
  featured: ProductCardData[];
  bestSellers: ProductCardData[];
  freshToday: ProductCardData[];
  categoryPreviews: CategoryPreview[];
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

  // Homepage shows two category product strips; remaining categories via shop tiles + View all
  const highlightSlugs = ["fresh-fruits", "fresh-vegetables"];
  const highlightPreviews = categoryPreviews.filter((p) =>
    highlightSlugs.includes(p.category.slug)
  );

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

  return (
    <div className="home-surface">
      {!isOpen && (
        <div className="bg-[var(--huza-gold)] text-[var(--huza-ink)] text-center text-sm font-medium py-2 px-4">
          {t("closedNotice")}
        </div>
      )}

      <section className="hero-fullbleed hero-home">
        <HeroGallery />
        <div className="relative z-10 mx-auto flex min-h-[inherit] max-w-7xl flex-col justify-center px-4 py-16 sm:px-6 sm:py-24">
          <div className="animate-rise max-w-xl">
            <div className="mb-5 flex items-center gap-3 sm:gap-4">
              <Image
                src="/logo.svg"
                alt="Youth Huza logo"
                width={64}
                height={64}
                className="rounded-full shadow-lg ring-2 ring-white/35"
                priority
              />
              <p className="font-[family-name:var(--font-display)] text-lg sm:text-2xl font-bold tracking-tight">
                YOUTH HUZA
              </p>
            </div>
            <h1 className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight">
              HUZA FRESH
            </h1>
            <p className="mt-4 max-w-md text-base sm:text-lg text-[#E2F6EA] leading-relaxed">
              {t("tagline")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/products">
                <Button size="lg" variant="secondary">
                  {t("heroCta")} <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link
                href="/categories"
                className="hidden sm:inline-flex items-center justify-center gap-2 rounded-xl border border-white/35 px-7 py-3.5 text-base font-semibold text-white transition hover:bg-white/10"
              >
                {t("shopByCategory")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--huza-line)] bg-white/80">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 px-4 py-4 sm:grid-cols-4 sm:gap-4 sm:px-6 sm:py-5">
          {[
            { icon: BadgeCheck, label: t("qualityControlled") },
            { icon: Truck, label: t("oneDeliveryTeam") },
            { icon: ShieldCheck, label: t("securePayments") },
            { icon: Leaf, label: t("farmFreshStock") },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2.5 text-sm text-[var(--huza-ink)]">
              <item.icon className="size-5 shrink-0 text-[var(--huza-green)]" />
              <span className="font-medium leading-snug">{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-12 sm:mt-16">
        <SectionHeader
          title={t("shopByCategory")}
          href="/categories"
          viewAllLabel={t("viewAll")}
          hint={t("shopByCategoryHint")}
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 sm:gap-4">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/products?category=${c.slug}`}
              className="group relative overflow-hidden rounded-2xl bg-[var(--huza-mint)] ring-1 ring-[var(--huza-line)] transition hover:ring-[var(--huza-green)]"
            >
              <div className="relative aspect-[4/5] sm:aspect-square">
                {c.imageUrl ? (
                  <Image
                    src={c.imageUrl}
                    alt={categoryName(c, locale)}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--huza-green)] to-[var(--huza-green-dark)]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <p className="absolute inset-x-0 bottom-0 p-3 text-sm font-semibold text-white leading-snug">
                  {categoryName(c, locale)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-12 sm:mt-16">
          <SectionHeader
            title={t("featured")}
            href="/products?featured=1"
            viewAllLabel={t("viewAll")}
          />
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {bestSellers.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-12 sm:mt-16">
          <SectionHeader
            title={t("bestSellers")}
            href="/products?best=1"
            viewAllLabel={t("viewAll")}
          />
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {bestSellers.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {highlightPreviews.map(({ category, products }) =>
        products.length > 0 ? (
          <section key={category.id} className="mx-auto max-w-7xl px-4 sm:px-6 mt-12 sm:mt-16">
            <SectionHeader
              title={categoryName(category, locale)}
              href={`/products?category=${category.slug}`}
              viewAllLabel={t("viewAll")}
            />
            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        ) : null
      )}

      {freshToday.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-12 sm:mt-16">
          <SectionHeader
            title={t("freshToday")}
            href="/products?new=1"
            viewAllLabel={t("viewAll")}
          />
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 snap-x sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4 sm:gap-5">
            {freshToday.map((p) => (
              <div key={p.id} className="w-[70%] shrink-0 snap-start sm:w-auto sm:shrink">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </section>
      )}

      {promotions.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-12 sm:mt-16">
          <h2 className="section-title mb-5">{t("specialOffers")}</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {promotions.slice(0, 3).map((p, i) => (
              <div
                key={p.id}
                className={`rounded-2xl p-5 sm:p-6 text-white ${
                  i % 2 === 0 ? "bg-[var(--huza-green-dark)]" : "bg-[#166B3F]"
                }`}
              >
                {p.isFlashSale && (
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--huza-gold)]">
                    {t("flashSale")}
                  </span>
                )}
                <h3 className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold">
                  {promoTitle(p)}
                </h3>
                <p className="mt-2 text-sm text-[#C8E8D4]">{promoDesc(p)}</p>
                {p.code && (
                  <p className="mt-4 inline-block rounded-md bg-white/15 px-3 py-1 text-sm font-mono">
                    {p.code}
                    {p.discountPct ? ` · ${p.discountPct}%` : ""}
                    {p.freeDelivery ? ` · ${t("freeDelivery")}` : ""}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-12 sm:mt-16">
        <h2 className="section-title mb-5">{t("deliveryCoverage")}</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { zone: t("zoneKigali"), time: t("about45min"), icon: MapPin },
            { zone: t("zoneKamonyi"), time: t("about75min"), icon: MapPin },
            { zone: t("zoneBugesera"), time: t("about75min"), icon: MapPin },
          ].map((z) => (
            <div
              key={z.zone}
              className="flex items-start gap-3 rounded-2xl border border-[var(--huza-line)] bg-white/90 p-4 sm:p-5"
            >
              <z.icon className="mt-0.5 size-5 text-[var(--huza-green)]" />
              <div>
                <h3 className="font-semibold">{z.zone}</h3>
                <p className="mt-1 text-sm text-[var(--huza-muted)] inline-flex items-center gap-1">
                  <Clock className="size-3.5" /> {t("deliveryEta")}: {z.time}
                </p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-[var(--huza-muted)]">{t("deliveryFeeAtCheckoutHint")}</p>
      </section>

      {testimonials.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-12 sm:mt-16">
          <h2 className="section-title mb-5">{t("testimonials")}</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {testimonials.map((x) => (
              <blockquote
                key={x.id}
                className="rounded-2xl border border-[var(--huza-line)] bg-white/90 p-5"
              >
                <p className="text-[var(--huza-gold)]">{"★".repeat(x.rating)}</p>
                <p className="mt-3 text-sm leading-relaxed">&ldquo;{comment(x)}&rdquo;</p>
                <footer className="mt-4">
                  <p className="font-semibold text-sm">{x.name}</p>
                  <p className="text-xs text-[var(--huza-muted)]">{x.role}</p>
                </footer>
              </blockquote>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-12 sm:mt-16 mb-8">
        <div className="rounded-3xl bg-[var(--huza-green-dark)] text-white p-7 sm:p-10 grid md:grid-cols-[1.2fr_0.8fr] gap-8 items-center">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold">
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
