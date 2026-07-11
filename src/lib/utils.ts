export const DELIVERY_FEES = {
  KIGALI: 5000,
  KAMONYI_RUYENZI: 5000,
  BUGESERA_NYAMATA: 5000,
} as const;

export type DeliveryZoneKey = keyof typeof DELIVERY_FEES;

export const DELIVERY_ZONE_LABELS: Record<DeliveryZoneKey, string> = {
  KIGALI: "Kigali",
  KAMONYI_RUYENZI: "Kamonyi (Ruyenzi)",
  BUGESERA_NYAMATA: "Bugesera (Nyamata)",
};

export function formatRwf(amount: number): string {
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(amount);
  return `RWF ${formatted}`;
}

export function formatUnit(unit: string): string {
  const map: Record<string, string> = {
    KG: "kg",
    PIECE: "piece",
    BUNCH: "bunch",
    LITRE: "litre",
    PACK: "pack",
    DOZEN: "dozen",
  };
  return map[unit] ?? unit.toLowerCase();
}

export function generateOrderNumber(): string {
  // Sync fallback — prefer await generateOrderNumber() from settings.service in services
  const year = new Date().getFullYear();
  const n = Math.floor(1 + Math.random() * 999999);
  return `HZ-${year}-${String(n).padStart(6, "0")}`;
}

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
