import Link from "next/link";

import { Accordeon } from "@/components/site/Accordeon";
import { BoutonSoutien, FournisseurSoutiens } from "@/components/site/BoutonSoutien";
import { LienBouton } from "@/components/ui/Bouton";
import { Etiquette } from "@/components/ui/Etiquette";
import type { getFaqAccueil, getIdeesPopulaires } from "@/lib/data/contenus";
import type { BlocsAccueil } from "@/lib/data/site";
import { AVANCEMENT_IDEES, THEMES_IDEES } from "@/lib/libelles";

type Props = {
  bloc: BlocsAccueil["idees"];
  idees: Awaited<ReturnType<typeof getIdeesPopulaires>>;
  faq: Awaited<ReturnType<typeof getFaqAccueil>>;
};

export function IdeesEtFaq({ bloc, idees, faq }: Props) {
  return (
    <section id="idees" aria-label="Boîte à idées et questions fréquentes" className="bg-pierre">
      <div className="conteneur flex flex-wrap gap-12 py-14 md:py-[100px]">
        <div className="min-w-0 flex-[1_1_480px]">
          <p className="surtitre">{bloc.surtitre}</p>
          <h2 className="mb-3 font-titre text-[28px] font-semibold leading-[1.1] tracking-[-0.02em] md:text-[clamp(30px,3.4vw,44px)]">
            {bloc.titre}
          </h2>
          <p className="mb-6 text-encre-2">{bloc.texte}</p>
          {idees.length > 0 && (
            <FournisseurSoutiens ids={idees.map((i) => i.id)}>
              <ul className="mb-4 flex flex-col gap-2.5 md:mb-6 md:gap-3">
                {idees.map((i) => {
                  const statut = AVANCEMENT_IDEES[i.progress];
                  return (
                    <li key={i.id} className="flex items-center gap-3 rounded-2xl bg-white p-3.5 md:gap-4 md:rounded-[18px] md:px-5 md:py-[18px]">
                      <BoutonSoutien id={i.id} soutiens={i.support_count} titre={i.titre} />
                      <span className="min-w-0 flex-1">
                        <Link href={`/idees/${i.slug}`} className="block font-bold leading-snug text-encre no-underline hover:text-terre-fonce">
                          {i.titre}
                        </Link>
                        <span className="text-sm text-encre-3">
                          {THEMES_IDEES[i.theme]} · {i.comment_count} commentaire{i.comment_count > 1 ? "s" : ""}
                        </span>
                      </span>
                      <Etiquette className={`hidden sm:inline-block ${statut.classes}`}>{statut.libelle}</Etiquette>
                    </li>
                  );
                })}
              </ul>
            </FournisseurSoutiens>
          )}
          {idees.some((i) => i.is_sample) && (
            <p className="mb-5 text-sm text-encre-3">Idées données à titre d&apos;exemple (fictives).</p>
          )}
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <LienBouton href="/idees/nouvelle">Proposer une idée</LienBouton>
            <LienBouton href="/idees" variante="lien">
              Voir toutes les idées <span aria-hidden="true">→</span>
            </LienBouton>
          </div>
        </div>

        <div className="min-w-0 flex-[1_1_420px]">
          <p className="surtitre">Questions fréquentes</p>
          <h2 className="mb-6 font-titre text-[28px] font-semibold leading-[1.1] tracking-[-0.02em] md:text-[clamp(30px,3.4vw,44px)]">
            Vous vous demandez…
          </h2>
          <div className="flex flex-col gap-2.5">
            {faq.map((q, i) => (
              <Accordeon key={q.id} question={q.question} reponseHtml={q.answer_html} ouvert={i === 0} />
            ))}
          </div>
          <Link href="/faq" className="mt-[18px] inline-block py-2 font-bold">
            Toute la FAQ <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
