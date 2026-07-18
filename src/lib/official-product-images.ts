import { prisma } from "@/lib/prisma";
import { cacheDel, CacheKeys } from "@/lib/redis";

/**
 * Official HUZA product images (customer-facing).
 * Farmer INSPECTION photos must never be copied here.
 */
export function normalizeOfficialImageUrls(raw: unknown, max = 5): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(String)
    .map((u) => u.trim())
    .filter((u) => u.length > 0 && !u.includes(".."))
    .slice(0, max);
}

/**
 * Replace product STOREFRONT gallery with official admin/procurement photos.
 * Optionally stamp the latest inventory batch so newer batches own the website images.
 */
export async function publishOfficialProductImages(opts: {
  productId: string;
  imageUrls: string[];
  productName?: string;
  /** When set, store URLs on this batch; otherwise update the newest batch for the product */
  batchId?: string | null;
  coverIndex?: number;
}) {
  const limited = normalizeOfficialImageUrls(opts.imageUrls);
  if (limited.length === 0) {
    throw new Error("At least one official image URL is required");
  }

  const product =
    opts.productName != null
      ? { nameEn: opts.productName }
      : await prisma.product.findUnique({
          where: { id: opts.productId },
          select: { nameEn: true },
        });
  if (!product) throw new Error("Product not found");

  const coverIndex = Math.max(
    0,
    Math.min(Number(opts.coverIndex) || 0, limited.length - 1)
  );

  await prisma.$transaction(async (tx) => {
    await tx.productImage.deleteMany({
      where: { productId: opts.productId, kind: "STOREFRONT" },
    });
    await tx.productImage.createMany({
      data: limited.map((url, i) => ({
        productId: opts.productId,
        url,
        alt: `${product.nameEn} ${i + 1}`,
        sortOrder: i,
        kind: "STOREFRONT" as const,
        isCover: i === coverIndex,
      })),
    });

    if (opts.batchId) {
      await tx.stockBatch.update({
        where: { id: opts.batchId },
        data: { officialImageUrls: limited },
      });
    } else {
      const latest = await tx.stockBatch.findFirst({
        where: { productId: opts.productId },
        orderBy: { receivedAt: "desc" },
        select: { id: true },
      });
      if (latest) {
        await tx.stockBatch.update({
          where: { id: latest.id },
          data: { officialImageUrls: limited },
        });
      }
    }
  });

  await cacheDel(CacheKeys.homeCatalog);
  await cacheDel(CacheKeys.bestSellers);
  return limited;
}

/** Publish storefront from a batch's saved official photos (newest-batch wins). */
export async function publishOfficialImagesFromBatch(batchId: string) {
  const batch = await prisma.stockBatch.findUnique({
    where: { id: batchId },
    include: { product: { select: { id: true, nameEn: true } } },
  });
  if (!batch) throw new Error("Batch not found");
  if (!batch.officialImageUrls?.length) {
    throw new Error("This batch has no official images yet");
  }
  return publishOfficialProductImages({
    productId: batch.productId,
    imageUrls: batch.officialImageUrls,
    productName: batch.product.nameEn,
    batchId: batch.id,
  });
}
