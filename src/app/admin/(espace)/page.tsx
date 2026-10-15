import Link from "next/link";

import { creerArticle } from "@/app/admin/actions/articles";
import { creerEvenement } from "@/app/admin/actions/evenements";
import { BoutonAdmin, CarteAdmin, EnTeteAdmin, LienAdmin, Pastille, PastilleStatut } from "@/components/admin/ui";
import { exigerAdmin } from "@/lib/auth";
import { dansCombien, ilYA, jour } from "@/lib/dates";
import { THEMES_IDEES } from "@/lib/libelles";
import { clientSession } from "@/lib/supabase/serveur";

export const metadata = { title: "Tableau de bord" };
export const instant = false;

export default async function TableauDeBord(props: PageProps<"/admin">) {
  const admin = await exigerAdmin();
  const { refus } = await props.searchParams;
  const supabase = await clientSession();
  const maintenant = new Date().toISOString();

  const [evenements, aModerer, brouillons, signalements, publies] = await Promise.all([
    supabase.from("events").select("id, titre, starts_at, capacity, registration_enabled").gte("starts_at", maintenant).neq("status", "trashed").order("starts_at").limit(4),
    supabase.from("ideas").select("id, titre, theme, display_name, created_at").eq("moderation", "pending").order("created_at").limit(5),
    supabase
      .from("articles")
      .select("id, titre, status, published_at, updated_at")
      .or(`status.eq.draft,and(status.eq.published,published_at.gt.${maintenant})`)
      .order("updated_at", { ascending: false })
      .limit(5),
    supabase.from("veille_reports").select("id", { count: "exact", head: true }).is("treated_at", null),
    supabase.from("articles").select("id", { count: "exact", head: true }).eq("status", "published").lte("published_at", maintenant),
  ]);

  const nbModeration = aModerer.data?.length ?? 0;
  const aujourdhui = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" }).format(new Date());

  return (
    <>
      <EnTeteAdmin
        surtitre={`Bonjour ${admin.prenom || ""} · ${aujourdhui}`}
        titre="Tableau de bord"
        actions={
          <>
            <form action={creerArticle}>
              <BoutonAdmin type="submit">+ Nouvel article</BoutonAdmin>
            </form>
            <form action={creerEvenement}>
              <BoutonAdmin type="submit" variante="secondaire">
                + Événement
              </BoutonAdmin>
            </form>
            <LienAdmin href="/admin/newsletter" variante="secondaire">
              Préparer la newsletter
            </LienAdmin>
          </>
        }
      />

      {refus === "superadmin" && (
        <p role="alert" className="mb-5 rounded-[14px] bg-tag-ambre px-4 py-3 font-semibold text-tag-ambre-fg">
          Cette page est réservée au superadmin.
        </p>
      )}

      <div className="mb-6 grid gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
        <Indicateur href="/admin/adherents" libelle="Adhérents" valeur="—" detail="Suivi des adhésions au lot 4" />
        <Indicateur href="/admin/articles" libelle="Articles publiés" valeur={String(publies.count ?? 0)} detail={`${brouillons.data?.length ?? 0} brouillon(s) ou programmé(s)`} />
        <Indicateur href="/admin/veille" libelle="Signalements de veille" valeur={String(signalements.count ?? 0)} detail="à lire" />
        <Indicateur
          href="/admin/moderation"
          libelle="À modérer"
          valeur={String(nbModeration)}
          detail={`${nbModeration} idée${nbModeration > 1 ? "s" : ""} →`}
          accent
        />
      </div>

      <div className="grid gap-[18px] [grid-template-columns:repeat(auto-fit,minmax(min(100%,380px),1fr))]">
        <CarteAdmin titre="Événements à venir" lien={{ href: "/admin/evenements", libelle: "Gérer" }}>
          <Liste vide="Aucun événement daté à venir.">
            {evenements.data?.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-2.5 border-t border-[#F0E6D8] py-3">
                <span>
                  <Link href={`/admin/evenements/${e.id}`} className="font-bold text-encre">
                    {e.titre}
                  </Link>
                  <span className="block text-sm text-encre-3">
                    {e.starts_at && (dansCombien(e.starts_at) ?? jour(e.starts_at))}
                  </span>
                </span>
                <span className="text-right text-sm text-encre-3">
                  {e.registration_enabled ? `${e.capacity ? `${e.capacity} places` : "Places libres"}` : "Sans inscription"}
                </span>
              </li>
            ))}
          </Liste>
        </CarteAdmin>

        <CarteAdmin titre="Idées à modérer" lien={{ href: "/admin/moderation", libelle: "Modérer" }}>
          <Liste vide="Rien à modérer. Merci !">
            {aModerer.data?.map((i) => (
              <li key={i.id} className="border-t border-[#F0E6D8] py-3">
                <strong>{i.titre}</strong>
                <span className="block text-sm text-encre-3">
                  {THEMES_IDEES[i.theme]} · {i.display_name ?? "anonyme"} · {ilYA(i.created_at)}
                </span>
              </li>
            ))}
          </Liste>
        </CarteAdmin>

        <CarteAdmin titre="Brouillons et programmés" lien={{ href: "/admin/articles", libelle: "Tous les contenus" }}>
          <Liste vide="Aucun brouillon en cours.">
            {brouillons.data?.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-2.5 border-t border-[#F0E6D8] py-3">
                <Link href={`/admin/articles/${a.id}`} className="font-bold">
                  {a.titre || "Sans titre"}
                </Link>
                <PastilleStatut status={a.status} publishedAt={a.published_at} />
              </li>
            ))}
          </Liste>
        </CarteAdmin>

        <CarteAdmin titre="Raccourcis">
          <ul className="flex flex-wrap gap-2">
            {[
              ["/admin/articles", "Articles"],
              ["/admin/evenements", "Agenda"],
              ["/admin/veille", "Veille"],
              ["/admin/accueil", "Textes de l'accueil"],
              ["/statuts", "Voir les statuts"],
            ].map(([href, libelle]) => (
              <li key={href}>
                <Link href={href} prefetch={false} className="inline-block rounded-full border-[1.5px] border-bordure-douce px-3.5 py-2 text-[15px] font-bold text-encre no-underline hover:border-terre">
                  {libelle}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-encre-3">
            <Pastille ton="ambre">À venir</Pastille> Adhésions et cotisations (lot 4), inscriptions et modération (lot 5),
            newsletter IA (lot 6).
          </p>
        </CarteAdmin>
      </div>
    </>
  );
}

function Indicateur({ href, libelle, valeur, detail, accent }: { href: string; libelle: string; valeur: string; detail: string; accent?: boolean }) {
  return (
    <Link
      href={href}
      className={
        accent
          ? "sur-sombre rounded-[18px] bg-terre px-5 py-[18px] text-white no-underline hover:bg-terre-fonce hover:text-white"
          : "rounded-[18px] bg-white px-5 py-[18px] text-encre no-underline hover:text-encre hover:shadow-md"
      }
    >
      <span className={accent ? "text-sm text-[#FFF3EA]" : "text-sm text-encre-3"}>{libelle}</span>
      <strong className="block font-titre text-4xl font-semibold leading-tight">{valeur}</strong>
      <span className={accent ? "text-sm font-bold" : "text-sm text-encre-3"}>{detail}</span>
    </Link>
  );
}

function Liste({ children, vide }: { children: React.ReactNode[] | undefined; vide: string }) {
  if (!children || children.length === 0) return <p className="text-encre-3">{vide}</p>;
  return <ul>{children}</ul>;
}
