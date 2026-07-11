"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function ForgotPasswordPage() {
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMsg("");
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email") }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setMsg(data.message || "If that email is registered, a reset link has been sent.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="section-title text-center">Forgot password</h1>
      <p className="mt-2 text-center text-sm text-[var(--huza-muted)]">
        Enter the email for your account. A secure reset link will be sent — only the inbox owner can
        reset the password.
      </p>
      <form
        onSubmit={onSubmit}
        className="mt-8 space-y-4 rounded-2xl border border-[var(--huza-line)] bg-white p-6"
      >
        <div>
          <label className="label">Email</label>
          <input name="email" type="email" required className="input-field" placeholder="owner@huza.rw" />
        </div>
        {error && <p className="text-sm text-red-700">{error}</p>}
        {msg && <p className="text-sm text-emerald-800">{msg}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Sending…" : "Send reset link"}
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
