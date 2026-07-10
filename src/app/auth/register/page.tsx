"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/lib/locale-context";

export default function RegisterPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, role: "CUSTOMER" }),
    });
    const data = await res.json();
    if (!res.ok) {
      setLoading(false);
      setError(data.error || "Registration failed");
      return;
    }
    await signIn("credentials", {
      phoneOrEmail: String(payload.phone),
      password: String(payload.password),
      redirect: false,
    });
    setLoading(false);
    router.push("/account");
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="section-title text-center">{t("register")}</h1>
      <p className="mt-2 text-center text-sm text-[var(--huza-muted)]">
        Create a customer account to shop HUZA FRESH
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-2xl border border-[var(--huza-line)] bg-white p-6">
        <div>
          <label className="label">{t("fullName")}</label>
          <input name="fullName" required className="input-field" />
        </div>
        <div>
          <label className="label">{t("phone")}</label>
          <input name="phone" required className="input-field" />
        </div>
        <div>
          <label className="label">{t("email")}</label>
          <input name="email" type="email" className="input-field" />
        </div>
        <div>
          <label className="label">{t("password")}</label>
          <input name="password" type="password" required minLength={6} className="input-field" />
        </div>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "..." : t("register")}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm">
        Already have an account?{" "}
        <Link href="/auth/login" className="text-[var(--huza-green)] font-semibold">
          {t("login")}
        </Link>
      </p>
      <p className="mt-6 text-center text-xs text-[var(--huza-muted)]">
        Are you a farmer? Use the{" "}
        <Link href="/farmer" className="font-semibold text-[var(--huza-green)]">
          Farmers Portal
        </Link>{" "}
        to register and sell produce to Youth Huza.
      </p>
    </div>
  );
}
