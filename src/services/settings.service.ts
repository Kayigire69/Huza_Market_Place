import { prisma } from "@/lib/prisma";
import { DELIVERY_FEES, type DeliveryZoneDto, type DeliveryZoneKey } from "@/lib/utils";
import { ZONE_ETA_LABELS, ZONE_ETA_MINUTES } from "@/lib/delivery-eta";

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

export async function getDeliveryFee(code: string): Promise<number> {
  try {
    const row = await prisma.deliveryZoneConfig.findFirst({
      where: { code, isActive: true },
    });
    if (row) return row.feeRwf;
  } catch {
    /* fallback */
  }
  return DELIVERY_FEES[code as DeliveryZoneKey] ?? 5000;
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
