"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function ResetPasswordPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: params.token,
          newPassword: form.get("newPassword"),
          confirmPassword: form.get("confirmPassword"),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reset failed");
      router.push("/auth/login?reset=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="section-title text-center">Set a new password</h1>
      <form
        onSubmit={onSubmit}
        className="mt-8 space-y-4 rounded-2xl border border-[var(--huza-line)] bg-white p-6"
      >
        <div>
          <label className="label">New password</label>
          <input name="newPassword" type="password" required minLength={8} className="input-field" />
        </div>
        <div>
          <label className="label">Confirm password</label>
          <input
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            className="input-field"
          />
        </div>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Saving…" : "Update password"}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm">
        <Link href="/auth/login" className="font-semibold text-[var(--huza-green)]">
          Back to login
        </Link>
      </p>
    </div>
  );
}
