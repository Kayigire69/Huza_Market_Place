"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  ADMIN_ROLE_MODULES,
  adminRoleLabel,
  effectiveModules,
  modulesForRole,
  type AdminModule,
} from "@/lib/admin-nav";
import { KeyRound, Search, Shield, Trash2 } from "lucide-react";

type StaffUser = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string;
  role: string;
  allowedModules?: string[];
  isActive: boolean;
  isPrimarySuperAdmin?: boolean;
  totpEnabled?: boolean;
  mustChangePassword?: boolean;
  createdAt: string;
};

const ROLE_OPTIONS = [
  "ADMIN",
  "MANAGER",
  "INVENTORY",
  "WAREHOUSE",
  "PROCUREMENT",
  "SUPPORT",
  "FINANCE",
  "DELIVERY",
] as const;

const MODULE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  orders: "Orders",
  customers: "Customers",
  payments: "Payments",
  support: "Support",
  categories: "Categories",
  products: "Products",
  promotions: "Promotions",
  website_content: "Website content",
  inventory: "Inventory",
  deliveries: "Deliveries",
  farmers: "Farmers",
  approvals: "Approvals",
  agronomy: "Agronomy",
  crop_monitoring: "Crop monitoring",
  photography: "Photography",
  purchase_requests: "Purchase requests",
  purchase_orders: "Purchase orders",
  goods_received: "Goods received",
  commission_sales: "Commission sales",
  farmer_payments: "Farmer payments",
  procurement_history: "Procurement history",
  market_procurement: "Market procurement",
  reports: "Reports",
};

function ModuleChecklist({
  role,
  value,
  onChange,
  disabled,
}: {
  role: string;
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  const ceiling = useMemo(() => modulesForRole(role).filter((m) => m !== "settings"), [role]);
  const selected = value.length ? value : ceiling;

  if (role === "SUPER_ADMIN") {
    return <p className="text-xs text-[var(--admin-muted)]">Super Admin has all modules.</p>;
  }

  return (
    <div className="grid gap-1 sm:grid-cols-2">
      {ceiling.map((m) => {
        const checked = selected.includes(m);
        return (
          <label key={m} className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              disabled={disabled}
              checked={checked}
              onChange={() => {
                const base = value.length ? [...value] : [...ceiling];
                const next = checked ? base.filter((x) => x !== m) : [...base, m];
                // Empty means "use role defaults" only when all selected
                if (next.length === ceiling.length) onChange([]);
                else onChange(next);
              }}
            />
            <span>{MODULE_LABELS[m] || m}</span>
          </label>
        );
      })}
      <p className="sm:col-span-2 text-[10px] text-[var(--admin-muted)]">
        Uncheck modules to limit this employee. Leave all checked for the full role pack.
      </p>
    </div>
  );
}

export function AdminStaffClient() {
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editModules, setEditModules] = useState<string[]>([]);
  const [createRole, setCreateRole] = useState<string>("SUPPORT");
  const [createModules, setCreateModules] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load staff");
      setStaff(data.staff || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = staff.filter((u) => {
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(s) ||
      (u.email || "").toLowerCase().includes(s) ||
      u.phone.includes(s) ||
      u.role.toLowerCase().includes(s)
    );
  });

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMsg("");
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.get("fullName"),
          email: form.get("email"),
          phone: form.get("phone"),
          role: form.get("role"),
          password: form.get("password"),
          promoteSuperAdmin: form.get("promoteSuperAdmin") === "1",
          allowedModules: createModules,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create staff account");
      setMsg(`Created ${data.fullName}. They must change password on first login.`);
      e.currentTarget.reset();
      setCreateRole("SUPPORT");
      setCreateModules([]);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function patch(id: string, body: Record<string, unknown>, okMsg: string) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setMsg(okMsg);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  const resetPassword = async (u: StaffUser) => {
    const password = window.prompt(
      `Temporary password for ${u.fullName} (min 8 chars)`,
      ""
    );
    if (!password) return;
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    await patch(
      u.id,
      { action: "reset_password", password },
      `Password reset for ${u.fullName}. Must change on next login`
    );
  };

  const permanentDelete = async (u: StaffUser) => {
    if (u.isPrimarySuperAdmin || u.role === "SUPER_ADMIN") {
      setError("Super Admin accounts cannot be permanently deleted.");
      return;
    }
    const typed = window.prompt(
      `Permanently delete ${u.fullName}?\n\nThis cannot be undone. Type DELETE to confirm.`,
      ""
    );
    if (typed !== "DELETE") {
      if (typed != null) setError("Deletion cancelled — type DELETE exactly to confirm.");
      return;
    }
    await patch(
      u.id,
      { action: "hard_delete", permanent: true },
      `Permanently deleted ${u.fullName}`
    );
  };

  const openModules = (u: StaffUser) => {
    setEditingId(u.id);
    setEditModules(u.allowedModules?.length ? [...u.allowedModules] : []);
  };

  const saveModules = async (u: StaffUser) => {
    await patch(
      u.id,
      { allowedModules: editModules },
      `Modules updated for ${u.fullName}`
    );
    setEditingId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="admin-panel-title">Staff accounts</h1>
          <p className="mt-1 text-sm text-[var(--admin-muted)]">
            Assign a role, then limit modules per person when needed.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/cleanup">
            <Button size="sm" variant="ghost">
              System cleanup
            </Button>
          </Link>
          <Link href="/admin/audit">
            <Button size="sm" variant="ghost">
              Audit trail
            </Button>
          </Link>
          <Link href="/admin/security">
            <Button size="sm" variant="ghost">
              <Shield className="mr-1 size-3.5" />
              Security
            </Button>
          </Link>
        </div>
      </div>

      {msg ? (
        <p className="rounded-lg border border-[var(--admin-line)] bg-[var(--admin-soft)] px-3 py-2 text-sm text-emerald-800">
          {msg}
        </p>
      ) : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <label className="relative block max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--admin-muted)]" />
        <input
          className="admin-input pl-9"
          placeholder="Search name, email, phone, role…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </label>

      <div className="admin-panel overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-[var(--admin-muted)]">Loading staff…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Login</th>
                  <th>Role & modules</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const effective = effectiveModules(u.role, u.allowedModules) as AdminModule[];
                  return (
                    <tr key={u.id}>
                      <td>
                        <p className="font-medium">{u.fullName}</p>
                        {u.isPrimarySuperAdmin ? (
                          <span className="text-[10px] text-amber-700">Primary Super Admin</span>
                        ) : null}
                        {u.mustChangePassword ? (
                          <span className="ml-1 text-[10px] text-amber-700">· must change pwd</span>
                        ) : null}
                        {u.totpEnabled ? (
                          <span className="ml-1 text-[10px] text-emerald-700">· 2FA</span>
                        ) : null}
                      </td>
                      <td>
                        <p className="text-sm">{u.email || "—"}</p>
                        <p className="text-xs text-[var(--admin-muted)]">{u.phone}</p>
                      </td>
                      <td>
                        <select
                          className="admin-input py-1 text-xs"
                          value={u.role}
                          disabled={busy || u.isPrimarySuperAdmin}
                          onChange={(e) =>
                            void patch(
                              u.id,
                              { role: e.target.value },
                              `${u.fullName} → ${e.target.value}`
                            )
                          }
                        >
                          {u.role === "SUPER_ADMIN" ? (
                            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                          ) : null}
                          {ROLE_OPTIONS.map((r) => (
                            <option key={r} value={r}>
                              {adminRoleLabel(r)} ({r})
                            </option>
                          ))}
                          {u.role === "SUPER_ADMIN" ? null : (
                            <option value="SUPER_ADMIN">Super Admin</option>
                          )}
                        </select>
                        <p className="mt-0.5 max-w-[220px] text-[10px] text-[var(--admin-muted)]">
                          {u.allowedModules?.length
                            ? `${u.allowedModules.length} modules assigned`
                            : `Role default (${(ADMIN_ROLE_MODULES[u.role] || []).length})`}
                          : {effective.slice(0, 3).map((m) => MODULE_LABELS[m] || m).join(", ")}
                          {effective.length > 3 ? "…" : ""}
                        </p>
                        {u.role !== "SUPER_ADMIN" ? (
                          <div className="mt-1">
                            {editingId === u.id ? (
                              <div className="rounded border border-[var(--admin-line)] bg-[var(--admin-soft)] p-2">
                                <ModuleChecklist
                                  role={u.role}
                                  value={editModules}
                                  onChange={setEditModules}
                                  disabled={busy}
                                />
                                <div className="mt-2 flex gap-2">
                                  <Button
                                    type="button"
                                    size="sm"
                                    disabled={busy}
                                    onClick={() => void saveModules(u)}
                                  >
                                    Save modules
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setEditingId(null)}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                disabled={busy}
                                onClick={() => openModules(u)}
                              >
                                Edit modules
                              </Button>
                            )}
                          </div>
                        ) : null}
                      </td>
                      <td>
                        <span
                          className={
                            u.isActive
                              ? "admin-status admin-status-ok"
                              : "admin-status admin-status-muted"
                          }
                        >
                          {u.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="flex flex-wrap justify-end gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={busy}
                            onClick={() => void resetPassword(u)}
                          >
                            <KeyRound className="mr-1 size-3.5" />
                            Reset pwd
                          </Button>
                          {!u.isPrimarySuperAdmin ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              disabled={busy}
                              onClick={() =>
                                void patch(
                                  u.id,
                                  { isActive: !u.isActive },
                                  `${u.fullName} ${u.isActive ? "deactivated" : "activated"}`
                                )
                              }
                            >
                              {u.isActive ? "Deactivate" : "Activate"}
                            </Button>
                          ) : null}
                          {!u.isPrimarySuperAdmin && u.role !== "SUPER_ADMIN" ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              disabled={busy}
                              className="text-red-700 hover:text-red-800"
                              onClick={() => void permanentDelete(u)}
                            >
                              <Trash2 className="mr-1 size-3.5" />
                              Delete
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <form onSubmit={onCreate} className="admin-panel grid max-w-3xl gap-3 p-5 sm:grid-cols-2">
        <h2 className="sm:col-span-2 font-semibold">Create staff account</h2>
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--admin-muted)]">Full name</span>
          <input name="fullName" required className="admin-input" placeholder="Alice Uwimana" />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--admin-muted)]">Email (login)</span>
          <input name="email" type="email" className="admin-input" placeholder="alice@huza.rw" />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--admin-muted)]">Phone</span>
          <input name="phone" required className="admin-input" placeholder="078xxxxxxx" />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--admin-muted)]">Role</span>
          <select
            name="role"
            className="admin-input"
            value={createRole}
            onChange={(e) => {
              setCreateRole(e.target.value);
              setCreateModules([]);
            }}
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {adminRoleLabel(r)}
              </option>
            ))}
          </select>
        </label>
        <div className="sm:col-span-2 rounded-lg border border-[var(--admin-line)] p-3">
          <p className="mb-2 text-sm font-medium">Modules for this employee</p>
          <ModuleChecklist
            role={createRole}
            value={createModules}
            onChange={setCreateModules}
            disabled={busy}
          />
        </div>
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1 block text-[var(--admin-muted)]">Temporary password</span>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            className="admin-input"
            placeholder="At least 8 characters"
          />
        </label>
        <label className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm sm:col-span-2">
          <input name="promoteSuperAdmin" type="checkbox" className="mt-1" value="1" />
          <span>
            <strong>Promote to Super Admin</strong>. Only for a trusted director. Prefer few Super
            Admins.
          </span>
        </label>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Create personal account"}
          </Button>
        </div>
      </form>
    </div>
  );
}
