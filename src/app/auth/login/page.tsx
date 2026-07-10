"use client";

import { FormEvent, useState } from "react";
import { getSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/lib/locale-context";
import { portalPathForRole } from "@/lib/auth-redirect";
import { DemoCredentials } from "@/components/portals/DemoCredentials";

export default function LoginPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const phoneOrEmail = String(form.get("phoneOrEmail") || "").trim();
    const password = String(form.get("password") || "");

    const res = await signIn("credentials", {
      phoneOrEmail,
      password,
      redirect: false,
    });
    if (res?.error) {
      setLoading(false);
      setError("Invalid email/phone or password. Check your details and try again.");
      return;
    }

    const session = await getSession();
    const role = (session?.user as { role?: string } | undefined)?.role;
    setLoading(false);
    router.push(portalPathForRole(role));
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="section-title text-center">{t("login")}</h1>
      <form
        onSubmit={onSubmit}
        className="mt-8 space-y-4 rounded-2xl border border-[var(--huza-line)] bg-white p-6"
      >
        <div>
          <label className="label">
            {t("email")} / {t("phone")}
          </label>
          <input
            name="phoneOrEmail"
            required
            className="input-field"
            placeholder="email@example.com or 078xxxxxxx"
            autoComplete="username"
          />
        </div>
        <div>
          <label className="label">{t("password")}</label>
          <input
            name="password"
            type="password"
            required
            className="input-field"
            autoComplete="current-password"
          />
        </div>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "..." : t("login")}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm">
        No account?{" "}
        <Link href="/auth/register" className="text-[var(--huza-green)] font-semibold">
          {t("register")}
        </Link>
      </p>
      <p className="mt-2 text-center text-xs text-[var(--huza-muted)]">
        Portals:{" "}
        <Link href="/farmer" className="font-semibold text-[var(--huza-green)]">
          Farmers
        </Link>
        {" · "}
        <Link href="/admin" className="font-semibold text-[var(--huza-green)]">
          Admin
        </Link>
        {" · "}
        <Link href="/" className="hover:underline">
          Customer shop
        </Link>
      </p>
      <DemoCredentials
        title="Demo portal credentials"
        credentials={[
          {
            label: "Admin portal",
            email: "admin@youthhuza.rw",
            password: "password123",
          },
          {
            label: "Farmers portal (approved)",
            email: "greenvalley@farm.rw",
            password: "password123",
          },
          {
            label: "Farmers portal (pending approval)",
            email: "newfarm@example.rw",
            password: "password123",
          },
          {
            label: "Customer shop",
            email: "customer@example.com",
            password: "password123",
          },
        ]}
      />
    </div>
  );
}
