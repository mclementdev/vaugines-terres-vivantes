import { createClient } from "@supabase/supabase-js";
import { devices, expect, type Page } from "@playwright/test";

/**
 * Outils communs aux tests de bout en bout. Ils ne tournent que sur la base
 * locale : refus net si l'URL Supabase n'est pas celle de `supabase start`.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
if (!/^http:\/\/(127\.0\.0\.1|localhost):/.test(url)) {
  throw new Error("Tests de bout en bout : base locale uniquement (npm run db:start).");
}

export const db = createClient(url, process.env.SUPABASE_SECRET_KEY!, {
  auth: { persistSession: false },
});
export const anonyme = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, { auth: { persistSession: false } });

const mailpit = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";

/** Agent utilisateur propre à chaque exécution : la limitation de débit ne bloque pas les relances. */
export const agentUnique = `${devices["Pixel 7"].userAgent} e2e-${Date.now()}`;

/** Adresse de test unique, sur un domaine réservé aux tests. */
export const adresseTest = (prefixe: string) => `${prefixe}-${Date.now()}-${Math.floor(Math.random() * 1e4)}@exemple.test`;

type Courriel = { ID: string; Subject: string };

/** Attend un e-mail envoyé à `a` (via Mailpit) et renvoie son sujet et son contenu HTML. */
export async function attendreEmail(a: string, sujet: RegExp) {
  let trouve: Courriel | undefined;
  await expect
    .poll(
      async () => {
        const r = await fetch(`${mailpit}/api/v1/search?query=${encodeURIComponent(`to:"${a}"`)}`);
        const { messages } = (await r.json()) as { messages: Courriel[] };
        trouve = messages.find((m) => sujet.test(m.Subject));
        return Boolean(trouve);
      },
      { timeout: 15_000, message: `e-mail « ${sujet} » attendu pour ${a}` },
    )
    .toBe(true);
  const m = (await (await fetch(`${mailpit}/api/v1/message/${trouve!.ID}`)).json()) as {
    Subject: string;
    HTML: string;
    Attachments: { FileName: string }[];
  };
  return m;
}

/** Supprime de Mailpit les e-mails envoyés à `a`. */
export async function effacerEmails(a: string) {
  await fetch(`${mailpit}/api/v1/search?query=${encodeURIComponent(`to:"${a}"`)}`, { method: "DELETE" });
}

/** Premier lien du HTML dont l'adresse contient `fragment`. */
export function lien(html: string, fragment: string) {
  const l = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, "&")).find((h) => h.includes(fragment));
  if (!l) throw new Error(`Lien « ${fragment} » introuvable dans l'e-mail.`);
  return new URL(l).pathname + new URL(l).search;
}

type Role = "superadmin" | "admin" | "aucun";

/** Ouvre une session d'administration de test (compte créé au besoin, lien magique vérifié). */
export async function seConnecter(page: Page, role: Role) {
  const email = `e2e-${role}@exemple.test`;
  const { data: liste } = await db.auth.admin.listUsers({ perPage: 1000 });
  let id = liste.users.find((u) => u.email === email)?.id;
  if (!id) {
    const { data, error } = await db.auth.admin.createUser({
      email,
      email_confirm: true,
    });
    if (error) throw error;
    id = data.user.id;
  }
  if (role === "aucun") await db.from("profiles").delete().eq("id", id);
  else {
    const { error } = await db.from("profiles").upsert({ id, email, prenom: "Test", nom: role, role });
    if (error) throw error;
  }
  const { data, error } = await db.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (error) throw error;
  await page.goto(`/auth/confirm?token_hash=${data.properties.hashed_token}&type=magiclink&next=/admin`);
}

/** Supprime les comptes d'administration de test. */
export async function supprimerComptesTest() {
  const { data: liste } = await db.auth.admin.listUsers({ perPage: 1000 });
  for (const u of liste.users.filter((u) => /^e2e-.*@exemple\.test$/.test(u.email ?? ""))) await db.auth.admin.deleteUser(u.id);
}
