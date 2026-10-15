import { z } from "zod";

/** Règles du parcours d'adhésion, partagées par le navigateur et le serveur. */

/** Clé sessionStorage de la page de remerciement. */
export const CLE_MERCI = "vtv-adhesion-merci";

export const MONTANTS_SUGGERES = [10, 20, 30, 50] as const;

/** 2000 → « 20 € » ; 1550 → « 15,50 € » */
export function formatMontant(centimes: number | null | undefined) {
  if (centimes == null) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: centimes % 100 === 0 ? 0 : 2,
  }).format(centimes / 100);
}

/** Libellé du virement : « ADHESION NOM PRENOM », sans accents. */
export function libelleVirement(nom: string, prenom: string) {
  return `ADHESION ${nom} ${prenom}`
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^A-Za-z0-9 -]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase()
    .slice(0, 140);
}

/** « 12/03/1980 », « 12 03 1980 », « 12-3-1980 » → « 1980-03-12 » (null si invalide). */
export function lireDateNaissance(saisie: string): string | null {
  const m = saisie.trim().match(/^(\d{1,2})\s*[/.\- ]\s*(\d{1,2})\s*[/.\- ]\s*(\d{4})$/);
  if (!m) return null;
  const [j, mo, a] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const d = new Date(Date.UTC(a, mo - 1, j));
  if (d.getUTCFullYear() !== a || d.getUTCMonth() !== mo - 1 || d.getUTCDate() !== j) return null;
  if (a < 1900 || d.getTime() > Date.now()) return null;
  return d.toISOString().slice(0, 10);
}

/** « 1980-03-12 » → « 12/03/1980 » */
export function afficherDateNaissance(iso: string | null | undefined) {
  if (!iso) return "";
  const [a, m, j] = iso.split("-");
  return `${j}/${m}/${a}`;
}

const texte = (max: number, message = "Champ obligatoire.") =>
  z.string().trim().min(1, { error: message }).max(max, { error: `${max} caractères maximum.` });
const facultatif = (max: number) => z.string().trim().max(max, { error: `${max} caractères maximum.` });

export const schemaChoix = z
  .object({
    mode: z.enum(["avec", "sans"], { error: "Choisissez une façon d'adhérer." }),
    montant: z.number({ error: "Indiquez un montant." }).nullable(),
  })
  .superRefine((v, ctx) => {
    if (v.mode !== "avec") return;
    if (v.montant == null || !Number.isFinite(v.montant)) {
      ctx.addIssue({ code: "custom", path: ["montant"], message: "Choisissez un montant ou indiquez le vôtre." });
    } else if (!Number.isInteger(v.montant) || v.montant < 1 || v.montant > 10000) {
      ctx.addIssue({ code: "custom", path: ["montant"], message: "Indiquez un montant en euros, entre 1 et 10 000." });
    }
  });

export const schemaCoordonnees = z.object({
  nom: texte(80, "Indiquez votre nom."),
  prenom: texte(80, "Indiquez votre prénom."),
  naissance: facultatif(20).refine((v) => !v || lireDateNaissance(v) !== null, {
    error: "Date à saisir sous la forme JJ/MM/AAAA, par exemple 12/03/1980.",
  }),
  telephone: facultatif(30).refine((v) => !v || /^\+?[\d\s.()-]{6,25}$/.test(v), {
    error: "Ce numéro ne semble pas valide (chiffres, espaces et + uniquement).",
  }),
  email: z
    .string()
    .trim()
    .min(1, { error: "Indiquez votre adresse e-mail." })
    .pipe(z.email({ error: "Cette adresse e-mail semble incomplète (exemple : prenom@exemple.fr)." }).max(254)),
  adresse: facultatif(200),
  code_postal: facultatif(10),
  commune: facultatif(80),
});

export const schemaEngagements = z.object({
  statuts: z.literal(true, { error: "Cochez cette case pour adhérer : elle est obligatoire." }),
  donnees: z.literal(true, { error: "Cochez cette case pour adhérer : elle est obligatoire." }),
  lettre: z.boolean(),
});

export type Choix = z.infer<typeof schemaChoix>;
export type Coordonnees = z.input<typeof schemaCoordonnees>;
export type Engagements = { statuts: boolean; donnees: boolean; lettre: boolean };

export const COORDONNEES_VIDES: Coordonnees = {
  nom: "",
  prenom: "",
  naissance: "",
  telephone: "",
  email: "",
  adresse: "",
  code_postal: "84160",
  commune: "Vaugines",
};

/** Première erreur par champ. */
export function erreursParChamp(e: z.ZodError): Record<string, string> {
  const r: Record<string, string> = {};
  for (const i of e.issues) r[String(i.path[0] ?? "_")] ??= i.message;
  return r;
}
