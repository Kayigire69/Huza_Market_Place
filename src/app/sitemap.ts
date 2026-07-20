import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  process.env.NEXTAUTH_URL?.replace(/\/$/, "") ||
  "https://www.youthhuza.rw";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/products",
    "/categories",
    "/about",
    "/contact",
    "/faq",
    "/delivery-info",
    "/mission",
    "/vision",
    "/careers",
    "/privacy",
    "/terms",
    "/refund-policy",
    "/support",
    "/track",
  ].map((path) => ({
    url: `${siteUrl}${path || "/"}`,
    lastModified: new Date(),
    changeFrequency: path === "" || path === "/products" ? "daily" : "weekly",
    priority: path === "" ? 1 : path === "/products" ? 0.9 : 0.6,
  }));

  let productEntries: MetadataRoute.Sitemap = [];
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        reviewStatus: "APPROVED",
        images: { some: { kind: "STOREFRONT" } },
      },
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 500,
    });
    productEntries = products.map((p) => ({
      url: `${siteUrl}/products/${p.id}`,
      lastModified: p.updatedAt,
      changeFrequency: "daily",
      priority: 0.7,
    }));
  } catch {
    /* sitemap still ships static routes if DB is unavailable at build */
  }

  return [...staticRoutes, ...productEntries];
}
