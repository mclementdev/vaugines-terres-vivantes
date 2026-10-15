import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { clientSession } from "@/lib/supabase/serveur";

export type Admin = {
  id: string;
  email: string;
  prenom: string;
  nom: string;
  role: "superadmin" | "admin";
};

/** Utilisateur connecté et son profil d'administration (null sinon). Une lecture par requête. */
export const adminConnecte = cache(async (): Promise<Admin | null> => {
  const supabase = await clientSession();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: profil } = await supabase
    .from("profiles")
    .select("prenom, nom, role")
    .eq("id", data.user.id)
    .maybeSingle();
  if (!profil) return null;
  return { id: data.user.id, email: data.user.email ?? "", ...profil };
});

/** À appeler en tête de chaque page et action d'administration. */
export async function exigerAdmin(): Promise<Admin> {
  const admin = await adminConnecte();
  if (!admin) redirect("/admin/connexion");
  return admin;
}

export async function exigerSuperadmin(): Promise<Admin> {
  const admin = await exigerAdmin();
  if (admin.role !== "superadmin") redirect("/admin?refus=superadmin");
  return admin;
}
