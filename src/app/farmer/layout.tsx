import type { Metadata } from "next";
import { FarmerPortalShell } from "@/components/portals/FarmerPortalShell";

export const metadata: Metadata = {
  title: "Farmers Portal | Youth Huza",
  description:
    "Private Youth Huza farmers portal — sell produce to Huza. Not part of the HUZA FRESH customer shop.",
};

export default function FarmerLayout({ children }: { children: React.ReactNode }) {
  return <FarmerPortalShell>{children}</FarmerPortalShell>;
}
