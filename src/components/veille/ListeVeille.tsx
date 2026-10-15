"use client";

import { useMemo, useState } from "react";

import { Bouton } from "@/components/ui/Bouton";
import { Etiquette } from "@/components/ui/Etiquette";
import { ChampRecherche, Filtres, normaliser } from "@/components/ui/Filtres";
import type { FicheVeille } from "@/lib/data/pages";
import { THEMES_VEILLE, type ThemeVeille } from "@/lib/libelles";

const PAR_PAGE = 6;
const formatDate = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" });

export function ListeVeille({ fiches }: { fiches: FicheVeille[] }) {
  const [theme, setTheme] = useState<"tous" | ThemeVeille>("tous");
  const [recherche, setRecherche] = useState("");
  const [nombre, setNombre] = useState(PAR_PAGE);

  const filtrees = useMemo(() => {
    const q = normaliser(recherche.trim());
    return fiches.filter(
      (f) =>
        (theme === "tous" || f.theme === theme) &&
        (!q || normaliser(`${f.titre} ${f.resume} ${f.source_label}`).includes(q)),
    );
  }, [fiches, theme, recherche]);

  const affichees = filtrees.slice(0, nombre);
  const fictives = fiches.some((f) => f.is_sample);

  return (
    <section aria-labelledby="titre-fiches">
      <h2 id="titre-fiches" className="sr-only">
        Fiches de veille
      </h2>
      <div className="mb-[22px] flex flex-wrap items-center justify-between gap-3.5">
        <Filtres
          libelle="Filtrer par thème"
          valeur={theme}
          onChange={(t) => {
            setTheme(t);
            setNombre(PAR_PAGE);
          }}
          options={[
            { valeur: "tous", libelle: "Tous" },
            ...(Object.keys(THEMES_VEILLE) as ThemeVeille[]).map((t) => ({ valeur: t, libelle: THEMES_VEILLE[t].libelle })),
          ]}
        />
        <ChampRecherche
          libelle="Rechercher dans la veille"
          placeholder="Rechercher"
          valeur={recherche}
          onChange={(v) => {
            setRecherche(v);
            setNombre(PAR_PAGE);
          }}
          className="h-11 w-full rounded-full border-bordure-douce sm:w-[240px]"
        />
      </div>

      <p role="status" className="mb-4 text-sm text-encre-3">
        {filtrees.length} fiche{filtrees.length > 1 ? "s" : ""}
        {fictives && " · exemples fictifs à remplacer"}
      </p>

      {filtrees.length === 0 ? (
        <p className="rounded-[22px] bg-white p-8 text-center text-encre-2">
          Aucune fiche ne correspond. Essayez un autre thème ou un autre mot.
        </p>
      ) : (
        <ul className="grid gap-[18px] [grid-template-columns:repeat(auto-fill,minmax(min(100%,320px),1fr))]">
          {affichees.map((f) => {
            const t = THEMES_VEILLE[f.theme];
            const date = f.date_info ?? f.published_at;
            return (
              <li key={f.id}>
                <article className="flex h-full flex-col gap-2.5 rounded-[22px] bg-white px-[26px] py-6">
                  <div className="flex items-center justify-between gap-2.5">
                    <Etiquette className={t.classes}>{t.libelle}</Etiquette>
                    {date && (
                      <time dateTime={date} className="text-sm text-encre-3">
                        {formatDate.format(new Date(date))}
                      </time>
                    )}
                  </div>
                  <h3 className="font-titre text-[21px] font-semibold leading-tight">{f.titre}</h3>
                  <p className="text-base text-encre-2">{f.resume}</p>
                  <p className="mt-auto border-t border-[#EFE3D2] pt-2.5 text-sm text-encre-3">
                    Source :{" "}
                    {f.source_url ? (
                      <a href={f.source_url} target="_blank" rel="noopener noreferrer">
                        {f.source_label}
                        <span className="sr-only"> (nouvelle fenêtre)</span>
                      </a>
                    ) : (
                      f.source_label
                    )}
                  </p>
                </article>
              </li>
            );
          })}
        </ul>
      )}

      {filtrees.length > nombre && (
        <div className="mt-8 flex justify-center">
          <Bouton variante="secondaire" onClick={() => setNombre((n) => n + PAR_PAGE)}>
            Voir plus de fiches ({filtrees.length - nombre})
          </Bouton>
        </div>
      )}
    </section>
  );
}
