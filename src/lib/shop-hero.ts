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

const DEFAULT_COPY = {
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
    ...DEFAULT_COPY,
  },
  {
    id: "juices",
    imageUrl: "/images/hero/banner-market-juices.jpg",
    href: "/products?category=fresh-juices",
    enabled: true,
    sortOrder: 1,
    emoji: "🥤",
    ...DEFAULT_COPY,
  },
  {
    id: "salads",
    imageUrl: "/images/hero/banner-market-salads.jpg",
    href: "/products?category=fruit-salads",
    enabled: true,
    sortOrder: 2,
    emoji: "🥗",
    ...DEFAULT_COPY,
  },
  {
    id: "seedlings",
    imageUrl: "/images/hero/banner-market-seedlings.jpg",
    href: "/products?category=fruit-seedlings",
    enabled: true,
    sortOrder: 3,
    emoji: "🌱",
    ...DEFAULT_COPY,
  },
  {
    id: "plants",
    imageUrl: "/images/hero/banner-market-plants.jpg",
    href: "/products?category=ornamental-plants",
    enabled: true,
    sortOrder: 4,
    emoji: "🪴",
    ...DEFAULT_COPY,
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

export function normalizeShopHeroSlide(
  raw: Record<string, unknown>,
  index: number
): ShopHeroSlide {
  const id = asString(raw.id, `slide-${index + 1}`);
  return {
    id,
    imageUrl: asString(raw.imageUrl || raw.src, DEFAULT_SHOP_HERO_SLIDES[0]?.imageUrl || ""),
    href: asString(raw.href, "/products"),
    enabled: asBool(raw.enabled, true),
    sortOrder: Number.isFinite(Number(raw.sortOrder)) ? Number(raw.sortOrder) : index,
    emoji: asString(raw.emoji, "🌿"),
    headingEn: asString(raw.headingEn, DEFAULT_COPY.headingEn),
    supportEn: asString(raw.supportEn, DEFAULT_COPY.supportEn),
    primaryCtaEn: asString(raw.primaryCtaEn, DEFAULT_COPY.primaryCtaEn),
    secondaryCtaEn: asString(raw.secondaryCtaEn, DEFAULT_COPY.secondaryCtaEn),
    headingRw: asString(raw.headingRw, DEFAULT_COPY.headingRw),
    supportRw: asString(raw.supportRw, DEFAULT_COPY.supportRw),
    primaryCtaRw: asString(raw.primaryCtaRw, DEFAULT_COPY.primaryCtaRw),
    secondaryCtaRw: asString(raw.secondaryCtaRw, DEFAULT_COPY.secondaryCtaRw),
    primaryHref: asString(raw.primaryHref, DEFAULT_COPY.primaryHref),
    secondaryHref: asString(raw.secondaryHref, DEFAULT_COPY.secondaryHref),
  };
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
} {
  const rw = locale === "rw";
  return {
    heading: rw ? slide.headingRw || slide.headingEn : slide.headingEn,
    support: rw ? slide.supportRw || slide.supportEn : slide.supportEn,
    primaryCta: rw ? slide.primaryCtaRw || slide.primaryCtaEn : slide.primaryCtaEn,
    secondaryCta: rw ? slide.secondaryCtaRw || slide.secondaryCtaEn : slide.secondaryCtaEn,
    primaryHref: slide.primaryHref || "/products",
    secondaryHref: slide.secondaryHref || "/categories",
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
      ...DEFAULT_COPY,
      ...partial,
    },
    999
  );
}
