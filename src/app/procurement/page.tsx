import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Standalone procurement UI consolidated under Admin → Procurement. */
export default function ProcurementPage() {
  redirect("/admin/procurement");
}
