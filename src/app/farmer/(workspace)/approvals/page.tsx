import { redirect } from "next/navigation";

export default function FarmerApprovalsRedirect() {
  redirect("/farmer/produce?tab=approvals");
}
