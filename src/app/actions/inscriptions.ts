"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { MAX_PLACES } from "@/lib/evenements";
import { envoyerAnnulationInscription, envoyerConfirmationInscription } from "@/lib/email/inscriptions";
import { limiterDebit } from "@/lib/securite/anti-abus";
import { serviceClient } from "@/lib/supabase/service";

export type EtatInscription = {
  statut: "inactif" | "ok" | "erreur" | "complet";
  message?: string;
  erreurs?: Partial<Record<"nom" | "email" | "places", string>>;
  /** Saisie renvoyée pour ne rien perdre en cas d'erreur. */
  valeurs?: { nom: string; email: string; places: string };
  restantes?: number | null;
};

const schema = z.object({
  event_id: z.uuid(),
  nom: z.string().trim().min(2, { error: "Indiquez votre prénom et votre nom." }).max(120, { error: "120 caractères maximum." }),
  email: z.email({ error: "Cette adresse e-mail semble incomplète (exemple : prenom@exemple.fr)." }).max(254),
  places: z.coerce.number().int().min(1).max(MAX_PLACES, { error: `${MAX_PLACES} personnes au maximum par inscription.` }),
  site_web: z.string().max(0),
});

export async function inscrireEvenement(slug: string, _: EtatInscription, fd: FormData): Promise<EtatInscription> {
  const valeurs = { nom: String(fd.get("nom") ?? ""), email: String(fd.get("email") ?? "").trim(), places: String(fd.get("places") ?? "1") };
  const r = schema.safeParse({ ...valeurs, event_id: fd.get("event_id"), site_web: String(fd.get("site_web") ?? "") });
  if (!r.success) {
    const erreurs: EtatInscription["erreurs"] = {};
    for (const i of r.error.issues) {
      const champ = String(i.path[0]);
      if (champ === "site_web") return { statut: "ok" }; // robot : succès simulé
      if (champ === "nom" || champ === "email" || champ === "places") erreurs[champ] ??= i.message;
    }
    return { statut: "erreur", message: "Merci de vérifier les champs signalés.", erreurs, valeurs };
  }

  if (!(await limiterDebit("inscription", 8, 3600))) {
    return { statut: "erreur", message: "Plusieurs inscriptions viennent d'être envoyées depuis cet appareil : réessayez dans une heure.", valeurs };
  }

  const { data, error } = await serviceClient().rpc("inscrire_evenement", {
    p_event_id: r.data.event_id,
    p_nom: r.data.nom,
    p_email: r.data.email.toLowerCase(),
    p_places: r.data.places,
  });
  const res = data?.[0];
  if (error || !res) {
    console.error(`inscrireEvenement : échec (${error?.code ?? "sans résultat"})`);
    return { statut: "erreur", message: "L'inscription n'a pas abouti. Réessayez dans un instant.", valeurs };
  }

  if (res.statut === "ferme") return { statut: "erreur", message: "Les inscriptions à cet événement sont fermées.", valeurs };
  if (res.statut === "complet") {
    const n = res.restantes ?? 0;
    return {
      statut: n > 0 ? "erreur" : "complet",
      message: n > 0 ? `Il ne reste que ${n} place${n > 1 ? "s" : ""} : réduisez le nombre de personnes.` : "C'est complet, désolé ! Les dernières places viennent de partir.",
      erreurs: n > 0 ? { places: `${n} place${n > 1 ? "s" : ""} restante${n > 1 ? "s" : ""}.` } : undefined,
      valeurs,
      restantes: n,
    };
  }

  // « deja » : on renvoie simplement l'e-mail avec le lien de gestion. La réponse
  // est la même que pour une nouvelle inscription (personne ne peut savoir qui est inscrit).
  if (res.token) await envoyerConfirmationInscription(res.token);
  if (res.statut === "ok") updateTag(`evenement:${slug}`);
  return { statut: "ok", restantes: res.statut === "ok" ? res.restantes : undefined };
}

// ---------------------------------------------------------------------------
// Lien « modifier ou annuler » (jeton reçu par e-mail)
// ---------------------------------------------------------------------------
const jeton = z.uuid();

async function slugParJeton(token: string) {
  const { data } = await serviceClient().from("event_registrations").select("events!inner(slug)").eq("token", token).maybeSingle();
  return (data?.events as { slug: string } | undefined)?.slug ?? null;
}

export async function changerPlaces(token: string, fd: FormData) {
  if (!jeton.safeParse(token).success) redirect("/evenements");
  const places = z.coerce.number().int().min(1).max(MAX_PLACES).safeParse(fd.get("places"));
  if (!places.success) redirect(`/evenements/inscription/${token}?r=invalide`);
  const { data } = await serviceClient().rpc("modifier_inscription", { p_token: token, p_places: places.data });
  const slug = await slugParJeton(token);
  if (data === "ok" && slug) updateTag(`evenement:${slug}`);
  redirect(`/evenements/inscription/${token}?r=${data ?? "erreur"}`);
}

export async function annulerInscription(token: string) {
  if (!jeton.safeParse(token).success) redirect("/evenements");
  const { data } = await serviceClient()
    .from("event_registrations")
    .update({ status: "annulee", cancelled_at: new Date().toISOString() })
    .eq("token", token)
    .eq("status", "confirmee")
    .select("id");
  if (data?.length) {
    await envoyerAnnulationInscription(token);
    const slug = await slugParJeton(token);
    if (slug) updateTag(`evenement:${slug}`);
  }
  redirect(`/evenements/inscription/${token}?r=annulee`);
}
