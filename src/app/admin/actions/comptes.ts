"use server";

import { z } from "zod";

import { erreursZod } from "@/lib/admin/outils";
import { transmettreLienConnexion } from "@/lib/admin/liens-connexion";
import { exigerSuperadmin } from "@/lib/auth";
import { serviceClient } from "@/lib/supabase/service";

export type EtatLien = {
  statut: "inactif" | "ok" | "erreur";
  message?: string;
  erreurs?: Record<string, string>;
  /** Lien de connexion à transmettre, affiché au superadmin. */
  lien?: string;
};

const schemaCompte = z.object({
  email: z.email({ error: "Adresse e-mail invalide." }).transform((e) => e.toLowerCase()),
  prenom: z.string().trim().min(1, { error: "Champ obligatoire." }).max(60),
  nom: z.string().trim().max(60),
  role: z.enum(["admin", "superadmin"]),
});

const resultat = (envoye: boolean, email: string) =>
  envoye ? `Lien envoyé par e-mail à ${email}. Vous pouvez aussi le lui transmettre vous-même :` : `Transmettez ce lien à ${email} (l'envoi d'e-mails n'est pas configuré) :`;

/** Crée un compte d'administration et produit son lien pour choisir un mot de passe. */
export async function creerCompte(_: EtatLien, formData: FormData): Promise<EtatLien> {
  const admin = await exigerSuperadmin();
  const r = schemaCompte.safeParse(Object.fromEntries(formData));
  if (!r.success) return { statut: "erreur", message: "Merci de vérifier les champs signalés.", erreurs: erreursZod(r.error) };
  const d = r.data;
  const service = serviceClient();
  const { data, error } = await service.auth.admin.createUser({ email: d.email, email_confirm: true });
  if (error) {
    return { statut: "erreur", message: error.code === "email_exists" ? "Un compte existe déjà avec cette adresse." : "Le compte n'a pas pu être créé." };
  }
  const { error: e2 } = await service
    .from("profiles")
    .upsert({ id: data.user.id, email: d.email, prenom: d.prenom, nom: d.nom, role: d.role, invited_at: new Date().toISOString() });
  if (e2) return { statut: "erreur", message: "Le compte n'a pas pu être créé." };
  await service.from("audit_log").insert({ actor_id: admin.id, action: "creation_compte", cible: d.email, detail: { role: d.role } });
  const { lien, envoye } = await transmettreLienConnexion({ email: d.email, prenom: d.prenom, nouveau: true });
  return { statut: "ok", message: `Compte créé. ${resultat(envoye, d.email)}`, lien };
}

/** Nouveau lien de connexion pour un compte existant (mot de passe oublié). */
export async function nouveauLien(id: string): Promise<EtatLien> {
  const admin = await exigerSuperadmin();
  if (!z.uuid().safeParse(id).success) return { statut: "erreur", message: "Compte introuvable." };
  const service = serviceClient();
  const { data: profil } = await service.from("profiles").select("email, prenom").eq("id", id).single();
  if (!profil?.email) return { statut: "erreur", message: "Compte introuvable." };
  try {
    const { lien, envoye } = await transmettreLienConnexion({ email: profil.email, prenom: profil.prenom, nouveau: false });
    await service.from("audit_log").insert({ actor_id: admin.id, action: "lien_connexion", cible: profil.email });
    return { statut: "ok", message: resultat(envoye, profil.email), lien };
  } catch {
    return { statut: "erreur", message: "Le lien n'a pas pu être créé." };
  }
}
