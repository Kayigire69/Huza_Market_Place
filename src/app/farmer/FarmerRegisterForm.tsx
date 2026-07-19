"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/lib/locale-context";
import { Leaf, RefreshCw, Sprout } from "lucide-react";

type FarmingTypeChoice = "ORGANIC" | "STANDARD" | "CONVERSION" | null;

const DRAFT_KEY = "huza_farmer_register_draft_v1";

/**
 * Dual/triple farmer registration — all existing fields preserved.
 * Progress steps + local draft for save & continue later.
 */
export function FarmerRegisterForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const { t } = useLocale();
  const [farmingType, setFarmingType] = useState<FarmingTypeChoice>(null);
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [draftNote, setDraftNote] = useState("");

  useEffect(() => {
    const q = sp.get("type");
    if (q === "ORGANIC" || q === "STANDARD" || q === "CONVERSION") {
      setFarmingType(q);
    }
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw) as { farmingType?: FarmingTypeChoice; step?: number };
        if (d.farmingType) setFarmingType(d.farmingType);
        if (d.step) setStep(d.step);
        setDraftNote("Draft restored — you can continue.");
      }
    } catch {
      /* ignore */
    }
  }, [sp]);

  const needsFullDossier = farmingType === "ORGANIC" || farmingType === "CONVERSION";
  const totalSteps = needsFullDossier ? 3 : 2;

  const progressPct = useMemo(() => {
    if (!farmingType) return 0;
    return Math.round((step / totalSteps) * 100);
  }, [farmingType, step, totalSteps]);

  const saveDraft = (form?: HTMLFormElement | null) => {
    if (!farmingType) return;
    const payload: Record<string, string> = { farmingType, step: String(step) };
    if (form) {
      const fd = new FormData(form);
      fd.forEach((v, k) => {
        if (typeof v === "string") payload[k] = v;
      });
    }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
    setDraftNote("Saved on this phone/browser. Come back later to continue.");
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!farmingType) {
      setError(t("selectFarmingType"));
      return;
    }
    if (needsFullDossier && step < 3) {
      saveDraft(e.currentTarget);
      setStep((s) => Math.min(3, s + 1));
      return;
    }
    if (!needsFullDossier && step < 2) {
      saveDraft(e.currentTarget);
      setStep(2);
      return;
    }

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

  if (!farmingType) {
    return (
      <div className="mt-8 space-y-4 rounded-2xl border border-[var(--huza-line)] bg-white p-6">
        <h2 className="text-center text-lg font-semibold">{t("farmerRegistration")}</h2>
        <p className="text-center text-sm text-[var(--huza-muted)]">
          Or go back to the portal home to read how Youth Huza supports farmers first.
        </p>
        <div className="grid gap-3 text-left">
          <button
            type="button"
            onClick={() => setFarmingType("ORGANIC")}
            className="rounded-2xl border border-[var(--huza-line)] p-5 text-left transition hover:border-[var(--huza-green)] hover:bg-[var(--huza-mint)]"
          >
            <Leaf className="size-7 text-[var(--huza-green-dark)]" />
            <p className="mt-3 font-semibold">{t("organicFarmerPath")}</p>
            <p className="mt-2 text-xs leading-relaxed text-[var(--huza-muted)]">
              {t("organicFarmerPathHint")}
            </p>
          </button>
          <button
            type="button"
            onClick={() => setFarmingType("CONVERSION")}
            className="rounded-2xl border border-[var(--huza-line)] p-5 text-left transition hover:border-[var(--huza-green)] hover:bg-[var(--huza-mint)]"
          >
            <RefreshCw className="size-7 text-[var(--huza-green-dark)]" />
            <p className="mt-3 font-semibold">In Organic Conversion</p>
            <p className="mt-2 text-xs leading-relaxed text-[var(--huza-muted)]">
              Moving toward organic — same careful registration, with Huza support on the journey.
            </p>
          </button>
          <button
            type="button"
            onClick={() => setFarmingType("STANDARD")}
            className="rounded-2xl border border-[var(--huza-line)] p-5 text-left transition hover:border-[var(--huza-green)] hover:bg-[var(--huza-mint)]"
          >
            <Sprout className="size-7 text-[var(--huza-green-dark)]" />
            <p className="mt-3 font-semibold">{t("standardFarmerPath")}</p>
            <p className="mt-2 text-xs leading-relaxed text-[var(--huza-muted)]">
              {t("standardFarmerPathHint")}
            </p>
          </button>
        </div>
        <p className="text-center text-sm text-[var(--huza-muted)]">
          {t("alreadyRegistered")}{" "}
          <Link
            href="/farmer/login"
            className="font-bold text-[var(--huza-green-dark)] underline decoration-[var(--huza-green)] underline-offset-4"
          >
            {t("farmerLogin")}
          </Link>
        </p>
      </div>
    );
  }

  const title =
    farmingType === "STANDARD"
      ? t("standardFarmerPath")
      : farmingType === "CONVERSION"
        ? "In Organic Conversion"
        : t("organicFarmerPath");

  return (
    <form
      onSubmit={onSubmit}
      className="mt-8 space-y-4 rounded-2xl border border-[var(--huza-line)] bg-white p-6 text-left"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="mt-1 text-xs text-[var(--huza-muted)]">
            Step {step} of {totalSteps}
          </p>
        </div>
        <button
          type="button"
          className="text-xs font-bold text-[var(--huza-green-dark)]"
          onClick={() => {
            setFarmingType(null);
            setStep(1);
          }}
        >
          {t("changeFarmingType")}
        </button>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-[var(--huza-mint)]">
        <div
          className="h-full rounded-full bg-[var(--huza-green)] transition-all"
          style={{ width: `${progressPct}%` }}
        />
      </div>
      {draftNote && <p className="text-xs text-[var(--huza-green-dark)]">{draftNote}</p>}

      {/* Step 1 — identity (all types) — keep mounted for final submit */}
      <div className={`grid gap-3 sm:grid-cols-2 ${step === 1 ? "" : "hidden"}`}>
        <div>
          <label className="label">{t("fullNameContact")}</label>
          <input name="fullName" required={step === 1} className="input-field" />
        </div>
        <div>
          <label className="label">National ID Number</label>
          <input
            name="nationalId"
            required={step === 1}
            className="input-field min-h-12 text-base"
            inputMode="numeric"
            autoComplete="off"
            placeholder="Full National ID"
          />
          <p className="mt-1 text-xs text-[var(--huza-muted)]">
            You will log in with your phone and the last 4 digits of this ID. No password needed.
          </p>
        </div>
        <div>
          <label className="label">{t("phone")}</label>
          <input
            name="phone"
            required={step === 1}
            className="input-field min-h-12 text-base"
            placeholder="078xxxxxxx"
            inputMode="tel"
            autoComplete="tel"
          />
        </div>
        {!needsFullDossier && (
          <div className="sm:col-span-2">
            <label className="label">
              {t("farmBusinessName")} ({t("optional")})
            </label>
            <input name="businessName" className="input-field" />
          </div>
        )}
      </div>

      {/* Standard step 2 */}
      {!needsFullDossier && (
        <div className={step === 2 ? "space-y-4" : "hidden"}>
          <div>
            <label className="label">{t("productsOfferedLabel")}</label>
            <textarea
              name="productsOffered"
              required={step === 2}
              className="input-field min-h-24"
              placeholder={t("productsOfferedPlaceholder")}
            />
          </div>
          <div>
            <label className="label">{t("huzaPurchaseAgreementLabel")}</label>
            <textarea
              name="huzaPurchaseAgreement"
              required={step === 2}
              className="input-field min-h-28"
              placeholder={t("huzaPurchaseAgreementPlaceholder")}
            />
            <p className="mt-1 text-xs text-[var(--huza-muted)]">{t("huzaPurchaseAgreementHint")}</p>
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input name="agreedToHuzaTerms" type="checkbox" required={step === 2} className="mt-1" />
            <span>{t("agreeHuzaBuyTerms")}</span>
          </label>
        </div>
      )}

      {/* Organic/Conversion step 2 — farm */}
      {needsFullDossier && (
        <div className={`grid gap-3 sm:grid-cols-2 ${step === 2 ? "" : "hidden"}`}>
          <div>
            <label className="label">{t("farmBusinessName")}</label>
            <input name="businessName" required={step === 2} className="input-field" />
          </div>
          <div>
            <label className="label">{t("farmLocation")}</label>
            <input name="location" required={step === 2} className="input-field" />
          </div>
          <div>
            <label className="label">{t("district")}</label>
            <input name="district" required={step === 2} className="input-field" />
          </div>
          <div>
            <label className="label">{t("sector")}</label>
            <input name="sector" className="input-field" />
          </div>
          <div>
            <label className="label">{t("productCategories")}</label>
            <input
              name="productCategories"
              className="input-field"
              placeholder={t("productCategoriesPlaceholder")}
            />
          </div>
          <div>
            <label className="label">{t("farmSizeOptional")}</label>
            <input name="farmSize" className="input-field" placeholder={t("sizePlaceholder")} />
          </div>
          <div>
            <label className="label">{t("productionCapacityOptional")}</label>
            <input name="productionCapacity" className="input-field" />
          </div>
          <div>
            <label className="label">{t("mobileMoneyNumber")}</label>
            <input name="paymentMomo" className="input-field" placeholder="078xxxxxxx" />
          </div>
          <div>
            <label className="label">{t("bankAccountOptional")}</label>
            <input name="bankAccount" className="input-field" />
          </div>
          <div>
            <label className="label">{t("bankNameOptional")}</label>
            <input name="bankName" className="input-field" />
          </div>
          <div>
            <label className="label">{t("tinOptional")}</label>
            <input name="tin" className="input-field" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">{t("aboutYourFarm")}</label>
            <textarea name="description" className="input-field min-h-20" />
          </div>
        </div>
      )}

      {/* Organic/Conversion step 3 — documents */}
      {needsFullDossier && (
        <div className={step === 3 ? "space-y-4" : "hidden"}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">{t("nationalIdDocUrl")}</label>
              <input name="nationalIdUrl" className="input-field" placeholder="https://..." />
            </div>
            <div>
              <label className="label">{t("businessRegUrl")}</label>
              <input name="businessCertUrl" className="input-field" placeholder="https://..." />
            </div>
            <div>
              <label className="label">{t("foodSafetyUrl")}</label>
              <input name="foodSafetyUrl" className="input-field" />
            </div>
            <div>
              <label className="label">{t("organicCertUrl")}</label>
              <input name="organicCertUrl" className="input-field" />
            </div>
            <div>
              <label className="label">{t("productPhotoUrls")}</label>
              <textarea name="productPhotoUrls" className="input-field min-h-16" />
            </div>
            <div>
              <label className="label">{t("farmPhotoUrls")}</label>
              <textarea name="farmPhotoUrls" className="input-field min-h-16" />
            </div>
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input name="agreedToHuzaTerms" type="checkbox" required={step === 3} className="mt-1" />
            <span>{t("agreeHuzaBuyTerms")}</span>
          </label>
        </div>
      )}

      {error && <p className="text-sm text-red-700">{error}</p>}

      <div className="flex flex-col gap-2 sm:flex-row">
        {step > 1 && (
          <Button
            type="button"
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
          >
            Back
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          className="w-full sm:w-auto"
          onClick={(ev) => saveDraft((ev.currentTarget as HTMLButtonElement).form)}
        >
          Save & continue later
        </Button>
        <Button type="submit" className="w-full flex-1" disabled={loading} size="lg">
          {loading
            ? t("submitting")
            : step < totalSteps
              ? "Continue"
              : t("submitApplication")}
        </Button>
      </div>

      <p className="text-center text-sm text-[var(--huza-muted)]">
        {t("alreadyRegistered")}{" "}
        <Link
          href="/farmer/login"
          className="font-bold text-[var(--huza-green-dark)] underline decoration-[var(--huza-green)] underline-offset-4"
        >
          {t("farmerLogin")}
        </Link>
      </p>
    </form>
  );
}
