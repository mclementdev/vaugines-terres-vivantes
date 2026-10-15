import { notFound } from "next/navigation";

import { FormulaireDossier } from "@/components/admin/FormulairesContenus";
import { EnTeteAdmin } from "@/components/admin/ui";
import { exigerAdmin } from "@/lib/auth";
import { clientSession } from "@/lib/supabase/serveur";

export const metadata = { title: "Modifier un dossier" };
export const instant = false;

export default async function EditionDossier(props: PageProps<"/admin/veille/dossiers/[id]">) {
  await exigerAdmin();
  const { id } = await props.params;
  const { cree } = await props.searchParams;
  const supabase = await clientSession();
  const [{ data: d }, { data: articles }] = await Promise.all([
    supabase.from("veille_dossiers").select("*").eq("id", id).maybeSingle(),
    supabase.from("articles").select("id, titre").neq("status", "trashed").order("updated_at", { ascending: false }),
  ]);
  if (!d) notFound();
  return (
    <>
      <EnTeteAdmin titre="Modifier un dossier" retour={{ href: "/admin/veille?vue=dossiers", libelle: "Dossiers" }} />
      <FormulaireDossier
        id={d.id}
        articles={articles ?? []}
        messageInitial={cree ? "Dossier créé." : undefined}
        initial={{ titre: d.titre, intro: d.intro, imagePath: d.image_path, imageAlt: d.image_alt ?? "", articleId: d.article_id ?? "", aLaUne: d.featured, publie: d.status === "published" }}
      />
    </>
  );
}
