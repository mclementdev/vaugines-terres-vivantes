import Link from "next/link";

import { creerArticle } from "@/app/admin/actions/articles";
import { creerEvenement } from "@/app/admin/actions/evenements";
import { PastilleCotisation } from "@/components/admin/adherents/ListeAdherents";
import { BoutonAdmin, CarteAdmin, EnTeteAdmin, LienAdmin, Pastille, PastilleStatut } from "@/components/admin/ui";
import { exigerAdmin } from "@/lib/auth";
import { dansCombien, ilYA, jour } from "@/lib/dates";
import { formatMontant } from "@/lib/adhesion/commun";
import { indicateursAdherents } from "@/lib/admin/indicateurs";
import { placesParEvenement } from "@/lib/admin/inscriptions";
import { THEMES_IDEES } from "@/lib/libelles";
import { clientSession } from "@/lib/supabase/serveur";

export const metadata = { title: "Tableau de bord" };
export const instant = false;

export default async function TableauDeBord(props: PageProps<"/admin">) {
  const admin = await exigerAdmin();
  const { refus } = await props.searchParams;
  const supabase = await clientSession();
  const maintenant = new Date().toISOString();

  const [evenements, aModerer, brouillons, signalements, adh] = await Promise.all([
    supabase.from("events").select("id, titre, starts_at, capacity, registration_enabled").gte("starts_at", maintenant).neq("status", "trashed").order("starts_at").limit(4),
    supabase.from("ideas").select("id, titre, theme, display_name, created_at").eq("moderation", "pending").order("created_at").limit(5),
    supabase
      .from("articles")
      .select("id, titre, status, published_at, updated_at")
      .or(`status.eq.draft,and(status.eq.published,published_at.gt.${maintenant})`)
      .order("updated_at", { ascending: false })
      .limit(5),
    supabase.from("veille_reports").select("id", { count: "exact", head: true }).is("treated_at", null),
    indicateursAdherents(supabase),
  ]);

  const nbIdees = aModerer.data?.length ?? 0;
  const [coms, signales] = await Promise.all([
    supabase.from("idea_comments").select("id", { count: "exact", head: true }).eq("moderation", "pending"),
    supabase.from("ideas").select("id", { count: "exact", head: true }).eq("moderation", "published").gt("report_count", 0),
  ]);
  const nbComs = coms.count ?? 0;
  const nbModeration = nbIdees + nbComs + (signales.count ?? 0);
  const prises = await placesParEvenement(supabase, (evenements.data ?? []).map((e) => e.id));
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
        <Indicateur href="/admin/adherents" libelle="Adhérents" valeur={String(adh.total)} detail={adh.semaine ? `+${adh.semaine} cette semaine` : "année d'AG en cours"} />
        <Indicateur
          href="/admin/adherents?vue=payee"
          libelle="Cotisations reçues (année AG)"
          valeur={formatMontant(adh.montantRecu)}
          detail={`${adh.cotisants} cotisant${adh.cotisants > 1 ? "s" : ""} · ${adh.sansCotisation} sans cotisation`}
        />
        <Indicateur
          href="/admin/adherents?vue=attendue"
          libelle="Virements attendus"
          valeur={String(adh.attendus)}
          detail={adh.attendusAnciens ? `dont ${adh.attendusAnciens} depuis plus de 15 jours` : "aucun en retard"}
        />
        <Indicateur
          href="/admin/moderation"
          libelle="À modérer"
          valeur={String(nbModeration)}
          detail={`${nbIdees} idée${nbIdees > 1 ? "s" : ""}, ${nbComs} commentaire${nbComs > 1 ? "s" : ""} →`}
          accent
        />
      </div>

      <div className="grid gap-[18px] [grid-template-columns:repeat(auto-fit,minmax(min(100%,380px),1fr))]">
        <CarteAdmin titre="Adhésions récentes" lien={{ href: "/admin/adherents", libelle: "Tout voir" }}>
          <Liste vide="Aucune adhésion pour l'année en cours.">
            {adh.recentes.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-2.5 border-t border-[#F0E6D8] py-3">
                <span>
                  <Link href={`/admin/adherents?id=${a.id}`} className="font-bold text-encre">
                    {a.prenom} {a.nom}
                  </Link>
                  <span className="block text-sm text-encre-3">
                    {a.joined_at && ilYA(a.joined_at)}
                    {a.source === "papier" && " · bulletin papier"}
                  </span>
                </span>
                <span className="text-right">
                  <PastilleCotisation statut={a.status} />
                  {a.status !== "sans" && <span className="block text-sm font-bold">{formatMontant(a.amount_cents)}</span>}
                </span>
              </li>
            ))}
          </Liste>
        </CarteAdmin>

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
                  {e.registration_enabled ? `${prises.get(e.id) ?? 0}${e.capacity ? ` / ${e.capacity}` : ""} inscrits` : "Sans inscription"}
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
              ["/admin/veille", `Veille${signalements.count ? ` (${signalements.count} signalement${signalements.count > 1 ? "s" : ""})` : ""}`],
              ["/admin/adherents/nouveau", "Bulletin papier"],
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
            <Pastille ton="ambre">À venir</Pastille> Inscriptions aux événements et modération (lot 5), newsletter IA (lot 6).
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
