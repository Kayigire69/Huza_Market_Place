import type { ComponentType } from "react";
import {
  LayoutDashboard,
  LandPlot,
  Package,
  Wallet,
  Sprout,
  BookOpen,
  BarChart3,
  MessageSquare,
  Bell,
  Settings,
} from "lucide-react";

export type FarmerModule =
  | "dashboard"
  | "my_farm"
  | "produce"
  | "sales"
  | "agronomy"
  | "training"
  | "reports"
  | "messages"
  | "notifications"
  | "settings"
  /** Legacy deep-link modules (kept for redirects / active state) */
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
  label: string;
  exact?: boolean;
  upcoming?: boolean;
  /** Show in mobile quick strip */
  mobile?: boolean;
  icon: ComponentType<{ className?: string }>;
};

export type FarmerNavSection = {
  id: string;
  label: string;
  tone: "selling" | "support" | "account";
  items: FarmerNavItem[];
};

/**
 * Final Farmers Portal IA (10 primary destinations).
 * Deep links under My Produce / Sales remain for Phase 3–5 workflows.
 */
export const FARMER_NAV_SECTIONS: FarmerNavSection[] = [
  {
    id: "overview",
    label: "Overview",
    tone: "selling",
    items: [
      {
        module: "dashboard",
        href: "/farmer/dashboard",
        label: "Dashboard",
        exact: true,
        mobile: true,
        icon: LayoutDashboard,
      },
      {
        module: "my_farm",
        href: "/farmer/my-farm",
        label: "My Farm",
        mobile: true,
        icon: LandPlot,
      },
    ],
  },
  {
    id: "selling",
    label: "Sell to HUZA",
    tone: "selling",
    items: [
      {
        module: "produce",
        href: "/farmer/produce",
        label: "My Produce",
        mobile: true,
        icon: Package,
      },
      {
        module: "sales",
        href: "/farmer/sales",
        label: "Sales",
        mobile: true,
        icon: Wallet,
      },
    ],
  },
  {
    id: "grow",
    label: "Grow better",
    tone: "support",
    items: [
      {
        module: "agronomy",
        href: "/farmer/agronomy",
        label: "Agronomy Support",
        icon: Sprout,
      },
      {
        module: "training",
        href: "/farmer/training",
        label: "Training & Advisory",
        icon: BookOpen,
      },
    ],
  },
  {
    id: "insights",
    label: "Insights",
    tone: "support",
    items: [
      {
        module: "reports",
        href: "/farmer/reports",
        label: "Reports",
        icon: BarChart3,
      },
    ],
  },
  {
    id: "account",
    label: "Account",
    tone: "account",
    items: [
      {
        module: "messages",
        href: "/farmer/messages",
        label: "Messages",
        icon: MessageSquare,
      },
      {
        module: "notifications",
        href: "/farmer/notifications",
        label: "Notifications",
        icon: Bell,
      },
      {
        module: "settings",
        href: "/farmer/settings",
        label: "Settings",
        icon: Settings,
      },
    ],
  },
];

export function farmerMobileQuickLinks(): FarmerNavItem[] {
  return FARMER_NAV_SECTIONS.flatMap((s) => s.items).filter((i) => i.mobile);
}

export function isFarmerNavActive(pathname: string, item: FarmerNavItem): boolean {
  if (item.exact) return pathname === item.href;

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
