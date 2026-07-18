import { redirect } from "next/navigation";

export default async function FarmerSupportRedirect({
  searchParams,
}: {
  searchParams?: Promise<{ topic?: string }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const topic = sp.topic ? `?topic=${encodeURIComponent(sp.topic)}` : "";
  redirect(`/farmer/training${topic}`);
}
