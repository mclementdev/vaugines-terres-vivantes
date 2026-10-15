import { notFound } from "next/navigation";

import { supprimerFiche } from "@/app/admin/actions/contenus";
import { BoutonSupprimer } from "@/components/admin/BoutonSupprimer";
import { FormulaireFiche } from "@/components/admin/FormulairesContenus";
import { EnTeteAdmin } from "@/components/admin/ui";
import { exigerAdmin } from "@/lib/auth";
import { clientSession } from "@/lib/supabase/serveur";

export const metadata = { title: "Modifier une fiche" };
export const instant = false;

export default async function EditionFiche(props: PageProps<"/admin/veille/[id]">) {
  await exigerAdmin();
  const { id } = await props.params;
  const { cree } = await props.searchParams;
  const supabase = await clientSession();
  const [{ data: f }, { data: dossiers }] = await Promise.all([
    supabase.from("veille_items").select("*").eq("id", id).maybeSingle(),
    supabase.from("veille_dossiers").select("id, titre"),
  ]);
  if (!f) notFound();
  return (
    <>
      <EnTeteAdmin titre="Modifier une fiche" retour={{ href: "/admin/veille", libelle: "Veille" }} />
      <FormulaireFiche
        id={f.id}
        dossiers={dossiers ?? []}
        messageInitial={cree ? "Fiche créée." : undefined}
        initial={{
          theme: f.theme,
          titre: f.titre,
          resume: f.resume,
          source: f.source_label,
          url: f.source_url ?? "",
          date: f.date_info ?? "",
          dossierId: f.dossier_id ?? "",
          publie: f.status === "published",
        }}
        actionsSecondaires={<BoutonSupprimer action={supprimerFiche.bind(null, f.id)} quoi="cette fiche" />}
      />
    </>
  );
}
