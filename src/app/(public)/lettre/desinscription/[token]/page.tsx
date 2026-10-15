import type { Metadata } from "next";
import { Suspense } from "react";

import { desinscrireLettre, reinscrireLettre } from "@/app/actions/lettre";
import { CarteLettre, abonneParJeton, masquerEmail } from "@/components/site/CarteLettre";
import { Bouton, LienBouton } from "@/components/ui/Bouton";

export const metadata: Metadata = {
  title: "Se désinscrire de la lettre",
  robots: { index: false },
};

// Jeton inconnu à la construction : page rendue à chaque visite (en-tête compris).
export const instant = false;

export default function Page({ params }: PageProps<"/lettre/desinscription/[token]">) {
  return (
    <div className="conteneur max-w-[680px] py-14 md:py-20">
      <Suspense fallback={<CarteLettre titre="Un instant…">{null}</CarteLettre>}>
        <Contenu params={params} />
      </Suspense>
    </div>
  );
}

async function Contenu({ params }: { params: PageProps<"/lettre/desinscription/[token]">["params"] }) {
  const { token } = await params;
  const abonne = await abonneParJeton(token);

  if (!abonne) {
    return (
      <CarteLettre titre="Ce lien n'est plus valide">
        <p>
          Il est peut-être incomplet. Pour vous désinscrire, utilisez le lien d&apos;une lettre récente ou répondez simplement à l&apos;une d&apos;elles : nous
          nous en chargeons.
        </p>
      </CarteLettre>
    );
  }

  if (abonne.status === "unsubscribed") {
    return (
      <CarteLettre titre="Vous êtes désinscrit·e">
        <p>
          L&apos;adresse <strong>{masquerEmail(abonne.email)}</strong> ne recevra plus la lettre d&apos;information. Si vous êtes adhérente ou adhérent, vous
          recevrez toujours les messages liés à votre adhésion (convocation à l&apos;Assemblée Générale, par exemple).
        </p>
        <form action={reinscrireLettre.bind(null, token)}>
          <Bouton type="submit" variante="secondaire">
            Je me suis trompé·e : me réinscrire
          </Bouton>
        </form>
      </CarteLettre>
    );
  }

  return (
    <CarteLettre titre="Se désinscrire de la lettre">
      <p>
        Vous ne souhaitez plus recevoir la lettre d&apos;information à l&apos;adresse <strong>{masquerEmail(abonne.email)}</strong> ? Un clic suffit.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <form action={desinscrireLettre.bind(null, token)}>
          <Bouton type="submit" taille="lg">
            Me désinscrire
          </Bouton>
        </form>
        <LienBouton href="/" variante="lien">
          Rester inscrit·e
        </LienBouton>
      </div>
    </CarteLettre>
  );
}
