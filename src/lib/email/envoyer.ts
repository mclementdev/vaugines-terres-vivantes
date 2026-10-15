import "server-only";

import { Resend } from "resend";

export type PieceJointe = { nom: string; base64: string; type: string };

export type Message = {
  a: string;
  sujet: string;
  html: string;
  texte: string;
  /** Nom du modèle, seule information écrite dans les journaux. */
  modele: string;
  piecesJointes?: PieceJointe[];
  repondreA?: string;
  entetes?: Record<string, string>;
};

export type ResultatEnvoi = { ok: true; id?: string } | { ok: false };

const EXPEDITEUR = process.env.EMAIL_FROM ?? "vaugines, terres vivantes <ne-pas-repondre@vaugines-terres-vivantes.test>";

let resend: Resend | undefined;

/**
 * Envoie un e-mail : Resend si RESEND_API_KEY est défini, sinon Mailpit
 * (serveur de test local de Supabase) si MAILPIT_URL est défini, sinon
 * rien n'est envoyé. Les journaux ne contiennent jamais l'adresse ni le contenu.
 */
export async function envoyerEmail(m: Message): Promise<ResultatEnvoi> {
  const repondreA = m.repondreA ?? process.env.EMAIL_REPLY_TO;
  try {
    if (process.env.RESEND_API_KEY) {
      resend ??= new Resend(process.env.RESEND_API_KEY);
      const { data, error } = await resend.emails.send({
        from: EXPEDITEUR,
        to: m.a,
        subject: m.sujet,
        html: m.html,
        text: m.texte,
        replyTo: repondreA,
        headers: m.entetes,
        attachments: m.piecesJointes?.map((p) => ({ filename: p.nom, content: p.base64, contentType: p.type })),
      });
      if (error) {
        console.error(`e-mail « ${m.modele} » : refusé par Resend (${error.name})`);
        return { ok: false };
      }
      return { ok: true, id: data?.id };
    }

    if (process.env.MAILPIT_URL) {
      const [, nom = "", adresse = EXPEDITEUR] = EXPEDITEUR.match(/^(.*?)\s*<(.+)>$/) ?? [];
      const rep = await fetch(`${process.env.MAILPIT_URL}/api/v1/send`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          From: { Email: adresse, Name: nom },
          To: [{ Email: m.a }],
          ReplyTo: repondreA ? [{ Email: repondreA }] : [],
          Subject: m.sujet,
          HTML: m.html,
          Text: m.texte,
          Headers: m.entetes,
          Attachments: m.piecesJointes?.map((p) => ({ Filename: p.nom, Content: p.base64, ContentType: p.type })),
        }),
      });
      if (!rep.ok) {
        console.error(`e-mail « ${m.modele} » : refusé par Mailpit (HTTP ${rep.status})`);
        return { ok: false };
      }
      const { ID } = (await rep.json()) as { ID?: string };
      return { ok: true, id: ID };
    }

    console.warn(`e-mail « ${m.modele} » non envoyé : ni RESEND_API_KEY ni MAILPIT_URL configurés.`);
    return { ok: false };
  } catch (e) {
    console.error(`e-mail « ${m.modele} » : échec d'envoi (${e instanceof Error ? e.name : "inconnu"})`);
    return { ok: false };
  }
}
