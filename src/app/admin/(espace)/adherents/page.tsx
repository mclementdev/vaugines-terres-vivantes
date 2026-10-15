import { BientotDisponible } from "@/components/admin/BientotDisponible";
import { exigerAdmin } from "@/lib/auth";

export const metadata = { title: "Adhérents" };
export const instant = false;

export default async function Page() {
  await exigerAdmin();
  return <BientotDisponible titre="Adhérents" lot={4} contenu={["Liste des adhésions par année d'AG, cotisations reçues ou attendues", "Relances, ajout d'un bulletin papier, export CSV", "Validation en assemblée générale"]} />;
}
