/**
 * Youth Huza Farmers Portal phase locks.
 * Locked phases: do not redesign chrome/IA unless explicitly asked.
 * Bugfixes within locked phases are OK.
 * Organic crop dossier / registration forms stay intact across phases.
 *
 * LOCKED:
 * - Phase 1 Layout & Navigation (sidebar IA, selling core vs support, routes)
 * - Phase 2 Dashboard (KPIs, needs attention, next action, workflow progress, activity)
 * - Phase 3 Selling workflow (Submit Crop + Approval Status polish, volume-first)
 * - Phase 4 Orders & Payments (PO pipeline + payout tracker)
 * - Phase 5 Quality feedback (reason + recommendation + Read Guide / Ask Expert)
 * - Phase 6 Training & Advisory (category learning center + quality guide)
 * - Phase 7 Agronomy Support (advice + farm visit requests)
 * - Phase 8 Account (Messages, Notifications inbox, Settings)
 * - Phase 9 Homepage partnership
 * - Phase 10 Final IA (My Farm, My Produce, Sales, Reports hubs)
 *
 * NEXT:
 * - Harvest calendar, performance score polish, visit report history ledger
 */
export const FARMER_PHASES = {
  LAYOUT: { id: 1, name: "Layout & Navigation", status: "locked" as const },
  DASHBOARD: { id: 2, name: "Dashboard", status: "locked" as const },
  SELLING: { id: 3, name: "Selling workflow", status: "locked" as const },
  ORDERS_PAYMENTS: { id: 4, name: "Orders & Payments", status: "locked" as const },
  QUALITY_FEEDBACK: { id: 5, name: "Quality feedback", status: "locked" as const },
  SUPPORT_LIBRARY: { id: 6, name: "Training & Advisory", status: "locked" as const },
  AGRONOMIST: { id: 7, name: "Agronomy Support", status: "locked" as const },
  ACCOUNT: { id: 8, name: "Messages, Notifications & Settings", status: "locked" as const },
  HOMEPAGE: { id: 9, name: "Homepage partnership", status: "locked" as const },
  FINAL_IA: {
    id: 10,
    name: "Final portal IA (My Farm / Produce / Sales / Reports)",
    status: "locked" as const,
  },
} as const;

export function isFarmerPhaseLocked(phase: keyof typeof FARMER_PHASES): boolean {
  return FARMER_PHASES[phase].status === "locked";
}
