"use client";

const KEY = "huza-recently-viewed";
const MAX = 12;

export type RecentProduct = {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
};

export function getRecentlyViewed(): RecentProduct[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as RecentProduct[];
  } catch {
    return [];
  }
}

export function pushRecentlyViewed(item: RecentProduct) {
  if (typeof window === "undefined") return;
  const prev = getRecentlyViewed().filter((p) => p.id !== item.id);
  const next = [item, ...prev].slice(0, MAX);
  localStorage.setItem(KEY, JSON.stringify(next));
}
