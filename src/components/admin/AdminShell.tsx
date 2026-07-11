"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";

type NavItem = {
  href: string;
  label: string;
  exact?: boolean;
  superOnly?: boolean;
  icon: string;
};

type NavGroup = { title: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Operations",
    items: [
      { href: "/admin", label: "Dashboard", exact: true, icon: "dashboard" },
      { href: "/admin/orders", label: "Orders", icon: "orders" },
      { href: "/admin/delivery", label: "Delivery", icon: "delivery" },
      { href: "/admin/customers", label: "Customers", icon: "customers" },
    ],
  },
  {
    title: "Catalog",
    items: [
      { href: "/admin/products", label: "Products", icon: "products" },
      { href: "/admin/inventory", label: "Inventory", icon: "inventory" },
      { href: "/admin/offers", label: "Offers", icon: "offers" },
    ],
  },
  {
    title: "Sourcing",
    items: [
      { href: "/admin/suppliers", label: "Farmers", icon: "farmers" },
      { href: "/admin/procurement", label: "Procurement", icon: "procurement" },
    ],
  },
  {
    title: "Finance",
    items: [
      { href: "/admin/payments", label: "Payments", icon: "payments" },
      { href: "/admin/reports", label: "Reports", icon: "reports" },
    ],
  },
  {
    title: "System",
    items: [
      { href: "/admin/staff", label: "Employee management", superOnly: true, icon: "staff" },
      { href: "/admin/audit", label: "Audit logs", superOnly: true, icon: "audit" },
      { href: "/admin/settings", label: "System settings", superOnly: true, icon: "settings" },
      { href: "/admin/security", label: "Security (2FA)", superOnly: true, icon: "security" },
    ],
  },
];

type LiveCounts = {
  pendingPayment: number;
  paidReady: number;
  lowStock: number;
  pendingSuppliers: number;
};

function NavIcon({ name }: { name: string }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (name) {
    case "dashboard":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="9" rx="1.5" />
          <rect x="14" y="3" width="7" height="5" rx="1.5" />
          <rect x="14" y="12" width="7" height="9" rx="1.5" />
          <rect x="3" y="16" width="7" height="5" rx="1.5" />
        </svg>
      );
    case "orders":
      return (
        <svg {...common}>
          <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
        </svg>
      );
    case "delivery":
      return (
        <svg {...common}>
          <path d="M3 7h11v10H3zM14 10h4l3 3v4h-7" />
          <circle cx="7" cy="19" r="1.5" />
          <circle cx="17.5" cy="19" r="1.5" />
        </svg>
      );
    case "customers":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3.5" />
          <path d="M2.5 19a6.5 6.5 0 0 1 13 0" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M16 19a5 5 0 0 1 5.5-4.8" />
        </svg>
      );
    case "products":
      return (
        <svg {...common}>
          <path d="M12 3 4 7v10l8 4 8-4V7l-8-4Z" />
          <path d="M12 12 4 7M12 12l8-5M12 12v10" />
        </svg>
      );
    case "inventory":
      return (
        <svg {...common}>
          <path d="M4 7h16v12H4zM4 7l2-3h12l2 3M9 12h6" />
        </svg>
      );
    case "offers":
      return (
        <svg {...common}>
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
          <circle cx="12" cy="12" r="3.5" />
        </svg>
      );
    case "farmers":
      return (
        <svg {...common}>
          <path d="M12 21c-4-3.5-7-7-7-10.5a7 7 0 0 1 14 0C19 14 16 17.5 12 21Z" />
          <circle cx="12" cy="10.5" r="2.2" />
        </svg>
      );
    case "procurement":
      return (
        <svg {...common}>
          <path d="M4 6h16l-1.5 11H5.5L4 6Z" />
          <path d="M9 10v4M15 10v4M8 6l1-3h6l1 3" />
        </svg>
      );
    case "payments":
      return (
        <svg {...common}>
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path d="M3 10h18M7 15h4" />
        </svg>
      );
    case "reports":
      return (
        <svg {...common}>
          <path d="M4 19V5M4 19h16M8 15v-4M12 15V8M16 15v-6" />
        </svg>
      );
    case "staff":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 19a7 7 0 0 1 14 0" />
        </svg>
      );
    case "audit":
      return (
        <svg {...common}>
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
          <path d="M14 3v5h5M9 13h6M9 17h4" />
        </svg>
      );
    case "settings":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.6.9 1 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
        </svg>
      );
    case "security":
      return (
        <svg {...common}>
          <path d="M12 3 5 6v6c0 4.2 2.8 7.4 7 8.5 4.2-1.1 7-4.3 7-8.5V6l-7-3Z" />
          <path d="M9.5 12.5 11 14l3.5-3.5" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}

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
  const initials = useMemo(() => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "YH";
    return parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() || "")
      .join("");
  }, [name]);

  const groups = useMemo(
    () =>
      NAV_GROUPS.map((g) => ({
        ...g,
        items: g.items.filter((item) => !item.superOnly || isSuper),
      })).filter((g) => g.items.length > 0),
    [isSuper]
  );

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="admin-shell flex min-h-screen text-[var(--huza-ink)]">
      {/* Mobile overlay */}
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-[rgba(10,40,24,0.45)] backdrop-blur-[2px] lg:hidden"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`admin-sidebar fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col transition-transform duration-300 lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="admin-sidebar-brand flex items-center gap-3 px-5 py-5">
          <Image
            src="/logo.svg"
            alt="Youth Huza"
            width={42}
            height={42}
            className="rounded-full ring-2 ring-white/25 shadow-sm"
          />
          <div className="min-w-0 leading-tight">
            <p className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-white">
              HUZA Admin
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-100/80">
              Youth Huza ops
            </p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4 pt-1">
          {groups.map((group) => (
            <div key={group.title} className="mb-4">
              <p className="admin-nav-group">{group.title}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.href, item.exact);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`admin-nav-link ${active ? "is-active" : ""}`}
                    >
                      <span className="admin-nav-icon">
                        <NavIcon name={item.icon} />
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="admin-sidebar-footer mx-3 mb-4 rounded-2xl px-3.5 py-3">
          <p className="text-xs font-bold tracking-wide text-emerald-50">HUZA Admin Portal</p>
          <p className="mt-1 text-[11px] leading-relaxed text-emerald-100/70">
            © {new Date().getFullYear()} Youth Huza. All rights reserved.
          </p>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="admin-topbar sticky top-0 z-30">
          <div className="flex items-center gap-3 px-4 py-3 lg:px-6">
            <button
              type="button"
              className="admin-icon-btn lg:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              </svg>
            </button>

            <form
              className="hidden min-w-0 flex-1 md:block md:max-w-md"
              onSubmit={(e) => {
                e.preventDefault();
                if (!query.trim()) return;
                window.location.href = `/admin/orders?q=${encodeURIComponent(query.trim())}`;
              }}
            >
              <label className="admin-search">
                <svg
                  className="admin-search-icon"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" strokeLinecap="round" />
                </svg>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search orders, customers…"
                  className="admin-search-input"
                />
              </label>
            </form>

            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              {counts && (
                <div className="hidden items-center gap-2 xl:flex">
                  <span className="admin-chip admin-chip-amber">
                    <span className="admin-chip-dot" />
                    {counts.pendingPayment} pending pay
                  </span>
                  <span className="admin-chip admin-chip-green">
                    <span className="admin-chip-dot" />
                    {counts.paidReady} ready
                  </span>
                  <span className="admin-chip admin-chip-rose">
                    <span className="admin-chip-dot" />
                    {counts.lowStock} low stock
                  </span>
                </div>
              )}

              <div className="relative">
                <button
                  type="button"
                  className="admin-icon-btn relative px-3"
                  onClick={() => setBellOpen((v) => !v)}
                  aria-label="Notifications"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M6 9a6 6 0 1 1 12 0c0 7 3 7 3 7H3s3 0 3-7" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M10 19a2 2 0 0 0 4 0" strokeLinecap="round" />
                  </svg>
                  <span className="ml-1.5 text-sm font-semibold">Alerts</span>
                  {unread > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--huza-green)] px-1 text-[10px] font-bold text-white">
                      {Math.min(unread, 9)}
                    </span>
                  )}
                </button>
                {bellOpen && (
                  <div className="admin-popover absolute right-0 mt-2 w-80 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--huza-muted)]">
                      Live notifications
                    </p>
                    <div className="max-h-72 space-y-2 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-sm text-[var(--huza-muted)]">No alerts yet.</p>
                      ) : (
                        notifications.map((n) => (
                          <div key={n.id} className="rounded-xl bg-[var(--huza-cream)] p-2.5 text-sm">
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

              <div className="hidden items-center gap-2.5 border-l border-[var(--huza-line)] pl-3 sm:flex">
                <div className="admin-avatar" aria-hidden>
                  {initials}
                </div>
                <div className="text-right leading-tight">
                  <p className="text-sm font-semibold">{name}</p>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--huza-muted)]">
                    {roleLabel}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/auth/login" })}
                className="admin-logout-btn"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="admin-main flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
