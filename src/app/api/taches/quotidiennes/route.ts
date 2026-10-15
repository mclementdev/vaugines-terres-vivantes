import { timingSafeEqual } from "node:crypto";

import { effacerInscriptionsAnciennes, envoyerRappelsDuLendemain } from "@/lib/email/inscriptions";

/**
 * Tâche quotidienne (Vercel Cron, voir vercel.json) : rappels de la veille et
 * effacement des inscriptions anciennes. Protégée par CRON_SECRET, que Vercel
 * envoie dans l'en-tête Authorization.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const recu = request.headers.get("authorization") ?? "";
  const attendu = `Bearer ${secret}`;
  if (!secret || recu.length !== attendu.length || !timingSafeEqual(Buffer.from(recu), Buffer.from(attendu))) {
    return new Response("Non autorisé.", { status: 401 });
  }
  const rappels = await envoyerRappelsDuLendemain();
  const effacees = await effacerInscriptionsAnciennes();
  console.info(`tâche quotidienne : ${rappels.envoyes}/${rappels.aRappeler} rappel(s), ${effacees} inscription(s) effacée(s)`);
  return Response.json({ rappels, effacees });
}
