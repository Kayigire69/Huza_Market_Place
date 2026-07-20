import { redirect } from "next/navigation";

/** Legacy supplier URL. Farmers Portal lives at /farmer */
export default function SupplierRedirectPage() {
  redirect("/farmer");
}
