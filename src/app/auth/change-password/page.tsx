"use client";

import { FormEvent, useState } from "react";
import { getSession, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { portalPathForRole } from "@/lib/auth-redirect";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { update } = useSession();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: form.get("currentPassword"),
          newPassword: form.get("newPassword"),
          confirmPassword: form.get("confirmPassword"),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not change password");

      await update({ mustChangePassword: false });
      const session = await getSession();
      const role = session?.user?.role;
      router.push(portalPathForRole(role, { mustChangePassword: false }));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="section-title text-center">Change your password</h1>
      <p className="mt-2 text-center text-sm text-[var(--huza-muted)]">
        For security, you must set a new password before continuing. After this, even the developer
        will not know your password.
      </p>
      <form
        onSubmit={onSubmit}
        className="mt-8 space-y-4 rounded-2xl border border-[var(--huza-line)] bg-white p-6"
      >
        <div>
          <label className="label">Current (temporary) password</label>
          <input
            name="currentPassword"
            type="password"
            required
            className="input-field"
            autoComplete="current-password"
          />
        </div>
        <div>
          <label className="label">New password</label>
          <input
            name="newPassword"
            type="password"
            required
            minLength={8}
            className="input-field"
            autoComplete="new-password"
          />
        </div>
        <div>
          <label className="label">Confirm new password</label>
          <input
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            className="input-field"
            autoComplete="new-password"
          />
        </div>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Saving…" : "Save new password"}
        </Button>
      </form>
    </div>
  );
}
