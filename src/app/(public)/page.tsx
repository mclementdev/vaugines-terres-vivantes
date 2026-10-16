import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";

import { Actions } from "@/components/accueil/Actions";
import { Actualites } from "@/components/accueil/Actualites";
import { Agenda } from "@/components/accueil/Agenda";
import { Appel } from "@/components/accueil/Appel";
import { Association, Gouvernance, PourquoiCeNom } from "@/components/accueil/Association";
import { Chiffres } from "@/components/accueil/Chiffres";
import { Hero } from "@/components/accueil/Hero";
import { IdeesEtFaq } from "@/components/accueil/IdeesEtFaq";
import { JsonLdOrganisation } from "@/components/site/JsonLd";
import {
  getActions,
  getArticlesRecents,
  getEvenementsAVenir,
  getFaqAccueil,
  getIdeesPopulaires,
} from "@/lib/data/contenus";
import { getBlocsAccueil, getConseil, getReglages } from "@/lib/data/site";
import { TAGS } from "@/lib/data/tags";

export const metadata: Metadata = { alternates: { canonical: "/" } };

/**
 * Accueil, entièrement alimenté par la base. Mis en cache (dates relatives
 * comprises) et rafraîchi toutes les 5 minutes ou à chaque publication.
 */
export default async function Accueil() {
  "use cache";
  cacheLife("contenu");
  cacheTag(...Object.values(TAGS));

  const [reglages, blocs, conseil, actions, evenements, articles, idees, faq] = await Promise.all([
    getReglages(),
    getBlocsAccueil(),
    getConseil(),
    getActions(),
    getEvenementsAVenir(4),
    getArticlesRecents(3),
    getIdeesPopulaires(3),
    getFaqAccueil(),
  ]);

  return (
    <>
      <JsonLdOrganisation reglages={reglages} />
      <Hero bloc={blocs.hero} />
      <Chiffres reglages={reglages} />
      <Association bloc={blocs.association} />
      <PourquoiCeNom bloc={blocs.nom} />
      <Gouvernance bloc={blocs.gouvernance} conseil={conseil} />
      <Actions actions={actions} />
      <Agenda evenements={evenements} />
      <Actualites articles={articles} />
      <IdeesEtFaq bloc={blocs.idees} idees={idees} faq={faq} />
      <Appel appel={blocs.appel} lettre={blocs.lettre} />
    </>
  );
}
