"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "@/lib/locale-context";
import { categoryName } from "@/lib/i18n";
import { ChevronRight } from "lucide-react";
import { resolveCategoryImage } from "@/lib/catalog-images";

type Category = {
  id: string;
  slug: string;
  nameEn: string;
  nameFr: string;
  nameRw: string;
  imageUrl?: string | null;
  _count: { products: number };
};

export function CategoriesClient({ categories }: { categories: Category[] }) {
  const { locale, t } = useLocale();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((c) => (
        <Link
          key={c.id}
          href={`/products?category=${c.slug}`}
          className="group relative overflow-hidden rounded-[22px] ring-1 ring-[var(--huza-line)] transition hover:ring-[var(--huza-green)]"
        >
          <div className="relative aspect-[16/10]">
            <Image
              src={resolveCategoryImage(c.slug, c.imageUrl)}
              alt={categoryName(c, locale)}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 sm:p-5">
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-white">
                  {categoryName(c, locale)}
                </h2>
                <p className="mt-1 text-sm text-white/80">
                  {c._count.products} {t("products").toLowerCase()}
                </p>
              </div>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
                {t("viewAll")}
                <ChevronRight className="size-3.5" />
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
