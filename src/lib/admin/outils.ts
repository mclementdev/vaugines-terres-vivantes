import type { ZodError } from "zod";

/** État renvoyé par les actions des formulaires d'administration. */
export type EtatForm = {
  statut: "inactif" | "ok" | "erreur";
  message?: string;
  erreurs?: Record<string, string>;
  /** Horodatage du dernier enregistrement réussi (enregistrement automatique). */
  enregistreLe?: string;
};

export const ETAT_INITIAL: EtatForm = { statut: "inactif" };

export function erreursZod(e: ZodError): Record<string, string> {
  const erreurs: Record<string, string> = {};
  for (const i of e.issues) {
    const cle = String(i.path[0] ?? "_");
    erreurs[cle] ??= i.message;
  }
  return erreurs;
}

/** « Appel à vos archives » → « appel-a-vos-archives » */
export function slugifier(texte: string) {
  return texte
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[’']/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

const FUSEAU = "Europe/Paris";

/** Décalage (minutes) de l'heure de Paris à un instant donné. */
function decalageParis(d: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: FUSEAU,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(d);
  const v = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const commeUtc = Date.UTC(v("year"), v("month") - 1, v("day"), v("hour"), v("minute"));
  return (commeUtc - d.getTime()) / 60000;
}

/** « 2026-10-20T09:00 » saisi à l'heure de Paris → ISO UTC. */
export function parisVersIso(local: string): string | null {
  const m = local.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return null;
  const approx = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]));
  const d = new Date(approx.getTime() - decalageParis(approx) * 60000);
  // Second passage pour les changements d'heure.
  return new Date(approx.getTime() - decalageParis(d) * 60000).toISOString();
}

/** ISO UTC → valeur de champ datetime-local à l'heure de Paris. */
export function isoVersParis(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() + decalageParis(d) * 60000).toISOString().slice(0, 16);
}

/** Statut affiché d'un contenu : brouillon, programmé, publié, corbeille. */
export function etatPublication(status: string, publishedAt: string | null): "brouillon" | "programme" | "publie" | "corbeille" {
  if (status === "trashed") return "corbeille";
  if (status === "draft" || !publishedAt) return "brouillon";
  return new Date(publishedAt) > new Date() ? "programme" : "publie";
}
