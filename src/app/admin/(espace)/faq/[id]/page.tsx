import { notFound } from "next/navigation";

import { supprimerFaq } from "@/app/admin/actions/contenus";
import { BoutonSupprimer } from "@/components/admin/BoutonSupprimer";
import { FormulaireFaq } from "@/components/admin/FormulairesContenus";
import { EnTeteAdmin } from "@/components/admin/ui";
import { exigerAdmin } from "@/lib/auth";
import { clientSession } from "@/lib/supabase/serveur";

export const metadata = { title: "Modifier une question" };
export const instant = false;

export default async function EditionFaq(props: PageProps<"/admin/faq/[id]">) {
  await exigerAdmin();
  const { id } = await props.params;
  const { cree } = await props.searchParams;
  const supabase = await clientSession();
  const { data: q } = await supabase.from("faq_items").select("*").eq("id", id).maybeSingle();
  if (!q) notFound();
  return (
    <>
      <EnTeteAdmin titre="Modifier une question" retour={{ href: "/admin/faq", libelle: "FAQ" }} />
      <FormulaireFaq
        id={q.id}
        messageInitial={cree ? "Question créée." : undefined}
        initial={{
          categorie: q.category,
          question: q.question,
          reponseHtml: q.answer_html,
          position: q.position,
          accueil: q.show_on_home,
          aValider: q.to_validate,
          publie: q.status === "published",
        }}
        actionsSecondaires={<BoutonSupprimer action={supprimerFaq.bind(null, q.id)} quoi="cette question" />}
      />
    </>
  );
}
