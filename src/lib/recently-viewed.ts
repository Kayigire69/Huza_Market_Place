"use client";

const KEY = "huza-recently-viewed";
const MAX = 12;
const EVENT = "huza:recently-viewed";

/** Stored view history — IDs only (live catalog is fetched for display). */
export type RecentView = {
  id: string;
  viewedAt: number;
};

/** @deprecated snapshot shape kept for migrating older localStorage entries */
export type RecentProduct = {
  id: string;
  name?: string;
  price?: number;
  imageUrl?: string;
};

function readRaw(): unknown {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

/** Normalize legacy `{id,name,price}` entries and new `{id,viewedAt}` entries. */
export function getRecentlyViewedIds(): string[] {
  const raw = readRaw();
  if (!Array.isArray(raw)) return [];
  const ids: string[] = [];
  for (const entry of raw) {
    if (typeof entry === "string" && entry) {
      ids.push(entry);
      continue;
    }
    if (entry && typeof entry === "object" && "id" in entry) {
      const id = String((entry as { id: unknown }).id || "");
      if (id) ids.push(id);
    }
  }
  // de-dupe preserving order (most recent first)
  return [...new Set(ids)].slice(0, MAX);
}

/** @deprecated use getRecentlyViewedIds + live fetch */
export function getRecentlyViewed(): RecentProduct[] {
  return getRecentlyViewedIds().map((id) => ({ id }));
}

export function pushRecentlyViewed(item: { id: string } | RecentProduct) {
  if (typeof window === "undefined" || !item?.id) return;
  const prev = getRecentlyViewedIds().filter((id) => id !== item.id);
  const next: RecentView[] = [
    { id: item.id, viewedAt: Date.now() },
    ...prev.map((id) => ({ id, viewedAt: 0 })),
  ].slice(0, MAX);
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function recentlyViewedEventName() {
  return EVENT;
}
