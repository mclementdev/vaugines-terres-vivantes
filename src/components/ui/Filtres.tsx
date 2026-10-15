"use client";

import { cn } from "@/lib/cn";

/** Groupe de boutons-filtres pilule (aria-pressed), planches Veille et Glossaire. */
export function Filtres<T extends string>({
  libelle,
  options,
  valeur,
  onChange,
  className,
}: {
  libelle: string;
  options: { valeur: T; libelle: string }[];
  valeur: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div role="group" aria-label={libelle} className={cn("flex flex-wrap gap-2", className)}>
      {options.map((o) => {
        const actif = o.valeur === valeur;
        return (
          <button
            key={o.valeur}
            type="button"
            aria-pressed={actif}
            onClick={() => onChange(o.valeur)}
            className={cn(
              "h-11 cursor-pointer rounded-full px-4 text-[15px]",
              actif
                ? "border-2 border-terre bg-terre font-bold text-white"
                : "border-[1.5px] border-bordure-douce bg-white font-semibold text-encre hover:border-terre",
            )}
          >
            {o.libelle}
          </button>
        );
      })}
    </div>
  );
}

/** Champ de recherche arrondi avec loupe et libellé accessible. */
export function ChampRecherche({
  libelle,
  placeholder,
  valeur,
  onChange,
  className,
}: {
  libelle: string;
  placeholder: string;
  valeur: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <label className={cn("flex h-[54px] items-center gap-2.5 rounded-[14px] border-[1.5px] border-bordure-champ bg-white px-4 focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-indigo", className)}>
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="shrink-0 text-encre-3">
        <circle cx="9" cy="9" r="6" />
        <path d="M13.5 13.5L18 18" />
      </svg>
      <span className="sr-only">{libelle}</span>
      <input
        type="search"
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-encre-3"
      />
    </label>
  );
}

/** Normalise pour la recherche : minuscules, sans accents. */
export function normaliser(s: string) {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}
