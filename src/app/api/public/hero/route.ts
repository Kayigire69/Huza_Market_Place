import { NextResponse } from "next/server";
import { getSetting } from "@/services/settings.service";
import {
  SHOP_HERO_SETTING_KEY,
  enabledShopHeroSlides,
  parseShopHeroSlides,
} from "@/lib/shop-hero";

/** Public Customer Website hero slides (enabled only). */
export async function GET() {
  const raw = await getSetting(SHOP_HERO_SETTING_KEY, "");
  const slides = enabledShopHeroSlides(parseShopHeroSlides(raw));
  return NextResponse.json(
    { slides },
    {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
      },
    }
  );
}
