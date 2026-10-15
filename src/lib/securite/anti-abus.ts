import "server-only";

import { createHmac } from "node:crypto";

import { headers } from "next/headers";

import { serviceClient } from "@/lib/supabase/service";

/** Sel des empreintes : jamais d'IP en clair en base ni dans les journaux. */
function sel() {
  const s = process.env.ANTI_ABUS_SEL ?? process.env.SUPABASE_SECRET_KEY;
  if (!s) throw new Error("ANTI_ABUS_SEL manquant.");
  return s;
}

/** Adresse IP tronquée (/24 en IPv4, /48 en IPv6) du visiteur. */
async function ipTronquee() {
  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "0.0.0.0").trim();
  if (ip.includes(":")) return ip.split(":").slice(0, 3).join(":");
  return ip.split(".").slice(0, 3).join(".");
}

/** Empreinte hachée et salée d'un visiteur (IP tronquée + navigateur). */
export async function empreinteVisiteur(portee: string) {
  const h = await headers();
  const brut = `${portee}|${await ipTronquee()}|${h.get("user-agent") ?? ""}`;
  return createHmac("sha256", sel()).update(brut).digest("hex");
}

/**
 * Limitation de débit : `max` actions par fenêtre de `fenetreSecondes` pour un
 * même visiteur et une même action. Renvoie false si la limite est dépassée.
 */
export async function limiterDebit(action: string, max: number, fenetreSecondes: number) {
  const cle = `${action}:${await empreinteVisiteur(action)}`;
  const { data, error } = await serviceClient().rpc("hit_rate_limit", {
    p_key: cle,
    p_window_seconds: fenetreSecondes,
    p_max: max,
  });
  if (error) throw error;
  return data;
}
