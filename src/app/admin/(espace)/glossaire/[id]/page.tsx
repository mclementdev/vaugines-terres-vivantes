import { notFound } from "next/navigation";

import { supprimerTerme } from "@/app/admin/actions/contenus";
import { BoutonSupprimer } from "@/components/admin/BoutonSupprimer";
import { FormulaireTerme } from "@/components/admin/FormulairesContenus";
import { EnTeteAdmin } from "@/components/admin/ui";
import { exigerAdmin } from "@/lib/auth";
import { clientSession } from "@/lib/supabase/serveur";

export const metadata = { title: "Modifier un terme" };
export const instant = false;

export default async function EditionTerme(props: PageProps<"/admin/glossaire/[id]">) {
  await exigerAdmin();
  const { id } = await props.params;
  const { cree } = await props.searchParams;
  const supabase = await clientSession();
  const [{ data: t }, { data: autres }] = await Promise.all([
    supabase.from("glossary_terms").select("*").eq("id", id).maybeSingle(),
    supabase.from("glossary_terms").select("slug, terme").neq("id", id).order("terme"),
  ]);
  if (!t) notFound();
  return (
    <>
      <EnTeteAdmin titre={t.terme} retour={{ href: "/admin/glossaire", libelle: "Glossaire" }} />
      <FormulaireTerme
        id={t.id}
        autresTermes={autres ?? []}
        messageInitial={cree ? "Terme créé." : undefined}
        initial={{ terme: t.terme, categorie: t.categorie, definition: t.definition, voirAussi: t.voir_aussi, aValider: t.to_validate, publie: t.status === "published" }}
        actionsSecondaires={<BoutonSupprimer action={supprimerTerme.bind(null, t.id)} quoi="ce terme" />}
      />
    </>
  );
}
