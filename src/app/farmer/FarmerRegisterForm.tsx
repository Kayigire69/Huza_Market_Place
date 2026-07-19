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
 * Registration fits one phone screen.
 * Farm fields open in a full-screen sheet (sheet scrolls; main page does not).
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
        setError("Tap “Farm details” and fill products + purchase agreement.");
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
    { value: "ORGANIC", short: "Organic", icon: Leaf },
    { value: "CONVERSION", short: "Conversion", icon: RefreshCw },
    { value: "STANDARD", short: "Conventional", icon: Sprout },
  ];

  return (
    <div className="flex h-full flex-col px-3 py-2 sm:px-4 sm:py-3">
      <form
        key={formKey}
        id="farmer-register-form"
        onSubmit={onSubmit}
        className="mx-auto flex h-full w-full max-w-md flex-col"
      >
        <div className="flex min-h-0 flex-1 flex-col rounded-3xl border border-[var(--huza-line)] bg-white p-3 shadow-md sm:p-5">
          <h2 className="shrink-0 text-center text-lg font-bold text-[var(--huza-ink)] sm:text-xl">
            {t("farmerRegistration")}
          </h2>

          <fieldset className="mt-2 shrink-0">
            <legend className="sr-only">{t("chooseFarmingType")}</legend>
            <div className="grid grid-cols-3 gap-1.5">
              {typeOptions.map((opt) => {
                const Icon = opt.icon;
                const selected = farmingType === opt.value;
                return (
                  <label
                    key={opt.value}
                    className={`flex min-h-12 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl border px-1 py-2 text-center ${
                      selected
                        ? "border-[var(--huza-green)] bg-[var(--huza-mint)]/70"
                        : "border-[var(--huza-line)]"
                    }`}
                  >
                    <input
                      type="radio"
                      className="sr-only"
                      checked={selected}
                      onChange={() => setFarmingType(opt.value)}
                    />
                    <Icon className="size-4 text-[var(--huza-green-dark)]" />
                    <span className="text-[11px] font-bold leading-tight text-[var(--huza-ink)]">
                      {opt.short}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-3 min-h-0 flex-1 space-y-2.5 overflow-hidden">
            <div>
              <label className="label text-sm">{t("fullNameContact")}</label>
              <input
                name="fullName"
                required
                defaultValue={defaults.fullName || ""}
                className="input-field mt-0.5 min-h-11 text-base"
                autoComplete="name"
              />
            </div>
            <div>
              <label className="label text-sm">{t("phone")}</label>
              <input
                name="phone"
                required
                defaultValue={defaults.phone || ""}
                className="input-field mt-0.5 min-h-11 text-base"
                placeholder="078xxxxxxx"
                inputMode="tel"
                autoComplete="tel"
              />
            </div>
            <div>
              <label className="label text-sm">National ID Number</label>
              <input
                name="nationalId"
                required
                defaultValue={defaults.nationalId || ""}
                className="input-field mt-0.5 min-h-11 text-base"
                inputMode="numeric"
                autoComplete="off"
              />
            </div>

            <button
              type="button"
              onClick={() => setFarmOpen(true)}
              className="flex w-full min-h-11 items-center justify-between rounded-xl border border-dashed border-[var(--huza-green)] bg-[var(--huza-mint)]/40 px-3 text-left text-sm font-semibold text-[var(--huza-green-dark)]"
            >
              <span>
                Farm details{farmRequired ? " *" : " (optional)"}
              </span>
              <span className="text-xs font-bold">Open →</span>
            </button>

            <label className="flex items-start gap-2 text-xs leading-snug sm:text-sm">
              <input
                name="agreedToHuzaTerms"
                type="checkbox"
                required
                className="mt-0.5 size-4 shrink-0 sm:size-5"
              />
              <span>{t("agreeHuzaBuyTerms")}</span>
            </label>

            {error && (
              <p className="rounded-lg bg-red-50 px-2 py-1.5 text-xs text-red-800">{error}</p>
            )}
          </div>

          <div className="mt-2 flex shrink-0 gap-2">
            <Button
              type="button"
              variant="secondary"
              className="min-h-11 shrink-0 px-3"
              onClick={(ev) => saveDraft((ev.currentTarget as HTMLButtonElement).form)}
            >
              Save
            </Button>
            <Button type="submit" className="min-h-11 flex-1 text-base" disabled={loading} size="lg">
              {loading ? t("submitting") : t("submitApplication")}
            </Button>
          </div>

          <p className="mt-2 shrink-0 text-center text-xs text-[var(--huza-muted)]">
            {t("alreadyRegistered")}{" "}
            <Link href="/farmer/login" className="font-bold text-[var(--huza-green-dark)] underline">
              {t("farmerLogin")}
            </Link>
            {" · "}
            <Link href="/farmer" className="text-[var(--huza-muted)]">
              Home
            </Link>
          </p>
        </div>

        {/* Farm sheet — stays in DOM so values submit; only visible when open */}
        <div
          className={
            farmOpen
              ? "fixed inset-0 z-50 flex flex-col bg-black/40"
              : "absolute left-[-9999px] h-0 w-0 overflow-hidden opacity-0"
          }
          aria-hidden={!farmOpen}
        >
          <div className="mt-auto flex max-h-[92dvh] flex-col rounded-t-3xl bg-white shadow-xl sm:mx-auto sm:mt-8 sm:max-h-[85dvh] sm:w-full sm:max-w-lg sm:rounded-3xl">
            <div className="flex shrink-0 items-center justify-between border-b border-[var(--huza-line)] px-4 py-3">
              <h3 className="font-bold text-[var(--huza-ink)]">
                {needsFullDossier ? "Farm details" : "What you sell to HUZA"}
              </h3>
              <button
                type="button"
                className="rounded-full p-2 text-[var(--huza-muted)] hover:bg-[var(--huza-mint)]"
                onClick={() => setFarmOpen(false)}
                aria-label="Close"
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
                      className="input-field min-h-11"
                    />
                  </div>
                  <div>
                    <label className="label">{t("productsOfferedLabel")}</label>
                    <textarea
                      name="productsOffered"
                      defaultValue={defaults.productsOffered || ""}
                      className="input-field min-h-24"
                      placeholder={t("productsOfferedPlaceholder")}
                    />
                  </div>
                  <div>
                    <label className="label">{t("huzaPurchaseAgreementLabel")}</label>
                    <textarea
                      name="huzaPurchaseAgreement"
                      defaultValue={defaults.huzaPurchaseAgreement || ""}
                      className="input-field min-h-24"
                      placeholder={t("huzaPurchaseAgreementPlaceholder")}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="label">{t("farmBusinessName")}</label>
                    <input
                      name="businessName"
                      defaultValue={defaults.businessName || ""}
                      className="input-field min-h-11"
                    />
                  </div>
                  <div>
                    <label className="label">{t("farmLocation")}</label>
                    <input
                      name="location"
                      defaultValue={defaults.location || ""}
                      className="input-field min-h-11"
                    />
                  </div>
                  <div>
                    <label className="label">{t("district")}</label>
                    <input
                      name="district"
                      defaultValue={defaults.district || ""}
                      className="input-field min-h-11"
                    />
                  </div>
                  <div>
                    <label className="label">{t("sector")}</label>
                    <input
                      name="sector"
                      defaultValue={defaults.sector || ""}
                      className="input-field min-h-11"
                    />
                  </div>
                  <div>
                    <label className="label">{t("productCategories")}</label>
                    <input
                      name="productCategories"
                      defaultValue={defaults.productCategories || ""}
                      className="input-field min-h-11"
                    />
                  </div>
                  <div>
                    <label className="label">{t("mobileMoneyNumber")}</label>
                    <input
                      name="paymentMomo"
                      defaultValue={defaults.paymentMomo || ""}
                      className="input-field min-h-11"
                      placeholder="078xxxxxxx"
                      inputMode="tel"
                    />
                  </div>
                  <div>
                    <label className="label">{t("aboutYourFarm")}</label>
                    <textarea
                      name="description"
                      defaultValue={defaults.description || ""}
                      className="input-field min-h-20"
                    />
                  </div>
                  <div>
                    <label className="label">{t("farmSizeOptional")}</label>
                    <input
                      name="farmSize"
                      defaultValue={defaults.farmSize || ""}
                      className="input-field min-h-11"
                    />
                  </div>
                  <div>
                    <label className="label">{t("productionCapacityOptional")}</label>
                    <input
                      name="productionCapacity"
                      defaultValue={defaults.productionCapacity || ""}
                      className="input-field min-h-11"
                    />
                  </div>
                  <div>
                    <label className="label">{t("bankAccountOptional")}</label>
                    <input
                      name="bankAccount"
                      defaultValue={defaults.bankAccount || ""}
                      className="input-field min-h-11"
                    />
                  </div>
                  <div>
                    <label className="label">{t("bankNameOptional")}</label>
                    <input
                      name="bankName"
                      defaultValue={defaults.bankName || ""}
                      className="input-field min-h-11"
                    />
                  </div>
                  <div>
                    <label className="label">{t("tinOptional")}</label>
                    <input
                      name="tin"
                      defaultValue={defaults.tin || ""}
                      className="input-field min-h-11"
                    />
                  </div>
                  <div>
                    <label className="label">{t("nationalIdDocUrl")}</label>
                    <input
                      name="nationalIdUrl"
                      defaultValue={defaults.nationalIdUrl || ""}
                      className="input-field min-h-11"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="label">{t("businessRegUrl")}</label>
                    <input
                      name="businessCertUrl"
                      defaultValue={defaults.businessCertUrl || ""}
                      className="input-field min-h-11"
                    />
                  </div>
                  <div>
                    <label className="label">{t("foodSafetyUrl")}</label>
                    <input
                      name="foodSafetyUrl"
                      defaultValue={defaults.foodSafetyUrl || ""}
                      className="input-field min-h-11"
                    />
                  </div>
                  <div>
                    <label className="label">{t("organicCertUrl")}</label>
                    <input
                      name="organicCertUrl"
                      defaultValue={defaults.organicCertUrl || ""}
                      className="input-field min-h-11"
                    />
                  </div>
                  <div>
                    <label className="label">{t("productPhotoUrls")}</label>
                    <textarea
                      name="productPhotoUrls"
                      defaultValue={defaults.productPhotoUrls || ""}
                      className="input-field min-h-16"
                    />
                  </div>
                  <div>
                    <label className="label">{t("farmPhotoUrls")}</label>
                    <textarea
                      name="farmPhotoUrls"
                      defaultValue={defaults.farmPhotoUrls || ""}
                      className="input-field min-h-16"
                    />
                  </div>
                </>
              )}
            </div>
            {farmOpen && (
              <div className="shrink-0 border-t border-[var(--huza-line)] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                <Button
                  type="button"
                  className="w-full min-h-12"
                  size="lg"
                  onClick={() => setFarmOpen(false)}
                >
                  Done — back to form
                </Button>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
