import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { FormulaireCommentaire, FormulaireSuivi, Signaler } from "@/components/idees/Interactions";
import { BoutonSoutien, CompteSoutiens, FournisseurSoutiens } from "@/components/site/BoutonSoutien";
import { Partage } from "@/components/site/Partage";
import { getIdee, getSlugsIdees } from "@/lib/data/idees";
import { TAGS } from "@/lib/data/tags";
import { ilYA } from "@/lib/dates";
import { urlPhotoIdee } from "@/lib/images";
import { AVANCEMENT_IDEES, THEMES_IDEES, type AvancementIdee } from "@/lib/libelles";
import { cn } from "@/lib/cn";

const urlSite = () => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function generateStaticParams() {
  // Au moins un paramètre est exigé au build (Cache Components) : repli en 404 si la liste est vide.
  const slugs = await getSlugsIdees();
  return (slugs.length ? slugs : ["aucune"]).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/idees/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const i = await getIdee(slug);
  if (!i) return { title: "Idée introuvable", robots: { index: false } };
  return {
    title: i.titre,
    description: i.description.slice(0, 160),
    alternates: { canonical: `/idees/${i.slug}` },
    openGraph: { title: i.titre, description: i.description.slice(0, 200), images: i.photo_path ? [{ url: urlPhotoIdee(i.photo_path) }] : undefined },
  };
}

export default function PageIdee(props: PageProps<"/idees/[slug]">) {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" aria-busy="true" />}>
      <Idee params={props.params} />
    </Suspense>
  );
}

async function Idee({ params }: Pick<PageProps<"/idees/[slug]">, "params">) {
  const { slug } = await params;
  return <ContenuIdee slug={slug} />;
}

const ETAPES: AvancementIdee[] = ["proposee", "etudiee", "en_projet", "realisee"];
const AIDE: Record<AvancementIdee, string> = {
  proposee: "Ouverte aux soutiens et aux commentaires",
  etudiee: "Étudiée en commission",
  en_projet: "On s'y met",
  realisee: "C'est fait !",
};

/** Mis en cache : dates relatives recalculées toutes les 5 min, et à chaque modération. */
async function ContenuIdee({ slug }: { slug: string }) {
  "use cache";
  cacheLife("contenu");
  cacheTag(TAGS.idees, `idee:${slug}`);

  const i = await getIdee(slug);
  if (!i) notFound();
  const statut = AVANCEMENT_IDEES[i.progress];
  const rang = ETAPES.indexOf(i.progress);

  return (
    <FournisseurSoutiens ids={[i.id]}>
      <div className="conteneur flex flex-wrap items-start gap-8 pb-16 pt-8 md:gap-10 md:pb-[100px] md:pt-12">
        <article className="min-w-0 flex-[999_1_560px]">
          <Link href="/idees" className="mb-4 inline-block font-bold">
            ← Toutes les idées
          </Link>
          <div className="mb-3 flex flex-wrap gap-2">
            <span className={cn("rounded-full px-2.5 py-0.5 text-[13px] font-bold", statut.classes)}>{statut.libelle}</span>
            <span className="rounded-full bg-white px-2.5 py-0.5 text-[13px] font-bold text-encre-2">{THEMES_IDEES[i.theme]}</span>
          </div>
          <div className="mb-5 flex items-start gap-4">
            <BoutonSoutien id={i.id} soutiens={i.support_count} titre={i.titre} taille="lg" />
            <div className="min-w-0">
              <h1 className="mb-1.5 font-titre text-[30px] font-semibold leading-[1.1] tracking-[-0.02em] [text-wrap:balance] md:text-[clamp(32px,3.8vw,46px)]">
                {i.titre}
              </h1>
              <p className="text-[15px] text-encre-3">
                {i.display_name ? `Proposée par ${i.display_name}` : "Proposée anonymement"} · {ilYA(i.published_at)}
              </p>
            </div>
          </div>

          {i.photo_path && (
            <div className="relative mb-6 aspect-[3/2] overflow-hidden rounded-[22px] bg-pierre">
              <Image src={urlPhotoIdee(i.photo_path)} alt={`Photo jointe à l'idée « ${i.titre} »`} fill sizes="(min-width: 1024px) 760px, 100vw" quality={80} className="object-cover" />
            </div>
          )}
          <p className="mb-8 whitespace-pre-line text-lg leading-relaxed text-encre-2">{i.description}</p>
          {i.is_sample && <p className="mb-6 inline-block rounded-lg bg-pierre px-2.5 py-1 text-sm text-encre-3">Idée donnée à titre d&apos;exemple (fictive).</p>}

          <section aria-labelledby="titre-parcours" className="mb-10">
            <h2 id="titre-parcours" className="mb-3 font-titre text-2xl font-semibold">
              Où en est cette idée ?
            </h2>
            <ol className="grid gap-2 sm:grid-cols-4">
              {ETAPES.map((e, n) => (
                <li
                  key={e}
                  aria-current={n === rang ? "step" : undefined}
                  className={cn("rounded-2xl px-4 py-3", n === rang ? "bg-terre text-white" : n < rang ? "bg-tag-olive text-tag-olive-fg" : "bg-white text-encre-3")}
                >
                  <strong className="block">{AVANCEMENT_IDEES[e].libelle}</strong>
                  <span className="text-sm">{AIDE[e]}</span>
                </li>
              ))}
            </ol>
          </section>

          <section id="commentaires" aria-labelledby="titre-commentaires" className="scroll-mt-28">
            <h2 id="titre-commentaires" className="mb-4 font-titre text-2xl font-semibold">
              Commentaires {i.commentaires.length > 0 && <span className="text-encre-3">· {i.commentaires.length}</span>}
            </h2>
            {i.commentaires.length === 0 ? (
              <p className="mb-6 text-encre-2">Pas encore de commentaire : donnez votre avis !</p>
            ) : (
              <ol className="mb-6 flex flex-col gap-3">
                {i.commentaires.map((c) => (
                  <li key={c.id} className="rounded-[18px] bg-white px-5 py-4">
                    <p className="mb-1 text-sm">
                      <strong>{c.display_name ?? "Anonyme"}</strong> <span className="text-encre-3">· {ilYA(c.published_at)}</span>
                    </p>
                    <p className="whitespace-pre-line text-encre-2">{c.body}</p>
                    <Signaler cible={{ commentaire: c.id }} libelle="Signaler ce commentaire" />
                  </li>
                ))}
              </ol>
            )}
            <FormulaireCommentaire ideaId={i.id} />
          </section>
        </article>

        <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-4 lg:sticky lg:top-24">
          <div className="rounded-[22px] bg-white p-6">
            <CompteSoutiens id={i.id} soutiens={i.support_count} />
            <p className="mb-4 text-[15px] text-encre-2">Cliquez sur la flèche à côté du titre pour soutenir cette idée. Les idées les plus soutenues sont étudiées en commission.</p>
            <FormulaireSuivi ideaId={i.id} />
          </div>
          <div className="rounded-[22px] bg-pierre p-6">
            <Partage url={`${urlSite()}/idees/${i.slug}`} titre={i.titre} />
            <div className="mt-3 border-t border-bordure pt-3">
              <Signaler cible={{ idee: i.id }} libelle="Signaler cette idée" />
            </div>
          </div>
        </aside>
      </div>
    </FournisseurSoutiens>
  );
}
