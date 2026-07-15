"use client";

import { FormEvent, useState } from "react";
import { getSession, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/lib/locale-context";
import { portalPathForRole } from "@/lib/auth-redirect";

export default function LoginForm() {
  const { t } = useLocale();
  const router = useRouter();
  const sp = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showTotp, setShowTotp] = useState(false);

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
      const code = String(res.error);
      if (code === "RATE_LIMITED") {
        setError("Too many login attempts. Wait a few minutes and try again.");
        return;
      }
      if (code === "TOTP_REQUIRED") {
        setShowTotp(true);
        setError("This account has 2FA enabled. Enter the 6-digit authenticator code.");
        return;
      }
      if (code === "TOTP_INVALID") {
        setShowTotp(true);
        setError("Authenticator code is incorrect. Try again.");
        return;
      }
      // Wrong email/password (2FA is not the cause when it is disabled)
      setError("Email or password is incorrect.");
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
        {showTotp ? (
          <div>
            <label className="label">Authenticator code</label>
            <input
              name="totpCode"
              className="input-field"
              placeholder="6-digit code"
              autoComplete="one-time-code"
              inputMode="numeric"
              autoFocus
            />
          </div>
        ) : (
          <>
            <input type="hidden" name="totpCode" value="" />
            <button
              type="button"
              className="text-left text-xs font-semibold text-[var(--huza-muted)] underline underline-offset-2"
              onClick={() => setShowTotp(true)}
            >
              Have 2FA enabled? Enter authenticator code
            </button>
          </>
        )}
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
    </div>
  );
}
