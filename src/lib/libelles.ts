import type { Database } from "@/lib/supabase/types";

type Enums = Database["public"]["Enums"];
export type Ton = Enums["ton"];
export type ThemeIdee = Enums["idea_theme"];
export type AvancementIdee = Enums["idea_progress"];
export type CategorieFaq = Enums["faq_category"];

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
