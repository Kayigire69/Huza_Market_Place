"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Prefetch key routes during idle time so first clicks open faster.
 * Renders nothing — no UI change.
 */
export function RoutePrefetcher({ routes }: { routes: string[] }) {
  const router = useRouter();

  useEffect(() => {
    if (!routes.length) return;
    let cancelled = false;

    const run = () => {
      if (cancelled) return;
      for (const href of routes) {
        try {
          router.prefetch(href);
        } catch {
          /* ignore prefetch failures */
        }
      }
    };

    const ric = window.requestIdleCallback?.bind(window);
    if (ric) {
      const id = ric(run, { timeout: 1500 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback?.(id);
      };
    }

    const t = window.setTimeout(run, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [router, routes]);

  return null;
}

export const STOREFRONT_PREFETCH = [
  "/",
  "/products",
  "/categories",
  "/cart",
  "/checkout",
  "/track",
  "/support",
  "/about",
  "/wishlist",
  "/account",
  "/delivery-info",
];

export const ADMIN_PREFETCH = [
  "/admin",
  "/admin/orders",
  "/admin/products",
  "/admin/inventory",
  "/admin/delivery",
  "/admin/customers",
  "/admin/suppliers",
  "/admin/procurement",
  "/admin/payments",
  "/admin/offers",
  "/admin/reports",
  "/admin/staff",
  "/admin/audit",
  "/admin/settings",
  "/admin/security",
];

export const FARMER_PREFETCH = ["/farmer", "/farmer/register", "/auth/login"];
