import { redirect } from "next/navigation";

export default function FarmerProfileRedirect() {
  redirect("/farmer/settings");
}
