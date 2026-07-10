import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { ProductFilters } from "@/components/products/ProductFilters";
import { ProductCard } from "@/components/products/ProductCard";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const category = typeof sp.category === "string" ? sp.category : "";
  const supplier = typeof sp.supplier === "string" ? sp.supplier : "";
  const location = typeof sp.location === "string" ? sp.location : "";
  const minPrice = typeof sp.minPrice === "string" ? Number(sp.minPrice) : undefined;
  const maxPrice = typeof sp.maxPrice === "string" ? Number(sp.maxPrice) : undefined;
  const organic = sp.organic === "1";
  const best = sp.best === "1" || sp.bestRated === "1";
  const featured = sp.featured === "1";
  const newArrivals = sp.new === "1" || sp.newArrivals === "1";

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(q
      ? {
          OR: [
            { nameEn: { contains: q, mode: "insensitive" } },
            { nameFr: { contains: q, mode: "insensitive" } },
            { nameRw: { contains: q, mode: "insensitive" } },
            { supplier: { businessName: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
    ...(category ? { category: { slug: category } } : {}),
    ...(supplier ? { supplier: { businessName: { contains: supplier, mode: "insensitive" } } } : {}),
    ...(location ? { location: { contains: location, mode: "insensitive" } } : {}),
    ...(minPrice !== undefined && !Number.isNaN(minPrice) ? { price: { gte: minPrice } } : {}),
    ...(maxPrice !== undefined && !Number.isNaN(maxPrice)
      ? { price: { ...(minPrice !== undefined ? { gte: minPrice } : {}), lte: maxPrice } }
      : {}),
    ...(organic ? { isOrganic: true } : {}),
    ...(best ? { isBestSeller: true } : {}),
    ...(featured ? { isFeatured: true } : {}),
    ...(newArrivals ? { isNewArrival: true } : {}),
  };

  const [products, categories, suppliers] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { images: true, supplier: true, category: true },
      orderBy: [{ isFeatured: "desc" }, { ratingAvg: "desc" }],
    }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.supplier.findMany({
      where: { status: "APPROVED" },
      select: { id: true, businessName: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="section-title">Products</h1>
        <p className="mt-2 text-[var(--huza-muted)]">
          Browse fresh products from approved Youth Huza suppliers
        </p>
      </div>
      <div className="grid lg:grid-cols-[260px_1fr] gap-8">
        <Suspense fallback={<div className="rounded-2xl border p-4">Loading filters...</div>}>
          <ProductFilters categories={categories} suppliers={suppliers} />
        </Suspense>
        <div>
          <p className="mb-4 text-sm text-[var(--huza-muted)]">
            {products.length} product{products.length === 1 ? "" : "s"}
            {q ? ` for “${q}”` : ""}
          </p>
          {products.length === 0 ? (
            <p className="rounded-2xl border border-[var(--huza-line)] bg-white p-8 text-center text-[var(--huza-muted)]">
              No products match your filters.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
