/** Shared farmer dossier field helpers for portal + admin review */

export const GENDERS = ["Male", "Female", "Other", "Prefer not to say"] as const;

export const AGE_RANGES = [
  "Under 18",
  "18-24",
  "25-34",
  "35-44",
  "45-54",
  "55-64",
  "65+",
] as const;

export const FIELD_TYPES = ["Greenhouse", "Open field"] as const;

export const QUALITY_LEVELS = ["Good", "Medium", "Bad"] as const;

export const PRICE_UNITS = ["kg", "crate", "piece", "field"] as const;

export const PAYMENT_OPTIONS = [
  { value: "FARM_GATE", label: "Farm gate price" },
  { value: "UPON_DELIVERY", label: "Price upon delivery" },
  { value: "AFTER_SALE", label: "Price after sale" },
] as const;

export const RWANDA_PROVINCES = [
  "Kigali City",
  "Eastern Province",
  "Northern Province",
  "Southern Province",
  "Western Province",
] as const;

export const PAYMENT_AND_SALES_KEYS = [
  "paymentMomo",
  "bankAccount",
  "bankName",
  "paymentOption",
  "farmGatePrice",
  "priceUponDelivery",
  "priceAfterSale",
  "proofOfPaymentUrl",
  "priceUnit",
  "pricePerUnit",
  "totalKgsBoughtByHuza",
  "huzaPurchaseAgreement",
] as const;

export type FarmerDossierFields = {
  profilePhotoUrl?: string | null;
  businessName?: string | null;
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
  productsOffered?: string | null;
  huzaPurchaseAgreement?: string | null;
  paymentMomo?: string | null;
  bankAccount?: string | null;
  bankName?: string | null;
};

export function pickFarmerDossier(body: Record<string, unknown>): Record<string, unknown> {
  const str = (k: string) =>
    body[k] !== undefined && body[k] !== null ? String(body[k]) : undefined;
  const num = (k: string) =>
    body[k] !== undefined && body[k] !== null && body[k] !== ""
      ? Number(body[k])
      : undefined;

  return {
    profilePhotoUrl: str("profilePhotoUrl"),
    businessName: str("businessName"),
    nationalId: str("nationalId"),
    gender: str("gender"),
    phone: str("phone"),
    province: str("province"),
    district: str("district"),
    sector: str("sector"),
    cell: str("cell"),
    village: str("village"),
    ageRange: str("ageRange"),
    location: str("location") || str("district"),
    fieldType: str("fieldType"),
    farmSize: str("farmSize"),
    pastCropsSeason1: str("pastCropsSeason1"),
    pastCropsSeason2: str("pastCropsSeason2"),
    pastCropsSeason3: str("pastCropsSeason3"),
    currentCrop: str("currentCrop"),
    chemicalsPerWeek: str("chemicalsPerWeek"),
    chemicalsWhy: str("chemicalsWhy"),
    chemicalsDosage: str("chemicalsDosage"),
    fertilizerPerWeek: str("fertilizerPerWeek"),
    irrigationMethod: str("irrigationMethod"),
    diseasesIdentified: str("diseasesIdentified"),
    pestsIdentified: str("pestsIdentified"),
    totalQuantityHarvested: str("totalQuantityHarvested"),
    qualityGeneral: str("qualityGeneral"),
    priceUnit: str("priceUnit"),
    pricePerUnit: num("pricePerUnit"),
    totalKgsBoughtByHuza: num("totalKgsBoughtByHuza"),
    paymentOption: str("paymentOption"),
    farmGatePrice: num("farmGatePrice"),
    priceUponDelivery: num("priceUponDelivery"),
    priceAfterSale: num("priceAfterSale"),
    proofOfPaymentUrl: str("proofOfPaymentUrl"),
    farmerComments: str("farmerComments"),
    description: str("description") || str("farmerComments"),
    productsOffered: str("productsOffered"),
    huzaPurchaseAgreement: str("huzaPurchaseAgreement"),
    email: str("email"),
    paymentMomo:
      body.paymentMomo !== undefined
        ? body.paymentMomo === null || String(body.paymentMomo).trim() === ""
          ? null
          : String(body.paymentMomo).trim()
        : undefined,
    bankAccount:
      body.bankAccount !== undefined
        ? body.bankAccount === null || String(body.bankAccount).trim() === ""
          ? null
          : String(body.bankAccount).trim()
        : undefined,
    bankName:
      body.bankName !== undefined
        ? body.bankName === null || String(body.bankName).trim() === ""
          ? null
          : String(body.bankName).trim()
        : undefined,
  };
}

export function pickProductCropFields(body: Record<string, unknown>): Record<string, unknown> {
  const str = (k: string) =>
    body[k] !== undefined && body[k] !== null ? String(body[k]) : undefined;
  const num = (k: string) =>
    body[k] !== undefined && body[k] !== null && body[k] !== ""
      ? Number(body[k])
      : undefined;

  return {
    fieldType: str("fieldType"),
    fieldSize: str("fieldSize") || str("farmSize"),
    pastCropsSeason1: str("pastCropsSeason1"),
    pastCropsSeason2: str("pastCropsSeason2"),
    pastCropsSeason3: str("pastCropsSeason3"),
    currentCrop: str("currentCrop") || str("nameEn"),
    chemicalsPerWeek: str("chemicalsPerWeek"),
    chemicalsWhy: str("chemicalsWhy"),
    chemicalsDosage: str("chemicalsDosage"),
    fertilizerPerWeek: str("fertilizerPerWeek"),
    irrigationMethod: str("irrigationMethod"),
    diseasesIdentified: str("diseasesIdentified"),
    pestsIdentified: str("pestsIdentified"),
    totalQuantityHarvested: str("totalQuantityHarvested"),
    qualityGeneral: str("qualityGeneral"),
    priceUnit: str("priceUnit"),
    pricePerUnit: num("pricePerUnit") ?? num("price"),
    totalKgsBoughtByHuza: num("totalKgsBoughtByHuza") ?? 0,
    paymentOption: str("paymentOption"),
    farmGatePrice: num("farmGatePrice"),
    priceUponDelivery: num("priceUponDelivery"),
    priceAfterSale: num("priceAfterSale"),
    proofOfPaymentUrl: str("proofOfPaymentUrl"),
    farmerComments: str("farmerComments"),
  };
}
