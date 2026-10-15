"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { BoutonSoutien, FournisseurSoutiens } from "@/components/site/BoutonSoutien";
import type { IdeePublique } from "@/lib/data/idees";
import { AVANCEMENT_IDEES, THEMES_IDEES, type AvancementIdee, type ThemeIdee } from "@/lib/libelles";
import { cn } from "@/lib/cn";

type Tri = "soutiens" | "recentes" | "commentees";
const TRIS: Record<Tri, string> = { soutiens: "Les plus soutenues", recentes: "Les plus récentes", commentees: "Les plus commentées" };

const classeSelect = "h-[46px] cursor-pointer rounded-xl border-[1.5px] border-bordure-champ bg-white px-3.5 text-base font-normal";

/** Liste filtrable des idées publiées. Les dates relatives sont calculées côté serveur (`depuis`). */
export function ListeIdees({ idees, depuis }: { idees: IdeePublique[]; depuis: Record<string, string> }) {
  const [theme, setTheme] = useState<ThemeIdee | "">("");
  const [statut, setStatut] = useState<AvancementIdee | "">("");
  const [tri, setTri] = useState<Tri>("soutiens");

  const visibles = useMemo(() => {
    const l = idees.filter((i) => (!theme || i.theme === theme) && (!statut || i.progress === statut));
    const cmp: Record<Tri, (a: IdeePublique, b: IdeePublique) => number> = {
      soutiens: (a, b) => b.support_count - a.support_count,
      recentes: (a, b) => b.published_at.localeCompare(a.published_at),
      commentees: (a, b) => b.comment_count - a.comment_count,
    };
    return [...l].sort(cmp[tri]);
  }, [idees, theme, statut, tri]);

  const themesPresents = (Object.keys(THEMES_IDEES) as ThemeIdee[]).filter((t) => idees.some((i) => i.theme === t));

  return (
    <FournisseurSoutiens ids={idees.map((i) => i.id)}>
      {/* Mobile : thèmes en pastilles */}
      <div role="group" aria-label="Filtrer par thème" className="-mx-5 mb-3 flex gap-2 overflow-x-auto px-5 pb-1 md:hidden">
        {[["", "Toutes"] as const, ...themesPresents.map((t) => [t, THEMES_IDEES[t]] as const)].map(([cle, libelle]) => (
          <button
            key={cle || "toutes"}
            type="button"
            aria-pressed={theme === cle}
            onClick={() => setTheme(cle)}
            className={cn(
              "shrink-0 cursor-pointer rounded-full border-[1.5px] px-3.5 py-2 text-[15px] font-bold",
              theme === cle ? "border-brun bg-brun text-white" : "border-bordure-douce bg-white text-encre",
            )}
          >
            {libelle}
          </button>
        ))}
      </div>

      <div className="mb-5 flex flex-wrap items-end gap-3">
        <label className="hidden flex-col gap-1 text-sm font-bold md:flex">
          Thème
          <select value={theme} onChange={(e) => setTheme(e.target.value as ThemeIdee | "")} className={classeSelect}>
            <option value="">Tous les thèmes</option>
            {(Object.keys(THEMES_IDEES) as ThemeIdee[]).map((t) => (
              <option key={t} value={t}>
                {THEMES_IDEES[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-bold">
          Statut
          <select value={statut} onChange={(e) => setStatut(e.target.value as AvancementIdee | "")} className={classeSelect}>
            <option value="">Tous</option>
            {(Object.keys(AVANCEMENT_IDEES) as AvancementIdee[]).map((s) => (
              <option key={s} value={s}>
                {AVANCEMENT_IDEES[s].libelle}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-bold">
          Trier par
          <select value={tri} onChange={(e) => setTri(e.target.value as Tri)} className={classeSelect}>
            {(Object.keys(TRIS) as Tri[]).map((t) => (
              <option key={t} value={t}>
                {TRIS[t]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p role="status" className="sr-only">
        {visibles.length} idée{visibles.length > 1 ? "s" : ""} affichée{visibles.length > 1 ? "s" : ""}
      </p>

      {visibles.length === 0 ? (
        <p className="rounded-[22px] bg-white p-8 text-center text-encre-2">
          {idees.length === 0 ? "Aucune idée publiée pour l'instant : proposez la première !" : "Aucune idée ne correspond à ces filtres."}
        </p>
      ) : (
        <ul className="flex flex-col gap-3.5">
          {visibles.map((i) => {
            const s = AVANCEMENT_IDEES[i.progress];
            return (
              <li key={i.id} className="flex items-start gap-4 rounded-[22px] bg-white p-4 md:gap-5 md:px-6 md:py-[22px]">
                <BoutonSoutien id={i.id} soutiens={i.support_count} titre={i.titre} taille="lg" />
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex flex-wrap gap-2">
                    <span className={cn("rounded-full px-2.5 py-0.5 text-[13px] font-bold", s.classes)}>{s.libelle}</span>
                    <span className="rounded-full bg-sable px-2.5 py-0.5 text-[13px] font-bold text-encre-2">{THEMES_IDEES[i.theme]}</span>
                  </div>
                  <h2 className="mb-1 font-titre text-xl font-semibold leading-snug md:text-[22px]">
                    <Link href={`/idees/${i.slug}`} className="text-encre no-underline hover:text-terre-fonce hover:underline">
                      {i.titre}
                    </Link>
                  </h2>
                  <p className="mb-1.5 line-clamp-2 text-encre-2">{i.description}</p>
                  <p className="text-sm text-encre-3">
                    {i.display_name ? `Proposée par ${i.display_name}` : "Anonyme"} · {depuis[i.id]} ·{" "}
                    <Link href={`/idees/${i.slug}#commentaires`}>
                      {i.comment_count} commentaire{i.comment_count > 1 ? "s" : ""}
                    </Link>
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {idees.some((i) => i.is_sample) && <p className="mt-4 text-sm text-encre-3">Idées données à titre d&apos;exemple (fictives).</p>}
    </FournisseurSoutiens>
  );
}
