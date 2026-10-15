import "server-only";

import { getReglages } from "@/lib/data/site";
import { serviceClient } from "@/lib/supabase/service";

import { envoyerEmail } from "./envoyer";
import { urlSite } from "./modeles";
import { emailAlerteModeration, emailAvancement, emailIdeeModification, emailIdeePubliee, emailIdeeRecue, emailIdeeRefusee } from "./modeles-idees";

async function chargerIdee(id: string) {
  const { data } = await serviceClient()
    .from("ideas")
    .select("id, slug, titre, display_name, author_email, moderation_note, edit_token, progress")
    .eq("id", id)
    .maybeSingle();
  return data;
}

const lienIdee = (slug: string) => `${urlSite()}/idees/${slug}`;

/** Accusé de réception à l'auteur. */
export async function envoyerIdeeRecue(id: string) {
  const i = await chargerIdee(id);
  if (!i?.author_email) return false;
  const { html, texte } = await emailIdeeRecue(await getReglages(), { prenom: i.display_name, titre: i.titre });
  return (await envoyerEmail({ modele: "idee-recue", a: i.author_email, sujet: "Merci pour votre idée !", html, texte })).ok;
}

/** Alerte à l'équipe (adresse « alertes » des paramètres). */
export async function alerterModeration(d: { quoi: string; titre: string; extrait: string }) {
  const { data } = await serviceClient().from("private_settings").select("data").eq("id", 1).single();
  const a = (data?.data as { email_alertes?: string } | null)?.email_alertes;
  if (!a) return;
  const extrait = d.extrait.length > 280 ? `${d.extrait.slice(0, 280)}…` : d.extrait;
  const { html, texte } = await emailAlerteModeration(await getReglages(), { ...d, extrait, lien: `${urlSite()}/admin/moderation` });
  await envoyerEmail({ modele: "alerte-moderation", a, sujet: `${d.quoi} : ${d.titre}`, html, texte });
}

/** Décision de modération envoyée à l'auteur. */
export async function envoyerDecision(id: string, decision: "publiee" | "modification" | "refusee") {
  const i = await chargerIdee(id);
  if (!i?.author_email) return false;
  const r = await getReglages();
  const base = { prenom: i.display_name, titre: i.titre };
  const { html, texte } =
    decision === "publiee"
      ? await emailIdeePubliee(r, { ...base, lien: lienIdee(i.slug) })
      : decision === "modification"
        ? await emailIdeeModification(r, { ...base, motif: i.moderation_note ?? "", lien: `${urlSite()}/idees/modifier/${i.edit_token}` })
        : await emailIdeeRefusee(r, { ...base, motif: i.moderation_note ?? "" });
  const sujet = { publiee: "Votre idée est en ligne !", modification: "Votre idée : une petite modification", refusee: "À propos de votre idée" }[decision];
  return (await envoyerEmail({ modele: `idee-${decision}`, a: i.author_email, sujet, html, texte })).ok;
}

/** Avancement : l'auteur et les personnes qui suivent l'idée sont prévenus. */
export async function envoyerAvancement(id: string) {
  const i = await chargerIdee(id);
  if (!i) return 0;
  const r = await getReglages();
  const { data: suiveurs } = await serviceClient().from("idea_followers").select("email, token").eq("idea_id", id);
  const destinataires = [
    ...(i.author_email ? [{ email: i.author_email.toLowerCase(), arret: null as string | null }] : []),
    ...(suiveurs ?? []).filter((s) => s.email !== i.author_email?.toLowerCase()).map((s) => ({ email: s.email, arret: `${urlSite()}/idees/suivi/${s.token}` })),
  ];
  let n = 0;
  for (const d of destinataires) {
    const { html, texte } = await emailAvancement(r, { titre: i.titre, etape: i.progress, lien: lienIdee(i.slug), lienArret: d.arret });
    if ((await envoyerEmail({ modele: "idee-avancement", a: d.email, sujet: `Des nouvelles de l'idée « ${i.titre} »`, html, texte })).ok) n++;
  }
  return n;
}
