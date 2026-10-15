import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import type { AvancementIdee, ThemeIdee } from "@/lib/libelles";
import { publicClient } from "@/lib/supabase/public";

import { TAGS } from "./tags";

export async function getActions() {
  "use cache";
  cacheLife("contenu");
  cacheTag(TAGS.actions);

  const { data, error } = await publicClient()
    .from("actions")
    .select("id, slug, titre, periode, resume, image_path, image_alt, ton, lien_label, lien_href")
    .order("position");
  if (error) throw error;
  return data;
}

export async function getArticlesRecents(limite = 3) {
  "use cache";
  cacheLife("contenu");
  cacheTag(TAGS.articles);

  const { data, error } = await publicClient()
    .from("articles")
    .select("id, slug, titre, chapeau, cover_path, cover_alt, published_at, is_sample, categorie:categories(nom, ton)")
    .order("featured", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(limite);
  if (error) throw error;
  return data;
}

/**
 * Rendez-vous à venir, du plus proche au plus lointain ; les événements sans
 * date fixée (« 2027 · date à confirmer ») viennent en dernier.
 */
export async function getEvenementsAVenir(limite = 4) {
  "use cache";
  cacheLife("contenu");
  cacheTag(TAGS.evenements);

  const maintenant = new Date().toISOString();
  const { data, error } = await publicClient()
    .from("events")
    .select(
      "id, slug, titre, resume, starts_at, ends_at, all_day, date_label, lieu, cover_path, cover_alt, registration_enabled, ouvert_a_tous, is_sample",
    )
    .or(`starts_at.gte.${maintenant},starts_at.is.null`)
    .order("starts_at", { ascending: true, nullsFirst: false })
    .limit(limite);
  if (error) throw error;
  return data;
}

export type EvenementResume = Awaited<ReturnType<typeof getEvenementsAVenir>>[number];

export async function getFaqAccueil() {
  "use cache";
  cacheLife("contenu");
  cacheTag(TAGS.faq);

  const { data, error } = await publicClient()
    .from("faq_items")
    .select("id, question, answer_html")
    .eq("show_on_home", true)
    .order("home_position");
  if (error) throw error;
  return data;
}

/** Les colonnes de la vue ideas_public sont typées nullables par Supabase ; elles ne le sont pas. */
export type IdeeResume = {
  id: string;
  slug: string;
  titre: string;
  theme: ThemeIdee;
  progress: AvancementIdee;
  support_count: number;
  comment_count: number;
  is_sample: boolean;
};

export async function getIdeesPopulaires(limite = 3): Promise<IdeeResume[]> {
  "use cache";
  cacheLife("contenu");
  cacheTag(TAGS.idees);

  const { data, error } = await publicClient()
    .from("ideas_public")
    .select("id, slug, titre, theme, progress, support_count, comment_count, is_sample")
    .order("support_count", { ascending: false })
    .limit(limite);
  if (error) throw error;
  return data as IdeeResume[];
}

type Stats = { adherents: number | null; actions: number; rendez_vous: number; conseil: number };

export async function getStatistiques(): Promise<Stats> {
  "use cache";
  cacheLife("contenu");
  cacheTag(TAGS.actions, TAGS.evenements, TAGS.conseil);

  const { data, error } = await publicClient().rpc("public_stats");
  if (error) throw error;
  return data as unknown as Stats;
}
