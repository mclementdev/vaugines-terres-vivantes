import type { Metadata } from "next";

import { CarteArticle } from "@/components/site/CarteArticle";
import { EnTetePage } from "@/components/site/EnTetePage";
import { getArticles } from "@/lib/data/pages";

export const metadata: Metadata = {
  title: "Actualités",
  description: "La vie de l'association vaugines, terres vivantes : rencontres, projets, appels à participation.",
  alternates: { canonical: "/actualites" },
};

export default async function Actualites() {
  const articles = await getArticles();
  return (
    <>
      <EnTetePage surtitre="Actualités" titre="La vie de l'association" />
      <div className="conteneur pb-[100px]">
        {articles.length === 0 ? (
          <p className="rounded-[22px] bg-white p-8 text-encre-2">Pas encore d&apos;actualité publiée.</p>
        ) : (
          <ul className="grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr))]">
            {articles.map((a) => (
              <li key={a.id}>
                <CarteArticle article={a} titreNiveau={2} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
