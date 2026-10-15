import type { Metadata } from "next";

import { Accordeon } from "@/components/site/Accordeon";
import { EnTetePage } from "@/components/site/EnTetePage";
import { LienBouton } from "@/components/ui/Bouton";
import { getFaq } from "@/lib/data/pages";
import { getReglages } from "@/lib/data/site";
import { CATEGORIES_FAQ, type CategorieFaq } from "@/lib/libelles";

export const metadata: Metadata = {
  title: "Questions fréquentes",
  description: "Adhésion, cotisation, événements, commissions, données personnelles : les réponses aux questions les plus fréquentes.",
  alternates: { canonical: "/faq" },
};

export default async function Faq() {
  const [questions, reglages] = await Promise.all([getFaq(), getReglages()]);
  const categories = (Object.keys(CATEGORIES_FAQ) as CategorieFaq[])
    .map((c) => ({ cle: c, libelle: CATEGORIES_FAQ[c], items: questions.filter((q) => q.category === c) }))
    .filter((c) => c.items.length > 0);

  // Données structurées FAQPage (hors réponses encore à valider).
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions
      .filter((q) => !q.to_validate)
      .map((q) => ({
        "@type": "Question",
        name: q.question,
        acceptedAnswer: { "@type": "Answer", text: q.answer_html.replace(/<[^>]+>/g, "") },
      })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <EnTetePage surtitre="Questions fréquentes" titre="Vous vous demandez…" />
      <div className="conteneur flex flex-wrap items-start gap-10 pb-[100px]">
        <nav aria-label="Catégories" className="min-w-0 flex-[1_1_240px] lg:sticky lg:top-24">
          <ul className="flex flex-wrap gap-1 lg:flex-col">
            {categories.map((c) => (
              <li key={c.cle}>
                <a
                  href={`#q-${c.cle}`}
                  className="block rounded-[14px] px-4 py-3 font-semibold text-encre no-underline hover:bg-terre hover:text-white"
                >
                  {c.libelle}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex min-w-0 flex-[999_1_600px] flex-col gap-10">
          {categories.map((c, i) => (
            <section key={c.cle} id={`q-${c.cle}`} aria-labelledby={`t-${c.cle}`} className="scroll-mt-28">
              <h2 id={`t-${c.cle}`} className="mb-3.5 font-titre text-[26px] font-semibold">
                {c.libelle}
              </h2>
              <div className="flex flex-col gap-2.5">
                {c.items.map((q, j) => (
                  <Accordeon key={q.id} question={q.question} reponseHtml={q.answer_html} ouvert={i === 0 && j === 0} />
                ))}
              </div>
            </section>
          ))}

          <div className="sur-sombre flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-brun px-[30px] py-7 text-sable">
            <div>
              <p className="font-titre text-[22px] font-semibold">Pas trouvé votre réponse ?</p>
              <p className="text-creme-2">Une question, une idée, un point de vue : écrivez-nous.</p>
            </div>
            <LienBouton href={`mailto:${reglages.email}`} variante="blanc">
              Nous écrire
            </LienBouton>
          </div>
        </div>
      </div>
    </>
  );
}
