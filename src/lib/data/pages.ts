import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { publicClient } from "@/lib/supabase/public";

import { TAGS } from "./tags";

// ---------------------------------------------------------------------------
// Statuts, glossaire, FAQ
// ---------------------------------------------------------------------------

export async function getStatuts() {
  "use cache";
  cacheLife("contenu");
  cacheTag(TAGS.statuts);

  const { data, error } = await publicClient()
    .from("statuts_articles")
    .select("numero, titre, body_html")
    .order("numero");
  if (error) throw error;
  return data;
}

export async function getGlossaire() {
  "use cache";
  cacheLife("contenu");
  cacheTag(TAGS.glossaire);

  const { data, error } = await publicClient()
    .from("glossary_terms")
    .select("id, slug, terme, categorie, definition, voir_aussi, to_validate")
    .order("terme");
  if (error) throw error;
  // Tri alphabétique français (accents, majuscules).
  return data.sort((a, b) => a.terme.localeCompare(b.terme, "fr", { sensitivity: "base" }));
}

export type TermeGlossaire = Awaited<ReturnType<typeof getGlossaire>>[number];

export async function getFaq() {
  "use cache";
  cacheLife("contenu");
  cacheTag(TAGS.faq);

  const { data, error } = await publicClient()
    .from("faq_items")
    .select("id, category, question, answer_html, to_validate")
    .order("position");
  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------------------
// Veille
// ---------------------------------------------------------------------------

export async function getVeille() {
  "use cache";
  cacheLife("contenu");
  cacheTag(TAGS.veille, TAGS.articles);

  const client = publicClient();
  const [dossiers, fiches] = await Promise.all([
    client
      .from("veille_dossiers")
      .select("id, slug, titre, intro, image_path, image_alt, updated_at, is_sample, article:articles(slug)")
      .eq("featured", true)
      .order("published_at", { ascending: false })
      .limit(1),
    client
      .from("veille_items")
      .select("id, theme, titre, resume, source_label, source_url, date_info, published_at, dossier_id, is_sample")
      .order("date_info", { ascending: false, nullsFirst: false })
      .order("published_at", { ascending: false }),
  ]);
  if (dossiers.error) throw dossiers.error;
  if (fiches.error) throw fiches.error;

  const dossier = dossiers.data[0] ?? null;
  const nbFichesDossier = dossier ? fiches.data.filter((f) => f.dossier_id === dossier.id).length : 0;
  return { dossier, nbFichesDossier, fiches: fiches.data };
}

export type FicheVeille = Awaited<ReturnType<typeof getVeille>>["fiches"][number];

// ---------------------------------------------------------------------------
// Actualités
// ---------------------------------------------------------------------------

const CHAMPS_CARTE_ARTICLE =
  "id, slug, titre, chapeau, cover_path, cover_alt, published_at, is_sample, categorie:categories(slug, nom, ton)";

export async function getArticles() {
  "use cache";
  cacheLife("contenu");
  cacheTag(TAGS.articles);

  const { data, error } = await publicClient()
    .from("articles")
    .select(CHAMPS_CARTE_ARTICLE)
    .order("published_at", { ascending: false });
  if (error) throw error;
  return data;
}

export type CarteArticle = Awaited<ReturnType<typeof getArticles>>[number];

export async function getArticle(slug: string) {
  "use cache";
  cacheLife("contenu");
  cacheTag(TAGS.articles, `article:${slug}`);

  const { data, error } = await publicClient()
    .from("articles")
    .select(
      "id, slug, titre, chapeau, cover_path, cover_alt, cover_caption, body_html, tags, published_at, updated_at, author_label, is_sample, categorie:categories(slug, nom, ton)",
    )
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getSlugsArticles() {
  "use cache";
  cacheLife("contenu");
  cacheTag(TAGS.articles);

  const { data, error } = await publicClient().from("articles").select("slug");
  if (error) throw error;
  return data.map((a) => a.slug);
}

// ---------------------------------------------------------------------------
// Agenda
// ---------------------------------------------------------------------------

const CHAMPS_EVENEMENT =
  "id, slug, titre, resume, body_html, starts_at, ends_at, all_day, date_label, lieu, adresse, latitude, longitude, prix, capacity, programme, accessibilite, infos_pratiques, ouvert_a_tous, registration_enabled, cover_path, cover_alt, published_at, updated_at, is_sample";

export async function getAgenda() {
  "use cache";
  cacheLife("contenu");
  cacheTag(TAGS.evenements);

  const maintenant = new Date().toISOString();
  const client = publicClient();
  const [aVenir, passes] = await Promise.all([
    client
      .from("events")
      .select(CHAMPS_EVENEMENT)
      .or(`starts_at.gte.${maintenant},starts_at.is.null`)
      .order("starts_at", { ascending: true, nullsFirst: false }),
    client
      .from("events")
      .select(CHAMPS_EVENEMENT)
      .lt("starts_at", maintenant)
      .order("starts_at", { ascending: false })
      .limit(12),
  ]);
  if (aVenir.error) throw aVenir.error;
  if (passes.error) throw passes.error;
  return { aVenir: aVenir.data, passes: passes.data };
}

export type Evenement = Awaited<ReturnType<typeof getAgenda>>["aVenir"][number];
export type EtapeProgramme = { heure: string; texte: string };

export async function getEvenement(slug: string) {
  "use cache";
  cacheLife("contenu");
  cacheTag(TAGS.evenements, `evenement:${slug}`);

  const { data, error } = await publicClient().from("events").select(CHAMPS_EVENEMENT).eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getSlugsEvenements() {
  "use cache";
  cacheLife("contenu");
  cacheTag(TAGS.evenements);

  const { data, error } = await publicClient().from("events").select("slug");
  if (error) throw error;
  return data.map((e) => e.slug);
}

// ---------------------------------------------------------------------------
// Commissions
// ---------------------------------------------------------------------------

export async function getCommissions() {
  "use cache";
  cacheLife("contenu");
  cacheTag(TAGS.commissions);

  const { data, error } = await publicClient()
    .from("commissions")
    .select("id, slug, nom, description")
    .order("position");
  if (error) throw error;
  return data;
}
