export const REPORT_TYPES = [
  "sales",
  "payments",
  "deliveries",
  "stock",
  "farmers",
  "procurement",
  "audit",
] as const;

export type ReportType = (typeof REPORT_TYPES)[number];

export function isReportType(value: string): value is ReportType {
  return (REPORT_TYPES as readonly string[]).includes(value);
}

export const REPORT_LABELS: Record<ReportType, string> = {
  sales: "Sales & orders",
  payments: "Payments reconciliation",
  deliveries: "Delivery activity",
  stock: "Stock movements",
  farmers: "Farmers & sourcing",
  procurement: "Procurement / purchase orders",
  audit: "Admin audit trail",
};
