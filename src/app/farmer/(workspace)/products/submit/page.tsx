import Link from "next/link";
import { FarmerPortalClient } from "../../../FarmerPortalClient";
import { FarmerPageHeader, FarmerPanel } from "@/components/portals/FarmerUi";
import { requireFarmerWorkspace } from "@/lib/farmer-workspace";

export const dynamic = "force-dynamic";

export default async function FarmerSubmitProductPage() {
  const { farmer, categories, purchaseOrders, stats } = await requireFarmerWorkspace();
  const hasMainCrop = stats.listed > 0;
  const accountReady = farmer.status === "APPROVED";

  return (
    <div>
      <FarmerPageHeader
        title={hasMainCrop ? "Submit another crop" : "Submit your main crop"}
      />

      {!accountReady ? (
        <FarmerPanel className="mb-5 max-w-2xl border-amber-200 bg-amber-50/70">
          <p className="text-sm font-semibold text-amber-950">Farm account not approved yet</p>
          <p className="mt-1 text-sm text-amber-900/90">
            You can prepare details now, but Youth Huza must approve your farm before harvest
            submissions are accepted.
          </p>
          <Link
            href="/farmer/approvals"
            className="mt-2 inline-block text-sm font-bold text-[var(--huza-green-dark)] underline underline-offset-4"
          >
            Check Approval Status
          </Link>
        </FarmerPanel>
      ) : null}

      <FarmerPanel className="mb-5 max-w-2xl !py-3">
        <p className="text-sm text-[var(--huza-muted)]">
          Submit <strong>raw farm crops only</strong> (fruits, vegetables, or seedlings).{" "}
          <strong>Fruit salads and juices are prepared by HUZA FRESH</strong>, not by farmers. Prefer one
          main crop in volume; update quantity on{" "}
          <Link href="/farmer/products" className="font-semibold text-[var(--huza-green-dark)] underline">
            My Crop Supply
          </Link>{" "}
          after each harvest.
        </p>
      </FarmerPanel>

      <FarmerPortalClient
        farmer={farmer as never}
        categories={categories}
        purchaseOrders={purchaseOrders}
        panel="submit"
      />
    </div>
  );
}
