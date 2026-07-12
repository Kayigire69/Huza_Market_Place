"use client";

import { FormEvent, useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function ChangePasswordPage() {
  const router = useRouter();
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

      // Sign out so the next login uses the new password cleanly.
      await signOut({ redirect: false });
      router.push("/auth/login?reset=1");
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
        Enter the temporary password, then choose a new one. After you save,{" "}
        <strong className="text-[var(--huza-ink)]">Huza@2026! will stop working</strong> — only your
        new password will sign you in.
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
            placeholder="Huza@2026!"
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
          {loading ? "Saving…" : "Save new password & continue"}
        </Button>
      </form>
    </div>
  );
}
