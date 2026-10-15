"use server";

import { z } from "zod";

import { limiterDebit } from "@/lib/securite/anti-abus";
import { serviceClient } from "@/lib/supabase/service";

export type EtatSignalement = {
  statut: "inactif" | "ok" | "erreur";
  message?: string;
  erreurs?: Partial<Record<"message" | "url" | "email", string>>;
  /** Saisie renvoyée pour ne rien perdre en cas d'erreur. */
  valeurs?: { message: string; url: string; email: string };
};

const schema = z.object({
  message: z
    .string()
    .trim()
    .min(10, { error: "Dites-nous en un peu plus (10 caractères minimum)." })
    .max(2000, { error: "2 000 caractères maximum." }),
  url: z.union([z.literal(""), z.url({ error: "Ce lien ne semble pas valide (il doit commencer par https://)." }).max(500)]),
  email: z.union([z.literal(""), z.email({ error: "Cette adresse e-mail semble incomplète." }).max(254)]),
  site_web: z.string().max(0),
});

/** « Signaler une info » : enregistrée pour relecture, jamais publiée telle quelle. */
export async function signalerInfo(_: EtatSignalement, formData: FormData): Promise<EtatSignalement> {
  const valeurs = {
    message: String(formData.get("message") ?? ""),
    url: String(formData.get("url") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
  };
  const res = schema.safeParse({ ...valeurs, site_web: String(formData.get("site_web") ?? "") });

  if (!res.success) {
    const erreurs: EtatSignalement["erreurs"] = {};
    for (const i of res.error.issues) {
      const champ = i.path[0] as keyof NonNullable<EtatSignalement["erreurs"]> | "site_web";
      if (champ === "site_web") return { statut: "ok" }; // robot : succès simulé
      erreurs[champ] ??= i.message;
    }
    return { statut: "erreur", message: "Merci de vérifier les champs signalés.", erreurs, valeurs };
  }

  if (!(await limiterDebit("veille-signalement", 5, 3600))) {
    return { statut: "erreur", message: "Vous avez déjà envoyé plusieurs signalements : merci de réessayer dans une heure.", valeurs };
  }

  const { message, url, email } = res.data;
  const { error } = await serviceClient()
    .from("veille_reports")
    .insert({ message, url: url || null, email: email || null });
  if (error) {
    console.error("signalerInfo : échec d'enregistrement", error.code);
    return { statut: "erreur", message: "L'envoi n'a pas abouti. Réessayez dans un instant.", valeurs };
  }
  return { statut: "ok", message: "Merci ! Votre information a bien été transmise à l'équipe de veille." };
}
