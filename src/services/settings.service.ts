import { prisma } from "@/lib/prisma";
import {
  DELIVERY_FEES,
  FLAT_DELIVERY_FEE_RWF,
  type DeliveryZoneDto,
  type DeliveryZoneKey,
} from "@/lib/utils";
import { ZONE_ETA_LABELS, ZONE_ETA_MINUTES } from "@/lib/delivery-eta";
import {
  HUZA_PAYEE_NAME,
  HUZA_PAYEE_PHONE,
  HUZA_PAYEE_WHATSAPP_URL,
  formatHuzaPayeeDisplay,
} from "@/lib/payments/huza-payee";
import { DEFAULT_PICKUP_INFO, type PickupInfo } from "@/lib/pickup-info";
import { resolveWhatsAppUrl } from "@/lib/brand-contact";

const FALLBACK_ZONES: DeliveryZoneDto[] = (Object.keys(DELIVERY_FEES) as DeliveryZoneKey[]).map(
  (code) => ({
    id: code,
    code,
    labelEn:
      code === "KIGALI" ? "Kigali" : code === "KAMONYI_RUYENZI" ? "Kamonyi" : "Bugesera",
    feeRwf: DELIVERY_FEES[code],
    etaMinutes: ZONE_ETA_MINUTES[code],
    etaLabelEn: ZONE_ETA_LABELS[code],
  })
);

export async function listDeliveryZones(): Promise<
  Array<{
    id: string;
    code: string;
    labelEn: string;
    labelFr?: string;
    labelRw?: string;
    feeRwf: number;
    etaMinutes: number;
    etaLabelEn: string;
    isActive?: boolean;
    sortOrder?: number;
  }>
> {
  try {
    const rows = await prisma.deliveryZoneConfig.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    if (rows.length > 0) return rows;
  } catch {
    /* table may not exist yet during migrate */
  }
  return FALLBACK_ZONES.map((z, i) => ({
    id: z.id,
    code: z.code,
    labelEn: z.labelEn,
    labelFr: z.labelEn,
    labelRw: z.labelEn,
    feeRwf: z.feeRwf,
    etaMinutes: z.etaMinutes,
    etaLabelEn: z.etaLabelEn,
    isActive: true,
    sortOrder: i,
  }));
}

export async function getDeliveryFee(_code: string): Promise<number> {
  const raw = await getSetting("delivery_fee_rwf", String(FLAT_DELIVERY_FEE_RWF));
  const fee = Number(raw);
  return Number.isFinite(fee) && fee >= 0 ? Math.round(fee) : FLAT_DELIVERY_FEE_RWF;
}

export async function getSetting(key: string, fallback = ""): Promise<string> {
  try {
    const row = await prisma.websiteSetting.findUnique({ where: { key } });
    return row?.value ?? fallback;
  } catch {
    return fallback;
  }
}

export async function getSettings(keys: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const key of keys) out[key] = "";
  try {
    const rows = await prisma.websiteSetting.findMany({ where: { key: { in: keys } } });
    for (const row of rows) out[row.key] = row.value;
  } catch {
    /* ignore */
  }
  return out;
}

export async function setSetting(key: string, value: string) {
  return prisma.websiteSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

export async function generateOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const seq = await prisma.orderSequence.upsert({
    where: { year },
    create: { year, lastValue: 1 },
    update: { lastValue: { increment: 1 } },
  });
  return `HZ-${year}-${String(seq.lastValue).padStart(6, "0")}`;
}

/** Defaults for Admin → Settings (required by /api/admin/settings). */
export const SETTING_DEFAULTS: Record<string, string> = {
  brand_name: "HUZA FRESH",
  company_name: "Youth Huza",
  company_tagline: "Fresh produce marketplace",
  phone: HUZA_PAYEE_PHONE,
  email: "info@youthhuza.rw",
  company_address: "Kigali, Rwanda",
  whatsapp_url: HUZA_PAYEE_WHATSAPP_URL,
  delivery_fee_rwf: String(FLAT_DELIVERY_FEE_RWF),
  merchant_phone: HUZA_PAYEE_PHONE,
  merchant_name: HUZA_PAYEE_NAME,
  pickup_location_name: DEFAULT_PICKUP_INFO.locationName,
  pickup_address: DEFAULT_PICKUP_INFO.address,
  pickup_maps_url: "",
  pickup_hours: DEFAULT_PICKUP_INFO.hours,
  pickup_phone: HUZA_PAYEE_PHONE,
  pickup_whatsapp_url: HUZA_PAYEE_WHATSAPP_URL,
  payment_mtn_enabled: "true",
  payment_airtel_enabled: "true",
  notify_inapp_enabled: "true",
  notify_sms_enabled: "true",
  notify_email_enabled: "true",
  notify_new_order_enabled: "true",
  notify_low_stock_enabled: "true",
  notify_new_farmer_enabled: "true",
};

export async function getAdminSettingsBundle(): Promise<Record<string, string>> {
  const out = { ...SETTING_DEFAULTS };
  try {
    const rows = await prisma.websiteSetting.findMany({
      where: { key: { in: Object.keys(SETTING_DEFAULTS) } },
    });
    for (const row of rows) out[row.key] = row.value;
  } catch {
    /* ignore */
  }
  return out;
}

export async function setSettingsBulk(entries: Record<string, string>) {
  await Promise.all(
    Object.entries(entries).map(([key, value]) =>
      prisma.websiteSetting.upsert({
        where: { key },
        create: { key, value: String(value ?? "") },
        update: { value: String(value ?? "") },
      })
    )
  );
}

export async function syncAllZoneFees(feeRwf: number) {
  const fee = Math.round(feeRwf);
  if (!Number.isFinite(fee) || fee < 0) return;
  try {
    await prisma.deliveryZoneConfig.updateMany({ data: { feeRwf: fee } });
  } catch {
    /* table may not exist yet */
  }
}

export async function isPaymentMethodEnabled(
  method: "MTN_MOMO" | "AIRTEL_MONEY"
): Promise<boolean> {
  const key = method === "MTN_MOMO" ? "payment_mtn_enabled" : "payment_airtel_enabled";
  const value = await getSetting(key, "true");
  return value !== "false";
}

export async function getHuzaPayee(): Promise<{ name: string; phone: string }> {
  const settings = await getSettings(["merchant_name", "merchant_phone", "company_name", "phone"]);
  return {
    name: settings.merchant_name || settings.company_name || HUZA_PAYEE_NAME,
    phone: settings.merchant_phone || settings.phone || HUZA_PAYEE_PHONE,
  };
}

/** Pickup location shown at checkout (editable in Admin → Settings). */
export async function getPickupInfo(): Promise<PickupInfo> {
  const s = await getSettings([
    "pickup_location_name",
    "pickup_address",
    "pickup_maps_url",
    "pickup_hours",
    "pickup_phone",
    "pickup_whatsapp_url",
    "company_name",
    "company_address",
    "phone",
    "whatsapp_url",
  ]);
  const phone =
    s.pickup_phone?.trim() || s.phone?.trim() || DEFAULT_PICKUP_INFO.phone;
  const whatsapp =
    s.pickup_whatsapp_url?.trim() ||
    s.whatsapp_url?.trim() ||
    DEFAULT_PICKUP_INFO.whatsappUrl;
  return {
    locationName:
      s.pickup_location_name?.trim() ||
      s.company_name?.trim() ||
      DEFAULT_PICKUP_INFO.locationName,
    address:
      s.pickup_address?.trim() ||
      s.company_address?.trim() ||
      DEFAULT_PICKUP_INFO.address,
    mapsUrl: s.pickup_maps_url?.trim() || "",
    hours: s.pickup_hours?.trim() || DEFAULT_PICKUP_INFO.hours,
    phone,
    phoneDisplay: formatHuzaPayeeDisplay(phone),
    whatsappUrl: resolveWhatsAppUrl(whatsapp) || DEFAULT_PICKUP_INFO.whatsappUrl,
  };
}
