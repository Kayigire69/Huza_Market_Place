"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/lib/locale-context";
import { Leaf, Sprout } from "lucide-react";

type FarmingTypeChoice = "ORGANIC" | "STANDARD" | null;

/**
 * Dual farmer registration on the same portal:
 * - ORGANIC: full application (docs, farm details, organic cert)
 * - STANDARD: name, national ID, products offered, Huza purchase agreement only
 */
export function FarmerRegisterForm() {
  const router = useRouter();
  const { t } = useLocale();
  const [farmingType, setFarmingType] = useState<FarmingTypeChoice>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!farmingType) {
      setError(t("selectFarmingType"));
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
    await signIn("credentials", {
      phoneOrEmail: String(payload.phone),
      password: String(payload.password),
      redirect: false,
    });
    setLoading(false);
    router.push("/farmer");
    router.refresh();
  };

  if (!farmingType) {
    return (
      <div className="mt-8 space-y-4 rounded-2xl border border-[var(--huza-line)] bg-white p-6 text-left">
        <h2 className="font-semibold text-lg">{t("farmerRegistration")}</h2>
        <p className="text-sm text-[var(--huza-muted)]">{t("farmingTypeChooserHint")}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setFarmingType("ORGANIC")}
            className="rounded-2xl border border-[var(--huza-line)] p-5 text-left transition hover:border-[var(--huza-green)] hover:bg-[var(--huza-mint)]"
          >
            <Leaf className="size-7 text-[var(--huza-green)]" />
            <p className="mt-3 font-semibold">{t("organicFarmerPath")}</p>
            <p className="mt-2 text-xs text-[var(--huza-muted)] leading-relaxed">
              {t("organicFarmerPathHint")}
            </p>
          </button>
          <button
            type="button"
            onClick={() => setFarmingType("STANDARD")}
            className="rounded-2xl border border-[var(--huza-line)] p-5 text-left transition hover:border-[var(--huza-green)] hover:bg-[var(--huza-mint)]"
          >
            <Sprout className="size-7 text-[var(--huza-green)]" />
            <p className="mt-3 font-semibold">{t("standardFarmerPath")}</p>
            <p className="mt-2 text-xs text-[var(--huza-muted)] leading-relaxed">
              {t("standardFarmerPathHint")}
            </p>
          </button>
        </div>
        <p className="text-center text-sm text-[var(--huza-muted)]">
          {t("alreadyRegistered")}{" "}
          <Link href="/auth/login?callbackUrl=/farmer" className="font-semibold text-[var(--huza-green)]">
            {t("farmerLogin")}
          </Link>
        </p>
      </div>
    );
  }

  const isOrganic = farmingType === "ORGANIC";

  return (
    <form
      onSubmit={onSubmit}
      className="mt-8 space-y-4 rounded-2xl border border-[var(--huza-line)] bg-white p-6 text-left"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-semibold text-lg">
            {isOrganic ? t("organicFarmerPath") : t("standardFarmerPath")}
          </h2>
          <p className="text-xs text-[var(--huza-muted)] mt-1">
            {isOrganic ? t("farmerRegistrationHint") : t("standardRegistrationHint")}
          </p>
        </div>
        <button
          type="button"
          className="text-xs font-semibold text-[var(--huza-green)]"
          onClick={() => setFarmingType(null)}
        >
          {t("changeFarmingType")}
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">{t("fullNameContact")}</label>
          <input name="fullName" required className="input-field" />
        </div>
        <div>
          <label className="label">{t("nationalIdOrReg")}</label>
          <input name="nationalId" required className="input-field" />
        </div>
        <div>
          <label className="label">{t("phone")}</label>
          <input name="phone" required className="input-field" placeholder="078xxxxxxx" />
        </div>
        <div>
          <label className="label">{t("password")}</label>
          <input name="password" type="password" required minLength={6} className="input-field" />
        </div>
        {!isOrganic && (
          <div className="sm:col-span-2">
            <label className="label">{t("farmBusinessName")} ({t("optional")})</label>
            <input name="businessName" className="input-field" />
          </div>
        )}
        {isOrganic && (
          <>
            <div>
              <label className="label">{t("farmBusinessName")}</label>
              <input name="businessName" required className="input-field" />
            </div>
            <div>
              <label className="label">{t("emailOptional")}</label>
              <input name="email" type="email" className="input-field" />
            </div>
            <div>
              <label className="label">{t("farmLocation")}</label>
              <input name="location" required className="input-field" />
            </div>
            <div>
              <label className="label">{t("district")}</label>
              <input name="district" required className="input-field" />
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
          </>
        )}
      </div>

      {!isOrganic && (
        <>
          <div>
            <label className="label">{t("productsOfferedLabel")}</label>
            <textarea
              name="productsOffered"
              required
              className="input-field min-h-24"
              placeholder={t("productsOfferedPlaceholder")}
            />
          </div>
          <div>
            <label className="label">{t("huzaPurchaseAgreementLabel")}</label>
            <textarea
              name="huzaPurchaseAgreement"
              required
              className="input-field min-h-28"
              placeholder={t("huzaPurchaseAgreementPlaceholder")}
            />
            <p className="mt-1 text-xs text-[var(--huza-muted)]">{t("huzaPurchaseAgreementHint")}</p>
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input name="agreedToHuzaTerms" type="checkbox" required className="mt-1" />
            <span>{t("agreeHuzaBuyTerms")}</span>
          </label>
        </>
      )}

      {isOrganic && (
        <>
          <div>
            <label className="label">{t("aboutYourFarm")}</label>
            <textarea name="description" className="input-field min-h-20" />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
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
            <input name="agreedToHuzaTerms" type="checkbox" required className="mt-1" />
            <span>{t("agreeHuzaBuyTerms")}</span>
          </label>
        </>
      )}

      {error && <p className="text-sm text-red-700">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? t("submitting") : t("submitApplication")}
      </Button>
      <p className="text-center text-sm text-[var(--huza-muted)]">
        {t("alreadyRegistered")}{" "}
        <Link href="/auth/login?callbackUrl=/farmer" className="font-semibold text-[var(--huza-green)]">
          {t("farmerLogin")}
        </Link>
      </p>
    </form>
  );
}
