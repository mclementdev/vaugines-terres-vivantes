import Link from "next/link";

import { EnTeteAdmin, LienAdmin, Pastille } from "@/components/admin/ui";
import { exigerAdmin } from "@/lib/auth";
import { CATEGORIES_FAQ, type CategorieFaq } from "@/lib/libelles";
import { clientSession } from "@/lib/supabase/serveur";

export const metadata = { title: "FAQ" };
export const instant = false;

export default async function ListeFaq(props: PageProps<"/admin/faq">) {
  await exigerAdmin();
  const sp = await props.searchParams;
  const supabase = await clientSession();
  const { data } = await supabase.from("faq_items").select("id, category, question, position, show_on_home, to_validate, status").order("position");
  const questions = data ?? [];
  return (
    <>
      <EnTeteAdmin titre="Questions fréquentes" actions={<LienAdmin href="/admin/faq/nouvelle">+ Nouvelle question</LienAdmin>} />
      {sp.supprime && (
        <p role="status" className="mb-4 rounded-[14px] bg-tag-olive px-4 py-3 font-semibold text-tag-olive-fg">
          Question supprimée.
        </p>
      )}
      <div className="flex flex-col gap-5">
        {(Object.keys(CATEGORIES_FAQ) as CategorieFaq[]).map((c) => {
          const items = questions.filter((q) => q.category === c);
          return (
            <section key={c} className="rounded-[20px] bg-white px-6 py-5">
              <h2 className="mb-2 font-titre text-xl font-semibold">{CATEGORIES_FAQ[c]}</h2>
              {items.length === 0 ? (
                <p className="text-encre-3">Aucune question.</p>
              ) : (
                <ul>
                  {items.map((q) => (
                    <li key={q.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-[#F0E6D8] py-2.5 first:border-t-0">
                      <Link href={`/admin/faq/${q.id}`} className="font-bold">
                        {q.question}
                      </Link>
                      <span className="flex flex-wrap gap-1.5">
                        {q.show_on_home && <Pastille ton="indigo">Accueil</Pastille>}
                        {q.to_validate && <Pastille ton="ambre">À valider</Pastille>}
                        {q.status !== "published" && <Pastille>Non publiée</Pastille>}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
