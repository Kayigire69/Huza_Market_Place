"use client";

import { FormEvent, useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/lib/locale-context";
import { RWANDA_PROVINCES } from "@/lib/farmer-dossier";
import { provinceLabelKey } from "@/lib/i18n";
import { FarmerWhatsAppHelp } from "@/components/portals/FarmerWhatsAppHelp";

/** Always Conventional Farming for startup-phase registration (no UI choice). */
const FARMING_TYPE = "STANDARD" as const;

const DRAFT_KEY = "huza_farmer_register_draft_v6";

/**
 * Slim farmer registration: identity, contact, location, main crop(s), terms.
 * Optional farm dossier → Settings while PENDING (farmer or agent via Admin).
 * MoMo / bank / sales setup → Settings after APPROVED.
 */
export function FarmerRegisterForm() {
  const router = useRouter();
  const { t } = useLocale();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [defaults, setDefaults] = useState<Record<string, string>>({});
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        setDefaults(JSON.parse(raw) as Record<string, string>);
        setFormKey((k) => k + 1);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const saveDraft = (form?: HTMLFormElement | null) => {
    const payload: Record<string, string> = { farmingType: FARMING_TYPE };
    if (form) {
      const fd = new FormData(form);
      fd.forEach((v, k) => {
        if (typeof v === "string") payload[k] = v;
      });
    }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setLoading(true);
    setError("");

    try {
      const fd = new FormData(form);
      const payload = Object.fromEntries(
        [...fd.entries()].filter(([, v]) => typeof v === "string")
      ) as Record<string, string>;

      const currentCrop = String(payload.currentCrop || "").trim();
      const businessName =
        String(payload.businessName || "").trim() || `${payload.fullName}'s Farm`;

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          role: "SUPPLIER",
          farmingType: FARMING_TYPE,
          businessName,
          productsOffered: currentCrop,
          currentCrop,
          agreedToHuzaTerms: fd.get("agreedToHuzaTerms") === "on",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoading(false);
        setError(data.error || t("registrationFailed"));
        return;
      }
      localStorage.removeItem(DRAFT_KEY);
      const nid = String(payload.nationalId || "").replace(/\D/g, "");
      await signIn("farmer-nid", {
        phone: String(payload.phone),
        nationalIdLast4: nid.slice(-4),
        rememberDevice: "true",
        redirect: false,
      });
      setLoading(false);
      router.push("/farmer");
      router.refresh();
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : t("registrationFailed"));
    }
  };

  const d = (key: string) => defaults[key] || "";

  return (
    <div className="mx-auto w-full max-w-[640px] px-4 py-6 sm:py-8">
      <form
        key={formKey}
        id="farmer-register-form"
        onSubmit={onSubmit}
        className="relative w-full pb-8"
      >
        <div className="rounded-2xl border border-[var(--huza-line)] bg-white p-5 shadow-lg sm:p-6">
          <h2 className="text-center text-xl font-bold text-[var(--huza-ink)]">
            {t("farmerRegistration")}
          </h2>
          <p className="mt-1 text-center text-sm text-[var(--huza-muted)]">
            {t("farmerRegisterHint")}
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">{t("fullNameContact")}</label>
              <input
                name="fullName"
                required
                defaultValue={d("fullName")}
                className="input-field mt-1 h-11"
                autoComplete="name"
              />
            </div>
            <div>
              <label className="label">{t("phone")}</label>
              <input
                name="phone"
                required
                defaultValue={d("phone")}
                className="input-field mt-1 h-11"
                placeholder="078xxxxxxx"
                inputMode="tel"
                autoComplete="tel"
              />
            </div>
            <div>
              <label className="label">{t("nationalIdFull")}</label>
              <input
                name="nationalId"
                required
                defaultValue={d("nationalId")}
                className="input-field mt-1 h-11"
                inputMode="numeric"
                autoComplete="off"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">{t("farmBusinessName")}</label>
              <input
                name="businessName"
                defaultValue={d("businessName")}
                className="input-field mt-1 h-11"
                placeholder={t("farmBusinessNameOptional")}
              />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <h3 className="text-sm font-bold text-[var(--huza-green-dark)]">
              {t("location")}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">{t("province")}</label>
                <select
                  name="province"
                  required
                  defaultValue={d("province")}
                  className="input-field mt-1 h-11"
                >
                  <option value="">{t("select")}</option>
                  {RWANDA_PROVINCES.map((p) => (
                    <option key={p} value={p}>
                      {t(provinceLabelKey[p])}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">{t("district")}</label>
                <input
                  name="district"
                  required
                  defaultValue={d("district")}
                  className="input-field mt-1 h-11"
                />
              </div>
              <div>
                <label className="label">{t("sector")}</label>
                <input
                  name="sector"
                  required
                  defaultValue={d("sector")}
                  className="input-field mt-1 h-11"
                />
              </div>
              <div>
                <label className="label">{t("cell")}</label>
                <input name="cell" required defaultValue={d("cell")} className="input-field mt-1 h-11" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">{t("village")}</label>
                <input
                  name="village"
                  required
                  defaultValue={d("village")}
                  className="input-field mt-1 h-11"
                />
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <h3 className="text-sm font-bold text-[var(--huza-green-dark)]">
              {t("currentCrop")}
            </h3>
            <div>
              <label className="label">{t("mainCropsLabel")}</label>
              <textarea
                name="currentCrop"
                required
                defaultValue={d("currentCrop")}
                className="input-field mt-1 min-h-20"
                placeholder={t("mainCropsPlaceholder")}
              />
            </div>
          </div>

          <label className="mt-4 flex items-start gap-2 text-sm leading-snug">
            <input name="agreedToHuzaTerms" type="checkbox" required className="mt-0.5 size-4 shrink-0" />
            <span>{t("agreeHuzaBuyTerms")}</span>
          </label>

          {error ? (
            <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
          ) : null}

          <div className="mt-4 flex gap-2">
            <Button
              type="button"
              variant="secondary"
              className="h-11 shrink-0"
              onClick={(ev) => saveDraft((ev.currentTarget as HTMLButtonElement).form)}
            >
              {t("saveDraft")}
            </Button>
            <Button type="submit" className="h-11 flex-1" disabled={loading}>
              {loading ? t("submitting") : t("submitApplication")}
            </Button>
          </div>

          <p className="mt-3 text-center text-sm text-[var(--huza-muted)]">
            {t("alreadyRegistered")}{" "}
            <Link href="/farmer/login" className="font-bold text-[var(--huza-green-dark)] underline">
              {t("farmerLogin")}
            </Link>
            {" · "}
            <Link href="/farmer">{t("home")}</Link>
          </p>
          <div className="mt-4">
            <FarmerWhatsAppHelp />
          </div>
        </div>
      </form>
    </div>
  );
}
