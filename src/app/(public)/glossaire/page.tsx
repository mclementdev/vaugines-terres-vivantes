import type { Metadata } from "next";

import { EnTetePage } from "@/components/site/EnTetePage";
import { Glossaire } from "@/components/glossaire/Glossaire";
import { getGlossaire } from "@/lib/data/pages";

export const metadata: Metadata = {
  title: "Glossaire",
  description: "Démocratie, environnement, agriculture, vie associative : des définitions simples pour suivre et participer au débat à Vaugines.",
  alternates: { canonical: "/glossaire" },
};

export default async function PageGlossaire() {
  const termes = await getGlossaire();
  const aValider = termes.some((t) => t.to_validate);
  return (
    <>
      <EnTetePage
        surtitre="Glossaire"
        titre="Les mots pour en parler"
        intro={
          <p>
            Démocratie, environnement, agriculture, vie de l&apos;association : des définitions simples pour que chacun
            puisse suivre et participer au débat.
          </p>
        }
      />
      <div className="conteneur pb-[100px]">
        <Glossaire termes={termes} />
        {aValider && (
          <p className="mt-5 text-sm text-encre-3">
            Définitions provisoires, en cours de relecture par le conseil collégial.
          </p>
        )}
      </div>
    </>
  );
}
