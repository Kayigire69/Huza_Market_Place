import { FarmerComingSoon, FarmerPageHeader } from "@/components/portals/FarmerUi";

export default function FarmerNotificationsPage() {
  return (
    <div>
      <FarmerPageHeader title="Notifications" />
      <FarmerComingSoon
        title="Inbox coming soon"
        body="Farm account updates, product review results, and support replies will appear here."
        ctaHref="/farmer/approvals"
        ctaLabel="Check Approval Status"
      />
    </div>
  );
}
