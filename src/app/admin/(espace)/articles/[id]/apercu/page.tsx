import { notFound } from "next/navigation";

import { ArticleVue } from "@/components/site/ArticleVue";
import { exigerAdmin } from "@/lib/auth";
import { getArticles } from "@/lib/data/pages";
import { clientSession } from "@/lib/supabase/serveur";

export const metadata = { title: "Aperçu" };
export const instant = false;

/** Aperçu d'un article, même non publié, dans le gabarit du site. */
export default async function Apercu(props: PageProps<"/admin/articles/[id]/apercu">) {
  await exigerAdmin();
  const { id } = await props.params;
  const supabase = await clientSession();
  const [{ data: a }, tous] = await Promise.all([
    supabase
      .from("articles")
      .select("id, slug, titre, chapeau, cover_path, cover_alt, cover_caption, body_html, tags, published_at, updated_at, author_label, is_sample, categorie:categories(slug, nom, ton)")
      .eq("id", id)
      .maybeSingle(),
    getArticles(),
  ]);
  if (!a) notFound();
  return (
    <div className="-mx-5 -mt-6 bg-sable md:-mx-8 md:-mt-7">
      <p role="note" className="sticky top-0 z-10 bg-indigo px-5 py-2.5 text-center font-bold text-white">
        Aperçu : cet affichage n&apos;est visible que des administrateurs.
      </p>
      <ArticleVue a={{ ...a, published_at: a.published_at ?? a.updated_at }} tous={tous} apercu />
    </div>
  );
}
