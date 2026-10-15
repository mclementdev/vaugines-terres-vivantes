"use client";

import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "./types";

/** Client navigateur (session admin) : sert aux téléversements d'images. */
export function clientNavigateur() {
  return createBrowserClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
}
