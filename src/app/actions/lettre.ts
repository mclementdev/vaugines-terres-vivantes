"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { envoyerConfirmationLettre } from "@/lib/email/courriers";
import { limiterDebit } from "@/lib/securite/anti-abus";
import { serviceClient } from "@/lib/supabase/service";

export type EtatLettre = {
  statut: "inactif" | "ok" | "erreur";
  message?: string;
  /** Saisie renvoyée pour ne rien perdre en cas d'erreur. */
  email?: string;
};

const schema = z.object({
  email: z.email({ error: "Cette adresse e-mail semble incomplète (exemple : prenom@exemple.fr)." }).max(254),
  // Champ piège invisible : rempli uniquement par les robots.
  site_web: z.string().max(0).optional(),
});

// Même réponse que l'adresse soit nouvelle, en attente ou déjà inscrite :
// le formulaire ne permet pas de savoir qui est abonné.
const MERCI = "Merci ! Un e-mail de confirmation vous attend : cliquez sur son lien pour valider votre inscription (pensez à regarder dans les indésirables).";

export async function inscrireLettre(_: EtatLettre, formData: FormData): Promise<EtatLettre> {
  const saisie = String(formData.get("email") ?? "").trim();
  const res = schema.safeParse({ email: saisie, site_web: String(formData.get("site_web") ?? "") });
  if (!res.success) {
    const champEmail = res.error.issues.find((i) => i.path[0] === "email");
    // Pour un robot, on simule un succès sans rien enregistrer.
    if (!champEmail) return { statut: "ok", message: MERCI };
    return { statut: "erreur", message: champEmail.message, email: saisie };
  }

  if (!(await limiterDebit("lettre", 5, 3600))) {
    return { statut: "erreur", message: "Plusieurs inscriptions viennent d'être envoyées depuis cet appareil : réessayez dans une heure.", email: saisie };
  }

  const email = res.data.email.toLowerCase();
  const db = serviceClient();
  const { data: abonne, error } = await db.from("newsletter_subscribers").select("id, status, token, confirmation_sent_at").eq("email", email).maybeSingle();
  if (error) return echec(saisie, error.code);

  let token: string;
  if (!abonne) {
    const { data, error: e } = await db.from("newsletter_subscribers").insert({ email, source: "formulaire" }).select("token").single();
    if (e || !data) return echec(saisie, e?.code);
    token = data.token;
  } else if (abonne.status === "active") {
    return { statut: "ok", message: MERCI };
  } else if (abonne.status === "unsubscribed") {
    token = crypto.randomUUID();
    const { error: e } = await db.from("newsletter_subscribers").update({ status: "pending", token, unsubscribed_at: null }).eq("id", abonne.id);
    if (e) return echec(saisie, e.code);
  } else {
    // En attente : on renvoie le lien, au plus une fois toutes les 10 minutes.
    const recent = abonne.confirmation_sent_at && Date.now() - new Date(abonne.confirmation_sent_at).getTime() < 10 * 60_000;
    if (recent) return { statut: "ok", message: MERCI };
    token = abonne.token;
  }

  const envoye = await envoyerConfirmationLettre({ email, token });
  if (!envoye) {
    return { statut: "erreur", message: "L'e-mail de confirmation n'a pas pu partir. Réessayez dans quelques minutes.", email: saisie };
  }
  return { statut: "ok", message: MERCI };
}

function echec(email: string, code?: string): EtatLettre {
  console.error(`inscrireLettre : échec d'enregistrement (${code ?? "inconnu"})`);
  return { statut: "erreur", message: "L'inscription n'a pas abouti. Réessayez dans un instant.", email };
}

// ---------------------------------------------------------------------------
// Liens des e-mails (jeton). Un bouton à cliquer, et non un simple lien suivi,
// pour que les antivirus de messagerie qui ouvrent les liens ne confirment
// ni ne désinscrivent personne à sa place.
// ---------------------------------------------------------------------------
const jeton = z.uuid();

export async function confirmerLettre(token: string) {
  if (!jeton.safeParse(token).success) redirect("/lettre/confirmer/invalide");
  await serviceClient()
    .from("newsletter_subscribers")
    .update({ status: "active", confirmed_at: new Date().toISOString() })
    .eq("token", token)
    .eq("status", "pending");
  redirect(`/lettre/confirmer/${token}`);
}

export async function desinscrireLettre(token: string) {
  if (!jeton.safeParse(token).success) redirect("/lettre/desinscription/invalide");
  await serviceClient()
    .from("newsletter_subscribers")
    .update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() })
    .eq("token", token)
    .neq("status", "unsubscribed");
  redirect(`/lettre/desinscription/${token}`);
}

/** « Je me suis trompé·e » : le jeton prouve la propriété de l'adresse, pas de nouvelle confirmation. */
export async function reinscrireLettre(token: string) {
  if (!jeton.safeParse(token).success) redirect("/lettre/desinscription/invalide");
  await serviceClient()
    .from("newsletter_subscribers")
    .update({ status: "active", unsubscribed_at: null, confirmed_at: new Date().toISOString() })
    .eq("token", token)
    .eq("status", "unsubscribed");
  redirect(`/lettre/desinscription/${token}`);
}
