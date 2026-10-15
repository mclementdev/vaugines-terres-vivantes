const FUSEAU = "Europe/Paris";

const formatJour = new Intl.DateTimeFormat("fr-FR", {
  timeZone: FUSEAU,
  weekday: "long",
  day: "numeric",
  month: "long",
});
const formatDate = new Intl.DateTimeFormat("fr-FR", {
  timeZone: FUSEAU,
  day: "numeric",
  month: "long",
  year: "numeric",
});
const formatDateCourte = new Intl.DateTimeFormat("fr-FR", {
  timeZone: FUSEAU,
  day: "numeric",
  month: "long",
});
const formatHeure = new Intl.DateTimeFormat("fr-FR", {
  timeZone: FUSEAU,
  hour: "numeric",
  minute: "2-digit",
});
const formatMoisCourt = new Intl.DateTimeFormat("fr-FR", { timeZone: FUSEAU, month: "short" });
const formatNumJour = new Intl.DateTimeFormat("fr-FR", { timeZone: FUSEAU, day: "numeric" });
const formatCle = new Intl.DateTimeFormat("en-CA", {
  timeZone: FUSEAU,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** « 10 h », « 10 h 30 » */
export function heure(d: Date | string): string {
  const [h, m] = formatHeure.format(new Date(d)).split(":");
  return m === "00" ? `${Number(h)} h` : `${Number(h)} h ${m}`;
}

/** « Samedi 24 octobre » */
export function jour(d: Date | string): string {
  return majuscule(formatJour.format(new Date(d)));
}

/** « 19 avril 2026 » */
export function dateLongue(d: Date | string): string {
  return formatDate.format(new Date(d));
}

/** « 7 mars » (sans année) */
export function dateCourte(d: Date | string): string {
  return formatDateCourte.format(new Date(d));
}

/** Pour la carte date : { jour: "21", mois: "nov." } */
export function carteDate(d: Date | string) {
  const date = new Date(d);
  return { jour: formatNumJour.format(date), mois: formatMoisCourt.format(date) };
}

/** Écart en jours calendaires (heure de Paris) entre maintenant et la date. */
function joursEntre(maintenant: Date, d: Date): number {
  const a = Date.parse(formatCle.format(maintenant));
  const b = Date.parse(formatCle.format(d));
  return Math.round((b - a) / 86_400_000);
}

/**
 * Date relative pour les rendez-vous à venir, comme le veut le ton éditorial :
 * « aujourd'hui », « demain », « dans 9 jours », « dans 5 semaines ».
 * Renvoie null au-delà de trois mois (on affiche alors la date).
 */
export function dansCombien(d: Date | string, maintenant = new Date()): string | null {
  const n = joursEntre(maintenant, new Date(d));
  if (n < 0) return null;
  if (n === 0) return "aujourd'hui";
  if (n === 1) return "demain";
  if (n === 2) return "après-demain";
  if (n < 21) return `dans ${n} jours`;
  if (n < 90) return `dans ${Math.round(n / 7)} semaines`;
  return null;
}

/** « il y a 3 jours », « hier », « il y a 1 mois » pour les publications. */
export function ilYA(d: Date | string, maintenant = new Date()): string {
  const n = -joursEntre(maintenant, new Date(d));
  if (n <= 0) return "aujourd'hui";
  if (n === 1) return "hier";
  if (n < 14) return `il y a ${n} jours`;
  if (n < 60) return `il y a ${Math.round(n / 7)} semaines`;
  const mois = Math.round(n / 30);
  return mois < 12 ? `il y a ${mois} mois` : `le ${dateLongue(d)}`;
}

/** Plage horaire d'un événement : « 10 h – 12 h 30 », « journée entière ». */
export function plageHoraire(debut: string, fin: string | null, journee = false): string {
  if (journee) return "journée entière";
  if (!fin) return heure(debut);
  return `${heure(debut)} – ${heure(fin)}`;
}

/** Horodatage courant (ms), pour les comparaisons côté serveur. */
export function horodatage() {
  return Date.now();
}
