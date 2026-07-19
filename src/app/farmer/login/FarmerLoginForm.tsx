"use client";

import { FormEvent, useState } from "react";
import { getSession, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/lib/locale-context";

/**
 * Farmers Portal login — fits one phone screen (no page scroll).
 */
export function FarmerLoginForm() {
  const { t } = useLocale();
  const router = useRouter();
  const sp = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

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
    <div className="flex h-full flex-col justify-center px-3 py-3 sm:px-4">
      <form
        onSubmit={onSubmit}
        className="mx-auto w-full max-w-sm space-y-3 rounded-3xl border border-[var(--huza-line)] bg-white p-4 shadow-md sm:max-w-md sm:space-y-4 sm:p-6"
      >
        <div className="text-center">
          <h1 className="text-xl font-bold text-[var(--huza-ink)] sm:text-2xl">{t("farmerLogin")}</h1>
          <p className="mt-1 text-xs text-[var(--huza-muted)] sm:text-sm">
            Phone + last 4 of National ID. No password.
          </p>
        </div>

        <div>
          <label className="label text-sm sm:text-base">{t("phone")}</label>
          <input
            name="phone"
            required
            className="input-field mt-1 min-h-12 text-base sm:min-h-14 sm:text-lg"
            placeholder="0788123456"
            inputMode="tel"
            autoComplete="tel"
            autoFocus
          />
        </div>
        <div>
          <label className="label text-sm sm:text-base">Last 4 digits of National ID</label>
          <input
            name="nationalIdLast4"
            required
            className="input-field mt-1 min-h-12 text-center text-xl tracking-[0.35em] sm:min-h-14 sm:text-2xl"
            placeholder="4827"
            inputMode="numeric"
            pattern="[0-9]{4}"
            maxLength={4}
            autoComplete="off"
          />
        </div>

        <label className="flex items-center gap-2.5 text-sm text-[var(--huza-ink)]">
          <input name="rememberDevice" type="checkbox" className="size-5 shrink-0" defaultChecked />
          <span>Remember this device (90 days)</span>
        </label>

        {error && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
        )}

        <Button type="submit" className="w-full min-h-12 text-base" size="lg" disabled={loading}>
          {loading ? "Signing in…" : "Login"}
        </Button>

        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-xs sm:text-sm">
          <Link href="/farmer/register" className="font-bold text-[var(--huza-green-dark)] underline">
            New farmer?
          </Link>
          <button
            type="button"
            className="font-semibold text-[var(--huza-muted)] underline"
            onClick={() => setShowHelp((v) => !v)}
          >
            Need help?
          </button>
          <Link href="/farmer" className="text-[var(--huza-muted)]">
            ← Home
          </Link>
        </div>

        {showHelp && (
          <p className="rounded-xl bg-[var(--huza-mint)]/50 px-3 py-2 text-xs text-[var(--huza-ink)]">
            If you changed your phone number or cannot access your account, contact HUZA Support or
            visit a HUZA office for verification.
          </p>
        )}
      </form>
    </div>
  );
}
