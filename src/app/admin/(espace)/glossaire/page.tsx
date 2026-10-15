import Link from "next/link";

import { EnTeteAdmin, LienAdmin, Pastille, TableauAdmin } from "@/components/admin/ui";
import { exigerAdmin } from "@/lib/auth";
import { CATEGORIES_GLOSSAIRE } from "@/lib/libelles";
import { clientSession } from "@/lib/supabase/serveur";

export const metadata = { title: "Glossaire" };
export const instant = false;

export default async function ListeGlossaire(props: PageProps<"/admin/glossaire">) {
  await exigerAdmin();
  const sp = await props.searchParams;
  const supabase = await clientSession();
  const { data } = await supabase.from("glossary_terms").select("id, terme, categorie, to_validate, status").order("terme");
  const termes = (data ?? []).sort((a, b) => a.terme.localeCompare(b.terme, "fr"));
  return (
    <>
      <EnTeteAdmin titre="Glossaire" actions={<LienAdmin href="/admin/glossaire/nouveau">+ Nouveau terme</LienAdmin>} />
      {sp.supprime && (
        <p role="status" className="mb-4 rounded-[14px] bg-tag-olive px-4 py-3 font-semibold text-tag-olive-fg">
          Terme supprimé.
        </p>
      )}
      <TableauAdmin
        legende="Termes du glossaire"
        colonnes={["Terme", "Catégorie", "État"]}
        lignes={termes.map((t) => ({
          cle: t.id,
          cellules: [
            <Link key="t" href={`/admin/glossaire/${t.id}`} className="font-bold">
              {t.terme}
            </Link>,
            CATEGORIES_GLOSSAIRE[t.categorie],
            <span key="e" className="flex flex-wrap gap-1.5">
              {t.to_validate && <Pastille ton="ambre">À valider</Pastille>}
              {t.status !== "published" && <Pastille>Non publié</Pastille>}
              {!t.to_validate && t.status === "published" && <Pastille ton="olive">Validé</Pastille>}
            </span>,
          ],
        }))}
      />
    </>
  );
}
