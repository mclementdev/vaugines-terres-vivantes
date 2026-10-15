import { notFound } from "next/navigation";

import { supprimerAction } from "@/app/admin/actions/contenus";
import { BoutonSupprimer } from "@/components/admin/BoutonSupprimer";
import { FormulaireAction } from "@/components/admin/FormulairesContenus";
import { EnTeteAdmin } from "@/components/admin/ui";
import { exigerAdmin } from "@/lib/auth";
import { clientSession } from "@/lib/supabase/serveur";

export const metadata = { title: "Modifier une action" };
export const instant = false;

export default async function EditionAction(props: PageProps<"/admin/actions/[id]">) {
  await exigerAdmin();
  const { id } = await props.params;
  const { cree } = await props.searchParams;
  const supabase = await clientSession();
  const [{ data: a }, { data: commissions }] = await Promise.all([
    supabase.from("actions").select("*").eq("id", id).maybeSingle(),
    supabase.from("commissions").select("id, nom").order("position"),
  ]);
  if (!a) notFound();
  return (
    <>
      <EnTeteAdmin titre={a.titre} retour={{ href: "/admin/actions", libelle: "Actions" }} />
      <FormulaireAction
        id={a.id}
        commissions={commissions ?? []}
        messageInitial={cree ? "Action créée." : undefined}
        initial={{
          titre: a.titre,
          periode: a.periode,
          resume: a.resume,
          ton: a.ton,
          imagePath: a.image_path,
          imageAlt: a.image_alt ?? "",
          lienLibelle: a.lien_label ?? "",
          lienHref: a.lien_href ?? "",
          commissionId: a.commission_id ?? "",
          position: a.position,
          publie: a.status === "published",
        }}
        actionsSecondaires={<BoutonSupprimer action={supprimerAction.bind(null, a.id)} quoi="cette action" />}
      />
    </>
  );
}
