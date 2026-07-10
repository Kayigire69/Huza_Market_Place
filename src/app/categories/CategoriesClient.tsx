"use client";

import Link from "next/link";
import { useLocale } from "@/lib/locale-context";
import { categoryName } from "@/lib/i18n";

type Category = {
  id: string;
  slug: string;
  nameEn: string;
  nameFr: string;
  nameRw: string;
  _count: { products: number };
};

const icons: Record<string, string> = {
  fruits: "🥭",
  vegetables: "🥬",
  cereals: "🌾",
  dairy: "🥛",
  meat: "🥩",
  poultry: "🐔",
  fish: "🐟",
  eggs: "🥚",
  spices: "🌶️",
  honey: "🍯",
  "other-fresh": "🌿",
};

export function CategoriesClient({ categories }: { categories: Category[] }) {
  const { locale } = useLocale();

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {categories.map((c) => (
        <Link
          key={c.id}
          href={`/products?category=${c.slug}`}
          className="group rounded-2xl border border-[var(--huza-line)] bg-white p-6 hover:border-[var(--huza-green)] transition"
        >
          <span className="text-3xl" aria-hidden>
            {icons[c.slug] ?? "🛒"}
          </span>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-xl font-bold text-[var(--huza-green-dark)] group-hover:text-[var(--huza-green)]">
            {categoryName(c, locale)}
          </h2>
          <p className="mt-1 text-sm text-[var(--huza-muted)]">
            {c._count.products} products
          </p>
        </Link>
      ))}
    </div>
  );
}
