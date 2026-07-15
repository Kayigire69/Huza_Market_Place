"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  ChevronDown,
  HelpCircle,
  LogOut,
  Menu,
  Moon,
  Search,
  Sun,
  X,
} from "lucide-react";
import { AdminCommandPalette } from "@/components/admin/AdminCommandPalette";
import {
  adminRoleLabel,
  navSectionsForRole,
  roleCanAccessModule,
  type AdminModule,
} from "@/lib/admin-nav";

type LiveCounts = {
  pendingPayment: number;
  paidReady: number;
  lowStock: number;
  pendingFarmers?: number;
  pendingSuppliers?: number;
  pendingDeliveries?: number;
  delayedOrders?: number;
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(true);
  const [notifications, setNotifications] = useState<
    { id: string; title: string; body: string; createdAt: string; type?: string; isRead?: boolean }[]
  >([]);
  const [counts, setCounts] = useState<LiveCounts | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("huza-admin-theme");
    if (saved === "dark") setDark(true);
    const col = localStorage.getItem("huza-admin-sidebar");
    if (col === "collapsed") setCollapsed(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("huza-admin-theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    localStorage.setItem("huza-admin-sidebar", collapsed ? "collapsed" : "expanded");
  }, [collapsed]);

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
        /* ignore */
      }
    };
    void load();
    const id = setInterval(load, 20_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const name = adminName || session?.user?.name || "Admin";
  const roleLabel = adminRoleLabel(role);
  const unread = notifications.filter((n) => !n.isRead).length;

  const markNotificationsRead = useCallback(async (ids?: string[]) => {
    try {
      await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ids?.length ? { ids } : { all: true }),
      });
      setNotifications((prev) =>
        prev.map((n) =>
          !ids?.length || ids.includes(n.id) ? { ...n, isRead: true } : n
        )
      );
    } catch {
      /* ignore */
    }
  }, []);

  const initials = useMemo(() => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "YH";
    return parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() || "")
      .join("");
  }, [name]);

  const sections = useMemo(() => navSectionsForRole(role), [role]);

  const isActive = useCallback(
    (href: string, exact?: boolean) => {
      if (exact) return pathname === href;
      return pathname === href || pathname.startsWith(`${href}/`);
    },
    [pathname]
  );

  const pageTitle = useMemo(() => {
    for (const section of sections) {
      const hit = section.items.find((n) => isActive(n.href, n.exact));
      if (hit) return hit.label;
    }
    return "Dashboard";
  }, [sections, isActive]);

  const canSee = useCallback(
    (mod: AdminModule) => roleCanAccessModule(role, mod),
    [role]
  );

  const alertItems = useMemo(() => {
    if (!counts) return [];
    const farmers = counts.pendingFarmers ?? counts.pendingSuppliers ?? 0;
    return [
      farmers > 0 &&
        canSee("farmers") && {
          tone: "red" as const,
          text: `${farmers} Farmers awaiting approval`,
          href: "/admin/suppliers",
        },
      (counts.delayedOrders || 0) > 0 &&
        canSee("orders") && {
          tone: "orange" as const,
          text: `${counts.delayedOrders} Orders delayed`,
          href: "/admin/orders",
        },
      counts.lowStock > 0 &&
        canSee("inventory") && {
          tone: "amber" as const,
          text: `${counts.lowStock} Products low in stock`,
          href: "/admin/inventory",
        },
      counts.pendingPayment > 0 &&
        canSee("payments") && {
          tone: "blue" as const,
          text: `${counts.pendingPayment} Pending payments`,
          href: "/admin/payments",
        },
    ].filter(Boolean) as { tone: "red" | "orange" | "amber" | "blue"; text: string; href: string }[];
  }, [counts, canSee]);

  const sidebarWidth = collapsed ? "w-[72px]" : "w-[250px]";

  return (
    <div className={`admin-shell ${dark ? "admin-shell--dark" : ""} flex min-h-screen`}>
      {drawerOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          aria-label="Close menu"
          onClick={() => setDrawerOpen(false)}
        />
      ) : null}

      <aside
        className={`admin-sidebar fixed inset-y-0 left-0 z-50 flex ${sidebarWidth} flex-col transition-[width,transform] duration-200 lg:static lg:translate-x-0 ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className={`admin-sidebar-brand flex items-center gap-3 ${collapsed ? "justify-center px-2 py-4" : "px-4 py-4"}`}>
          <Image
            src="/youth-huza-emblem.png"
            alt=""
            width={36}
            height={35}
            className="size-9 object-contain"
          />
          {!collapsed ? (
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-bold text-white">HUZA FRESH</p>
              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-emerald-100/70">
                Admin Portal
              </p>
            </div>
          ) : null}
        </div>

        {!collapsed ? (
          <p className="mx-4 mb-3 px-0.5 text-[10px] font-normal tracking-wide text-white/35">
            Authorized Personnel Only
          </p>
        ) : null}

        <nav className="flex-1 overflow-y-auto px-2 pb-4">
          {sections.map((section, sectionIdx) => (
            <div key={section.id}>
              {sectionIdx > 0 ? (
                <div
                  className={`my-2 ${collapsed ? "mx-2" : "mx-3"} border-t border-white/10`}
                  aria-hidden
                />
              ) : null}
              {section.label && !collapsed ? (
                <p className="mb-1 mt-1 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
                  {section.label}
                </p>
              ) : null}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.href, item.exact);
                  const Icon = item.icon;
                  if (item.future) {
                    return (
                      <span
                        key={item.href}
                        title={`${item.label} — coming soon`}
                        className={`admin-nav-link pointer-events-none opacity-45 ${collapsed ? "justify-center px-0" : ""}`}
                      >
                        <Icon className="size-[18px] shrink-0" />
                        {!collapsed ? (
                          <span className="flex min-w-0 items-center gap-1.5">
                            <span className="truncate">{item.label}</span>
                            <span className="rounded bg-white/10 px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white/50">
                              Future
                            </span>
                          </span>
                        ) : null}
                      </span>
                    );
                  }
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch
                      title={item.label}
                      onClick={() => setDrawerOpen(false)}
                      className={`admin-nav-link ${active ? "is-active" : ""} ${collapsed ? "justify-center px-0" : ""}`}
                    >
                      <Icon className="size-[18px] shrink-0" />
                      {!collapsed ? <span>{item.label}</span> : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <button
          type="button"
          className="mx-2 mb-3 hidden rounded-lg border border-white/10 px-2 py-2 text-xs font-semibold text-emerald-100/80 hover:bg-white/5 lg:block"
          onClick={() => setCollapsed((v) => !v)}
        >
          {collapsed ? "»" : "« Collapse"}
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="admin-topbar sticky top-0 z-30">
          <div className="flex items-center gap-3 px-4 py-3 lg:px-6">
            <button
              type="button"
              className="admin-icon-btn lg:hidden"
              onClick={() => setDrawerOpen((v) => !v)}
              aria-label="Open menu"
            >
              <Menu className="size-4" />
            </button>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--admin-ink)]">{pageTitle}</p>
              <p className="hidden text-[11px] text-[var(--admin-muted)] sm:block">
                What’s happening · What needs attention · What next
              </p>
            </div>

            <button
              type="button"
              className="admin-search-trigger ml-2 hidden min-w-0 flex-1 md:flex md:max-w-md"
              onClick={() => setCmdOpen(true)}
            >
              <Search className="size-4 shrink-0 opacity-50" />
              <span className="truncate">Search products, orders, farmers, customers…</span>
              <kbd className="admin-kbd">Ctrl K</kbd>
            </button>

            <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                className="admin-icon-btn md:hidden"
                onClick={() => setCmdOpen(true)}
                aria-label="Search"
              >
                <Search className="size-4" />
              </button>

              <button
                type="button"
                className="admin-icon-btn"
                onClick={() => setDark((v) => !v)}
                aria-label={dark ? "Light mode" : "Dark mode"}
                title="Theme"
              >
                {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </button>

              <div className="relative">
                <button
                  type="button"
                  className="admin-icon-btn relative"
                  onClick={() => {
                    setBellOpen((v) => !v);
                    setProfileOpen(false);
                    if (!bellOpen && unread > 0) void markNotificationsRead();
                  }}
                  aria-label="Notifications"
                >
                  <Bell className="size-4" />
                  {unread > 0 ? (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--huza-orange,#E86B1A)] px-1 text-[9px] font-bold text-white">
                      {Math.min(unread, 9)}
                    </span>
                  ) : null}
                </button>
                {bellOpen ? (
                  <div className="admin-popover absolute right-0 mt-2 w-80 p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--admin-muted)]">
                        Important alerts
                      </p>
                      {notifications.some((n) => !n.isRead) ? (
                        <button
                          type="button"
                          className="text-[10px] font-semibold text-[var(--huza-green-dark)]"
                          onClick={() => void markNotificationsRead()}
                        >
                          Mark all read
                        </button>
                      ) : null}
                    </div>
                    <div className="max-h-72 space-y-2 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-sm text-[var(--admin-muted)]">No alerts right now.</p>
                      ) : (
                        notifications.slice(0, 8).map((n) => (
                          <div
                            key={n.id}
                            className={`rounded-xl p-2.5 text-sm ${
                              n.isRead ? "bg-[var(--admin-soft)] opacity-70" : "bg-[var(--admin-soft)]"
                            }`}
                          >
                            <p className="font-medium">
                              {!n.isRead ? (
                                <span className="mr-1 inline-block size-1.5 rounded-full bg-[var(--huza-orange,#E86B1A)]" />
                              ) : null}
                              {n.title}
                            </p>
                            <p className="text-[var(--admin-muted)]">{n.body}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="relative">
                <button
                  type="button"
                  className="admin-profile-btn"
                  onClick={() => {
                    setProfileOpen((v) => !v);
                    setBellOpen(false);
                  }}
                >
                  <span className="admin-avatar">{initials}</span>
                  <span className="hidden text-left sm:block">
                    <span className="block text-sm font-semibold leading-tight">{name.split(" ")[0]}</span>
                    <span className="block text-[10px] uppercase tracking-wide text-[var(--admin-muted)]">
                      {roleLabel}
                    </span>
                  </span>
                  <ChevronDown className="hidden size-3.5 opacity-60 sm:block" />
                </button>
                {profileOpen ? (
                  <div className="admin-popover absolute right-0 mt-2 w-52 py-1">
                    <Link
                      href="/account"
                      className="admin-menu-item"
                      onClick={() => setProfileOpen(false)}
                    >
                      Profile
                    </Link>
                    {isSuper ? (
                      <Link
                        href="/admin/settings"
                        className="admin-menu-item"
                        onClick={() => setProfileOpen(false)}
                      >
                        Settings
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      className="admin-menu-item w-full text-left"
                      onClick={() => setDark((v) => !v)}
                    >
                      {dark ? "Light mode" : "Dark mode"}
                    </button>
                    <Link
                      href="/support"
                      className="admin-menu-item"
                      onClick={() => setProfileOpen(false)}
                    >
                      <HelpCircle className="size-3.5" /> Help
                    </Link>
                    <button
                      type="button"
                      className="admin-menu-item w-full text-left text-red-600"
                      onClick={() => signOut({ callbackUrl: "/auth/login" })}
                    >
                      <LogOut className="size-3.5" /> Logout
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <main className="admin-main min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>

          {/* Desktop alerts panel */}
          <aside
            className={`admin-alerts-panel hidden border-l border-[var(--admin-line)] xl:block ${
              alertsOpen ? "w-[280px]" : "w-10"
            }`}
          >
            <div className="sticky top-[57px] max-h-[calc(100vh-57px)] overflow-y-auto p-3">
              <div className="mb-3 flex items-center justify-between">
                {alertsOpen ? (
                  <p className="text-xs font-bold uppercase tracking-wide text-[var(--admin-muted)]">
                    Alerts
                  </p>
                ) : null}
                <button
                  type="button"
                  className="admin-icon-btn !min-h-8 !px-2"
                  onClick={() => setAlertsOpen((v) => !v)}
                  aria-label="Toggle alerts"
                >
                  {alertsOpen ? <X className="size-3.5" /> : <Bell className="size-3.5" />}
                </button>
              </div>
              {alertsOpen ? (
                <ul className="space-y-2">
                  {alertItems.length === 0 ? (
                    <li className="rounded-xl bg-[var(--admin-soft)] p-3 text-sm text-[var(--admin-muted)]">
                      You’re all caught up.
                    </li>
                  ) : (
                    alertItems.map((a) => (
                      <li key={a.text}>
                        <Link
                          href={a.href}
                          className={`admin-alert-card admin-alert-${a.tone}`}
                        >
                          {a.text}
                        </Link>
                      </li>
                    ))
                  )}
                </ul>
              ) : null}
            </div>
          </aside>
        </div>
      </div>

      <AdminCommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </div>
  );
}
