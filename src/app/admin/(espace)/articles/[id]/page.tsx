import { notFound } from "next/navigation";

import { restaurerArticle, supprimerArticle } from "@/app/admin/actions/articles";
import { FormulaireArticle } from "@/components/admin/FormulaireArticle";
import { BoutonAdmin, EnTeteAdmin } from "@/components/admin/ui";
import { isoVersParis } from "@/lib/admin/outils";
import { modeActuel } from "@/lib/admin/publication";
import { exigerAdmin } from "@/lib/auth";
import { clientSession } from "@/lib/supabase/serveur";

export const metadata = { title: "Éditer un article" };
export const instant = false;

export default async function EditionArticle(props: PageProps<"/admin/articles/[id]">) {
  await exigerAdmin();
  const { id } = await props.params;
  const supabase = await clientSession();
  const [article, categories, evenements] = await Promise.all([
    supabase.from("articles").select("*").eq("id", id).maybeSingle(),
    supabase.from("categories").select("id, nom").order("position"),
    supabase.from("events").select("titre, slug").eq("status", "published").order("starts_at", { ascending: false }).limit(30),
  ]);
  if (!article.data) notFound();
  const a = article.data;

  if (a.status === "trashed") {
    return (
      <>
        <EnTeteAdmin titre={a.titre || "Sans titre"} retour={{ href: "/admin/articles?vue=corbeille", libelle: "Corbeille" }} />
        <div className="flex flex-col gap-4 rounded-[20px] bg-white p-6">
          <p>Cet article est dans la corbeille : il n&apos;est pas visible sur le site.</p>
          <div className="flex flex-wrap gap-2.5">
            <form action={restaurerArticle.bind(null, a.id)}>
              <BoutonAdmin type="submit">Restaurer en brouillon</BoutonAdmin>
            </form>
            <form action={supprimerArticle.bind(null, a.id)}>
              <BoutonAdmin type="submit" variante="danger">
                Supprimer définitivement
              </BoutonAdmin>
            </form>
          </div>
        </div>
      </>
    );
  }

  return (
    <FormulaireArticle
      article={a}
      categories={categories.data ?? []}
      evenements={evenements.data ?? []}
      modeInitial={modeActuel(a.status, a.published_at)}
      dateInitiale={isoVersParis(a.status === "published" ? a.published_at : null)}
    />
  );
}
