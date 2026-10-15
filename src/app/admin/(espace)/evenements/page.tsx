import Link from "next/link";

import { creerEvenement } from "@/app/admin/actions/evenements";
import { BoutonAdmin, EnTeteAdmin, PastilleStatut, TableauAdmin, TableauVide, VuesAdmin } from "@/components/admin/ui";
import { exigerAdmin } from "@/lib/auth";
import { horodatage, jour, plageHoraire } from "@/lib/dates";
import { clientSession } from "@/lib/supabase/serveur";

export const metadata = { title: "Événements" };
export const instant = false;

export default async function ListeEvenements(props: PageProps<"/admin/evenements">) {
  await exigerAdmin();
  const sp = await props.searchParams;
  const supabase = await clientSession();
  const { data } = await supabase
    .from("events")
    .select("id, titre, starts_at, ends_at, all_day, date_label, lieu, status, published_at, registration_enabled, capacity, is_sample")
    .order("starts_at", { ascending: true, nullsFirst: false });
  const tous = data ?? [];
  const maintenant = horodatage();
  const filtres = {
    "a-venir": (e: (typeof tous)[number]) => e.status !== "trashed" && (!e.starts_at || new Date(e.starts_at).getTime() >= maintenant),
    passes: (e: (typeof tous)[number]) => e.status !== "trashed" && !!e.starts_at && new Date(e.starts_at).getTime() < maintenant,
    corbeille: (e: (typeof tous)[number]) => e.status === "trashed",
  };
  const vue = (sp.vue as keyof typeof filtres) in filtres ? (sp.vue as keyof typeof filtres) : "a-venir";
  const lignes = tous.filter(filtres[vue]);
  if (vue === "passes") lignes.reverse();

  return (
    <>
      <EnTeteAdmin
        titre="Événements"
        actions={
          <form action={creerEvenement}>
            <BoutonAdmin type="submit">+ Nouvel événement</BoutonAdmin>
          </form>
        }
      />
      {sp.corbeille && (
        <p role="status" className="mb-4 rounded-[14px] bg-tag-olive px-4 py-3 font-semibold text-tag-olive-fg">
          Événement mis à la corbeille.
        </p>
      )}
      <VuesAdmin
        base="/admin/evenements"
        actuelle={vue}
        vues={[
          { cle: "a-venir", libelle: "À venir", nombre: tous.filter(filtres["a-venir"]).length },
          { cle: "passes", libelle: "Passés", nombre: tous.filter(filtres.passes).length },
          { cle: "corbeille", libelle: "Corbeille", nombre: tous.filter(filtres.corbeille).length },
        ]}
      />
      {lignes.length === 0 ? (
        <TableauVide>Aucun événement dans cette vue.</TableauVide>
      ) : (
        <TableauAdmin
          legende="Événements"
          colonnes={["Événement", "Quand", "Inscriptions", "Statut"]}
          lignes={lignes.map((e) => ({
            cle: e.id,
            cellules: [
              <>
                <Link href={`/admin/evenements/${e.id}`} className="font-bold">
                  {e.titre || "Sans titre"}
                </Link>
                <span className="block text-sm text-encre-3">
                  {e.lieu}
                  {e.is_sample && " · exemple fictif"}
                </span>
              </>,
              <span key="q" className="text-sm">
                {e.starts_at ? (
                  <>
                    {jour(e.starts_at)}
                    <br />
                    {plageHoraire(e.starts_at, e.ends_at, e.all_day)}
                  </>
                ) : (
                  e.date_label
                )}
              </span>,
              <span key="i" className="text-sm text-encre-2">
                {e.registration_enabled ? (e.capacity ? `${e.capacity} places` : "Ouvertes") : "—"}
              </span>,
              <PastilleStatut key="s" status={e.status} publishedAt={e.published_at} />,
            ],
          }))}
        />
      )}
    </>
  );
}
