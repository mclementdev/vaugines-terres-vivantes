import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "./types";

/**
 * Client « service » (clé secrète) : contourne la RLS. Réservé aux écritures
 * publiques déjà validées côté serveur et aux tâches planifiées.
 */
export function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("SUPABASE_SECRET_KEY manquante (voir .env.example).");
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
