"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { useLocale } from "@/lib/locale-context";
import { categoryName } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";

type Category = {
  id: string;
  slug: string;
  nameEn: string;
  nameFr: string;
  nameRw: string;
};

export function ProductFilters({ categories }: { categories: Category[] }) {
  const { t, locale } = useLocale();
  const router = useRouter();
  const sp = useSearchParams();
  const [form, setForm] = useState({
    q: sp.get("q") ?? "",
    category: sp.get("category") ?? "",
    minPrice: sp.get("minPrice") ?? "",
    maxPrice: sp.get("maxPrice") ?? "",
    organic: sp.get("organic") === "1",
    bestRated: sp.get("bestRated") === "1" || sp.get("best") === "1",
    newArrivals: sp.get("new") === "1" || sp.get("newArrivals") === "1",
    promotions: sp.get("promo") === "1",
    inStock: sp.get("inStock") === "1",
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    Object.entries(form).forEach(([key, value]) => {
      if (typeof value === "boolean") {
        if (value) params.set(key === "bestRated" ? "best" : key === "newArrivals" ? "new" : key, "1");
      } else if (value) {
        params.set(key, value);
      }
    });
    router.push(`/products?${params.toString()}`);
  };

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-[var(--huza-line)] bg-white p-4 space-y-4 h-fit sticky top-24">
      <h2 className="font-semibold">{t("filters")}</h2>
      <div>
        <label className="label">{t("searchPlaceholder")}</label>
        <input
          className="input-field"
          value={form.q}
          onChange={(e) => setForm({ ...form, q: e.target.value })}
        />
      </div>
      <div>
        <label className="label">{t("categories")}</label>
        <select
          className="input-field"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        >
          <option value="">{t("allCategories")}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {categoryName(c, locale)}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="label">{t("minPrice")}</label>
          <input
            type="number"
            className="input-field"
            value={form.minPrice}
            onChange={(e) => setForm({ ...form, minPrice: e.target.value })}
          />
        </div>
        <div>
          <label className="label">{t("maxPrice")}</label>
          <input
            type="number"
            className="input-field"
            value={form.maxPrice}
            onChange={(e) => setForm({ ...form, maxPrice: e.target.value })}
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.inStock}
          onChange={(e) => setForm({ ...form, inStock: e.target.checked })}
        />
        In stock only
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.organic}
          onChange={(e) => setForm({ ...form, organic: e.target.checked })}
        />
        {t("organic")}
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.bestRated}
          onChange={(e) => setForm({ ...form, bestRated: e.target.checked })}
        />
        {t("bestRated")} / Best sellers
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.newArrivals}
          onChange={(e) => setForm({ ...form, newArrivals: e.target.checked })}
        />
        {t("newArrivals")}
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.promotions}
          onChange={(e) => setForm({ ...form, promotions: e.target.checked })}
        />
        Promotions / featured
      </label>
      <Button type="submit" className="w-full">
        {t("applyFilters")}
      </Button>
    </form>
  );
}
