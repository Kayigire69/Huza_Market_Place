"use client";

import { FormEvent, useState } from "react";
import { getSession, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/lib/locale-context";

/**
 * Farmers Portal login — one short mobile screen: phone + last 4 of National ID.
 */
export function FarmerLoginForm() {
  const { t } = useLocale();
  const router = useRouter();
  const sp = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const phone = String(form.get("phone") || "").trim();
    const nationalIdLast4 = String(form.get("nationalIdLast4") || "").trim();
    const rememberDevice = form.get("rememberDevice") === "on";

    const res = await signIn("farmer-nid", {
      phone,
      nationalIdLast4,
      rememberDevice: rememberDevice ? "true" : "false",
      redirect: false,
    });

    if (res?.error) {
      setLoading(false);
      if (String(res.error) === "RATE_LIMITED") {
        setError("Too many tries. Wait a few minutes and try again.");
        return;
      }
      setError("Phone number or National ID digits do not match. Check and try again.");
      return;
    }

    await getSession();
    setLoading(false);
    const callback = sp.get("callbackUrl");
    if (callback && callback.startsWith("/") && !callback.startsWith("//")) {
      router.push(callback);
    } else {
      router.push("/farmer");
    }
    router.refresh();
  };

  return (
    <div className="mx-auto w-full max-w-md px-3 pb-28 pt-6 sm:px-4 sm:pb-10 sm:pt-12">
      <h1 className="text-center text-2xl font-bold text-[var(--huza-ink)] sm:text-3xl">
        {t("farmerLogin")}
      </h1>
      <p className="mt-2 text-center text-sm leading-relaxed text-[var(--huza-muted)]">
        Phone number + last 4 digits of National ID. No password.
      </p>

      <form
        id="farmer-login-form"
        onSubmit={onSubmit}
        className="mt-5 space-y-4 rounded-3xl border border-[var(--huza-line)] bg-white p-4 shadow-sm sm:mt-8 sm:space-y-5 sm:p-8"
      >
        <div>
          <label className="label text-base">{t("phone")}</label>
          <input
            name="phone"
            required
            className="input-field mt-1 min-h-14 text-lg"
            placeholder="0788123456"
            inputMode="tel"
            autoComplete="tel"
            autoFocus
          />
        </div>
        <div>
          <label className="label text-base">Last 4 digits of National ID</label>
          <input
            name="nationalIdLast4"
            required
            className="input-field mt-1 min-h-14 text-center text-2xl tracking-[0.4em]"
            placeholder="4827"
            inputMode="numeric"
            pattern="[0-9]{4}"
            maxLength={4}
            autoComplete="off"
          />
          <p className="mt-1.5 text-xs text-[var(--huza-muted)]">
            Example: if your ID ends in …4827, type 4827 only.
          </p>
        </div>

        <label className="flex items-start gap-3 text-sm text-[var(--huza-ink)]">
          <input name="rememberDevice" type="checkbox" className="mt-1 size-5 shrink-0" defaultChecked />
          <span>
            <strong>Remember this device</strong>
            <span className="mt-0.5 block text-[var(--huza-muted)]">
              Stay signed in up to 90 days, or until you log out.
            </span>
          </span>
        </label>

        {error && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
        )}

        {/* Desktop login button */}
        <Button
          type="submit"
          className="hidden w-full min-h-14 text-base sm:inline-flex"
          size="lg"
          disabled={loading}
        >
          {loading ? "Signing in…" : "Login"}
        </Button>

        <details className="rounded-2xl bg-[var(--huza-mint)]/40 open:pb-1">
          <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-[var(--huza-ink)]">
            Need help accessing your account?
          </summary>
          <p className="border-t border-[var(--huza-line)]/40 px-4 py-3 text-sm text-[var(--huza-muted)]">
            If you changed your phone number or cannot access your account, please contact HUZA
            Support or visit a HUZA office for account verification.
          </p>
        </details>

        <p className="text-center text-sm text-[var(--huza-muted)]">
          New farmer?{" "}
          <Link
            href="/farmer/register"
            className="font-bold text-[var(--huza-green-dark)] underline underline-offset-4"
          >
            {t("newFarmerApplication")}
          </Link>
        </p>
        <p className="text-center text-sm">
          <Link href="/farmer" className="font-semibold text-[var(--huza-green-dark)]">
            ← Farmers Portal home
          </Link>
        </p>
      </form>

      {/* Mobile sticky Login — always reachable with keyboard open */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--huza-line)] bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:hidden">
        <Button
          type="submit"
          form="farmer-login-form"
          className="w-full min-h-14 text-base"
          size="lg"
          disabled={loading}
        >
          {loading ? "Signing in…" : "Login"}
        </Button>
      </div>
    </div>
  );
}
