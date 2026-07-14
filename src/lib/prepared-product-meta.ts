/** Helpers for juices & fruit salads — HUZA “Freshly Prepared” details. */

const READY_SLUGS = new Set(["fruit-salads", "fresh-juices"]);

export function isPreparedCategory(slug?: string | null): boolean {
  return Boolean(slug && READY_SLUGS.has(slug));
}

export type PreparedMeta = {
  ingredients: string;
  bottleSize: string;
  servingSize: string;
  storage: string;
  expiry: string;
};

export function getPreparedMeta(product: {
  nameEn: string;
  unit: string;
  nutritionalInfo?: string | null;
  descriptionEn?: string;
  category?: { slug?: string } | null;
}): PreparedMeta | null {
  if (!isPreparedCategory(product.category?.slug)) return null;

  const isJuice = product.category?.slug === "fresh-juices";
  const name = product.nameEn.toLowerCase();

  let ingredients =
    product.nutritionalInfo?.trim() ||
    (isJuice
      ? "100% fresh fruit, no added sugar, no preservatives"
      : "Fresh seasonal fruits, prepared daily by Youth Huza");

  if (!product.nutritionalInfo) {
    if (name.includes("passion")) ingredients = "Passion fruit pulp, filtered water";
    else if (name.includes("pineapple") && name.includes("ginger"))
      ingredients = "Fresh pineapple, ginger, filtered water";
    else if (name.includes("pineapple")) ingredients = "Fresh pineapple, filtered water";
    else if (name.includes("mango")) ingredients = "Fresh mango, filtered water";
    else if (name.includes("tree tomato")) ingredients = "Tree tomato, filtered water";
    else if (name.includes("sugarcane")) ingredients = "Fresh sugarcane juice";
    else if (name.includes("salad") || name.includes("tray"))
      ingredients = "Seasonal tropical fruits (pineapple, mango, watermelon, passion fruit)";
  }

  const bottleSize = isJuice
    ? product.unit === "LITER"
      ? "1 L bottle"
      : product.unit === "HALF_KG" || product.unit === "GRAM"
        ? "250–500 ml cup"
        : "Approx. 500 ml bottle"
    : product.unit === "PIECE"
      ? "Single serving cup / tray"
      : "Family tray / cup portion";

  const servingSize = isJuice ? "1 glass (about 250 ml)" : "1 cup / portion as packed";

  const storage = isJuice
    ? "Keep refrigerated at 0–4°C. Shake well before drinking."
    : "Keep refrigerated. Best eaten cold the same day.";

  const expiry = isJuice
    ? "Best within 24–48 hours of preparation"
    : "Best within 12–24 hours of preparation";

  return { ingredients, bottleSize, servingSize, storage, expiry };
}
