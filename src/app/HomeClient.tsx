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
} from "lucide-react";
import { RecentlyViewedSection } from "@/components/products/RecentlyViewedSection";

type Category = {
  id: string;
  slug: string;
  nameEn: string;
  nameFr: string;
  nameRw: string;
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

export function HomePage({
  shopProducts,
  featured,
  bestSellers,
  freshToday,
  categories,
  promotions,
  testimonials,
  isOpen,
}: {
  heroProducts?: ProductCardData[];
  shopProducts: ProductCardData[];
  featured: ProductCardData[];
  bestSellers: ProductCardData[];
  freshToday: ProductCardData[];
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

  return (
    <div>
      {!isOpen && (
        <div className="bg-[var(--huza-gold)] text-[var(--huza-ink)] text-center text-sm font-medium py-2 px-4">
          {t("closedNotice")}
        </div>
      )}

      <section className="hero-fullbleed">
        <HeroGallery />
        <div className="relative z-10 mx-auto flex min-h-[inherit] max-w-7xl flex-col justify-center px-4 py-20 sm:px-6 sm:py-28">
          <div className="animate-rise max-w-xl">
            <div className="mb-6 flex items-center gap-4">
              <Image
                src="/logo.svg"
                alt="Youth Huza logo"
                width={72}
                height={72}
                className="rounded-full shadow-lg ring-2 ring-white/35"
                priority
              />
              <p className="font-[family-name:var(--font-display)] text-xl sm:text-2xl font-bold tracking-tight">
                YOUTH HUZA
              </p>
            </div>
            <h1 className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight">
              HUZA FRESH
            </h1>
            <p className="mt-4 max-w-md text-base sm:text-lg text-[#E2F6EA] leading-relaxed">
              {t("tagline")}
            </p>
            <div className="mt-8">
              <Link href="/products">
                <Button size="lg" variant="secondary">
                  {t("heroCta")} <ArrowRight className="size-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-16">
        <div className="flex items-end justify-between gap-4 mb-6">
          <h2 className="section-title">{t("categories")}</h2>
          <Link href="/categories" className="text-sm font-semibold text-[var(--huza-green)]">
            {t("viewAll")}
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/products?category=${c.slug}`}
              className="snap-start shrink-0 rounded-full border border-[var(--huza-line)] bg-white px-5 py-2.5 text-sm font-semibold hover:border-[var(--huza-green)] hover:text-[var(--huza-green-dark)] transition"
            >
              {categoryName(c, locale)}
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-16">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="section-title">{t("products")}</h2>
            <p className="mt-1 text-sm text-[var(--huza-muted)]">
              {t("shopProductsHint")}
            </p>
          </div>
          <Link href="/products" className="text-sm font-semibold text-[var(--huza-green)]">
            {t("viewAll")}
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {shopProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-16">
        <div className="flex items-end justify-between gap-4 mb-6">
          <h2 className="section-title">{t("featured")}</h2>
          <Link href="/products?featured=1" className="text-sm font-semibold text-[var(--huza-green)]">
            {t("viewAll")}
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {freshToday.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-16">
          <div className="flex items-end justify-between gap-4 mb-6">
            <h2 className="section-title">{t("freshToday")}</h2>
            <Link href="/products?new=1" className="text-sm font-semibold text-[var(--huza-green)]">
              {t("viewAll")}
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {freshToday.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-16">
        <div className="flex items-end justify-between gap-4 mb-6">
          <h2 className="section-title">{t("bestSellers")}</h2>
          <Link href="/products?best=1" className="text-sm font-semibold text-[var(--huza-green)]">
            {t("viewAll")}
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {bestSellers.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {promotions.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-16">
          <h2 className="section-title mb-6">{t("specialOffers")}</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {promotions.map((p, i) => (
              <div
                key={p.id}
                className={`rounded-2xl p-6 text-white ${
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

      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-16">
        <h2 className="section-title mb-6">{t("whyChooseHuza")}</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: BadgeCheck,
              title: t("qualityControlled"),
              body: t("qualityControlledBody"),
            },
            {
              icon: Truck,
              title: t("oneDeliveryTeam"),
              body: t("oneDeliveryTeamBody"),
            },
            {
              icon: ShieldCheck,
              title: t("securePayments"),
              body: t("securePaymentsBody"),
            },
            {
              icon: Leaf,
              title: t("farmFreshStock"),
              body: t("farmFreshStockBody"),
            },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-[var(--huza-line)] bg-white p-5">
              <item.icon className="size-7 text-[var(--huza-green)]" />
              <h3 className="mt-3 font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-[var(--huza-muted)]">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-16">
        <h2 className="section-title mb-6">{t("deliveryCoverage")}</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { zone: t("zoneKigali"), fee: "5,000 RWF", time: t("about45min"), icon: MapPin },
            { zone: t("zoneKamonyi"), fee: "5,000 RWF", time: t("about75min"), icon: MapPin },
            { zone: t("zoneBugesera"), fee: "5,000 RWF", time: t("about75min"), icon: MapPin },
          ].map((z) => (
            <div key={z.zone} className="rounded-2xl border border-[var(--huza-line)] bg-white p-5">
              <z.icon className="size-6 text-[var(--huza-green)]" />
              <h3 className="mt-3 font-semibold">{z.zone}</h3>
              <p className="mt-1 text-sm text-[var(--huza-muted)]">
                {t("deliveryFeeLabel")} {z.fee}
              </p>
              <p className="mt-1 text-sm text-[var(--huza-muted)] inline-flex items-center gap-1">
                <Clock className="size-3.5" /> {z.time}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-[var(--huza-muted)]">{t("deliveryScheduleHint")}</p>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-16">
        <h2 className="section-title mb-6">{t("testimonials")}</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {testimonials.map((x) => (
            <blockquote
              key={x.id}
              className="rounded-2xl border border-[var(--huza-line)] bg-white/80 p-5"
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

      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-16">
        <div className="rounded-3xl bg-[var(--huza-green-dark)] text-white p-8 sm:p-10 grid md:grid-cols-[1.2fr_0.8fr] gap-8 items-center">
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
