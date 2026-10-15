import type { Database } from "@/lib/supabase/types";

type Enums = Database["public"]["Enums"];
export type Ton = Enums["ton"];
export type ThemeIdee = Enums["idea_theme"];
export type AvancementIdee = Enums["idea_progress"];
export type CategorieFaq = Enums["faq_category"];
export type CategorieGlossaire = Enums["glossary_category"];
export type ThemeVeille = Enums["veille_theme"];

export const THEMES_IDEES: Record<ThemeIdee, string> = {
  cadre_de_vie: "Cadre de vie",
  eau: "Eau",
  biodiversite: "Biodiversité",
  mobilite: "Mobilité",
  patrimoine: "Patrimoine",
  energie: "Énergie",
  vivre_ensemble: "Vivre ensemble",
};

/** Étiquettes de statut d'idée (planche DA, « Étiquettes et statuts »). */
export const AVANCEMENT_IDEES: Record<AvancementIdee, { libelle: string; classes: string }> = {
  proposee: { libelle: "Proposée", classes: "bg-tag-terre text-tag-terre-fg" },
  etudiee: { libelle: "Étudiée", classes: "bg-tag-olive text-tag-olive-fg" },
  en_projet: { libelle: "En projet", classes: "bg-tag-indigo text-tag-indigo-fg" },
  realisee: { libelle: "Réalisée", classes: "bg-olive text-white" },
};

export const CATEGORIES_FAQ: Record<CategorieFaq, string> = {
  association: "L'association",
  adherer: "Adhérer",
  cotisation: "Cotisation",
  evenements: "Événements",
  participer: "Participer",
  donnees: "Données personnelles",
};

/** Couleur du texte de catégorie sur fond blanc. */
export const TON_TEXTE: Record<Ton, string> = {
  terre: "text-terre-fonce",
  olive: "text-olive",
  indigo: "text-indigo",
  abricot: "text-terre-fonce",
};

/** Pastilles sur fond brun (actions en cours). */
export const TON_PASTILLE_SOMBRE: Record<Ton, string> = {
  abricot: "bg-abricot text-brun",
  olive: "bg-olive-clair text-tag-olive-fg",
  indigo: "bg-indigo-clair text-tag-indigo-fg",
  terre: "bg-tag-terre text-tag-terre-fg",
};

export const CATEGORIES_GLOSSAIRE: Record<CategorieGlossaire, string> = {
  democratie: "Démocratie",
  environnement: "Environnement",
  agriculture: "Agriculture",
  association: "Association",
};

/** Thèmes de la veille et teintes d'étiquettes (maquette Veille). */
export const THEMES_VEILLE: Record<ThemeVeille, { libelle: string; classes: string }> = {
  environnement: { libelle: "Environnement", classes: "bg-tag-olive text-tag-olive-fg" },
  urbanisme: { libelle: "Urbanisme", classes: "bg-tag-terre text-tag-terre-fg" },
  eau: { libelle: "Eau", classes: "bg-tag-indigo text-tag-indigo-fg" },
  energie: { libelle: "Énergie", classes: "bg-tag-ambre text-tag-ambre-fg" },
  democratie_locale: { libelle: "Démocratie locale", classes: "bg-tag-neutre text-tag-neutre-fg" },
};

/** Pastilles sur fond clair (catégorie d'un article). */
export const TON_PASTILLE_CLAIRE: Record<Ton, string> = {
  terre: "bg-tag-terre text-tag-terre-fg",
  olive: "bg-tag-olive text-tag-olive-fg",
  indigo: "bg-tag-indigo text-tag-indigo-fg",
  abricot: "bg-tag-ambre text-tag-ambre-fg",
};
