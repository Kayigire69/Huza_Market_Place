"use client";

import { FormEvent, useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/lib/locale-context";
import { ChevronDown, Leaf, RefreshCw, Sprout } from "lucide-react";

type FarmingTypeChoice = "ORGANIC" | "STANDARD" | "CONVERSION";

const DRAFT_KEY = "huza_farmer_register_draft_v2";

/**
 * Mobile-first one-page registration:
 * - Essentials always above the fold (type, name, phone, NID)
 * - Extra farm/docs in expandable sections (no step wizard, no endless scroll)
 * - Sticky submit bar on small screens
 */
export function FarmerRegisterForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const { t } = useLocale();
  const [farmingType, setFarmingType] = useState<FarmingTypeChoice>("ORGANIC");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [draftNote, setDraftNote] = useState("");
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
        setDraftNote("Draft restored — review and submit when ready.");
      }
    } catch {
      /* ignore */
    }
  }, [sp]);

  const needsFullDossier = farmingType === "ORGANIC" || farmingType === "CONVERSION";

  const saveDraft = (form?: HTMLFormElement | null) => {
    const payload: Record<string, string> = { farmingType };
    if (form) {
      const fd = new FormData(form);
      fd.forEach((v, k) => {
        if (typeof v === "string") payload[k] = v;
      });
    }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
    setDraftNote("Saved on this phone. Come back anytime to finish.");
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        role: "SUPPLIER",
        farmingType,
        agreedToHuzaTerms: form.get("agreedToHuzaTerms") === "on",
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
  };

  const typeOptions: {
    value: FarmingTypeChoice;
    short: string;
    icon: typeof Leaf;
  }[] = [
    { value: "ORGANIC", short: t("organicFarmerPath"), icon: Leaf },
    { value: "CONVERSION", short: t("conversionFarmerPath"), icon: RefreshCw },
    { value: "STANDARD", short: t("standardFarmerPath"), icon: Sprout },
  ];

  return (
    <form
      key={formKey}
      onSubmit={onSubmit}
      className="relative mx-auto mt-4 max-w-lg space-y-4 px-1 pb-28 sm:mt-6 sm:max-w-xl sm:pb-8"
    >
      <div className="rounded-3xl border border-[var(--huza-line)] bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-center text-xl font-bold text-[var(--huza-ink)]">
          {t("farmerRegistration")}
        </h2>
        <p className="mt-1.5 text-center text-sm text-[var(--huza-muted)]">
          Only three things to remember later: your phone and the last 4 digits of your National ID.
        </p>

        {draftNote && (
          <p className="mt-3 rounded-xl bg-[var(--huza-mint)]/50 px-3 py-2 text-xs text-[var(--huza-green-dark)]">
            {draftNote}
          </p>
        )}

        {/* Compact farming type — 3 large taps, short labels */}
        <fieldset className="mt-5">
          <legend className="label text-base">{t("chooseFarmingType")}</legend>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {typeOptions.map((opt) => {
              const Icon = opt.icon;
              const selected = farmingType === opt.value;
              return (
                <label
                  key={opt.value}
                  className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border px-3 py-3 transition sm:flex-col sm:items-start sm:gap-2 sm:py-4 ${
                    selected
                      ? "border-[var(--huza-green)] bg-[var(--huza-mint)]/60 ring-2 ring-[var(--huza-green)]/30"
                      : "border-[var(--huza-line)] active:bg-[var(--huza-mint)]/30"
                  }`}
                >
                  <input
                    type="radio"
                    name="farmingTypeChoice"
                    className="size-5 shrink-0 sm:sr-only"
                    checked={selected}
                    onChange={() => setFarmingType(opt.value)}
                  />
                  <Icon className="size-6 shrink-0 text-[var(--huza-green-dark)]" />
                  <span className="text-sm font-semibold leading-snug text-[var(--huza-ink)]">
                    {opt.short}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {/* Essentials — always visible, short */}
        <section className="mt-6 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--huza-green-dark)]">
            Personal information
          </h3>
          <div>
            <label className="label text-base">{t("fullNameContact")}</label>
            <input
              name="fullName"
              required
              defaultValue={defaults.fullName || ""}
              className="input-field mt-1 min-h-12 text-base"
              autoComplete="name"
            />
          </div>
          <div>
            <label className="label text-base">{t("phone")}</label>
            <input
              name="phone"
              required
              defaultValue={defaults.phone || ""}
              className="input-field mt-1 min-h-12 text-base"
              placeholder="078xxxxxxx"
              inputMode="tel"
              autoComplete="tel"
            />
          </div>
          <div>
            <label className="label text-base">National ID Number</label>
            <input
              name="nationalId"
              required
              defaultValue={defaults.nationalId || ""}
              className="input-field mt-1 min-h-12 text-base"
              inputMode="numeric"
              autoComplete="off"
              placeholder="Full National ID"
            />
            <p className="mt-1 text-xs text-[var(--huza-muted)]">
              You log in with phone + last 4 digits. No password.
            </p>
          </div>
        </section>
      </div>

      {/* Expandable farm block — tap to open, keeps first screen short */}
      {!needsFullDossier && (
        <details
          open
          className="group rounded-3xl border border-[var(--huza-line)] bg-white shadow-sm open:pb-1"
        >
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 font-semibold text-[var(--huza-ink)] [&::-webkit-details-marker]:hidden">
            <span>What you sell to HUZA</span>
            <ChevronDown className="size-5 shrink-0 text-[var(--huza-muted)] transition group-open:rotate-180" />
          </summary>
          <div className="space-y-3 border-t border-[var(--huza-line)] px-4 py-4">
            <div>
              <label className="label">
                {t("farmBusinessName")} ({t("optional")})
              </label>
              <input
                name="businessName"
                defaultValue={defaults.businessName || ""}
                className="input-field min-h-12"
              />
            </div>
            <div>
              <label className="label">{t("productsOfferedLabel")}</label>
              <textarea
                name="productsOffered"
                required
                defaultValue={defaults.productsOffered || ""}
                className="input-field min-h-24"
                placeholder={t("productsOfferedPlaceholder")}
              />
            </div>
            <div>
              <label className="label">{t("huzaPurchaseAgreementLabel")}</label>
              <textarea
                name="huzaPurchaseAgreement"
                required
                defaultValue={defaults.huzaPurchaseAgreement || ""}
                className="input-field min-h-24"
                placeholder={t("huzaPurchaseAgreementPlaceholder")}
              />
              <p className="mt-1 text-xs text-[var(--huza-muted)]">{t("huzaPurchaseAgreementHint")}</p>
            </div>
          </div>
        </details>
      )}

      {needsFullDossier && (
        <>
          <details
            open
            className="group rounded-3xl border border-[var(--huza-line)] bg-white shadow-sm"
          >
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 font-semibold text-[var(--huza-ink)] [&::-webkit-details-marker]:hidden">
              <span>Farm details</span>
              <ChevronDown className="size-5 shrink-0 text-[var(--huza-muted)] transition group-open:rotate-180" />
            </summary>
            <div className="grid gap-3 border-t border-[var(--huza-line)] px-4 py-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label">{t("farmBusinessName")}</label>
                <input
                  name="businessName"
                  required
                  defaultValue={defaults.businessName || ""}
                  className="input-field min-h-12"
                />
              </div>
              <div>
                <label className="label">{t("farmLocation")}</label>
                <input
                  name="location"
                  required
                  defaultValue={defaults.location || ""}
                  className="input-field min-h-12"
                />
              </div>
              <div>
                <label className="label">{t("district")}</label>
                <input
                  name="district"
                  required
                  defaultValue={defaults.district || ""}
                  className="input-field min-h-12"
                />
              </div>
              <div>
                <label className="label">{t("sector")}</label>
                <input
                  name="sector"
                  defaultValue={defaults.sector || ""}
                  className="input-field min-h-12"
                />
              </div>
              <div>
                <label className="label">{t("productCategories")}</label>
                <input
                  name="productCategories"
                  defaultValue={defaults.productCategories || ""}
                  className="input-field min-h-12"
                  placeholder={t("productCategoriesPlaceholder")}
                />
              </div>
              <div>
                <label className="label">{t("farmSizeOptional")}</label>
                <input
                  name="farmSize"
                  defaultValue={defaults.farmSize || ""}
                  className="input-field min-h-12"
                  placeholder={t("sizePlaceholder")}
                />
              </div>
              <div>
                <label className="label">{t("productionCapacityOptional")}</label>
                <input
                  name="productionCapacity"
                  defaultValue={defaults.productionCapacity || ""}
                  className="input-field min-h-12"
                />
              </div>
              <div>
                <label className="label">{t("mobileMoneyNumber")}</label>
                <input
                  name="paymentMomo"
                  defaultValue={defaults.paymentMomo || ""}
                  className="input-field min-h-12"
                  placeholder="078xxxxxxx"
                  inputMode="tel"
                />
              </div>
              <div>
                <label className="label">{t("bankAccountOptional")}</label>
                <input
                  name="bankAccount"
                  defaultValue={defaults.bankAccount || ""}
                  className="input-field min-h-12"
                />
              </div>
              <div>
                <label className="label">{t("bankNameOptional")}</label>
                <input
                  name="bankName"
                  defaultValue={defaults.bankName || ""}
                  className="input-field min-h-12"
                />
              </div>
              <div>
                <label className="label">{t("tinOptional")}</label>
                <input
                  name="tin"
                  defaultValue={defaults.tin || ""}
                  className="input-field min-h-12"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label">{t("aboutYourFarm")}</label>
                <textarea
                  name="description"
                  defaultValue={defaults.description || ""}
                  className="input-field min-h-20"
                />
              </div>
            </div>
          </details>

          <details className="group rounded-3xl border border-[var(--huza-line)] bg-white shadow-sm">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 font-semibold text-[var(--huza-ink)] [&::-webkit-details-marker]:hidden">
              <span>
                Documents <span className="font-normal text-[var(--huza-muted)]">(optional)</span>
              </span>
              <ChevronDown className="size-5 shrink-0 text-[var(--huza-muted)] transition group-open:rotate-180" />
            </summary>
            <div className="grid gap-3 border-t border-[var(--huza-line)] px-4 py-4 sm:grid-cols-2">
              <div>
                <label className="label">{t("nationalIdDocUrl")}</label>
                <input
                  name="nationalIdUrl"
                  defaultValue={defaults.nationalIdUrl || ""}
                  className="input-field min-h-12"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="label">{t("businessRegUrl")}</label>
                <input
                  name="businessCertUrl"
                  defaultValue={defaults.businessCertUrl || ""}
                  className="input-field min-h-12"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="label">{t("foodSafetyUrl")}</label>
                <input
                  name="foodSafetyUrl"
                  defaultValue={defaults.foodSafetyUrl || ""}
                  className="input-field min-h-12"
                />
              </div>
              <div>
                <label className="label">{t("organicCertUrl")}</label>
                <input
                  name="organicCertUrl"
                  defaultValue={defaults.organicCertUrl || ""}
                  className="input-field min-h-12"
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
            </div>
          </details>
        </>
      )}

      <div className="rounded-3xl border border-[var(--huza-line)] bg-white p-4 shadow-sm sm:p-5">
        <label className="flex items-start gap-3 text-sm leading-snug">
          <input name="agreedToHuzaTerms" type="checkbox" required className="mt-0.5 size-5 shrink-0" />
          <span>{t("agreeHuzaBuyTerms")}</span>
        </label>

        {error && (
          <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
        )}

        {/* Desktop actions */}
        <div className="mt-4 hidden gap-2 sm:flex">
          <Button
            type="button"
            variant="ghost"
            onClick={(ev) => saveDraft((ev.currentTarget as HTMLButtonElement).form)}
          >
            Save draft
          </Button>
          <Button type="submit" className="flex-1 min-h-12" disabled={loading} size="lg">
            {loading ? t("submitting") : t("submitApplication")}
          </Button>
        </div>

        <p className="mt-4 text-center text-sm text-[var(--huza-muted)]">
          {t("alreadyRegistered")}{" "}
          <Link
            href="/farmer/login"
            className="font-bold text-[var(--huza-green-dark)] underline underline-offset-4"
          >
            {t("farmerLogin")}
          </Link>
        </p>
        <p className="mt-2 text-center text-sm">
          <Link href="/farmer" className="font-semibold text-[var(--huza-green-dark)]">
            ← Farmers Portal home
          </Link>
        </p>
      </div>

      {/* Mobile sticky submit — always reachable without scrolling to end */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--huza-line)] bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-lg gap-2">
          <Button
            type="button"
            variant="secondary"
            className="min-h-12 shrink-0 px-3"
            onClick={(ev) => saveDraft((ev.currentTarget as HTMLButtonElement).form)}
          >
            Save
          </Button>
          <Button type="submit" className="min-h-12 flex-1 text-base" disabled={loading} size="lg">
            {loading ? t("submitting") : t("submitApplication")}
          </Button>
        </div>
      </div>
    </form>
  );
}
