"use client";

import { SessionProvider } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { LocaleProvider } from "@/lib/locale-context";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { CartHydrator } from "@/components/CartHydrator";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { ToastHost } from "@/components/ui/Toast";
import {
  RoutePrefetcher,
  STOREFRONT_PREFETCH,
  ADMIN_PREFETCH,
  FARMER_PREFETCH,
} from "@/components/navigation/RoutePrefetcher";

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

function hideMobileNav(pathname: string | null) {
  if (!pathname) return false;
  return pathname === "/checkout" || pathname.startsWith("/checkout/");
}

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const partner = isPartnerPortal(pathname);
  const noMobileNav = hideMobileNav(pathname);
  const [whatsappUrl, setWhatsappUrl] = useState("https://wa.me/250788000000");
  const prefetchRoutes = useMemo(() => {
    if (pathname?.startsWith("/admin")) return ADMIN_PREFETCH;
    if (pathname === "/farmer" || pathname?.startsWith("/farmer/")) return FARMER_PREFETCH;
    if (partner) return [] as string[];
    return STOREFRONT_PREFETCH;
  }, [pathname, partner]);

  useEffect(() => {
    if (partner) return;
    fetch("/api/public/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.whatsapp_url) setWhatsappUrl(data.whatsapp_url);
      })
      .catch(() => undefined);
  }, [partner]);

  return (
    <SessionProvider
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
      refetchInterval={0}
    >
      <LocaleProvider>
        <RoutePrefetcher routes={prefetchRoutes} />
        {!partner && <CartHydrator />}
        {!partner && <Header />}
        <main
          className={
            partner ? "min-h-screen" : noMobileNav ? "min-h-[70vh]" : "min-h-[70vh] pb-20 md:pb-0"
          }
        >
          {children}
        </main>
        {!partner && <Footer />}
        {!partner && !noMobileNav && <MobileBottomNav />}
        {!partner && <WhatsAppFab href={whatsappUrl} />}
        {!partner && <ToastHost />}
      </LocaleProvider>
    </SessionProvider>
  );
}
