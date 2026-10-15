import { notFound } from "next/navigation";

import { restaurerEvenement, supprimerEvenement } from "@/app/admin/actions/evenements";
import { FormulaireEvenement } from "@/components/admin/FormulaireEvenement";
import { InscritsEvenement } from "@/components/admin/InscritsEvenement";
import { BoutonAdmin, EnTeteAdmin } from "@/components/admin/ui";
import { isoVersParis } from "@/lib/admin/outils";
import { modeActuel } from "@/lib/admin/publication";
import { exigerAdmin } from "@/lib/auth";
import type { EtapeProgramme } from "@/lib/data/pages";
import { clientSession } from "@/lib/supabase/serveur";

export const metadata = { title: "Éditer un événement" };
export const instant = false;

export default async function EditionEvenement(props: PageProps<"/admin/evenements/[id]">) {
  await exigerAdmin();
  const { id } = await props.params;
  const supabase = await clientSession();
  const { data: e } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
  if (!e) notFound();

  if (e.status === "trashed") {
    return (
      <>
        <EnTeteAdmin titre={e.titre || "Sans titre"} retour={{ href: "/admin/evenements?vue=corbeille", libelle: "Corbeille" }} />
        <div className="flex flex-col gap-4 rounded-[20px] bg-white p-6">
          <p>Cet événement est dans la corbeille : il n&apos;apparaît plus dans l&apos;agenda.</p>
          <div className="flex flex-wrap gap-2.5">
            <form action={restaurerEvenement.bind(null, e.id)}>
              <BoutonAdmin type="submit">Restaurer en brouillon</BoutonAdmin>
            </form>
            <form action={supprimerEvenement.bind(null, e.id)}>
              <BoutonAdmin type="submit" variante="danger">
                Supprimer définitivement
              </BoutonAdmin>
            </form>
          </div>
        </div>
      </>
    );
  }

  const enLigne = e.status === "published" && e.published_at && new Date(e.published_at) <= new Date();
  return (
    <>
      <FormulaireEvenement
        id={e.id}
        status={e.status}
        publishedAt={e.published_at}
        publicSlug={enLigne ? e.slug : null}
        initial={{
          titre: e.titre,
          slug: e.slug.startsWith("brouillon-") ? "" : e.slug,
          resume: e.resume,
          corpsJson: e.body_json ?? e.body_html,
          corpsHtml: e.body_html,
          debut: isoVersParis(e.starts_at),
          fin: isoVersParis(e.ends_at),
          journee: e.all_day,
          dateLibelle: e.date_label ?? "",
          lieu: e.lieu,
          adresse: e.adresse ?? "",
          latitude: e.latitude?.toString() ?? "",
          longitude: e.longitude?.toString() ?? "",
          prix: e.prix,
          capacite: e.capacity?.toString() ?? "",
          programme: (e.programme as EtapeProgramme[] | null) ?? [],
          accessibilite: e.accessibilite ?? "",
          ouvertATous: e.ouvert_a_tous,
          inscription: e.registration_enabled,
          coverPath: e.cover_path,
          coverAlt: e.cover_alt ?? "",
          featured: e.featured,
          publication: { mode: modeActuel(e.status, e.published_at), date: isoVersParis(e.status === "published" ? e.published_at : null) },
        }}
      />
      {e.registration_enabled && <InscritsEvenement eventId={e.id} capacite={e.capacity} />}
    </>
  );
}
