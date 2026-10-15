"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { exigerAdmin } from "@/lib/auth";
import { TAGS } from "@/lib/data/tags";
import { nettoyerHtml } from "@/lib/admin/html";
import { erreursZod, slugifier, type EtatForm } from "@/lib/admin/outils";
import { calculerPublication, schemaPublication } from "@/lib/admin/publication";
import { rafraichir } from "@/lib/admin/revalider";
import { clientSession } from "@/lib/supabase/serveur";
import type { Database, Json } from "@/lib/supabase/types";

type MajArticle = Database["public"]["Tables"]["articles"]["Update"];

/** Crée un brouillon vide et ouvre l'éditeur. */
export async function creerArticle() {
  const admin = await exigerAdmin();
  const supabase = await clientSession();
  const { data, error } = await supabase
    .from("articles")
    .insert({ titre: "", slug: `brouillon-${crypto.randomUUID().slice(0, 8)}`, author_id: admin.id })
    .select("id")
    .single();
  if (error) throw new Error("Impossible de créer l'article.");
  redirect(`/admin/articles/${data.id}`);
}

const schemaArticle = z.object({
  titre: z.string().trim().max(160, { error: "160 caractères maximum." }),
  chapeau: z.string().trim().max(400, { error: "400 caractères maximum." }),
  corpsJson: z.unknown(),
  corpsHtml: z.string().max(200_000),
  coverPath: z.string().max(300).nullable(),
  coverAlt: z.string().trim().max(200),
  coverCaption: z.string().trim().max(200),
  categoryId: z.uuid().nullable(),
  tags: z.string().max(300),
  slug: z.string().trim().max(80),
  featured: z.boolean(),
  newsletter: z.boolean(),
  publication: schemaPublication,
});
export type DonneesArticle = z.infer<typeof schemaArticle>;

/**
 * Enregistre un article. `auto` = enregistrement automatique : on garde le
 * statut de publication actuel et on n'exige pas les champs obligatoires.
 */
export async function enregistrerArticle(id: string, donnees: DonneesArticle, auto = false): Promise<EtatForm> {
  await exigerAdmin();
  const res = schemaArticle.safeParse(donnees);
  if (!res.success) return { statut: "erreur", message: "Merci de vérifier les champs signalés.", erreurs: erreursZod(res.error) };
  const d = res.data;
  const supabase = await clientSession();

  const { data: actuel } = await supabase.from("articles").select("status, published_at, slug").eq("id", id).single();
  if (!actuel) return { statut: "erreur", message: "Article introuvable." };
  // Garde-fou : l'enregistrement automatique ne touche jamais un article publié ou programmé.
  if (auto && actuel.status === "published") return { statut: "erreur", message: "Enregistrement automatique désactivé pour un article publié." };

  const maj: MajArticle = {
    titre: d.titre,
    chapeau: d.chapeau,
    body_json: (d.corpsJson ?? null) as Json,
    body_html: nettoyerHtml(d.corpsHtml),
    cover_path: d.coverPath,
    cover_alt: d.coverAlt || null,
    cover_caption: d.coverCaption || null,
    category_id: d.categoryId,
    tags: d.tags.split(",").map((t) => t.trim().replace(/^#/, "")).filter(Boolean).slice(0, 12),
    featured: d.featured,
    newsletter_candidate: d.newsletter,
  };

  const erreurs: Record<string, string> = {};
  if (d.coverPath && !d.coverAlt) erreurs.coverAlt = "Le texte alternatif de l'image est obligatoire.";

  if (!auto) {
    const slug = slugifier(d.slug || d.titre);
    if (!d.titre) erreurs.titre = "Donnez un titre à l'article.";
    if (!slug) erreurs.slug = "Indiquez l'adresse de l'article.";
    else maj.slug = slug;
    const pub = calculerPublication(d.publication, actuel);
    if ("erreur" in pub) erreurs.publication = pub.erreur;
    else Object.assign(maj, pub);
  }
  if (Object.keys(erreurs).length > 0) {
    if (auto) delete maj.cover_alt; // pas de blocage pendant la saisie
    else return { statut: "erreur", message: "Merci de vérifier les champs signalés.", erreurs };
  }

  const { error } = await supabase.from("articles").update(maj).eq("id", id);
  if (error) {
    if (error.code === "23505") return { statut: "erreur", message: "Cette adresse est déjà utilisée par un autre article.", erreurs: { slug: "Adresse déjà utilisée." } };
    if (error.code === "23514") return { statut: "erreur", message: "Le texte alternatif de l'image est obligatoire.", erreurs: { coverAlt: "Obligatoire." } };
    return { statut: "erreur", message: "L'enregistrement a échoué. Réessayez." };
  }

  if (!auto) {
    rafraichir(TAGS.articles, TAGS.accueil, `article:${actuel.slug}`, `article:${String(maj.slug ?? actuel.slug)}`);
  }
  const libelle =
    auto
      ? undefined
      : maj.status === "draft"
        ? "Brouillon enregistré."
        : new Date(String(maj.published_at)) > new Date()
          ? "Publication programmée."
          : actuel.status === "published" && actuel.published_at === maj.published_at
            ? "Modifications enregistrées et en ligne."
            : "Article publié.";
  return { statut: "ok", message: libelle, enregistreLe: new Date().toISOString() };
}

export async function mettreArticleCorbeille(id: string) {
  await exigerAdmin();
  const supabase = await clientSession();
  const { data } = await supabase.from("articles").update({ status: "trashed" }).eq("id", id).select("slug").single();
  rafraichir(TAGS.articles, TAGS.accueil, `article:${data?.slug ?? ""}`);
  redirect("/admin/articles?corbeille=1");
}

export async function restaurerArticle(id: string) {
  await exigerAdmin();
  const supabase = await clientSession();
  await supabase.from("articles").update({ status: "draft", published_at: null }).eq("id", id);
  redirect(`/admin/articles/${id}`);
}

/** Suppression définitive, depuis la corbeille. */
export async function supprimerArticle(id: string) {
  const admin = await exigerAdmin();
  const supabase = await clientSession();
  const { data } = await supabase.from("articles").delete().eq("id", id).eq("status", "trashed").select("titre").maybeSingle();
  if (data) await supabase.from("audit_log").insert({ actor_id: admin.id, action: "suppression_article", cible: data.titre });
  redirect("/admin/articles?vue=corbeille");
}
