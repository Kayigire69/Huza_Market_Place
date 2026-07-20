"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "@/lib/locale-context";
import { ProductCard, type ProductCardData } from "@/components/products/ProductCard";
import { HeroSection } from "@/components/home/HeroSection";
import { categoryName } from "@/lib/i18n";
import {
  ArrowRight,
  ChevronRight,
  ShoppingBasket,
  BadgeCheck,
  Bike,
  Truck,
  Smartphone,
  Leaf,
  MessageCircle,
} from "lucide-react";
import { RecentlyViewedSection } from "@/components/products/RecentlyViewedSection";
import { resolveCategoryImage } from "@/lib/catalog-images";
import { isWhatsAppConfigured } from "@/lib/brand-contact";

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

function ProductRail({
  products,
  variant = "auto",
}: {
  products: ProductCardData[];
  variant?: "auto" | "default" | "prepared";
}) {
  return (
    <div className="-mx-4 flex items-stretch gap-3 overflow-x-auto px-4 pb-1 snap-x snap-mandatory sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-4">
      {products.map((p) => (
        <div key={p.id} className="flex w-[46%] shrink-0 snap-start sm:w-auto sm:shrink">
          <div className="w-full">
            <ProductCard product={p} variant={variant} />
          </div>
        </div>
      ))}
    </div>
  );
}

type CustomerReview = {
  id: string;
  rating: number;
  comment: string | null;
  user: { fullName: string };
  product: { nameEn: string } | null;
};

export function HomePage({
  popularNow,
  readyToEat,
  categories,
  promotions,
  testimonials,
  customerReviews = [],
  isOpen,
  whatsappUrl = "",
}: {
  popularNow: ProductCardData[];
  readyToEat: ProductCardData[];
  categories: Category[];
  promotions: Promo[];
  testimonials: Testimonial[];
  customerReviews?: CustomerReview[];
  isOpen: boolean;
  whatsappUrl?: string;
}) {
  const { t, locale } = useLocale();

  const promoTitle = (p: Promo) =>
    locale === "fr" ? p.titleFr : locale === "rw" ? p.titleRw : p.titleEn;
  const promoDesc = (p: Promo) =>
    locale === "fr" ? p.descriptionFr : locale === "rw" ? p.descriptionRw : p.descriptionEn;
  const comment = (x: Testimonial) =>
    locale === "fr" ? x.commentFr : locale === "rw" ? x.commentRw : x.commentEn;

  const howSteps = [
    { n: "1", title: t("howStep1Title"), body: t("howStep1Body"), icon: ShoppingBasket },
    { n: "2", title: t("howStep2Title"), body: t("howStep2Body"), icon: BadgeCheck },
    { n: "3", title: t("howStep3Title"), body: t("howStep3Body"), icon: Bike },
  ];

  const whyChoose = [
    { icon: BadgeCheck, label: t("trustQuality") },
    { icon: Truck, label: t("trustDelivery") },
    { icon: Smartphone, label: t("trustMomo") },
    { icon: Leaf, label: t("trustFarmFresh") },
  ];

  const seasonal = [
    { emoji: "🥭", title: t("seasonMango"), href: "/products?q=mango" },
    { emoji: "🥑", title: t("seasonAvocado"), href: "/products?q=avocado" },
    { emoji: "🟣", title: t("seasonPassion"), href: "/products?q=passion" },
  ];

  const reviews = (
    customerReviews.length > 0
      ? customerReviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          text: r.comment || "",
          name: r.user.fullName,
          role: r.product?.nameEn || "",
        }))
      : testimonials.map((x) => ({
          id: x.id,
          rating: x.rating,
          text: comment(x),
          name: x.name,
          role: x.role || "",
        }))
  ).slice(0, 3);

  const waConfigured = isWhatsAppConfigured(whatsappUrl);
  const waHref = waConfigured
    ? whatsappUrl.startsWith("http")
      ? whatsappUrl
      : `https://wa.me/${whatsappUrl.replace(/\D/g, "")}`
    : "";
  const waUpdatesHref = waHref
    ? `${waHref}${waHref.includes("?") ? "&" : "?"}text=${encodeURIComponent(
        "Hello HUZA, please add me to weekly fresh deals updates."
      )}`
    : "";

  return (
    <div className="home-surface">
      {!isOpen && (
        <div className="bg-[var(--huza-gold)] px-4 py-2 text-center text-sm font-medium text-[var(--huza-ink)]">
          {t("closedNotice")}
        </div>
      )}

      <HeroSection />

      {/* 1. Categories */}
      <section
        id="categories"
        className="animate-rise mx-auto mt-8 max-w-7xl scroll-mt-28 px-4 sm:mt-12 sm:px-6"
      >
        <SectionHeader
          title={t("shopByCategory")}
          href="/categories"
          viewAllLabel={t("viewAll")}
          hint={t("shopByCategoryHint")}
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-3">
          {categories.map((c) => {
            const name = categoryName(c, locale);
            return (
              <Link
                key={c.id}
                href={`/products?category=${c.slug}`}
                className="group relative aspect-[4/5] overflow-hidden rounded-[22px] bg-[var(--huza-mint)] shadow-[0_4px_16px_rgba(11,92,52,0.08)] ring-1 ring-[var(--huza-line)] transition hover:ring-[var(--huza-green)] sm:aspect-[5/4]"
              >
                <Image
                  src={resolveCategoryImage(c.slug, c.imageUrl)}
                  alt={name}
                  fill
                  sizes="(max-width: 640px) 50vw, 33vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3 sm:gap-3 sm:p-4">
                  <p className="min-w-0 flex-1 text-sm font-bold leading-snug text-white drop-shadow-sm sm:text-base lg:text-lg">
                    {name}
                  </p>
                  <span className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg bg-[var(--huza-green)] px-2.5 text-[11px] font-semibold text-white shadow-md transition-colors group-hover:bg-[var(--huza-green-dark)] sm:h-9 sm:rounded-xl sm:px-3.5 sm:text-xs">
                    {t("orderNow")}
                    <ArrowRight className="size-3.5" aria-hidden />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 2. Best Sellers */}
      {popularNow.length > 0 && (
        <section
          id="fresh-today"
          className="animate-rise-delay mx-auto mt-10 max-w-7xl scroll-mt-28 px-4 sm:mt-14 sm:px-6"
        >
          <SectionHeader
            title={t("bestSellers")}
            href="/products?best=1"
            viewAllLabel={t("viewAll")}
            hint={t("bestSellersHint")}
          />
          <ProductRail products={popularNow} />
        </section>
      )}

      {/* 3. Freshly Prepared */}
      {readyToEat.length > 0 && (
        <section
          id="freshly-prepared"
          className="mx-auto mt-10 max-w-7xl scroll-mt-28 px-4 sm:mt-14 sm:px-6"
        >
          <div className="mb-4 rounded-2xl border border-[var(--huza-gold)]/40 bg-gradient-to-r from-[#fff8e8] to-[var(--huza-mint)]/50 px-4 py-4 sm:mb-5 sm:px-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="min-w-0">
                <h2 className="section-title text-[1.35rem] sm:text-[clamp(1.5rem,2.5vw,2rem)]">
                  {t("freshlyPrepared")}
                </h2>
                <p className="mt-1 text-sm text-[var(--huza-muted)]">{t("freshlyPreparedToday")}</p>
              </div>
              <Link
                href="/products?category=fruit-salads"
                className="group inline-flex shrink-0 items-center gap-0.5 text-sm font-semibold text-[var(--huza-green-dark)]"
              >
                {t("viewAll")}
                <ChevronRight className="size-4 transition group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
          <ProductRail products={readyToEat} variant="prepared" />
        </section>
      )}

      {/* 4. Special Offers — admin CMS promotions only */}
      <section
        id="special-offers"
        className="mx-auto mt-10 max-w-7xl scroll-mt-28 px-4 sm:mt-14 sm:px-6"
      >
        <h2 className="section-title mb-4 text-[1.35rem] sm:mb-5">{t("specialOffers")}</h2>
        {promotions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--huza-line)] bg-white/80 px-4 py-6 text-center text-sm text-[var(--huza-muted)]">
            {t("specialOffersEmpty")}
          </p>
        ) : (
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
                {promoDesc(p) && <p className="mt-2 text-sm text-[#C8E8D4]">{promoDesc(p)}</p>}
                {p.code && (
                  <p className="mt-3 inline-block rounded-md bg-white/15 px-3 py-1 text-sm font-mono">
                    {p.code}
                    {p.discountPct ? ` · ${p.discountPct}%` : ""}
                    {p.freeDelivery ? `, ${t("freeDelivery")}` : ""}
                  </p>
                )}
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--huza-gold)]">
                  {t("shopNow")} <ArrowRight className="size-4" />
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 5. Why Choose HUZA — icons only */}
      <section className="mx-auto mt-8 max-w-7xl px-4 sm:mt-10 sm:px-6">
        <h2 className="mb-3 text-center text-sm font-semibold text-[var(--huza-green-dark)] sm:text-base">
          {t("whyChooseHuza")}
        </h2>
        <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 sm:gap-x-8">
          {whyChoose.map((item) => (
            <li
              key={item.label}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[var(--huza-ink)] sm:text-xs"
            >
              <item.icon className="size-3.5 text-[var(--huza-green)]" aria-hidden />
              {item.label}
            </li>
          ))}
        </ul>
      </section>

      {/* 6. Seasonal Picks */}
      <section className="mx-auto mt-10 max-w-7xl px-4 sm:mt-14 sm:px-6">
        <h2 className="section-title mb-2 text-[1.35rem] sm:mb-3">{t("seasonalPicks")}</h2>
        <p className="mb-4 text-sm text-[var(--huza-muted)]">{t("seasonalPicksHint")}</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {seasonal.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="flex items-center gap-3 rounded-2xl border border-[var(--huza-line)] bg-white px-4 py-4 transition hover:border-[var(--huza-green)] hover:bg-[var(--huza-mint)]"
            >
              <span className="text-2xl" aria-hidden>
                {s.emoji}
              </span>
              <span className="font-semibold text-[var(--huza-ink)]">{s.title}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 7. How HUZA Works */}
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

      {/* 8. Customer Reviews */}
      {reviews.length > 0 && (
        <section className="mx-auto mt-10 max-w-7xl px-4 sm:mt-14 sm:px-6">
          <h2 className="section-title mb-4 text-[1.35rem] sm:mb-5">{t("customerReviews")}</h2>
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 snap-x sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
            {reviews.map((x) => (
              <blockquote
                key={x.id}
                className="w-[85%] shrink-0 snap-start rounded-2xl border border-[var(--huza-line)] bg-white/90 p-4 sm:w-auto"
              >
                <p className="text-[var(--huza-gold)]">{"★".repeat(x.rating)}</p>
                <p className="mt-2 text-sm leading-relaxed">&ldquo;{x.text}&rdquo;</p>
                <footer className="mt-3">
                  <p className="text-sm font-semibold">{x.name}</p>
                  {x.role ? <p className="text-xs text-[var(--huza-muted)]">{x.role}</p> : null}
                </footer>
              </blockquote>
            ))}
          </div>
        </section>
      )}

      {/* 9. WhatsApp ordering card — shown once WhatsApp Business URL is configured */}
      {waConfigured ? (
      <section className="mx-auto mt-10 max-w-7xl px-4 sm:mt-14 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-[#25D366]/40 bg-[#f3fff7] p-5 sm:flex-row sm:items-center sm:p-6">
          <div>
            <p className="text-sm font-semibold text-[#128C7E]">{t("whatsappHelpTitle")}</p>
            <h3 className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold text-[var(--huza-ink)]">
              {t("needHelpChoosing")}
            </h3>
            <p className="mt-1 text-sm text-[var(--huza-muted)]">{t("orderOnWhatsApp")}</p>
          </div>
          <a
            href={waHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#25D366] px-5 text-sm font-semibold text-white transition hover:bg-[#1ebe57]"
          >
            <MessageCircle className="size-4" aria-hidden />
            {t("chatNow")}
          </a>
        </div>
      </section>
      ) : null}

      {/* 10. Contact / WhatsApp updates */}
      {waConfigured ? (
      <section className="mx-auto mb-4 mt-10 max-w-7xl px-4 sm:mt-14 sm:px-6">
        <div className="rounded-3xl bg-[var(--huza-green-dark)] p-6 text-white sm:p-8">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold sm:text-3xl">
            {t("whatsappUpdatesTitle")}
          </h2>
          <p className="mt-2 max-w-xl text-sm text-[#C8E8D4]">{t("whatsappUpdatesBody")}</p>
          <a
            href={waUpdatesHref}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--huza-gold)] px-5 text-sm font-semibold text-[var(--huza-ink)] transition hover:brightness-105"
          >
            <MessageCircle className="size-4" aria-hidden />
            {t("getWeeklyDeals")}
          </a>
        </div>
      </section>
      ) : (
      <section className="mx-auto mb-4 mt-10 max-w-7xl px-4 sm:mt-14 sm:px-6">
        <div className="rounded-3xl bg-[var(--huza-green-dark)] p-6 text-white sm:p-8">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold sm:text-3xl">
            Contact HUZA FRESH
          </h2>
          <p className="mt-2 max-w-xl text-sm text-[#C8E8D4]">
            Email us at info@youthhuza.rw. WhatsApp chat will appear here once our business number is
            connected.
          </p>
          <a
            href="mailto:info@youthhuza.rw"
            className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--huza-gold)] px-5 text-sm font-semibold text-[var(--huza-ink)] transition hover:brightness-105"
          >
            Email info@youthhuza.rw
          </a>
        </div>
      </section>
      )}

      <RecentlyViewedSection />
    </div>
  );
}
