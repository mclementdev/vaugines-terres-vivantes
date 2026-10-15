import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { publicClient } from "@/lib/supabase/public";

import { TAGS } from "./tags";

export type Chiffre = { valeur: number | null; visible: boolean };

export type Reglages = {
  nom: string;
  statut_juridique: string;
  date_creation: string;
  adresse: { lieu: string; rue: string; code_postal: string; commune: string };
  email: string;
  virement: { titulaire: string; iban: string; bic: string };
  paiement_en_ligne: boolean;
  reseaux: { facebook: string | null; instagram: string | null };
  chiffres: Record<"adherents" | "actions" | "rendez_vous" | "conseil", Chiffre>;
  signature_email: string;
};

export async function getReglages(): Promise<Reglages> {
  "use cache";
  cacheLife("contenu");
  cacheTag(TAGS.reglages);

  const { data, error } = await publicClient()
    .from("site_settings")
    .select("data")
    .eq("id", 1)
    .single();
  if (error) throw error;
  return data.data as unknown as Reglages;
}

/** Textes de l'accueil, indexés par clé (hero, association, nom…). */
export async function getBlocsAccueil() {
  "use cache";
  cacheLife("contenu");
  cacheTag(TAGS.accueil);

  const { data, error } = await publicClient().from("home_blocks").select("key, content");
  if (error) throw error;
  return Object.fromEntries(data.map((b) => [b.key, b.content])) as unknown as BlocsAccueil;
}

export async function getConseil() {
  "use cache";
  cacheLife("contenu");
  cacheTag(TAGS.conseil);

  const { data, error } = await publicClient()
    .from("council_members")
    .select("id, prenom, nom, role, photo_path")
    .order("position");
  if (error) throw error;
  return data;
}

export type BlocsAccueil = {
  hero: { surtitre: string; titre: string; titre_accent: string; texte: string; note: string };
  association: {
    surtitre: string;
    titre: string;
    paragraphes: string[];
    piliers: { numero: string; titre: string; texte: string; image: string; alt: string }[];
  };
  nom: { surtitre: string; terres: string[]; vivantes: string[] };
  gouvernance: {
    surtitre: string;
    titre: string;
    texte: string;
    commissions: string;
    titre_conseil: string;
    note_portraits: string;
  };
  idees: { surtitre: string; titre: string; texte: string };
  appel: { titre: string; titre_suite: string; texte: string; bouton: string };
  lettre: { titre: string; texte: string; mention: string };
};
