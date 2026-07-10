"use client";

import { SessionProvider } from "next-auth/react";
import { LocaleProvider } from "@/lib/locale-context";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LocaleProvider>
        <Header />
        <main className="min-h-[70vh]">{children}</main>
        <Footer />
      </LocaleProvider>
    </SessionProvider>
  );
}
