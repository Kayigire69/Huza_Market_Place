import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cacheGet, cacheSet, CacheKeys } from "@/lib/redis";

export async function GET() {
  const cached = await cacheGet<{ items: unknown[] }>(CacheKeys.faq);
  if (cached) return NextResponse.json(cached);

  const items = await prisma.faqItem.findMany({
    where: { isPublished: true },
    orderBy: { sortOrder: "asc" },
  });
  const payload = { items };
  await cacheSet(CacheKeys.faq, payload, 300);
  return NextResponse.json(payload);
}
