import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { clientSession } from "@/lib/supabase/serveur";

const TYPES: EmailOtpType[] = ["magiclink", "invite", "email"];

/**
 * Vérifie le lien reçu par e-mail et ouvre la session. Deux formats : `token_hash`
 * (modèles d'e-mails du dépôt) ou `code` (modèles par défaut de Supabase, lien ouvert
 * dans le navigateur qui a demandé la connexion).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const suite = searchParams.get("next") ?? "/admin";
  // Redirection interne uniquement (pas de redirection ouverte).
  const cible = suite.startsWith("/admin") ? suite : "/admin";

  if (tokenHash && type && TYPES.includes(type)) {
    const supabase = await clientSession();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(cible, request.url));
  }
  const code = searchParams.get("code");
  if (code) {
    const supabase = await clientSession();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(cible, request.url));
  }
  return NextResponse.redirect(new URL("/admin/connexion?erreur=lien", request.url));
}
