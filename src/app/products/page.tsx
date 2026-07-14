import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductFilters } from "@/components/products/ProductFilters";
import { ProductCard } from "@/components/products/ProductCard";
import { Prisma } from "@prisma/client";
import { cacheGet, cacheSet, CacheKeys } from "@/lib/redis";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const PAGE_SIZE = 48;

type ProductsPayload = {
  products: Awaited<ReturnType<typeof fetchProducts>>;
  categories: Awaited<ReturnType<typeof prisma.category.findMany>>;
  total: number;
};

async function fetchProducts(where: Prisma.ProductWhereInput, skip: number, take: number) {
  return prisma.product.findMany({
    where,
    select: {
      id: true,
      nameEn: true,
      nameFr: true,
      nameRw: true,
      price: true,
      unit: true,
      stockQty: true,
      reservedQty: true,
      lowStockAt: true,
      isOrganic: true,
      ratingAvg: true,
      availableDistricts: true,
      originDistrict: true,
      nutritionalInfo: true,
      reviewStatus: true,
      reviewedAt: true,
      harvestDate: true,
      images: {
        where: { kind: "STOREFRONT" },
        orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
        take: 2,
        select: { url: true, isCover: true },
      },
      supplier: { select: { id: true } },
      category: {
        select: { nameEn: true, nameFr: true, nameRw: true, slug: true },
      },
    },
    orderBy: [{ isFeatured: "desc" }, { ratingAvg: "desc" }],
    skip,
    take,
  });
}

function ProductsFallback() {
  return (
    <div className="grid lg:grid-cols-[260px_1fr] gap-8">
      <div className="h-80 animate-pulse rounded-2xl border border-[var(--huza-line)] bg-white/80" />
      <div>
        <div className="mb-4 h-4 w-40 animate-pulse rounded bg-[var(--huza-line)]/70" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-56 animate-pulse rounded-2xl border border-[var(--huza-line)] bg-white/80"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

async function ProductsResults({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const category = typeof sp.category === "string" ? sp.category : "";
  const minPrice = typeof sp.minPrice === "string" ? Number(sp.minPrice) : undefined;
  const maxPrice = typeof sp.maxPrice === "string" ? Number(sp.maxPrice) : undefined;
  const organic = sp.organic === "1";
  const best = sp.best === "1" || sp.bestRated === "1";
  const featured = sp.featured === "1" || sp.promo === "1";
  const newArrivals = sp.new === "1" || sp.newArrivals === "1";
  const inStock = sp.inStock === "1";
  const pageRaw = typeof sp.page === "string" ? Number(sp.page) : 1;
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
  const skip = (page - 1) * PAGE_SIZE;

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    images: { some: { kind: "STOREFRONT" } },
    ...(q
      ? {
          OR: [
            { nameEn: { contains: q, mode: "insensitive" } },
            { nameFr: { contains: q, mode: "insensitive" } },
            { nameRw: { contains: q, mode: "insensitive" } },
            { descriptionEn: { contains: q, mode: "insensitive" } },
            { descriptionFr: { contains: q, mode: "insensitive" } },
            { descriptionRw: { contains: q, mode: "insensitive" } },
            { keywords: { contains: q, mode: "insensitive" } },
            { category: { nameEn: { contains: q, mode: "insensitive" } } },
            { category: { nameFr: { contains: q, mode: "insensitive" } } },
            { category: { nameRw: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
    ...(category ? { category: { slug: category } } : {}),
    ...(minPrice !== undefined && !Number.isNaN(minPrice) ? { price: { gte: minPrice } } : {}),
    ...(maxPrice !== undefined && !Number.isNaN(maxPrice)
      ? { price: { ...(minPrice !== undefined ? { gte: minPrice } : {}), lte: maxPrice } }
      : {}),
    ...(organic ? { isOrganic: true } : {}),
    ...(best ? { isBestSeller: true } : {}),
    ...(featured ? { isFeatured: true } : {}),
    ...(newArrivals ? { isNewArrival: true } : {}),
    ...(inStock ? { stockQty: { gt: 0 } } : {}),
  };

  const listKey = CacheKeys.productsList(
    JSON.stringify({
      q,
      category,
      minPrice: minPrice ?? null,
      maxPrice: maxPrice ?? null,
      organic,
      best,
      featured,
      newArrivals,
      inStock,
      page,
      take: PAGE_SIZE,
    })
  );

  let payload = await cacheGet<ProductsPayload>(listKey);
  if (!payload) {
    const [products, categories, total] = await Promise.all([
      fetchProducts(where, skip, PAGE_SIZE),
      prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.product.count({ where }),
    ]);
    payload = { products, categories, total };
    await cacheSet(listKey, payload, 30);
  }

  const { products, categories, total } = payload;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const pageHref = (nextPage: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (minPrice !== undefined && !Number.isNaN(minPrice)) params.set("minPrice", String(minPrice));
    if (maxPrice !== undefined && !Number.isNaN(maxPrice)) params.set("maxPrice", String(maxPrice));
    if (organic) params.set("organic", "1");
    if (best) params.set("best", "1");
    if (featured) params.set("featured", "1");
    if (newArrivals) params.set("new", "1");
    if (inStock) params.set("inStock", "1");
    if (nextPage > 1) params.set("page", String(nextPage));
    const qs = params.toString();
    return qs ? `/products?${qs}` : "/products";
  };

  return (
    <div className="grid lg:grid-cols-[260px_1fr] gap-8">
      <Suspense fallback={<div className="rounded-2xl border p-4">Loading filters...</div>}>
        <ProductFilters categories={categories} />
      </Suspense>
      <div>
        <p className="mb-4 text-sm text-[var(--huza-muted)]">
          {total} product{total === 1 ? "" : "s"}
          {q ? ` for “${q}”` : ""}
          {totalPages > 1 ? ` · page ${page} of ${totalPages}` : ""}
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
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-3">
            {page > 1 ? (
              <Link
                href={pageHref(page - 1)}
                className="rounded-lg border border-[var(--huza-line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--huza-ink)] hover:bg-[var(--huza-mint)]"
              >
                Previous
              </Link>
            ) : null}
            {page < totalPages ? (
              <Link
                href={pageHref(page + 1)}
                className="rounded-lg border border-[var(--huza-line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--huza-ink)] hover:bg-[var(--huza-mint)]"
              >
                Next
              </Link>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="section-title">Products</h1>
        <p className="mt-2 text-[var(--huza-muted)]">
          Fresh products sold and delivered by Youth Huza
        </p>
      </div>
      <Suspense fallback={<ProductsFallback />}>
        <ProductsResults searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
