import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";

import type { Database } from "./types";

/**
 * Client Supabase lié à la session de l'utilisateur (cookies). Soumis à la
 * RLS : un admin ne peut faire que ce que ses politiques autorisent.
 */
export async function clientSession() {
  // Toujours à la requête : supabase-js lit l'heure (expiration des jetons).
  await connection();
  const magasin = await cookies();
  return createServerClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => magasin.getAll(),
      setAll: (aEcrire) => {
        try {
          aEcrire.forEach(({ name, value, options }) => magasin.set(name, value, options));
        } catch {
          // Appelé depuis un Server Component : le proxy se charge du rafraîchissement.
        }
      },
    },
  });
}
