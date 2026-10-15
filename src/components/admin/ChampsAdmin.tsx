import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/cn";

const base =
  "w-full rounded-[10px] border-[1.5px] border-bordure-douce bg-white px-2.5 aria-[invalid=true]:border-2 aria-[invalid=true]:border-erreur";

type Commun = { id: string; libelle: ReactNode; aide?: ReactNode; erreur?: string; className?: string };

function Cadre({ id, libelle, aide, erreur, className, children }: Commun & { children: ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-bold">
        {libelle}
      </label>
      {children}
      {aide && (
        <p id={`${id}-aide`} className="mt-1 text-[13px] text-encre-3">
          {aide}
        </p>
      )}
      {erreur && (
        <p id={`${id}-err`} className="mt-1 text-sm font-semibold text-erreur">
          {erreur}
        </p>
      )}
    </div>
  );
}

const decrit = (id: string, aide?: ReactNode, erreur?: string) =>
  [aide && `${id}-aide`, erreur && `${id}-err`].filter(Boolean).join(" ") || undefined;

/** Champ compact de l'administration (barre latérale des éditeurs). */
export function ChampAdmin({ id, libelle, aide, erreur, className, ...p }: Commun & Omit<ComponentProps<"input">, "id">) {
  return (
    <Cadre id={id} libelle={libelle} aide={aide} erreur={erreur} className={className}>
      <input id={id} aria-invalid={erreur ? true : undefined} aria-describedby={decrit(id, aide, erreur)} {...p} className={cn(base, "h-11")} />
    </Cadre>
  );
}

export function ZoneAdmin({ id, libelle, aide, erreur, className, ...p }: Commun & Omit<ComponentProps<"textarea">, "id">) {
  return (
    <Cadre id={id} libelle={libelle} aide={aide} erreur={erreur} className={className}>
      <textarea
        id={id}
        aria-invalid={erreur ? true : undefined}
        aria-describedby={decrit(id, aide, erreur)}
        {...p}
        className={cn(base, "py-2 leading-normal")}
      />
    </Cadre>
  );
}

export function ChoixAdmin({ id, libelle, aide, erreur, className, children, ...p }: Commun & Omit<ComponentProps<"select">, "id">) {
  return (
    <Cadre id={id} libelle={libelle} aide={aide} erreur={erreur} className={className}>
      <select id={id} aria-invalid={erreur ? true : undefined} aria-describedby={decrit(id, aide, erreur)} {...p} className={cn(base, "h-11")}>
        {children}
      </select>
    </Cadre>
  );
}

export function CaseAdmin({ libelle, ...p }: { libelle: ReactNode } & ComponentProps<"input">) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5">
      <input type="checkbox" {...p} className="mt-0.5 size-[18px] shrink-0 accent-terre" />
      <span>{libelle}</span>
    </label>
  );
}
