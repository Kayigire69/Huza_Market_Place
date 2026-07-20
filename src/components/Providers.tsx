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

/** Customer shop chrome. Never shown on private partner / staff portals */
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

function isCheckout(pathname: string | null) {
  if (!pathname) return false;
  return pathname === "/checkout" || pathname.startsWith("/checkout/");
}

function hideMobileNav(pathname: string | null) {
  return isCheckout(pathname);
}

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const partner = isPartnerPortal(pathname);
  const checkout = isCheckout(pathname);
  const noMobileNav = hideMobileNav(pathname);
  const storefrontChrome = !partner && !checkout;
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const prefetchRoutes = useMemo(() => {
    if (pathname?.startsWith("/admin")) return ADMIN_PREFETCH;
    if (pathname === "/farmer" || pathname?.startsWith("/farmer/")) return FARMER_PREFETCH;
    if (partner) return [] as string[];
    return STOREFRONT_PREFETCH;
  }, [pathname, partner]);

  useEffect(() => {
    if (!storefrontChrome) return;
    fetch("/api/public/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.whatsapp_url) setWhatsappUrl(data.whatsapp_url);
      })
      .catch(() => undefined);
  }, [storefrontChrome]);

  return (
    <SessionProvider
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
      refetchInterval={0}
    >
      <LocaleProvider>
        <RoutePrefetcher routes={prefetchRoutes} />
        {!partner && <CartHydrator />}
        {storefrontChrome && <Header />}
        <main
          id="main-content"
          className={
            partner || checkout
              ? "min-h-screen"
              : noMobileNav
                ? "min-h-[70vh]"
                : "min-h-[70vh] pb-20 md:pb-0"
          }
        >
          {children}
        </main>
        {storefrontChrome && <Footer />}
        {storefrontChrome && !noMobileNav && <MobileBottomNav />}
        {storefrontChrome && whatsappUrl ? <WhatsAppFab href={whatsappUrl} /> : null}
        <ToastHost />
      </LocaleProvider>
    </SessionProvider>
  );
}
