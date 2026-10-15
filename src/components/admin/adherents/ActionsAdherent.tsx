"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";

import {
  marquerCotisationRecue,
  ouvrirAnneeAg,
  relancer,
  relancerVirementsAttendus,
  renvoyerBienvenue,
  revelerCoordonnees,
  validerEnAg,
  type Retour,
} from "@/app/admin/actions/adherents";
import { ETAT_INITIAL, type EtatForm } from "@/lib/admin/outils";
import { cn } from "@/lib/cn";

import { BoiteDialogue } from "../BoiteDialogue";
import { ChampAdmin, ChoixAdmin } from "../ChampsAdmin";
import { BoutonAdmin, RetourForm } from "../ui";

const aujourdhui = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" });

function Message({ retour }: { retour?: Retour }) {
  if (!retour) return null;
  return (
    <p role="status" className={cn("rounded-xl px-3 py-2 text-sm font-semibold", retour.ok ? "bg-tag-olive text-tag-olive-fg" : "bg-tag-terre text-erreur")}>
      {retour.message}
    </p>
  );
}

/** Téléphone et date de naissance masqués ; leur affichage est noté dans l'historique. */
export function CoordonneesMasquees({ memberId, aTelephone, aNaissance }: { memberId: string; aTelephone: boolean; aNaissance: boolean }) {
  const [valeurs, setValeurs] = useState<{ telephone: string; naissance: string } | null>(null);
  const [enCours, demarrer] = useTransition();
  const router = useRouter();
  const afficher = () =>
    demarrer(async () => {
      setValeurs(await revelerCoordonnees(memberId));
      router.refresh();
    });

  const valeur = (present: boolean, v: string | undefined, masque: string) => {
    if (!present) return <span className="font-normal text-encre-3">non renseigné</span>;
    return valeurs ? v || "—" : <span aria-label="masqué">{masque}</span>;
  };

  return (
    <>
      <div>
        <dt className="text-encre-3">Téléphone</dt>
        <dd className="font-bold">{valeur(aTelephone, valeurs?.telephone, "•• •• •• •• ••")}</dd>
      </div>
      <div>
        <dt className="text-encre-3">Date de naissance</dt>
        <dd className="font-bold">{valeur(aNaissance, valeurs?.naissance, "••/••/••••")}</dd>
      </div>
      {(aTelephone || aNaissance) && !valeurs && (
        <div className="col-span-2">
          <BoutonAdmin variante="discret" onClick={afficher} disabled={enCours} className="min-h-0 px-0 text-sm">
            {enCours ? "Affichage…" : "Afficher le téléphone et la date de naissance"}
          </BoutonAdmin>
          <p className="text-[13px] text-encre-3">Chaque consultation est notée dans l&apos;historique.</p>
        </div>
      )}
    </>
  );
}

type PropsActions = {
  memberId: string;
  email: string | null;
  cotisation: { id: string; status: string; montant: string; derniereRelance: string | null } | null;
  valideEnAg: boolean;
};

/** Boutons d'action de la fiche. */
export function ActionsAdherent({ memberId, email, cotisation, valideEnAg }: PropsActions) {
  const [retour, setRetour] = useState<Retour>();
  const [dialogue, setDialogue] = useState<null | "recue" | "ag">(null);
  const [date, setDate] = useState("");
  const [enCours, demarrer] = useTransition();
  const router = useRouter();

  const lancer = (f: () => Promise<Retour>, fermer = false) =>
    demarrer(async () => {
      const r = await f();
      setRetour(r);
      if (r.ok) {
        if (fermer) setDialogue(null);
        router.refresh();
      }
    });
  const ouvrir = (d: "recue" | "ag") => {
    setDate(aujourdhui());
    setDialogue(d);
  };

  return (
    <div className="flex flex-col gap-2">
      {cotisation?.status === "attendue" && (
        <BoutonAdmin onClick={() => ouvrir("recue")} className="bg-olive hover:bg-[#46511d]">
          Marquer la cotisation comme reçue
        </BoutonAdmin>
      )}
      {cotisation?.status === "attendue" && email && (
        <BoutonAdmin variante="secondaire" disabled={enCours} onClick={() => lancer(() => relancer(memberId))}>
          Envoyer une relance
        </BoutonAdmin>
      )}
      {cotisation?.derniereRelance && <p className="text-[13px] text-encre-3">Dernière relance : {cotisation.derniereRelance}</p>}
      {email && (
        <BoutonAdmin variante="secondaire" disabled={enCours} onClick={() => lancer(() => renvoyerBienvenue(memberId))}>
          Renvoyer l&apos;e-mail de bienvenue
        </BoutonAdmin>
      )}
      {!valideEnAg && (
        <BoutonAdmin variante="secondaire" onClick={() => ouvrir("ag")}>
          Valider en AG
        </BoutonAdmin>
      )}
      <Message retour={retour} />

      {dialogue === "recue" && cotisation && (
        <BoiteDialogue
          titre={`Cotisation de ${cotisation.montant} reçue`}
          fermer={() => setDialogue(null)}
          enCours={enCours}
          libelleValider={enCours ? "Enregistrement…" : "Enregistrer"}
          onValider={() => {
            const moyen = (document.getElementById("recue-moyen") as HTMLSelectElement).value;
            lancer(() => marquerCotisationRecue(cotisation.id, { le: date, moyen }), true);
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <ChampAdmin id="recue-date" type="date" libelle="Reçue le" required value={date} onChange={(e) => setDate(e.target.value)} />
            <ChoixAdmin id="recue-moyen" libelle="Moyen" defaultValue="virement">
              <option value="virement">Virement</option>
              <option value="cheque">Chèque</option>
              <option value="especes">Espèces</option>
              <option value="carte">Carte</option>
            </ChoixAdmin>
          </div>
        </BoiteDialogue>
      )}
      {dialogue === "ag" && (
        <BoiteDialogue
          titre="Valider l'adhésion en AG"
          fermer={() => setDialogue(null)}
          enCours={enCours}
          libelleValider={enCours ? "Validation…" : "Valider"}
          onValider={() => lancer(() => validerEnAg([memberId], date), true)}
        >
          <p className="mb-3">L&apos;Assemblée Générale vote l&apos;adhésion des nouveaux membres (article 9 des statuts).</p>
          <ChampAdmin id="ag-date-fiche" type="date" libelle="Date de l'Assemblée Générale" required value={date} onChange={(e) => setDate(e.target.value)} />
        </BoiteDialogue>
      )}
    </div>
  );
}

/** Relance groupée des virements attendus de l'année en cours. */
export function RelanceGroupee({ nombre }: { nombre: number }) {
  const [ouvert, setOuvert] = useState(false);
  const [retour, setRetour] = useState<Retour>();
  const [enCours, demarrer] = useTransition();
  const router = useRouter();
  return (
    <>
      <BoutonAdmin variante="secondaire" disabled={nombre === 0} onClick={() => setOuvert(true)}>
        Relancer les virements attendus ({nombre})
      </BoutonAdmin>
      {retour && !ouvert && (
        <p role="status" className={cn("w-full rounded-xl px-3 py-2 text-sm font-semibold", retour.ok ? "bg-tag-olive text-tag-olive-fg" : "bg-tag-terre text-erreur")}>
          {retour.message}
        </p>
      )}
      {ouvert && (
        <BoiteDialogue
          titre={`Relancer ${nombre} personne${nombre > 1 ? "s" : ""} ?`}
          fermer={() => setOuvert(false)}
          enCours={enCours}
          libelleValider={enCours ? "Envoi…" : "Envoyer les relances"}
          onValider={() =>
            demarrer(async () => {
              setRetour(await relancerVirementsAttendus());
              setOuvert(false);
              router.refresh();
            })
          }
        >
          <p>
            Un e-mail de rappel, avec l&apos;IBAN et le libellé du virement, part vers chaque personne dont la cotisation de l&apos;année en cours est attendue. Les personnes
            relancées il y a moins d&apos;une semaine sont ignorées.
          </p>
        </BoiteDialogue>
      )}
    </>
  );
}

/** Ouverture d'une nouvelle année d'AG (superadmin). */
export function NouvelleAnneeAg({ suggestion }: { suggestion: string }) {
  const [etat, action, enCours] = useActionState<EtatForm, FormData>(ouvrirAnneeAg, ETAT_INITIAL);
  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <ChampAdmin id="ag-label" name="label" libelle="Année d'AG" defaultValue={suggestion} erreur={etat.erreurs?.label} />
        <ChampAdmin id="ag-debut" name="starts_on" type="date" libelle="Date de l'Assemblée Générale" erreur={etat.erreurs?.starts_on} />
      </div>
      <p className="text-[13px] text-encre-3">L&apos;année en cours est close à cette date ; les adhésions suivantes sont rattachées à la nouvelle année.</p>
      <RetourForm statut={etat.statut} message={etat.message} />
      <BoutonAdmin type="submit" variante="secondaire" disabled={enCours} className="self-start">
        Ouvrir cette année d&apos;AG
      </BoutonAdmin>
    </form>
  );
}
