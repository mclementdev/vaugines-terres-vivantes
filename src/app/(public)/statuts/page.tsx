import type { Metadata } from "next";
import Link from "next/link";

import { BoutonImprimer } from "@/components/site/BoutonImprimer";
import { EnTetePage } from "@/components/site/EnTetePage";
import { Sommaire } from "@/components/statuts/Sommaire";
import { LienBouton } from "@/components/ui/Bouton";
import { getStatuts } from "@/lib/data/pages";
import { getReglages } from "@/lib/data/site";

export const metadata: Metadata = {
  title: "Statuts",
  description: "Les statuts de l'association vaugines, terres vivantes, en 18 articles : objet, gouvernance collégiale, adhésion, assemblées.",
  alternates: { canonical: "/statuts" },
};

export default async function Statuts() {
  const [articles, reglages] = await Promise.all([getStatuts(), getReglages()]);
  const signature = reglages.statuts;

  return (
    <>
      <EnTetePage
        bandeau
        surtitre="L'association"
        titre="Nos statuts"
        intro={
          <p>
            Association loi 1901 · statuts signés à Vaugines le 20 avril 2026 · {articles.length} articles
          </p>
        }
        actions={
          <>
            <LienBouton href="/statuts/statuts-vtv.pdf" prefetch={false} download="statuts-vaugines-terres-vivantes.pdf">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M10 3v10M5.5 8.5L10 13l4.5-4.5M4 17h12" />
              </svg>
              Télécharger le PDF
            </LienBouton>
            <BoutonImprimer />
          </>
        }
      />

      <div className="conteneur flex flex-wrap items-start gap-10 pb-[100px] pt-12">
        <Sommaire articles={articles.map(({ numero, titre }) => ({ numero, titre }))} />

        <article className="flex min-w-0 max-w-[780px] flex-[999_1_600px] flex-col gap-[34px]">
          <aside className="flex items-start gap-3 rounded-[18px] bg-white px-5 py-4 text-[15px] text-encre-2 print:hidden">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#34409A" strokeWidth="1.8" aria-hidden="true" className="mt-0.5 shrink-0">
              <circle cx="10" cy="10" r="8" />
              <path d="M10 9v5M10 6v.5" />
            </svg>
            <p>
              Un mot vous échappe ? Les termes soulignés en pointillé renvoient au <Link href="/glossaire">glossaire</Link>{" "}
              (ex. <Link href="/glossaire#consensus">consensus</Link>, <Link href="/glossaire#consentement">consentement</Link>).
            </p>
          </aside>

          {articles.map((a) => (
            <section key={a.numero} id={`a${a.numero}`} aria-labelledby={`t${a.numero}`} className="article-statuts scroll-mt-28">
              <h2 id={`t${a.numero}`}>
                <span>Art. {a.numero}</span>
                {a.titre}
              </h2>
              <div dangerouslySetInnerHTML={{ __html: a.body_html }} />
            </section>
          ))}

          {signature && (
            <div className="border-t border-bordure pt-5 text-[15px] text-encre-3">
              <p>{signature.fait_a}.</p>
              <p className="mt-1">{signature.signataires.map((s) => `${s.nom}, ${s.qualite}`).join(" · ")}</p>
            </div>
          )}

          <div className="sur-sombre flex flex-wrap items-center justify-between gap-4 rounded-[22px] bg-terre px-7 py-[26px] text-white print:hidden">
            <p className="font-titre text-[22px] font-semibold">Ces valeurs vous parlent ?</p>
            <LienBouton href="/adherer" variante="blanc" className="text-terre-fonce">
              Adhérer
            </LienBouton>
          </div>
        </article>
      </div>
    </>
  );
}
