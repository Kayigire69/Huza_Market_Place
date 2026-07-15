import { isPreparedCategory } from "@/lib/prepared-product-meta";

/**
 * Categories farmers can supply to Youth Huza.
 * Salads & juices are prepared by HUZA FRESH — never farmer-submitted.
 */
export const FARMER_SUPPLY_CATEGORY_SLUGS = [
  "fresh-fruits",
  "fresh-vegetables",
  "fruit-seedlings",
] as const;

export type FarmerSupplyCategorySlug = (typeof FARMER_SUPPLY_CATEGORY_SLUGS)[number];

export function isFarmerSupplyCategory(slug?: string | null): boolean {
  return Boolean(slug && (FARMER_SUPPLY_CATEGORY_SLUGS as readonly string[]).includes(slug));
}

/** Prepared shop lines (salads/juices) — made by Youth Huza, not farm partners */
export function isHuzaPreparedCategory(slug?: string | null): boolean {
  return isPreparedCategory(slug);
}

export function filterFarmerSupplyProducts<
  T extends { category?: { slug?: string | null; nameEn?: string | null } | null },
>(products: T[]): T[] {
  return products.filter((p) => isFarmerSupplyCategory(p.category?.slug));
}

export function farmerSupplyCategoryHint(slug?: string | null): string {
  if (slug === "fresh-vegetables") return "Field vegetable";
  if (slug === "fresh-fruits") return "Orchard / fruit crop";
  if (slug === "fruit-seedlings") return "Nursery seedling";
  return "Farm crop";
}
