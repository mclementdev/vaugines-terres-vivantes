import "server-only";

import type { clientSession } from "@/lib/supabase/serveur";

type Client = Awaited<ReturnType<typeof clientSession>>;

/** Places confirmées par événement (identifiant → nombre de places). */
export async function placesParEvenement(supabase: Client, ids?: string[]) {
  let q = supabase.from("event_registrations").select("event_id, places").eq("status", "confirmee");
  if (ids) q = q.in("event_id", ids);
  const { data } = await q;
  const total = new Map<string, number>();
  for (const r of data ?? []) total.set(r.event_id, (total.get(r.event_id) ?? 0) + r.places);
  return total;
}
