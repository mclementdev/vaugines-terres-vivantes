import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { Avancement, DecisionCommentaire, DecisionIdee, DecisionSignalement } from "@/components/admin/Moderation";
import { EnTeteAdmin, Pastille } from "@/components/admin/ui";
import { exigerAdmin } from "@/lib/auth";
import { ilYA } from "@/lib/dates";
import { urlPhotoIdee } from "@/lib/images";
import { THEMES_IDEES } from "@/lib/libelles";
import { cn } from "@/lib/cn";
import { clientSession } from "@/lib/supabase/serveur";

export const metadata = { title: "Modération" };
export const instant = false;

const VUES = [
  { cle: "a-traiter", libelle: "À traiter" },
  { cle: "statuts", libelle: "Statuts des idées publiées" },
  { cle: "historique", libelle: "Historique" },
] as const;

const ACTIONS: Record<string, string> = {
  idee_publiee: "Idée publiée",
  idee_modification: "Modification demandée",
  idee_refusee: "Idée refusée",
  idee_retiree: "Idée retirée après signalement",
  commentaire_publie: "Commentaire publié",
  commentaire_refuse: "Commentaire refusé",
  commentaire_retire: "Commentaire retiré après signalement",
  signalement_classe: "Signalement classé",
  avancement_proposee: "Statut : proposée",
  avancement_etudiee: "Statut : étudiée",
  avancement_en_projet: "Statut : en projet",
  avancement_realisee: "Statut : réalisée",
};

export default async function Moderation(props: PageProps<"/admin/moderation">) {
  await exigerAdmin();
  const sp = await props.searchParams;
  const vue = VUES.some((v) => v.cle === sp.vue) ? (sp.vue as (typeof VUES)[number]["cle"]) : "a-traiter";
  const supabase = await clientSession();

  const [idees, commentaires, ideesSignalees, comsSignales, publiees, historique] = await Promise.all([
    supabase.from("ideas").select("id, titre, description, theme, display_name, photo_path, created_at, is_sample").eq("moderation", "pending").order("created_at"),
    supabase.from("idea_comments").select("id, body, display_name, created_at, ideas(titre, slug)").eq("moderation", "pending").order("created_at"),
    supabase.from("ideas").select("id, titre, description, slug, report_count").eq("moderation", "published").gt("report_count", 0),
    supabase.from("idea_comments").select("id, body, report_count, ideas(titre, slug)").eq("moderation", "published").gt("report_count", 0),
    vue === "statuts"
      ? supabase.from("ideas").select("id, titre, slug, progress, support_count, is_sample").eq("moderation", "published").order("support_count", { ascending: false })
      : Promise.resolve({ data: null }),
    vue === "historique"
      ? supabase.from("moderation_log").select("id, libelle, action, motif, created_at, profiles(prenom)").order("created_at", { ascending: false }).limit(100)
      : Promise.resolve({ data: null }),
  ]);
  const nb = (idees.data?.length ?? 0) + (commentaires.data?.length ?? 0) + (ideesSignalees.data?.length ?? 0) + (comsSignales.data?.length ?? 0);

  return (
    <>
      <EnTeteAdmin titre="Modération" surtitre="Rien n'est publié sans relecture. Objectif : répondre sous 48 h." />
      <nav aria-label="File de modération" className="mb-5 flex flex-wrap gap-2">
        {VUES.map((v, i) => (
          <Link
            key={v.cle}
            href={i === 0 ? "/admin/moderation" : `/admin/moderation?vue=${v.cle}`}
            aria-current={vue === v.cle ? "page" : undefined}
            className={cn(
              "rounded-full border-[1.5px] px-3.5 py-2 text-[15px] font-bold no-underline",
              vue === v.cle ? "border-brun bg-brun text-white hover:text-white" : "border-bordure-douce bg-white text-encre hover:border-terre",
            )}
          >
            {v.libelle}
            {i === 0 && ` · ${nb}`}
          </Link>
        ))}
      </nav>

      {vue === "a-traiter" && (
        <div className="flex flex-col gap-3.5">
          {nb === 0 && (
            <div className="rounded-[20px] bg-white p-8 text-center">
              <p className="mb-1 font-titre text-xl font-semibold">Tout est traité</p>
              <p className="text-encre-2">Merci ! Vous serez prévenu·e par e-mail des prochains dépôts.</p>
            </div>
          )}
          {idees.data?.map((i) => (
            <Carte key={i.id} type="Idée" meta={`${THEMES_IDEES[i.theme]} · ${i.display_name ?? "anonyme"} · ${ilYA(i.created_at)}`} titre={i.titre} exemple={i.is_sample}>
              <p className="mb-3 whitespace-pre-line text-encre-2">{i.description}</p>
              {i.photo_path && (
                <Image src={urlPhotoIdee(i.photo_path)} alt="Photo jointe par l'auteur" width={240} height={160} quality={70} className="mb-3 h-[160px] w-[240px] rounded-xl object-cover" />
              )}
              <DecisionIdee id={i.id} />
            </Carte>
          ))}
          {commentaires.data?.map((c) => {
            const idee = c.ideas as { titre: string; slug: string } | null;
            return (
              <Carte key={c.id} type="Commentaire" meta={`${c.display_name ?? "anonyme"} · ${ilYA(c.created_at)}`} titre={`Sur « ${idee?.titre ?? "?"} »`}>
                <p className="mb-3 whitespace-pre-line text-encre-2">{c.body}</p>
                <DecisionCommentaire id={c.id} />
              </Carte>
            );
          })}
          {ideesSignalees.data?.map((i) => (
            <Carte key={i.id} type="Idée publiée" titre={i.titre} alerte={`Signalée par ${i.report_count} personne${i.report_count > 1 ? "s" : ""}`}>
              <p className="mb-2 line-clamp-3 text-encre-2">{i.description}</p>
              <Link href={`/idees/${i.slug}`} target="_blank" className="mb-3 inline-block text-sm font-bold">
                Voir sur le site
              </Link>
              <DecisionSignalement cible={{ idee: i.id }} />
            </Carte>
          ))}
          {comsSignales.data?.map((c) => {
            const idee = c.ideas as { titre: string; slug: string } | null;
            return (
              <Carte key={c.id} type="Commentaire publié" titre={`Sur « ${idee?.titre ?? "?"} »`} alerte={`Signalé par ${c.report_count} personne${c.report_count > 1 ? "s" : ""}`}>
                <p className="mb-3 whitespace-pre-line text-encre-2">{c.body}</p>
                <DecisionSignalement cible={{ commentaire: c.id }} />
              </Carte>
            );
          })}
        </div>
      )}

      {vue === "statuts" && (
        <section className="rounded-[20px] bg-white px-6 py-[22px]">
          <h2 className="mb-1 font-titre text-xl font-semibold">Faire avancer une idée publiée</h2>
          <p className="mb-4 text-[15px] text-encre-3">Le changement de statut est visible publiquement et prévient l&apos;auteur et les personnes qui suivent l&apos;idée.</p>
          {(publiees.data ?? []).length === 0 && <p className="text-encre-2">Aucune idée publiée.</p>}
          <ul>
            {publiees.data?.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-[#F0E6D8] py-3.5 first:border-0">
                <span>
                  <Link href={`/idees/${i.slug}`} target="_blank" className="font-bold text-encre">
                    {i.titre}
                  </Link>{" "}
                  <span className="text-sm text-encre-3">
                    · {i.support_count} soutien{i.support_count > 1 ? "s" : ""}
                    {i.is_sample && " · exemple"}
                  </span>
                </span>
                <Avancement id={i.id} actuel={i.progress} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {vue === "historique" && (
        <section className="rounded-[20px] bg-white px-6 py-[22px]">
          {(historique.data ?? []).length === 0 ? (
            <p className="text-encre-2">Aucune décision pour l&apos;instant.</p>
          ) : (
            <ol className="flex flex-col gap-2.5 border-l-2 border-pierre pl-4 text-[15px]">
              {historique.data?.map((h) => (
                <li key={h.id}>
                  <strong>{new Date(h.created_at).toLocaleString("fr-FR", { timeZone: "Europe/Paris", dateStyle: "short", timeStyle: "short" })}</strong> ·{" "}
                  {ACTIONS[h.action] ?? h.action} : « {h.libelle} »
                  {(h.profiles as { prenom: string } | null)?.prenom && <span className="text-encre-3"> · par {(h.profiles as { prenom: string }).prenom}</span>}
                  {h.motif && <span className="block text-sm text-encre-3">Motif : {h.motif}</span>}
                </li>
              ))}
            </ol>
          )}
        </section>
      )}
    </>
  );
}

function Carte({ type, meta, titre, alerte, exemple, children }: { type: string; meta?: string; titre: string; alerte?: string; exemple?: boolean; children: ReactNode }) {
  return (
    <article className="rounded-[20px] bg-white px-6 py-5">
      <div className="mb-1.5 flex flex-wrap items-center gap-2">
        <Pastille ton={type.startsWith("Idée") ? "terre" : "indigo"}>{type}</Pastille>
        {meta && <span className="text-sm text-encre-3">{meta}</span>}
        {alerte && <Pastille ton="ambre">{alerte}</Pastille>}
        {exemple && <Pastille>exemple</Pastille>}
      </div>
      <h2 className="mb-2 font-titre text-xl font-semibold">{titre}</h2>
      {children}
    </article>
  );
}
