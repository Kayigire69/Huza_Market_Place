/** Lightweight shopping categories for header rails (Phase 1 nav). */

export type NavCategory = {
  slug: string;
  emoji: string;
  nameEn: string;
  nameFr: string;
  nameRw: string;
  nameSw: string;
};

export const NAV_CATEGORIES: NavCategory[] = [
  {
    slug: "fresh-vegetables",
    emoji: "🥬",
    nameEn: "Vegetables",
    nameFr: "Légumes",
    nameRw: "Imboga",
    nameSw: "Mboga",
  },
  {
    slug: "fresh-fruits",
    emoji: "🍎",
    nameEn: "Fruits",
    nameFr: "Fruits",
    nameRw: "Imbuto",
    nameSw: "Matunda",
  },
  {
    slug: "fresh-juices",
    emoji: "🧃",
    nameEn: "Juices",
    nameFr: "Jus",
    nameRw: "Imvubo",
    nameSw: "Juice",
  },
  {
    slug: "fruit-salads",
    emoji: "🥗",
    nameEn: "Salads",
    nameFr: "Salades",
    nameRw: "Salade",
    nameSw: "Saladi",
  },
  {
    slug: "fruit-seedlings",
    emoji: "🌱",
    nameEn: "Seedlings",
    nameFr: "Jeunes plants",
    nameRw: "Imbuto",
    nameSw: "Miche",
  },
  {
    slug: "ornamental-plants",
    emoji: "🪴",
    nameEn: "Plants",
    nameFr: "Plantes",
    nameRw: "Ibihingwa",
    nameSw: "Mimea",
  },
];
