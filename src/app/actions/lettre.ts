"use server";

import { z } from "zod";

export type EtatLettre = { statut: "inactif" | "ok" | "erreur"; message?: string };

const schema = z.object({
  email: z.email({ error: "Cette adresse e-mail semble incomplète." }).max(254),
  // Champ piège invisible : rempli uniquement par les robots.
  site_web: z.string().max(0).optional(),
});

export async function inscrireLettre(_: EtatLettre, formData: FormData): Promise<EtatLettre> {
  const res = schema.safeParse({
    email: String(formData.get("email") ?? "").trim(),
    site_web: String(formData.get("site_web") ?? ""),
  });
  if (!res.success) {
    const champEmail = res.error.issues.find((i) => i.path[0] === "email");
    // Pour un robot, on simule un succès sans rien enregistrer.
    if (!champEmail) return { statut: "ok", message: "Merci !" };
    return { statut: "erreur", message: champEmail.message };
  }
  // Lot 4 : enregistrement + e-mail de confirmation (double opt-in) via Resend.
  return {
    statut: "erreur",
    message: "L'inscription à la lettre ouvre très bientôt. Merci de votre patience !",
  };
}
