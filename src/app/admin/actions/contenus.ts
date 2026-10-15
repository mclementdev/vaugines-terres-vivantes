"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { nettoyerHtml } from "@/lib/admin/html";
import { erreursZod, slugifier, type EtatForm } from "@/lib/admin/outils";
import { rafraichir } from "@/lib/admin/revalider";
import { exigerAdmin } from "@/lib/auth";
import { TAGS } from "@/lib/data/tags";
import { clientSession } from "@/lib/supabase/serveur";

const OK = (message = "Enregistré.") => ({ statut: "ok" as const, message, enregistreLe: new Date().toISOString() });
const KO = (e: z.ZodError): EtatForm => ({ statut: "erreur", message: "Merci de vérifier les champs signalés.", erreurs: erreursZod(e) });
const ECHEC: EtatForm = { statut: "erreur", message: "L'enregistrement a échoué. Réessayez." };
const statutPublie = (publie: boolean): { status: "published" | "draft"; published_at: string | null } =>
  publie ? { status: "published", published_at: new Date().toISOString() } : { status: "draft", published_at: null };

// ---------------------------------------------------------------------------
// FAQ
// ---------------------------------------------------------------------------
const schemaFaq = z.object({
  categorie: z.enum(["association", "adherer", "cotisation", "evenements", "participer", "donnees"]),
  question: z.string().trim().min(5, { error: "Formulez la question." }).max(200),
  reponseHtml: z.string().max(20_000),
  position: z.coerce.number().int().min(0).max(999),
  accueil: z.boolean(),
  aValider: z.boolean(),
  publie: z.boolean(),
});
export type DonneesFaq = z.input<typeof schemaFaq>;

export async function enregistrerFaq(id: string | null, donnees: DonneesFaq): Promise<EtatForm> {
  await exigerAdmin();
  const r = schemaFaq.safeParse(donnees);
  if (!r.success) return KO(r.error);
  const d = r.data;
  const reponse = nettoyerHtml(d.reponseHtml);
  if (!reponse.replace(/<[^>]+>/g, "").trim()) return { statut: "erreur", message: "La réponse est vide.", erreurs: { reponse: "Rédigez la réponse." } };
  const ligne = {
    category: d.categorie,
    question: d.question,
    answer_html: reponse,
    position: d.position,
    show_on_home: d.accueil,
    home_position: d.accueil ? d.position : null,
    to_validate: d.aValider,
    ...statutPublie(d.publie),
  };
  const supabase = await clientSession();
  const { data, error } = id
    ? await supabase.from("faq_items").update(ligne).eq("id", id).select("id").single()
    : await supabase.from("faq_items").insert(ligne).select("id").single();
  if (error) return ECHEC;
  rafraichir(TAGS.faq);
  if (!id) redirect(`/admin/faq/${data.id}?cree=1`);
  return OK();
}

export async function supprimerFaq(id: string) {
  await exigerAdmin();
  const supabase = await clientSession();
  await supabase.from("faq_items").delete().eq("id", id);
  rafraichir(TAGS.faq);
  redirect("/admin/faq?supprime=1");
}

// ---------------------------------------------------------------------------
// Glossaire
// ---------------------------------------------------------------------------
const schemaTerme = z.object({
  terme: z.string().trim().min(2, { error: "Indiquez le terme." }).max(80),
  categorie: z.enum(["democratie", "environnement", "agriculture", "association"]),
  definition: z.string().trim().min(10, { error: "Rédigez une définition (10 caractères minimum)." }).max(1200),
  voirAussi: z.array(z.string()).max(6),
  aValider: z.boolean(),
  publie: z.boolean(),
});
export type DonneesTerme = z.input<typeof schemaTerme>;

export async function enregistrerTerme(id: string | null, donnees: DonneesTerme): Promise<EtatForm> {
  await exigerAdmin();
  const r = schemaTerme.safeParse(donnees);
  if (!r.success) return KO(r.error);
  const d = r.data;
  const ligne = {
    terme: d.terme,
    categorie: d.categorie,
    definition: d.definition,
    voir_aussi: d.voirAussi,
    to_validate: d.aValider,
    ...statutPublie(d.publie),
  };
  const supabase = await clientSession();
  const { data, error } = id
    ? await supabase.from("glossary_terms").update(ligne).eq("id", id).select("id").single()
    : await supabase.from("glossary_terms").insert({ ...ligne, slug: slugifier(d.terme) }).select("id").single();
  if (error) return error.code === "23505" ? { statut: "erreur", message: "Ce terme existe déjà.", erreurs: { terme: "Déjà présent." } } : ECHEC;
  rafraichir(TAGS.glossaire, TAGS.statuts);
  if (!id) redirect(`/admin/glossaire/${data.id}?cree=1`);
  return OK();
}

export async function supprimerTerme(id: string) {
  await exigerAdmin();
  const supabase = await clientSession();
  await supabase.from("glossary_terms").delete().eq("id", id);
  rafraichir(TAGS.glossaire);
  redirect("/admin/glossaire?supprime=1");
}

// ---------------------------------------------------------------------------
// Veille : fiches, dossiers, signalements
// ---------------------------------------------------------------------------
const schemaFiche = z.object({
  theme: z.enum(["environnement", "urbanisme", "eau", "energie", "democratie_locale"]),
  titre: z.string().trim().min(5, { error: "Indiquez un titre." }).max(160),
  resume: z.string().trim().min(10, { error: "Rédigez un résumé." }).max(600),
  source: z.string().trim().min(2, { error: "Citez la source." }).max(160),
  url: z.union([z.literal(""), z.url({ error: "Lien invalide (https://…)." }).max(500)]),
  date: z.union([z.literal(""), z.iso.date({ error: "Date invalide." })]),
  dossierId: z.union([z.literal(""), z.uuid()]),
  publie: z.boolean(),
});
export type DonneesFiche = z.input<typeof schemaFiche>;

export async function enregistrerFiche(id: string | null, donnees: DonneesFiche): Promise<EtatForm> {
  await exigerAdmin();
  const r = schemaFiche.safeParse(donnees);
  if (!r.success) return KO(r.error);
  const d = r.data;
  const ligne = {
    theme: d.theme,
    titre: d.titre,
    resume: d.resume,
    source_label: d.source,
    source_url: d.url || null,
    date_info: d.date || null,
    dossier_id: d.dossierId || null,
    ...statutPublie(d.publie),
  };
  const supabase = await clientSession();
  const { data, error } = id
    ? await supabase.from("veille_items").update(ligne).eq("id", id).select("id").single()
    : await supabase.from("veille_items").insert(ligne).select("id").single();
  if (error) return ECHEC;
  rafraichir(TAGS.veille);
  if (!id) redirect(`/admin/veille/${data.id}?cree=1`);
  return OK();
}

export async function supprimerFiche(id: string) {
  await exigerAdmin();
  const supabase = await clientSession();
  await supabase.from("veille_items").delete().eq("id", id);
  rafraichir(TAGS.veille);
  redirect("/admin/veille?supprime=1");
}

const schemaDossier = z.object({
  titre: z.string().trim().min(5, { error: "Indiquez un titre." }).max(160),
  intro: z.string().trim().min(10, { error: "Rédigez l'introduction." }).max(600),
  imagePath: z.string().max(300).nullable(),
  imageAlt: z.string().trim().max(200),
  articleId: z.union([z.literal(""), z.uuid()]),
  aLaUne: z.boolean(),
  publie: z.boolean(),
});
export type DonneesDossier = z.input<typeof schemaDossier>;

export async function enregistrerDossier(id: string | null, donnees: DonneesDossier): Promise<EtatForm> {
  await exigerAdmin();
  const r = schemaDossier.safeParse(donnees);
  if (!r.success) return KO(r.error);
  const d = r.data;
  if (d.imagePath && !d.imageAlt) return { statut: "erreur", message: "Le texte alternatif de l'image est obligatoire.", erreurs: { imageAlt: "Obligatoire." } };
  const supabase = await clientSession();
  // Un seul dossier « du moment » à la fois.
  if (d.aLaUne) await supabase.from("veille_dossiers").update({ featured: false }).neq("id", id ?? "00000000-0000-0000-0000-000000000000");
  const ligne = {
    titre: d.titre,
    intro: d.intro,
    image_path: d.imagePath,
    image_alt: d.imageAlt || null,
    article_id: d.articleId || null,
    featured: d.aLaUne,
    ...statutPublie(d.publie),
  };
  const { data, error } = id
    ? await supabase.from("veille_dossiers").update(ligne).eq("id", id).select("id").single()
    : await supabase.from("veille_dossiers").insert({ ...ligne, slug: `${slugifier(d.titre)}-${crypto.randomUUID().slice(0, 4)}` }).select("id").single();
  if (error) return ECHEC;
  rafraichir(TAGS.veille);
  if (!id) redirect(`/admin/veille/dossiers/${data.id}?cree=1`);
  return OK();
}

export async function marquerSignalementTraite(id: string, traite: boolean) {
  await exigerAdmin();
  const supabase = await clientSession();
  await supabase.from("veille_reports").update({ treated_at: traite ? new Date().toISOString() : null }).eq("id", id);
  redirect("/admin/veille?vue=signalements");
}

// ---------------------------------------------------------------------------
// Actions et commissions
// ---------------------------------------------------------------------------
const schemaAction = z.object({
  titre: z.string().trim().min(3, { error: "Indiquez un titre." }).max(120),
  periode: z.string().trim().min(2, { error: "Indiquez la période (ex. « Automne 2026 »)." }).max(40),
  resume: z.string().trim().min(10, { error: "Rédigez un résumé." }).max(300),
  ton: z.enum(["abricot", "olive", "indigo", "terre"]),
  imagePath: z.string().max(300).nullable(),
  imageAlt: z.string().trim().max(200),
  lienLibelle: z.string().trim().max(60),
  lienHref: z.string().trim().max(300),
  commissionId: z.union([z.literal(""), z.uuid()]),
  position: z.coerce.number().int().min(0).max(999),
  publie: z.boolean(),
});
export type DonneesAction = z.input<typeof schemaAction>;

export async function enregistrerAction(id: string | null, donnees: DonneesAction): Promise<EtatForm> {
  await exigerAdmin();
  const r = schemaAction.safeParse(donnees);
  if (!r.success) return KO(r.error);
  const d = r.data;
  if (d.imagePath && !d.imageAlt) return { statut: "erreur", message: "Le texte alternatif de l'image est obligatoire.", erreurs: { imageAlt: "Obligatoire." } };
  if (d.lienHref && !/^(\/|https?:\/\/)/.test(d.lienHref)) return { statut: "erreur", message: "Lien invalide.", erreurs: { lienHref: "Commence par / ou https://" } };
  const ligne = {
    titre: d.titre,
    periode: d.periode,
    resume: d.resume,
    ton: d.ton,
    image_path: d.imagePath,
    image_alt: d.imageAlt || null,
    lien_label: d.lienLibelle || null,
    lien_href: d.lienHref || null,
    commission_id: d.commissionId || null,
    position: d.position,
    ...statutPublie(d.publie),
  };
  const supabase = await clientSession();
  const { data, error } = id
    ? await supabase.from("actions").update(ligne).eq("id", id).select("id").single()
    : await supabase.from("actions").insert({ ...ligne, slug: `${slugifier(d.titre)}-${crypto.randomUUID().slice(0, 4)}` }).select("id").single();
  if (error) return ECHEC;
  rafraichir(TAGS.actions, TAGS.accueil);
  if (!id) redirect(`/admin/actions/${data.id}?cree=1`);
  return OK();
}

export async function supprimerAction(id: string) {
  await exigerAdmin();
  const supabase = await clientSession();
  await supabase.from("actions").delete().eq("id", id);
  rafraichir(TAGS.actions, TAGS.accueil);
  redirect("/admin/actions?supprime=1");
}

const schemaCommission = z.object({
  nom: z.string().trim().min(2, { error: "Indiquez le nom." }).max(80),
  description: z.string().trim().max(300),
  position: z.coerce.number().int().min(0).max(999),
});

/** Commissions : formulaire simple (FormData), une ligne par commission. */
export async function enregistrerCommission(id: string | null, _: EtatForm, formData: FormData): Promise<EtatForm> {
  await exigerAdmin();
  const r = schemaCommission.safeParse({
    nom: formData.get("nom"),
    description: formData.get("description") ?? "",
    position: formData.get("position") ?? 0,
  });
  if (!r.success) return KO(r.error);
  const d = r.data;
  const supabase = await clientSession();
  const { error } = id
    ? await supabase.from("commissions").update({ nom: d.nom, description: d.description || null, position: d.position }).eq("id", id)
    : await supabase.from("commissions").insert({ nom: d.nom, description: d.description || null, position: d.position, slug: slugifier(d.nom) });
  if (error) return error.code === "23505" ? { statut: "erreur", message: "Cette commission existe déjà." } : ECHEC;
  rafraichir(TAGS.commissions);
  return OK(id ? "Commission enregistrée." : "Commission ajoutée.");
}

export async function supprimerCommission(id: string) {
  await exigerAdmin();
  const supabase = await clientSession();
  await supabase.from("commissions").delete().eq("id", id);
  rafraichir(TAGS.commissions);
  redirect("/admin/actions?vue=commissions");
}
