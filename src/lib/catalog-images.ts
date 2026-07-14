/** Prefer real storefront photos; unique SVG only as last-resort fallback. */

export const PRODUCT_IMAGE_BY_NAME_EN: Record<string, string> = {
  "Sweet Bananas": "/images/catalog/bananas.jpg",
  "Fresh Avocados": "/images/catalog/avocado.jpg",
  "Passion Fruit": "/images/catalog/passion-fruit.jpg",
  "Sweet Pineapple": "/images/catalog/pineapple.jpg",
  "Ripe Mangoes": "/images/catalog/mango.jpg",
  "Fresh Papaya": "/images/catalog/papaya.jpg",
  "Tree Tomato": "/images/catalog/tree-tomato.jpg",
  "Watermelon": "/images/catalog/watermelon.jpg",
  "Oranges": "/images/catalog/oranges.jpg",
  "Lemons": "/images/catalog/lemons.jpg",
  "Guava": "/images/catalog/guava.jpg",
  "Fresh Tomatoes": "/images/catalog/tomato.jpg",
  "Red Onions": "/images/catalog/onions.jpg",
  "White Onions": "/images/catalog/onions.jpg",
  "Irish Potatoes": "/images/catalog/irish-potatoes.jpg",
  "Sweet Potatoes": "/images/catalog/sweet-potatoes.jpg",
  "Carrots": "/images/catalog/carrots.jpg",
  "Green Cabbage": "/images/catalog/cabbage.jpg",
  "Green Bell Peppers": "/images/catalog/green-peppers.jpg",
  "Cucumber": "/images/catalog/cucumber.jpg",
  "Spinach": "/images/catalog/spinach.jpg",
  "Amaranth (Dodo)": "/images/catalog/amaranth.jpg",
  "Broccoli": "/images/catalog/broccoli.jpg",
  "French Beans": "/images/catalog/french-beans.jpg",
  "Garlic": "/images/catalog/garlic.jpg",
  "Fresh Chili": "/images/catalog/chili.jpg",
  "Avocado Seedling": "/images/catalog/avocado-seedling.jpg",
  "Passion Fruit Seedling": "/images/catalog/passion-seedling.jpg",
  "Mango Seedling": "/images/catalog/mango-seedling.jpg",
  "Tree Tomato Seedling": "/images/catalog/tree-tomato.jpg",
  "Banana Sucker": "/images/catalog/bananas.jpg",
  "Orange Seedling": "/images/catalog/oranges.jpg",
  "Hibiscus Plant": "/images/catalog/hibiscus.jpg",
  "Bougainvillea": "/images/catalog/ornamental-plant.jpg",
  "Aloe Vera": "/images/catalog/ornamental-plant.jpg",
  "Money Plant": "/images/catalog/ornamental-plant.jpg",
  "Snake Plant": "/images/catalog/ornamental-plant.jpg",
  "Rose Plant": "/images/catalog/hibiscus.jpg",
  "Tropical Fruit Salad": "/images/catalog/fruit-salad-cup.jpg",
  "Pineapple Salad": "/images/catalog/fruit-salad.jpg",
  "Passion & Pineapple Salad": "/images/catalog/fruit-salad-cup.jpg",
  "Family Fruit Tray": "/images/catalog/fruit-salad.jpg",
  "Passion Fruit Juice": "/images/catalog/passion-juice.jpg",
  "Pineapple Juice": "/images/catalog/pineapple-juice.jpg",
  "Pineapple Ginger Juice": "/images/catalog/pineapple-juice.jpg",
  "Mango Juice": "/images/catalog/orange-juice.jpg",
  "Tree Tomato Juice": "/images/catalog/orange-juice.jpg",
  "Sugarcane Juice": "/images/catalog/passion-juice.jpg",
};

export const CATEGORY_IMAGE_BY_SLUG: Record<string, string> = {
  "fresh-fruits": "/images/catalog/cat-fruits.jpg",
  "fresh-vegetables": "/images/catalog/cat-vegetables.jpg",
  "fruit-seedlings": "/images/catalog/cat-seedlings.jpg",
  "ornamental-plants": "/images/catalog/cat-ornamental.jpg",
  "fruit-salads": "/images/catalog/cat-salads.jpg",
  "fresh-juices": "/images/catalog/cat-juices.jpg",
};

function isPhotoUrl(url: string): boolean {
  if (!url || url === "/logo.svg") return false;
  if (url.startsWith("/uploads/") || url.startsWith("http://") || url.startsWith("https://")) {
    return true;
  }
  const lower = url.toLowerCase();
  return (
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".png") ||
    lower.endsWith(".webp") ||
    lower.endsWith(".avif")
  );
}

/** Prefer DB/upload photos; mapped catalog photos next; SVG only if nothing else. */
export function resolveProductImage(
  nameEn: string,
  images?: { url: string; isCover?: boolean }[]
): string {
  const dbUrls = [images?.find((i) => i.isCover)?.url, images?.[0]?.url].filter(
    Boolean
  ) as string[];

  for (const url of dbUrls) {
    if (isPhotoUrl(url)) return url;
  }

  const mapped = PRODUCT_IMAGE_BY_NAME_EN[nameEn];
  if (mapped && isPhotoUrl(mapped)) return mapped;

  for (const url of dbUrls) {
    if (url) return url;
  }

  return mapped ?? "/logo.svg";
}

export function resolveCategoryImage(slug: string, imageUrl?: string | null): string {
  if (imageUrl && isPhotoUrl(imageUrl)) return imageUrl;
  const mapped = CATEGORY_IMAGE_BY_SLUG[slug];
  if (mapped) return mapped;
  return imageUrl || "/logo.svg";
}
