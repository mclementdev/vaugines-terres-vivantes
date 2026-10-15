"use client";

import { createContext, use, useEffect, useState, useTransition, type ReactNode } from "react";

import { basculerSoutien, mesSoutiens } from "@/app/actions/idees";
import { cn } from "@/lib/cn";

type Contexte = {
  soutenues: Set<string>;
  totaux: Record<string, number>;
  basculer: (id: string) => Promise<string | undefined>;
};

const Soutiens = createContext<Contexte | null>(null);

/**
 * Fournit l'état « déjà soutenue » des idées affichées (un seul appel serveur),
 * et la bascule du soutien en un clic.
 */
export function FournisseurSoutiens({ ids, children }: { ids: string[]; children: ReactNode }) {
  const [soutenues, setSoutenues] = useState<Set<string>>(new Set());
  const [totaux, setTotaux] = useState<Record<string, number>>({});
  const cle = ids.join(",");

  useEffect(() => {
    let actif = true;
    mesSoutiens(cle ? cle.split(",") : []).then((s) => actif && setSoutenues(new Set(s)));
    return () => {
      actif = false;
    };
  }, [cle]);

  const basculer = async (id: string) => {
    const r = await basculerSoutien(id);
    if (!r.ok) return r.message ?? "Le soutien n'a pas été enregistré.";
    setSoutenues((s) => {
      const n = new Set(s);
      if (r.soutenu) n.add(id);
      else n.delete(id);
      return n;
    });
    if (typeof r.total === "number") setTotaux((t) => ({ ...t, [id]: r.total! }));
  };

  return <Soutiens value={{ soutenues, totaux, basculer }}>{children}</Soutiens>;
}

/** Pavé « soutenir » (planche DA) : flèche et nombre de soutiens, pressé une fois soutenue. */
export function BoutonSoutien({
  id,
  soutiens,
  titre,
  taille = "md",
}: {
  id: string;
  soutiens: number;
  titre: string;
  taille?: "sm" | "md" | "lg";
}) {
  const ctx = use(Soutiens);
  const [enCours, demarrer] = useTransition();
  const [erreur, setErreur] = useState<string>();
  const soutenue = ctx?.soutenues.has(id) ?? false;
  const total = ctx?.totaux[id] ?? soutiens;

  return (
    <span className="relative inline-flex shrink-0">
      <button
        type="button"
        disabled={!ctx || enCours}
        aria-pressed={soutenue}
        aria-label={`${soutenue ? "Retirer mon soutien à" : "Soutenir"} l'idée « ${titre} », ${total} soutien${total > 1 ? "s" : ""}`}
        onClick={() =>
          demarrer(async () => {
            setErreur(await ctx?.basculer(id));
          })
        }
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-[14px] border-[1.5px] leading-[1.05] transition-colors disabled:cursor-wait",
          soutenue ? "border-terre bg-terre text-white hover:bg-terre-fonce" : "border-bordure-douce bg-sable text-terre-fonce hover:border-terre",
          taille === "sm" && "h-[52px] w-[50px] rounded-xl",
          taille === "md" && "h-[58px] w-[58px]",
          taille === "lg" && "h-[72px] w-[66px] rounded-2xl",
        )}
      >
        <svg width="14" height="10" viewBox="0 0 14 10" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M1 9l6-7 6 7" />
        </svg>
        <strong className={taille === "lg" ? "text-xl" : taille === "sm" ? "text-base" : "text-[17px]"}>{total}</strong>
      </button>
      <span role="status" className={erreur ? "absolute left-0 top-full z-10 mt-1 w-56 rounded-lg bg-nuit px-2.5 py-1.5 text-[13px] text-white" : "sr-only"}>
        {erreur ?? ""}
      </span>
    </span>
  );
}

/** Nombre de soutiens tenu à jour après un clic (colonne de la page d'une idée). */
export function CompteSoutiens({ id, soutiens }: { id: string; soutiens: number }) {
  const total = use(Soutiens)?.totaux[id] ?? soutiens;
  return (
    <>
      <p className="mb-1 font-titre text-[34px] font-semibold leading-none text-terre-fonce">{total}</p>
      <p className="mb-3 font-bold">soutien{total > 1 ? "s" : ""}</p>
    </>
  );
}
