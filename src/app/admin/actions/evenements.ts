"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { nettoyerHtml } from "@/lib/admin/html";
import { erreursZod, parisVersIso, slugifier, type EtatForm } from "@/lib/admin/outils";
import { calculerPublication, schemaPublication } from "@/lib/admin/publication";
import { rafraichir } from "@/lib/admin/revalider";
import { exigerAdmin } from "@/lib/auth";
import { TAGS } from "@/lib/data/tags";
import { clientSession } from "@/lib/supabase/serveur";
import type { Database, Json } from "@/lib/supabase/types";

type MajEvenement = Database["public"]["Tables"]["events"]["Update"];

export async function creerEvenement() {
  await exigerAdmin();
  const supabase = await clientSession();
  const { data, error } = await supabase
    .from("events")
    .insert({ titre: "", slug: `brouillon-${crypto.randomUUID().slice(0, 8)}`, date_label: "Date à confirmer" })
    .select("id")
    .single();
  if (error) throw new Error("Impossible de créer l'événement.");
  redirect(`/admin/evenements/${data.id}`);
}

const nombreOuNull = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : Number(v.replace(",", "."))))
  .refine((v) => v === null || Number.isFinite(v), { error: "Nombre attendu." });

const schemaEvenement = z.object({
  titre: z.string().trim().min(3, { error: "Donnez un titre à l'événement." }).max(160),
  slug: z.string().trim().max(80),
  resume: z.string().trim().max(400),
  corpsJson: z.unknown(),
  corpsHtml: z.string().max(100_000),
  debut: z.string(),
  fin: z.string(),
  journee: z.boolean(),
  dateLibelle: z.string().trim().max(80),
  lieu: z.string().trim().min(2, { error: "Indiquez le lieu." }).max(120),
  adresse: z.string().trim().max(200),
  latitude: nombreOuNull.refine((v) => v === null || (v >= -90 && v <= 90), { error: "Latitude invalide." }),
  longitude: nombreOuNull.refine((v) => v === null || (v >= -180 && v <= 180), { error: "Longitude invalide." }),
  prix: z.string().trim().min(1, { error: "Indiquez le prix (ou « Gratuit »)." }).max(80),
  capacite: nombreOuNull.refine((v) => v === null || (Number.isInteger(v) && v > 0), { error: "Nombre de places entier et positif." }),
  programme: z.array(z.object({ heure: z.string().trim().max(20), texte: z.string().trim().max(200) })).max(20),
  accessibilite: z.string().trim().max(400),
  ouvertATous: z.boolean(),
  inscription: z.boolean(),
  coverPath: z.string().max(300).nullable(),
  coverAlt: z.string().trim().max(200),
  featured: z.boolean(),
  publication: schemaPublication,
});
export type DonneesEvenement = z.input<typeof schemaEvenement>;

export async function enregistrerEvenement(id: string, donnees: DonneesEvenement): Promise<EtatForm> {
  await exigerAdmin();
  const res = schemaEvenement.safeParse(donnees);
  if (!res.success) return { statut: "erreur", message: "Merci de vérifier les champs signalés.", erreurs: erreursZod(res.error) };
  const d = res.data;

  const erreurs: Record<string, string> = {};
  const debut = d.debut ? parisVersIso(d.debut) : null;
  const fin = d.fin ? parisVersIso(d.fin) : null;
  if (!debut && !d.dateLibelle) erreurs.debut = "Indiquez une date, ou un libellé comme « 2027 · date à confirmer ».";
  if (debut && fin && new Date(fin) < new Date(debut)) erreurs.fin = "La fin doit être après le début.";
  if (d.coverPath && !d.coverAlt) erreurs.coverAlt = "Le texte alternatif de l'image est obligatoire.";
  if ((d.latitude === null) !== (d.longitude === null)) erreurs.latitude = "Renseignez latitude et longitude, ou aucune des deux.";
  const slug = slugifier(d.slug || d.titre);

  const supabase = await clientSession();
  const { data: actuel } = await supabase.from("events").select("status, published_at, slug").eq("id", id).single();
  if (!actuel) return { statut: "erreur", message: "Événement introuvable." };
  const pub = calculerPublication(d.publication, actuel);
  if ("erreur" in pub) erreurs.publication = pub.erreur;
  if (Object.keys(erreurs).length > 0 || "erreur" in pub) return { statut: "erreur", message: "Merci de vérifier les champs signalés.", erreurs };

  const maj: MajEvenement = {
    titre: d.titre,
    slug,
    resume: d.resume,
    body_json: (d.corpsJson ?? null) as Json,
    body_html: nettoyerHtml(d.corpsHtml),
    starts_at: debut,
    ends_at: fin,
    all_day: d.journee,
    date_label: d.dateLibelle || null,
    lieu: d.lieu,
    adresse: d.adresse || null,
    latitude: d.latitude,
    longitude: d.longitude,
    prix: d.prix,
    capacity: d.capacite,
    programme: d.programme.filter((p) => p.heure || p.texte) as NonNullable<Json>,
    accessibilite: d.accessibilite || null,
    ouvert_a_tous: d.ouvertATous,
    registration_enabled: d.inscription,
    cover_path: d.coverPath,
    cover_alt: d.coverAlt || null,
    featured: d.featured,
    ...pub,
  };

  const { error } = await supabase.from("events").update(maj).eq("id", id);
  if (error) {
    if (error.code === "23505") return { statut: "erreur", message: "Cette adresse est déjà utilisée.", erreurs: { slug: "Adresse déjà utilisée." } };
    return { statut: "erreur", message: "L'enregistrement a échoué. Réessayez." };
  }
  rafraichir(TAGS.evenements, TAGS.accueil, `evenement:${actuel.slug}`, `evenement:${slug}`);
  return {
    statut: "ok",
    message:
      pub.status === "draft"
        ? "Brouillon enregistré."
        : new Date(pub.published_at!) > new Date()
          ? "Publication programmée."
          : actuel.status === "published" && actuel.published_at === pub.published_at
            ? "Modifications enregistrées et en ligne."
            : "Événement publié.",
    enregistreLe: new Date().toISOString(),
  };
}

export async function mettreEvenementCorbeille(id: string) {
  await exigerAdmin();
  const supabase = await clientSession();
  const { data } = await supabase.from("events").update({ status: "trashed" }).eq("id", id).select("slug").single();
  rafraichir(TAGS.evenements, TAGS.accueil, `evenement:${data?.slug ?? ""}`);
  redirect("/admin/evenements?corbeille=1");
}

export async function restaurerEvenement(id: string) {
  await exigerAdmin();
  const supabase = await clientSession();
  await supabase.from("events").update({ status: "draft", published_at: null }).eq("id", id);
  redirect(`/admin/evenements/${id}`);
}

export async function supprimerEvenement(id: string) {
  const admin = await exigerAdmin();
  const supabase = await clientSession();
  const { data } = await supabase.from("events").delete().eq("id", id).eq("status", "trashed").select("titre").maybeSingle();
  if (data) await supabase.from("audit_log").insert({ actor_id: admin.id, action: "suppression_evenement", cible: data.titre });
  redirect("/admin/evenements?vue=corbeille");
}
