import type { Metadata } from "next";
import { PublicEntryPage } from "@/components/entry/PublicEntryPage";

export const metadata: Metadata = {
  title: "Youth Huza | Fresh produce for customers. Fair market for farmers",
  description:
    "Youth Huza helps farmers with quality crops reach the market at a good price, and connects customers with fresh produce on HUZA FRESH.",
  openGraph: {
    title: "Youth Huza",
    description:
      "Shop fresh produce on HUZA FRESH, or join as a farmer for support and a fair market price.",
  },
};

export default function EntryPage() {
  return <PublicEntryPage />;
}
