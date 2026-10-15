import { getEvenement } from "@/lib/data/pages";
import { fichierIcs } from "@/lib/ics";

export async function GET(_: Request, { params }: RouteContext<"/evenements/[slug]/agenda.ics">) {
  const { slug } = await params;
  const e = await getEvenement(slug);
  if (!e?.starts_at) return new Response("Événement introuvable ou sans date.", { status: 404 });

  const debut = new Date(e.starts_at);
  // Sans heure de fin : durée de 2 h par défaut.
  const fin = e.ends_at ? new Date(e.ends_at) : new Date(debut.getTime() + 2 * 3600_000);
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const ics = fichierIcs({
    slug: e.slug,
    titre: e.titre,
    resume: e.resume,
    debut,
    fin,
    lieu: e.adresse?.startsWith(e.lieu) ? e.adresse : [e.lieu, e.adresse].filter(Boolean).join(", "),
    url: `${site}/evenements/${e.slug}`,
    maj: new Date(e.updated_at),
  });

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${e.slug}.ics"`,
    },
  });
}
