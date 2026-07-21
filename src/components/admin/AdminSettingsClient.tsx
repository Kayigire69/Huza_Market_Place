"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { AdminDeliveryZonesPanel } from "@/app/admin/AdminDeliveryZonesPanel";

type TabKey =
  | "company"
  | "delivery"
  | "hours"
  | "payments"
  | "notifications"
  | "users"
  | "roles"
  | "system";

const TABS: { key: TabKey; label: string }[] = [
  { key: "company", label: "Company" },
  { key: "delivery", label: "Pickup & delivery" },
  { key: "hours", label: "Working hours" },
  { key: "payments", label: "Payments" },
  { key: "notifications", label: "Notifications" },
  { key: "users", label: "Users" },
  { key: "roles", label: "Roles & permissions" },
  { key: "system", label: "Backup & system" },
];

type HourRow = {
  dayOfWeek: number;
  day: string;
  openHour: number;
  closeHour: number;
  isClosed: boolean;
};

type RoleRow = { role: string; modules: string[] };

type SystemInfo = {
  staffCount: number;
  nodeEnv: string;
  mtnConfigured: boolean;
  airtelConfigured: boolean;
  redisConfigured: boolean;
  databaseConfigured: boolean;
  appUrl: string;
};

function bool(v: string | undefined) {
  return v !== "false";
}

export function AdminSettingsClient({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const [tab, setTab] = useState<TabKey>("company");
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [hours, setHours] = useState<HourRow[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [emergency, setEmergency] = useState<{
    reason: string;
    startsAt: string;
    endsAt: string | null;
  } | null>(null);
  const [system, setSystem] = useState<SystemInfo | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Failed to load settings");
        return;
      }
      setSettings(data.settings || {});
      setHours(data.hours || []);
      setRoles(data.roles || []);
      setEmergency(data.emergency);
      setSystem(data.system || null);
      setCanEdit(Boolean(data.canEdit));
    } catch {
      setMsg("Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveBulk = async (patch: Record<string, string>, okMsg = "Settings saved") => {
    if (!canEdit) {
      setMsg("Only Super Admin can edit settings");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "settings_bulk", settings: patch }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      if (data.settings) setSettings(data.settings);
      else setSettings((s) => ({ ...s, ...patch }));
      setMsg(okMsg);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const setField = (key: string, value: string) => {
    setSettings((s) => ({ ...s, [key]: value }));
  };

  const toggle = (key: string) => {
    setSettings((s) => ({ ...s, [key]: bool(s[key]) ? "false" : "true" }));
  };

  if (loading) {
    return <p className="text-sm text-[var(--admin-muted)]">Loading settings…</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="admin-panel-title">Settings</h1>
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

      {tab === "company" ? (
        <div className="admin-panel max-w-2xl space-y-4 p-5">
          <h2 className="font-semibold">Company information</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["brand_name", "Brand name"],
                ["company_name", "Legal / company name"],
                ["company_tagline", "Tagline"],
                ["phone", "Phone"],
                ["email", "Email"],
                ["whatsapp_url", "WhatsApp URL"],
              ] as [string, string][]
            ).map(([key, label]) => (
              <label key={key} className="block text-sm sm:col-span-1">
                <span className="mb-1 block text-[var(--admin-muted)]">{label}</span>
                <input
                  className="admin-input"
                  value={settings[key] || ""}
                  disabled={!canEdit || busy}
                  onChange={(e) => setField(key, e.target.value)}
                />
              </label>
            ))}
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1 block text-[var(--admin-muted)]">Address</span>
              <input
                className="admin-input"
                value={settings.company_address || ""}
                disabled={!canEdit || busy}
                onChange={(e) => setField("company_address", e.target.value)}
              />
            </label>
          </div>
          <p className="text-xs text-[var(--admin-muted)]">Currency: RWF · Timezone: Africa/Kigali</p>
          {canEdit ? (
            <Button
              type="button"
              size="sm"
              disabled={busy}
              onClick={() =>
                void saveBulk(
                  {
                    brand_name: settings.brand_name || "",
                    company_name: settings.company_name || "",
                    company_tagline: settings.company_tagline || "",
                    phone: settings.phone || "",
                    email: settings.email || "",
                    whatsapp_url: settings.whatsapp_url || "",
                    company_address: settings.company_address || "",
                  },
                  "Company info saved"
                )
              }
            >
              Save company info
            </Button>
          ) : null}
        </div>
      ) : null}

      {tab === "delivery" ? (
        <div className="space-y-4">
          <div className="admin-panel max-w-lg space-y-3 p-5">
            <h2 className="font-semibold">Pickup location (checkout)</h2>
            <p className="text-sm text-[var(--admin-muted)]">
              Shown when customers choose free pickup. Home delivery fees are agreed by phone — not
              calculated in the system.
            </p>
            {(
              [
                ["pickup_location_name", "Pickup location name"],
                ["pickup_address", "Physical address"],
                ["pickup_maps_url", "Google Maps link or embed URL"],
                ["pickup_hours", "Business / pickup hours"],
                ["pickup_phone", "Contact phone"],
                ["pickup_whatsapp_url", "WhatsApp URL (wa.me/…)"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="block text-sm">
                <span className="mb-1 block text-[var(--admin-muted)]">{label}</span>
                <input
                  className="admin-input"
                  value={settings[key] || ""}
                  disabled={!canEdit || busy}
                  onChange={(e) => setField(key, e.target.value)}
                />
              </label>
            ))}
            {canEdit ? (
              <Button
                type="button"
                size="sm"
                disabled={busy}
                onClick={() =>
                  void saveBulk(
                    {
                      pickup_location_name: settings.pickup_location_name || "",
                      pickup_address: settings.pickup_address || "",
                      pickup_maps_url: settings.pickup_maps_url || "",
                      pickup_hours: settings.pickup_hours || "",
                      pickup_phone: settings.pickup_phone || "",
                      pickup_whatsapp_url: settings.pickup_whatsapp_url || "",
                    },
                    "Pickup location saved"
                  )
                }
              >
                Save pickup info
              </Button>
            ) : null}
          </div>
          <AdminDeliveryZonesPanel />
        </div>
      ) : null}

      {tab === "hours" ? (
        <div className="admin-panel max-w-2xl space-y-4 p-5">
          <h2 className="font-semibold">Working hours</h2>
          {emergency ? (
            <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Emergency closure active: {emergency.reason}
            </p>
          ) : null}
          {hours.length === 0 ? (
            <p className="text-sm text-[var(--admin-muted)]">
              Default hours: daily 6:00–21:00 (configure in Working hours).
            </p>
          ) : (
            <ul className="space-y-1 text-sm">
              {hours.map((h) => (
                <li
                  key={h.dayOfWeek}
                  className="flex justify-between rounded-lg border border-[var(--admin-line)] px-3 py-2"
                >
                  <span className="font-medium">{h.day}</span>
                  <span className="text-[var(--admin-muted)]">
                    {h.isClosed
                      ? "Closed"
                      : `${String(h.openHour).padStart(2, "0")}:00 – ${String(h.closeHour).padStart(2, "0")}:00`}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {isSuperAdmin ? (
            <Link href="/admin/hours">
              <Button size="sm">Edit hours &amp; emergency closure</Button>
            </Link>
          ) : (
            <p className="text-xs text-[var(--admin-muted)]">Super Admin manages hours.</p>
          )}
        </div>
      ) : null}

      {tab === "payments" ? (
        <div className="admin-panel max-w-xl space-y-4 p-5">
          <h2 className="font-semibold">Payment settings</h2>
          <p className="text-sm text-[var(--admin-muted)]">
            Merchant payee for customer MoMo / Airtel collections. API keys stay in environment
            variables.
          </p>
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--admin-muted)]">Merchant / payee name</span>
            <input
              className="admin-input"
              value={settings.merchant_name || ""}
              disabled={!canEdit || busy}
              onChange={(e) => setField("merchant_name", e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--admin-muted)]">Merchant phone (receive funds)</span>
            <input
              className="admin-input"
              placeholder="078xxxxxxx"
              value={settings.merchant_phone || ""}
              disabled={!canEdit || busy}
              onChange={(e) => setField("merchant_phone", e.target.value)}
            />
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={bool(settings.payment_mtn_enabled)}
                disabled={!canEdit || busy}
                onChange={() => toggle("payment_mtn_enabled")}
              />
              MTN MoMo enabled
              {system ? (
                <span className="text-xs text-[var(--admin-muted)]">
                  ({system.mtnConfigured ? "live keys" : "demo mode"})
                </span>
              ) : null}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={bool(settings.payment_airtel_enabled)}
                disabled={!canEdit || busy}
                onChange={() => toggle("payment_airtel_enabled")}
              />
              Airtel Money enabled
              {system ? (
                <span className="text-xs text-[var(--admin-muted)]">
                  ({system.airtelConfigured ? "live keys" : "demo mode"})
                </span>
              ) : null}
            </label>
          </div>
          {canEdit ? (
            <Button
              type="button"
              size="sm"
              disabled={busy}
              onClick={() =>
                void saveBulk(
                  {
                    merchant_name: settings.merchant_name || "",
                    merchant_phone: settings.merchant_phone || "",
                    payment_mtn_enabled: settings.payment_mtn_enabled || "true",
                    payment_airtel_enabled: settings.payment_airtel_enabled || "true",
                  },
                  "Payment settings saved"
                )
              }
            >
              Save payment settings
            </Button>
          ) : null}
        </div>
      ) : null}

      {tab === "notifications" ? (
        <div className="admin-panel max-w-xl space-y-4 p-5">
          <h2 className="font-semibold">Notification settings</h2>
          <p className="text-sm text-[var(--admin-muted)]">
            Channel and alert preferences for ops notifications.
          </p>
          <div className="space-y-2">
            {(
              [
                ["notify_inapp_enabled", "In-app notifications"],
                ["notify_sms_enabled", "SMS notifications"],
                ["notify_email_enabled", "Email notifications"],
                ["notify_new_order_enabled", "New order alerts"],
                ["notify_low_stock_enabled", "Low stock alerts"],
                ["notify_new_farmer_enabled", "New farmer applications"],
              ] as [string, string][]
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={bool(settings[key])}
                  disabled={!canEdit || busy}
                  onChange={() => toggle(key)}
                />
                {label}
              </label>
            ))}
          </div>
          {canEdit ? (
            <Button
              type="button"
              size="sm"
              disabled={busy}
              onClick={() =>
                void saveBulk(
                  {
                    notify_inapp_enabled: settings.notify_inapp_enabled || "true",
                    notify_sms_enabled: settings.notify_sms_enabled || "true",
                    notify_email_enabled: settings.notify_email_enabled || "true",
                    notify_new_order_enabled: settings.notify_new_order_enabled || "true",
                    notify_low_stock_enabled: settings.notify_low_stock_enabled || "true",
                    notify_new_farmer_enabled: settings.notify_new_farmer_enabled || "true",
                  },
                  "Notification settings saved"
                )
              }
            >
              Save notification settings
            </Button>
          ) : null}
        </div>
      ) : null}

      {tab === "users" ? (
        <div className="admin-panel space-y-3 p-5">
          <h2 className="font-semibold">Users</h2>
          <p className="text-sm text-[var(--admin-muted)]">
            Portal staff accounts ({system?.staffCount ?? "—"}). Create, activate, and reset
            passwords under Super Admin.
          </p>
          {isSuperAdmin ? (
            <div className="flex flex-wrap gap-2">
              <Link href="/admin/staff">
                <Button size="sm">Open staff management</Button>
              </Link>
              <Link href="/admin/security">
                <Button size="sm" variant="ghost">
                  Security
                </Button>
              </Link>
            </div>
          ) : (
            <p className="text-sm text-[var(--admin-muted)]">Super Admin only.</p>
          )}
        </div>
      ) : null}

      {tab === "roles" ? (
        <div className="admin-panel space-y-3 p-5">
          <h2 className="font-semibold">Roles &amp; permissions</h2>
          <p className="mb-2 text-sm text-[var(--admin-muted)]">
            Module access is enforced in the sidebar and API. Assign roles on staff accounts.
          </p>
          <div className="overflow-x-auto">
            <table className="admin-table text-xs">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Modules</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((r) => (
                  <tr key={r.role}>
                    <td className="font-semibold whitespace-nowrap">{r.role}</td>
                    <td className="text-[var(--admin-muted)]">{r.modules.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {isSuperAdmin ? (
            <Link href="/admin/staff">
              <Button size="sm" variant="ghost">
                Assign roles on staff
              </Button>
            </Link>
          ) : null}
        </div>
      ) : null}

      {tab === "system" ? (
        <div className="admin-panel max-w-2xl space-y-4 p-5">
          <h2 className="font-semibold">Backup &amp; system</h2>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-[var(--admin-muted)]">Environment</dt>
              <dd className="font-semibold">{system?.nodeEnv || "—"}</dd>
            </div>
            <div>
              <dt className="text-[var(--admin-muted)]">App URL</dt>
              <dd className="font-mono text-xs">{system?.appUrl || "—"}</dd>
            </div>
            <div>
              <dt className="text-[var(--admin-muted)]">Database</dt>
              <dd>{system?.databaseConfigured ? "Configured" : "Missing DATABASE_URL"}</dd>
            </div>
            <div>
              <dt className="text-[var(--admin-muted)]">Redis / jobs</dt>
              <dd>{system?.redisConfigured ? "Configured" : "Optional / local fallback"}</dd>
            </div>
          </dl>
          <div className="rounded-lg border border-[var(--admin-line)] bg-[var(--admin-soft)] p-3 text-sm">
            <p className="font-medium">Database backup</p>
            <p className="mt-1 text-[var(--admin-muted)]">
              Run from the server: <code className="text-xs">npm run db:backup</code> (see{" "}
              <code className="text-xs">scripts/backup-db.sh</code>). Schedule this outside the app
              (cron / Task Scheduler).
            </p>
          </div>
          {isSuperAdmin ? (
            <div className="flex flex-wrap gap-2">
              <Link href="/admin/audit">
                <Button size="sm" variant="ghost">
                  Audit trail
                </Button>
              </Link>
              <Link href="/admin/security">
                <Button size="sm" variant="ghost">
                  Security
                </Button>
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
