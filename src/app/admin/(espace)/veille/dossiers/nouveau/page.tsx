import { FormulaireDossier } from "@/components/admin/FormulairesContenus";
import { EnTeteAdmin } from "@/components/admin/ui";
import { exigerAdmin } from "@/lib/auth";
import { clientSession } from "@/lib/supabase/serveur";

export const metadata = { title: "Nouveau dossier" };
export const instant = false;

export default async function NouveauDossier() {
  await exigerAdmin();
  const supabase = await clientSession();
  const { data } = await supabase.from("articles").select("id, titre").neq("status", "trashed").order("updated_at", { ascending: false });
  return (
    <>
      <EnTeteAdmin titre="Nouveau dossier de veille" retour={{ href: "/admin/veille?vue=dossiers", libelle: "Dossiers" }} />
      <FormulaireDossier id={null} articles={data ?? []} initial={{ titre: "", intro: "", imagePath: null, imageAlt: "", articleId: "", aLaUne: true, publie: true }} />
    </>
  );
}
