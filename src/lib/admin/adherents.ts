import "server-only";

import { clientSession } from "@/lib/supabase/serveur";

/** Onglets du CRM. */
export const VUES = [
  { cle: "tous", libelle: "Tous" },
  { cle: "payee", libelle: "Cotisation payée" },
  { cle: "attendue", libelle: "Virement attendu" },
  { cle: "sans", libelle: "Sans cotisation" },
  { cle: "ag", libelle: "À valider en AG" },
] as const;
export type Vue = (typeof VUES)[number]["cle"];

export const PAR_PAGE = 25;

export type Filtres = { vue: Vue; periode: string; q: string; page: number };

type Client = Awaited<ReturnType<typeof clientSession>>;

/** Lit et normalise les paramètres d'URL du CRM. */
export function lireFiltres(sp: Record<string, string | string[] | undefined>, periodeCourante: string | undefined): Filtres {
  const un = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const vue = VUES.some((v) => v.cle === un(sp.vue)) ? (un(sp.vue) as Vue) : "tous";
  return {
    vue,
    periode: un(sp.periode) || periodeCourante || "toutes",
    q: un(sp.q).trim().slice(0, 80),
    page: Math.max(1, Number.parseInt(un(sp.page), 10) || 1),
  };
}

/** Requête de base de la vue du CRM, filtrée par année d'AG, onglet et recherche. */
export function requeteAdherents(supabase: Client, f: Omit<Filtres, "page">, options?: { compter?: boolean; colonnes?: string }) {
  let q = supabase
    .from("adherents_vue")
    .select(options?.colonnes ?? "*", options?.compter ? { count: "exact", head: true } : { count: "exact" });
  if (f.periode !== "toutes") q = q.eq("period_id", f.periode);
  if (f.vue === "payee" || f.vue === "attendue" || f.vue === "sans") q = q.eq("status", f.vue);
  if (f.vue === "ag") q = q.is("ag_validated_on", null);
  if (f.q) {
    // Caractères réservés de la syntaxe de filtre PostgREST retirés de la recherche.
    const terme = f.q.replace(/[,()%*\\:."']/g, " ").trim();
    if (terme) q = q.or(`nom.ilike.%${terme}%,prenom.ilike.%${terme}%,email.ilike.%${terme}%,commune.ilike.%${terme}%`);
  }
  return q;
}

export async function getPeriodes(supabase: Client) {
  const { data } = await supabase.from("ag_periods").select("id, label, starts_on, ends_on, is_current").order("starts_on", { ascending: false });
  return data ?? [];
}

/** Nombre de lignes de chaque onglet (pour l'année et la recherche choisies). */
export async function compterVues(supabase: Client, f: Filtres) {
  const resultats = await Promise.all(VUES.map((v) => requeteAdherents(supabase, { ...f, vue: v.cle }, { compter: true })));
  return Object.fromEntries(VUES.map((v, i) => [v.cle, resultats[i].count ?? 0])) as Record<Vue, number>;
}

/** Fiche complète d'un adhérent. */
export async function getFiche(supabase: Client, id: string) {
  const [membre, cotisations, presence, historique] = await Promise.all([
    supabase
      .from("members")
      .select("id, prenom, nom, email, adresse, code_postal, commune, source, joined_at, ag_validated_on, welcome_sent_at, notes, consent_statuts_at, consent_donnees_at, is_sample")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("contributions")
      .select("id, mode, status, amount_cents, payment_method, paid_on, last_reminder_at, reminders_count, ag_periods(id, label, is_current, starts_on)")
      .eq("member_id", id),
    supabase.rpc("member_private_presence", { p_member_id: id }),
    supabase.from("member_history").select("id, event, detail, created_at, profiles(prenom, nom)").eq("member_id", id).order("created_at", { ascending: false }).limit(30),
  ]);
  if (!membre.data) return null;
  const lettre = membre.data.email
    ? (await supabase.from("newsletter_subscribers").select("status, confirmed_at").eq("email", membre.data.email).maybeSingle()).data
    : null;
  const tri = (cotisations.data ?? []).sort((a, b) => (b.ag_periods?.starts_on ?? "").localeCompare(a.ag_periods?.starts_on ?? ""));
  return {
    ...membre.data,
    cotisations: tri,
    prive: presence.data?.[0] ?? { has_birth_date: false, has_phone: false },
    historique: historique.data ?? [],
    lettre,
  };
}
export type Fiche = NonNullable<Awaited<ReturnType<typeof getFiche>>>;

/** Libellés de l'historique. */
export function libelleHistorique(event: string, detail: Record<string, unknown>) {
  const montant = typeof detail.montant === "number" ? ` de ${detail.montant} €` : "";
  switch (event) {
    case "adhesion":
      return detail.source === "papier" ? "adhésion sur bulletin papier" : "adhésion en ligne";
    case "adhesion_mise_a_jour":
      return "adhésion mise à jour en ligne (même personne)";
    case "email_bienvenue":
      return "e-mail de bienvenue envoyé, avec les statuts";
    case "email_bienvenue_echec":
      return "échec de l'envoi de l'e-mail de bienvenue";
    case "alerte_conseil":
      return "conseil prévenu par e-mail";
    case "alerte_conseil_echec":
      return "échec de l'alerte au conseil";
    case "relance":
      return "relance de cotisation envoyée";
    case "relance_echec":
      return "échec de l'envoi de la relance";
    case "cotisation_recue":
      return `cotisation${montant} reçue${detail.moyen ? ` (${detail.moyen})` : ""}`;
    case "cotisation_modifiee":
      return "cotisation modifiée";
    case "validation_ag":
      return `adhésion validée en AG${detail.le ? ` du ${new Date(String(detail.le)).toLocaleDateString("fr-FR")}` : ""}`;
    case "coordonnees_consultees":
      return "téléphone et date de naissance consultés";
    case "fiche_modifiee":
      return "fiche modifiée";
    default:
      return event;
  }
}

export const MOYENS = { virement: "virement", especes: "espèces", cheque: "chèque", carte: "carte" } as const;

/** Délai minimal entre deux relances d'une même personne. */
export const DELAI_RELANCE_JOURS = 7;

/** Virements attendus de l'année en cours, à relancer (adresse connue, pas de relance depuis 7 jours). */
export function requeteARelancer(supabase: Client, options?: { compter?: boolean }) {
  const limite = new Date(Date.now() - DELAI_RELANCE_JOURS * 86400_000).toISOString();
  return supabase
    .from("adherents_vue")
    .select("id", options?.compter ? { count: "exact", head: true } : undefined)
    .eq("is_current", true)
    .eq("status", "attendue")
    .eq("is_sample", false)
    .not("email", "is", null)
    .or(`last_reminder_at.is.null,last_reminder_at.lt.${limite}`);
}
