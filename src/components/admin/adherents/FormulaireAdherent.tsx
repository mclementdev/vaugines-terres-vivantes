"use client";

import { useActionState, useState, useTransition } from "react";

import { enregistrerAdherent } from "@/app/admin/actions/adherents";
import { ETAT_INITIAL, type EtatForm } from "@/lib/admin/outils";

import { CaseAdmin, ChampAdmin, ChoixAdmin, ZoneAdmin } from "../ChampsAdmin";
import { BoutonAdmin, LienAdmin, RetourForm } from "../ui";

export type ValeursAdherent = {
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  naissance: string;
  adresse: string;
  code_postal: string;
  commune: string;
  notes: string;
  joined_on: string;
  mode: "avec" | "sans";
  montant: string;
  statut: "attendue" | "payee";
  paid_on: string;
  moyen: "virement" | "especes" | "cheque" | "carte";
  lettre: boolean;
};

/** Ajout d'un bulletin papier (id null) ou modification d'une fiche. */
export function FormulaireAdherent({ id, valeurs, periode }: { id: string | null; valeurs: ValeursAdherent; periode: string | null }) {
  const [etat, action, enCours] = useActionState<EtatForm, FormData>(enregistrerAdherent.bind(null, id), ETAT_INITIAL);
  const [, demarrer] = useTransition();
  const [mode, setMode] = useState(valeurs.mode);
  const [statut, setStatut] = useState(valeurs.statut);
  const [email, setEmail] = useState(valeurs.email);
  const [lettre, setLettre] = useState(valeurs.lettre);
  const [bienvenue, setBienvenue] = useState(true);
  const aEmail = email.trim() !== "";
  const e = etat.erreurs ?? {};

  return (
    <form
      // POST : sans JavaScript, la saisie ne doit jamais finir dans l'URL.
      method="post"
      noValidate
      onSubmit={(ev) => {
        // Envoi manuel : le formulaire n'est pas vidé en cas d'erreur.
        ev.preventDefault();
        const fd = new FormData(ev.currentTarget);
        demarrer(() => action(fd));
      }}
      className="flex flex-col gap-5"
    >
      <section className="rounded-[20px] bg-white px-6 py-[22px]">
        <h2 className="mb-4 font-titre text-xl font-semibold">Coordonnées</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <ChampAdmin id="f-prenom" name="prenom" libelle="Prénom *" defaultValue={valeurs.prenom} erreur={e.prenom} autoComplete="off" />
          <ChampAdmin id="f-nom" name="nom" libelle="Nom *" defaultValue={valeurs.nom} erreur={e.nom} autoComplete="off" />
          <ChampAdmin
            id="f-email"
            name="email"
            type="email"
            libelle="E-mail"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            erreur={e.email}
            aide="Facultatif pour un bulletin papier."
            autoComplete="off"
          />
          <ChampAdmin id="f-telephone" name="telephone" type="tel" libelle="Téléphone" defaultValue={valeurs.telephone} erreur={e.telephone} autoComplete="off" />
          <ChampAdmin id="f-naissance" name="naissance" libelle="Date de naissance" placeholder="JJ/MM/AAAA" defaultValue={valeurs.naissance} erreur={e.naissance} autoComplete="off" />
          <ChampAdmin id="f-adresse" name="adresse" libelle="Adresse" defaultValue={valeurs.adresse} erreur={e.adresse} autoComplete="off" />
          <ChampAdmin id="f-cp" name="code_postal" libelle="Code postal" defaultValue={valeurs.code_postal} erreur={e.code_postal} autoComplete="off" />
          <ChampAdmin id="f-commune" name="commune" libelle="Commune" defaultValue={valeurs.commune} erreur={e.commune} autoComplete="off" />
        </div>
        <p className="mt-3 text-[13px] text-encre-3">Le téléphone et la date de naissance ne sont visibles qu&apos;à la demande, et chaque consultation est notée dans l&apos;historique.</p>
      </section>

      <section className="rounded-[20px] bg-white px-6 py-[22px]">
        <h2 className="mb-1 font-titre text-xl font-semibold">Adhésion et cotisation</h2>
        <p className="mb-4 text-sm text-encre-3">{periode ? `Année d'AG ${periode}.` : "Aucune année d'AG en cours : la cotisation ne sera pas enregistrée."}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {!id && <ChampAdmin id="f-joined" name="joined_on" type="date" libelle="Date du bulletin *" defaultValue={valeurs.joined_on} erreur={e.joined_on} />}
          {id && <input type="hidden" name="joined_on" value={valeurs.joined_on} />}
          <ChoixAdmin id="f-mode" name="mode" libelle="Adhésion" value={mode} onChange={(ev) => setMode(ev.target.value as "avec" | "sans")}>
            <option value="avec">Avec cotisation</option>
            <option value="sans">Sans cotisation</option>
          </ChoixAdmin>
          {mode === "avec" && (
            <>
              <ChampAdmin id="f-montant" name="montant" inputMode="decimal" libelle="Montant (€) *" defaultValue={valeurs.montant} erreur={e.montant} />
              <ChoixAdmin id="f-statut" name="statut" libelle="Cotisation" value={statut} onChange={(ev) => setStatut(ev.target.value as "attendue" | "payee")}>
                <option value="attendue">À recevoir</option>
                <option value="payee">Reçue</option>
              </ChoixAdmin>
              <ChoixAdmin id="f-moyen" name="moyen" libelle="Moyen de paiement" defaultValue={valeurs.moyen}>
                <option value="virement">Virement</option>
                <option value="cheque">Chèque</option>
                <option value="especes">Espèces</option>
                <option value="carte">Carte</option>
              </ChoixAdmin>
              {statut === "payee" && <ChampAdmin id="f-paid" name="paid_on" type="date" libelle="Reçue le *" defaultValue={valeurs.paid_on} erreur={e.paid_on} />}
            </>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-[20px] bg-white px-6 py-[22px]">
        <h2 className="font-titre text-xl font-semibold">Communication</h2>
        <CaseAdmin
          name="lettre"
          checked={aEmail && lettre}
          onChange={(ev) => setLettre(ev.target.checked)}
          disabled={!aEmail}
          libelle={id ? "Abonné·e à la lettre d'information" : "A coché « lettre d'information » sur le bulletin (abonnement actif)"}
        />
        {!id && (
          <CaseAdmin
            name="bienvenue"
            checked={aEmail && bienvenue}
            onChange={(ev) => setBienvenue(ev.target.checked)}
            disabled={!aEmail}
            libelle="Envoyer l'e-mail de bienvenue avec les statuts"
          />
        )}
        {!aEmail && <p className="text-[13px] text-encre-3">Sans adresse e-mail, ni lettre ni e-mail de bienvenue.</p>}
        <ZoneAdmin id="f-notes" name="notes" rows={3} libelle="Notes internes" defaultValue={valeurs.notes} erreur={e.notes} aide="Visibles des seuls admins. Pas d'information sensible (santé, opinions…)." />
      </section>

      <RetourForm statut={etat.statut} message={etat.message} />
      <div className="flex flex-wrap justify-end gap-2.5">
        <LienAdmin href={id ? `/admin/adherents?id=${id}` : "/admin/adherents"} variante="secondaire">
          Annuler
        </LienAdmin>
        <BoutonAdmin type="submit" disabled={enCours}>
          {enCours ? "Enregistrement…" : id ? "Enregistrer la fiche" : "Ajouter l'adhérent·e"}
        </BoutonAdmin>
      </div>
    </form>
  );
}
