/**
 * @deprecated Prefer `@/lib/shop-nav-shortcuts` (Admin CMS). Kept as a thin
 * re-export so older imports keep working with the same defaults.
 */

export type { ShopNavShortcut as NavCategory } from "@/lib/shop-nav-shortcuts";
export {
  DEFAULT_SHOP_NAV_SHORTCUTS as NAV_CATEGORIES,
  shopNavShortcutLabel,
} from "@/lib/shop-nav-shortcuts";
