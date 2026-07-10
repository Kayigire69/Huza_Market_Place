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
import { Button } from "@/components/ui/Button";

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
      setMsg(res.ok ? "Farmer information saved — Huza uses this to accept or reject products." : "Save failed");
      if (res.ok) onSaved?.();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {msg && <p className="text-sm text-[var(--huza-green-dark)]">{msg}</p>}

      <section className="rounded-2xl border border-[var(--huza-line)] bg-white p-5 space-y-3">
        <h2 className="font-semibold text-lg">Farmer personal information</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="label">Picture</label>
            <input name="profilePhoto" type="file" accept="image/*" className="input-field" />
            {photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt="Profile" className="mt-2 h-24 w-24 rounded-full object-cover" />
            )}
            <input type="hidden" name="profilePhotoUrl" value={photoUrl} />
          </div>
          <div>
            <label className="label">Name</label>
            <input
              name="fullName"
              defaultValue={initial.fullName || initial.businessName || ""}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="label">Farm / business name</label>
            <input
              name="businessName"
              defaultValue={initial.businessName || ""}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="label">ID number</label>
            <input name="nationalId" defaultValue={initial.nationalId || ""} className="input-field" required />
          </div>
          <div>
            <label className="label">Gender</label>
            <select name="gender" defaultValue={initial.gender || ""} className="input-field" required>
              <option value="">Select</option>
              {GENDERS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Telephone number</label>
            <input name="phone" defaultValue={initial.phone || ""} className="input-field" required />
          </div>
          <div>
            <label className="label">Age range</label>
            <select name="ageRange" defaultValue={initial.ageRange || ""} className="input-field" required>
              <option value="">Select</option>
              {AGE_RANGES.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Province</label>
            <select name="province" defaultValue={initial.province || ""} className="input-field" required>
              <option value="">Select</option>
              {RWANDA_PROVINCES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">District</label>
            <input name="district" defaultValue={initial.district || ""} className="input-field" required />
          </div>
          <div>
            <label className="label">Sector</label>
            <input name="sector" defaultValue={initial.sector || ""} className="input-field" required />
          </div>
          <div>
            <label className="label">Cell</label>
            <input name="cell" defaultValue={initial.cell || ""} className="input-field" required />
          </div>
          <div>
            <label className="label">Village</label>
            <input name="village" defaultValue={initial.village || ""} className="input-field" required />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--huza-line)] bg-white p-5 space-y-3">
        <h2 className="font-semibold text-lg">Field information</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Greenhouse or open field</label>
            <select name="fieldType" defaultValue={initial.fieldType || ""} className="input-field" required>
              <option value="">Select</option>
              {FIELD_TYPES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Size</label>
            <input
              name="farmSize"
              defaultValue={initial.farmSize || ""}
              className="input-field"
              placeholder="e.g. 0.5 ha"
              required
            />
          </div>
          <div>
            <label className="label">Past crops — season 1</label>
            <input name="pastCropsSeason1" defaultValue={initial.pastCropsSeason1 || ""} className="input-field" />
          </div>
          <div>
            <label className="label">Past crops — season 2</label>
            <input name="pastCropsSeason2" defaultValue={initial.pastCropsSeason2 || ""} className="input-field" />
          </div>
          <div>
            <label className="label">Past crops — season 3</label>
            <input name="pastCropsSeason3" defaultValue={initial.pastCropsSeason3 || ""} className="input-field" />
          </div>
          <div>
            <label className="label">Current crop</label>
            <input name="currentCrop" defaultValue={initial.currentCrop || ""} className="input-field" required />
          </div>
          <div>
            <label className="label">Chemicals sprayed per week</label>
            <input name="chemicalsPerWeek" defaultValue={initial.chemicalsPerWeek || ""} className="input-field" />
          </div>
          <div>
            <label className="label">Why chemicals are used</label>
            <input name="chemicalsWhy" defaultValue={initial.chemicalsWhy || ""} className="input-field" />
          </div>
          <div>
            <label className="label">Dosage</label>
            <input name="chemicalsDosage" defaultValue={initial.chemicalsDosage || ""} className="input-field" />
          </div>
          <div>
            <label className="label">Fertilizer applied per week</label>
            <input name="fertilizerPerWeek" defaultValue={initial.fertilizerPerWeek || ""} className="input-field" />
          </div>
          <div>
            <label className="label">Irrigation method</label>
            <input name="irrigationMethod" defaultValue={initial.irrigationMethod || ""} className="input-field" />
          </div>
          <div>
            <label className="label">Diseases identified</label>
            <input name="diseasesIdentified" defaultValue={initial.diseasesIdentified || ""} className="input-field" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Pests identified</label>
            <input name="pestsIdentified" defaultValue={initial.pestsIdentified || ""} className="input-field" />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--huza-line)] bg-white p-5 space-y-3">
        <h2 className="font-semibold text-lg">Production information</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Total quantity harvested</label>
            <input
              name="totalQuantityHarvested"
              defaultValue={initial.totalQuantityHarvested || ""}
              className="input-field"
              placeholder="e.g. 500 kg"
              required
            />
          </div>
          <div>
            <label className="label">Quality in general</label>
            <select
              name="qualityGeneral"
              defaultValue={initial.qualityGeneral || ""}
              className="input-field"
              required
            >
              <option value="">Select</option>
              {QUALITY_LEVELS.map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--huza-line)] bg-white p-5 space-y-3">
        <h2 className="font-semibold text-lg">Sales</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Price unit</label>
            <select name="priceUnit" defaultValue={initial.priceUnit || "kg"} className="input-field">
              {PRICE_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Price per kg / crate / piece / field (RWF)</label>
            <input
              name="pricePerUnit"
              type="number"
              defaultValue={initial.pricePerUnit ?? ""}
              className="input-field"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Total kgs bought by Huza</label>
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
        <h2 className="font-semibold text-lg">Payment options</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="label">Preferred payment option</label>
            <select
              name="paymentOption"
              defaultValue={initial.paymentOption || ""}
              className="input-field"
              required
            >
              <option value="">Select</option>
              {PAYMENT_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Farm gate price (RWF)</label>
            <input
              name="farmGatePrice"
              type="number"
              defaultValue={initial.farmGatePrice ?? ""}
              className="input-field"
            />
          </div>
          <div>
            <label className="label">Price upon delivery (RWF)</label>
            <input
              name="priceUponDelivery"
              type="number"
              defaultValue={initial.priceUponDelivery ?? ""}
              className="input-field"
            />
          </div>
          <div>
            <label className="label">Price after sale (RWF)</label>
            <input
              name="priceAfterSale"
              type="number"
              defaultValue={initial.priceAfterSale ?? ""}
              className="input-field"
            />
          </div>
          <div>
            <label className="label">Proof of payment (attach document)</label>
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
                View attached proof
              </a>
            )}
            <input type="hidden" name="proofOfPaymentUrl" value={proofUrl} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--huza-line)] bg-white p-5 space-y-3">
        <h2 className="font-semibold text-lg">Comments</h2>
        <textarea
          name="farmerComments"
          defaultValue={initial.farmerComments || ""}
          className="input-field min-h-28"
          placeholder="Anything Huza should know when reviewing your farm or products..."
        />
      </section>

      <Button type="submit" className="w-full sm:w-auto" disabled={busy}>
        {busy ? "Saving…" : "Save farmer information"}
      </Button>
    </form>
  );
}
