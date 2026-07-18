import Link from "next/link";
import { FarmerPageHeader, FarmerPanel } from "@/components/portals/FarmerUi";
import { Button } from "@/components/ui/Button";
import { requireFarmerWorkspace } from "@/lib/farmer-workspace";

export const dynamic = "force-dynamic";

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--huza-muted)]">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-[var(--huza-ink)]">{value}</p>
    </div>
  );
}

export default async function FarmerMyFarmPage() {
  const { farmer } = await requireFarmerWorkspace();
  const isOrganic = farmer.farmingType !== "STANDARD";
  const crops =
    farmer.productsOffered ||
    farmer.currentCrop ||
    farmer.productCategories ||
    "Not listed yet";

  return (
    <div>
      <FarmerPageHeader
        title="My Farm"
        subtitle="Farm profile Youth Huza uses for buying and support visits."
        action={
          <Link href="/farmer/settings">
            <Button variant="ghost">Edit in Settings</Button>
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <FarmerPanel>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--huza-green-dark)]">
            Farm information
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold text-[var(--huza-ink)]">
            {farmer.businessName}
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Farmer" value={farmer.user?.fullName} />
            <Field label="Phone" value={farmer.phone} />
            <Field label="Email" value={farmer.email} />
            <Field
              label="Farming type"
              value={isOrganic ? "Organic dossier" : "Standard seller"}
            />
            <Field label="Farm size" value={farmer.farmSize} />
            <Field
              label="Status"
              value={`${farmer.status}${farmer.isVerified ? " · Verified" : ""}`}
            />
          </div>
          {farmer.description ? (
            <p className="mt-4 text-sm text-[var(--huza-muted)]">{farmer.description}</p>
          ) : null}
        </FarmerPanel>

        <FarmerPanel>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--huza-green-dark)]">
            Location
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="District" value={farmer.district} />
            <Field label="Sector" value={farmer.sector} />
            <Field label="Cell" value={farmer.cell} />
            <Field label="Village" value={farmer.village} />
            <Field label="Province" value={farmer.province} />
            <Field label="Address / landmark" value={farmer.location} />
          </div>
          <p className="mt-3 text-xs text-[var(--huza-muted)]">
            GPS field visits are scheduled by Youth Huza when needed. Request a visit from Agronomy
            Support.
          </p>
        </FarmerPanel>

        <FarmerPanel>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--huza-green-dark)]">
            Crops grown
          </p>
          <p className="mt-2 text-sm text-[var(--huza-ink)]">{crops}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Field type" value={farmer.fieldType} />
            <Field label="Irrigation" value={farmer.irrigationMethod} />
            <Field
              label="Organic / status"
              value={isOrganic ? "Organic path" : "Non-organic / standard"}
            />
            <Field label="Production capacity" value={farmer.productionCapacity} />
          </div>
        </FarmerPanel>

        <FarmerPanel>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--huza-green-dark)]">
            Photos &amp; certifications
          </p>
          {farmer.farmPhotoUrls?.length ? (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {farmer.farmPhotoUrls.slice(0, 6).map((url) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={url}
                  src={url}
                  alt="Farm"
                  className="aspect-square rounded-lg object-cover"
                />
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-[var(--huza-muted)]">No farm photos uploaded yet.</p>
          )}
          <div className="mt-4 space-y-1 text-sm">
            <Field label="Organic certificate" value={farmer.organicCertUrl ? "On file" : "Not uploaded"} />
            <Field label="National ID doc" value={farmer.nationalIdUrl ? "On file" : "Not uploaded"} />
            <Field label="Business / permit" value={farmer.permitUrl || farmer.businessCertUrl ? "On file" : "Not uploaded"} />
          </div>
          <Link
            href="/farmer/settings"
            className="mt-4 inline-block text-sm font-bold text-[var(--huza-green-dark)] underline underline-offset-4"
          >
            Update farm details in Settings
          </Link>
        </FarmerPanel>
      </div>
    </div>
  );
}
