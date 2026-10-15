import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import type { AvancementIdee, ThemeIdee } from "@/lib/libelles";
import { publicClient } from "@/lib/supabase/public";

import { TAGS } from "./tags";

/** Idée publiée (vue ideas_public : jamais l'e-mail de l'auteur). */
export type IdeePublique = {
  id: string;
  slug: string;
  titre: string;
  description: string;
  theme: ThemeIdee;
  photo_path: string | null;
  display_name: string | null;
  progress: AvancementIdee;
  support_count: number;
  comment_count: number;
  published_at: string;
  is_sample: boolean;
};

const CHAMPS = "id, slug, titre, description, theme, photo_path, display_name, progress, support_count, comment_count, published_at, is_sample";

/** Toutes les idées publiées (quelques dizaines au plus) : filtres et tri côté navigateur. */
export async function getIdees(): Promise<IdeePublique[]> {
  "use cache";
  cacheLife("contenu");
  cacheTag(TAGS.idees);

  const { data, error } = await publicClient().from("ideas_public").select(CHAMPS).order("support_count", { ascending: false });
  if (error) throw error;
  return data as IdeePublique[];
}

export async function getIdee(slug: string) {
  "use cache";
  cacheLife("contenu");
  cacheTag(TAGS.idees, `idee:${slug}`);

  const { data, error } = await publicClient().from("ideas_public").select(CHAMPS).eq("slug", slug).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const { data: commentaires } = await publicClient()
    .from("idea_comments_public")
    .select("id, display_name, body, published_at")
    .eq("idea_id", data.id!)
    .order("published_at");
  return { ...(data as IdeePublique), commentaires: (commentaires ?? []) as { id: string; display_name: string | null; body: string; published_at: string }[] };
}

export async function getSlugsIdees() {
  "use cache";
  cacheLife("contenu");
  cacheTag(TAGS.idees);

  const { data, error } = await publicClient().from("ideas_public").select("slug");
  if (error) throw error;
  return data.map((i) => i.slug!);
}
