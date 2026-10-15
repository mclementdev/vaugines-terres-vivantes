import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { z } from "zod";

import { annulerInscription, changerPlaces } from "@/app/actions/inscriptions";
import { CarteLettre } from "@/components/site/CarteLettre";
import { Bouton, LienBouton } from "@/components/ui/Bouton";
import { quandEvenement } from "@/lib/email/inscriptions";
import { MAX_PLACES } from "@/lib/evenements";
import { serviceClient } from "@/lib/supabase/service";

export const metadata: Metadata = {
  title: "Mon inscription",
  robots: { index: false },
};

// Jeton inconnu à la construction : page rendue à chaque visite.
export const instant = false;

const MESSAGES: Record<string, { texte: string; erreur?: boolean }> = {
  ok: { texte: "C'est enregistré, merci !" },
  complet: { texte: "Il n'y a pas assez de places restantes pour ce nombre de personnes.", erreur: true },
  ferme: { texte: "L'événement est passé : l'inscription ne peut plus être modifiée.", erreur: true },
  annulee: { texte: "Votre inscription est annulée. Un e-mail de confirmation vient de partir." },
  invalide: { texte: "Choisissez un nombre de personnes valide.", erreur: true },
};

export default function Page(props: PageProps<"/evenements/inscription/[token]">) {
  return (
    <div className="conteneur max-w-[680px] py-14 md:py-20">
      <Suspense fallback={<CarteLettre titre="Un instant…" surtitre="Mon inscription">{null}</CarteLettre>}>
        <Contenu {...props} />
      </Suspense>
    </div>
  );
}

async function Contenu({ params, searchParams }: PageProps<"/evenements/inscription/[token]">) {
  await connection();
  const [{ token }, sp] = await Promise.all([params, searchParams]);
  const message = typeof sp.r === "string" ? MESSAGES[sp.r] : undefined;

  const valide = z.uuid().safeParse(token).success;
  const { data: i } = valide
    ? await serviceClient()
        .from("event_registrations")
        .select("nom, places, status, events!inner(slug, titre, starts_at, ends_at, all_day, date_label, lieu, adresse)")
        .eq("token", token)
        .maybeSingle()
    : { data: null };

  if (!i) {
    return (
      <CarteLettre titre="Ce lien n'est plus valide" surtitre="Mon inscription">
        <p>Il est incomplet, ou l&apos;inscription a été effacée (nous les supprimons un mois après l&apos;événement).</p>
        <LienBouton href="/evenements" className="self-start">
          Voir l&apos;agenda
        </LienBouton>
      </CarteLettre>
    );
  }

  const e = i.events;
  const passe = e.starts_at ? new Date(e.ends_at ?? e.starts_at) < new Date() : false;
  const confirmee = i.status === "confirmee";

  return (
    <CarteLettre titre={e.titre} surtitre="Mon inscription">
      {message && (
        <p role={message.erreur ? "alert" : "status"} className={message.erreur ? "rounded-[14px] bg-tag-terre px-4 py-3 font-semibold text-erreur" : "rounded-[14px] bg-tag-olive px-4 py-3 font-semibold text-tag-olive-fg"}>
          {message.texte}
        </p>
      )}
      <dl className="grid gap-3 rounded-2xl bg-sable p-4 text-[15px] sm:grid-cols-2">
        <div>
          <dt className="text-encre-3">Quand</dt>
          <dd className="font-bold">{quandEvenement(e)}</dd>
        </div>
        <div>
          <dt className="text-encre-3">Où</dt>
          <dd className="font-bold">{e.lieu}</dd>
        </div>
        <div>
          <dt className="text-encre-3">Au nom de</dt>
          <dd className="font-bold">{i.nom}</dd>
        </div>
        <div>
          <dt className="text-encre-3">Statut</dt>
          <dd className="font-bold">{confirmee ? `Inscrit·e · ${i.places} personne${i.places > 1 ? "s" : ""}` : "Inscription annulée"}</dd>
        </div>
      </dl>

      {confirmee && !passe && (
        <>
          <form action={changerPlaces.bind(null, token)} className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1.5 text-[15px] font-bold">
              Nombre de personnes
              <select name="places" defaultValue={i.places} className="h-[52px] min-w-24 cursor-pointer rounded-[14px] border-[1.5px] border-bordure-champ bg-white px-4 text-[17px] font-normal">
                {Array.from({ length: MAX_PLACES }, (_, n) => n + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <Bouton type="submit" variante="secondaire">
              Enregistrer
            </Bouton>
          </form>
          <form action={annulerInscription.bind(null, token)} className="border-t border-[#EFE3D2] pt-4">
            <p className="mb-3 text-[15px]">Un empêchement ? Annulez en un clic : la place pourra servir à quelqu&apos;un d&apos;autre.</p>
            <Bouton type="submit">Annuler mon inscription</Bouton>
          </form>
        </>
      )}

      <LienBouton href={`/evenements/${e.slug}`} variante="lien" className="self-start px-0">
        {confirmee ? "Voir l'événement" : "Me réinscrire depuis la page de l'événement"}
      </LienBouton>
    </CarteLettre>
  );
}
