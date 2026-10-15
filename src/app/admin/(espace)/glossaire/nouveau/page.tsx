import { FormulaireTerme } from "@/components/admin/FormulairesContenus";
import { EnTeteAdmin } from "@/components/admin/ui";
import { exigerAdmin } from "@/lib/auth";
import { clientSession } from "@/lib/supabase/serveur";

export const metadata = { title: "Nouveau terme" };
export const instant = false;

export default async function NouveauTerme() {
  await exigerAdmin();
  const supabase = await clientSession();
  const { data } = await supabase.from("glossary_terms").select("slug, terme").order("terme");
  return (
    <>
      <EnTeteAdmin titre="Nouveau terme" retour={{ href: "/admin/glossaire", libelle: "Glossaire" }} />
      <FormulaireTerme
        id={null}
        autresTermes={data ?? []}
        initial={{ terme: "", categorie: "democratie", definition: "", voirAussi: [], aValider: true, publie: true }}
      />
    </>
  );
}
