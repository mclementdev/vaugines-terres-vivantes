"use client";

import { useActionState } from "react";

import { connecter, type EtatConnexion } from "@/app/actions/auth";
import { Bouton } from "@/components/ui/Bouton";
import { Champ } from "@/components/ui/Champ";

export function FormulaireConnexion({ alerte }: { alerte?: string }) {
  const [etat, action, enCours] = useActionState<EtatConnexion, FormData>(connecter, { statut: "inactif" });

  return (
    <form action={action} noValidate className="flex flex-col gap-4">
      {alerte && (
        <p role="alert" className="rounded-[14px] bg-tag-ambre p-3.5 font-semibold text-tag-ambre-fg">
          {alerte}
        </p>
      )}
      {etat.statut === "erreur" && (
        <p role="alert" className="rounded-[14px] bg-tag-terre p-3.5 font-semibold text-erreur">
          {etat.message}
        </p>
      )}
      <Champ id="connexion-email" name="email" type="email" autoComplete="username" inputMode="email" libelle="Adresse e-mail" requis defaultValue={etat.email} />
      <Champ id="connexion-mdp" name="mot_de_passe" type="password" autoComplete="current-password" libelle="Mot de passe" requis />
      <Bouton type="submit" disabled={enCours} taille="lg">
        {enCours ? "Connexion…" : "Se connecter"}
      </Bouton>
      <p className="text-sm text-encre-3">Mot de passe oublié ou premier accès ? Demandez un lien de connexion à un superadmin de l&apos;association.</p>
    </form>
  );
}
