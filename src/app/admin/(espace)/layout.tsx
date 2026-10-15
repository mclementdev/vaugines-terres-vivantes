import { Suspense } from "react";

import { MenuAdmin } from "@/components/admin/MenuAdmin";
import { groupesAdmin } from "@/components/admin/navigation";
import { exigerAdmin } from "@/lib/auth";
import { clientSession } from "@/lib/supabase/serveur";

/** Back-office authentifié, toujours rendu à la requête : pas de navigation « instantanée » à valider. */
export const instant = false;

/**
 * Espace d'administration. La session est lue sous <Suspense> (Cache
 * Components) ; chaque page et action revérifie le rôle côté serveur.
 */
export default function LayoutAdmin({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex min-h-dvh flex-col bg-sable text-base leading-normal lg:flex-row">
      <div className="bg-brun lg:w-[260px] lg:shrink-0">
        <Suspense fallback={<div className="h-[68px] lg:min-h-dvh" aria-hidden="true" />}>
          <Menu />
        </Suspense>
      </div>
      <main id="contenu" className="min-w-0 flex-1 px-5 pb-16 pt-6 md:px-8 md:pt-7">
        <Suspense fallback={<p className="text-encre-3">Chargement…</p>}>{children}</Suspense>
      </main>
    </div>
  );
}

async function Menu() {
  const admin = await exigerAdmin();
  const supabase = await clientSession();
  const [moderation, commentaires, signalesIdees, signalesComs, signalements] = await Promise.all([
    supabase.from("ideas").select("id", { count: "exact", head: true }).eq("moderation", "pending"),
    supabase.from("idea_comments").select("id", { count: "exact", head: true }).eq("moderation", "pending"),
    supabase.from("ideas").select("id", { count: "exact", head: true }).eq("moderation", "published").gt("report_count", 0),
    supabase.from("idea_comments").select("id", { count: "exact", head: true }).eq("moderation", "published").gt("report_count", 0),
    supabase.from("veille_reports").select("id", { count: "exact", head: true }).is("treated_at", null),
  ]);
  const groupes = groupesAdmin({ moderation: [moderation, commentaires, signalesIdees, signalesComs].reduce((n, r) => n + (r.count ?? 0), 0), signalements: signalements.count ?? 0 }).filter(
    (g) => !g.superadmin || admin.role === "superadmin",
  );
  const nom = [admin.prenom, admin.nom].filter(Boolean).join(" ") || admin.email;
  const initiales = ((admin.prenom[0] ?? "") + (admin.nom[0] ?? "")).toUpperCase() || admin.email[0]?.toUpperCase() || "?";
  return <MenuAdmin groupes={groupes} nom={nom} role={admin.role} initiales={initiales} />;
}
