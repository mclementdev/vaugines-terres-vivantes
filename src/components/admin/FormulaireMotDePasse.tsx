"use client";

import Link from "next/link";
import { useActionState } from "react";

import { changerMotDePasse, type EtatMotDePasse } from "@/app/actions/auth";

import { ChampAdmin } from "./ChampsAdmin";
import { BoutonAdmin, RetourForm } from "./ui";

export function FormulaireMotDePasse({ email }: { email: string }) {
  const [etat, action, enCours] = useActionState<EtatMotDePasse, FormData>(changerMotDePasse, { statut: "inactif" });
  if (etat.statut === "ok") {
    return (
      <div className="flex flex-col gap-3">
        <RetourForm statut="ok" message={etat.message} />
        <Link href="/admin" className="font-bold">
          Aller au tableau de bord
        </Link>
      </div>
    );
  }
  return (
    <form action={action} className="flex flex-col gap-3">
      {/* Identifiant caché : permet au gestionnaire de mots de passe d'enregistrer le bon compte. */}
      <input type="email" name="email" autoComplete="username" value={email} readOnly hidden />
      <ChampAdmin id="mdp-nouveau" name="mot_de_passe" type="password" autoComplete="new-password" libelle="Nouveau mot de passe" required minLength={12} erreur={etat.erreurs?.mot_de_passe} />
      <ChampAdmin id="mdp-confirmation" name="confirmation" type="password" autoComplete="new-password" libelle="Confirmation" required erreur={etat.erreurs?.confirmation} />
      <RetourForm statut={etat.statut} message={etat.message} />
      <BoutonAdmin type="submit" className="self-start" disabled={enCours}>
        {enCours ? "Enregistrement…" : "Enregistrer le mot de passe"}
      </BoutonAdmin>
    </form>
  );
}
