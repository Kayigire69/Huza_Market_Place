/**
 * Canonical shop/admin product units. Keep in sync with prisma UnitType enum.
 */
export const PRODUCT_UNIT_VALUES = [
  "PIECE",
  "KG",
  "GRAM",
  "LITRE",
  "MILLILITRE",
  "BUNCH",
  "PACK",
  "CRATE",
  "TRAY",
  "BASKET",
  "BAG",
  "BOX",
  "CUP",
  "DOZEN",
] as const;

export type ProductUnitValue = (typeof PRODUCT_UNIT_VALUES)[number];

export const PRODUCT_UNIT_OPTIONS: { value: ProductUnitValue; label: string }[] = [
  { value: "PIECE", label: "Piece" },
  { value: "KG", label: "Kg" },
  { value: "GRAM", label: "g" },
  { value: "LITRE", label: "Litre (L)" },
  { value: "MILLILITRE", label: "Millilitre (mL)" },
  { value: "BUNCH", label: "Bunch" },
  { value: "PACK", label: "Pack" },
  { value: "CRATE", label: "Crate" },
  { value: "TRAY", label: "Tray" },
  { value: "BASKET", label: "Basket" },
  { value: "BAG", label: "Bag" },
  { value: "BOX", label: "Box" },
  { value: "CUP", label: "Cup" },
  { value: "DOZEN", label: "Dozen" },
];

/** Short labels for cards, cart, orders, inventory */
export const PRODUCT_UNIT_SHORT: Record<ProductUnitValue, string> = {
  PIECE: "piece",
  KG: "kg",
  GRAM: "g",
  LITRE: "L",
  MILLILITRE: "mL",
  BUNCH: "bunch",
  PACK: "pack",
  CRATE: "crate",
  TRAY: "tray",
  BASKET: "basket",
  BAG: "bag",
  BOX: "box",
  CUP: "cup",
  DOZEN: "dozen",
};

export function parseUnitType(raw: unknown, fallback: ProductUnitValue = "KG"): ProductUnitValue {
  const s = String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/S$/, "");
  const aliases: Record<string, ProductUnitValue> = {
    KG: "KG",
    KILO: "KG",
    KILOGRAM: "KG",
    G: "GRAM",
    GRAM: "GRAM",
    GRAMS: "GRAM",
    PIECE: "PIECE",
    PC: "PIECE",
    PCS: "PIECE",
    BUNCH: "BUNCH",
    LITRE: "LITRE",
    LITER: "LITRE",
    L: "LITRE",
    ML: "MILLILITRE",
    MILLILITRE: "MILLILITRE",
    MILLILITER: "MILLILITRE",
    PACK: "PACK",
    CRATE: "CRATE",
    TRAY: "TRAY",
    BASKET: "BASKET",
    BAG: "BAG",
    BOX: "BOX",
    CUP: "CUP",
    DOZEN: "DOZEN",
  };
  if (aliases[s]) return aliases[s];
  if ((PRODUCT_UNIT_VALUES as readonly string[]).includes(s)) return s as ProductUnitValue;
  return fallback;
}
