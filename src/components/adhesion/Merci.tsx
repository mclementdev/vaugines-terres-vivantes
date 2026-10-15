"use client";

import { useSyncExternalStore } from "react";

import type { Merci } from "@/app/actions/adhesion";
import { VillageTrait } from "@/components/site/VillageTrait";
import { CLE_MERCI } from "@/lib/adhesion/commun";

import { CoordonneesBancaires, type Virement } from "./CoordonneesBancaires";

const abonnement = () => () => {};

function lire(): Merci | null {
  try {
    const brut = sessionStorage.getItem(CLE_MERCI);
    return brut ? (JSON.parse(brut) as Merci) : null;
  } catch {
    return null;
  }
}

/** Message de bienvenue personnalisé (rendu générique côté serveur). */
export function MessageMerci({ virement }: { virement: Virement }) {
  const client = useSyncExternalStore(abonnement, () => true, () => false);
  return <Contenu key={client ? "client" : "serveur"} merci={client ? lire() : null} virement={virement} />;
}

function Contenu({ merci, virement }: { merci: Merci | null; virement: Virement }) {
  return (
    <>
      <div className="overflow-hidden rounded-[30px] bg-terre px-6 pt-9 text-white md:px-10 md:pt-11">
        <span className="mb-5 flex size-16 items-center justify-center rounded-full bg-white text-terre">
          <svg width="30" height="30" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M2 7.5l3 3 7-7" />
          </svg>
        </span>
        <h1 className="mb-3 font-titre text-[clamp(34px,4.6vw,56px)] font-semibold leading-[1.04] tracking-[-0.02em] [text-wrap:balance]">
          Bienvenue dans l&apos;association{merci?.prenom ? `, ${merci.prenom}` : ""} !
        </h1>
        <p className="max-w-[560px] text-[19px] text-[#FBE6D6]">
          Votre adhésion est enregistrée.{" "}
          {merci?.emailEnvoye === false ? (
            <>L&apos;e-mail de bienvenue n&apos;a pas pu partir tout de suite : nous vous l&apos;enverrons très vite, avec les statuts.</>
          ) : merci?.email ? (
            <>
              Un e-mail de bienvenue vient de partir vers <strong className="[overflow-wrap:anywhere]">{merci.email}</strong>, avec les statuts en pièce jointe.
            </>
          ) : (
            <>Un e-mail de bienvenue vient de partir, avec les statuts en pièce jointe.</>
          )}
        </p>
        <VillageTrait decoratif sizes="800px" className="mt-7 block h-auto w-full opacity-35 invert" />
      </div>

      {merci?.avecCotisation && (
        <section aria-labelledby="titre-cotisation" className="mt-6 rounded-3xl bg-white px-5 py-6 md:px-[30px] md:py-7">
          <h2 id="titre-cotisation" className="mb-1.5 font-titre text-[22px] font-semibold">
            Pour finaliser votre cotisation de {merci.montant}
          </h2>
          <p className="text-base text-encre-2">Effectuez le virement quand vous le souhaitez. Ces informations sont aussi dans l&apos;e-mail.</p>
          <CoordonneesBancaires virement={virement} libelle={merci.libelle} />
        </section>
      )}
    </>
  );
}
