"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { DELIVERY_ZONE_LABELS, formatRwf, formatUnit, type DeliveryZoneKey } from "@/lib/utils";
import { Heart, MapPin, Search, X } from "lucide-react";

type CustomerRow = {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  isActive: boolean;
  loyaltyPoints?: number;
  hasNotes?: boolean;
  ordersCount: number;
  favoritesCount?: number;
  addressesCount?: number;
  totalSpent: number;
  createdAt?: string;
  lastOrder: {
    orderNumber: string;
    total: number;
    createdAt: string;
    status: string;
  } | null;
};

type CustomerProfile = CustomerRow & {
  locale?: string;
  referralCode?: string | null;
  supportNotes?: string | null;
  stats?: {
    ordersCount: number;
    favoritesCount: number;
    addressesCount: number;
    totalSpent: number;
    avgOrder: number;
    paidTotal: number;
    paidCount: number;
    cancelledCount: number;
  };
  spendingByMonth?: { month: string; total: number }[];
  addresses?: {
    id: string;
    label: string;
    fullAddress: string;
    district: string | null;
    sector: string | null;
    isDefault: boolean;
  }[];
  favorites?: {
    id: string;
    createdAt: string;
    product: {
      id: string;
      nameEn: string;
      price: number;
      unit: string;
      isActive: boolean;
      slug: string;
    } | null;
  }[];
  orders?: {
    id: string;
    orderNumber: string;
    total: number;
    status: string;
    deliveryZone: string;
    deliveryAddress: string;
    createdAt: string;
    payment?: {
      method: string;
      status: string;
      amount: number;
      transactionRef: string | null;
    } | null;
    items?: { quantity: number; product?: { nameEn: string } | null }[];
  }[];
  supportTickets?: {
    id: string;
    ticketNumber: string;
    subject: string;
    status: string;
    createdAt: string;
  }[];
};

type TabKey = "all" | "active" | "inactive";
type ProfileTab = "profile" | "orders" | "spending" | "favorites" | "addresses" | "notes";

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "inactive", label: "Inactive" },
];

function zoneLabel(code?: string) {
  if (!code) return "—";
  return DELIVERY_ZONE_LABELS[code as DeliveryZoneKey] || code;
}

export function AdminCustomersClient() {
  const [tab, setTab] = useState<TabKey>("all");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [profileTab, setProfileTab] = useState<ProfileTab>("profile");
  const [notes, setNotes] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ tab });
      if (debouncedQ) params.set("q", debouncedQ);
      const res = await fetch(`/api/admin/customers?${params}`);
      const data = await res.json();
      if (res.ok) setCustomers(data.customers || []);
      else setMsg(data.error || "Failed to load customers");
    } catch {
      setMsg("Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, [tab, debouncedQ]);

  useEffect(() => {
    void load();
  }, [load]);

  const openProfile = async (id: string) => {
    setLoadingProfile(true);
    setProfileTab("profile");
    try {
      const res = await fetch(`/api/admin/customers?id=${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load profile");
      setProfile(data.customer);
      setNotes(data.customer.supportNotes || "");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setLoadingProfile(false);
    }
  };

  const act = async (id: string, action: string, extra?: Record<string, unknown>) => {
    setBusy(id);
    try {
      const res = await fetch("/api/admin/customers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      setMsg(
        action === "save_notes"
          ? "Notes saved"
          : action === "notify"
            ? "Notification sent"
            : `Customer ${action}d`
      );
      if (action === "activate" || action === "deactivate") {
        setProfile(null);
        await load();
      } else if (profile?.id === id && action === "save_notes") {
        setProfile({ ...profile, supportNotes: notes });
      }
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(null);
    }
  };

  const notify = async () => {
    if (!profile) return;
    const message = window.prompt("Message to customer", "Thank you for shopping with HUZA FRESH.");
    if (!message) return;
    await act(profile.id, "notify", { message });
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="admin-panel-title">Customers</h1>
        <p className="admin-panel-sub">
          Profiles, order & spending history, favorites, saved addresses, and support notes.
        </p>
      </div>

      {msg ? (
        <p className="rounded-lg border border-[var(--admin-line)] bg-[var(--admin-soft)] px-3 py-2 text-sm">
          {msg}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`admin-filter-chip ${tab === t.key ? "is-active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <label className="relative block max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--admin-muted)]" />
        <input
          className="admin-input pl-9"
          placeholder="Phone, name, or email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </label>

      <div className="admin-panel overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-[var(--admin-muted)]">Loading customers…</p>
        ) : customers.length === 0 ? (
          <p className="p-6 text-sm text-[var(--admin-muted)]">No customers found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Orders</th>
                  <th>Last Order</th>
                  <th>Total Spent</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <p className="font-medium">
                        {c.fullName}
                        {c.hasNotes ? (
                          <span className="ml-1 text-[10px] text-amber-700">· notes</span>
                        ) : null}
                      </p>
                      {c.email ? (
                        <p className="text-xs text-[var(--admin-muted)]">{c.email}</p>
                      ) : null}
                    </td>
                    <td className="tabular-nums">{c.phone}</td>
                    <td className="tabular-nums font-semibold">{c.ordersCount}</td>
                    <td className="text-xs">
                      {c.lastOrder ? (
                        <>
                          <p className="font-mono font-semibold">{c.lastOrder.orderNumber}</p>
                          <p className="text-[var(--admin-muted)]">
                            {new Date(c.lastOrder.createdAt).toLocaleDateString()}
                          </p>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="tabular-nums font-semibold">{formatRwf(c.totalSpent)}</td>
                    <td>
                      <span
                        className={
                          c.isActive
                            ? "admin-status admin-status-ok"
                            : "admin-status admin-status-muted"
                        }
                      >
                        {c.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={loadingProfile}
                        onClick={() => void openProfile(c.id)}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {profile ? (
        <div className="admin-drawer-backdrop" onClick={() => setProfile(null)}>
          <aside
            className="admin-drawer"
            style={{ width: "min(520px, 100%)" }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
          >
            <div className="flex items-center justify-between border-b border-[var(--admin-line)] px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold">{profile.fullName}</h2>
                <p className="text-xs text-[var(--admin-muted)]">{profile.phone}</p>
              </div>
              <button type="button" className="admin-icon-btn" onClick={() => setProfile(null)}>
                <X className="size-4" />
              </button>
            </div>

            <div className="flex gap-1 overflow-x-auto border-b border-[var(--admin-line)] px-3 py-2">
              {(
                [
                  ["profile", "Profile"],
                  ["orders", "Orders"],
                  ["spending", "Spending"],
                  ["favorites", "Favorites"],
                  ["addresses", "Addresses"],
                  ["notes", "Notes"],
                ] as [ProfileTab, string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={`admin-filter-chip shrink-0 ${profileTab === key ? "is-active" : ""}`}
                  onClick={() => setProfileTab(key)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-5 text-sm">
              {profileTab === "profile" ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-[var(--admin-muted)]">Email</p>
                      <p className="font-medium">{profile.email || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--admin-muted)]">Loyalty</p>
                      <p className="font-medium tabular-nums">{profile.loyaltyPoints ?? 0} pts</p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--admin-muted)]">Joined</p>
                      <p className="font-medium">
                        {profile.createdAt
                          ? new Date(profile.createdAt).toLocaleDateString()
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--admin-muted)]">Referral</p>
                      <p className="font-medium font-mono text-xs">
                        {profile.referralCode || "—"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 rounded-lg bg-[var(--admin-soft)] p-3">
                    <div>
                      <p className="text-[10px] uppercase text-[var(--admin-muted)]">Orders</p>
                      <p className="text-lg font-bold">{profile.stats?.ordersCount ?? 0}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-[var(--admin-muted)]">Spent</p>
                      <p className="text-lg font-bold">
                        {formatRwf(profile.stats?.totalSpent || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-[var(--admin-muted)]">Avg order</p>
                      <p className="text-lg font-bold">
                        {formatRwf(profile.stats?.avgOrder || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-[var(--admin-muted)]">Favourites</p>
                      <p className="text-lg font-bold">{profile.stats?.favoritesCount ?? 0}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {profile.isActive ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={busy === profile.id}
                        onClick={() => void act(profile.id, "deactivate")}
                      >
                        Deactivate
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        disabled={busy === profile.id}
                        onClick={() => void act(profile.id, "activate")}
                      >
                        Activate
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={busy === profile.id}
                      onClick={() => void notify()}
                    >
                      Send notification
                    </Button>
                    <Link href="/admin/support">
                      <Button type="button" size="sm" variant="ghost">
                        Support tickets
                      </Button>
                    </Link>
                  </div>

                  {(profile.supportTickets || []).length > 0 ? (
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase text-[var(--admin-muted)]">
                        Recent tickets
                      </p>
                      <ul className="space-y-1">
                        {(profile.supportTickets || []).slice(0, 5).map((t) => (
                          <li key={t.id} className="text-xs">
                            <span className="font-mono font-semibold">{t.ticketNumber}</span> ·{" "}
                            {t.subject} · {t.status}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </>
              ) : null}

              {profileTab === "orders" ? (
                <ul className="space-y-2">
                  {(profile.orders || []).length === 0 ? (
                    <li className="text-[var(--admin-muted)]">No orders yet.</li>
                  ) : (
                    (profile.orders || []).map((o) => (
                      <li
                        key={o.id}
                        className="rounded-lg border border-[var(--admin-line)] px-3 py-2"
                      >
                        <div className="flex justify-between gap-2">
                          <span className="font-mono text-xs font-bold">{o.orderNumber}</span>
                          <span className="admin-status admin-status-warn">
                            {o.status.replace(/_/g, " ")}
                          </span>
                        </div>
                        <p className="mt-0.5 font-semibold">{formatRwf(o.total)}</p>
                        <p className="text-xs text-[var(--admin-muted)]">
                          {zoneLabel(o.deliveryZone)} ·{" "}
                          {new Date(o.createdAt).toLocaleDateString()}
                          {o.payment
                            ? ` · ${o.payment.method.replace(/_/g, " ")} (${o.payment.status})`
                            : ""}
                        </p>
                        {(o.items || []).length > 0 ? (
                          <p className="mt-1 text-[10px] text-[var(--admin-muted)]">
                            {(o.items || [])
                              .map((i) => `${i.product?.nameEn || "Item"} × ${i.quantity}`)
                              .join(" · ")}
                          </p>
                        ) : null}
                      </li>
                    ))
                  )}
                  <Link href="/admin/orders">
                    <Button type="button" size="sm" variant="ghost" className="mt-2">
                      Open orders
                    </Button>
                  </Link>
                </ul>
              ) : null}

              {profileTab === "spending" ? (
                <>
                  <div className="grid grid-cols-2 gap-2 rounded-lg bg-[var(--admin-soft)] p-3">
                    <div>
                      <p className="text-[10px] uppercase text-[var(--admin-muted)]">Lifetime</p>
                      <p className="text-lg font-bold">
                        {formatRwf(profile.stats?.totalSpent || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-[var(--admin-muted)]">Paid in</p>
                      <p className="text-lg font-bold">
                        {formatRwf(profile.stats?.paidTotal || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-[var(--admin-muted)]">Avg order</p>
                      <p className="text-lg font-bold">
                        {formatRwf(profile.stats?.avgOrder || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-[var(--admin-muted)]">Cancelled</p>
                      <p className="text-lg font-bold">{profile.stats?.cancelledCount ?? 0}</p>
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase text-[var(--admin-muted)]">
                      Recent months
                    </p>
                    {(profile.spendingByMonth || []).length === 0 ? (
                      <p className="text-[var(--admin-muted)]">No spend data yet.</p>
                    ) : (
                      <ul className="space-y-2">
                        {(profile.spendingByMonth || []).map((m) => (
                          <li key={m.month} className="flex justify-between text-sm">
                            <span className="tabular-nums text-[var(--admin-muted)]">{m.month}</span>
                            <span className="font-semibold tabular-nums">{formatRwf(m.total)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              ) : null}

              {profileTab === "favorites" ? (
                <ul className="space-y-2">
                  {(profile.favorites || []).length === 0 ? (
                    <li className="text-[var(--admin-muted)]">No favorite products.</li>
                  ) : (
                    (profile.favorites || []).map((f) => (
                      <li
                        key={f.id}
                        className="flex items-start gap-2 rounded-lg border border-[var(--admin-line)] px-3 py-2"
                      >
                        <Heart className="mt-0.5 size-3.5 shrink-0 fill-red-400 text-red-400" />
                        <div>
                          <p className="font-medium">{f.product?.nameEn || "Product"}</p>
                          <p className="text-xs text-[var(--admin-muted)]">
                            {f.product
                              ? `${formatRwf(f.product.price)} / ${formatUnit(f.product.unit)}`
                              : "—"}
                            {f.product && !f.product.isActive ? " · hidden" : ""}
                          </p>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              ) : null}

              {profileTab === "addresses" ? (
                <ul className="space-y-2">
                  {(profile.addresses || []).length === 0 ? (
                    <li className="text-[var(--admin-muted)]">No saved addresses.</li>
                  ) : (
                    (profile.addresses || []).map((a) => (
                      <li
                        key={a.id}
                        className="rounded-lg border border-[var(--admin-line)] px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="size-3.5 text-[var(--huza-green-dark)]" />
                          <span className="font-medium">{a.label}</span>
                          {a.isDefault ? (
                            <span className="admin-status admin-status-ok">Default</span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-[var(--admin-muted)]">{a.fullAddress}</p>
                        {(a.district || a.sector) && (
                          <p className="text-xs text-[var(--admin-muted)]">
                            {[a.district, a.sector].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </li>
                    ))
                  )}
                </ul>
              ) : null}

              {profileTab === "notes" ? (
                <>
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold uppercase text-[var(--admin-muted)]">
                      Support notes (internal)
                    </span>
                    <textarea
                      className="admin-input min-h-[140px]"
                      placeholder="Delivery preferences, VIP, complaints, callback…"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </label>
                  <Button
                    type="button"
                    size="sm"
                    disabled={busy === profile.id}
                    onClick={() => void act(profile.id, "save_notes", { supportNotes: notes })}
                  >
                    Save notes
                  </Button>
                </>
              ) : null}
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
