import { FarmerRegisterForm } from "../FarmerRegisterForm";

export const dynamic = "force-dynamic";

/** Farmer registration — identity, required farm details, consent. */
export default function FarmerRegisterPage() {
  return (
    <div className="h-full">
      <FarmerRegisterForm />
    </div>
  );
}
