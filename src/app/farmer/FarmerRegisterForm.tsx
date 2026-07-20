"use client";

import { FormEvent, useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/lib/locale-context";
import { Leaf, RefreshCw, Sprout, X } from "lucide-react";

type FarmingTypeChoice = "ORGANIC" | "STANDARD" | "CONVERSION";

const DRAFT_KEY = "huza_farmer_register_draft_v3";

/**
 * Compact centered registration card. Fits a PC screen without page scroll.
 * Extra farm fields open in a dialog (dialog may scroll; the page does not).
 */
export function FarmerRegisterForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const { t } = useLocale();
  const [farmingType, setFarmingType] = useState<FarmingTypeChoice>("ORGANIC");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [farmOpen, setFarmOpen] = useState(false);
  const [defaults, setDefaults] = useState<Record<string, string>>({});
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    const q = sp.get("type");
    if (q === "ORGANIC" || q === "STANDARD" || q === "CONVERSION") {
      setFarmingType(q);
    }
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw) as Record<string, string>;
        if (d.farmingType === "ORGANIC" || d.farmingType === "STANDARD" || d.farmingType === "CONVERSION") {
          setFarmingType(d.farmingType);
        }
        setDefaults(d);
        setFormKey((k) => k + 1);
      }
    } catch {
      /* ignore */
    }
  }, [sp]);

  const needsFullDossier = farmingType === "ORGANIC" || farmingType === "CONVERSION";
  const farmRequired = farmingType === "STANDARD";

  const saveDraft = (form?: HTMLFormElement | null) => {
    const payload: Record<string, string> = { farmingType };
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
    if (farmRequired) {
      const products = String(new FormData(form).get("productsOffered") || "").trim();
      const agreement = String(new FormData(form).get("huzaPurchaseAgreement") || "").trim();
      if (!products || !agreement) {
        setError(t("farmerRegisterNeedFarm"));
        setFarmOpen(true);
        return;
      }
    }

    setLoading(true);
    setError("");
    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        role: "SUPPLIER",
        farmingType,
        agreedToHuzaTerms: fd.get("agreedToHuzaTerms") === "on",
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setLoading(false);
      setError(data.error || t("registrationFailed"));
      if (String(data.error || "").toLowerCase().includes("product")) setFarmOpen(true);
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
  };

  const typeOptions: { value: FarmingTypeChoice; short: string; icon: typeof Leaf }[] = [
    { value: "ORGANIC", short: t("pathOrganicShort"), icon: Leaf },
    { value: "CONVERSION", short: t("pathConversionShort"), icon: RefreshCw },
    { value: "STANDARD", short: t("pathConventionalShort"), icon: Sprout },
  ];

  return (
    <div className="flex h-full items-center justify-center overflow-hidden px-4 py-4">
      <form
        key={formKey}
        id="farmer-register-form"
        onSubmit={onSubmit}
        className="relative w-full max-w-[520px] shrink-0"
      >
        <div className="rounded-2xl border border-[var(--huza-line)] bg-white p-5 shadow-lg sm:p-6">
          <h2 className="text-center text-xl font-bold text-[var(--huza-ink)]">
            {t("farmerRegistration")}
          </h2>
          <p className="mt-1 text-center text-sm text-[var(--huza-muted)]">
            {t("farmerRegisterHint")}
          </p>

          <fieldset className="mt-4">
            <legend className="label mb-1.5">{t("chooseFarmingType")}</legend>
            <div className="grid grid-cols-3 gap-2">
              {typeOptions.map((opt) => {
                const Icon = opt.icon;
                const selected = farmingType === opt.value;
                return (
                  <label
                    key={opt.value}
                    className={`flex h-14 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl border ${
                      selected
                        ? "border-[var(--huza-green)] bg-[var(--huza-mint)]/70"
                        : "border-[var(--huza-line)] hover:bg-[var(--huza-mint)]/30"
                    }`}
                  >
                    <input
                      type="radio"
                      className="sr-only"
                      checked={selected}
                      onChange={() => setFarmingType(opt.value)}
                    />
                    <Icon className="size-4 text-[var(--huza-green-dark)]" />
                    <span className="text-xs font-bold text-[var(--huza-ink)]">{opt.short}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {/* Compact 2-column on PC so the card stays short */}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">{t("fullNameContact")}</label>
              <input
                name="fullName"
                required
                defaultValue={defaults.fullName || ""}
                className="input-field mt-1 h-11"
                autoComplete="name"
              />
            </div>
            <div>
              <label className="label">{t("phone")}</label>
              <input
                name="phone"
                required
                defaultValue={defaults.phone || ""}
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
                defaultValue={defaults.nationalId || ""}
                className="input-field mt-1 h-11"
                inputMode="numeric"
                autoComplete="off"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setFarmOpen(true)}
            className="mt-3 flex h-11 w-full items-center justify-between rounded-xl border border-dashed border-[var(--huza-green)] bg-[var(--huza-mint)]/35 px-3 text-sm font-semibold text-[var(--huza-green-dark)]"
          >
            <span>{farmRequired ? t("farmDetailsRequired") : t("farmDetailsOptional")}</span>
            <span>{t("farmDetailsOpen")}</span>
          </button>

          <label className="mt-3 flex items-start gap-2 text-sm leading-snug">
            <input name="agreedToHuzaTerms" type="checkbox" required className="mt-0.5 size-4 shrink-0" />
            <span>{t("agreeHuzaBuyTerms")}</span>
          </label>

          {error && (
            <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
          )}

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
        </div>

        {/* Farm dialog. Centered on PC; page behind stays fixed */}
        <div
          className={
            farmOpen
              ? "fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
              : "pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0"
          }
          aria-hidden={!farmOpen}
        >
          <div className="flex max-h-[min(560px,85dvh)] w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl">
            <div className="flex shrink-0 items-center justify-between border-b border-[var(--huza-line)] px-4 py-3">
              <h3 className="font-bold text-[var(--huza-ink)]">
                {needsFullDossier ? t("farmDetailsTitle") : t("whatYouSellTitle")}
              </h3>
              <button
                type="button"
                className="rounded-full p-2 text-[var(--huza-muted)] hover:bg-[var(--huza-mint)]"
                onClick={() => setFarmOpen(false)}
                aria-label={t("closeDialog")}
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {!needsFullDossier ? (
                <>
                  <div>
                    <label className="label">
                      {t("farmBusinessName")} ({t("optional")})
                    </label>
                    <input
                      name="businessName"
                      defaultValue={defaults.businessName || ""}
                      className="input-field h-11"
                    />
                  </div>
                  <div>
                    <label className="label">{t("productsOfferedLabel")}</label>
                    <textarea
                      name="productsOffered"
                      defaultValue={defaults.productsOffered || ""}
                      className="input-field min-h-20"
                      placeholder={t("productsOfferedPlaceholder")}
                    />
                  </div>
                  <div>
                    <label className="label">{t("huzaPurchaseAgreementLabel")}</label>
                    <textarea
                      name="huzaPurchaseAgreement"
                      defaultValue={defaults.huzaPurchaseAgreement || ""}
                      className="input-field min-h-20"
                      placeholder={t("huzaPurchaseAgreementPlaceholder")}
                    />
                  </div>
                </>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="label">{t("farmBusinessName")}</label>
                    <input
                      name="businessName"
                      defaultValue={defaults.businessName || ""}
                      className="input-field h-11"
                    />
                  </div>
                  <div>
                    <label className="label">{t("farmLocation")}</label>
                    <input
                      name="location"
                      defaultValue={defaults.location || ""}
                      className="input-field h-11"
                    />
                  </div>
                  <div>
                    <label className="label">{t("district")}</label>
                    <input
                      name="district"
                      defaultValue={defaults.district || ""}
                      className="input-field h-11"
                    />
                  </div>
                  <div>
                    <label className="label">{t("sector")}</label>
                    <input
                      name="sector"
                      defaultValue={defaults.sector || ""}
                      className="input-field h-11"
                    />
                  </div>
                  <div>
                    <label className="label">{t("productCategories")}</label>
                    <input
                      name="productCategories"
                      defaultValue={defaults.productCategories || ""}
                      className="input-field h-11"
                    />
                  </div>
                  <div>
                    <label className="label">{t("mobileMoneyNumber")}</label>
                    <input
                      name="paymentMomo"
                      defaultValue={defaults.paymentMomo || ""}
                      className="input-field h-11"
                      placeholder="078xxxxxxx"
                      inputMode="tel"
                    />
                  </div>
                  <div>
                    <label className="label">{t("farmSizeOptional")}</label>
                    <input
                      name="farmSize"
                      defaultValue={defaults.farmSize || ""}
                      className="input-field h-11"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">{t("aboutYourFarm")}</label>
                    <textarea
                      name="description"
                      defaultValue={defaults.description || ""}
                      className="input-field min-h-16"
                    />
                  </div>
                  <div>
                    <label className="label">{t("productionCapacityOptional")}</label>
                    <input
                      name="productionCapacity"
                      defaultValue={defaults.productionCapacity || ""}
                      className="input-field h-11"
                    />
                  </div>
                  <div>
                    <label className="label">{t("tinOptional")}</label>
                    <input
                      name="tin"
                      defaultValue={defaults.tin || ""}
                      className="input-field h-11"
                    />
                  </div>
                  <div>
                    <label className="label">{t("bankAccountOptional")}</label>
                    <input
                      name="bankAccount"
                      defaultValue={defaults.bankAccount || ""}
                      className="input-field h-11"
                    />
                  </div>
                  <div>
                    <label className="label">{t("bankNameOptional")}</label>
                    <input
                      name="bankName"
                      defaultValue={defaults.bankName || ""}
                      className="input-field h-11"
                    />
                  </div>
                  <div>
                    <label className="label">{t("nationalIdDocUrl")}</label>
                    <input
                      name="nationalIdUrl"
                      defaultValue={defaults.nationalIdUrl || ""}
                      className="input-field h-11"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="label">{t("businessRegUrl")}</label>
                    <input
                      name="businessCertUrl"
                      defaultValue={defaults.businessCertUrl || ""}
                      className="input-field h-11"
                    />
                  </div>
                  <div>
                    <label className="label">{t("foodSafetyUrl")}</label>
                    <input
                      name="foodSafetyUrl"
                      defaultValue={defaults.foodSafetyUrl || ""}
                      className="input-field h-11"
                    />
                  </div>
                  <div>
                    <label className="label">{t("organicCertUrl")}</label>
                    <input
                      name="organicCertUrl"
                      defaultValue={defaults.organicCertUrl || ""}
                      className="input-field h-11"
                    />
                  </div>
                  <div>
                    <label className="label">{t("productPhotoUrls")}</label>
                    <textarea
                      name="productPhotoUrls"
                      defaultValue={defaults.productPhotoUrls || ""}
                      className="input-field min-h-14"
                    />
                  </div>
                  <div>
                    <label className="label">{t("farmPhotoUrls")}</label>
                    <textarea
                      name="farmPhotoUrls"
                      defaultValue={defaults.farmPhotoUrls || ""}
                      className="input-field min-h-14"
                    />
                  </div>
                </div>
              )}
            </div>
            {farmOpen && (
              <div className="shrink-0 border-t border-[var(--huza-line)] p-3">
                <Button type="button" className="h-11 w-full" onClick={() => setFarmOpen(false)}>
                  {t("farmDetailsDone")}
                </Button>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
