"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { clientNavigateur } from "@/lib/supabase/navigateur";

/**
 * Invitation envoyée avec le modèle d'e-mail par défaut de Supabase : la session
 * arrive dans le fragment de l'adresse (#access_token=…). On l'enregistre puis on
 * efface le fragment avant d'ouvrir l'administration.
 */
export function SessionInvitation() {
  const router = useRouter();
  useEffect(() => {
    const f = new URLSearchParams(window.location.hash.slice(1));
    const access_token = f.get("access_token");
    const refresh_token = f.get("refresh_token");
    if (!access_token || !refresh_token) return;
    history.replaceState(null, "", window.location.pathname + window.location.search);
    clientNavigateur()
      .auth.setSession({ access_token, refresh_token })
      .then(({ error }) => {
        if (!error) router.replace("/admin");
      });
  }, [router]);
  return null;
}
