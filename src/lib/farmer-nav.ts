import type { ComponentType } from "react";
import {
  LayoutDashboard,
  Package,
  Upload,
  ClipboardCheck,
  ClipboardList,
  Wallet,
  BookOpen,
  Sprout,
  Bell,
  UserRound,
} from "lucide-react";

export type FarmerModule =
  | "dashboard"
  | "products"
  | "submit"
  | "approvals"
  | "orders"
  | "payments"
  | "support"
  | "agronomist"
  | "notifications"
  | "profile";

export type FarmerNavItem = {
  module: FarmerModule;
  href: string;
  label: string;
  exact?: boolean;
  /** Soft-disabled until its phase ships */
  upcoming?: boolean;
  icon: ComponentType<{ className?: string }>;
};

export type FarmerNavSection = {
  id: string;
  label: string;
  /** Primary selling workflow vs secondary support */
  tone: "selling" | "support" | "account";
  items: FarmerNavItem[];
};

/**
 * Final Farmers Portal IA.
 * Selling workflow stays at the center; support features are secondary.
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
        icon: LayoutDashboard,
      },
    ],
  },
  {
    id: "selling",
    label: "Sell to HUZA",
    tone: "selling",
    items: [
      { module: "products", href: "/farmer/products", label: "My Crop Supply", icon: Package },
      {
        module: "submit",
        href: "/farmer/products/submit",
        label: "Submit Crop",
        icon: Upload,
      },
      {
        module: "approvals",
        href: "/farmer/approvals",
        label: "Approval Status",
        icon: ClipboardCheck,
      },
      {
        module: "orders",
        href: "/farmer/orders",
        label: "Purchase Orders",
        icon: ClipboardList,
      },
      { module: "payments", href: "/farmer/payments", label: "Payments", icon: Wallet },
    ],
  },
  {
    id: "grow",
    label: "Grow better",
    tone: "support",
    items: [
      {
        module: "support",
        href: "/farmer/support",
        label: "Farmer Support",
        icon: BookOpen,
      },
      {
        module: "agronomist",
        href: "/farmer/agronomist",
        label: "Ask an Agronomist",
        icon: Sprout,
      },
    ],
  },
  {
    id: "account",
    label: "Account",
    tone: "account",
    items: [
      {
        module: "notifications",
        href: "/farmer/notifications",
        label: "Notifications",
        icon: Bell,
      },
      { module: "profile", href: "/farmer/profile", label: "My Profile", icon: UserRound },
    ],
  },
];

export function isFarmerNavActive(pathname: string, item: FarmerNavItem): boolean {
  if (item.exact) return pathname === item.href;
  if (item.module === "products") {
    return pathname === "/farmer/products" || pathname === "/farmer/products/";
  }
  if (item.module === "submit") {
    return pathname.startsWith("/farmer/products/submit");
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
