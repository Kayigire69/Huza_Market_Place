import type { ComponentType } from "react";
import {
  LayoutDashboard,
  LandPlot,
  Sprout,
  ShoppingBasket,
  Leaf,
  Wallet,
  BarChart3,
  MessageSquare,
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
  /** i18n key — translated in FarmerWorkspaceShell via t() */
  labelKey: string;
  exact?: boolean;
  upcoming?: boolean;
  mobile?: boolean;
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
        icon: ShoppingBasket,
      },
      {
        module: "produce",
        href: "/farmer/produce",
        labelKey: "navMyProduce",
        icon: Package,
      },
      {
        module: "sales",
        href: "/farmer/sales",
        labelKey: "navPaymentsOrders",
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
        module: "grow",
        href: "/farmer/grow-better",
        labelKey: "navGrowBetter",
        mobile: true,
        icon: Leaf,
      },
      {
        module: "agronomy",
        href: "/farmer/agronomy",
        labelKey: "navAgronomy",
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
        module: "messages",
        href: "/farmer/messages",
        labelKey: "navMessages",
        icon: MessageSquare,
      },
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

export function farmerMobileQuickLinks(): FarmerNavItem[] {
  return FARMER_NAV_SECTIONS.flatMap((s) => s.items).filter((i) => i.mobile);
}

export function isFarmerNavActive(pathname: string, item: FarmerNavItem): boolean {
  if (item.exact) return pathname === item.href;

  if (item.module === "crops") {
    return pathname.startsWith("/farmer/crops");
  }
  if (item.module === "sell") {
    return pathname === "/farmer/sell" || pathname.startsWith("/farmer/sell/");
  }
  if (item.module === "grow") {
    return (
      pathname.startsWith("/farmer/grow-better") ||
      pathname.startsWith("/farmer/agronomy") ||
      pathname.startsWith("/farmer/training") ||
      pathname.startsWith("/farmer/support")
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
  if (item.module === "agronomy") {
    return pathname.startsWith("/farmer/agronomy") || pathname.startsWith("/farmer/agronomist");
  }
  if (item.module === "training") {
    return pathname.startsWith("/farmer/training") || pathname.startsWith("/farmer/support");
  }
  if (item.module === "settings") {
    return pathname.startsWith("/farmer/settings") || pathname.startsWith("/farmer/profile");
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
