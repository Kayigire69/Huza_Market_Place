import { renderAdminModule } from "../_module";

export const dynamic = "force-dynamic";

export default async function Page() {
  return renderAdminModule("staff");
}
