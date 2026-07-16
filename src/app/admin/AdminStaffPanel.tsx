"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

type StaffUser = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string;
  role: string;
  isActive: boolean;
  createdAt: string;
};

export function AdminStaffPanel({ initialStaff }: { initialStaff: StaffUser[] }) {
  const router = useRouter();
  const [staff, setStaff] = useState(initialStaff);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const res = await fetch("/api/admin/users");
    if (res.ok) {
      const data = await res.json();
      setStaff(data.staff || []);
    }
    router.refresh();
  }

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
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create staff account");
      setMsg(`Created ${data.fullName} — they must use their own login.`);
      e.currentTarget.reset();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(user: StaffUser) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, isActive: !user.isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setMsg(`${data.fullName} is now ${data.isActive ? "active" : "inactive"}`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="admin-panel p-5 space-y-3">
        <h2 className="admin-panel-title text-xl">Staff accounts</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-[var(--huza-muted)]">
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Login</th>
                <th className="py-2 pr-3">Role</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((u) => (
                <tr key={u.id} className="border-t border-[var(--huza-line)]">
                  <td className="py-2 pr-3 font-medium">{u.fullName}</td>
                  <td className="py-2 pr-3">
                    <div>{u.email || "—"}</div>
                    <div className="text-xs text-[var(--huza-muted)]">{u.phone}</div>
                  </td>
                  <td className="py-2 pr-3">{u.role}</td>
                  <td className="py-2 pr-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        u.isActive ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
                      }`}
                    >
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-2">
                    <Button size="sm" variant="ghost" disabled={busy} onClick={() => toggleActive(u)}>
                      {u.isActive ? "Deactivate" : "Activate"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <form
        onSubmit={onCreate}
        className="admin-panel p-5 grid gap-3 sm:grid-cols-2"
      >
        <h3 className="sm:col-span-2 font-semibold">Add staff member</h3>
        <label className="text-sm space-y-1">
          <span>Full name</span>
          <input name="fullName" required className="input-field" placeholder="Alice Uwimana" />
        </label>
        <label className="text-sm space-y-1">
          <span>Email (login)</span>
          <input name="email" type="email" className="input-field" placeholder="alice@huza.rw" />
        </label>
        <label className="text-sm space-y-1">
          <span>Phone</span>
          <input name="phone" required className="input-field" placeholder="078xxxxxxx" />
        </label>
        <label className="text-sm space-y-1">
          <span>Role</span>
          <select name="role" className="input-field" defaultValue="ADMIN">
            <option value="ADMIN">Administrator</option>
            <option value="WAREHOUSE">Warehouse</option>
            <option value="DELIVERY">Delivery</option>
            <option value="PROCUREMENT">Procurement</option>
            <option value="SUPPORT">Support</option>
          </select>
        </label>
        <label className="text-sm space-y-1 sm:col-span-2">
          <span>Temporary password</span>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            className="input-field"
            placeholder="At least 8 characters — they must change it on first login"
          />
        </label>
        <label className="text-sm space-y-1 sm:col-span-2 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
          <input name="promoteSuperAdmin" type="checkbox" className="mt-1" value="1" />
          <span>
            <strong>Promote to Super Admin</strong> (deliberate). Only use for a trusted director.
            Prefer one or two Super Admins total.
          </span>
        </label>
        <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Create personal account"}
          </Button>
          {msg && <p className="text-sm text-emerald-800">{msg}</p>}
          {error && <p className="text-sm text-red-700">{error}</p>}
        </div>
      </form>
    </div>
  );
}
