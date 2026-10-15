import type { Metadata } from "next";
import Image from "next/image";

import { EnTetePage } from "@/components/site/EnTetePage";
import { LienBouton } from "@/components/ui/Bouton";
import { Etiquette } from "@/components/ui/Etiquette";
import { ListeVeille } from "@/components/veille/ListeVeille";
import { SignalerInfo } from "@/components/veille/SignalerInfo";
import { getVeille } from "@/lib/data/pages";
import { dateLongue } from "@/lib/dates";
import { urlImage } from "@/lib/images";

export const metadata: Metadata = {
  title: "Veille",
  description: "Les défis d'aujourd'hui et de demain pour Vaugines : environnement, urbanisme, eau, énergie, démocratie locale. Des fiches courtes, sourcées et datées.",
  alternates: { canonical: "/veille" },
};

export default async function Veille() {
  const { dossier, nbFichesDossier, fiches } = await getVeille();

  return (
    <>
      <EnTetePage
        surtitre="Veille"
        titre="Les défis d'aujourd'hui et de demain"
        intro={
          <p>Ce que nous suivons de près pour Vaugines : des fiches courtes, sourcées et datées, pour comprendre et débattre.</p>
        }
        actions={<SignalerInfo />}
      />
      <div className="conteneur pb-[100px]">
        {dossier && (
          <article className="sur-sombre mb-12 flex flex-wrap overflow-hidden rounded-[30px] bg-brun text-sable">
            {dossier.image_path && (
              <div className="relative min-h-[220px] w-full flex-[1_1_420px] md:min-h-[340px]">
                <Image src={urlImage(dossier.image_path)} alt={dossier.image_alt ?? ""} fill sizes="(min-width: 900px) 600px, 100vw" className="object-cover" />
              </div>
            )}
            <div className="flex flex-[1_1_420px] flex-col gap-3.5 p-7 md:p-10">
              <Etiquette className="self-start bg-abricot text-brun">Dossier du moment</Etiquette>
              <h2 className="font-titre text-[28px] font-semibold leading-[1.1] md:text-[34px]">{dossier.titre}</h2>
              <p className="text-creme-2">{dossier.intro}</p>
              <p className="text-sm text-[#CDB9A2]">
                {nbFichesDossier} fiche{nbFichesDossier > 1 ? "s" : ""} · mis à jour le {dateLongue(dossier.updated_at)}
              </p>
              {dossier.article && (
                <LienBouton href={`/actualites/${dossier.article.slug}`} variante="blanc" className="mt-2 self-start">
                  Lire le dossier
                </LienBouton>
              )}
            </div>
          </article>
        )}
        <ListeVeille fiches={fiches} />
      </div>
    </>
  );
}
