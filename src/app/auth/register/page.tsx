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
  const [role, setRole] = useState<"CUSTOMER" | "SUPPLIER">("CUSTOMER");

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, role }),
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
    router.push(role === "SUPPLIER" ? "/supplier" : "/account");
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="section-title text-center">{t("register")}</h1>
      <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-2xl border border-[var(--huza-line)] bg-white p-6">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setRole("CUSTOMER")}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold ${
              role === "CUSTOMER" ? "bg-[var(--huza-green)] text-white" : "bg-[var(--huza-mint)]"
            }`}
          >
            Customer
          </button>
          <button
            type="button"
            onClick={() => setRole("SUPPLIER")}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold ${
              role === "SUPPLIER" ? "bg-[var(--huza-green)] text-white" : "bg-[var(--huza-mint)]"
            }`}
          >
            Supplier
          </button>
        </div>
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
        {role === "SUPPLIER" && (
          <>
            <div>
              <label className="label">Business name</label>
              <input name="businessName" required className="input-field" />
            </div>
            <div>
              <label className="label">{t("location")}</label>
              <input name="location" required className="input-field" />
            </div>
            <div>
              <label className="label">District</label>
              <input name="district" required className="input-field" />
            </div>
            <div>
              <label className="label">{t("description")}</label>
              <textarea name="description" className="input-field min-h-16" />
            </div>
          </>
        )}
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
    </div>
  );
}
