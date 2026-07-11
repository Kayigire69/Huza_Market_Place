"use client";

import { SessionProvider } from "next-auth/react";
import { LocaleProvider } from "@/lib/locale-context";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SupportChat } from "@/components/SupportChat";
import { CartHydrator } from "@/components/CartHydrator";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LocaleProvider>
        <CartHydrator />
        <Header />
        <main className="min-h-[70vh]">{children}</main>
        <Footer />
        <SupportChat />
      </LocaleProvider>
    </SessionProvider>
  );
}

