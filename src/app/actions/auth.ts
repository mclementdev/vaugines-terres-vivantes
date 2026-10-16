"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { limiterDebit } from "@/lib/securite/anti-abus";
import { clientSession } from "@/lib/supabase/serveur";

export type EtatConnexion = { statut: "inactif" | "envoye" | "erreur"; message?: string; email?: string };

/**
 * Envoie un lien magique. Même réponse que l'adresse soit connue ou non, pour
 * ne pas révéler qui administre le site. Aucune création de compte possible.
 */
export async function demanderLien(_: EtatConnexion, formData: FormData): Promise<EtatConnexion> {
  const email = String(formData.get("email") ?? "").trim();
  if (!z.email().safeParse(email).success) {
    return { statut: "erreur", message: "Cette adresse e-mail semble incomplète.", email };
  }
  if (!(await limiterDebit("connexion", 5, 900))) {
    return { statut: "erreur", message: "Trop de demandes : réessayez dans un quart d'heure.", email };
  }
  const supabase = await clientSession();
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: `${site}/auth/confirm?next=/admin` } });
  return { statut: "envoye", email };
}

export async function seDeconnecter() {
  const supabase = await clientSession();
  await supabase.auth.signOut();
  redirect("/admin/connexion?deconnecte=1");
}
