"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { erreursZod, type EtatForm } from "@/lib/admin/outils";
import { rafraichir } from "@/lib/admin/revalider";
import { exigerAdmin, exigerSuperadmin } from "@/lib/auth";
import { TAGS } from "@/lib/data/tags";
import { clientSession } from "@/lib/supabase/serveur";
import { serviceClient } from "@/lib/supabase/service";
import type { Json } from "@/lib/supabase/types";

const OK = (message = "Enregistré.") => ({ statut: "ok" as const, message, enregistreLe: new Date().toISOString() });
const KO = (e: z.ZodError): EtatForm => ({ statut: "erreur", message: "Merci de vérifier les champs signalés.", erreurs: erreursZod(e) });
const ECHEC: EtatForm = { statut: "erreur", message: "L'enregistrement a échoué. Réessayez." };

const t = (max: number, min = 1) => z.string().trim().min(min, { error: "Champ obligatoire." }).max(max, { error: `${max} caractères maximum.` });
const liste = z.array(t(220)).min(1).max(6);

// ---------------------------------------------------------------------------
// Textes de l'accueil (home_blocks)
// ---------------------------------------------------------------------------
const SCHEMAS_BLOCS = {
  hero: z.object({ surtitre: t(120), titre: t(60), titre_accent: t(40), texte: t(300), note: t(160, 0) }),
  association: z.object({
    surtitre: t(40),
    titre: t(140),
    paragraphes: z.array(t(600)).min(1).max(4),
    piliers: z
      .array(z.object({ numero: t(30), titre: t(60), texte: t(200), image: t(300), alt: t(160) }))
      .length(3),
  }),
  nom: z.object({ surtitre: t(40), terres: liste, vivantes: liste }),
  gouvernance: z.object({ surtitre: t(40), titre: t(80), texte: t(500), commissions: t(200), titre_conseil: t(60), note_portraits: t(120, 0) }),
  idees: z.object({ surtitre: t(40), titre: t(100), texte: t(300) }),
  appel: z.object({ titre: t(60), titre_suite: t(80), texte: t(300), bouton: t(40) }),
  lettre: z.object({ titre: t(60), texte: t(200), mention: t(160) }),
} as const;
export type CleBloc = keyof typeof SCHEMAS_BLOCS;

export async function enregistrerBloc(cle: CleBloc, contenu: unknown): Promise<EtatForm> {
  await exigerAdmin();
  const schema = SCHEMAS_BLOCS[cle];
  if (!schema) return ECHEC;
  const r = schema.safeParse(contenu);
  if (!r.success) return KO(r.error);
  const supabase = await clientSession();
  const { error } = await supabase.from("home_blocks").update({ content: r.data as NonNullable<Json> }).eq("key", cle);
  if (error) return ECHEC;
  rafraichir(TAGS.accueil);
  return OK("Texte enregistré et en ligne.");
}

// ---------------------------------------------------------------------------
// Conseil collégial
// ---------------------------------------------------------------------------
const schemaMembre = z.object({ prenom: t(60), nom: t(60), role: t(80, 0), position: z.coerce.number().int().min(0).max(99) });

export async function enregistrerMembre(id: string | null, _: EtatForm, formData: FormData): Promise<EtatForm> {
  await exigerAdmin();
  const r = schemaMembre.safeParse(Object.fromEntries(formData));
  if (!r.success) return KO(r.error);
  const d = r.data;
  const ligne = { prenom: d.prenom, nom: d.nom, role: d.role || null, position: d.position };
  const supabase = await clientSession();
  const { error } = id ? await supabase.from("council_members").update(ligne).eq("id", id) : await supabase.from("council_members").insert(ligne);
  if (error) return ECHEC;
  rafraichir(TAGS.conseil, TAGS.accueil);
  return OK(id ? "Membre enregistré." : "Membre ajouté.");
}

export async function supprimerMembre(id: string) {
  await exigerAdmin();
  const supabase = await clientSession();
  await supabase.from("council_members").delete().eq("id", id);
  rafraichir(TAGS.conseil, TAGS.accueil);
  redirect("/admin/accueil#conseil");
}

// ---------------------------------------------------------------------------
// Paramètres du site (superadmin)
// ---------------------------------------------------------------------------
const chiffre = z.object({ valeur: z.union([z.literal(""), z.coerce.number().int().min(0)]), visible: z.boolean() });
const schemaReglages = z.object({
  adresse: z.object({ lieu: t(80), rue: t(80), code_postal: t(10), commune: t(60) }),
  email: z.email({ error: "Adresse e-mail invalide." }),
  virement: z.object({
    titulaire: t(80),
    iban: t(42).refine((v) => /^[A-Z]{2}\d{2}[A-Z0-9 ]{10,38}$/.test(v.replace(/\s+/g, " ").toUpperCase()), { error: "IBAN invalide." }),
    bic: z.string().trim().max(11).refine((v) => !v || /^[A-Z0-9]{8}([A-Z0-9]{3})?$/.test(v.toUpperCase()), { error: "BIC invalide." }),
  }),
  reseaux: z.object({
    facebook: z.union([z.literal(""), z.url({ error: "Lien invalide." })]),
    instagram: z.union([z.literal(""), z.url({ error: "Lien invalide." })]),
  }),
  chiffres: z.object({ adherents: chiffre, actions: chiffre, rendez_vous: chiffre, conseil: chiffre }),
  signature_email: t(80),
  email_alertes: z.email({ error: "Adresse e-mail invalide." }),
});
export type DonneesReglages = z.input<typeof schemaReglages>;

export async function enregistrerReglages(donnees: DonneesReglages): Promise<EtatForm> {
  const admin = await exigerSuperadmin();
  const r = schemaReglages.safeParse(donnees);
  if (!r.success) return KO(r.error);
  const d = r.data;
  const supabase = await clientSession();
  const { data: actuel } = await supabase.from("site_settings").select("data").eq("id", 1).single();
  const fusion = {
    ...(actuel?.data as Record<string, Json>),
    adresse: d.adresse,
    email: d.email,
    virement: { ...d.virement, iban: d.virement.iban.toUpperCase().replace(/\s+/g, "").replace(/(.{4})/g, "$1 ").trim(), bic: d.virement.bic.toUpperCase() },
    reseaux: { facebook: d.reseaux.facebook || null, instagram: d.reseaux.instagram || null },
    chiffres: Object.fromEntries(Object.entries(d.chiffres).map(([k, v]) => [k, { valeur: v.valeur === "" ? null : v.valeur, visible: v.visible }])),
    signature_email: d.signature_email,
  };
  const [a, b] = await Promise.all([
    supabase.from("site_settings").update({ data: fusion as NonNullable<Json> }).eq("id", 1),
    supabase.from("private_settings").update({ data: { email_alertes: d.email_alertes } }).eq("id", 1),
  ]);
  if (a.error || b.error) return ECHEC;
  await supabase.from("audit_log").insert({ actor_id: admin.id, action: "parametres", detail: { champs: Object.keys(d) } });
  rafraichir(TAGS.reglages, TAGS.accueil, TAGS.statuts);
  return OK("Paramètres enregistrés.");
}

// ---------------------------------------------------------------------------
// Comptes (superadmin)
// ---------------------------------------------------------------------------
export async function changerRole(id: string, role: "admin" | "superadmin") {
  const admin = await exigerSuperadmin();
  const supabase = await clientSession();
  const { error } = await supabase.from("profiles").update({ role }).eq("id", id);
  if (!error) await supabase.from("audit_log").insert({ actor_id: admin.id, action: "changement_role", cible: id, detail: { role } });
  redirect(error ? "/admin/comptes?erreur=dernier-superadmin" : "/admin/comptes?ok=role");
}

/** Retire l'accès : supprime le compte d'authentification (le profil suit). */
export async function retirerAcces(id: string) {
  const admin = await exigerSuperadmin();
  if (id === admin.id) redirect("/admin/comptes?erreur=soi-meme");
  const service = serviceClient();
  const { data: profil } = await service.from("profiles").select("email, role").eq("id", id).single();
  if (profil?.role === "superadmin") {
    const { count } = await service.from("profiles").select("id", { count: "exact", head: true }).eq("role", "superadmin");
    if ((count ?? 0) <= 1) redirect("/admin/comptes?erreur=dernier-superadmin");
  }
  const { error } = await service.auth.admin.deleteUser(id);
  if (!error) await service.from("audit_log").insert({ actor_id: admin.id, action: "retrait_acces", cible: profil?.email ?? id });
  redirect(error ? "/admin/comptes?erreur=retrait-echec" : "/admin/comptes?ok=retrait");
}

/** Purge des exemples fictifs des maquettes (avant mise en ligne). */
export async function purgerExemples() {
  await exigerSuperadmin();
  const supabase = await clientSession();
  const { error } = await supabase.rpc("purger_exemples");
  rafraichir(...Object.values(TAGS));
  redirect(error ? "/admin/comptes?erreur=purge-echec" : "/admin/comptes?ok=purge");
}
