import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Youth Huza — the team behind HUZA FRESH in Rwanda.",
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
