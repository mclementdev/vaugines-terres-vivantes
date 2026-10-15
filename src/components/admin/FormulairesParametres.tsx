"use client";

import { useActionState, useState, useTransition } from "react";

import { enregistrerReglages, inviterAdmin, purgerExemples, type DonneesReglages } from "@/app/admin/actions/parametres";
import { ETAT_INITIAL, type EtatForm } from "@/lib/admin/outils";

import { BoiteDialogue } from "./BoiteDialogue";
import { CaseAdmin, ChampAdmin, ChoixAdmin } from "./ChampsAdmin";
import { BoutonAdmin, RetourForm } from "./ui";

const LIBELLES_CHIFFRES = {
  adherents: "Adhérentes et adhérents",
  actions: "Actions lancées",
  rendez_vous: "Rendez-vous à venir",
  conseil: "Membres du conseil",
} as const;

export function FormulaireReglages({ initial }: { initial: DonneesReglages }) {
  const [d, setD] = useState(initial);
  const [etat, setEtat] = useState<EtatForm>(ETAT_INITIAL);
  const [enCours, demarrer] = useTransition();
  const e = etat.erreurs ?? {};
  const sous = <K extends keyof DonneesReglages>(k: K, champ: string, v: unknown) =>
    setD((x) => ({ ...x, [k]: { ...(x[k] as object), [champ]: v } }));

  return (
    <form
      method="post"
      noValidate
      onSubmit={(ev) => {
        ev.preventDefault();
        demarrer(async () => setEtat(await enregistrerReglages(d)));
      }}
      className="flex flex-col gap-5"
    >
      <fieldset className="grid gap-3 sm:grid-cols-2">
        <legend className="mb-2 font-titre text-lg font-semibold">Coordonnées</legend>
        <ChampAdmin id="r-lieu" libelle="Lieu" value={d.adresse.lieu} onChange={(x) => sous("adresse", "lieu", x.target.value)} />
        <ChampAdmin id="r-rue" libelle="Rue" value={d.adresse.rue} onChange={(x) => sous("adresse", "rue", x.target.value)} />
        <ChampAdmin id="r-cp" libelle="Code postal" value={d.adresse.code_postal} onChange={(x) => sous("adresse", "code_postal", x.target.value)} />
        <ChampAdmin id="r-commune" libelle="Commune" value={d.adresse.commune} onChange={(x) => sous("adresse", "commune", x.target.value)} />
        <ChampAdmin id="r-email" libelle="E-mail de contact (public)" type="email" value={d.email} onChange={(x) => setD({ ...d, email: x.target.value })} erreur={e.email} />
        <ChampAdmin
          id="r-alertes"
          libelle="E-mail d'alerte (adhésions, modération)"
          aide="Non affiché sur le site."
          type="email"
          value={d.email_alertes}
          onChange={(x) => setD({ ...d, email_alertes: x.target.value })}
          erreur={e.email_alertes}
        />
      </fieldset>

      <fieldset className="grid gap-3 sm:grid-cols-3">
        <legend className="mb-2 font-titre text-lg font-semibold">Virement des cotisations</legend>
        <ChampAdmin id="r-titulaire" libelle="Titulaire du compte" value={d.virement.titulaire} onChange={(x) => sous("virement", "titulaire", x.target.value)} />
        <ChampAdmin id="r-iban" libelle="IBAN" value={d.virement.iban} onChange={(x) => sous("virement", "iban", x.target.value)} erreur={e.virement} />
        <ChampAdmin id="r-bic" libelle="BIC" value={d.virement.bic} onChange={(x) => sous("virement", "bic", x.target.value)} />
        <p className="text-sm text-encre-3 sm:col-span-3">Le paiement en ligne par carte (HelloAsso) est prévu mais pas encore activé.</p>
      </fieldset>

      <fieldset className="grid gap-3 sm:grid-cols-2">
        <legend className="mb-2 font-titre text-lg font-semibold">Réseaux sociaux</legend>
        <ChampAdmin id="r-fb" libelle="Page Facebook" type="url" placeholder="https://www.facebook.com/…" value={d.reseaux.facebook} onChange={(x) => sous("reseaux", "facebook", x.target.value)} />
        <ChampAdmin id="r-ig" libelle="Compte Instagram" type="url" placeholder="https://www.instagram.com/…" value={d.reseaux.instagram} onChange={(x) => sous("reseaux", "instagram", x.target.value)} />
        <p className="text-sm text-encre-3 sm:col-span-2">Les icônes n&apos;apparaissent dans le pied de page que si l&apos;adresse est renseignée.</p>
      </fieldset>

      <fieldset>
        <legend className="mb-1 font-titre text-lg font-semibold">Chiffres clés de l&apos;accueil</legend>
        <p className="mb-3 text-sm text-encre-3">Laissez « valeur » vide pour le calcul automatique ; décochez pour masquer le chiffre.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {(Object.keys(LIBELLES_CHIFFRES) as (keyof typeof LIBELLES_CHIFFRES)[]).map((k) => (
            <div key={k} className="flex items-end gap-3 rounded-[14px] border-[1.5px] border-bordure-douce p-3">
              <ChampAdmin
                id={`r-c-${k}`}
                libelle={LIBELLES_CHIFFRES[k]}
                inputMode="numeric"
                placeholder="auto"
                className="w-36"
                value={String(d.chiffres[k].valeur ?? "")}
                onChange={(x) => sous("chiffres", k, { ...d.chiffres[k], valeur: x.target.value })}
              />
              <CaseAdmin libelle="Afficher" checked={d.chiffres[k].visible} onChange={(x) => sous("chiffres", k, { ...d.chiffres[k], visible: x.target.checked })} />
            </div>
          ))}
        </div>
      </fieldset>

      <ChampAdmin id="r-signature" libelle="Signature des e-mails" className="max-w-md" value={d.signature_email} onChange={(x) => setD({ ...d, signature_email: x.target.value })} />

      <RetourForm statut={etat.statut} message={etat.message} />
      <BoutonAdmin type="submit" className="self-start" disabled={enCours}>
        {enCours ? "Enregistrement…" : "Enregistrer les paramètres"}
      </BoutonAdmin>
    </form>
  );
}

export function FormulaireInvitation() {
  const [etat, action, enCours] = useActionState<EtatForm, FormData>(inviterAdmin, ETAT_INITIAL);
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
      <BoutonAdmin type="submit" className="self-start" disabled={enCours}>
        {enCours ? "Envoi…" : "Envoyer l'invitation"}
      </BoutonAdmin>
    </form>
  );
}

export function BoutonPurge({ nombre }: { nombre: number }) {
  const [ouvert, setOuvert] = useState(false);
  const [enCours, demarrer] = useTransition();
  if (nombre === 0) return <p className="text-olive">Aucun exemple fictif ne reste en base.</p>;
  return (
    <>
      <BoutonAdmin variante="danger" onClick={() => setOuvert(true)}>
        Supprimer les {nombre} exemples fictifs
      </BoutonAdmin>
      {ouvert && (
        <BoiteDialogue
          titre="Supprimer les exemples des maquettes ?"
          fermer={() => setOuvert(false)}
          onValider={() => demarrer(() => purgerExemples())}
          libelleValider={enCours ? "Suppression…" : "Tout supprimer"}
          enCours={enCours}
          danger
        >
          <p>
            Les événements, idées, fiches de veille et articles marqués « exemple fictif » seront supprimés définitivement. Les
            contenus réels (statuts, actions, conseil, FAQ, glossaire) sont conservés.
          </p>
        </BoiteDialogue>
      )}
    </>
  );
}
