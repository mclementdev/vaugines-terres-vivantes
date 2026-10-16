import "server-only";

import { getReglages } from "@/lib/data/site";
import { envoyerEmail } from "@/lib/email/envoyer";
import { emailLienConnexion } from "@/lib/email/modeles-comptes";
import { urlSite } from "@/lib/email/modeles";
import { serviceClient } from "@/lib/supabase/service";

/**
 * Lien personnel (valable une heure, une seule fois) qui ouvre une session et
 * mène au choix du mot de passe. Généré côté serveur : aucun e-mail Supabase.
 */
export async function genererLienConnexion(email: string) {
  const { data, error } = await serviceClient().auth.admin.generateLink({ type: "recovery", email });
  if (error) throw error;
  return `${urlSite()}/auth/confirm?token_hash=${data.properties.hashed_token}&type=recovery&next=/admin/mot-de-passe`;
}

/** Envoie le lien par e-mail si l'envoi est configuré ; renvoie toujours le lien. */
export async function transmettreLienConnexion(d: { email: string; prenom: string; nouveau: boolean }) {
  const lien = await genererLienConnexion(d.email);
  const { html, texte } = await emailLienConnexion(await getReglages(), { prenom: d.prenom, lien, nouveau: d.nouveau });
  const envoi = await envoyerEmail({
    modele: "lien-connexion",
    a: d.email,
    sujet: d.nouveau ? "Votre accès à l'administration — vaugines, terres vivantes" : "Votre lien pour choisir un mot de passe",
    html,
    texte,
  });
  return { lien, envoye: envoi.ok };
}
