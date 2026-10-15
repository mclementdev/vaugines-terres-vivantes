import { BientotDisponible } from "@/components/admin/BientotDisponible";
import { exigerAdmin } from "@/lib/auth";

export const metadata = { title: "Modération" };
export const instant = false;

export default async function Page() {
  await exigerAdmin();
  return <BientotDisponible titre="Modération" lot={5} contenu={["Idées et commentaires à publier, faire modifier ou refuser", "Avancement des idées publiées, avec e-mail aux soutiens", "Historique des décisions"]} />;
}
