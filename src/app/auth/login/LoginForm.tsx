"use client";

import { FormEvent, useState } from "react";
import { getSession, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/lib/locale-context";
import { portalPathForRole } from "@/lib/auth-redirect";
import { DemoCredentials } from "@/components/portals/DemoCredentials";

export default function LoginForm() {
  const { t } = useLocale();
  const router = useRouter();
  const sp = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsTotp, setNeedsTotp] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const phoneOrEmail = String(form.get("phoneOrEmail") || "").trim();
    const password = String(form.get("password") || "");
    const totpCode = String(form.get("totpCode") || "").trim();

    const res = await signIn("credentials", {
      phoneOrEmail,
      password,
      totpCode,
      redirect: false,
    });
    if (res?.error) {
      setLoading(false);
      if (!totpCode) {
        setNeedsTotp(true);
        setError(
          needsTotp
            ? "Invalid credentials or 2FA code."
            : "Login failed. If 2FA is enabled, enter your authenticator code."
        );
      } else {
        setError("Invalid credentials or 2FA code. Try again.");
      }
      return;
    }

    const session = await getSession();
    const role = session?.user?.role;
    const mustChange = Boolean(session?.user?.mustChangePassword);
    setLoading(false);
    router.push(portalPathForRole(role, { mustChangePassword: mustChange }));
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="section-title text-center">{t("login")}</h1>
      {sp.get("reset") === "1" && (
        <p className="mt-2 text-center text-sm text-emerald-800">
          Password updated. Sign in with your new password.
        </p>
      )}
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
        <div>
          <label className="label">Authenticator code (optional — required if 2FA is on)</label>
          <input
            name="totpCode"
            className="input-field"
            placeholder="6-digit code"
            autoComplete="one-time-code"
            inputMode="numeric"
          />
        </div>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "..." : t("login")}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm">
        <Link href="/auth/forgot-password" className="font-semibold text-[var(--huza-green)]">
          Forgot password?
        </Link>
      </p>
      <p className="mt-3 text-center text-sm">
        No account?{" "}
        <Link href="/auth/register" className="text-[var(--huza-green)] font-semibold">
          {t("register")}
        </Link>
      </p>
      <p className="mt-2 text-center text-xs text-[var(--huza-muted)]">
        <Link href="/" className="hover:underline">
          Customer shop
        </Link>
      </p>
      <DemoCredentials
        title="Demo logins"
        credentials={[
          {
            label: "Customer shop",
            email: "customer@example.com",
            password: "password123",
          },
          {
            label: "Shift Admin Alice (no Staff/Audit/Settings)",
            email: "alice@huza.rw",
            password: "password123",
          },
          {
            label: "Shift Admin John (no Staff/Audit/Settings)",
            email: "john@huza.rw",
            password: "password123",
          },
        ]}
      />
      <p className="mt-3 text-center text-[11px] text-[var(--huza-muted)]">
        Super Admin is created at system setup and is not listed here. Use the credentials given to
        the owner, then change the temporary password on first login.
      </p>
    </div>
  );
}
