import { FarmerMyFarmClient } from "@/components/portals/FarmerMyFarmClient";
import { requireFarmerWorkspace } from "@/lib/farmer-workspace";

export const dynamic = "force-dynamic";

export default async function FarmerMyFarmPage() {
  const { farmer } = await requireFarmerWorkspace();

  return (
    <FarmerMyFarmClient
      farmer={{
        businessName: farmer.businessName,
        farmingType: farmer.farmingType,
        phone: farmer.phone,
        email: farmer.email,
        farmSize: farmer.farmSize,
        status: farmer.status,
        isVerified: farmer.isVerified,
        description: farmer.description,
        district: farmer.district,
        sector: farmer.sector,
        cell: farmer.cell,
        village: farmer.village,
        province: farmer.province,
        location: farmer.location,
        productsOffered: farmer.productsOffered,
        currentCrop: farmer.currentCrop,
        productCategories: farmer.productCategories,
        fieldType: farmer.fieldType,
        irrigationMethod: farmer.irrigationMethod,
        productionCapacity: farmer.productionCapacity,
        farmPhotoUrls: farmer.farmPhotoUrls || [],
        organicCertUrl: farmer.organicCertUrl,
        nationalIdUrl: farmer.nationalIdUrl,
        permitUrl: farmer.permitUrl,
        businessCertUrl: farmer.businessCertUrl,
        fullName: farmer.user?.fullName || null,
      }}
    />
  );
}
