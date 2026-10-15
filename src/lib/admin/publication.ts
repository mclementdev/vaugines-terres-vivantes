import { z } from "zod";

import { parisVersIso } from "./outils";

export const MODES = ["brouillon", "maintenant", "programmer"] as const;
export type ModePublication = (typeof MODES)[number];

export const schemaPublication = z.object({
  mode: z.enum(MODES),
  date: z.string().optional(),
});

/** Traduit le choix « Brouillon / Maintenant / Programmer » en status + published_at. */
export function calculerPublication(
  choix: z.infer<typeof schemaPublication>,
  actuel: { status: string; published_at: string | null },
): { status: "draft" | "published"; published_at: string | null } | { erreur: string } {
  if (choix.mode === "brouillon") return { status: "draft", published_at: null };
  if (choix.mode === "maintenant") {
    const dejaEnLigne = actuel.status === "published" && actuel.published_at && new Date(actuel.published_at) <= new Date();
    return { status: "published", published_at: dejaEnLigne ? actuel.published_at : new Date().toISOString() };
  }
  const iso = choix.date ? parisVersIso(choix.date) : null;
  if (!iso) return { erreur: "Indiquez la date et l'heure de publication." };
  if (new Date(iso) <= new Date()) return { erreur: "La date de publication programmée doit être dans le futur." };
  return { status: "published", published_at: iso };
}

/** Mode à présélectionner dans le formulaire d'après l'état enregistré. */
export function modeActuel(status: string, publishedAt: string | null): ModePublication {
  if (status !== "published" || !publishedAt) return "brouillon";
  return new Date(publishedAt) > new Date() ? "programmer" : "maintenant";
}
