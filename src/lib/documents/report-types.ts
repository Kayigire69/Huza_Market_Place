export const REPORT_TYPES = [
  "sales",
  "inventory",
  "procurement",
  "farmers",
  "customers",
  "payments",
  "deliveries",
  /** @deprecated alias — use inventory */
  "stock",
  "audit",
] as const;

export type ReportType = (typeof REPORT_TYPES)[number];

export function isReportType(value: string): value is ReportType {
  return (REPORT_TYPES as readonly string[]).includes(value);
}

/** Normalize legacy aliases */
export function normalizeReportType(type: ReportType): ReportType {
  if (type === "stock") return "inventory";
  return type;
}

export const REPORT_LABELS: Record<ReportType, string> = {
  sales: "Sales",
  inventory: "Inventory",
  procurement: "Procurement",
  farmers: "Farmers",
  customers: "Customers",
  payments: "Payments",
  deliveries: "Deliveries",
  stock: "Inventory (stock movements)",
  audit: "Admin audit trail",
};
