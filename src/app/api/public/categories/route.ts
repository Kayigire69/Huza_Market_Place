import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cacheGet, cacheSet } from "@/lib/redis";

export const revalidate = 120;

const CACHE_KEY = "huza:public:categories:nav";

type NavCategory = {
  id: string;
  slug: string;
  nameEn: string;
  nameFr: string;
  nameRw: string;
  imageUrl: string | null;
  productCount: number;
};

export async function GET() {
  let categories = await cacheGet<NavCategory[]>(CACHE_KEY);
  if (!categories) {
    const rows = await prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        slug: true,
        nameEn: true,
        nameFr: true,
        nameRw: true,
        imageUrl: true,
        _count: { select: { products: true } },
      },
    });
    categories = rows.map((c) => ({
      id: c.id,
      slug: c.slug,
      nameEn: c.nameEn,
      nameFr: c.nameFr,
      nameRw: c.nameRw,
      imageUrl: c.imageUrl,
      productCount: c._count.products,
    }));
    await cacheSet(CACHE_KEY, categories, 120);
  }

  return NextResponse.json(
    { categories },
    {
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
      },
    }
  );
}
