import { BientotDisponible } from "@/components/admin/BientotDisponible";
import { exigerAdmin } from "@/lib/auth";

export const metadata = { title: "Newsletter IA" };
export const instant = false;

export default async function Page() {
  await exigerAdmin();
  return <BientotDisponible titre="Newsletter IA" lot={6} contenu={["Choix des contenus publiés depuis le dernier envoi", "Brouillon rédigé par l'IA dans le ton de l'association", "Envoi, programmation et historique"]} />;
}
