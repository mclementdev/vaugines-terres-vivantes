import { z } from "zod";

import { THEMES_IDEES, type ThemeIdee } from "@/lib/libelles";

/** Photo choisie : 8 Mo au plus avant réduction dans le navigateur. */
export const PHOTO_MAX_ORIGINE = 8 * 1024 * 1024;
/** Photo envoyée au serveur, après réduction (1 600 px, JPEG). */
export const PHOTO_MAX_ENVOI = 3 * 1024 * 1024;

const themes = Object.keys(THEMES_IDEES) as [ThemeIdee, ...ThemeIdee[]];

export const schemaIdee = z
  .object({
    titre: z.string().trim().min(3, { error: "Résumez votre idée en une phrase." }).max(90, { error: "90 caractères maximum." }),
    description: z
      .string()
      .trim()
      .min(20, { error: "Décrivez votre idée en quelques phrases (20 caractères minimum)." })
      .max(2000, { error: "2 000 caractères maximum." }),
    theme: z.enum(themes, { error: "Choisissez un thème." }),
    signer: z.boolean(),
    prenom: z.string().trim().max(60, { error: "60 caractères maximum." }),
    email: z.email({ error: "Cette adresse e-mail semble incomplète (exemple : prenom@exemple.fr)." }).max(254),
    charte: z.literal(true, { error: "Cochez cette case pour envoyer votre idée." }),
  })
  .superRefine((v, ctx) => {
    if (v.signer && !v.prenom) ctx.addIssue({ code: "custom", path: ["prenom"], message: "Indiquez le prénom à afficher, ou choisissez « Anonymement »." });
  });

export const schemaCommentaire = z.object({
  prenom: z.string().trim().max(60, { error: "60 caractères maximum." }),
  texte: z.string().trim().min(3, { error: "Votre commentaire est vide." }).max(1500, { error: "1 500 caractères maximum." }),
  charte: z.literal(true, { error: "Cochez cette case pour envoyer votre commentaire." }),
});
