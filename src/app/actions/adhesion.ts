"use server";

import { updateTag } from "next/cache";
import { after } from "next/server";
import { z } from "zod";

import {
  erreursParChamp,
  formatMontant,
  libelleVirement,
  lireDateNaissance,
  schemaChoix,
  schemaCoordonnees,
  schemaEngagements,
} from "@/lib/adhesion/commun";
import { TAGS } from "@/lib/data/tags";
import { alerterConseil, envoyerBienvenue, noterHistorique } from "@/lib/email/courriers";
import { limiterDebit } from "@/lib/securite/anti-abus";
import { serviceClient } from "@/lib/supabase/service";

/** Données affichées sur la page de remerciement (gardées dans le navigateur, jamais dans l'URL). */
export type Merci = {
  prenom: string;
  email: string;
  avecCotisation: boolean;
  montant: string;
  libelle: string;
  emailEnvoye: boolean;
};

export type ResultatAdhesion =
  | { statut: "ok"; merci: Merci }
  | { statut: "erreur"; message: string; etape?: 1 | 2 | 3; erreurs?: Record<string, string> };

const schema = z.object({
  choix: schemaChoix,
  coordonnees: schemaCoordonnees,
  engagements: schemaEngagements,
  site_web: z.string().max(0),
});

const ECHEC = "L'enregistrement n'a pas abouti. Vos réponses sont conservées : réessayez dans un instant.";

export async function adherer(entree: unknown): Promise<ResultatAdhesion> {
  const brut = (entree ?? {}) as Record<string, unknown>;

  // Champ piège rempli : robot, on simule un succès sans rien enregistrer.
  if (typeof brut.site_web === "string" && brut.site_web.length > 0) {
    return { statut: "ok", merci: { prenom: "", email: "", avecCotisation: false, montant: "", libelle: "", emailEnvoye: false } };
  }

  for (const [etape, cle, s] of [
    [1, "choix", schemaChoix],
    [2, "coordonnees", schemaCoordonnees],
    [3, "engagements", schemaEngagements],
  ] as const) {
    const r = s.safeParse(brut[cle]);
    if (!r.success) return { statut: "erreur", etape, message: "Merci de vérifier les champs signalés.", erreurs: erreursParChamp(r.error) };
  }
  const res = schema.safeParse({ ...brut, site_web: brut.site_web ?? "" });
  if (!res.success) return { statut: "erreur", message: ECHEC };
  const { choix, coordonnees: c, engagements } = res.data;

  if (!(await limiterDebit("adhesion", 5, 3600))) {
    return { statut: "erreur", message: "Plusieurs adhésions viennent d'être envoyées depuis cet appareil : merci de réessayer dans une heure." };
  }

  const db = serviceClient();
  const { data: periode } = await db.from("ag_periods").select("id").eq("is_current", true).maybeSingle();
  if (!periode) {
    console.error("adherer : aucune année d'AG en cours");
    return { statut: "erreur", message: ECHEC };
  }

  const email = c.email.toLowerCase();
  const maintenant = new Date().toISOString();
  const naissance = c.naissance ? lireDateNaissance(c.naissance) : null;

  // Même personne déjà connue (même e-mail, même nom et prénom) : on complète sa fiche.
  const { data: connus } = await db.from("members").select("id, prenom, nom").eq("email", email).eq("is_sample", false);
  const meme = (a: string, b: string) => a.localeCompare(b, "fr", { sensitivity: "base" }) === 0;
  const existant = connus?.find((m) => meme(m.prenom, c.prenom) && meme(m.nom, c.nom));

  const fiche = {
    prenom: c.prenom,
    nom: c.nom,
    email,
    adresse: c.adresse || null,
    code_postal: c.code_postal || null,
    commune: c.commune || null,
    consent_statuts_at: maintenant,
    consent_donnees_at: maintenant,
  };

  let memberId: string;
  if (existant) {
    memberId = existant.id;
    const { error } = await db.from("members").update(fiche).eq("id", memberId);
    if (error) return echec("mise à jour", error.code);
  } else {
    const { data, error } = await db.from("members").insert({ ...fiche, source: "en_ligne" }).select("id").single();
    if (error || !data) return echec("ajout", error?.code);
    memberId = data.id;
  }

  if (naissance || c.telephone) {
    const prive = { member_id: memberId, ...(naissance && { birth_date: naissance }), ...(c.telephone && { phone: c.telephone }) };
    const { error } = await db.from("member_private").upsert(prive);
    if (error) console.error(`adherer : coordonnées facultatives non enregistrées (${error.code})`);
  }

  const avec = choix.mode === "avec";
  const cotisation = {
    member_id: memberId,
    period_id: periode.id,
    mode: choix.mode,
    status: avec ? ("attendue" as const) : ("sans" as const),
    amount_cents: avec ? choix.montant! * 100 : null,
    payment_method: avec ? ("virement" as const) : null,
  };
  const { data: dejaCotise } = await db.from("contributions").select("id, status").eq("member_id", memberId).eq("period_id", periode.id).maybeSingle();
  if (!dejaCotise) {
    const { error } = await db.from("contributions").insert(cotisation);
    if (error) return echec("cotisation", error.code);
  } else if (dejaCotise.status !== "payee") {
    // Nouveau choix pour l'année en cours (une cotisation déjà reçue n'est jamais modifiée).
    await db.from("contributions").update(cotisation).eq("id", dejaCotise.id);
  }

  await noterHistorique(memberId, existant ? "adhesion_mise_a_jour" : "adhesion", {
    source: "en_ligne",
    mode: choix.mode,
    ...(avec && { montant: choix.montant! }),
  });

  if (engagements.lettre) await abonnerDepuisAdhesion(email, memberId);

  const emailEnvoye = await envoyerBienvenue(memberId);
  after(() => alerterConseil(memberId));
  updateTag(TAGS.adherents);

  return {
    statut: "ok",
    merci: {
      prenom: c.prenom,
      email,
      avecCotisation: avec,
      montant: avec ? formatMontant(choix.montant! * 100) : "",
      libelle: libelleVirement(c.nom, c.prenom),
      emailEnvoye,
    },
  };
}

function echec(etape: string, code?: string): ResultatAdhesion {
  console.error(`adherer : échec (${etape}, ${code ?? "inconnu"})`);
  return { statut: "erreur", message: ECHEC };
}

/** Abonnement demandé à l'adhésion : confirmé par le lien de l'e-mail de bienvenue. */
async function abonnerDepuisAdhesion(email: string, memberId: string) {
  const db = serviceClient();
  const { data: abonne } = await db.from("newsletter_subscribers").select("id, status").eq("email", email).maybeSingle();
  if (!abonne) {
    await db.from("newsletter_subscribers").insert({ email, source: "adhesion", member_id: memberId });
  } else if (abonne.status === "unsubscribed") {
    await db
      .from("newsletter_subscribers")
      .update({ status: "pending", token: crypto.randomUUID(), member_id: memberId, unsubscribed_at: null })
      .eq("id", abonne.id);
  } else {
    await db.from("newsletter_subscribers").update({ member_id: memberId }).eq("id", abonne.id);
  }
}
