import { redirect } from "next/navigation";

export default function FarmerSubmitRedirect() {
  redirect("/farmer/produce?tab=submit");
}
