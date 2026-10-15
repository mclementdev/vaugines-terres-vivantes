import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { z } from "zod";

import { modifierIdee } from "@/app/actions/idees";
import { FormulaireIdee } from "@/components/idees/FormulaireIdee";
import { CarteLettre } from "@/components/site/CarteLettre";
import { LienBouton } from "@/components/ui/Bouton";
import { serviceClient } from "@/lib/supabase/service";

export const metadata: Metadata = { title: "Modifier mon idée", robots: { index: false } };

// Jeton inconnu à la construction : page rendue à chaque visite.
export const instant = false;

export default function Page({ params }: PageProps<"/idees/modifier/[token]">) {
  return (
    <div className="conteneur pb-16 pt-8 md:pb-[100px] md:pt-12">
      <Suspense fallback={<p>Un instant…</p>}>
        <Contenu params={params} />
      </Suspense>
    </div>
  );
}

async function Contenu({ params }: Pick<PageProps<"/idees/modifier/[token]">, "params">) {
  await connection();
  const { token } = await params;
  const { data: i } = z.uuid().safeParse(token).success
    ? await serviceClient().from("ideas").select("titre, description, theme, display_name, moderation, moderation_note").eq("edit_token", token).maybeSingle()
    : { data: null };

  if (!i || i.moderation !== "changes_requested") {
    return (
      <div className="mx-auto max-w-[680px]">
        <CarteLettre titre="Ce lien n'est plus valide" surtitre="Boîte à idées">
          <p>{i ? "Cette idée n'attend plus de modification : elle a déjà été renvoyée en relecture ou traitée." : "Le lien est incomplet."}</p>
          <LienBouton href="/idees" className="self-start">
            Voir les idées
          </LienBouton>
        </CarteLettre>
      </div>
    );
  }

  return (
    <>
      <h1 className="mb-2.5 font-titre text-[32px] font-semibold leading-[1.05] tracking-[-0.02em] md:text-[clamp(34px,4.2vw,50px)]">Modifier mon idée</h1>
      <div className="mb-8 max-w-[720px] rounded-[18px] bg-tag-ambre px-5 py-4 text-tag-ambre-fg">
        <p className="mb-1 font-bold">La demande de l&apos;équipe</p>
        <p className="whitespace-pre-line">{i.moderation_note}</p>
      </div>
      <div className="flex flex-wrap items-start gap-8">
        <FormulaireIdee
          action={modifierIdee.bind(null, token)}
          modification
          valeurs={{ titre: i.titre, description: i.description, theme: i.theme, signer: Boolean(i.display_name), prenom: i.display_name ?? "" }}
        />
      </div>
    </>
  );
}
