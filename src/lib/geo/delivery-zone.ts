import type { DeliveryZoneKey } from "@/lib/utils";

/** Rough service areas for HUZA flat-fee zones. */
const ZONE_HINTS: { code: DeliveryZoneKey; tokens: string[] }[] = [
  {
    code: "KIGALI",
    tokens: [
      "kigali",
      "gasabo",
      "kicukiro",
      "nyarugenge",
      "kimironko",
      "remera",
      "kacyiru",
      "gisozi",
      "nyamirambo",
      "kanombe",
      "gikondo",
    ],
  },
  {
    code: "KAMONYI_RUYENZI",
    tokens: ["kamonyi", "ruyenzi", "ruyezi", "mugina"],
  },
  {
    code: "BUGESERA_NYAMATA",
    tokens: ["bugesera", "nyamata", "rilima", "gashora", "mayange"],
  },
];

function zoneFromCoords(lat: number, lng: number): DeliveryZoneKey | null {
  if (lat >= -2.08 && lat <= -1.82 && lng >= 29.95 && lng <= 30.28) return "KIGALI";
  if (lat >= -2.35 && lat <= -2.0 && lng >= 30.0 && lng <= 30.45) return "BUGESERA_NYAMATA";
  if (lat >= -2.15 && lat <= -1.85 && lng >= 29.75 && lng <= 30.0) return "KAMONYI_RUYENZI";
  return null;
}

export function detectDeliveryZone(
  formattedAddress: string,
  lat: number,
  lng: number
): { available: boolean; zone: DeliveryZoneKey | null } {
  const hay = formattedAddress.toLowerCase();
  for (const z of ZONE_HINTS) {
    if (z.tokens.some((t) => hay.includes(t))) {
      return { available: true, zone: z.code };
    }
  }
  const byCoords = zoneFromCoords(lat, lng);
  if (byCoords) return { available: true, zone: byCoords };
  return { available: false, zone: null };
}

export function estimateArrivalWindow(zone: DeliveryZoneKey | null, slot: "TODAY" | "TOMORROW") {
  const now = new Date();
  const start = new Date(now);
  if (slot === "TOMORROW") {
    start.setDate(start.getDate() + 1);
    start.setHours(10, 0, 0, 0);
  } else {
    start.setMinutes(start.getMinutes() + (zone === "KIGALI" ? 45 : 90));
  }
  const end = new Date(start);
  end.setMinutes(end.getMinutes() + (zone === "KIGALI" ? 75 : 60));

  const fmt = (d: Date) =>
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  return {
    dayLabel: slot === "TODAY" ? "Today" : "Tomorrow",
    windowLabel: `${fmt(start)} – ${fmt(end)}`,
    /** e.g. "Today · 2:00 PM – 3:30 PM" */
    label: `${slot === "TODAY" ? "Today" : "Tomorrow"} · ${fmt(start)} – ${fmt(end)}`,
  };
}
