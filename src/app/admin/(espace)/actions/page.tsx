import Link from "next/link";

import { LigneCommission } from "@/components/admin/LigneCommission";
import { EnTeteAdmin, LienAdmin, Pastille, TableauAdmin, VuesAdmin } from "@/components/admin/ui";
import { exigerAdmin } from "@/lib/auth";
import { clientSession } from "@/lib/supabase/serveur";

export const metadata = { title: "Actions & commissions" };
export const instant = false;

export default async function AdminActions(props: PageProps<"/admin/actions">) {
  await exigerAdmin();
  const sp = await props.searchParams;
  const vue = sp.vue === "commissions" ? "commissions" : "actions";
  const supabase = await clientSession();
  const [actions, commissions] = await Promise.all([
    supabase.from("actions").select("id, titre, periode, position, status, is_sample, commission:commissions(nom)").order("position"),
    supabase.from("commissions").select("id, nom, description, position").order("position"),
  ]);
  return (
    <>
      <EnTeteAdmin titre="Actions & commissions" actions={<LienAdmin href="/admin/actions/nouvelle">+ Nouvelle action</LienAdmin>} />
      {sp.supprime && (
        <p role="status" className="mb-4 rounded-[14px] bg-tag-olive px-4 py-3 font-semibold text-tag-olive-fg">
          Action supprimée.
        </p>
      )}
      <VuesAdmin
        base="/admin/actions"
        actuelle={vue}
        vues={[
          { cle: "actions", libelle: "Actions en cours", nombre: actions.data?.length ?? 0 },
          { cle: "commissions", libelle: "Commissions", nombre: commissions.data?.length ?? 0 },
        ]}
      />
      {vue === "actions" ? (
        <TableauAdmin
          legende="Actions"
          colonnes={["Action", "Période", "Commission", "État"]}
          lignes={(actions.data ?? []).map((a) => ({
            cle: a.id,
            cellules: [
              <Link key="t" href={`/admin/actions/${a.id}`} className="font-bold">
                {a.titre}
              </Link>,
              a.periode,
              a.commission?.nom ?? "—",
              a.status === "published" ? <Pastille key="e" ton="olive">Publiée</Pastille> : <Pastille key="e">Brouillon</Pastille>,
            ],
          }))}
        />
      ) : (
        <section className="rounded-[20px] bg-white px-6 py-4">
          <p className="mb-2 text-sm text-encre-3">
            Les commissions apparaissent sur la page « Actions et commissions » avec un lien « Rejoindre » vers l&apos;e-mail de
            l&apos;association.
          </p>
          {(commissions.data ?? []).map((c) => (
            <LigneCommission key={c.id} id={c.id} nom={c.nom} description={c.description} position={c.position} />
          ))}
          <h2 className="mt-4 font-bold">Ajouter une commission</h2>
          <LigneCommission id={null} position={(commissions.data?.length ?? 0) + 1} />
        </section>
      )}
    </>
  );
}
