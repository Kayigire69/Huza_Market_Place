"use client";

import { FormEvent, useState } from "react";
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
import { useLocale } from "@/lib/locale-context";
import { Button } from "@/components/ui/Button";
import { OptimizedImage } from "@/components/media/OptimizedImage";
import { maskNationalId } from "@/lib/farmer-id";

export type FarmerDossierValues = {
  profilePhotoUrl?: string | null;
  businessName?: string | null;
  fullName?: string | null;
  nationalId?: string | null;
  gender?: string | null;
  phone?: string | null;
  province?: string | null;
  district?: string | null;
  sector?: string | null;
  cell?: string | null;
  village?: string | null;
  ageRange?: string | null;
  fieldType?: string | null;
  farmSize?: string | null;
  pastCropsSeason1?: string | null;
  pastCropsSeason2?: string | null;
  pastCropsSeason3?: string | null;
  currentCrop?: string | null;
  chemicalsPerWeek?: string | null;
  chemicalsWhy?: string | null;
  chemicalsDosage?: string | null;
  fertilizerPerWeek?: string | null;
  irrigationMethod?: string | null;
  diseasesIdentified?: string | null;
  pestsIdentified?: string | null;
  totalQuantityHarvested?: string | null;
  qualityGeneral?: string | null;
  priceUnit?: string | null;
  pricePerUnit?: number | null;
  totalKgsBoughtByHuza?: number | null;
  paymentOption?: string | null;
  farmGatePrice?: number | null;
  priceUponDelivery?: number | null;
  priceAfterSale?: number | null;
  proofOfPaymentUrl?: string | null;
  farmerComments?: string | null;
  paymentMomo?: string | null;
  bankAccount?: string | null;
  bankName?: string | null;
  productsOffered?: string | null;
  huzaPurchaseAgreement?: string | null;
};

async function uploadOne(file: File, folder: string): Promise<string> {
  const form = new FormData();
  form.append("files", file);
  form.append("folder", folder);
  const res = await fetch("/api/uploads", { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Upload failed");
  return data.urls[0] as string;
}

export function FarmerDossierForm({
  initial,
  onSaved,
}: {
  initial: FarmerDossierValues;
  onSaved?: () => void;
}) {
  const { t } = useLocale();
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(initial.profilePhotoUrl || "");
  const [proofUrl, setProofUrl] = useState(initial.proofOfPaymentUrl || "");

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const form = new FormData(e.currentTarget);
      const photo = form.get("profilePhoto");
      const proof = form.get("proofOfPayment");
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

      const payload = Object.fromEntries(form.entries());
      delete payload.profilePhoto;
      delete payload.proofOfPayment;

      const res = await fetch("/api/supplier/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          profilePhotoUrl,
          proofOfPaymentUrl,
          pricePerUnit: payload.pricePerUnit ? Number(payload.pricePerUnit) : null,
          totalKgsBoughtByHuza: payload.totalKgsBoughtByHuza
            ? Number(payload.totalKgsBoughtByHuza)
            : 0,
          farmGatePrice: payload.farmGatePrice ? Number(payload.farmGatePrice) : null,
          priceUponDelivery: payload.priceUponDelivery
            ? Number(payload.priceUponDelivery)
            : null,
          priceAfterSale: payload.priceAfterSale ? Number(payload.priceAfterSale) : null,
        }),
      });
      setMsg(res.ok ? t("farmerInfoSaved") : t("saveFailed"));
      if (res.ok) onSaved?.();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : t("saveFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {msg && <p className="text-sm text-[var(--huza-green-dark)]">{msg}</p>}

      <section className="rounded-2xl border border-[var(--huza-line)] bg-white p-5 space-y-3">
        <h2 className="font-semibold text-lg">{t("farmerPersonalInfo")}</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="label">{t("picture")}</label>
            <input name="profilePhoto" type="file" accept="image/*" className="input-field" />
            {photoUrl && (
              <div className="relative mt-2 h-24 w-24 overflow-hidden rounded-full">
                <OptimizedImage src={photoUrl} alt="Profile" fill className="object-cover" sizes="96px" />
              </div>
            )}
            <input type="hidden" name="profilePhotoUrl" value={photoUrl} />
          </div>
          <div>
            <label className="label">{t("name")}</label>
            <input
              name="fullName"
              defaultValue={initial.fullName || initial.businessName || ""}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="label">{t("farmBusinessName")}</label>
            <input
              name="businessName"
              defaultValue={initial.businessName || ""}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="label">{t("idNumber")}</label>
            <p className="input-field flex items-center bg-[var(--huza-mint)]/30 font-mono tracking-wide">
              {maskNationalId(initial.nationalId)}
            </p>
            <input type="hidden" name="nationalId" value={initial.nationalId || ""} />
            <p className="mt-1 text-xs text-[var(--huza-muted)]">
              Shown masked for security. Contact HUZA Support to change your National ID.
            </p>
          </div>
          <div>
            <label className="label">{t("gender")}</label>
            <select name="gender" defaultValue={initial.gender || ""} className="input-field" required>
              <option value="">{t("select")}</option>
              {GENDERS.map((g) => (
                <option key={g} value={g}>
                  {t(genderLabelKey[g])}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">{t("telephone")}</label>
            <input name="phone" defaultValue={initial.phone || ""} className="input-field" required />
          </div>
          <div>
            <label className="label">{t("ageRange")}</label>
            <select name="ageRange" defaultValue={initial.ageRange || ""} className="input-field" required>
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
            <select name="province" defaultValue={initial.province || ""} className="input-field" required>
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
            <input name="district" defaultValue={initial.district || ""} className="input-field" required />
          </div>
          <div>
            <label className="label">{t("sector")}</label>
            <input name="sector" defaultValue={initial.sector || ""} className="input-field" required />
          </div>
          <div>
            <label className="label">{t("cell")}</label>
            <input name="cell" defaultValue={initial.cell || ""} className="input-field" required />
          </div>
          <div>
            <label className="label">{t("village")}</label>
            <input name="village" defaultValue={initial.village || ""} className="input-field" required />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--huza-line)] bg-white p-5 space-y-3">
        <h2 className="font-semibold text-lg">{t("fieldInformation")}</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label">{t("greenhouseOrOpen")}</label>
            <select name="fieldType" defaultValue={initial.fieldType || ""} className="input-field" required>
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
              defaultValue={initial.farmSize || ""}
              className="input-field"
              placeholder={t("sizePlaceholder")}
              required
            />
          </div>
          <div>
            <label className="label">{t("pastCrops1")}</label>
            <input name="pastCropsSeason1" defaultValue={initial.pastCropsSeason1 || ""} className="input-field" />
          </div>
          <div>
            <label className="label">{t("pastCrops2")}</label>
            <input name="pastCropsSeason2" defaultValue={initial.pastCropsSeason2 || ""} className="input-field" />
          </div>
          <div>
            <label className="label">{t("pastCrops3")}</label>
            <input name="pastCropsSeason3" defaultValue={initial.pastCropsSeason3 || ""} className="input-field" />
          </div>
          <div>
            <label className="label">{t("currentCrop")}</label>
            <input name="currentCrop" defaultValue={initial.currentCrop || ""} className="input-field" required />
          </div>
          <div>
            <label className="label">{t("chemicalsPerWeek")}</label>
            <input name="chemicalsPerWeek" defaultValue={initial.chemicalsPerWeek || ""} className="input-field" />
          </div>
          <div>
            <label className="label">{t("chemicalsWhy")}</label>
            <input name="chemicalsWhy" defaultValue={initial.chemicalsWhy || ""} className="input-field" />
          </div>
          <div>
            <label className="label">{t("dosage")}</label>
            <input name="chemicalsDosage" defaultValue={initial.chemicalsDosage || ""} className="input-field" />
          </div>
          <div>
            <label className="label">{t("fertilizerPerWeek")}</label>
            <input name="fertilizerPerWeek" defaultValue={initial.fertilizerPerWeek || ""} className="input-field" />
          </div>
          <div>
            <label className="label">{t("irrigationMethod")}</label>
            <input name="irrigationMethod" defaultValue={initial.irrigationMethod || ""} className="input-field" />
          </div>
          <div>
            <label className="label">{t("diseasesIdentified")}</label>
            <input name="diseasesIdentified" defaultValue={initial.diseasesIdentified || ""} className="input-field" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">{t("pestsIdentified")}</label>
            <input name="pestsIdentified" defaultValue={initial.pestsIdentified || ""} className="input-field" />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--huza-line)] bg-white p-5 space-y-3">
        <h2 className="font-semibold text-lg">{t("productionInformation")}</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label">{t("totalQuantityHarvested")}</label>
            <input
              name="totalQuantityHarvested"
              defaultValue={initial.totalQuantityHarvested || ""}
              className="input-field"
              placeholder={t("harvestPlaceholder")}
              required
            />
          </div>
          <div>
            <label className="label">{t("qualityInGeneral")}</label>
            <select
              name="qualityGeneral"
              defaultValue={initial.qualityGeneral || ""}
              className="input-field"
              required
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

      <section className="rounded-2xl border border-[var(--huza-line)] bg-white p-5 space-y-3">
        <h2 className="font-semibold text-lg">{t("sales")}</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label">{t("priceUnit")}</label>
            <select name="priceUnit" defaultValue={initial.priceUnit || "kg"} className="input-field">
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
              defaultValue={initial.pricePerUnit ?? ""}
              className="input-field"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">{t("totalKgsBoughtByHuza")}</label>
            <input
              name="totalKgsBoughtByHuza"
              type="number"
              step="0.1"
              defaultValue={initial.totalKgsBoughtByHuza ?? 0}
              className="input-field"
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--huza-line)] bg-white p-5 space-y-3">
        <h2 className="font-semibold text-lg">{t("paymentOptions")}</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="label">{t("preferredPayment")}</label>
            <select
              name="paymentOption"
              defaultValue={initial.paymentOption || ""}
              className="input-field"
              required
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
              defaultValue={initial.farmGatePrice ?? ""}
              className="input-field"
            />
          </div>
          <div>
            <label className="label">{t("priceUponDelivery")}</label>
            <input
              name="priceUponDelivery"
              type="number"
              defaultValue={initial.priceUponDelivery ?? ""}
              className="input-field"
            />
          </div>
          <div>
            <label className="label">{t("priceAfterSale")}</label>
            <input
              name="priceAfterSale"
              type="number"
              defaultValue={initial.priceAfterSale ?? ""}
              className="input-field"
            />
          </div>
          <div>
            <label className="label">{t("proofOfPayment")}</label>
            <input
              name="proofOfPayment"
              type="file"
              accept="image/*,application/pdf"
              className="input-field"
            />
            {proofUrl && (
              <a
                href={proofUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block text-xs text-[var(--huza-green)] underline"
              >
                {t("viewAttachedProof")}
              </a>
            )}
            <input type="hidden" name="proofOfPaymentUrl" value={proofUrl} />
          </div>
          <div>
            <label className="label">{t("mobileMoneyNumber")}</label>
            <input
              name="paymentMomo"
              defaultValue={initial.paymentMomo || ""}
              className="input-field"
              placeholder="078xxxxxxx"
            />
          </div>
          <div>
            <label className="label">{t("bankAccountOptional")}</label>
            <input
              name="bankAccount"
              defaultValue={initial.bankAccount || ""}
              className="input-field"
            />
          </div>
          <div>
            <label className="label">{t("bankNameOptional")}</label>
            <input
              name="bankName"
              defaultValue={initial.bankName || ""}
              className="input-field"
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--huza-line)] bg-white p-5 space-y-3">
        <h2 className="font-semibold text-lg">{t("huzaAgreementTab")}</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="label">{t("productsOfferedLabel")}</label>
            <textarea
              name="productsOffered"
              defaultValue={initial.productsOffered || ""}
              className="input-field min-h-20"
              placeholder={t("productsOfferedPlaceholder")}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">{t("huzaPurchaseAgreementLabel")}</label>
            <textarea
              name="huzaPurchaseAgreement"
              defaultValue={initial.huzaPurchaseAgreement || ""}
              className="input-field min-h-20"
              placeholder={t("huzaPurchaseAgreementPlaceholder")}
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--huza-line)] bg-white p-5 space-y-3">
        <h2 className="font-semibold text-lg">{t("comments")}</h2>
        <textarea
          name="farmerComments"
          defaultValue={initial.farmerComments || ""}
          className="input-field min-h-28"
          placeholder={t("farmerCommentsPlaceholder")}
        />
      </section>

      <Button type="submit" className="w-full sm:w-auto" disabled={busy}>
        {busy ? t("saving") : t("saveFarmerInfo")}
      </Button>
    </form>
  );
}
