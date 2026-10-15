import Link from "next/link";

import { marquerSignalementTraite } from "@/app/admin/actions/contenus";
import { BoutonAdmin, EnTeteAdmin, LienAdmin, Pastille, TableauAdmin, TableauVide, VuesAdmin } from "@/components/admin/ui";
import { exigerAdmin } from "@/lib/auth";
import { dateLongue, ilYA } from "@/lib/dates";
import { THEMES_VEILLE } from "@/lib/libelles";
import { clientSession } from "@/lib/supabase/serveur";

export const metadata = { title: "Veille" };
export const instant = false;

export default async function AdminVeille(props: PageProps<"/admin/veille">) {
  await exigerAdmin();
  const sp = await props.searchParams;
  const vue = sp.vue === "dossiers" || sp.vue === "signalements" ? sp.vue : "fiches";
  const supabase = await clientSession();
  const [fiches, dossiers, signalements] = await Promise.all([
    supabase.from("veille_items").select("id, theme, titre, date_info, status, is_sample").order("date_info", { ascending: false, nullsFirst: false }),
    supabase.from("veille_dossiers").select("id, titre, featured, status, is_sample").order("created_at", { ascending: false }),
    supabase.from("veille_reports").select("id, message, url, email, treated_at, created_at").order("created_at", { ascending: false }),
  ]);
  const nonTraites = (signalements.data ?? []).filter((s) => !s.treated_at).length;

  return (
    <>
      <EnTeteAdmin
        titre="Veille"
        actions={
          <>
            <LienAdmin href="/admin/veille/nouvelle">+ Nouvelle fiche</LienAdmin>
            <LienAdmin href="/admin/veille/dossiers/nouveau" variante="secondaire">
              + Dossier
            </LienAdmin>
          </>
        }
      />
      {sp.supprime && (
        <p role="status" className="mb-4 rounded-[14px] bg-tag-olive px-4 py-3 font-semibold text-tag-olive-fg">
          Fiche supprimée.
        </p>
      )}
      <VuesAdmin
        base="/admin/veille"
        actuelle={vue}
        vues={[
          { cle: "fiches", libelle: "Fiches", nombre: fiches.data?.length ?? 0 },
          { cle: "dossiers", libelle: "Dossiers", nombre: dossiers.data?.length ?? 0 },
          { cle: "signalements", libelle: "Signalements à lire", nombre: nonTraites },
        ]}
      />

      {vue === "fiches" &&
        ((fiches.data ?? []).length === 0 ? (
          <TableauVide>Aucune fiche.</TableauVide>
        ) : (
          <TableauAdmin
            legende="Fiches de veille"
            colonnes={["Fiche", "Thème", "Date", "État"]}
            lignes={(fiches.data ?? []).map((f) => ({
              cle: f.id,
              cellules: [
                <Link key="t" href={`/admin/veille/${f.id}`} className="font-bold">
                  {f.titre}
                </Link>,
                THEMES_VEILLE[f.theme].libelle,
                <span key="d" className="text-sm text-encre-3">{f.date_info ? dateLongue(f.date_info) : "—"}</span>,
                <span key="e" className="flex flex-wrap gap-1.5">
                  {f.status === "published" ? <Pastille ton="olive">Publiée</Pastille> : <Pastille>Brouillon</Pastille>}
                  {f.is_sample && <Pastille ton="ambre">Exemple</Pastille>}
                </span>,
              ],
            }))}
          />
        ))}

      {vue === "dossiers" &&
        ((dossiers.data ?? []).length === 0 ? (
          <TableauVide>Aucun dossier.</TableauVide>
        ) : (
          <TableauAdmin
            legende="Dossiers de veille"
            colonnes={["Dossier", "État"]}
            lignes={(dossiers.data ?? []).map((d) => ({
              cle: d.id,
              cellules: [
                <Link key="t" href={`/admin/veille/dossiers/${d.id}`} className="font-bold">
                  {d.titre}
                </Link>,
                <span key="e" className="flex flex-wrap gap-1.5">
                  {d.featured && <Pastille ton="terre">Dossier du moment</Pastille>}
                  {d.status === "published" ? <Pastille ton="olive">Publié</Pastille> : <Pastille>Brouillon</Pastille>}
                </span>,
              ],
            }))}
          />
        ))}

      {vue === "signalements" &&
        ((signalements.data ?? []).length === 0 ? (
          <TableauVide>Aucun signalement pour le moment.</TableauVide>
        ) : (
          <ul className="flex flex-col gap-3">
            {(signalements.data ?? []).map((s) => (
              <li key={s.id} className={`rounded-[20px] bg-white px-6 py-5 ${s.treated_at ? "opacity-70" : ""}`}>
                <p className="mb-1 text-sm text-encre-3">
                  Reçu {ilYA(s.created_at)}
                  {s.email && (
                    <>
                      {" "}
                      · <a href={`mailto:${s.email}`}>{s.email}</a>
                    </>
                  )}
                  {s.treated_at && " · traité"}
                </p>
                <p className="whitespace-pre-line">{s.message}</p>
                {s.url && (
                  <p className="mt-1 break-all text-sm">
                    <a href={s.url} target="_blank" rel="noopener noreferrer nofollow">
                      {s.url}
                    </a>
                  </p>
                )}
                <form action={marquerSignalementTraite.bind(null, s.id, !s.treated_at)} className="mt-3">
                  <BoutonAdmin type="submit" variante="secondaire">
                    {s.treated_at ? "Remettre à lire" : "Marquer comme traité"}
                  </BoutonAdmin>
                </form>
              </li>
            ))}
          </ul>
        ))}
    </>
  );
}
