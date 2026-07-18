import { NextResponse } from "next/server";
import { getSearchSuggestions } from "@/lib/recommendations";
import { cacheGet, cacheSet, CacheKeys } from "@/lib/redis";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") || "";
  const key = CacheKeys.searchSuggest(q.trim().toLowerCase());
  const cached = await cacheGet<{ suggestions: Awaited<ReturnType<typeof getSearchSuggestions>> }>(
    key
  );
  if (cached) return NextResponse.json(cached);

  const suggestions = await getSearchSuggestions(q);
  const payload = { suggestions };
  if (q.trim().length >= 2) await cacheSet(key, payload, 90);
  return NextResponse.json(payload);
}
