import { prisma } from "@/lib/prisma";
import { DELIVERY_FEES, type DeliveryZoneKey } from "@/lib/utils";

const FALLBACK_ZONES: {
  code: DeliveryZoneKey;
  labelEn: string;
  feeRwf: number;
  etaMinutes: number;
  etaLabelEn: string;
}[] = [
  {
    code: "KIGALI",
    labelEn: "Kigali",
    feeRwf: DELIVERY_FEES.KIGALI,
    etaMinutes: 90,
    etaLabelEn: "45–90 minutes",
  },
  {
    code: "KAMONYI_RUYENZI",
    labelEn: "Kamonyi (Ruyenzi)",
    feeRwf: DELIVERY_FEES.KAMONYI_RUYENZI,
    etaMinutes: 180,
    etaLabelEn: "2–3 hours",
  },
  {
    code: "BUGESERA_NYAMATA",
    labelEn: "Bugesera (Nyamata)",
    feeRwf: DELIVERY_FEES.BUGESERA_NYAMATA,
    etaMinutes: 180,
    etaLabelEn: "2–3 hours",
  },
];

export async function listDeliveryZones() {
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
    id: z.code,
    code: z.code,
    labelEn: z.labelEn,
    labelFr: z.labelEn,
    labelRw: z.labelEn,
    feeRwf: z.feeRwf,
    etaMinutes: z.etaMinutes,
    etaLabelEn: z.etaLabelEn,
    isActive: true,
    sortOrder: i,
    createdAt: new Date(),
    updatedAt: new Date(),
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

/** Professional sequential order numbers: HZ-2026-000245 */
export async function generateOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const seq = await prisma.$transaction(async (tx) => {
    const row = await tx.orderSequence.upsert({
      where: { year },
      create: { year, lastValue: 1 },
      update: { lastValue: { increment: 1 } },
    });
    return row.lastValue;
  });
  return `HZ-${year}-${String(seq).padStart(6, "0")}`;
}
