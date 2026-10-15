import "server-only";

import { getReglages } from "@/lib/data/site";
import { jour, plageHoraire } from "@/lib/dates";
import { serviceClient } from "@/lib/supabase/service";

import { envoyerEmail } from "./envoyer";
import { emailAnnulationInscription, emailConfirmationInscription, emailRappelEvenement, type DonneesEvenementEmail } from "./modeles-evenements";
import { urlSite } from "./modeles";

const CHAMPS = "nom, email, places, token, events!inner(slug, titre, starts_at, ends_at, all_day, date_label, lieu, adresse)";

type Inscription = {
  nom: string;
  email: string;
  places: number;
  token: string;
  events: { slug: string; titre: string; starts_at: string | null; ends_at: string | null; all_day: boolean; date_label: string | null; lieu: string; adresse: string | null };
};

/** « Samedi 24 octobre, 10 h – 12 h » ou le libellé libre de l'événement. */
export function quandEvenement(e: Inscription["events"]) {
  if (!e.starts_at) return e.date_label ?? "date à préciser";
  return `${jour(e.starts_at)}, ${plageHoraire(e.starts_at, e.ends_at, e.all_day)}`;
}

function donnees(i: Inscription): DonneesEvenementEmail {
  const base = urlSite();
  return {
    prenom: i.nom.trim().split(/\s+/)[0],
    titre: i.events.titre,
    quand: quandEvenement(i.events),
    lieu: i.events.lieu,
    adresse: i.events.adresse,
    places: i.places,
    lienGestion: `${base}/evenements/inscription/${i.token}`,
    lienEvenement: `${base}/evenements/${i.events.slug}`,
    lienAgenda: i.events.starts_at ? `${base}/evenements/${i.events.slug}/agenda.ics` : null,
  };
}

async function charger(token: string) {
  const { data } = await serviceClient().from("event_registrations").select(CHAMPS).eq("token", token).maybeSingle();
  return data as unknown as Inscription | null;
}

export async function envoyerConfirmationInscription(token: string) {
  const i = await charger(token);
  if (!i) return false;
  const { html, texte } = await emailConfirmationInscription(await getReglages(), donnees(i));
  const r = await envoyerEmail({ modele: "inscription", a: i.email, sujet: `Inscription confirmée : ${i.events.titre}`, html, texte });
  return r.ok;
}

export async function envoyerAnnulationInscription(token: string) {
  const i = await charger(token);
  if (!i) return false;
  const { html, texte } = await emailAnnulationInscription(await getReglages(), donnees(i));
  const r = await envoyerEmail({ modele: "annulation-inscription", a: i.email, sujet: `Inscription annulée : ${i.events.titre}`, html, texte });
  return r.ok;
}

/**
 * Rappels de la veille : inscriptions confirmées aux événements qui ont lieu
 * demain (heure de Paris), pas encore rappelées. Appelé une fois par jour.
 */
export async function envoyerRappelsDuLendemain() {
  const db = serviceClient();
  const cle = (d: Date) => d.toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" });
  const demain = cle(new Date(Date.now() + 86400_000));
  // Fenêtre large (48 h) puis filtre exact sur le jour de Paris.
  const { data } = await db
    .from("event_registrations")
    .select(CHAMPS)
    .eq("status", "confirmee")
    .is("reminder_sent_at", null)
    .gte("events.starts_at", new Date().toISOString())
    .lte("events.starts_at", new Date(Date.now() + 2 * 86400_000).toISOString());
  const aRappeler = ((data ?? []) as unknown as Inscription[]).filter((i) => i.events.starts_at && cle(new Date(i.events.starts_at)) === demain);

  const reglages = await getReglages();
  let envoyes = 0;
  for (const i of aRappeler) {
    const { html, texte } = await emailRappelEvenement(reglages, donnees(i));
    const r = await envoyerEmail({ modele: "rappel-evenement", a: i.email, sujet: `C'est demain : ${i.events.titre}`, html, texte });
    if (r.ok) {
      await db.from("event_registrations").update({ reminder_sent_at: new Date().toISOString() }).eq("token", i.token);
      envoyes++;
    }
  }
  return { aRappeler: aRappeler.length, envoyes };
}

/** Effacement des inscriptions un mois après la fin de l'événement (minimisation des données). */
export async function effacerInscriptionsAnciennes() {
  const limite = new Date(Date.now() - 30 * 86400_000).toISOString();
  const db = serviceClient();
  const { data: anciens } = await db.from("events").select("id").lt("starts_at", limite).or(`ends_at.is.null,ends_at.lt.${limite}`);
  const ids = (anciens ?? []).map((e) => e.id);
  if (ids.length === 0) return 0;
  const { count } = await db.from("event_registrations").delete({ count: "exact" }).in("event_id", ids);
  return count ?? 0;
}
