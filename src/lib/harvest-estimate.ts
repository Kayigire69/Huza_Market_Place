/**
 * Simple harvest window helpers for Farmers Portal crop tracking.
 * Defaults are agronomic approximations for common Rwanda fresh crops — not RAB certificates.
 */

const CROP_DAYS: Record<string, number> = {
  tomato: 90,
  tomatoes: 90,
  potato: 100,
  potatoes: 100,
  irish: 100,
  cabbage: 90,
  banana: 270,
  bananas: 270,
  avocado: 365,
  avocadoes: 365,
  carrot: 75,
  carrots: 75,
  onion: 110,
  onions: 110,
  pepper: 80,
  peppers: 80,
  lettuce: 55,
  spinach: 45,
  bean: 70,
  beans: 70,
  maize: 120,
  corn: 120,
};

export function estimateHarvestDate(plantingDate: Date, cropName: string): Date {
  const key = cropName.trim().toLowerCase().split(/\s+/)[0] || "";
  const days = CROP_DAYS[key] ?? 90;
  const d = new Date(plantingDate);
  d.setDate(d.getDate() + days);
  return d;
}

export function daysRemaining(expectedHarvest: Date | null | undefined, now = new Date()): number | null {
  if (!expectedHarvest) return null;
  const ms = expectedHarvest.getTime() - now.getTime();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

export function harvestReadiness(
  daysLeft: number | null
): "growing" | "soon" | "ready" | "overdue" | "unknown" {
  if (daysLeft === null) return "unknown";
  if (daysLeft < 0) return "overdue";
  if (daysLeft <= 3) return "ready";
  if (daysLeft <= 14) return "soon";
  return "growing";
}

/** Alert admins this many days before expected harvest */
export const HARVEST_ALERT_LEAD_DAYS = 14;
