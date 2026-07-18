import { redirect } from "next/navigation";

export default function FarmerPaymentsRedirect() {
  redirect("/farmer/sales?tab=payments");
}
