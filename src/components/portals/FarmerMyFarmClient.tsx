"use client";

import Link from "next/link";
import { FarmerPageHeader, FarmerPanel } from "@/components/portals/FarmerUi";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/lib/locale-context";

type FarmView = {
  businessName: string;
  farmingType: string | null;
  phone: string | null;
  email: string | null;
  farmSize: string | null;
  status: string;
  isVerified: boolean;
  description: string | null;
  district: string | null;
  sector: string | null;
  cell: string | null;
  village: string | null;
  province: string | null;
  location: string | null;
  productsOffered: string | null;
  currentCrop: string | null;
  productCategories: string | null;
  fieldType: string | null;
  irrigationMethod: string | null;
  productionCapacity: string | null;
  farmPhotoUrls: string[];
  organicCertUrl: string | null;
  nationalIdUrl: string | null;
  permitUrl: string | null;
  businessCertUrl: string | null;
  fullName: string | null;
};

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--huza-muted)]">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-[var(--huza-ink)]">{value}</p>
    </div>
  );
}

export function FarmerMyFarmClient({ farmer }: { farmer: FarmView }) {
  const { t } = useLocale();
  const isOrganic = farmer.farmingType !== "STANDARD";
  const crops =
    farmer.productsOffered ||
    farmer.currentCrop ||
    farmer.productCategories ||
    t("myFarmNotListed");

  return (
    <div>
      <FarmerPageHeader
        title={t("myFarmTitle")}
        action={
          <Link href="/farmer/settings">
            <Button variant="ghost">{t("myFarmEditSettings")}</Button>
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <FarmerPanel>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--huza-green-dark)]">
            {t("myFarmInfo")}
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold text-[var(--huza-ink)]">
            {farmer.businessName}
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label={t("myFarmFarmer")} value={farmer.fullName} />
            <Field label={t("phone")} value={farmer.phone} />
            <Field label={t("email")} value={farmer.email} />
            <Field
              label={t("myFarmFarmingType")}
              value={isOrganic ? t("myFarmOrganicDossier") : t("myFarmStandardSeller")}
            />
            <Field label={t("myFarmSize")} value={farmer.farmSize} />
            <Field
              label={t("myFarmStatus")}
              value={`${farmer.status}${farmer.isVerified ? ` · ${t("myFarmVerified")}` : ""}`}
            />
          </div>
          {farmer.description ? (
            <p className="mt-4 text-sm text-[var(--huza-muted)]">{farmer.description}</p>
          ) : null}
        </FarmerPanel>

        <FarmerPanel>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--huza-green-dark)]">
            {t("myFarmLocation")}
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label={t("myFarmDistrict")} value={farmer.district} />
            <Field label={t("myFarmSector")} value={farmer.sector} />
            <Field label={t("myFarmCell")} value={farmer.cell} />
            <Field label={t("myFarmVillage")} value={farmer.village} />
            <Field label={t("myFarmProvince")} value={farmer.province} />
            <Field label={t("myFarmAddress")} value={farmer.location} />
          </div>
          <p className="mt-3 text-xs text-[var(--huza-muted)]">{t("myFarmGpsHint")}</p>
        </FarmerPanel>

        <FarmerPanel>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--huza-green-dark)]">
            {t("myFarmCropsGrown")}
          </p>
          <p className="mt-2 text-sm text-[var(--huza-ink)]">{crops}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label={t("myFarmFieldType")} value={farmer.fieldType} />
            <Field label={t("myFarmIrrigation")} value={farmer.irrigationMethod} />
            <Field
              label={t("myFarmOrganicStatus")}
              value={isOrganic ? t("myFarmOrganicPath") : t("myFarmNonOrganic")}
            />
            <Field label={t("myFarmCapacity")} value={farmer.productionCapacity} />
          </div>
        </FarmerPanel>

        <FarmerPanel>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--huza-green-dark)]">
            {t("myFarmPhotosCerts")}
          </p>
          {farmer.farmPhotoUrls?.length ? (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {farmer.farmPhotoUrls.slice(0, 6).map((url) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={url}
                  src={url}
                  alt={t("myFarmPhotoAlt")}
                  className="aspect-square rounded-lg object-cover"
                />
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-[var(--huza-muted)]">{t("myFarmNoPhotos")}</p>
          )}
          <div className="mt-4 space-y-1 text-sm">
            <Field
              label={t("myFarmOrganicCert")}
              value={farmer.organicCertUrl ? t("myFarmOnFile") : t("myFarmNotUploaded")}
            />
            <Field
              label={t("myFarmNationalIdDoc")}
              value={farmer.nationalIdUrl ? t("myFarmOnFile") : t("myFarmNotUploaded")}
            />
            <Field
              label={t("myFarmBusinessPermit")}
              value={
                farmer.permitUrl || farmer.businessCertUrl
                  ? t("myFarmOnFile")
                  : t("myFarmNotUploaded")
              }
            />
          </div>
          <Link
            href="/farmer/settings"
            className="mt-4 inline-block text-sm font-bold text-[var(--huza-green-dark)] underline underline-offset-4"
          >
            {t("myFarmUpdateSettings")}
          </Link>
        </FarmerPanel>
      </div>
    </div>
  );
}
