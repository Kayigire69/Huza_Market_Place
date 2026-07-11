"use client";

import { SessionProvider } from "next-auth/react";
import { usePathname } from "next/navigation";
import { LocaleProvider } from "@/lib/locale-context";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SupportChat } from "@/components/SupportChat";
import { CartHydrator } from "@/components/CartHydrator";

/** Customer shop chrome — never shown on private partner portals */
function isPartnerPortal(pathname: string | null) {
  if (!pathname) return false;
  return (
    pathname === "/farmer" ||
    pathname.startsWith("/farmer/") ||
    pathname === "/supplier" ||
    pathname.startsWith("/supplier/")
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const partner = isPartnerPortal(pathname);

  return (
    <SessionProvider>
      <LocaleProvider>
        {!partner && <CartHydrator />}
        {!partner && <Header />}
        <main className={partner ? "min-h-screen" : "min-h-[70vh]"}>{children}</main>
        {!partner && <Footer />}
        {!partner && <SupportChat />}
      </LocaleProvider>
    </SessionProvider>
  );
}
