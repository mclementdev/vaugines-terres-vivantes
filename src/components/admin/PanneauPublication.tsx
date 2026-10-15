"use client";

import { useId } from "react";

import type { ModePublication } from "@/lib/admin/publication";

/** Choix « Brouillon / Publier maintenant / Programmer » + date et heure (heure de Paris). */
export function PanneauPublication({
  mode,
  date,
  onChange,
  erreur,
  libelleMaintenant = "Publier maintenant",
}: {
  mode: ModePublication;
  date: string;
  onChange: (v: { mode: ModePublication; date: string }) => void;
  erreur?: string;
  libelleMaintenant?: string;
}) {
  const id = useId();
  const options: { v: ModePublication; l: string }[] = [
    { v: "brouillon", l: "Brouillon (non visible)" },
    { v: "maintenant", l: libelleMaintenant },
    { v: "programmer", l: "Programmer" },
  ];
  return (
    <fieldset>
      <legend className="mb-2 font-bold">Publication</legend>
      <div className="flex flex-col gap-2">
        {options.map((o) => (
          <label key={o.v} className="flex cursor-pointer items-center gap-2.5">
            <input
              type="radio"
              name={`${id}-mode`}
              checked={mode === o.v}
              onChange={() => onChange({ mode: o.v, date })}
              className="size-[18px] accent-terre"
            />
            {o.l}
          </label>
        ))}
      </div>
      {mode === "programmer" && (
        <div className="mt-3">
          <label htmlFor={`${id}-date`} className="mb-1 block text-sm font-bold">
            Date et heure (heure de Paris)
          </label>
          <input
            id={`${id}-date`}
            type="datetime-local"
            value={date}
            onChange={(e) => onChange({ mode, date: e.target.value })}
            aria-invalid={erreur ? true : undefined}
            aria-describedby={erreur ? `${id}-err` : undefined}
            className="h-11 w-full rounded-[10px] border-[1.5px] border-bordure-douce px-2.5 aria-[invalid=true]:border-erreur"
          />
        </div>
      )}
      {erreur && (
        <p id={`${id}-err`} className="mt-2 text-sm font-semibold text-erreur">
          {erreur}
        </p>
      )}
    </fieldset>
  );
}
