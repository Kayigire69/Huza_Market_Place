import ConfirmationClient from "./ConfirmationClient";

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const sp = await searchParams;
  return <ConfirmationClient orderNumber={sp.order} />;
}
