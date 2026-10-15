"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore, useTransition, type FormEvent, type ReactNode } from "react";

import { adherer } from "@/app/actions/adhesion";
import { VillageTrait } from "@/components/site/VillageTrait";
import { Champ } from "@/components/ui/Champ";
import {
  CLE_MERCI,
  COORDONNEES_VIDES,
  MONTANTS_SUGGERES,
  erreursParChamp,
  formatMontant,
  libelleVirement,
  schemaChoix,
  schemaCoordonnees,
  schemaEngagements,
  type Coordonnees,
  type Engagements,
} from "@/lib/adhesion/commun";
import { cn } from "@/lib/cn";

import { EtapesBureau, ProgressionMobile } from "./Etapes";
import { CoordonneesBancaires, type Virement } from "./CoordonneesBancaires";

type Etape = 1 | 2 | 3;
type Etat = {
  etape: Etape;
  mode: "avec" | "sans";
  /** Montant suggéré choisi (euros). */
  montant: number | null;
  /** Montant libre saisi (prioritaire s'il est rempli). */
  libre: string;
  coordonnees: Coordonnees;
  engagements: Engagements;
};

const CLE = "vtv-adhesion";
const INITIAL: Etat = {
  etape: 1,
  mode: "avec",
  montant: 20,
  libre: "",
  coordonnees: COORDONNEES_VIDES,
  engagements: { statuts: false, donnees: false, lettre: false },
};

const montantEffectif = (e: Etat) => (e.libre.trim() ? Number(e.libre.replace(",", ".")) : e.montant);
const etapeValide = (e: Etat): Etape => {
  if (!schemaChoix.safeParse({ mode: e.mode, montant: montantEffectif(e) }).success) return 1;
  if (!schemaCoordonnees.safeParse(e.coordonnees).success) return 2;
  return 3;
};

function lireSauvegarde(): Etat {
  try {
    const brut = sessionStorage.getItem(CLE);
    const e: Etat = brut ? { ...INITIAL, ...JSON.parse(brut) } : INITIAL;
    const demandee = Number(new URLSearchParams(location.search).get("etape")) || e.etape;
    return { ...e, etape: Math.min(demandee, etapeValide(e)) as Etape };
  } catch {
    return INITIAL;
  }
}

const abonnement = () => () => {};

/**
 * Parcours d'adhésion. Le rendu serveur montre l'étape 1 vierge ; une fois dans
 * le navigateur, le parcours est remonté avec la saisie conservée (sessionStorage).
 */
export function ParcoursAdhesion(props: { virement: Virement; paiementEnLigne: boolean }) {
  const client = useSyncExternalStore(abonnement, () => true, () => false);
  return client ? (
    <Parcours key="client" initial={lireSauvegarde()} actif {...props} />
  ) : (
    <Parcours key="serveur" initial={INITIAL} actif={false} {...props} />
  );
}

/** `actif` : faux pendant l'hydratation, pour ne pas écraser la saisie conservée. */
function Parcours({ initial, actif, virement, paiementEnLigne }: { initial: Etat; actif: boolean; virement: Virement; paiementEnLigne: boolean }) {
  const [etat, setEtat] = useState(initial);
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string>();
  const [enCours, demarrer] = useTransition();
  const titre = useRef<HTMLHeadingElement>(null);
  const premierRendu = useRef(true);
  const router = useRouter();

  // Saisie conservée pendant la session (jamais dans l'URL).
  useEffect(() => {
    if (!actif) return;
    try {
      sessionStorage.setItem(CLE, JSON.stringify(etat));
    } catch {
      /* stockage indisponible (navigation privée) : le parcours fonctionne quand même */
    }
  }, [etat, actif]);

  // Numéro d'étape dans l'URL : bouton « Précédent » du navigateur.
  useEffect(() => {
    const surRetour = (e: PopStateEvent) => {
      const etape = (e.state?.etape ?? 1) as Etape;
      setEtat((s) => ({ ...s, etape: Math.min(etape, etapeValide(s)) as Etape }));
      setErreurs({});
    };
    window.addEventListener("popstate", surRetour);
    return () => window.removeEventListener("popstate", surRetour);
  }, []);

  useEffect(() => {
    if (!actif) return;
    const url = etat.etape === 1 ? location.pathname : `${location.pathname}?etape=${etat.etape}`;
    if (premierRendu.current) {
      premierRendu.current = false;
      history.replaceState({ etape: etat.etape }, "", url);
      return;
    }
    if (history.state?.etape !== etat.etape) history.pushState({ etape: etat.etape }, "", url);
    titre.current?.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [etat.etape, actif]);

  const allerA = (etape: Etape) => {
    setErreurs({});
    setMessage(undefined);
    setEtat((s) => ({ ...s, etape }));
  };

  const signaler = (e: Record<string, string>) => {
    setErreurs(e);
    // Premier champ en erreur dans l'ordre de la page.
    requestAnimationFrame(() => document.querySelector<HTMLElement>("#contenu [aria-invalid='true']")?.focus());
  };
  const corriger = (cle: string) => setErreurs((e) => (e[cle] ? Object.fromEntries(Object.entries(e).filter(([k]) => k !== cle)) : e));

  const suivant = (ev: FormEvent) => {
    ev.preventDefault();
    if (etat.etape === 1) {
      const r = schemaChoix.safeParse({ mode: etat.mode, montant: etat.mode === "avec" ? montantEffectif(etat) : null });
      if (!r.success) return signaler(erreursParChamp(r.error));
      return allerA(2);
    }
    if (etat.etape === 2) {
      const r = schemaCoordonnees.safeParse(etat.coordonnees);
      if (!r.success) return signaler(erreursParChamp(r.error));
      return allerA(3);
    }
    const r = schemaEngagements.safeParse(etat.engagements);
    if (!r.success) return signaler(erreursParChamp(r.error));
    const piege = (ev.currentTarget as HTMLFormElement).elements.namedItem("site_web") as HTMLInputElement | null;
    setMessage(undefined);
    demarrer(async () => {
      const res = await adherer({
        choix: { mode: etat.mode, montant: etat.mode === "avec" ? montantEffectif(etat) : null },
        coordonnees: etat.coordonnees,
        engagements: etat.engagements,
        site_web: piege?.value ?? "",
      });
      if (res.statut === "ok") {
        try {
          sessionStorage.setItem(CLE_MERCI, JSON.stringify(res.merci));
          sessionStorage.removeItem(CLE);
        } catch {}
        router.push("/adherer/merci");
        return;
      }
      setMessage(res.message);
      if (res.etape && res.etape !== 3) allerA(res.etape);
      if (res.erreurs) signaler(res.erreurs);
    });
  };

  const montant = montantEffectif(etat);
  const resumeChoix = etat.mode === "avec" ? `Avec cotisation · ${montant ? formatMontant(montant * 100) : "—"}` : "Sans cotisation";
  const TITRES = { 1: "Rejoignez l'association en 3 étapes", 2: "Vos coordonnées", 3: "Vérifiez et validez" } as const;

  return (
    <div className="conteneur pb-10 pt-8 md:pb-[100px] md:pt-14">
      <p className="mb-2 hidden text-sm font-bold uppercase tracking-[.14em] text-terre-fonce md:block">
        {etat.etape === 1 ? "Adhérer" : `Adhérer · étape ${etat.etape} sur 3`}
      </p>
      <ProgressionMobile etape={etat.etape} />
      <h1
        ref={titre}
        tabIndex={-1}
        className={cn(
          "font-titre font-semibold leading-[1.05] tracking-[-0.02em] outline-none",
          etat.etape === 1 ? "mb-2.5 text-[32px] md:text-[clamp(36px,4.6vw,56px)]" : "mb-1.5 text-[32px] md:mb-8 md:text-[clamp(34px,4.2vw,50px)]",
        )}
      >
        {TITRES[etat.etape]}
      </h1>
      {etat.etape === 1 && <p className="mb-6 max-w-[640px] text-encre-2 md:mb-8">Environ 2 minutes. La cotisation est libre : vous pouvez aussi adhérer sans cotiser.</p>}
      {etat.etape > 1 && (
        <p className="mb-5 text-[15px] text-encre-2 md:hidden">
          Adhésion {etat.mode === "avec" ? "avec cotisation" : "sans cotisation"}
          {etat.mode === "avec" && montant ? (
            <>
              {" "}
              · <strong>{formatMontant(montant * 100)}</strong>
            </>
          ) : null}{" "}
          ·{" "}
          <button type="button" onClick={() => allerA(1)} className="cursor-pointer font-bold text-terre-fonce underline">
            modifier
          </button>
        </p>
      )}

      <EtapesBureau etape={etat.etape} allerA={allerA} />

      <div className="flex flex-wrap items-start gap-8">
        <form method="post" onSubmit={suivant} noValidate className="flex min-w-0 flex-[999_1_560px] flex-col gap-4" aria-describedby={message ? "adh-message" : undefined}>
          {etat.etape === 1 && <EtapeChoix etat={etat} setEtat={setEtat} erreurs={erreurs} corriger={corriger} />}
          {etat.etape === 2 && <EtapeCoordonnees etat={etat} setEtat={setEtat} erreurs={erreurs} corriger={corriger} />}
          {etat.etape === 3 && (
            <EtapeValidation etat={etat} setEtat={setEtat} erreurs={erreurs} corriger={corriger} virement={virement} paiementEnLigne={paiementEnLigne} resumeChoix={resumeChoix} allerA={allerA} />
          )}

          {message && (
            <p id="adh-message" role="alert" className="rounded-[14px] bg-tag-terre px-4 py-3 font-semibold text-erreur">
              {message}
            </p>
          )}

          <Barre
            etape={etat.etape}
            enCours={enCours}
            retour={() => allerA((etat.etape - 1) as Etape)}
            libelle={etat.etape === 3 ? (enCours ? "Enregistrement…" : "Valider mon adhésion") : "Continuer"}
          />
        </form>

        <Aside etape={etat.etape} avec={etat.mode === "avec"} montant={montant} allerA={allerA} />
      </div>
    </div>
  );
}

type PropsEtape = {
  etat: Etat;
  setEtat: React.Dispatch<React.SetStateAction<Etat>>;
  erreurs: Record<string, string>;
  /** Efface l'erreur d'un champ dès qu'il est modifié. */
  corriger: (cle: string) => void;
};

// ---------------------------------------------------------------------------
// Étape 1 : avec ou sans cotisation
// ---------------------------------------------------------------------------
function EtapeChoix({ etat, setEtat, erreurs, corriger }: PropsEtape) {
  const avec = etat.mode === "avec";
  const erreurMontant = erreurs.montant;
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-4 p-0 font-titre text-[22px] font-semibold md:text-[26px]">Comment souhaitez-vous adhérer ?</legend>

      <div className={cn("rounded-[22px] bg-white px-5 py-5 md:px-[26px] md:py-6", avec ? "border-[2.5px] border-terre" : "border-[1.5px] border-bordure")}>
        <label className="flex cursor-pointer items-start gap-[18px]">
          <input
            type="radio"
            name="mode"
            value="avec"
            checked={avec}
            onChange={() => setEtat((s) => ({ ...s, mode: "avec" }))}
            className="mt-1 size-6 shrink-0 accent-terre"
          />
          <span>
            <strong className="block font-titre text-xl font-semibold md:text-[22px]">Adhérer avec la cotisation de mon choix</strong>
            <span className="block text-encre-2">Vous soutenez les actions de l&apos;association. Paiement par virement.</span>
          </span>
        </label>

        {avec && (
          <div className="mt-[18px] md:pl-[42px]">
            <p id="adh-montants" className="mb-2.5 text-[15px] font-bold">
              Montant suggéré
            </p>
            <div role="group" aria-labelledby="adh-montants" className="mb-4 flex flex-wrap gap-2.5">
              {MONTANTS_SUGGERES.map((v) => {
                const actif = !etat.libre.trim() && etat.montant === v;
                return (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={actif}
                    onClick={() => {
                      corriger("montant");
                      setEtat((s) => ({ ...s, montant: v, libre: "" }));
                    }}
                    className={cn(
                      "h-[50px] min-w-[76px] cursor-pointer rounded-full border-2 px-4 font-bold",
                      actif ? "border-terre bg-terre text-white" : "border-bordure-douce bg-white text-encre hover:border-terre",
                    )}
                  >
                    {v} €
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <label htmlFor="adh-montant" className="text-[15px] font-bold">
                Ou un autre montant
              </label>
              <span
                className={cn(
                  "inline-flex items-center overflow-hidden rounded-[14px] bg-white focus-within:outline-3 focus-within:outline-offset-1 focus-within:outline-abricot",
                  erreurMontant ? "border-2 border-erreur" : "border-[1.5px] border-bordure-champ",
                )}
              >
                <input
                  id="adh-montant"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="—"
                  value={etat.libre}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^\d]/g, "").slice(0, 5);
                    corriger("montant");
                    setEtat((s) => ({ ...s, libre: v }));
                  }}
                  aria-invalid={erreurMontant ? true : undefined}
                  aria-describedby={erreurMontant ? "adh-montant-erreur" : undefined}
                  className="h-12 w-[110px] border-0 px-3.5 outline-none"
                />
                <span className="px-3.5 font-bold text-encre-3" aria-hidden="true">
                  €
                </span>
              </span>
            </div>
            {erreurMontant && (
              <p id="adh-montant-erreur" className="mt-1.5 text-sm font-semibold text-erreur">
                {erreurMontant}
              </p>
            )}
          </div>
        )}
      </div>

      <label
        className={cn(
          "flex cursor-pointer items-start gap-[18px] rounded-[22px] bg-white px-5 py-5 md:px-[26px] md:py-6",
          !avec ? "border-[2.5px] border-terre" : "border-[1.5px] border-bordure",
        )}
      >
        <input
          type="radio"
          name="mode"
          value="sans"
          checked={!avec}
          onChange={() => {
            corriger("montant");
            setEtat((s) => ({ ...s, mode: "sans" }));
          }}
          className="mt-1 size-6 shrink-0 accent-terre"
        />
        <span>
          <strong className="block font-titre text-xl font-semibold md:text-[22px]">Adhérer sans cotiser</strong>
          <span className="text-encre-2">Vous faites partie de l&apos;association, recevez les nouvelles et participez — sans rien verser.</span>
        </span>
      </label>
    </fieldset>
  );
}

// ---------------------------------------------------------------------------
// Étape 2 : coordonnées
// ---------------------------------------------------------------------------
function EtapeCoordonnees({ etat, setEtat, erreurs, corriger }: PropsEtape) {
  const c = etat.coordonnees;
  const champ = (cle: keyof Coordonnees) => ({
    id: `adh-${cle}`,
    name: cle,
    value: c[cle] ?? "",
    erreur: erreurs[cle],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      corriger(cle);
      setEtat((s) => ({ ...s, coordonnees: { ...s.coordonnees, [cle]: v } }));
    },
  });
  return (
    <div className="flex flex-col gap-[22px] rounded-[26px] bg-white p-5 md:p-[34px]">
      <p className="text-[15px] text-encre-3">
        Les champs marqués <span className="font-bold text-terre-fonce">*</span> sont obligatoires.
      </p>
      <div className="grid gap-x-5 gap-y-[18px] [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
        <Champ {...champ("nom")} libelle="Nom" requis autoComplete="family-name" />
        <Champ {...champ("prenom")} libelle="Prénom" requis autoComplete="given-name" />
        <Champ {...champ("naissance")} libelle="Date de naissance" inputMode="numeric" placeholder="JJ / MM / AAAA" autoComplete="bday" aide="Facultatif." />
        <Champ {...champ("telephone")} libelle="Téléphone" type="tel" inputMode="tel" autoComplete="tel" aide="Facultatif. Jamais affiché ni partagé." />
      </div>
      <Champ
        {...champ("email")}
        libelle="E-mail"
        requis
        type="email"
        inputMode="email"
        autoComplete="email"
        spellCheck={false}
        aide="Pour l'e-mail de bienvenue et les nouvelles de l'association."
      />
      <Champ {...champ("adresse")} libelle="Adresse postale" autoComplete="street-address" placeholder="Numéro et rue" />
      <div className="grid grid-cols-2 gap-x-2.5 gap-y-[18px] md:gap-x-5 md:[grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
        <Champ {...champ("code_postal")} libelle="Code postal" inputMode="numeric" autoComplete="postal-code" />
        <Champ {...champ("commune")} libelle="Commune" autoComplete="address-level2" />
      </div>
      <p className="text-sm text-encre-3 md:hidden">Vos données servent uniquement à la vie de l&apos;association.</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Étape 3 : récapitulatif, paiement, engagements
// ---------------------------------------------------------------------------
function EtapeValidation({
  etat,
  setEtat,
  erreurs,
  corriger,
  virement,
  paiementEnLigne,
  resumeChoix,
  allerA,
}: PropsEtape & { virement: Virement; paiementEnLigne: boolean; resumeChoix: string; allerA: (e: Etape) => void }) {
  const c = etat.coordonnees;
  const adresse = [c.adresse, [c.code_postal, c.commune].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  const libelle = libelleVirement(c.nom, c.prenom);
  const coche = (cle: keyof Engagements) => ({
    id: `adh-${cle}`,
    checked: etat.engagements[cle],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.checked;
      corriger(cle);
      setEtat((s) => ({ ...s, engagements: { ...s.engagements, [cle]: v } }));
    },
    "aria-invalid": erreurs[cle] ? true : undefined,
    "aria-describedby": erreurs[cle] ? `adh-${cle}-erreur` : undefined,
    className: "mt-[3px] size-[22px] shrink-0 accent-terre",
  });

  return (
    <>
      <Section>
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="mb-3.5 font-titre text-[22px] font-semibold">Récapitulatif</h2>
          <button type="button" onClick={() => allerA(2)} className="cursor-pointer text-[15px] font-bold text-terre-fonce underline-offset-4 hover:underline">
            Modifier<span className="sr-only"> vos coordonnées</span>
          </button>
        </div>
        <dl className="grid gap-x-6 gap-y-3 text-base [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
          <Info terme="Adhésion">
            {resumeChoix}{" "}
            <button type="button" onClick={() => allerA(1)} className="cursor-pointer text-sm font-bold text-terre-fonce underline">
              modifier<span className="sr-only"> votre choix</span>
            </button>
          </Info>
          <Info terme="Nom">
            {c.prenom} {c.nom}
          </Info>
          <Info terme="E-mail">
            <span className="[overflow-wrap:anywhere]">{c.email}</span>
          </Info>
          {adresse && <Info terme="Adresse">{adresse}</Info>}
          {c.telephone && <Info terme="Téléphone">{c.telephone}</Info>}
          {c.naissance && <Info terme="Date de naissance">{c.naissance}</Info>}
        </dl>
      </Section>

      {etat.mode === "avec" && (
        <Section>
          <h2 className="mb-1.5 font-titre text-[22px] font-semibold">Paiement de la cotisation</h2>
          <p className="mb-[18px] text-base text-encre-2">Votre adhésion est enregistrée tout de suite ; la cotisation est marquée « payée » dès réception.</p>
          <fieldset className="flex flex-col gap-3">
            <legend className="sr-only">Moyen de paiement</legend>
            <label className="flex items-start gap-3.5 rounded-[18px] border-[2.5px] border-terre px-4 py-4 md:px-5">
              <input type="radio" name="paiement" defaultChecked className="mt-[3px] size-[22px] shrink-0 accent-terre" />
              <span className="min-w-0 flex-1">
                <strong className="block text-lg">Par virement bancaire</strong>
                <CoordonneesBancaires virement={virement} libelle={libelle} />
              </span>
            </label>
            <label className={cn("flex items-start gap-3.5 rounded-[18px] px-4 py-4 md:px-5", "border-[1.5px] border-dashed border-bordure-champ text-encre-3")}>
              <input type="radio" name="paiement" disabled={!paiementEnLigne} className="mt-[3px] size-[22px] shrink-0" />
              <span>
                <strong className="block text-lg">Paiement en ligne par carte</strong>
                <span className="text-[15px]">Bientôt disponible.</span>
              </span>
            </label>
          </fieldset>
        </Section>
      )}

      <Section className="flex flex-col gap-3.5">
        <h2 className="mb-1 font-titre text-[22px] font-semibold">Engagements</h2>
        <Case erreur={erreurs.statuts} id="statuts">
          <input type="checkbox" {...coche("statuts")} />
          <span>
            En adhérant, je m&apos;engage à respecter les{" "}
            <Link href="/statuts" target="_blank">
              statuts<span className="sr-only"> (nouvel onglet)</span>
            </Link>{" "}
            et le règlement intérieur de l&apos;association. <Requis />
          </span>
        </Case>
        <Case erreur={erreurs.donnees} id="donnees">
          <input type="checkbox" {...coche("donnees")} />
          <span>
            J&apos;accepte que mes données soient utilisées pour la gestion des adhésions et la vie de l&apos;association.{" "}
            <Link href="/donnees-personnelles" target="_blank">
              En savoir plus<span className="sr-only"> sur vos données personnelles (nouvel onglet)</span>
            </Link>{" "}
            <Requis />
          </span>
        </Case>
        <Case id="lettre">
          <input type="checkbox" {...coche("lettre")} />
          <span>Je souhaite recevoir la lettre d&apos;information (désinscription en un clic).</span>
        </Case>
        {/* Champ piège invisible : rempli uniquement par les robots. */}
        <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
          <label>
            Ne pas remplir
            <input name="site_web" type="text" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
      </Section>
    </>
  );
}

function Section({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-3xl bg-white px-5 py-6 md:px-[30px] md:py-7", className)}>{children}</section>;
}

function Info({ terme, children }: { terme: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-encre-3">{terme}</dt>
      <dd className="font-bold">{children}</dd>
    </div>
  );
}

function Requis() {
  return (
    <>
      <span className="font-bold text-terre-fonce" aria-hidden="true">
        *
      </span>
      <span className="sr-only">(obligatoire)</span>
    </>
  );
}

function Case({ children, erreur, id }: { children: ReactNode; erreur?: string; id: string }) {
  return (
    <div>
      <label className="flex items-start gap-3">{children}</label>
      {erreur && (
        <p id={`adh-${id}-erreur`} className="ml-[34px] mt-1 text-sm font-semibold text-erreur">
          {erreur}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Barre d'action (collée en bas de l'écran sur mobile)
// ---------------------------------------------------------------------------
function Barre({ etape, enCours, retour, libelle }: { etape: Etape; enCours: boolean; retour: () => void; libelle: string }) {
  return (
    <div className="sticky bottom-0 z-10 -mx-5 mt-2 flex items-center gap-2.5 border-t border-bordure bg-white px-5 pb-[max(14px,env(safe-area-inset-bottom))] pt-3.5 md:static md:mx-0 md:mt-3 md:flex-wrap md:justify-between md:gap-3 md:border-0 md:bg-transparent md:p-0">
      {etape === 1 ? (
        <Link href="/" className="hidden px-1 py-3.5 font-bold md:inline">
          ← Retour à l&apos;accueil
        </Link>
      ) : (
        <button
          type="button"
          onClick={retour}
          className="flex size-[54px] shrink-0 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-bordure-douce text-encre md:size-auto md:rounded-none md:border-0 md:px-1 md:py-3.5 md:font-bold md:text-terre-fonce md:hover:underline"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="md:hidden">
            <path d="M11 3L5 9l6 6" />
          </svg>
          <span className="sr-only md:not-sr-only">← Étape précédente</span>
        </button>
      )}
      <button
        type="submit"
        disabled={enCours}
        className={cn(
          "bouton-anime flex-1 cursor-pointer rounded-full bg-terre px-[30px] py-4 text-lg font-bold text-white hover:bg-terre-fonce disabled:cursor-wait disabled:opacity-70 md:ml-auto md:flex-none",
          etape === 3 && "font-extrabold md:px-8",
        )}
      >
        {libelle}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Colonne de droite
// ---------------------------------------------------------------------------
function Aside({ etape, avec, montant, allerA }: { etape: Etape; avec: boolean; montant: number | null; allerA: (e: Etape) => void }) {
  if (etape === 1) {
    return (
      <aside className="min-w-0 flex-[1_1_320px] overflow-hidden rounded-3xl bg-pierre px-7 pt-7">
        <h2 className="mb-3.5 font-titre text-[22px] font-semibold">En adhérant, vous…</h2>
        <ul className="flex list-disc flex-col gap-2 pl-5 text-base text-encre-2">
          <li>recevez un e-mail de bienvenue et les statuts,</li>
          <li>êtes informé·e des rendez-vous et de la vie de l&apos;association,</li>
          <li>pouvez rejoindre une commission,</li>
          <li>votez à l&apos;Assemblée Générale.</li>
        </ul>
        <p className="mt-[18px] text-sm text-encre-3">La cotisation est valable d&apos;une Assemblée Générale à la suivante.</p>
        <VillageTrait decoratif sizes="400px" className="-ml-[10%] mt-5 block h-auto w-[120%] max-w-none opacity-70" />
      </aside>
    );
  }
  if (etape === 2) {
    return (
      <aside className="hidden min-w-0 flex-[1_1_300px] flex-col gap-4 md:flex">
        <div className="rounded-[22px] bg-white p-6">
          <p className="mb-1 text-sm font-bold text-encre-3">Votre choix</p>
          <p className="mb-1 font-titre text-[22px] font-semibold">{avec ? "Adhésion avec cotisation" : "Adhésion sans cotisation"}</p>
          {avec && montant ? <p className="mb-3 font-titre text-[34px] font-semibold text-terre-fonce">{formatMontant(montant * 100)}</p> : null}
          <button type="button" onClick={() => allerA(1)} className="cursor-pointer text-[15px] font-bold text-terre-fonce underline-offset-4 hover:underline">
            Modifier<span className="sr-only"> votre choix</span>
          </button>
        </div>
        <Donnees />
      </aside>
    );
  }
  return (
    <aside className="min-w-0 flex-[1_1_300px] rounded-[22px] bg-pierre p-6 text-[15px] text-encre-2">
      <p className="mb-2 font-bold text-encre">Et ensuite ?</p>
      <ol className="flex list-decimal flex-col gap-2 pl-5">
        <li>Vous recevez un e-mail de bienvenue avec les statuts.</li>
        <li>Le conseil collégial est prévenu de votre adhésion.</li>
        <li>Vous êtes invité·e aux prochains rendez-vous.</li>
      </ol>
    </aside>
  );
}

function Donnees() {
  return (
    <div className="rounded-[22px] bg-pierre p-[22px] text-[15px] text-encre-2">
      <p className="mb-1.5 font-bold text-encre">Vos données</p>
      <p>
        Elles servent uniquement à la vie de l&apos;association et ne sont jamais cédées. Vous pouvez demander à les modifier ou les supprimer à tout moment.
      </p>
    </div>
  );
}
