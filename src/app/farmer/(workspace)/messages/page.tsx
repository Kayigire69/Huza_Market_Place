import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Messages merged into Notifications inbox. */
export default function FarmerMessagesPage() {
  redirect("/farmer/notifications");
}
