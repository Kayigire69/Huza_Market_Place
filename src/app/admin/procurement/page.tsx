import { redirect } from "next/navigation";

/** Legacy /admin/procurement → Purchase Orders */
export default function ProcurementIndexPage() {
  redirect("/admin/procurement/orders");
}
