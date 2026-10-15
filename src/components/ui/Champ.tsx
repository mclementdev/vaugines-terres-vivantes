import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/cn";

const classesChamp =
  "w-full rounded-[14px] border-[1.5px] border-bordure-champ bg-white px-4 text-[17px] text-encre placeholder:text-encre-3 aria-[invalid=true]:border-2 aria-[invalid=true]:border-erreur";

type Commun = { id: string; libelle: string; requis?: boolean; aide?: ReactNode; erreur?: string };

function Entete({ id, libelle, requis }: Pick<Commun, "id" | "libelle" | "requis">) {
  return (
    <label htmlFor={id} className="mb-1.5 block text-[15px] font-bold">
      {libelle}
      {requis && (
        <>
          {" "}
          <span className="text-terre-fonce" aria-hidden="true">*</span>
          <span className="sr-only">(obligatoire)</span>
        </>
      )}
    </label>
  );
}

function Pied({ id, aide, erreur }: Pick<Commun, "id" | "aide" | "erreur">) {
  return (
    <>
      {aide && (
        <p id={`${id}-aide`} className="mt-1.5 text-sm text-encre-3">
          {aide}
        </p>
      )}
      {erreur && (
        <p id={`${id}-erreur`} className="mt-1.5 text-sm font-semibold text-erreur">
          {erreur}
        </p>
      )}
    </>
  );
}

const decrit = (id: string, aide?: ReactNode, erreur?: string) =>
  [aide && `${id}-aide`, erreur && `${id}-erreur`].filter(Boolean).join(" ") || undefined;

/** Champ de saisie DA : libellé au-dessus, 52 px, rayon 14, erreur accessible. */
export function Champ({ id, libelle, requis, aide, erreur, className, ...props }: Commun & ComponentProps<"input">) {
  return (
    <div className={className}>
      <Entete id={id} libelle={libelle} requis={requis} />
      <input
        id={id}
        required={requis}
        aria-invalid={erreur ? true : undefined}
        aria-describedby={decrit(id, aide, erreur)}
        {...props}
        className={cn(classesChamp, "h-[52px]")}
      />
      <Pied id={id} aide={aide} erreur={erreur} />
    </div>
  );
}

export function ZoneTexte({ id, libelle, requis, aide, erreur, className, ...props }: Commun & ComponentProps<"textarea">) {
  return (
    <div className={className}>
      <Entete id={id} libelle={libelle} requis={requis} />
      <textarea
        id={id}
        required={requis}
        aria-invalid={erreur ? true : undefined}
        aria-describedby={decrit(id, aide, erreur)}
        {...props}
        className={cn(classesChamp, "min-h-32 py-3 leading-normal")}
      />
      <Pied id={id} aide={aide} erreur={erreur} />
    </div>
  );
}

/** Champ piège invisible pour les robots (honeypot). */
export function ChampPiege() {
  return (
    <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
      <label>
        Ne pas remplir
        <input name="site_web" type="text" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}
