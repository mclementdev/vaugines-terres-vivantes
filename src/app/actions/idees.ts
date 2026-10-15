"use server";

import { createHmac, randomUUID } from "node:crypto";

import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";

import { slugifier } from "@/lib/admin/outils";
import { TAGS } from "@/lib/data/tags";
import { alerterModeration, envoyerIdeeRecue } from "@/lib/email/idees";
import { PHOTO_MAX_ENVOI, schemaCommentaire, schemaIdee } from "@/lib/idees/commun";
import { empreinteVisiteur, limiterDebit } from "@/lib/securite/anti-abus";
import { serviceClient } from "@/lib/supabase/service";

const uuid = z.uuid();
const COOKIE = "vtv_votant";

/** Clé du votant : HMAC d'un identifiant aléatoire gardé dans un cookie (aucune donnée personnelle). */
async function cleVotant(creer: boolean) {
  const jar = await cookies();
  let id = jar.get(COOKIE)?.value;
  if (!id || !uuid.safeParse(id).success) {
    if (!creer) return null;
    id = randomUUID();
    jar.set(COOKIE, id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 390, path: "/" }); // 13 mois au plus (CNIL)
  }
  const sel = process.env.ANTI_ABUS_SEL ?? process.env.SUPABASE_SECRET_KEY ?? "";
  return createHmac("sha256", sel).update(`votant|${id}`).digest("hex");
}

// ---------------------------------------------------------------------------
// Soutien en un clic (une fois par navigateur ; limité par foyer et par heure)
// ---------------------------------------------------------------------------
export type ResultatSoutien = { ok: boolean; soutenu: boolean; total?: number; message?: string };

export async function basculerSoutien(ideaId: string): Promise<ResultatSoutien> {
  if (!uuid.safeParse(ideaId).success) return { ok: false, soutenu: false };
  const db = serviceClient();
  const { data: idee } = await db.from("ideas_public").select("id, slug").eq("id", ideaId).maybeSingle();
  if (!idee) return { ok: false, soutenu: false, message: "Cette idée n'est plus disponible." };

  const cle = (await cleVotant(true))!;
  const { data: existant } = await db.from("idea_supports").select("idea_id").eq("idea_id", ideaId).eq("voter_key", cle).maybeSingle();

  if (existant) {
    await db.from("idea_supports").delete().eq("idea_id", ideaId).eq("voter_key", cle);
  } else {
    // Au plus 40 soutiens par heure depuis un même accès, et 6 par idée et par jour (un foyer partage souvent sa connexion).
    const [heure, jour] = await Promise.all([limiterDebit("soutien", 40, 3600), limiterDebit(`soutien:${ideaId}`, 6, 86400)]);
    if (!heure || !jour) return { ok: false, soutenu: false, message: "Trop de soutiens depuis cette connexion : réessayez plus tard." };
    const { error } = await db.from("idea_supports").insert({ idea_id: ideaId, voter_key: cle });
    if (error && error.code !== "23505") return { ok: false, soutenu: false, message: "Le soutien n'a pas été enregistré. Réessayez." };
  }

  const { data: maj } = await db.from("ideas").select("support_count").eq("id", ideaId).single();
  revalidateTag(TAGS.idees, "max");
  return { ok: true, soutenu: !existant, total: maj?.support_count };
}

/** Idées déjà soutenues depuis ce navigateur (parmi celles affichées). */
export async function mesSoutiens(ids: string[]): Promise<string[]> {
  const valides = ids.filter((i) => uuid.safeParse(i).success).slice(0, 200);
  const cle = await cleVotant(false);
  if (!cle || valides.length === 0) return [];
  const { data } = await serviceClient().from("idea_supports").select("idea_id").eq("voter_key", cle).in("idea_id", valides);
  return (data ?? []).map((d) => d.idea_id);
}

// ---------------------------------------------------------------------------
// Dépôt d'une idée (relue avant publication)
// ---------------------------------------------------------------------------
export type EtatDepot = {
  statut: "inactif" | "ok" | "erreur";
  message?: string;
  erreurs?: Record<string, string>;
};

/** Vérifie la signature binaire (le type annoncé par le navigateur ne suffit pas). */
function typeImage(o: Uint8Array): "image/jpeg" | "image/png" | "image/webp" | null {
  if (o[0] === 0xff && o[1] === 0xd8 && o[2] === 0xff) return "image/jpeg";
  if (o[0] === 0x89 && o[1] === 0x50 && o[2] === 0x4e && o[3] === 0x47) return "image/png";
  if (String.fromCharCode(...o.slice(0, 4)) === "RIFF" && String.fromCharCode(...o.slice(8, 12)) === "WEBP") return "image/webp";
  return null;
}

const erreursDe = (e: z.ZodError) => {
  const r: Record<string, string> = {};
  for (const i of e.issues) r[String(i.path[0] ?? "_")] ??= i.message;
  return r;
};

export async function deposerIdee(_: EtatDepot, fd: FormData): Promise<EtatDepot> {
  if (String(fd.get("site_web") ?? "")) return { statut: "ok" }; // robot : succès simulé
  const r = schemaIdee.safeParse({
    titre: fd.get("titre") ?? "",
    description: fd.get("description") ?? "",
    theme: fd.get("theme") ?? "",
    signer: fd.get("signer") === "oui",
    prenom: fd.get("prenom") ?? "",
    email: String(fd.get("email") ?? "").trim(),
    charte: fd.get("charte") === "on",
  });
  if (!r.success) return { statut: "erreur", message: "Merci de vérifier les champs signalés.", erreurs: erreursDe(r.error) };

  const photo = fd.get("photo");
  let octets: Uint8Array | null = null;
  let type: ReturnType<typeof typeImage> = null;
  if (photo instanceof File && photo.size > 0) {
    if (photo.size > PHOTO_MAX_ENVOI) return { statut: "erreur", erreurs: { photo: "Photo trop lourde, même après réduction. Essayez-en une autre." } };
    octets = new Uint8Array(await photo.arrayBuffer());
    type = typeImage(octets);
    if (!type) return { statut: "erreur", erreurs: { photo: "Ce fichier n'est pas une photo JPG, PNG ou WebP." } };
  }

  if (!(await limiterDebit("idee", 3, 3600))) {
    return { statut: "erreur", message: "Vous avez déjà proposé plusieurs idées : merci de réessayer dans une heure." };
  }

  const db = serviceClient();
  let photoPath: string | null = null;
  if (octets && type) {
    photoPath = `depots/${randomUUID()}.${type.split("/")[1].replace("jpeg", "jpg")}`;
    const { error } = await db.storage.from("idees").upload(photoPath, octets, { contentType: type, upsert: false });
    if (error) {
      console.error(`deposerIdee : photo non enregistrée (${error.name})`);
      return { statut: "erreur", message: "La photo n'a pas pu être enregistrée. Réessayez, ou envoyez votre idée sans photo." };
    }
  }

  const d = r.data;
  const { data, error } = await db
    .from("ideas")
    .insert({
      slug: `${slugifier(d.titre).slice(0, 60)}-${randomUUID().slice(0, 6)}`,
      titre: d.titre,
      description: d.description,
      theme: d.theme,
      display_name: d.signer ? d.prenom : null,
      author_email: d.email.toLowerCase(),
      photo_path: photoPath,
    })
    .select("id")
    .single();
  if (error || !data) {
    console.error(`deposerIdee : échec (${error?.code ?? "inconnu"})`);
    if (photoPath) await db.storage.from("idees").remove([photoPath]);
    return { statut: "erreur", message: "L'envoi n'a pas abouti. Réessayez dans un instant." };
  }

  after(async () => {
    await envoyerIdeeRecue(data.id);
    await alerterModeration({ quoi: "Nouvelle idée à relire", titre: d.titre, extrait: d.description });
  });
  return { statut: "ok" };
}

// ---------------------------------------------------------------------------
// L'auteur modifie son idée après une demande de modification (lien à jeton)
// ---------------------------------------------------------------------------
export async function modifierIdee(token: string, _: EtatDepot, fd: FormData): Promise<EtatDepot> {
  if (!uuid.safeParse(token).success) return { statut: "erreur", message: "Lien invalide." };
  const r = schemaIdee.safeParse({
    titre: fd.get("titre") ?? "",
    description: fd.get("description") ?? "",
    theme: fd.get("theme") ?? "",
    signer: fd.get("signer") === "oui",
    prenom: fd.get("prenom") ?? "",
    email: "lien@jeton.invalid",
    charte: true,
  });
  if (!r.success) return { statut: "erreur", message: "Merci de vérifier les champs signalés.", erreurs: erreursDe(r.error) };
  const d = r.data;
  const { data } = await serviceClient()
    .from("ideas")
    .update({ titre: d.titre, description: d.description, theme: d.theme, display_name: d.signer ? d.prenom : null, moderation: "pending" })
    .eq("edit_token", token)
    .eq("moderation", "changes_requested")
    .select("id")
    .maybeSingle();
  if (!data) return { statut: "erreur", message: "Cette idée n'attend plus de modification." };
  after(() => alerterModeration({ quoi: "Idée modifiée, à relire", titre: d.titre, extrait: d.description }));
  return { statut: "ok" };
}

// ---------------------------------------------------------------------------
// Commentaires (relus avant publication)
// ---------------------------------------------------------------------------
export async function commenter(ideaId: string, _: EtatDepot, fd: FormData): Promise<EtatDepot> {
  if (String(fd.get("site_web") ?? "")) return { statut: "ok" };
  if (!uuid.safeParse(ideaId).success) return { statut: "erreur", message: "Idée introuvable." };
  const r = schemaCommentaire.safeParse({ prenom: fd.get("prenom") ?? "", texte: fd.get("texte") ?? "", charte: fd.get("charte") === "on" });
  if (!r.success) return { statut: "erreur", message: "Merci de vérifier les champs signalés.", erreurs: erreursDe(r.error) };
  if (!(await limiterDebit("commentaire", 6, 3600))) return { statut: "erreur", message: "Plusieurs commentaires viennent d'être envoyés : réessayez dans une heure." };

  const db = serviceClient();
  const { data: idee } = await db.from("ideas_public").select("id, titre").eq("id", ideaId).maybeSingle();
  if (!idee) return { statut: "erreur", message: "Cette idée n'est plus disponible." };
  const { error } = await db.from("idea_comments").insert({ idea_id: ideaId, display_name: r.data.prenom || null, body: r.data.texte });
  if (error) return { statut: "erreur", message: "L'envoi n'a pas abouti. Réessayez dans un instant." };
  after(() => alerterModeration({ quoi: "Nouveau commentaire à relire", titre: idee.titre ?? "", extrait: r.data.texte }));
  return { statut: "ok", message: "Merci ! Votre commentaire sera publié après relecture (sous 48 h)." };
}

// ---------------------------------------------------------------------------
// Signalement d'une idée ou d'un commentaire publiés
// ---------------------------------------------------------------------------
export async function signaler(cible: { idee?: string; commentaire?: string }, motif: string): Promise<{ ok: boolean; message: string }> {
  const ideaId = cible.idee && uuid.safeParse(cible.idee).success ? cible.idee : null;
  const commentId = cible.commentaire && uuid.safeParse(cible.commentaire).success ? cible.commentaire : null;
  if (!ideaId === !commentId) return { ok: false, message: "Signalement invalide." };
  if (!(await limiterDebit("signalement", 10, 3600))) return { ok: false, message: "Trop de signalements : réessayez plus tard." };
  const { error } = await serviceClient()
    .from("idea_reports")
    .insert({ idea_id: ideaId, comment_id: commentId, reporter_key: await empreinteVisiteur("signalement"), motif: motif.trim().slice(0, 500) || null });
  if (error && error.code !== "23505") return { ok: false, message: "Le signalement n'a pas abouti." };
  if (!error) after(() => alerterModeration({ quoi: "Contenu signalé", titre: ideaId ? "Une idée publiée" : "Un commentaire publié", extrait: motif || "(sans motif)" }));
  return { ok: true, message: "Merci, l'équipe de modération va regarder." };
}

// ---------------------------------------------------------------------------
// Suivre l'avancement d'une idée par e-mail
// ---------------------------------------------------------------------------
export async function suivreIdee(ideaId: string, _: EtatDepot, fd: FormData): Promise<EtatDepot> {
  if (String(fd.get("site_web") ?? "")) return { statut: "ok" };
  const email = z.email({ error: "Adresse e-mail incomplète." }).max(254).safeParse(String(fd.get("email") ?? "").trim());
  if (!email.success || !uuid.safeParse(ideaId).success) return { statut: "erreur", erreurs: { email: "Adresse e-mail incomplète (exemple : prenom@exemple.fr)." } };
  if (!(await limiterDebit("suivi", 10, 3600))) return { statut: "erreur", message: "Réessayez dans une heure." };
  const db = serviceClient();
  const { data: idee } = await db.from("ideas_public").select("id").eq("id", ideaId).maybeSingle();
  if (!idee) return { statut: "erreur", message: "Cette idée n'est plus disponible." };
  await db.from("idea_followers").upsert({ idea_id: ideaId, email: email.data.toLowerCase() }, { onConflict: "idea_id,email", ignoreDuplicates: true });
  return { statut: "ok", message: "C'est noté : vous serez prévenu·e à chaque étape. Chaque e-mail contient un lien pour arrêter." };
}

export async function arreterSuivi(token: string) {
  if (uuid.safeParse(token).success) await serviceClient().from("idea_followers").delete().eq("token", token);
  redirect(`/idees/suivi/${token}?arret=1`);
}
