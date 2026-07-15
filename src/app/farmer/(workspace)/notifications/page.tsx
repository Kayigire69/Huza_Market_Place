import { FarmerComingSoon, FarmerPageHeader } from "@/components/portals/FarmerUi";

export default function FarmerNotificationsPage() {
  return (
    <div>
      <FarmerPageHeader
        title="Notifications"
        subtitle="Approvals, purchase orders, payments, and agronomist replies in one inbox."
      />
      <FarmerComingSoon
        title="Inbox coming with Account phase"
        body="You’ll see farm account updates, product review results, and support replies here."
        ctaHref="/farmer/approvals"
        ctaLabel="Check Approval Status"
      />
    </div>
  );
}
