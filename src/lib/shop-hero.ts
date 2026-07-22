/**
 * Customer Website (HUZA FRESH) hero slides — stored as WebsiteSetting JSON.
 * Admin manages slides without code changes. Locale picks EN vs RW copy.
 */

export const SHOP_HERO_SETTING_KEY = "shop_hero_slides";

export type ShopHeroSlide = {
  id: string;
  imageUrl: string;
  /** Link when the banner image is clicked */
  href: string;
  enabled: boolean;
  sortOrder: number;
  emoji: string;
  /** Small label on the slide image (e.g. Fresh Juices) */
  badgeLabelEn: string;
  badgeLabelRw: string;
  headingEn: string;
  supportEn: string;
  primaryCtaEn: string;
  secondaryCtaEn: string;
  headingRw: string;
  supportRw: string;
  primaryCtaRw: string;
  secondaryCtaRw: string;
  primaryHref: string;
  secondaryHref: string;
};

const SHARED_COPY = {
  headingEn: "Fresh Products Delivered to Your Door",
  supportEn:
    "Fresh fruits, vegetables, dairy, and more. Quality checked and delivered across Rwanda.",
  primaryCtaEn: "Start Shopping",
  secondaryCtaEn: "",
  headingRw: "Ibicuruzwa bishya bitangwa aho utuye",
  supportRw: "Imbuto, imboga, amata n'ibindi. Byagenzuwe kandi bitangwa mu Rwanda hose.",
  primaryCtaRw: "Tangira guhaha",
  secondaryCtaRw: "",
  primaryHref: "/products",
  secondaryHref: "/categories",
} as const;

/** Seed matching the previous hardcoded shop hero carousel. */
export const DEFAULT_SHOP_HERO_SLIDES: ShopHeroSlide[] = [
  {
    id: "fruits",
    imageUrl: "/images/hero/banner-market-fruits.jpg",
    href: "/products?category=fresh-fruits",
    enabled: true,
    sortOrder: 0,
    emoji: "🍎",
    badgeLabelEn: "Fresh Fruits & Vegetables",
    badgeLabelRw: "Imbuto n'imboga bishya",
    ...SHARED_COPY,
  },
  {
    id: "juices",
    imageUrl: "/images/hero/banner-market-juices.jpg",
    href: "/products?category=fresh-juices",
    enabled: true,
    sortOrder: 1,
    emoji: "🥤",
    badgeLabelEn: "Fresh Juices",
    badgeLabelRw: "Umutobe w'Imbuto",
    ...SHARED_COPY,
  },
  {
    id: "salads",
    imageUrl: "/images/hero/banner-market-salads.jpg",
    href: "/products?category=fruit-salads",
    enabled: true,
    sortOrder: 2,
    emoji: "🥗",
    badgeLabelEn: "Fruit Salads",
    badgeLabelRw: "Salade y'Imbuto",
    ...SHARED_COPY,
  },
  {
    id: "seedlings",
    imageUrl: "/images/hero/banner-market-seedlings.jpg",
    href: "/products?category=fruit-seedlings",
    enabled: true,
    sortOrder: 3,
    emoji: "🌱",
    badgeLabelEn: "Fruit Seedlings",
    badgeLabelRw: "Ibiti by'imbuto byo gutera",
    ...SHARED_COPY,
  },
  {
    id: "plants",
    imageUrl: "/images/hero/banner-market-plants.jpg",
    href: "/products?category=ornamental-plants",
    enabled: true,
    sortOrder: 4,
    emoji: "🪴",
    badgeLabelEn: "Ornamental Plants",
    badgeLabelRw: "Ibimera byo Kurimbisha",
    ...SHARED_COPY,
  },
];

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function asBool(v: unknown, fallback = true): boolean {
  if (typeof v === "boolean") return v;
  if (v === "false" || v === 0) return false;
  if (v === "true" || v === 1) return true;
  return fallback;
}

function defaultSlideFor(id: string, index: number): ShopHeroSlide | undefined {
  return DEFAULT_SHOP_HERO_SLIDES.find((s) => s.id === id) || DEFAULT_SHOP_HERO_SLIDES[index];
}

/** Correct known bad Kinyarwanda badge labels saved before the 2026 copy fix. */
const LEGACY_BADGE_RW_FIXES: Record<string, Record<string, string>> = {
  juices: {
    Imvubo: "Umutobe w'Imbuto",
    "Imvubo nshya": "Umutobe w'Imbuto",
  },
  salads: {
    "Insalade z'imbuto": "Salade y'Imbuto",
  },
  plants: {
    "Ibihingwa byo gushyiraho": "Ibimera byo Kurimbisha",
    "Ibiti by'imbuto byo gutera": "Ibimera byo Kurimbisha",
    "Ingemwe z'ibiti": "Ibimera byo Kurimbisha",
    "Ibimera byo gutunganya": "Ibimera byo Kurimbisha",
  },
};

function applyLegacyBadgeRwFix(slide: ShopHeroSlide): ShopHeroSlide {
  const fixes = LEGACY_BADGE_RW_FIXES[slide.id];
  if (!fixes) return slide;
  const next = fixes[slide.badgeLabelRw];
  return next ? { ...slide, badgeLabelRw: next } : slide;
}

export function normalizeShopHeroSlide(
  raw: Record<string, unknown>,
  index: number
): ShopHeroSlide {
  const id = asString(raw.id, `slide-${index + 1}`);
  const fallback = defaultSlideFor(id, index);
  const slide: ShopHeroSlide = {
    id,
    imageUrl: asString(raw.imageUrl || raw.src, fallback?.imageUrl || ""),
    href: asString(raw.href, fallback?.href || "/products"),
    enabled: asBool(raw.enabled, true),
    sortOrder: Number.isFinite(Number(raw.sortOrder)) ? Number(raw.sortOrder) : index,
    emoji: asString(raw.emoji, fallback?.emoji || "🌿"),
    badgeLabelEn: asString(
      raw.badgeLabelEn || raw.labelEn,
      fallback?.badgeLabelEn || "Fresh produce"
    ),
    badgeLabelRw: asString(raw.badgeLabelRw || raw.labelRw, fallback?.badgeLabelRw || ""),
    headingEn: asString(raw.headingEn, fallback?.headingEn || SHARED_COPY.headingEn),
    supportEn: asString(raw.supportEn, fallback?.supportEn || SHARED_COPY.supportEn),
    primaryCtaEn: asString(raw.primaryCtaEn, fallback?.primaryCtaEn || SHARED_COPY.primaryCtaEn),
    secondaryCtaEn: asString(
      raw.secondaryCtaEn,
      fallback?.secondaryCtaEn || SHARED_COPY.secondaryCtaEn
    ),
    headingRw: asString(raw.headingRw, fallback?.headingRw || SHARED_COPY.headingRw),
    supportRw: asString(raw.supportRw, fallback?.supportRw || SHARED_COPY.supportRw),
    primaryCtaRw: asString(raw.primaryCtaRw, fallback?.primaryCtaRw || SHARED_COPY.primaryCtaRw),
    secondaryCtaRw: asString(
      raw.secondaryCtaRw,
      fallback?.secondaryCtaRw || SHARED_COPY.secondaryCtaRw
    ),
    primaryHref: asString(raw.primaryHref, fallback?.primaryHref || SHARED_COPY.primaryHref),
    secondaryHref: asString(
      raw.secondaryHref,
      fallback?.secondaryHref || SHARED_COPY.secondaryHref
    ),
  };
  return applyLegacyBadgeRwFix(slide);
}

export function parseShopHeroSlides(raw: string | null | undefined): ShopHeroSlide[] {
  if (!raw?.trim()) return DEFAULT_SHOP_HERO_SLIDES.map((s) => ({ ...s }));
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return DEFAULT_SHOP_HERO_SLIDES.map((s) => ({ ...s }));
    }
    return parsed
      .map((item, i) =>
        normalizeShopHeroSlide(
          item && typeof item === "object" ? (item as Record<string, unknown>) : {},
          i
        )
      )
      .sort((a, b) => a.sortOrder - b.sortOrder);
  } catch {
    return DEFAULT_SHOP_HERO_SLIDES.map((s) => ({ ...s }));
  }
}

export function serializeShopHeroSlides(slides: ShopHeroSlide[]): string {
  const normalized = slides
    .map((s, i) => normalizeShopHeroSlide(s as unknown as Record<string, unknown>, i))
    .map((s, i) => ({ ...s, sortOrder: i }));
  return JSON.stringify(normalized);
}

export function enabledShopHeroSlides(slides: ShopHeroSlide[]): ShopHeroSlide[] {
  return slides.filter((s) => s.enabled && s.imageUrl).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function shopHeroBadgeLabel(slide: ShopHeroSlide, locale: string): string {
  const rw = locale === "rw";
  return rw
    ? slide.badgeLabelRw || slide.badgeLabelEn
    : slide.badgeLabelEn || slide.badgeLabelRw;
}

export function shopHeroCopy(
  slide: ShopHeroSlide,
  locale: string
): {
  heading: string;
  support: string;
  primaryCta: string;
  secondaryCta: string;
  primaryHref: string;
  secondaryHref: string;
  badgeLabel: string;
} {
  const rw = locale === "rw";
  return {
    heading: rw ? slide.headingRw || slide.headingEn : slide.headingEn,
    support: rw ? slide.supportRw || slide.supportEn : slide.supportEn,
    primaryCta: rw ? slide.primaryCtaRw || slide.primaryCtaEn : slide.primaryCtaEn,
    secondaryCta: rw ? slide.secondaryCtaRw || slide.secondaryCtaEn : slide.secondaryCtaEn,
    primaryHref: slide.primaryHref || "/products",
    secondaryHref: slide.secondaryHref || "/categories",
    badgeLabel: shopHeroBadgeLabel(slide, locale),
  };
}

export function newShopHeroSlide(partial?: Partial<ShopHeroSlide>): ShopHeroSlide {
  return normalizeShopHeroSlide(
    {
      id: `slide-${Date.now()}`,
      imageUrl: "",
      href: "/products",
      enabled: true,
      sortOrder: 999,
      emoji: "🌿",
      badgeLabelEn: "Fresh produce",
      badgeLabelRw: "Ibicuruzwa bishya",
      ...SHARED_COPY,
      ...partial,
    },
    999
  );
}
