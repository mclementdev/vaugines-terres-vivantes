import type { Metadata } from "next";
import { Suspense } from "react";

import { confirmerLettre } from "@/app/actions/lettre";
import { CarteLettre, abonneParJeton, masquerEmail } from "@/components/site/CarteLettre";
import { Bouton, LienBouton } from "@/components/ui/Bouton";

export const metadata: Metadata = {
  title: "Confirmer l'inscription à la lettre",
  robots: { index: false },
};

// Jeton inconnu à la construction : page rendue à chaque visite (en-tête compris).
export const instant = false;

export default function Page({ params }: PageProps<"/lettre/confirmer/[token]">) {
  return (
    <div className="conteneur max-w-[680px] py-14 md:py-20">
      <Suspense fallback={<CarteLettre titre="Un instant…">{null}</CarteLettre>}>
        <Contenu params={params} />
      </Suspense>
    </div>
  );
}

async function Contenu({ params }: { params: PageProps<"/lettre/confirmer/[token]">["params"] }) {
  const { token } = await params;
  const abonne = await abonneParJeton(token);

  if (!abonne) {
    return (
      <CarteLettre titre="Ce lien n'est plus valide">
        <p>Il a peut-être déjà servi, ou il est incomplet. Vous pouvez vous inscrire à nouveau depuis la page d&apos;accueil.</p>
        <LienBouton href="/#rejoindre" className="self-start">
          Retour à l&apos;accueil
        </LienBouton>
      </CarteLettre>
    );
  }

  if (abonne.status === "active") {
    return (
      <CarteLettre titre="C'est confirmé, merci !">
        <p>
          L&apos;adresse <strong>{masquerEmail(abonne.email)}</strong> recevra la lettre d&apos;information : les rendez-vous, l&apos;avancée des actions et les
          nouvelles du village. Chaque lettre contient un lien de désinscription en un clic.
        </p>
        <LienBouton href="/evenements" className="self-start">
          Voir les prochains rendez-vous
        </LienBouton>
      </CarteLettre>
    );
  }

  if (abonne.status === "unsubscribed") {
    return (
      <CarteLettre titre="Cette adresse est désinscrite">
        <p>Pour recevoir à nouveau la lettre, inscrivez-vous depuis la page d&apos;accueil : un nouvel e-mail de confirmation vous sera envoyé.</p>
        <LienBouton href="/#rejoindre" className="self-start">
          Retour à l&apos;accueil
        </LienBouton>
      </CarteLettre>
    );
  }

  return (
    <CarteLettre titre="Encore un clic !">
      <p>
        Confirmez l&apos;inscription de <strong>{masquerEmail(abonne.email)}</strong> à la lettre d&apos;information de l&apos;association.
      </p>
      <form action={confirmerLettre.bind(null, token)}>
        <Bouton type="submit" taille="lg">
          Confirmer mon inscription
        </Bouton>
      </form>
    </CarteLettre>
  );
}
