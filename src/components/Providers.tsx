"use client";

import { SessionProvider } from "next-auth/react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { LocaleProvider } from "@/lib/locale-context";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartHydrator } from "@/components/CartHydrator";
import {
  RoutePrefetcher,
  STOREFRONT_PREFETCH,
  ADMIN_PREFETCH,
  FARMER_PREFETCH,
} from "@/components/navigation/RoutePrefetcher";

const SupportChat = dynamic(
  () => import("@/components/SupportChat").then((m) => m.SupportChat),
  { ssr: false }
);

/** Customer shop chrome — never shown on private partner / staff portals */
function isPartnerPortal(pathname: string | null) {
  if (!pathname) return false;
  return (
    pathname === "/farmer" ||
    pathname.startsWith("/farmer/") ||
    pathname === "/supplier" ||
    pathname.startsWith("/supplier/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/warehouse" ||
    pathname.startsWith("/warehouse/") ||
    pathname === "/procurement" ||
    pathname.startsWith("/procurement/") ||
    pathname === "/delivery-portal" ||
    pathname.startsWith("/delivery-portal/")
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const partner = isPartnerPortal(pathname);
  const prefetchRoutes = useMemo(() => {
    if (pathname?.startsWith("/admin")) return ADMIN_PREFETCH;
    if (pathname === "/farmer" || pathname?.startsWith("/farmer/")) return FARMER_PREFETCH;
    if (partner) return [] as string[];
    return STOREFRONT_PREFETCH;
  }, [pathname, partner]);

  return (
    <SessionProvider refetchOnWindowFocus={false} refetchWhenOffline={false}>
      <LocaleProvider>
        <RoutePrefetcher routes={prefetchRoutes} />
        {!partner && <CartHydrator />}
        {!partner && <Header />}
        <main className={partner ? "min-h-screen" : "min-h-[70vh]"}>{children}</main>
        {!partner && <Footer />}
        {!partner && <SupportChat />}
      </LocaleProvider>
    </SessionProvider>
  );
}
