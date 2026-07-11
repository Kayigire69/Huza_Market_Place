"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/inventory", label: "Inventory" },
  { href: "/admin/delivery", label: "Delivery" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/suppliers", label: "Suppliers" },
  { href: "/admin/procurement", label: "Procurement" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/offers", label: "Offers" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/staff", label: "Employee management", superOnly: true },
  { href: "/admin/audit", label: "Audit logs", superOnly: true },
  { href: "/admin/settings", label: "System settings", superOnly: true },
  { href: "/admin/security", label: "Security (2FA)", superOnly: true },
];

type LiveCounts = {
  pendingPayment: number;
  paidReady: number;
  lowStock: number;
  pendingSuppliers: number;
};

export function AdminShell({
  children,
  adminName,
}: {
  children: React.ReactNode;
  adminName?: string | null;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;
  const isSuper = role === "SUPER_ADMIN";
  const navItems = NAV.filter((item) => !item.superOnly || isSuper);
  const [open, setOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [notifications, setNotifications] = useState<
    { id: string; title: string; body: string; createdAt: string }[]
  >([]);
  const [counts, setCounts] = useState<LiveCounts | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/admin/live");
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setNotifications(data.notifications || []);
        setCounts(data.counts || null);
      } catch {
        /* ignore transient poll errors */
      }
    };
    load();
    const id = setInterval(load, 15_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const name = adminName || session?.user?.name || "Admin";
  const roleLabel = isSuper ? "Super Admin" : "Administrator";
  const unread = notifications.length;

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="admin-shell min-h-screen bg-[#f4f7f5] text-[var(--huza-ink)]">
      <header className="sticky top-0 z-40 border-b border-[var(--huza-line)] bg-white/95 backdrop-blur">
        <div className="flex items-center gap-3 px-4 py-3 lg:px-6">
          <button
            type="button"
            className="rounded-lg border border-[var(--huza-line)] px-2 py-1 text-sm lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            Menu
          </button>
          <Link href="/admin" className="flex items-center gap-2 shrink-0">
            <Image src="/logo.svg" alt="Youth Huza" width={36} height={36} className="rounded-full" />
            <div className="leading-tight">
              <p className="font-[family-name:var(--font-display)] text-base font-bold text-[var(--huza-green-dark)]">
                HUZA Admin
              </p>
              <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--huza-muted)]">
                Youth Huza ops
              </p>
            </div>
          </Link>

          <form
            className="hidden md:flex flex-1 max-w-md mx-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!query.trim()) return;
              window.location.href = `/admin/orders?q=${encodeURIComponent(query.trim())}`;
            }}
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search orders, customers…"
              className="w-full rounded-xl border border-[var(--huza-line)] bg-[#f8fbf9] px-3 py-2 text-sm"
            />
          </form>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            {counts && (
              <div className="hidden xl:flex items-center gap-2 text-xs text-[var(--huza-muted)]">
                <span className="rounded-full bg-amber-50 px-2 py-1 text-amber-800">
                  {counts.pendingPayment} pending pay
                </span>
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-800">
                  {counts.paidReady} ready
                </span>
                <span className="rounded-full bg-orange-50 px-2 py-1 text-orange-800">
                  {counts.lowStock} low stock
                </span>
              </div>
            )}

            <div className="relative">
              <button
                type="button"
                className="relative rounded-full border border-[var(--huza-line)] px-3 py-1.5 text-sm"
                onClick={() => setBellOpen((v) => !v)}
                aria-label="Notifications"
              >
                Alerts
                {unread > 0 && (
                  <span className="absolute -right-1 -top-1 rounded-full bg-[var(--huza-green)] px-1.5 text-[10px] font-bold text-white">
                    {Math.min(unread, 9)}
                  </span>
                )}
              </button>
              {bellOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-[var(--huza-line)] bg-white p-3 shadow-lg">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--huza-muted)]">
                    Live notifications
                  </p>
                  <div className="max-h-72 space-y-2 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-sm text-[var(--huza-muted)]">No alerts yet.</p>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="rounded-xl bg-[#f8fbf9] p-2 text-sm">
                          <p className="font-medium">{n.title}</p>
                          <p className="text-[var(--huza-muted)]">{n.body}</p>
                          <p className="mt-1 text-[10px] text-[var(--huza-muted)]">
                            {new Date(n.createdAt).toLocaleString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold">{name}</p>
              <p className="text-[10px] text-[var(--huza-muted)]">{roleLabel}</p>
            </div>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/auth/login" })}
              className="rounded-lg border border-[var(--huza-line)] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--huza-mint)]"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1400px]">
        <aside
          className={`${
            open ? "translate-x-0" : "-translate-x-full"
          } fixed inset-y-0 left-0 z-30 w-64 border-r border-[var(--huza-line)] bg-white pt-16 transition lg:static lg:translate-x-0 lg:pt-0`}
        >
          <nav className="flex h-full flex-col gap-1 p-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive(item.href, item.exact)
                    ? "bg-[var(--huza-green)] text-white"
                    : "text-[var(--huza-ink)] hover:bg-[var(--huza-mint)]"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-auto border-t border-[var(--huza-line)] pt-4 text-xs text-[var(--huza-muted)]">
              <p>HUZA Admin Portal</p>
              <p>Version 1.0 · © {new Date().getFullYear()} Youth Huza</p>
            </div>
          </nav>
        </aside>
        {open && (
          <button
            type="button"
            className="fixed inset-0 z-20 bg-black/30 lg:hidden"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
        )}

        <main className="min-h-[calc(100vh-64px)] flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
