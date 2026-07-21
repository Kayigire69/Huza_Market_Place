import { FarmerRegisterForm } from "../FarmerRegisterForm";

export const dynamic = "force-dynamic";

/** Farmer registration — full identity + farm dossier (scrollable page). */
export default function FarmerRegisterPage() {
  return (
    <div className="w-full">
      <FarmerRegisterForm />
    </div>
  );
}
