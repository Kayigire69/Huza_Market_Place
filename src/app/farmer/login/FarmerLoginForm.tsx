"use client";

import { FormEvent, useState } from "react";
import { getSession, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/lib/locale-context";

/**
 * Compact centered login card — all copy via i18n (EN / FR / RW / SW).
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
        setError(t("farmerLoginRateLimited"));
        return;
      }
      setError(t("farmerLoginMismatch"));
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
    <div className="flex h-full items-center justify-center overflow-hidden px-4 py-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-[400px] shrink-0 space-y-3 rounded-2xl border border-[var(--huza-line)] bg-white p-5 shadow-lg sm:p-6"
      >
        <div className="text-center">
          <h1 className="text-xl font-bold text-[var(--huza-ink)]">{t("farmerLogin")}</h1>
          <p className="mt-1 text-sm text-[var(--huza-muted)]">{t("farmerLoginHint")}</p>
        </div>

        <div>
          <label className="label" htmlFor="farmer-login-phone">
            {t("phone")}
          </label>
          <input
            id="farmer-login-phone"
            name="phone"
            required
            className="input-field mt-1 h-11 text-base"
            placeholder="0788123456"
            inputMode="tel"
            autoComplete="tel"
            autoFocus
          />
        </div>
        <div>
          <label className="label" htmlFor="farmer-login-nid">
            {t("nationalIdLast4")}
          </label>
          <input
            id="farmer-login-nid"
            name="nationalIdLast4"
            required
            className="input-field mt-1 h-11 text-center text-xl tracking-[0.35em]"
            placeholder="4827"
            inputMode="numeric"
            pattern="[0-9]{4}"
            maxLength={4}
            autoComplete="off"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-[var(--huza-ink)]">
          <input name="rememberDevice" type="checkbox" className="size-4 shrink-0" defaultChecked />
          <span>{t("rememberDeviceShort")}</span>
        </label>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" className="h-11 w-full text-base" disabled={loading}>
          {loading ? t("signingIn") : t("loginAction")}
        </Button>

        <p className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-center text-sm">
          <Link href="/farmer/register" className="font-bold text-[var(--huza-green-dark)] underline">
            {t("newFarmerQuestion")}
          </Link>
          <button
            type="button"
            className="text-[var(--huza-muted)] underline"
            onClick={() => setShowHelp((v) => !v)}
          >
            {t("needHelpAccess")}
          </button>
          <Link href="/farmer" className="text-[var(--huza-muted)]">
            {t("backToFarmerHome")}
          </Link>
        </p>

        {showHelp && (
          <div className="rounded-lg bg-[var(--huza-mint)]/50 px-3 py-2 text-xs text-[var(--huza-ink)]">
            <p className="font-bold">{t("needHelpAccessTitle")}</p>
            <p className="mt-1">{t("needHelpAccessBody")}</p>
          </div>
        )}
      </form>
    </div>
  );
}
