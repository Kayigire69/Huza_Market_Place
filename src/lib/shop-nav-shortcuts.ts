/**
 * Customer Website mobile/desktop category shortcuts.
 * Stored as WebsiteSetting JSON — Admin edits EN/RW names, icon, order, visibility.
 */

export const SHOP_NAV_SHORTCUTS_SETTING_KEY = "shop_nav_shortcuts";

export type ShopNavShortcut = {
  id: string;
  /** Category slug used in /products?category=… */
  slug: string;
  emoji: string;
  nameEn: string;
  nameRw: string;
  sortOrder: number;
  visible: boolean;
};

/** Default rail — correct Kinyarwanda aligned with Customer Website category copy. */
export const DEFAULT_SHOP_NAV_SHORTCUTS: ShopNavShortcut[] = [
  {
    id: "fresh-vegetables",
    slug: "fresh-vegetables",
    emoji: "🥬",
    nameEn: "Fresh Vegetables",
    nameRw: "Imboga nshya",
    sortOrder: 0,
    visible: true,
  },
  {
    id: "fresh-fruits",
    slug: "fresh-fruits",
    emoji: "🍎",
    nameEn: "Fresh Fruits",
    nameRw: "Imbuto nshya",
    sortOrder: 1,
    visible: true,
  },
  {
    id: "fresh-juices",
    slug: "fresh-juices",
    emoji: "🧃",
    nameEn: "Fresh Juices",
    nameRw: "Umutobe w'Imbuto",
    sortOrder: 2,
    visible: true,
  },
  {
    id: "fruit-salads",
    slug: "fruit-salads",
    emoji: "🥗",
    nameEn: "Fruit Salads",
    nameRw: "Salade y'Imbuto",
    sortOrder: 3,
    visible: true,
  },
  {
    id: "fruit-seedlings",
    slug: "fruit-seedlings",
    emoji: "🌱",
    nameEn: "Fruit Seedlings",
    nameRw: "Ibiti by'imbuto byo gutera",
    sortOrder: 4,
    visible: true,
  },
  {
    id: "ornamental-plants",
    slug: "ornamental-plants",
    emoji: "🪴",
    nameEn: "Ornamental Plants",
    nameRw: "Ibimera byo Kurimbisha",
    sortOrder: 5,
    visible: true,
  },
];

/** Known bad / short RW labels → canonical category names. */
const LEGACY_SHORTCUT_RW_BY_SLUG: Record<string, Record<string, string>> = {
  "fresh-fruits": {
    Imbuto: "Imbuto nshya",
  },
  "fresh-vegetables": {
    Imboga: "Imboga nshya",
  },
  "fresh-juices": {
    Imvubo: "Umutobe w'Imbuto",
    "Imvubo nshya": "Umutobe w'Imbuto",
    "Amacunga mashya": "Umutobe w'Imbuto",
    Jus: "Umutobe w'Imbuto",
  },
  "fruit-salads": {
    Salade: "Salade y'Imbuto",
    "Insalade z'imbuto": "Salade y'Imbuto",
  },
  "ornamental-plants": {
    Ibihingwa: "Ibimera byo Kurimbisha",
    "Ibihingwa byo gushyiraho": "Ibimera byo Kurimbisha",
    "Ibimera byo gutunganya": "Ibimera byo Kurimbisha",
    "Ingemwe z'ibiti": "Ibimera byo Kurimbisha",
  },
  "fruit-seedlings": {
    Imbuto: "Ibiti by'imbuto byo gutera",
    "Imbuto z'ibiti": "Ibiti by'imbuto byo gutera",
  },
};

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function asBool(v: unknown, fallback = true): boolean {
  if (typeof v === "boolean") return v;
  if (v === "false" || v === 0) return false;
  if (v === "true" || v === 1) return true;
  return fallback;
}

function asInt(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function applyLegacyRw(item: ShopNavShortcut): ShopNavShortcut {
  const fixes = LEGACY_SHORTCUT_RW_BY_SLUG[item.slug];
  if (!fixes) return item;
  const next = fixes[item.nameRw];
  return next ? { ...item, nameRw: next } : item;
}

function normalizeShortcut(raw: unknown, index: number): ShopNavShortcut | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const fallback = DEFAULT_SHOP_NAV_SHORTCUTS[index] || DEFAULT_SHOP_NAV_SHORTCUTS[0];
  const slug = asString(row.slug, fallback.slug).trim() || fallback.slug;
  const id = asString(row.id, slug).trim() || slug;
  const def =
    DEFAULT_SHOP_NAV_SHORTCUTS.find((d) => d.slug === slug || d.id === id) || fallback;

  const item: ShopNavShortcut = {
    id,
    slug,
    emoji: asString(row.emoji, def.emoji).trim() || def.emoji,
    nameEn: asString(row.nameEn, def.nameEn).trim() || def.nameEn,
    nameRw: asString(row.nameRw, def.nameRw).trim() || def.nameRw,
    sortOrder: asInt(row.sortOrder, index),
    visible: asBool(row.visible, true),
  };
  return applyLegacyRw(item);
}

export function parseShopNavShortcuts(raw: string | null | undefined): ShopNavShortcut[] {
  if (!raw?.trim()) {
    return DEFAULT_SHOP_NAV_SHORTCUTS.map((s, i) => ({ ...s, sortOrder: i }));
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    const list = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === "object" && Array.isArray((parsed as { items?: unknown }).items)
        ? (parsed as { items: unknown[] }).items
        : null;
    if (!list?.length) {
      return DEFAULT_SHOP_NAV_SHORTCUTS.map((s, i) => ({ ...s, sortOrder: i }));
    }
    const items = list
      .map((row, i) => normalizeShortcut(row, i))
      .filter((x): x is ShopNavShortcut => Boolean(x));
    if (!items.length) {
      return DEFAULT_SHOP_NAV_SHORTCUTS.map((s, i) => ({ ...s, sortOrder: i }));
    }
    return items
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((s, i) => ({ ...s, sortOrder: i }));
  } catch {
    return DEFAULT_SHOP_NAV_SHORTCUTS.map((s, i) => ({ ...s, sortOrder: i }));
  }
}

export function serializeShopNavShortcuts(items: ShopNavShortcut[]): string {
  const normalized = items
    .map((s, i) => ({
      id: String(s.id || s.slug).trim() || `shortcut-${i}`,
      slug: String(s.slug || "").trim(),
      emoji: String(s.emoji || "📦").trim() || "📦",
      nameEn: String(s.nameEn || "").trim(),
      nameRw: String(s.nameRw || "").trim() || String(s.nameEn || "").trim(),
      sortOrder: i,
      visible: Boolean(s.visible),
    }))
    .filter((s) => s.slug && s.nameEn);
  return JSON.stringify(normalized);
}

export function visibleShopNavShortcuts(items: ShopNavShortcut[]): ShopNavShortcut[] {
  return items.filter((s) => s.visible).sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Label for Customer Website locale (EN / RW primary; other locales fall back to EN). */
export function shopNavShortcutLabel(
  item: Pick<ShopNavShortcut, "nameEn" | "nameRw">,
  locale: string
): string {
  if (locale === "rw") return item.nameRw || item.nameEn;
  return item.nameEn;
}

/** Canonical RW names to apply when syncing Category rows from shortcuts / catalog. */
export const CANONICAL_CATEGORY_RW: Record<string, string> = {
  "fresh-vegetables": "Imboga nshya",
  "fresh-fruits": "Imbuto nshya",
  "fresh-juices": "Umutobe w'Imbuto",
  "fruit-salads": "Salade y'Imbuto",
  "fruit-seedlings": "Ibiti by'imbuto byo gutera",
  "ornamental-plants": "Ibimera byo Kurimbisha",
};

export function remapCategoryNameRw(slug: string, nameRw: string): string {
  const legacy = LEGACY_SHORTCUT_RW_BY_SLUG[slug];
  if (legacy?.[nameRw]) return legacy[nameRw];
  return nameRw;
}
