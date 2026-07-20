import type { Metadata } from "next";
import { Bricolage_Grotesque, Manrope } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
});

const body = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  process.env.NEXTAUTH_URL?.replace(/\/$/, "") ||
  "https://www.youthhuza.rw";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "HUZA FRESH | Powered by Youth Huza",
    template: "%s | HUZA FRESH",
  },
  description:
    "Youth Huza buys from farms and sells fresh food on HUZA FRESH. Sold and delivered by us across Rwanda.",
  applicationName: "HUZA FRESH",
  keywords: [
    "HUZA FRESH",
    "Youth Huza",
    "fresh produce Rwanda",
    "Kigali delivery",
    "fruits vegetables",
    "MoMo",
  ],
  authors: [{ name: "Youth Huza" }],
  openGraph: {
    type: "website",
    locale: "en_RW",
    url: siteUrl,
    siteName: "HUZA FRESH",
    title: "HUZA FRESH | Powered by Youth Huza",
    description:
      "Fresh produce sold and delivered by Youth Huza across Kigali, Kamonyi, and Bugesera.",
    images: [{ url: "/youth-huza-emblem.png", alt: "HUZA FRESH" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "HUZA FRESH | Powered by Youth Huza",
    description:
      "Fresh produce sold and delivered by Youth Huza across Kigali, Kamonyi, and Bugesera.",
    images: ["/youth-huza-emblem.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: { icon: "/youth-huza-emblem.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} antialiased`}>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
