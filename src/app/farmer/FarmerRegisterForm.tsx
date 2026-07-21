"use client";

import { FormEvent, useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/lib/locale-context";
import {
  AGE_RANGES,
  FIELD_TYPES,
  GENDERS,
  PAYMENT_OPTIONS,
  PRICE_UNITS,
  QUALITY_LEVELS,
  RWANDA_PROVINCES,
} from "@/lib/farmer-dossier";
import {
  ageLabelKey,
  fieldTypeLabelKey,
  genderLabelKey,
  paymentLabelKey,
  provinceLabelKey,
  qualityLabelKey,
} from "@/lib/i18n";
import { OptimizedImage } from "@/components/media/OptimizedImage";

/** Always Conventional Farming for startup-phase registration (no UI choice). */
const FARMING_TYPE = "STANDARD" as const;

const DRAFT_KEY = "huza_farmer_register_draft_v5";

async function uploadOne(file: File, folder: string): Promise<string> {
  const form = new FormData();
  form.append("files", file);
  form.append("folder", folder);
  const res = await fetch("/api/uploads", { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Upload failed");
  return data.urls[0] as string;
}

/**
 * Farmer registration: identity for login + full farm dossier (same fields as the portal dossier).
 * Farming type is fixed to Conventional internally.
 */
export function FarmerRegisterForm() {
  const router = useRouter();
  const { t } = useLocale();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [defaults, setDefaults] = useState<Record<string, string>>({});
  const [formKey, setFormKey] = useState(0);
  const [photoUrl, setPhotoUrl] = useState("");
  const [proofUrl, setProofUrl] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw) as Record<string, string>;
        setDefaults(d);
        if (d.profilePhotoUrl) setPhotoUrl(d.profilePhotoUrl);
        if (d.proofOfPaymentUrl) setProofUrl(d.proofOfPaymentUrl);
        setFormKey((k) => k + 1);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const saveDraft = (form?: HTMLFormElement | null) => {
    const payload: Record<string, string> = {
      farmingType: FARMING_TYPE,
      profilePhotoUrl: photoUrl,
      proofOfPaymentUrl: proofUrl,
    };
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
      const photo = fd.get("profilePhoto");
      const proof = fd.get("proofOfPayment");
      let profilePhotoUrl = photoUrl;
      let proofOfPaymentUrl = proofUrl;
      if (photo instanceof File && photo.size > 0) {
        profilePhotoUrl = await uploadOne(photo, "profiles");
        setPhotoUrl(profilePhotoUrl);
      }
      if (proof instanceof File && proof.size > 0) {
        proofOfPaymentUrl = await uploadOne(proof, "documents");
        setProofUrl(proofOfPaymentUrl);
      }

      const payload = Object.fromEntries(
        [...fd.entries()].filter(([, v]) => typeof v === "string")
      ) as Record<string, string>;

      const currentCrop = String(payload.currentCrop || "").trim();
      const paymentOpt = PAYMENT_OPTIONS.find((p) => p.value === payload.paymentOption);
      const agreement =
        String(payload.huzaPurchaseAgreement || "").trim() ||
        [
          paymentOpt ? `Preferred payment: ${paymentOpt.label}` : "",
          payload.farmerComments?.trim() || "",
        ]
          .filter(Boolean)
          .join(". ");

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          role: "SUPPLIER",
          farmingType: FARMING_TYPE,
          profilePhotoUrl,
          proofOfPaymentUrl,
          productsOffered: currentCrop || payload.productsOffered,
          huzaPurchaseAgreement: agreement,
          pricePerUnit: payload.pricePerUnit ? Number(payload.pricePerUnit) : null,
          totalKgsBoughtByHuza: payload.totalKgsBoughtByHuza
            ? Number(payload.totalKgsBoughtByHuza)
            : 0,
          farmGatePrice: payload.farmGatePrice ? Number(payload.farmGatePrice) : null,
          priceUponDelivery: payload.priceUponDelivery
            ? Number(payload.priceUponDelivery)
            : null,
          priceAfterSale: payload.priceAfterSale ? Number(payload.priceAfterSale) : null,
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

          {/* Login identity — used for phone + last 4 of National ID */}
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
          </div>

          <div className="mt-5 space-y-4">
            <h3 className="text-sm font-bold text-[var(--huza-green-dark)]">
              {t("farmDetailsRequired")}
            </h3>

            {/* Personal information (dossier) */}
            <section className="space-y-3 rounded-xl border border-[var(--huza-line)] bg-[var(--huza-mint)]/15 p-4">
              <h4 className="font-semibold text-[var(--huza-ink)]">{t("farmerPersonalInfo")}</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="label">{t("picture")}</label>
                  <input name="profilePhoto" type="file" accept="image/*" className="input-field mt-1" />
                  {photoUrl ? (
                    <div className="relative mt-2 h-20 w-20 overflow-hidden rounded-full">
                      <OptimizedImage
                        src={photoUrl}
                        alt="Profile"
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>
                  ) : null}
                  <input type="hidden" name="profilePhotoUrl" value={photoUrl} />
                </div>
                <div>
                  <label className="label">{t("farmBusinessName")}</label>
                  <input
                    name="businessName"
                    required
                    defaultValue={d("businessName")}
                    className="input-field mt-1 h-11"
                  />
                </div>
                <div>
                  <label className="label">{t("gender")}</label>
                  <select name="gender" required defaultValue={d("gender")} className="input-field mt-1 h-11">
                    <option value="">{t("select")}</option>
                    {GENDERS.map((g) => (
                      <option key={g} value={g}>
                        {t(genderLabelKey[g])}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">{t("ageRange")}</label>
                  <select
                    name="ageRange"
                    required
                    defaultValue={d("ageRange")}
                    className="input-field mt-1 h-11"
                  >
                    <option value="">{t("select")}</option>
                    {AGE_RANGES.map((a) => (
                      <option key={a} value={a}>
                        {t(ageLabelKey[a])}
                      </option>
                    ))}
                  </select>
                </div>
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
                <div>
                  <label className="label">{t("village")}</label>
                  <input
                    name="village"
                    required
                    defaultValue={d("village")}
                    className="input-field mt-1 h-11"
                  />
                </div>
              </div>
            </section>

            {/* Field information */}
            <section className="space-y-3 rounded-xl border border-[var(--huza-line)] bg-white p-4">
              <h4 className="font-semibold text-[var(--huza-ink)]">{t("fieldInformation")}</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">{t("greenhouseOrOpen")}</label>
                  <select
                    name="fieldType"
                    required
                    defaultValue={d("fieldType")}
                    className="input-field mt-1 h-11"
                  >
                    <option value="">{t("select")}</option>
                    {FIELD_TYPES.map((f) => (
                      <option key={f} value={f}>
                        {t(fieldTypeLabelKey[f])}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">{t("size")}</label>
                  <input
                    name="farmSize"
                    required
                    defaultValue={d("farmSize")}
                    className="input-field mt-1 h-11"
                    placeholder={t("sizePlaceholder")}
                  />
                </div>
                <div>
                  <label className="label">{t("pastCrops1")}</label>
                  <input
                    name="pastCropsSeason1"
                    defaultValue={d("pastCropsSeason1")}
                    className="input-field mt-1 h-11"
                  />
                </div>
                <div>
                  <label className="label">{t("pastCrops2")}</label>
                  <input
                    name="pastCropsSeason2"
                    defaultValue={d("pastCropsSeason2")}
                    className="input-field mt-1 h-11"
                  />
                </div>
                <div>
                  <label className="label">{t("pastCrops3")}</label>
                  <input
                    name="pastCropsSeason3"
                    defaultValue={d("pastCropsSeason3")}
                    className="input-field mt-1 h-11"
                  />
                </div>
                <div>
                  <label className="label">{t("currentCrop")}</label>
                  <input
                    name="currentCrop"
                    required
                    defaultValue={d("currentCrop")}
                    className="input-field mt-1 h-11"
                  />
                </div>
                <div>
                  <label className="label">{t("chemicalsPerWeek")}</label>
                  <input
                    name="chemicalsPerWeek"
                    defaultValue={d("chemicalsPerWeek")}
                    className="input-field mt-1 h-11"
                  />
                </div>
                <div>
                  <label className="label">{t("chemicalsWhy")}</label>
                  <input
                    name="chemicalsWhy"
                    defaultValue={d("chemicalsWhy")}
                    className="input-field mt-1 h-11"
                  />
                </div>
                <div>
                  <label className="label">{t("dosage")}</label>
                  <input
                    name="chemicalsDosage"
                    defaultValue={d("chemicalsDosage")}
                    className="input-field mt-1 h-11"
                  />
                </div>
                <div>
                  <label className="label">{t("fertilizerPerWeek")}</label>
                  <input
                    name="fertilizerPerWeek"
                    defaultValue={d("fertilizerPerWeek")}
                    className="input-field mt-1 h-11"
                  />
                </div>
                <div>
                  <label className="label">{t("irrigationMethod")}</label>
                  <input
                    name="irrigationMethod"
                    defaultValue={d("irrigationMethod")}
                    className="input-field mt-1 h-11"
                  />
                </div>
                <div>
                  <label className="label">{t("diseasesIdentified")}</label>
                  <input
                    name="diseasesIdentified"
                    defaultValue={d("diseasesIdentified")}
                    className="input-field mt-1 h-11"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">{t("pestsIdentified")}</label>
                  <input
                    name="pestsIdentified"
                    defaultValue={d("pestsIdentified")}
                    className="input-field mt-1 h-11"
                  />
                </div>
              </div>
            </section>

            {/* Production */}
            <section className="space-y-3 rounded-xl border border-[var(--huza-line)] bg-white p-4">
              <h4 className="font-semibold text-[var(--huza-ink)]">{t("productionInformation")}</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">{t("totalQuantityHarvested")}</label>
                  <input
                    name="totalQuantityHarvested"
                    required
                    defaultValue={d("totalQuantityHarvested")}
                    className="input-field mt-1 h-11"
                    placeholder={t("harvestPlaceholder")}
                  />
                </div>
                <div>
                  <label className="label">{t("qualityInGeneral")}</label>
                  <select
                    name="qualityGeneral"
                    required
                    defaultValue={d("qualityGeneral")}
                    className="input-field mt-1 h-11"
                  >
                    <option value="">{t("select")}</option>
                    {QUALITY_LEVELS.map((q) => (
                      <option key={q} value={q}>
                        {t(qualityLabelKey[q])}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* Sales */}
            <section className="space-y-3 rounded-xl border border-[var(--huza-line)] bg-white p-4">
              <h4 className="font-semibold text-[var(--huza-ink)]">{t("sales")}</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">{t("priceUnit")}</label>
                  <select
                    name="priceUnit"
                    defaultValue={d("priceUnit") || "kg"}
                    className="input-field mt-1 h-11"
                  >
                    {PRICE_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">{t("pricePerUnit")}</label>
                  <input
                    name="pricePerUnit"
                    type="number"
                    required
                    defaultValue={d("pricePerUnit")}
                    className="input-field mt-1 h-11"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">{t("totalKgsBoughtByHuza")}</label>
                  <input
                    name="totalKgsBoughtByHuza"
                    type="number"
                    step="0.1"
                    defaultValue={d("totalKgsBoughtByHuza") || "0"}
                    className="input-field mt-1 h-11"
                  />
                </div>
              </div>
            </section>

            {/* Payment options */}
            <section className="space-y-3 rounded-xl border border-[var(--huza-line)] bg-white p-4">
              <h4 className="font-semibold text-[var(--huza-ink)]">{t("paymentOptions")}</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="label">{t("preferredPayment")}</label>
                  <select
                    name="paymentOption"
                    required
                    defaultValue={d("paymentOption")}
                    className="input-field mt-1 h-11"
                  >
                    <option value="">{t("select")}</option>
                    {PAYMENT_OPTIONS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {t(paymentLabelKey[p.value])}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">{t("farmGatePrice")}</label>
                  <input
                    name="farmGatePrice"
                    type="number"
                    defaultValue={d("farmGatePrice")}
                    className="input-field mt-1 h-11"
                  />
                </div>
                <div>
                  <label className="label">{t("priceUponDelivery")}</label>
                  <input
                    name="priceUponDelivery"
                    type="number"
                    defaultValue={d("priceUponDelivery")}
                    className="input-field mt-1 h-11"
                  />
                </div>
                <div>
                  <label className="label">{t("priceAfterSale")}</label>
                  <input
                    name="priceAfterSale"
                    type="number"
                    defaultValue={d("priceAfterSale")}
                    className="input-field mt-1 h-11"
                  />
                </div>
                <div>
                  <label className="label">{t("proofOfPayment")}</label>
                  <input
                    name="proofOfPayment"
                    type="file"
                    accept="image/*,application/pdf"
                    className="input-field mt-1"
                  />
                  {proofUrl ? (
                    <a
                      href={proofUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-block text-xs text-[var(--huza-green)] underline"
                    >
                      {t("viewAttachedProof")}
                    </a>
                  ) : null}
                  <input type="hidden" name="proofOfPaymentUrl" value={proofUrl} />
                </div>
                <div>
                  <label className="label">{t("mobileMoneyNumber")}</label>
                  <input
                    name="paymentMomo"
                    defaultValue={d("paymentMomo")}
                    className="input-field mt-1 h-11"
                    placeholder="078xxxxxxx"
                  />
                </div>
                <div>
                  <label className="label">{t("bankAccountOptional")}</label>
                  <input
                    name="bankAccount"
                    defaultValue={d("bankAccount")}
                    className="input-field mt-1 h-11"
                  />
                </div>
                <div>
                  <label className="label">{t("bankNameOptional")}</label>
                  <input
                    name="bankName"
                    defaultValue={d("bankName")}
                    className="input-field mt-1 h-11"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">{t("huzaPurchaseAgreementLabel")}</label>
                  <textarea
                    name="huzaPurchaseAgreement"
                    required
                    defaultValue={d("huzaPurchaseAgreement")}
                    className="input-field mt-1 min-h-20"
                    placeholder={t("huzaPurchaseAgreementPlaceholder")}
                  />
                </div>
              </div>
            </section>

            {/* Comments */}
            <section className="space-y-3 rounded-xl border border-[var(--huza-line)] bg-white p-4">
              <h4 className="font-semibold text-[var(--huza-ink)]">{t("comments")}</h4>
              <textarea
                name="farmerComments"
                defaultValue={d("farmerComments")}
                className="input-field min-h-24"
                placeholder={t("farmerCommentsPlaceholder")}
              />
            </section>
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
        </div>
      </form>
    </div>
  );
}
