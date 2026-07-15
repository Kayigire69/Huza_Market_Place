import { Inter } from "next/font/google";
/**
 * Admin portal shell — Phase 1 Layout (LOCKED).
 * Do not redesign sidebar/header/nav chrome unless explicitly asked.
 */
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";

const adminFont = Inter({
  subsets: ["latin"],
  variable: "--font-admin",
  display: "swap",
});

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  return (
    <div className={`${adminFont.variable} font-[family-name:var(--font-admin),system-ui,sans-serif]`}>
      <AdminShell adminName={session?.user?.name}>{children}</AdminShell>
    </div>
  );
}
