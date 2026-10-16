"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { exigerAdmin } from "@/lib/auth";
import { limiterDebit } from "@/lib/securite/anti-abus";
import { clientSession } from "@/lib/supabase/serveur";

export type EtatConnexion = { statut: "inactif" | "erreur"; message?: string; email?: string };

/**
 * Connexion par adresse e-mail et mot de passe. Même message que l'adresse soit
 * connue ou non, pour ne pas révéler qui administre le site.
 */
export async function connecter(_: EtatConnexion, formData: FormData): Promise<EtatConnexion> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const motDePasse = String(formData.get("mot_de_passe") ?? "");
  if (!z.email().safeParse(email).success || !motDePasse) {
    return { statut: "erreur", message: "Saisissez votre adresse e-mail et votre mot de passe.", email };
  }
  if (!(await limiterDebit("connexion", 10, 900))) {
    return { statut: "erreur", message: "Trop de tentatives : réessayez dans un quart d'heure.", email };
  }
  const supabase = await clientSession();
  const { error } = await supabase.auth.signInWithPassword({ email, password: motDePasse });
  if (error) return { statut: "erreur", message: "Adresse e-mail ou mot de passe incorrect.", email };
  redirect("/admin");
}

export type EtatMotDePasse = { statut: "inactif" | "ok" | "erreur"; message?: string; erreurs?: { mot_de_passe?: string; confirmation?: string } };

/** Choix ou changement du mot de passe de la personne connectée. */
export async function changerMotDePasse(_: EtatMotDePasse, formData: FormData): Promise<EtatMotDePasse> {
  await exigerAdmin();
  const motDePasse = String(formData.get("mot_de_passe") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  if (motDePasse.length < 12) return { statut: "erreur", erreurs: { mot_de_passe: "12 caractères au minimum." } };
  if (motDePasse.length > 72) return { statut: "erreur", erreurs: { mot_de_passe: "72 caractères au maximum." } };
  if (motDePasse !== confirmation) return { statut: "erreur", erreurs: { confirmation: "Les deux saisies ne correspondent pas." } };
  const supabase = await clientSession();
  const { error } = await supabase.auth.updateUser({ password: motDePasse });
  if (error) {
    const message = error.code === "same_password" ? "Choisissez un mot de passe différent de l'actuel." : error.code === "weak_password" ? "Mot de passe trop faible : allongez-le ou variez les caractères." : "Le mot de passe n'a pas pu être enregistré. Réessayez.";
    return { statut: "erreur", message };
  }
  return { statut: "ok", message: "Mot de passe enregistré. Utilisez-le à votre prochaine connexion." };
}

export async function seDeconnecter() {
  const supabase = await clientSession();
  await supabase.auth.signOut();
  redirect("/admin/connexion?deconnecte=1");
}
