/** Auto-generated unique storefront image paths — do not hand-edit; regenerate via scripts/generate-catalog-images.mjs */
export const PRODUCT_IMAGE_BY_NAME_EN: Record<string, string> = {
  "Sweet Bananas": "/images/catalog/sweet-bananas.svg",
  "Fresh Avocados": "/images/catalog/fresh-avocados.svg",
  "Passion Fruit": "/images/catalog/passion-fruit.svg",
  "Sweet Pineapple": "/images/catalog/sweet-pineapple.svg",
  "Ripe Mangoes": "/images/catalog/ripe-mangoes.svg",
  "Fresh Papaya": "/images/catalog/fresh-papaya.svg",
  "Tree Tomato": "/images/catalog/tree-tomato.svg",
  "Watermelon": "/images/catalog/watermelon.svg",
  "Oranges": "/images/catalog/oranges.svg",
  "Lemons": "/images/catalog/lemons.svg",
  "Guava": "/images/catalog/guava.svg",
  "Fresh Tomatoes": "/images/catalog/fresh-tomatoes.svg",
  "Red Onions": "/images/catalog/red-onions.svg",
  "White Onions": "/images/catalog/white-onions.svg",
  "Irish Potatoes": "/images/catalog/irish-potatoes.svg",
  "Sweet Potatoes": "/images/catalog/sweet-potatoes.svg",
  "Carrots": "/images/catalog/carrots.svg",
  "Green Cabbage": "/images/catalog/green-cabbage.svg",
  "Green Bell Peppers": "/images/catalog/green-peppers.svg",
  "Cucumber": "/images/catalog/cucumber.svg",
  "Spinach": "/images/catalog/spinach-bunch.svg",
  "Amaranth (Dodo)": "/images/catalog/amaranth-dodo.svg",
  "Broccoli": "/images/catalog/broccoli.svg",
  "French Beans": "/images/catalog/french-beans.svg",
  "Garlic": "/images/catalog/garlic-net.svg",
  "Fresh Chili": "/images/catalog/fresh-chili.svg",
  "Avocado Seedling": "/images/catalog/avocado-seedling.svg",
  "Passion Fruit Seedling": "/images/catalog/passion-seedling.svg",
  "Mango Seedling": "/images/catalog/mango-seedling.svg",
  "Tree Tomato Seedling": "/images/catalog/tree-tomato-seedling.svg",
  "Banana Sucker": "/images/catalog/banana-sucker.svg",
  "Orange Seedling": "/images/catalog/citrus-seedling.svg",
  "Hibiscus Plant": "/images/catalog/hibiscus-plant.svg",
  "Bougainvillea": "/images/catalog/bougainvillea.svg",
  "Aloe Vera": "/images/catalog/aloe-vera.svg",
  "Money Plant": "/images/catalog/money-plant.svg",
  "Snake Plant": "/images/catalog/snake-plant.svg",
  "Rose Plant": "/images/catalog/rose-plant.svg",
  "Tropical Fruit Salad": "/images/catalog/tropical-fruit-salad.svg",
  "Pineapple Salad": "/images/catalog/pineapple-salad.svg",
  "Passion & Pineapple Salad": "/images/catalog/passion-pineapple-salad.svg",
  "Family Fruit Tray": "/images/catalog/family-fruit-tray.svg",
  "Passion Fruit Juice": "/images/catalog/passion-juice.svg",
  "Pineapple Juice": "/images/catalog/pineapple-juice.svg",
  "Pineapple Ginger Juice": "/images/catalog/pineapple-ginger-juice.svg",
  "Mango Juice": "/images/catalog/mango-juice.svg",
  "Tree Tomato Juice": "/images/catalog/tree-tomato-juice.svg",
  "Sugarcane Juice": "/images/catalog/sugarcane-juice.svg",
};

export const CATEGORY_IMAGE_BY_SLUG: Record<string, string> = {
  "fresh-fruits": "/images/catalog/cat-fresh-fruits.svg",
  "fresh-vegetables": "/images/catalog/cat-fresh-vegetables.svg",
  "fruit-seedlings": "/images/catalog/cat-fruit-seedlings.svg",
  "ornamental-plants": "/images/catalog/cat-ornamental-plants.svg",
  "fruit-salads": "/images/catalog/cat-fruit-salads.svg",
  "fresh-juices": "/images/catalog/cat-fresh-juices.svg",
};

export function resolveProductImage(
  nameEn: string,
  images?: { url: string; isCover?: boolean }[]
): string {
  return (
    PRODUCT_IMAGE_BY_NAME_EN[nameEn] ??
    images?.find((i) => i.isCover)?.url ??
    images?.[0]?.url ??
    "/logo.svg"
  );
}

export function resolveCategoryImage(slug: string, imageUrl?: string | null): string {
  return CATEGORY_IMAGE_BY_SLUG[slug] ?? imageUrl ?? "/logo.svg";
}
