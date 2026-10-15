"use client";

import { useActionState, useId } from "react";

import { inscrireLettre, type EtatLettre } from "@/app/actions/lettre";
import { cn } from "@/lib/cn";

/** Inscription à la lettre d'information (bloc « Rejoignez-nous »). */
export function FormulaireLettre({
  titre,
  texte,
  mention,
  className,
}: {
  titre: string;
  texte: string;
  mention: string;
  className?: string;
}) {
  const [etat, action, enCours] = useActionState<EtatLettre, FormData>(inscrireLettre, { statut: "inactif" });
  const id = useId();
  const erreur = etat.statut === "erreur";

  return (
    <form
      action={action}
      noValidate
      className={cn("rounded-3xl border border-white/25 bg-brun/55 p-[22px] sm:p-[30px]", className)}
    >
      <h3 className="mb-1.5 font-titre text-2xl font-semibold">{titre}</h3>
      <p className="mb-4 text-base text-[#F1E3D1]">{texte}</p>
      <label htmlFor={`${id}-email`} className="mb-1.5 block text-[15px] font-semibold">
        Votre adresse e-mail
      </label>
      <div className="flex flex-wrap gap-2.5">
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          placeholder="prenom@exemple.fr"
          aria-invalid={erreur || undefined}
          aria-describedby={`${id}-msg`}
          className="h-[52px] min-w-0 flex-[1_1_200px] rounded-[14px] border-0 bg-white px-4 text-[17px] text-encre placeholder:text-encre-3"
        />
        <div className="absolute -left-[9999px]" aria-hidden="true">
          <label htmlFor={`${id}-site`}>Ne pas remplir</label>
          <input id={`${id}-site`} name="site_web" type="text" tabIndex={-1} autoComplete="off" />
        </div>
        <button
          type="submit"
          disabled={enCours}
          className="bouton-anime h-[52px] w-full cursor-pointer rounded-[14px] bg-brun px-[22px] font-bold text-white hover:bg-nuit disabled:opacity-70 sm:w-auto"
        >
          {enCours ? "Envoi…" : "S'inscrire"}
        </button>
      </div>
      <p id={`${id}-msg`} role="status" className={cn("mt-3 min-h-0 text-[15px] font-semibold", !etat.message && "sr-only")}>
        {etat.message}
      </p>
      <p className="mt-3 text-sm text-pierre">{mention}</p>
    </form>
  );
}
