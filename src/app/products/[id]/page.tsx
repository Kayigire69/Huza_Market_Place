import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductDetailClient } from "@/components/products/ProductDetailClient";
import { ProductCard } from "@/components/products/ProductCard";
import { RecentlyViewedSection } from "@/components/products/RecentlyViewedSection";
import {
  getFrequentlyBoughtTogether,
  getSmartRecommendations,
} from "@/lib/recommendations";
import { cacheGet, cacheSet } from "@/lib/redis";

export const revalidate = 60;

type ReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  photoUrl: string | null;
  user: { fullName: string };
};

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cacheKey = `huza:product:detail:${id}`;

  type DetailPayload = {
    storefrontProduct: Parameters<typeof ProductDetailClient>[0]["product"];
    fbt: Awaited<ReturnType<typeof getFrequentlyBoughtTogether>>;
    recommended: Awaited<ReturnType<typeof getSmartRecommendations>>;
    reviews: ReviewRow[];
  };

  let payload = await cacheGet<DetailPayload>(cacheKey);

  if (!payload) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: {
          where: { kind: "STOREFRONT" },
          orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
        },
        supplier: true,
        category: true,
        reviews: {
          where: { isHidden: false },
          include: { user: { select: { fullName: true } } },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!product || !product.isActive || product.deletedAt) notFound();
    if (product.images.length === 0) notFound();

    // Never expose farmer/supplier identity to the customer storefront payload
    const storefrontProduct = {
      id: product.id,
      nameEn: product.nameEn,
      nameFr: product.nameFr,
      nameRw: product.nameRw,
      descriptionEn: product.descriptionEn,
      descriptionFr: product.descriptionFr,
      descriptionRw: product.descriptionRw,
      price: product.price,
      unit: product.unit,
      stockQty: product.stockQty,
      reservedQty: product.reservedQty,
      availability: product.availability,
      isOrganic: product.isOrganic,
      ratingAvg: product.ratingAvg,
      ratingCount: product.ratingCount,
      location: product.location,
      originDistrict: product.originDistrict,
      nutritionalInfo: product.nutritionalInfo,
      availableDistricts: product.availableDistricts,
      images: product.images,
      category: product.category,
      supplier: { id: product.supplierId },
    };

    const [fbt, recommended] = await Promise.all([
      getFrequentlyBoughtTogether(product.id, 4),
      getSmartRecommendations({
        productId: product.id,
        categoryId: product.categoryId,
        take: 4,
      }),
    ]);

    payload = {
      storefrontProduct,
      fbt,
      recommended,
      reviews: product.reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        photoUrl: r.photoUrl,
        user: { fullName: r.user.fullName },
      })),
    };
    await cacheSet(cacheKey, payload, 45);
  }

  const { storefrontProduct, fbt, recommended, reviews } = payload;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <ProductDetailClient product={storefrontProduct} />

      <section className="mt-14">
        <h2 className="section-title mb-6">Frequently bought together</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {fbt.map((p) => (p ? <ProductCard key={p.id} product={p} /> : null))}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="section-title mb-6">Recommended for you</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {recommended.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <RecentlyViewedSection />

      <section className="mt-14">
        <h2 className="section-title mb-6">Customer reviews</h2>
        {reviews.length === 0 ? (
          <p className="text-[var(--huza-muted)]">No reviews yet.</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border border-[var(--huza-line)] bg-white p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-sm">{r.user.fullName}</p>
                  <p className="text-[var(--huza-gold)] text-sm">{"★".repeat(r.rating)}</p>
                </div>
                {r.comment && <p className="mt-2 text-sm text-[var(--huza-muted)]">{r.comment}</p>}
                {r.photoUrl && (
                  <div className="relative mt-3 h-24 w-24 overflow-hidden rounded-lg">
                    <Image src={r.photoUrl} alt="Review" fill className="object-cover" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <p className="mt-4 text-sm">
          <Link href="/auth/login" className="text-[var(--huza-green)] font-semibold">
            Log in
          </Link>{" "}
          to write a review.
        </p>
      </section>
    </div>
  );
}
