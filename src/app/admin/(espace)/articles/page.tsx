import Link from "next/link";

import { creerArticle } from "@/app/admin/actions/articles";
import { BoutonAdmin, EnTeteAdmin, PastilleStatut, TableauVide } from "@/components/admin/ui";
import { etatPublication } from "@/lib/admin/outils";
import { exigerAdmin } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { dateLongue } from "@/lib/dates";
import { clientSession } from "@/lib/supabase/serveur";

export const metadata = { title: "Articles" };
export const instant = false;

const VUES = [
  { cle: "tous", libelle: "Tous" },
  { cle: "brouillon", libelle: "Brouillons" },
  { cle: "programme", libelle: "Programmés" },
  { cle: "publie", libelle: "Publiés" },
  { cle: "corbeille", libelle: "Corbeille" },
] as const;

export default async function ListeArticles(props: PageProps<"/admin/articles">) {
  await exigerAdmin();
  const sp = await props.searchParams;
  const vue = VUES.find((v) => v.cle === sp.vue)?.cle ?? "tous";
  const supabase = await clientSession();
  const { data } = await supabase
    .from("articles")
    .select("id, titre, slug, status, published_at, updated_at, featured, is_sample, categorie:categories(nom)")
    .order("updated_at", { ascending: false });

  const tous = data ?? [];
  const compte = (cle: string) => tous.filter((a) => (cle === "tous" ? a.status !== "trashed" : etatPublication(a.status, a.published_at) === cle)).length;
  const lignes = tous.filter((a) => (vue === "tous" ? a.status !== "trashed" : etatPublication(a.status, a.published_at) === vue));

  return (
    <>
      <EnTeteAdmin
        titre="Articles"
        actions={
          <form action={creerArticle}>
            <BoutonAdmin type="submit">+ Nouvel article</BoutonAdmin>
          </form>
        }
      />
      {sp.corbeille && (
        <p role="status" className="mb-4 rounded-[14px] bg-tag-olive px-4 py-3 font-semibold text-tag-olive-fg">
          Article mis à la corbeille.
        </p>
      )}
      <nav aria-label="Filtrer les articles" className="mb-4 flex flex-wrap gap-2">
        {VUES.map((v) => (
          <Link
            key={v.cle}
            href={v.cle === "tous" ? "/admin/articles" : `/admin/articles?vue=${v.cle}`}
            aria-current={vue === v.cle ? "page" : undefined}
            className={cn(
              "rounded-full border-[1.5px] px-3.5 py-2 text-[15px] font-bold no-underline",
              vue === v.cle ? "border-terre bg-terre text-white hover:text-white" : "border-bordure-douce bg-white text-encre",
            )}
          >
            {v.libelle} · {compte(v.cle)}
          </Link>
        ))}
      </nav>

      {lignes.length === 0 ? (
        <TableauVide>Aucun article dans cette vue.</TableauVide>
      ) : (
        <div className="overflow-x-auto rounded-[20px] bg-white">
          <table className="w-full min-w-[640px] text-left">
            <caption className="sr-only">Articles</caption>
            <thead className="border-b border-[#F0E6D8] text-sm text-encre-3">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">Titre</th>
                <th scope="col" className="px-3 py-3 font-semibold">Catégorie</th>
                <th scope="col" className="px-3 py-3 font-semibold">Statut</th>
                <th scope="col" className="px-5 py-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {lignes.map((a) => (
                <tr key={a.id} className="border-t border-[#F0E6D8] first:border-t-0">
                  <td className="px-5 py-3">
                    <Link href={`/admin/articles/${a.id}`} className="font-bold">
                      {a.titre || "Sans titre"}
                    </Link>
                    <span className="block text-sm text-encre-3">
                      {a.featured && "À la une · "}
                      {a.is_sample && "Exemple fictif"}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-encre-2">{a.categorie?.nom ?? "—"}</td>
                  <td className="px-3 py-3">
                    <PastilleStatut status={a.status} publishedAt={a.published_at} />
                  </td>
                  <td className="px-5 py-3 text-sm text-encre-3">{dateLongue(a.published_at ?? a.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
