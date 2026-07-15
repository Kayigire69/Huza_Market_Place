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
 * - Phase 9 Homepage partnership (landing lockup, Why Farmers Partner, register chrome polish)
 *
 * NEXT:
 * - Phase 6 Farmer Support knowledge library
 * - Phase 7 Ask an Agronomist
 * - Phase 8 Notifications & Profile polish
 */
export const FARMER_PHASES = {
  /** Sidebar, header, selling-first IA, route shell */
  LAYOUT: { id: 1, name: "Layout & Navigation", status: "locked" as const },
  /** Overview KPIs + selling workflow guide */
  DASHBOARD: { id: 2, name: "Dashboard", status: "locked" as const },
  /** My Products, Submit Product, Approval Status */
  SELLING: { id: 3, name: "Selling workflow", status: "locked" as const },
  /** Purchase Orders + Payments */
  ORDERS_PAYMENTS: { id: 4, name: "Orders & Payments", status: "locked" as const },
  /** Structured rejection reason + recommendation + CTAs */
  QUALITY_FEEDBACK: { id: 5, name: "Quality feedback", status: "locked" as const },
  /** Knowledge library guides */
  SUPPORT_LIBRARY: { id: 6, name: "Farmer Support", status: "planned" as const },
  /** Photo + question agronomist Q&A */
  AGRONOMIST: { id: 7, name: "Ask an Agronomist", status: "planned" as const },
  /** Inbox + My Profile polish */
  ACCOUNT: { id: 8, name: "Notifications & Profile", status: "planned" as const },
  /** Public homepage partnership section */
  HOMEPAGE: { id: 9, name: "Homepage partnership", status: "locked" as const },
} as const;

export function isFarmerPhaseLocked(phase: keyof typeof FARMER_PHASES): boolean {
  return FARMER_PHASES[phase].status === "locked";
}
