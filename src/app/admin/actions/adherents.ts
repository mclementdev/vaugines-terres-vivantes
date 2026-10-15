"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { afficherDateNaissance, lireDateNaissance } from "@/lib/adhesion/commun";
import { requeteARelancer } from "@/lib/admin/adherents";
import { erreursZod, type EtatForm } from "@/lib/admin/outils";
import { rafraichir } from "@/lib/admin/revalider";
import { exigerAdmin, exigerSuperadmin } from "@/lib/auth";
import { TAGS } from "@/lib/data/tags";
import { envoyerBienvenue, envoyerRelance, noterHistorique } from "@/lib/email/courriers";
import { clientSession } from "@/lib/supabase/serveur";

export type Retour = { ok: boolean; message: string };

const uuid = z.uuid();
const dateIso = z.iso.date({ error: "Date invalide." });
const ECHEC: Retour = { ok: false, message: "L'opération a échoué. Réessayez." };

// ---------------------------------------------------------------------------
// Cotisation reçue
// ---------------------------------------------------------------------------
export async function marquerCotisationRecue(contributionId: string, donnees: { le: string; moyen: string }): Promise<Retour> {
  const admin = await exigerAdmin();
  const r = z.object({ id: uuid, le: dateIso, moyen: z.enum(["virement", "especes", "cheque", "carte"]) }).safeParse({ id: contributionId, ...donnees });
  if (!r.success) return { ok: false, message: "Vérifiez la date et le moyen de paiement." };
  const supabase = await clientSession();
  const { data, error } = await supabase
    .from("contributions")
    .update({ status: "payee", paid_on: r.data.le, payment_method: r.data.moyen })
    .eq("id", r.data.id)
    .eq("mode", "avec")
    .select("member_id, amount_cents")
    .single();
  if (error || !data) return ECHEC;
  await noterHistorique(data.member_id, "cotisation_recue", { montant: (data.amount_cents ?? 0) / 100, moyen: r.data.moyen }, admin.id);
  rafraichir(TAGS.adherents);
  return { ok: true, message: "Cotisation marquée comme reçue." };
}

// ---------------------------------------------------------------------------
// E-mails : relance, bienvenue
// ---------------------------------------------------------------------------
export async function relancer(memberId: string): Promise<Retour> {
  const admin = await exigerAdmin();
  if (!uuid.safeParse(memberId).success) return ECHEC;
  const ok = await envoyerRelance(memberId, admin.id);
  return ok ? { ok: true, message: "Relance envoyée." } : { ok: false, message: "La relance n'a pas pu partir (adresse manquante, cotisation déjà reçue ou envoi refusé)." };
}

export async function renvoyerBienvenue(memberId: string): Promise<Retour> {
  const admin = await exigerAdmin();
  if (!uuid.safeParse(memberId).success) return ECHEC;
  const ok = await envoyerBienvenue(memberId, admin.id);
  return ok ? { ok: true, message: "E-mail de bienvenue renvoyé, avec les statuts." } : { ok: false, message: "L'e-mail n'a pas pu partir (adresse manquante ou envoi refusé)." };
}

/** Relance groupée des virements attendus de l'année en cours (pas plus d'une fois par semaine et par personne). */
export async function relancerVirementsAttendus(): Promise<Retour> {
  const admin = await exigerAdmin();
  const supabase = await clientSession();
  const { data } = await requeteARelancer(supabase);
  const ids = (data ?? []).map((d) => d.id).filter((id): id is string => Boolean(id));
  let envoyees = 0;
  for (const id of ids) if (await envoyerRelance(id, admin.id)) envoyees++;
  if (ids.length === 0) return { ok: true, message: "Aucune relance à envoyer : toutes les personnes concernées ont été relancées il y a moins d'une semaine." };
  return {
    ok: envoyees === ids.length,
    message: envoyees === ids.length ? `${envoyees} relance${envoyees > 1 ? "s" : ""} envoyée${envoyees > 1 ? "s" : ""}.` : `${envoyees} relance(s) envoyée(s) sur ${ids.length}.`,
  };
}

// ---------------------------------------------------------------------------
// Validation en Assemblée Générale (une ou plusieurs fiches)
// ---------------------------------------------------------------------------
export async function validerEnAg(ids: string[], le: string): Promise<Retour> {
  const admin = await exigerAdmin();
  const r = z.object({ ids: z.array(uuid).min(1).max(500), le: dateIso }).safeParse({ ids, le });
  if (!r.success) return { ok: false, message: "Choisissez au moins une personne et la date de l'AG." };
  const supabase = await clientSession();
  const { data, error } = await supabase.from("members").update({ ag_validated_on: r.data.le }).in("id", r.data.ids).is("ag_validated_on", null).select("id");
  if (error) return ECHEC;
  await Promise.all((data ?? []).map((m) => noterHistorique(m.id, "validation_ag", { le: r.data.le }, admin.id)));
  const n = data?.length ?? 0;
  return { ok: true, message: n > 1 ? `${n} adhésions validées en AG.` : n === 1 ? "Adhésion validée en AG." : "Ces adhésions étaient déjà validées." };
}

// ---------------------------------------------------------------------------
// Téléphone et date de naissance : lecture tracée dans l'historique
// ---------------------------------------------------------------------------
export async function revelerCoordonnees(memberId: string): Promise<{ telephone: string; naissance: string } | null> {
  await exigerAdmin();
  if (!uuid.safeParse(memberId).success) return null;
  const supabase = await clientSession();
  const { data, error } = await supabase.rpc("member_private_read", { p_member_id: memberId });
  if (error) return null;
  const p = data?.[0];
  return { telephone: p?.phone ?? "", naissance: afficherDateNaissance(p?.birth_date) };
}

// ---------------------------------------------------------------------------
// Ajout (bulletin papier) et modification d'une fiche
// ---------------------------------------------------------------------------
const texte = (max: number) => z.string().trim().max(max, { error: `${max} caractères maximum.` });
const requis = (max: number, message: string) => texte(max).min(1, { error: message });

const schemaFiche = z
  .object({
    prenom: requis(80, "Indiquez le prénom."),
    nom: requis(80, "Indiquez le nom."),
    email: z.union([z.literal(""), z.email({ error: "Adresse e-mail invalide." }).max(254)]),
    telephone: texte(30).refine((v) => !v || /^\+?[\d\s.()-]{6,25}$/.test(v), { error: "Numéro invalide." }),
    naissance: texte(20).refine((v) => !v || lireDateNaissance(v) !== null, { error: "Date au format JJ/MM/AAAA." }),
    adresse: texte(200),
    code_postal: texte(10),
    commune: texte(80),
    notes: texte(2000),
    joined_on: dateIso,
    mode: z.enum(["avec", "sans"]),
    montant: z.string().trim(),
    statut: z.enum(["attendue", "payee"]),
    paid_on: z.union([z.literal(""), dateIso]),
    moyen: z.enum(["virement", "especes", "cheque", "carte"]),
    lettre: z.boolean(),
    bienvenue: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (v.mode === "avec") {
      const n = Number(v.montant.replace(",", "."));
      if (!v.montant || !Number.isFinite(n) || n < 1 || n > 10000) ctx.addIssue({ code: "custom", path: ["montant"], message: "Montant entre 1 et 10 000 €." });
      if (v.statut === "payee" && !v.paid_on) ctx.addIssue({ code: "custom", path: ["paid_on"], message: "Indiquez la date de réception." });
    }
    if (v.bienvenue && !v.email) ctx.addIssue({ code: "custom", path: ["email"], message: "Une adresse est nécessaire pour l'e-mail de bienvenue." });
  });

function lireFormulaire(fd: FormData) {
  const s = (k: string) => String(fd.get(k) ?? "");
  return {
    prenom: s("prenom"),
    nom: s("nom"),
    email: s("email").trim(),
    telephone: s("telephone"),
    naissance: s("naissance"),
    adresse: s("adresse"),
    code_postal: s("code_postal"),
    commune: s("commune"),
    notes: s("notes"),
    joined_on: s("joined_on"),
    mode: s("mode"),
    montant: s("montant"),
    statut: s("statut") || "attendue",
    paid_on: s("paid_on"),
    moyen: s("moyen") || "virement",
    lettre: fd.get("lettre") === "on",
    bienvenue: fd.get("bienvenue") === "on",
  };
}

const KO = (e: z.ZodError): EtatForm => ({ statut: "erreur", message: "Merci de vérifier les champs signalés.", erreurs: erreursZod(e) });

export async function enregistrerAdherent(id: string | null, _: EtatForm, fd: FormData): Promise<EtatForm> {
  const admin = await exigerAdmin();
  const r = schemaFiche.safeParse(lireFormulaire(fd));
  if (!r.success) return KO(r.error);
  const d = r.data;
  const supabase = await clientSession();

  const email = d.email ? d.email.toLowerCase() : null;
  const fiche = {
    prenom: d.prenom,
    nom: d.nom,
    email,
    adresse: d.adresse || null,
    code_postal: d.code_postal || null,
    commune: d.commune || null,
    notes: d.notes || null,
  };

  let memberId = id;
  if (id) {
    if (!uuid.safeParse(id).success) return { statut: "erreur", message: "Fiche introuvable." };
    const { error } = await supabase.from("members").update(fiche).eq("id", id);
    if (error) return { statut: "erreur", message: "L'enregistrement a échoué. Réessayez." };
  } else {
    // Bulletin papier signé : il vaut acceptation des statuts et du traitement des données.
    const date = new Date(`${d.joined_on}T12:00:00Z`).toISOString();
    const { data, error } = await supabase
      .from("members")
      .insert({ ...fiche, source: "papier", joined_at: date, consent_statuts_at: date, consent_donnees_at: date })
      .select("id")
      .single();
    if (error || !data) return { statut: "erreur", message: "L'ajout a échoué. Réessayez." };
    memberId = data.id;
  }
  if (!memberId) return { statut: "erreur", message: "Fiche introuvable." };

  const naissance = d.naissance ? lireDateNaissance(d.naissance) : null;
  const { error: errPrive } = await supabase.rpc("member_private_write", { p_member_id: memberId, p_birth_date: naissance as string, p_phone: d.telephone });
  if (errPrive) console.error(`enregistrerAdherent : coordonnées facultatives (${errPrive.code})`);

  // Cotisation de l'année d'AG en cours.
  const { data: periode } = await supabase.from("ag_periods").select("id").eq("is_current", true).maybeSingle();
  if (periode) {
    const avec = d.mode === "avec";
    const cotisation = {
      mode: d.mode,
      status: avec ? d.statut : ("sans" as const),
      amount_cents: avec ? Math.round(Number(d.montant.replace(",", ".")) * 100) : null,
      payment_method: avec ? d.moyen : null,
      paid_on: avec && d.statut === "payee" ? d.paid_on : null,
    };
    const { data: existante } = await supabase.from("contributions").select("id, mode, status, amount_cents").eq("member_id", memberId).eq("period_id", periode.id).maybeSingle();
    if (existante) {
      const change = existante.mode !== cotisation.mode || existante.status !== cotisation.status || existante.amount_cents !== cotisation.amount_cents;
      if (change) {
        await supabase.from("contributions").update(cotisation).eq("id", existante.id);
        await noterHistorique(memberId, "cotisation_modifiee", {}, admin.id);
      }
    } else {
      await supabase.from("contributions").insert({ ...cotisation, member_id: memberId, period_id: periode.id });
    }
  }

  // Lettre : la case cochée sur le bulletin vaut consentement (abonnement actif).
  if (email && d.lettre) {
    const { data: abonne } = await supabase.from("newsletter_subscribers").select("id, status").eq("email", email).maybeSingle();
    if (!abonne) {
      await supabase.from("newsletter_subscribers").insert({ email, status: "active", source: "papier", member_id: memberId, confirmed_at: new Date().toISOString() });
    } else if (abonne.status === "unsubscribed" || (!id && abonne.status === "pending")) {
      // En modification, un abonnement en attente reste en attente de la confirmation de la personne.
      await supabase.from("newsletter_subscribers").update({ status: "active", member_id: memberId, confirmed_at: new Date().toISOString(), unsubscribed_at: null }).eq("id", abonne.id);
    }
  } else if (email && !d.lettre && id) {
    await supabase.from("newsletter_subscribers").update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() }).eq("email", email).neq("status", "unsubscribed");
  }

  await noterHistorique(memberId, id ? "fiche_modifiee" : "adhesion", id ? {} : { source: "papier" }, admin.id);
  if (!id && d.bienvenue) await envoyerBienvenue(memberId, admin.id);
  rafraichir(TAGS.adherents);
  redirect(`/admin/adherents?id=${memberId}&ok=${id ? "modifie" : "ajoute"}`);
}

// ---------------------------------------------------------------------------
// Droit à l'effacement (superadmin)
// ---------------------------------------------------------------------------
export async function supprimerAdherent(memberId: string) {
  const admin = await exigerSuperadmin();
  if (!uuid.safeParse(memberId).success) redirect("/admin/adherents");
  const supabase = await clientSession();
  const { data: m } = await supabase.from("members").select("email").eq("id", memberId).maybeSingle();
  if (m?.email) await supabase.from("newsletter_subscribers").delete().eq("email", m.email);
  const { error } = await supabase.from("members").delete().eq("id", memberId);
  if (error) redirect(`/admin/adherents?id=${memberId}&ok=suppression-echec`);
  // Journal sans donnée personnelle : l'identifiant suffit à prouver l'effacement.
  await supabase.from("audit_log").insert({ actor_id: admin.id, action: "effacement_adherent", cible: memberId });
  rafraichir(TAGS.adherents);
  redirect("/admin/adherents?ok=supprime");
}

// ---------------------------------------------------------------------------
// Années d'AG (superadmin)
// ---------------------------------------------------------------------------
export async function ouvrirAnneeAg(_: EtatForm, fd: FormData): Promise<EtatForm> {
  await exigerSuperadmin();
  const r = z
    .object({ label: requis(20, "Indiquez l'année, par exemple 2027–2028."), starts_on: dateIso })
    .safeParse({ label: String(fd.get("label") ?? ""), starts_on: String(fd.get("starts_on") ?? "") });
  if (!r.success) return KO(r.error);
  const supabase = await clientSession();
  const { data: courante } = await supabase.from("ag_periods").select("id").eq("is_current", true).maybeSingle();
  if (courante) {
    const { error } = await supabase.from("ag_periods").update({ is_current: false, ends_on: r.data.starts_on }).eq("id", courante.id);
    if (error) return { statut: "erreur", message: "L'opération a échoué." };
  }
  const { error } = await supabase.from("ag_periods").insert({ label: r.data.label, starts_on: r.data.starts_on, is_current: true });
  if (error) {
    if (courante) await supabase.from("ag_periods").update({ is_current: true, ends_on: null }).eq("id", courante.id);
    return { statut: "erreur", message: error.code === "23505" ? "Cette année d'AG existe déjà." : "L'opération a échoué." };
  }
  rafraichir(TAGS.adherents);
  return { statut: "ok", message: `Année d'AG ${r.data.label} ouverte : les nouvelles adhésions y sont rattachées.` };
}
