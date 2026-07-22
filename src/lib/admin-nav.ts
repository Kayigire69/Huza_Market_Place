import type { ComponentType } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Wallet,
  Package,
  Boxes,
  Truck,
  Wheat,
  ClipboardList,
  FileInput,
  PackageCheck,
  BarChart3,
  Settings,
  Tags,
  Percent,
  LifeBuoy,
  ClipboardCheck,
  Shield,
  ScrollText,
  UserCog,
  Handshake,
  Banknote,
  History,
  Leaf,
  Sprout,
  Camera,
  Store,
  Inbox,
  PanelsTopLeft,
  Eraser,
} from "lucide-react";

/** Stable module keys for role-aware admin sidebar + route guards */
export type AdminModule =
  | "dashboard"
  | "orders"
  | "customers"
  | "payments"
  | "support"
  | "categories"
  | "products"
  | "promotions"
  | "website_content"
  | "inventory"
  | "deliveries"
  | "farmers"
  | "approvals"
  | "agronomy"
  | "crop_monitoring"
  | "photography"
  | "purchase_requests"
  | "purchase_orders"
  | "goods_received"
  | "commission_sales"
  | "farmer_payments"
  | "procurement_history"
  | "market_procurement"
  | "reports"
  | "settings";

export type AdminNavItem = {
  module: AdminModule;
  href: string;
  label: string;
  exact?: boolean;
  future?: boolean;
  /** Only visible to Super Admin (staff, audit, security) */
  superOnly?: boolean;
  icon: ComponentType<{ className?: string }>;
};

export type AdminNavSection = {
  id: string;
  label?: string;
  items: AdminNavItem[];
};

/**
 * Sidebar organized by business workflow.
 * Includes foundation modules that were missing from the early roadmap
 * (Support, Promotions, Product Approvals) so Phase 1 IA is complete.
 */
export const ADMIN_NAV_SECTIONS: AdminNavSection[] = [
  {
    id: "sales",
    items: [
      { module: "dashboard", href: "/admin", label: "Dashboard", exact: true, icon: LayoutDashboard },
      { module: "orders", href: "/admin/orders", label: "Orders", icon: ShoppingCart },
      { module: "customers", href: "/admin/customers", label: "Customers", icon: Users },
      { module: "payments", href: "/admin/payments", label: "Payments", icon: Wallet },
      { module: "support", href: "/admin/support", label: "Support", icon: LifeBuoy },
    ],
  },
  {
    id: "catalog",
    label: "Catalog",
    items: [
      { module: "categories", href: "/admin/categories", label: "Categories", icon: Tags },
      { module: "products", href: "/admin/products", label: "Products", icon: Package },
      { module: "promotions", href: "/admin/offers", label: "Promotions", icon: Percent },
      {
        module: "website_content",
        href: "/admin/website-content",
        label: "Website Content",
        icon: PanelsTopLeft,
      },
    ],
  },
  {
    id: "ops",
    items: [
      { module: "inventory", href: "/admin/inventory", label: "Inventory", icon: Boxes },
      {
        module: "inventory",
        href: "/admin/restock",
        label: "Restock Requests",
        icon: Inbox,
      },
      { module: "deliveries", href: "/admin/delivery", label: "Deliveries", icon: Truck },
    ],
  },
  {
    id: "procurement",
    label: "Procurement",
    items: [
      { module: "farmers", href: "/admin/suppliers", label: "Farmers", icon: Wheat },
      {
        module: "approvals",
        href: "/admin/approvals",
        label: "Product Approvals",
        icon: ClipboardCheck,
      },
      {
        module: "agronomy",
        href: "/admin/agronomy",
        label: "Agronomy Support",
        icon: Leaf,
      },
      {
        module: "crop_monitoring",
        href: "/admin/crops",
        label: "Crop Monitoring",
        icon: Sprout,
      },
      {
        module: "photography",
        href: "/admin/photography",
        label: "Photography Queue",
        icon: Camera,
      },
      {
        module: "market_procurement",
        href: "/admin/procurement/market",
        label: "Market Procurement",
        icon: Store,
      },
      {
        module: "purchase_requests",
        href: "/admin/procurement/requests",
        label: "Purchase Requests",
        icon: FileInput,
      },
      {
        module: "purchase_orders",
        href: "/admin/procurement/orders",
        label: "Purchase Orders",
        icon: ClipboardList,
      },
      {
        module: "goods_received",
        href: "/admin/procurement/received",
        label: "Goods Received",
        icon: PackageCheck,
      },
      {
        module: "commission_sales",
        href: "/admin/procurement/commission",
        label: "Commission Sales",
        icon: Handshake,
      },
      {
        module: "farmer_payments",
        href: "/admin/procurement/payments",
        label: "Farmer Payments",
        icon: Banknote,
      },
      {
        module: "procurement_history",
        href: "/admin/procurement/history",
        label: "Procurement History",
        icon: History,
      },
    ],
  },
  {
    id: "insights",
    items: [{ module: "reports", href: "/admin/reports", label: "Reports", icon: BarChart3 }],
  },
  {
    id: "system",
    label: "System",
    items: [
      { module: "settings", href: "/admin/settings", label: "Settings", icon: Settings },
      {
        module: "settings",
        href: "/admin/staff",
        label: "Staff",
        icon: UserCog,
        superOnly: true,
      },
      {
        module: "settings",
        href: "/admin/cleanup",
        label: "System cleanup",
        icon: Eraser,
        superOnly: true,
      },
      {
        module: "settings",
        href: "/admin/audit",
        label: "Audit log",
        icon: ScrollText,
        superOnly: true,
      },
      {
        module: "settings",
        href: "/admin/security",
        label: "Security",
        icon: Shield,
        superOnly: true,
      },
    ],
  },
];

const ALL_MODULES: AdminModule[] = [
  ...new Set(ADMIN_NAV_SECTIONS.flatMap((s) => s.items.map((i) => i.module))),
];

function withCatalog(modules: AdminModule[]): AdminModule[] {
  const set = new Set(modules);
  if (set.has("products")) {
    set.add("categories");
    set.add("promotions");
    set.add("website_content");
  }
  return [...set];
}

function withProcurement(modules: AdminModule[]): AdminModule[] {
  const set = new Set(modules);
  if (
    set.has("farmers") ||
    set.has("purchase_orders") ||
    set.has("purchase_requests") ||
    set.has("approvals") ||
    set.has("agronomy") ||
    set.has("crop_monitoring") ||
    set.has("photography") ||
    set.has("market_procurement") ||
    set.has("commission_sales") ||
    set.has("farmer_payments") ||
    set.has("procurement_history")
  ) {
    set.add("farmers");
    set.add("approvals");
    set.add("agronomy");
    set.add("crop_monitoring");
    set.add("photography");
    set.add("market_procurement");
    set.add("purchase_requests");
    set.add("purchase_orders");
    set.add("goods_received");
    set.add("commission_sales");
    set.add("farmer_payments");
    set.add("procurement_history");
  }
  return [...set];
}

export const ADMIN_ROLE_MODULES: Record<string, AdminModule[]> = {
  SUPER_ADMIN: ALL_MODULES,
  ADMIN: withProcurement(withCatalog(ALL_MODULES.filter((m) => m !== "settings"))),
  MANAGER: withProcurement(withCatalog(ALL_MODULES.filter((m) => m !== "settings"))),
  INVENTORY: withCatalog(["dashboard", "products", "inventory", "deliveries", "approvals"]),
  WAREHOUSE: withCatalog(["dashboard", "products", "inventory", "deliveries"]),
  SUPPORT: ["dashboard", "orders", "customers", "payments", "support"],
  PROCUREMENT: withProcurement(
    withCatalog([
      "dashboard",
      "farmers",
      "approvals",
      "agronomy",
      "crop_monitoring",
      "photography",
      "market_procurement",
      "purchase_requests",
      "purchase_orders",
      "goods_received",
      "commission_sales",
      "farmer_payments",
      "procurement_history",
      "products",
    ])
  ),
  FINANCE: withProcurement([
    "dashboard",
    "payments",
    "reports",
    "orders",
    "commission_sales",
    "farmer_payments",
    "procurement_history",
    "market_procurement",
  ]),
};

export function modulesForRole(role?: string | null): AdminModule[] {
  if (!role) return ["dashboard"];
  return ADMIN_ROLE_MODULES[role] || (role === "ADMIN" ? ADMIN_ROLE_MODULES.ADMIN : ["dashboard"]);
}

export function roleCanAccessModule(role: string | null | undefined, mod: AdminModule): boolean {
  return modulesForRole(role).includes(mod);
}

export function moduleForAdminPath(pathname: string): AdminModule | null {
  if (pathname === "/admin" || pathname === "/admin/") return "dashboard";
  if (pathname.startsWith("/admin/orders")) return "orders";
  if (pathname.startsWith("/admin/customers")) return "customers";
  if (pathname.startsWith("/admin/payments")) return "payments";
  if (pathname.startsWith("/admin/support")) return "support";
  if (pathname.startsWith("/admin/categories")) return "categories";
  if (pathname.startsWith("/admin/website-content")) return "website_content";
  if (pathname.startsWith("/admin/products")) return "products";
  if (pathname.startsWith("/admin/offers")) return "promotions";
  if (pathname.startsWith("/admin/approvals")) return "approvals";
  if (pathname.startsWith("/admin/agronomy")) return "agronomy";
  if (pathname.startsWith("/admin/crops")) return "crop_monitoring";
  if (pathname.startsWith("/admin/photography")) return "photography";
  if (pathname.startsWith("/admin/inventory")) return "inventory";
  if (pathname.startsWith("/admin/restock")) return "inventory";
  if (pathname.startsWith("/admin/delivery")) return "deliveries";
  if (pathname.startsWith("/admin/suppliers")) return "farmers";
  if (pathname.startsWith("/admin/procurement/market")) return "market_procurement";
  if (pathname.startsWith("/admin/procurement/requests")) return "purchase_requests";
  if (pathname.startsWith("/admin/procurement/orders")) return "purchase_orders";
  if (pathname.startsWith("/admin/procurement/received")) return "goods_received";
  if (pathname.startsWith("/admin/procurement/commission")) return "commission_sales";
  if (pathname.startsWith("/admin/procurement/payments")) return "farmer_payments";
  if (pathname.startsWith("/admin/procurement/history")) return "procurement_history";
  if (pathname.startsWith("/admin/procurement")) return "purchase_orders";
  if (pathname.startsWith("/admin/reports")) return "reports";
  if (
    pathname.startsWith("/admin/settings") ||
    pathname.startsWith("/admin/staff") ||
    pathname.startsWith("/admin/cleanup") ||
    pathname.startsWith("/admin/audit") ||
    pathname.startsWith("/admin/security") ||
    pathname.startsWith("/admin/hours")
  ) {
    return "settings";
  }
  return null;
}

export function firstAllowedAdminPath(role?: string | null): string {
  const mods = modulesForRole(role);
  for (const section of ADMIN_NAV_SECTIONS) {
    for (const item of section.items) {
      if (item.future) continue;
      if (mods.includes(item.module)) return item.href;
    }
  }
  return "/admin";
}

export function navSectionsForRole(role?: string | null): AdminNavSection[] {
  const mods = new Set(modulesForRole(role));
  const isSuper = role === "SUPER_ADMIN";
  return ADMIN_NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => {
      if (!mods.has(item.module)) return false;
      if (item.superOnly && !isSuper) return false;
      return true;
    }),
  })).filter((section) => section.items.length > 0);
}

export function adminRoleLabel(role?: string | null): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "Super Admin";
    case "ADMIN":
    case "MANAGER":
      return "Manager";
    case "INVENTORY":
    case "WAREHOUSE":
      return "Inventory Officer";
    case "SUPPORT":
      return "Customer Support";
    case "PROCUREMENT":
      return "Procurement Officer";
    case "FINANCE":
      return "Finance Officer";
    case "DELIVERY":
      return "Delivery";
    default:
      return role || "Staff";
  }
}

/** Category card emoji defaults by slug (admin can still rename categories). */
export const CATEGORY_EMOJI: Record<string, string> = {
  "fresh-fruits": "🍎",
  fruits: "🍎",
  "fresh-vegetables": "🥬",
  vegetables: "🥬",
  "fresh-juices": "🥤",
  juices: "🥤",
  "fruit-salads": "🥗",
  salads: "🥗",
  "fruit-seedlings": "🌱",
  seedlings: "🌱",
  "ornamental-plants": "🪴",
  ornamental: "🪴",
};
