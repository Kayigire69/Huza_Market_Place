import type { ComponentType } from "react";
import {
  LayoutDashboard,
  LandPlot,
  Sprout,
  ShoppingBasket,
  Wallet,
  BarChart3,
  Bell,
  UserRound,
  Package,
  BookOpen,
} from "lucide-react";

export type FarmerModule =
  | "dashboard"
  | "my_farm"
  | "crops"
  | "produce"
  | "sell"
  | "sales"
  | "grow"
  | "agronomy"
  | "training"
  | "reports"
  | "messages"
  | "notifications"
  | "settings"
  | "products"
  | "submit"
  | "approvals"
  | "orders"
  | "payments"
  | "support"
  | "agronomist"
  | "profile";

export type FarmerNavItem = {
  module: FarmerModule;
  href: string;
  /** i18n key. Translated in FarmerWorkspaceShell via t() */
  labelKey: string;
  exact?: boolean;
  upcoming?: boolean;
  mobile?: boolean;
  /** Hide from nav until the farm account is APPROVED */
  requiresApproved?: boolean;
  icon: ComponentType<{ className?: string }>;
};

export type FarmerNavSection = {
  id: string;
  labelKey: string;
  tone: "selling" | "support" | "account";
  items: FarmerNavItem[];
};

export const FARMER_NAV_SECTIONS: FarmerNavSection[] = [
  {
    id: "overview",
    labelKey: "navHome",
    tone: "selling",
    items: [
      {
        module: "dashboard",
        href: "/farmer/dashboard",
        labelKey: "navDashboard",
        exact: true,
        mobile: true,
        icon: LayoutDashboard,
      },
      {
        module: "my_farm",
        href: "/farmer/my-farm",
        labelKey: "navMyFarm",
        mobile: true,
        icon: LandPlot,
      },
      {
        module: "crops",
        href: "/farmer/crops",
        labelKey: "navMyCrops",
        mobile: true,
        icon: Sprout,
      },
    ],
  },
  {
    id: "selling",
    labelKey: "navSellSection",
    tone: "selling",
    items: [
      {
        module: "sell",
        href: "/farmer/sell",
        labelKey: "navSellToHuza",
        mobile: true,
        requiresApproved: true,
        icon: ShoppingBasket,
      },
      {
        module: "produce",
        href: "/farmer/produce",
        labelKey: "navMyProduce",
        requiresApproved: true,
        icon: Package,
      },
      {
        module: "sales",
        href: "/farmer/sales",
        labelKey: "navPaymentsOrders",
        requiresApproved: true,
        icon: Wallet,
      },
    ],
  },
  {
    id: "grow",
    labelKey: "navGrowSection",
    tone: "support",
    items: [
      {
        module: "agronomy",
        href: "/farmer/agronomy",
        labelKey: "navAgronomy",
        mobile: true,
        icon: Sprout,
      },
      {
        module: "training",
        href: "/farmer/training",
        labelKey: "navTraining",
        icon: BookOpen,
      },
    ],
  },
  {
    id: "insights",
    labelKey: "navInsights",
    tone: "support",
    items: [
      {
        module: "reports",
        href: "/farmer/reports",
        labelKey: "navReports",
        requiresApproved: true,
        icon: BarChart3,
      },
    ],
  },
  {
    id: "account",
    labelKey: "navAccountSection",
    tone: "account",
    items: [
      {
        module: "notifications",
        href: "/farmer/notifications",
        labelKey: "navNotifications",
        icon: Bell,
      },
      {
        module: "settings",
        href: "/farmer/settings",
        labelKey: "navAccount",
        icon: UserRound,
      },
    ],
  },
];

/** Nav filtered for pending/rejected accounts (sell locked until APPROVED). */
export function farmerNavForAccount(accountApproved: boolean): FarmerNavSection[] {
  return FARMER_NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => accountApproved || !item.requiresApproved),
  })).filter((section) => section.items.length > 0);
}

export function farmerMobileQuickLinks(accountApproved = true): FarmerNavItem[] {
  return farmerNavForAccount(accountApproved)
    .flatMap((s) => s.items)
    .filter((i) => i.mobile);
}

export function isFarmerNavActive(pathname: string, item: FarmerNavItem): boolean {
  if (item.exact) return pathname === item.href;

  if (item.module === "crops") {
    return pathname.startsWith("/farmer/crops");
  }
  if (item.module === "sell") {
    return pathname === "/farmer/sell" || pathname.startsWith("/farmer/sell/");
  }
  if (item.module === "agronomy") {
    return (
      pathname.startsWith("/farmer/agronomy") ||
      pathname.startsWith("/farmer/agronomist") ||
      pathname.startsWith("/farmer/grow-better")
    );
  }
  if (item.module === "produce") {
    return (
      pathname.startsWith("/farmer/produce") ||
      pathname.startsWith("/farmer/products") ||
      pathname.startsWith("/farmer/approvals")
    );
  }
  if (item.module === "sales") {
    return (
      pathname.startsWith("/farmer/sales") ||
      pathname.startsWith("/farmer/orders") ||
      pathname.startsWith("/farmer/payments")
    );
  }
  if (item.module === "training") {
    return pathname.startsWith("/farmer/training") || pathname.startsWith("/farmer/support");
  }
  if (item.module === "notifications") {
    return (
      pathname.startsWith("/farmer/notifications") || pathname.startsWith("/farmer/messages")
    );
  }
  if (item.module === "settings") {
    return pathname.startsWith("/farmer/settings") || pathname.startsWith("/farmer/profile");
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
