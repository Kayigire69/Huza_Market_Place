import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CategoriesClient } from "./CategoriesClient";

export const revalidate = 120;

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: true } } },
  });

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
