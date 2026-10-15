import { FormulaireFiche } from "@/components/admin/FormulairesContenus";
import { EnTeteAdmin } from "@/components/admin/ui";
import { exigerAdmin } from "@/lib/auth";
import { clientSession } from "@/lib/supabase/serveur";

export const metadata = { title: "Nouvelle fiche de veille" };
export const instant = false;

export default async function NouvelleFiche() {
  await exigerAdmin();
  const supabase = await clientSession();
  const { data } = await supabase.from("veille_dossiers").select("id, titre").order("created_at", { ascending: false });
  return (
    <>
      <EnTeteAdmin titre="Nouvelle fiche de veille" retour={{ href: "/admin/veille", libelle: "Veille" }} />
      <FormulaireFiche id={null} dossiers={data ?? []} initial={{ theme: "environnement", titre: "", resume: "", source: "", url: "", date: "", dossierId: "", publie: true }} />
    </>
  );
}
