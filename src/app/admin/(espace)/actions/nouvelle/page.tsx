import { FormulaireAction } from "@/components/admin/FormulairesContenus";
import { EnTeteAdmin } from "@/components/admin/ui";
import { exigerAdmin } from "@/lib/auth";
import { clientSession } from "@/lib/supabase/serveur";

export const metadata = { title: "Nouvelle action" };
export const instant = false;

export default async function NouvelleAction() {
  await exigerAdmin();
  const supabase = await clientSession();
  const { data } = await supabase.from("commissions").select("id, nom").order("position");
  return (
    <>
      <EnTeteAdmin titre="Nouvelle action" retour={{ href: "/admin/actions", libelle: "Actions" }} />
      <FormulaireAction
        id={null}
        commissions={data ?? []}
        initial={{ titre: "", periode: "", resume: "", ton: "abricot", imagePath: null, imageAlt: "", lienLibelle: "", lienHref: "", commissionId: "", position: 10, publie: true }}
      />
    </>
  );
}
