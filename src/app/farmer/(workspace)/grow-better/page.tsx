import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Grow Better was a link hub — Agronomy is the primary grow entry. */
export default function GrowBetterPage() {
  redirect("/farmer/agronomy");
}
