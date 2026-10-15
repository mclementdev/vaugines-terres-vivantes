import { z } from "zod";

import { exigerAdmin } from "@/lib/auth";
import { slugifier } from "@/lib/admin/outils";
import { clientSession } from "@/lib/supabase/serveur";

/** Cellule CSV : guillemets échappés, formules neutralisées. */
function cellule(v: string | number | null | undefined) {
  const s = String(v ?? "").replace(/^([=+\-@\t\r])/, "'$1");
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Liste des inscrits confirmés (Excel / LibreOffice : point-virgule, BOM UTF-8). */
export async function GET(_: Request, ctx: RouteContext<"/admin/evenements/[id]/inscrits.csv">) {
  const admin = await exigerAdmin();
  const { id } = await ctx.params;
  if (!z.uuid().safeParse(id).success) return new Response("Introuvable.", { status: 404 });
  const supabase = await clientSession();
  const [{ data: e }, { data: lignes }] = await Promise.all([
    supabase.from("events").select("slug").eq("id", id).maybeSingle(),
    supabase.from("event_registrations").select("nom, email, places, created_at").eq("event_id", id).eq("status", "confirmee").order("nom"),
  ]);
  if (!e) return new Response("Introuvable.", { status: 404 });

  const corps = (lignes ?? []).map((l) =>
    [l.nom, l.email, l.places, new Date(l.created_at).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" })].map(cellule).join(";"),
  );
  const csv = "﻿" + ["Nom;E-mail;Personnes;Inscrit le", ...corps].join("\r\n") + "\r\n";
  await supabase.from("audit_log").insert({ actor_id: admin.id, action: "export_inscrits", cible: id, detail: { lignes: corps.length } });
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="inscrits-${slugifier(e.slug)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
