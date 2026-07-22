import { NextResponse } from "next/server";
import { getSetting } from "@/services/settings.service";
import {
  SHOP_NAV_SHORTCUTS_SETTING_KEY,
  parseShopNavShortcuts,
  visibleShopNavShortcuts,
} from "@/lib/shop-nav-shortcuts";

/** Public Customer Website category shortcuts (visible only). */
export async function GET() {
  const raw = await getSetting(SHOP_NAV_SHORTCUTS_SETTING_KEY, "");
  const items = visibleShopNavShortcuts(parseShopNavShortcuts(raw));
  return NextResponse.json(
    { items },
    {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
      },
    }
  );
}
