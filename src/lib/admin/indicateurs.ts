import "server-only";

import type { clientSession } from "@/lib/supabase/serveur";

type Client = Awaited<ReturnType<typeof clientSession>>;

/** Indicateurs du tableau de bord pour l'année d'AG en cours. */
export async function indicateursAdherents(supabase: Client) {
  const { data } = await supabase
    .from("adherents_vue")
    .select("id, prenom, nom, joined_at, status, amount_cents, source")
    .eq("is_current", true)
    .order("joined_at", { ascending: false });
  const lignes = data ?? [];
  const maintenant = Date.now();
  const depuis = (iso: string | null, jours: number) => iso !== null && maintenant - new Date(iso).getTime() < jours * 86400_000;
  const payees = lignes.filter((l) => l.status === "payee");
  const attendues = lignes.filter((l) => l.status === "attendue");
  return {
    total: lignes.length,
    semaine: lignes.filter((l) => depuis(l.joined_at, 7)).length,
    montantRecu: payees.reduce((s, l) => s + (l.amount_cents ?? 0), 0),
    cotisants: payees.length,
    sansCotisation: lignes.filter((l) => l.status === "sans").length,
    attendus: attendues.length,
    attendusAnciens: attendues.filter((l) => !depuis(l.joined_at, 15)).length,
    recentes: lignes.slice(0, 5),
  };
}
