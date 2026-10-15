"use server";

import { after } from "next/server";
import { z } from "zod";

import { rafraichir } from "@/lib/admin/revalider";
import { exigerAdmin } from "@/lib/auth";
import { TAGS } from "@/lib/data/tags";
import { envoyerAvancement, envoyerDecision } from "@/lib/email/idees";
import { clientSession } from "@/lib/supabase/serveur";
import { serviceClient } from "@/lib/supabase/service";

export type Retour = { ok: boolean; message: string };

const uuid = z.uuid();
const motif = z.string().trim().min(5, { error: "Expliquez en quelques mots (5 caractères minimum)." }).max(1000);
const ECHEC: Retour = { ok: false, message: "L'opération a échoué. Réessayez." };

async function journal(d: { idee?: string | null; commentaire?: string | null; libelle: string; action: string; motif?: string | null }) {
  const admin = await exigerAdmin();
  const supabase = await clientSession();
  await supabase.from("moderation_log").insert({
    actor_id: admin.id,
    idea_id: d.idee ?? null,
    comment_id: d.commentaire ?? null,
    libelle: d.libelle.slice(0, 200),
    action: d.action,
    motif: d.motif ?? null,
  });
}

/** Idée retirée ou refusée : e-mail de l'auteur et suivis effacés (page « Données personnelles »). */
async function effacerContacts(id: string) {
  const db = serviceClient();
  await Promise.all([db.from("ideas").update({ author_email: null }).eq("id", id), db.from("idea_followers").delete().eq("idea_id", id)]);
}

// ---------------------------------------------------------------------------
// Idées en attente
// ---------------------------------------------------------------------------
export async function deciderIdee(id: string, decision: "publiee" | "modification" | "refusee", texte = ""): Promise<Retour> {
  await exigerAdmin();
  if (!uuid.safeParse(id).success) return ECHEC;
  let note: string | null = null;
  if (decision !== "publiee") {
    const m = motif.safeParse(texte);
    if (!m.success) return { ok: false, message: m.error.issues[0].message };
    note = m.data;
  }
  const supabase = await clientSession();
  const maintenant = new Date().toISOString();
  const { data: i, error } = await supabase
    .from("ideas")
    .update({
      moderation: decision === "publiee" ? "published" : decision === "modification" ? "changes_requested" : "rejected",
      moderation_note: note,
      moderated_at: maintenant,
      ...(decision === "publiee" && { published_at: maintenant }),
    })
    .eq("id", id)
    .select("slug, titre, photo_path")
    .single();
  if (error || !i) return ECHEC;

  // Idée refusée : sa photo n'a plus de raison d'être conservée.
  if (decision === "refusee" && i.photo_path) {
    await serviceClient().storage.from("idees").remove([i.photo_path]);
    await supabase.from("ideas").update({ photo_path: null }).eq("id", id);
  }
  await journal({ idee: id, libelle: i.titre, action: `idee_${decision}`, motif: note });
  rafraichir(TAGS.idees, `idee:${i.slug}`);
  after(async () => {
    await envoyerDecision(id, decision);
    // Idée refusée : l'e-mail de l'auteur n'est plus utile une fois le motif envoyé.
    if (decision === "refusee") await effacerContacts(id);
  });
  return {
    ok: true,
    message: { publiee: "Idée publiée ; l'auteur est prévenu.", modification: "Demande envoyée à l'auteur.", refusee: "Idée refusée ; l'auteur est prévenu du motif." }[decision],
  };
}

// ---------------------------------------------------------------------------
// Commentaires en attente
// ---------------------------------------------------------------------------
export async function deciderCommentaire(id: string, publier: boolean): Promise<Retour> {
  await exigerAdmin();
  if (!uuid.safeParse(id).success) return ECHEC;
  const supabase = await clientSession();
  const { data: c, error } = await supabase
    .from("idea_comments")
    .update({ moderation: publier ? "published" : "rejected", moderated_at: new Date().toISOString(), ...(publier && { published_at: new Date().toISOString() }) })
    .eq("id", id)
    .select("body, idea_id, ideas(slug)")
    .single();
  if (error || !c) return ECHEC;
  await journal({ commentaire: id, idee: c.idea_id, libelle: c.body.slice(0, 120), action: publier ? "commentaire_publie" : "commentaire_refuse" });
  rafraichir(TAGS.idees, `idee:${(c.ideas as { slug: string } | null)?.slug}`);
  return { ok: true, message: publier ? "Commentaire publié." : "Commentaire refusé." };
}

// ---------------------------------------------------------------------------
// Signalements : garder le contenu, ou le retirer du site
// ---------------------------------------------------------------------------
export async function traiterSignalement(cible: { idee?: string; commentaire?: string }, retirer: boolean): Promise<Retour> {
  await exigerAdmin();
  const supabase = await clientSession();
  const maintenant = new Date().toISOString();
  if (cible.idee && uuid.safeParse(cible.idee).success) {
    await supabase.from("idea_reports").update({ treated_at: maintenant }).eq("idea_id", cible.idee).is("treated_at", null);
    const { data: i } = await supabase
      .from("ideas")
      .update(retirer ? { moderation: "rejected", moderated_at: maintenant, moderation_note: "Retirée après signalement." } : { report_count: 0 })
      .eq("id", cible.idee)
      .select("slug, titre")
      .single();
    if (!i) return ECHEC;
    if (retirer) await effacerContacts(cible.idee);
    await journal({ idee: cible.idee, libelle: i.titre, action: retirer ? "idee_retiree" : "signalement_classe" });
    rafraichir(TAGS.idees, `idee:${i.slug}`);
  } else if (cible.commentaire && uuid.safeParse(cible.commentaire).success) {
    await supabase.from("idea_reports").update({ treated_at: maintenant }).eq("comment_id", cible.commentaire).is("treated_at", null);
    const { data: c } = await supabase
      .from("idea_comments")
      .update(retirer ? { moderation: "rejected", moderated_at: maintenant } : { report_count: 0 })
      .eq("id", cible.commentaire)
      .select("body, idea_id, ideas(slug)")
      .single();
    if (!c) return ECHEC;
    await journal({ commentaire: cible.commentaire, idee: c.idea_id, libelle: c.body.slice(0, 120), action: retirer ? "commentaire_retire" : "signalement_classe" });
    rafraichir(TAGS.idees, `idee:${(c.ideas as { slug: string } | null)?.slug}`);
  } else return ECHEC;
  return { ok: true, message: retirer ? "Contenu retiré du site." : "Signalement classé : le contenu reste en ligne." };
}

// ---------------------------------------------------------------------------
// Avancement d'une idée publiée (visible publiquement, prévient auteur et suiveurs)
// ---------------------------------------------------------------------------
export async function changerAvancement(id: string, etape: string): Promise<Retour> {
  await exigerAdmin();
  const e = z.enum(["proposee", "etudiee", "en_projet", "realisee"]).safeParse(etape);
  if (!uuid.safeParse(id).success || !e.success) return ECHEC;
  const supabase = await clientSession();
  const { data: i, error } = await supabase.from("ideas").update({ progress: e.data }).eq("id", id).eq("moderation", "published").select("slug, titre").single();
  if (error || !i) return ECHEC;
  await journal({ idee: id, libelle: i.titre, action: `avancement_${e.data}` });
  rafraichir(TAGS.idees, `idee:${i.slug}`);
  after(() => envoyerAvancement(id));
  return { ok: true, message: "Statut mis à jour ; l'auteur et les personnes qui suivent l'idée sont prévenus." };
}
