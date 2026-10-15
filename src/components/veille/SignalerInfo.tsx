"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useActionState, useState } from "react";

import { signalerInfo, type EtatSignalement } from "@/app/actions/veille";
import { Bouton } from "@/components/ui/Bouton";
import { Champ, ChampPiege, ZoneTexte } from "@/components/ui/Champ";

/** « Signaler une info » : fenêtre de dialogue avec formulaire modéré. */
export function SignalerInfo() {
  const [ouvert, setOuvert] = useState(false);
  const [cle, setCle] = useState(0);

  return (
    <Dialog.Root
      open={ouvert}
      onOpenChange={(o) => {
        setOuvert(o);
        if (o) setCle((c) => c + 1); // formulaire vierge à chaque ouverture
      }}
    >
      <Dialog.Trigger asChild>
        <Bouton variante="secondaire">Signaler une info</Bouton>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-nuit/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[92dvh] w-[calc(100%-32px)] max-w-[560px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[26px] bg-sable p-6 shadow-2xl md:p-8">
          <div className="mb-4 flex items-start justify-between gap-4">
            <Dialog.Title className="font-titre text-2xl font-semibold">Signaler une info</Dialog.Title>
            <Dialog.Close
              aria-label="Fermer"
              className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-bordure-douce bg-white"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M4 4l10 10M14 4L4 14" />
              </svg>
            </Dialog.Close>
          </div>
          <Dialog.Description className="mb-5 text-encre-2">
            Un arrêté, un projet, une enquête publique, un article… Partagez ce qui vous semble important pour Vaugines :
            l&apos;équipe de veille le vérifie avant d&apos;en faire une fiche.
          </Dialog.Description>
          <Formulaire key={cle} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Formulaire() {
  const [etat, action, enCours] = useActionState<EtatSignalement, FormData>(signalerInfo, { statut: "inactif" });

  if (etat.statut === "ok") {
    return (
      <div role="status" className="rounded-[18px] bg-tag-olive p-5 font-semibold text-tag-olive-fg">
        {etat.message ?? "Merci !"}
      </div>
    );
  }

  return (
    <form action={action} noValidate className="flex flex-col gap-4">
      <ChampPiege />
      <ZoneTexte id="sig-message" name="message" libelle="L'information" requis rows={5} maxLength={2000} defaultValue={etat.valeurs?.message} erreur={etat.erreurs?.message} />
      <Champ id="sig-url" name="url" type="url" inputMode="url" libelle="Lien vers la source" placeholder="https://" defaultValue={etat.valeurs?.url} aide="Facultatif." erreur={etat.erreurs?.url} />
      <Champ
        id="sig-email"
        name="email"
        type="email"
        autoComplete="email"
        libelle="Votre e-mail"
        defaultValue={etat.valeurs?.email}
        aide="Facultatif, jamais affiché : seulement si nous avons une question."
        erreur={etat.erreurs?.email}
      />
      {etat.statut === "erreur" && etat.message && (
        <p role="alert" className="font-semibold text-erreur">
          {etat.message}
        </p>
      )}
      <Bouton type="submit" disabled={enCours} className="self-start">
        {enCours ? "Envoi…" : "Envoyer"}
      </Bouton>
    </form>
  );
}
