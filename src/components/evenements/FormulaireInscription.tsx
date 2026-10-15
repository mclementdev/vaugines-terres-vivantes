"use client";

import { useActionState, useId, useState } from "react";

import { inscrireEvenement, type EtatInscription } from "@/app/actions/inscriptions";
import { ChampPiege } from "@/components/ui/Champ";
import { MAX_PLACES } from "@/lib/evenements";
import { cn } from "@/lib/cn";

const classeChamp =
  "h-[52px] w-full rounded-[14px] border-[1.5px] border-bordure-champ bg-white px-4 text-[17px] text-encre aria-[invalid=true]:border-2 aria-[invalid=true]:border-erreur";

/** Inscription à un événement : nom, e-mail, nombre de personnes (jauge vérifiée côté serveur). */
export function FormulaireInscription({
  eventId,
  slug,
  restantes,
  aBientot,
}: {
  eventId: string;
  slug: string;
  /** Places restantes (null : pas de jauge). */
  restantes: number | null;
  /** « à samedi », « à bientôt »… */
  aBientot: string;
}) {
  const [etat, action, enCours] = useActionState<EtatInscription, FormData>(inscrireEvenement.bind(null, slug), { statut: "inactif" });
  const [encore, setEncore] = useState(0);
  const id = useId();
  const maxi = Math.max(1, Math.min(MAX_PLACES, etat.restantes ?? restantes ?? MAX_PLACES));
  const e = etat.erreurs ?? {};
  const v = etat.valeurs;

  if (etat.statut === "ok" && encore === 0) {
    return (
      <div role="status">
        <span className="mb-3.5 flex size-12 items-center justify-center rounded-full bg-tag-olive text-olive" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 7.5l3 3 7-7" />
          </svg>
        </span>
        <h3 className="mb-1.5 font-titre text-2xl font-semibold">C&apos;est noté, {aBientot} !</h3>
        <p className="mb-4 text-[15px] text-encre-2">
          Un e-mail de confirmation vous attend, avec un rappel la veille. Il contient le lien pour modifier ou annuler votre inscription.
        </p>
        <button type="button" onClick={() => setEncore(1)} className="cursor-pointer font-bold text-terre-fonce underline-offset-4 hover:underline">
          Inscrire une autre personne
        </button>
      </div>
    );
  }

  if (etat.statut === "complet" || restantes === 0) {
    return (
      <p className="rounded-2xl bg-sable p-4 text-[15px] text-encre-2">
        <strong className="block text-encre">C&apos;est complet.</strong>
        {etat.message ?? "Toutes les places sont prises. Une place peut se libérer : revenez voir un peu plus tard."}
      </p>
    );
  }

  return (
    <form
      key={encore}
      action={(fd) => {
        setEncore(0);
        return action(fd);
      }}
      noValidate
      className="flex flex-col gap-3.5"
    >
      <input type="hidden" name="event_id" value={eventId} />
      <div>
        <label htmlFor={`${id}-nom`} className="mb-1.5 block text-[15px] font-bold">
          Prénom et nom
        </label>
        <input
          id={`${id}-nom`}
          name="nom"
          autoComplete="name"
          required
          defaultValue={v?.nom}
          aria-invalid={e.nom ? true : undefined}
          aria-describedby={e.nom ? `${id}-nom-err` : undefined}
          className={classeChamp}
        />
        {e.nom && (
          <p id={`${id}-nom-err`} className="mt-1 text-sm font-semibold text-erreur">
            {e.nom}
          </p>
        )}
      </div>
      <div>
        <label htmlFor={`${id}-email`} className="mb-1.5 block text-[15px] font-bold">
          E-mail
        </label>
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          spellCheck={false}
          required
          defaultValue={v?.email}
          aria-invalid={e.email ? true : undefined}
          aria-describedby={`${id}-email-aide${e.email ? ` ${id}-email-err` : ""}`}
          className={classeChamp}
        />
        <p id={`${id}-email-aide`} className="mt-1 text-[13px] text-encre-3">
          Pour la confirmation et le rappel. Jamais affiché ni partagé.
        </p>
        {e.email && (
          <p id={`${id}-email-err`} className="mt-1 text-sm font-semibold text-erreur">
            {e.email}
          </p>
        )}
      </div>
      <div>
        <label htmlFor={`${id}-places`} className="mb-1.5 block text-[15px] font-bold">
          Nombre de personnes
        </label>
        <select
          id={`${id}-places`}
          name="places"
          defaultValue={v?.places ?? "1"}
          aria-invalid={e.places ? true : undefined}
          aria-describedby={e.places ? `${id}-places-err` : undefined}
          className={cn(classeChamp, "cursor-pointer")}
        >
          {Array.from({ length: maxi }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        {e.places && (
          <p id={`${id}-places-err`} className="mt-1 text-sm font-semibold text-erreur">
            {e.places}
          </p>
        )}
      </div>
      <ChampPiege />
      {etat.statut === "erreur" && etat.message && (
        <p role="alert" className="rounded-[14px] bg-tag-terre px-4 py-3 text-[15px] font-semibold text-erreur">
          {etat.message}
        </p>
      )}
      <button
        type="submit"
        disabled={enCours}
        className="bouton-anime mt-1 min-h-[52px] cursor-pointer rounded-full bg-terre px-6 text-lg font-bold text-white hover:bg-terre-fonce disabled:cursor-wait disabled:opacity-70"
      >
        {enCours ? "Inscription…" : "Valider mon inscription"}
      </button>
      <p className="text-[13px] text-encre-3">Vos coordonnées servent uniquement à organiser ce rendez-vous ; elles sont effacées un mois après.</p>
    </form>
  );
}
