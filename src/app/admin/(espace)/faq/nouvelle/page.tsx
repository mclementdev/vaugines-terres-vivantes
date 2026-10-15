import { FormulaireFaq } from "@/components/admin/FormulairesContenus";
import { EnTeteAdmin } from "@/components/admin/ui";
import { exigerAdmin } from "@/lib/auth";

export const metadata = { title: "Nouvelle question" };
export const instant = false;

export default async function NouvelleFaq() {
  await exigerAdmin();
  return (
    <>
      <EnTeteAdmin titre="Nouvelle question" retour={{ href: "/admin/faq", libelle: "FAQ" }} />
      <FormulaireFaq
        id={null}
        initial={{ categorie: "association", question: "", reponseHtml: "", position: 10, accueil: false, aValider: false, publie: true }}
      />
    </>
  );
}
