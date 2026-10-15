"use client";

import { useMemo, useState } from "react";

import { ChampRecherche, Filtres, normaliser } from "@/components/ui/Filtres";
import type { TermeGlossaire } from "@/lib/data/pages";
import { CATEGORIES_GLOSSAIRE, type CategorieGlossaire } from "@/lib/libelles";

type Filtre = "tout" | CategorieGlossaire;
const LETTRES = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const initiale = (t: string) => normaliser(t).charAt(0).toUpperCase();

export function Glossaire({ termes }: { termes: TermeGlossaire[] }) {
  const [categorie, setCategorie] = useState<Filtre>("tout");
  const [recherche, setRecherche] = useState("");

  const parSlug = useMemo(() => new Map(termes.map((t) => [t.slug, t])), [termes]);

  const visibles = useMemo(() => {
    const q = normaliser(recherche.trim());
    return termes.filter(
      (t) =>
        (categorie === "tout" || t.categorie === categorie) &&
        (!q || normaliser(`${t.terme} ${t.definition}`).includes(q)),
    );
  }, [termes, categorie, recherche]);

  // Première occurrence de chaque lettre, cible de l'index A–Z.
  const premiers = new Map<string, string>();
  visibles.forEach((t) => {
    const l = initiale(t.terme);
    if (!premiers.has(l)) premiers.set(l, t.slug);
  });

  const reinitialiser = () => {
    setCategorie("tout");
    setRecherche("");
  };

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 rounded-3xl bg-white p-5">
        <ChampRecherche
          libelle="Rechercher un terme"
          placeholder="Rechercher un terme (ex. consensus, PLU…)"
          valeur={recherche}
          onChange={setRecherche}
        />
        <Filtres
          libelle="Catégories"
          valeur={categorie}
          onChange={setCategorie}
          options={[
            { valeur: "tout", libelle: "Tout" },
            ...(Object.keys(CATEGORIES_GLOSSAIRE) as CategorieGlossaire[]).map((c) => ({ valeur: c, libelle: CATEGORIES_GLOSSAIRE[c] })),
          ]}
        />
        <nav aria-label="Index alphabétique">
          <ul className="flex flex-wrap gap-1">
            {LETTRES.map((l) => {
              const cible = premiers.get(l);
              return (
                <li key={l}>
                  {cible ? (
                    <a
                      href={`#${cible}`}
                      className="flex size-9 items-center justify-center rounded-[10px] bg-tag-terre font-bold text-tag-terre-fg no-underline hover:bg-terre hover:text-white"
                    >
                      {l}
                    </a>
                  ) : (
                    <span aria-hidden="true" className="flex size-9 items-center justify-center font-semibold text-[#BFA98D]">
                      {l}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <p role="status" className="sr-only">
        {visibles.length} terme{visibles.length > 1 ? "s" : ""} affiché{visibles.length > 1 ? "s" : ""}
      </p>

      {visibles.length === 0 ? (
        <div className="rounded-[22px] bg-white p-8 text-center">
          <p className="font-bold">Aucun terme ne correspond à « {recherche} ».</p>
          <p className="mt-1 text-encre-2">
            Un mot manque ?{" "}
            <a href="mailto:vauginesterresvivantes@gmail.com?subject=Glossaire%20%3A%20un%20terme%20%C3%A0%20ajouter">Suggérez-le-nous</a>.
          </p>
          <button type="button" onClick={reinitialiser} className="mt-4 cursor-pointer font-bold text-terre-fonce underline">
            Voir tous les termes
          </button>
        </div>
      ) : (
        <ul className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,340px),1fr))]">
          {visibles.map((t) => {
            const liens = t.voir_aussi.map((s) => parSlug.get(s)).filter((x) => x !== undefined);
            return (
              <li
                key={t.id}
                id={t.slug}
                className="flex scroll-mt-28 flex-col gap-2 rounded-[22px] bg-white px-[26px] py-6 target:outline-3 target:outline-terre"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="font-titre text-[23px] font-semibold leading-tight">{t.terme}</h2>
                  <span className="shrink-0 text-[13px] font-bold text-encre-3">{CATEGORIES_GLOSSAIRE[t.categorie]}</span>
                </div>
                <p className="text-base text-encre-2">{t.definition}</p>
                {liens.length > 0 && (
                  <p className="mt-auto pt-2 text-sm text-encre-3">
                    Voir aussi :{" "}
                    {liens.map((l, i) => (
                      <span key={l.slug}>
                        {i > 0 && ", "}
                        <a
                          href={`#${l.slug}`}
                          onClick={() => {
                            // Le terme lié peut être masqué par un filtre : on les retire.
                            if (!visibles.some((v) => v.slug === l.slug)) reinitialiser();
                          }}
                        >
                          {l.terme}
                        </a>
                      </span>
                    ))}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
