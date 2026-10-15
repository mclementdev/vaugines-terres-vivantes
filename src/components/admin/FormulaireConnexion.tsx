"use client";

import { useActionState } from "react";

import { demanderLien, type EtatConnexion } from "@/app/actions/auth";
import { Bouton } from "@/components/ui/Bouton";
import { Champ } from "@/components/ui/Champ";

export function FormulaireConnexion({ alerte }: { alerte?: string }) {
  const [etat, action, enCours] = useActionState<EtatConnexion, FormData>(demanderLien, { statut: "inactif" });

  if (etat.statut === "envoye") {
    return (
      <div role="status" className="rounded-[18px] bg-tag-olive p-5 text-tag-olive-fg">
        <p className="font-bold">Vérifiez votre boîte e-mail.</p>
        <p className="mt-1">
          Si l&apos;adresse <strong>{etat.email}</strong> a un accès à l&apos;administration, un lien de connexion vient de
          lui être envoyé. Il est valable une heure.
        </p>
      </div>
    );
  }

  return (
    <form action={action} noValidate className="flex flex-col gap-4">
      {alerte && (
        <p role="alert" className="rounded-[14px] bg-tag-ambre p-3.5 font-semibold text-tag-ambre-fg">
          {alerte}
        </p>
      )}
      <Champ
        id="connexion-email"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        libelle="Votre adresse e-mail"
        requis
        defaultValue={etat.email}
        erreur={etat.statut === "erreur" ? etat.message : undefined}
      />
      <Bouton type="submit" disabled={enCours} taille="lg">
        {enCours ? "Envoi…" : "Recevoir mon lien de connexion"}
      </Bouton>
      <p className="text-sm text-encre-3">Pas de mot de passe : un lien sécurisé vous est envoyé par e-mail à chaque connexion.</p>
    </form>
  );
}
