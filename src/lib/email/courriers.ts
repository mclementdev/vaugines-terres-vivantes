import "server-only";

import { formatMontant, libelleVirement } from "@/lib/adhesion/commun";
import { getEvenementsAVenir } from "@/lib/data/contenus";
import { getReglages } from "@/lib/data/site";
import { dansCombien, jour } from "@/lib/dates";
import { pdfStatutsBase64 } from "@/lib/pdf/statuts";
import { serviceClient } from "@/lib/supabase/service";
import type { Json } from "@/lib/supabase/types";

import { envoyerEmail } from "./envoyer";
import { emailAlerteAdhesion, emailBienvenue, emailConfirmationLettre, emailRelance, urlSite } from "./modeles";

/** Ligne d'historique d'un adhérent (jamais de donnée personnelle dans `detail`). */
export async function noterHistorique(memberId: string, event: string, detail: Record<string, Json> = {}, acteur: string | null = null) {
  const { error } = await serviceClient().from("member_history").insert({ member_id: memberId, event, detail, actor_id: acteur });
  if (error) console.error(`historique « ${event} » : échec d'écriture (${error.code})`);
}

/** Adhérent et sa cotisation de l'année d'AG en cours. */
async function chargerAdherent(memberId: string) {
  const db = serviceClient();
  const { data: m } = await db.from("members").select("id, prenom, nom, email, commune").eq("id", memberId).single();
  if (!m) return null;
  const { data: c } = await db
    .from("contributions")
    .select("id, mode, status, amount_cents, reminders_count, ag_periods!inner(label, is_current)")
    .eq("member_id", memberId)
    .eq("ag_periods.is_current", true)
    .maybeSingle();
  return { m, c };
}

const lienLettre = (token: string) => `${urlSite()}/lettre/confirmer/${token}`;

/** E-mail de bienvenue avec les statuts en PDF (et la confirmation de la lettre si demandée). */
export async function envoyerBienvenue(memberId: string, acteur: string | null = null) {
  const donnees = await chargerAdherent(memberId);
  const email = donnees?.m.email;
  if (!donnees || !email) return false;
  const { m, c } = donnees;
  const db = serviceClient();

  const [reglages, pdf, evenements, abonne] = await Promise.all([
    getReglages(),
    pdfStatutsBase64(),
    getEvenementsAVenir(4),
    db.from("newsletter_subscribers").select("token, status").eq("email", email).maybeSingle(),
  ]);
  const prochain = evenements.find((e) => e.starts_at && !e.is_sample) ?? null;

  const { html, texte } = await emailBienvenue(reglages, {
    prenom: m.prenom,
    cotisation: {
      statut: c?.status ?? "sans",
      montant: formatMontant(c?.amount_cents),
      libelle: libelleVirement(m.nom, m.prenom),
    },
    lienLettre: abonne.data?.status === "pending" ? lienLettre(abonne.data.token) : undefined,
    prochainRdv: prochain?.starts_at
      ? { titre: prochain.titre, quand: `${dansCombien(prochain.starts_at) ?? ""} (${jour(prochain.starts_at)})`.trim(), href: `${urlSite()}/evenements/${prochain.slug}` }
      : undefined,
  });

  const r = await envoyerEmail({
    modele: "bienvenue",
    a: email,
    sujet: "Bienvenue dans l'association !",
    html,
    texte,
    piecesJointes: [{ nom: "statuts-vtv.pdf", base64: pdf, type: "application/pdf" }],
  });
  if (r.ok) {
    await db.from("members").update({ welcome_sent_at: new Date().toISOString() }).eq("id", memberId);
    if (abonne.data?.status === "pending") {
      await db.from("newsletter_subscribers").update({ confirmation_sent_at: new Date().toISOString() }).eq("token", abonne.data.token);
    }
  }
  await noterHistorique(memberId, r.ok ? "email_bienvenue" : "email_bienvenue_echec", {}, acteur);
  return r.ok;
}

/** Prévient le conseil (adresse des alertes, réglage privé) d'une adhésion en ligne. */
export async function alerterConseil(memberId: string) {
  const db = serviceClient();
  const donnees = await chargerAdherent(memberId);
  if (!donnees) return;
  const { m, c } = donnees;
  const [{ data: prive }, reglages, total, abonne] = await Promise.all([
    db.from("private_settings").select("data").eq("id", 1).single(),
    getReglages(),
    db.from("contributions").select("id, ag_periods!inner(is_current)", { count: "exact", head: true }).eq("ag_periods.is_current", true),
    m.email ? db.from("newsletter_subscribers").select("id").eq("email", m.email).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const destinataire = (prive?.data as { email_alertes?: string } | null)?.email_alertes;
  if (!destinataire) return;

  const cotisation =
    c?.status === "sans" || !c ? "Sans cotisation" : `${formatMontant(c.amount_cents)} · ${c.status === "payee" ? "reçue" : "virement attendu"}`;
  const { html, texte } = await emailAlerteAdhesion(reglages, {
    nom: `${m.prenom} ${m.nom}`,
    commune: m.commune ?? "",
    cotisation,
    lettre: Boolean(abonne.data),
    lienFiche: `${urlSite()}/admin/adherents?id=${m.id}`,
    total: total.count ?? 1,
  });
  const r = await envoyerEmail({ modele: "alerte-adhesion", a: destinataire, sujet: `Nouvelle adhésion : ${m.prenom} ${m.nom}`, html, texte });
  await noterHistorique(memberId, r.ok ? "alerte_conseil" : "alerte_conseil_echec");
}

/** Relance d'un virement attendu (année d'AG en cours). */
export async function envoyerRelance(memberId: string, acteur: string | null) {
  const donnees = await chargerAdherent(memberId);
  const email = donnees?.m.email;
  const c = donnees?.c;
  if (!donnees || !email || c?.status !== "attendue") return false;
  const { m } = donnees;
  const reglages = await getReglages();
  const { html, texte } = await emailRelance(reglages, {
    prenom: m.prenom,
    montant: formatMontant(c.amount_cents),
    libelle: libelleVirement(m.nom, m.prenom),
    periode: c.ag_periods.label,
  });
  const r = await envoyerEmail({ modele: "relance", a: email, sujet: "Petit rappel pour votre cotisation", html, texte });
  if (r.ok) {
    await serviceClient()
      .from("contributions")
      .update({ last_reminder_at: new Date().toISOString(), reminders_count: c.reminders_count + 1 })
      .eq("id", c.id);
  }
  await noterHistorique(memberId, r.ok ? "relance" : "relance_echec", {}, acteur);
  return r.ok;
}

/** Confirmation d'inscription à la lettre (double opt-in). */
export async function envoyerConfirmationLettre(abonne: { email: string; token: string }) {
  const reglages = await getReglages();
  const { html, texte } = await emailConfirmationLettre(reglages, { lien: lienLettre(abonne.token) });
  const r = await envoyerEmail({ modele: "confirmation-lettre", a: abonne.email, sujet: "Confirmez votre inscription à la lettre d'information", html, texte });
  if (r.ok) {
    await serviceClient().from("newsletter_subscribers").update({ confirmation_sent_at: new Date().toISOString() }).eq("token", abonne.token);
  }
  return r.ok;
}
