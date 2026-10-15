import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Rafraîchit la session Supabase sur l'espace d'administration et renvoie
 * vers la connexion sans session. Contrôle « optimiste » : l'autorisation
 * réelle (rôle) est vérifiée côté serveur à chaque page et action.
 */
export async function proxy(request: NextRequest) {
  let reponse = NextResponse.next({ request });

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (aEcrire) => {
        aEcrire.forEach(({ name, value }) => request.cookies.set(name, value));
        reponse = NextResponse.next({ request });
        aEcrire.forEach(({ name, value, options }) => reponse.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const chemin = request.nextUrl.pathname;

  if (!data?.claims && chemin.startsWith("/admin") && !chemin.startsWith("/admin/connexion")) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/connexion";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return reponse;
}

export const config = {
  matcher: ["/admin/:path*"],
};
