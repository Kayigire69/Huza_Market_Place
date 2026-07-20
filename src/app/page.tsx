import type { Metadata } from "next";
import { PublicEntryPage } from "@/components/entry/PublicEntryPage";

export const metadata: Metadata = {
  title: "Youth Huza | Connecting Farmers with Customers Across Rwanda",
  description:
    "Youth Huza connects farmers with reliable markets and customers with fresh agricultural products through technology.",
  openGraph: {
    title: "Youth Huza",
    description:
      "Choose the Customer Website or Farmers Portal. Connecting farmers with customers across Rwanda.",
  },
};

/** Official Public Entry Page for www.youthhuza.rw */
export default function EntryPage() {
  return <PublicEntryPage />;
}
