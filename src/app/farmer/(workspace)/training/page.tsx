import { FarmerTrainingClient } from "@/components/portals/FarmerTrainingClient";

export default async function FarmerTrainingPage({
  searchParams,
}: {
  searchParams?: Promise<{ topic?: string }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const topic = sp.topic || "";
  return <FarmerTrainingClient qualityFocus={topic === "quality-standards"} />;
}
