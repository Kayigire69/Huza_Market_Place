import { NextResponse } from "next/server";
import { getSetting } from "@/services/settings.service";
import {
  DEFAULT_SHOP_HERO_SLIDES,
  SHOP_HERO_SETTING_KEY,
  enabledShopHeroSlides,
  parseShopHeroSlides,
} from "@/lib/shop-hero";

/** Public Customer Website hero slides (enabled only). */
export async function GET() {
  const raw = await getSetting(SHOP_HERO_SETTING_KEY, "");
  const configured = Boolean(raw?.trim());
  const all = configured
    ? parseShopHeroSlides(raw)
    : DEFAULT_SHOP_HERO_SLIDES.map((s) => ({ ...s }));
  const slides = enabledShopHeroSlides(all);

  return NextResponse.json(
    {
      slides,
      /** true when Admin has saved CMS slides (even if all disabled). */
      configured,
      source: configured ? "cms" : "default",
    },
    {
      headers: {
        // Short cache so Publish shows up quickly on the shop.
        "Cache-Control": "public, max-age=0, s-maxage=10, stale-while-revalidate=30",
      },
    }
  );
}
