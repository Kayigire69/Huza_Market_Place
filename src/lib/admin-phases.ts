/**
 * HUZA Admin Portal phase locks.
 * Locked phases: do not redesign chrome/IA unless explicitly asked.
 * Bugfixes within locked phases are OK.
 *
 * LOCKED:
 * - Phase 1 Admin Layout (sidebar, header, nav, tokens, search, notifications)
 * - Phase 2 Dashboard (KPIs, charts, Needs Attention, quick actions, activity)
 * - Phase 3 Orders (tabs, search, guided status, cancel, assign driver, PDFs)
 * - Phase 4 Catalog (categories, products, images, visibility, featured, promotions)
 * - Phase 5 Inventory (stock tabs, in/out movements, expiring batches)
 * - Phase 6 Procurement (approve → PO → receive → QC → publish → pay)
 * - Phase 7 Farmers (profile, products, purchases, payments, ratings, notify)
 * - Phase 8 Deliveries (drivers, assign, routes, POD, failed)
 * - Phase 9 Customers (profile, orders, spend, favorites, addresses, notes)
 * - Phase 10 Payments (MoMo/Airtel, history, refunds, failed, reconcile)
 * - Phase 11 Reports (sales→deliveries, PDF/Excel/CSV, preview)
 * - Phase 12 Settings (company, fees, hours, payments, notifications, system)
 * - Phase 13 Super Admin (staff, roles, password reset, audit, 2FA, error logs;
 *   login error/rate-limit UX; password change is optional, not forced)
 * - Phase 14 Support (tickets, live chat, contact inbox; optional password change;
 *   admin subtitle polish)
 *
 * NEXT:
 * - (Admin portal phases complete — expand only on request)
 */
export const ADMIN_PHASES = {
  /** Sidebar, header, nav, colors, cards, search, notifications shell */
  LAYOUT: { id: 1, name: "Admin Layout", status: "locked" as const },
  /** First screen after login — KPIs, charts, attention, quick actions, activity */
  DASHBOARD: { id: 2, name: "Dashboard", status: "locked" as const },
  ORDERS: { id: 3, name: "Orders", status: "locked" as const },
  CATALOG: { id: 4, name: "Catalog", status: "locked" as const },
  INVENTORY: { id: 5, name: "Inventory", status: "locked" as const },
  PROCUREMENT: { id: 6, name: "Procurement", status: "locked" as const },
  FARMERS: { id: 7, name: "Farmers", status: "locked" as const },
  DELIVERIES: { id: 8, name: "Deliveries", status: "locked" as const },
  CUSTOMERS: { id: 9, name: "Customers", status: "locked" as const },
  PAYMENTS: { id: 10, name: "Payments", status: "locked" as const },
  REPORTS: { id: 11, name: "Reports", status: "locked" as const },
  SETTINGS: { id: 12, name: "Settings", status: "locked" as const },
  SUPER_ADMIN: { id: 13, name: "Super Admin", status: "locked" as const },
  SUPPORT: { id: 14, name: "Support", status: "locked" as const },
} as const;

export function isAdminPhaseLocked(phase: keyof typeof ADMIN_PHASES): boolean {
  return ADMIN_PHASES[phase].status === "locked";
}
