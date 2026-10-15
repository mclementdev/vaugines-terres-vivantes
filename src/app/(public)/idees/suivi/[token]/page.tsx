import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { z } from "zod";

import { arreterSuivi } from "@/app/actions/idees";
import { CarteLettre } from "@/components/site/CarteLettre";
import { Bouton, LienBouton } from "@/components/ui/Bouton";
import { serviceClient } from "@/lib/supabase/service";

export const metadata: Metadata = { title: "Suivi d'une idée", robots: { index: false } };

// Jeton inconnu à la construction : page rendue à chaque visite.
export const instant = false;

export default function Page(props: PageProps<"/idees/suivi/[token]">) {
  return (
    <div className="conteneur max-w-[680px] py-14 md:py-20">
      <Suspense fallback={<CarteLettre titre="Un instant…" surtitre="Boîte à idées">{null}</CarteLettre>}>
        <Contenu {...props} />
      </Suspense>
    </div>
  );
}

async function Contenu({ params, searchParams }: PageProps<"/idees/suivi/[token]">) {
  await connection();
  const [{ token }, sp] = await Promise.all([params, searchParams]);
  if (sp.arret) {
    return (
      <CarteLettre titre="C'est noté" surtitre="Boîte à idées">
        <p>Vous ne recevrez plus de nouvelles de cette idée.</p>
        <LienBouton href="/idees" className="self-start">
          Voir les idées
        </LienBouton>
      </CarteLettre>
    );
  }
  const { data: s } = z.uuid().safeParse(token).success
    ? await serviceClient().from("idea_followers").select("ideas!inner(titre, slug)").eq("token", token).maybeSingle()
    : { data: null };
  if (!s) {
    return (
      <CarteLettre titre="Ce lien n'est plus valide" surtitre="Boîte à idées">
        <p>Vous ne suivez peut-être déjà plus cette idée.</p>
      </CarteLettre>
    );
  }
  return (
    <CarteLettre titre="Ne plus suivre cette idée ?" surtitre="Boîte à idées">
      <p>
        Vous recevez un e-mail à chaque étape de « <strong>{s.ideas.titre}</strong> ». Un clic suffit pour arrêter.
      </p>
      <form action={arreterSuivi.bind(null, token)}>
        <Bouton type="submit" taille="lg">
          Ne plus suivre
        </Bouton>
      </form>
    </CarteLettre>
  );
}
