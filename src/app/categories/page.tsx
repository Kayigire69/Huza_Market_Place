import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { CategoriesClient } from "./CategoriesClient";
import { cacheGet, cacheSet } from "@/lib/redis";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Categories",
  description: "Browse HUZA FRESH by category — fruits, vegetables, salads, juices, and more.",
};

const CACHE_KEY = "huza:categories:list";

export default async function CategoriesPage() {
  type Row = Awaited<ReturnType<typeof prisma.category.findMany>>[number] & {
    _count: { products: number };
  };

  let categories = await cacheGet<Row[]>(CACHE_KEY);
  if (!categories || categories.length === 0) {
    try {
      categories = await prisma.category.findMany({
        orderBy: { sortOrder: "asc" },
        include: { _count: { select: { products: true } } },
      });
      if (categories.length > 0) {
        await cacheSet(CACHE_KEY, categories, 120);
      }
    } catch (err) {
      const code =
        err && typeof err === "object" && "code" in err
          ? String((err as { code?: unknown }).code)
          : "";
      if (code !== "P2021") throw err;
      categories = [];
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <h1 className="section-title">Categories</h1>
      <p className="mt-2 text-[var(--huza-muted)] mb-8">
        Organize your shopping by fresh product groups
      </p>
      <CategoriesClient categories={categories} />
      <p className="mt-8 text-sm">
        <Link href="/products" className="text-[var(--huza-green)] font-semibold">
          View all products →
        </Link>
      </p>
    </div>
  );
}
