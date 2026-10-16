"use client";

import { useActionState, useState, useTransition } from "react";

import { creerCompte, nouveauLien, type EtatLien } from "@/app/admin/actions/comptes";

import { ChampAdmin, ChoixAdmin } from "./ChampsAdmin";
import { BoutonAdmin, RetourForm } from "./ui";

/** Lien à transmettre, avec un bouton pour le copier. */
function LienACopier({ lien }: { lien: string }) {
  const [copie, setCopie] = useState(false);
  return (
    <div className="flex flex-col gap-2 rounded-[14px] bg-sable p-3">
      <input readOnly value={lien} aria-label="Lien de connexion" onFocus={(e) => e.target.select()} className="h-10 w-full rounded-[10px] border border-bordure-champ bg-white px-3 font-mono text-[13px]" />
      <div className="flex flex-wrap items-center gap-3">
        <BoutonAdmin
          variante="secondaire"
          onClick={() =>
            navigator.clipboard.writeText(lien).then(
              () => setCopie(true),
              () => setCopie(false),
            )
          }
        >
          {copie ? "Copié ✓" : "Copier le lien"}
        </BoutonAdmin>
        <span className="text-sm text-encre-3">Personnel, valable une heure et une seule fois.</span>
      </div>
    </div>
  );
}

export function FormulaireCompte() {
  const [etat, action, enCours] = useActionState<EtatLien, FormData>(creerCompte, { statut: "inactif" });
  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <ChampAdmin id="inv-email" name="email" type="email" libelle="E-mail *" required erreur={etat.erreurs?.email} />
        <ChoixAdmin id="inv-role" name="role" libelle="Rôle" defaultValue="admin">
          <option value="admin">Admin (contenus, adhérents, newsletter, modération)</option>
          <option value="superadmin">Superadmin (tout, y compris comptes et paramètres)</option>
        </ChoixAdmin>
        <ChampAdmin id="inv-prenom" name="prenom" libelle="Prénom *" required erreur={etat.erreurs?.prenom} />
        <ChampAdmin id="inv-nom" name="nom" libelle="Nom" />
      </div>
      <RetourForm statut={etat.statut} message={etat.message} />
      {etat.lien && <LienACopier lien={etat.lien} />}
      <BoutonAdmin type="submit" className="self-start" disabled={enCours}>
        {enCours ? "Création…" : "Créer le compte"}
      </BoutonAdmin>
    </form>
  );
}

/** Nouveau lien de connexion pour un compte existant (mot de passe oublié). */
export function BoutonLienConnexion({ id }: { id: string }) {
  const [etat, setEtat] = useState<EtatLien>();
  const [enCours, demarrer] = useTransition();
  return (
    <span className="flex w-full flex-col gap-2">
      <BoutonAdmin variante="secondaire" className="self-start" disabled={enCours} onClick={() => demarrer(async () => setEtat(await nouveauLien(id)))}>
        {enCours ? "Création…" : "Envoyer un lien de connexion"}
      </BoutonAdmin>
      {etat && <RetourForm statut={etat.statut} message={etat.message} />}
      {etat?.lien && <LienACopier lien={etat.lien} />}
    </span>
  );
}
