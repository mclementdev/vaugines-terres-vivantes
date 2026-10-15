import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { CarteArticle } from "@/components/site/CarteArticle";
import { Partage } from "@/components/site/Partage";
import { LienBouton } from "@/components/ui/Bouton";
import { Etiquette } from "@/components/ui/Etiquette";
import { getArticle, getArticles, getSlugsArticles } from "@/lib/data/pages";
import { dateLongue } from "@/lib/dates";
import { urlImage } from "@/lib/images";
import { TON_PASTILLE_CLAIRE } from "@/lib/libelles";

const urlSite = () => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function generateStaticParams() {
  return (await getSlugsArticles()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/actualites/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const a = await getArticle(slug);
  if (!a) return { title: "Article introuvable", robots: { index: false } };
  return {
    title: a.titre,
    description: a.chapeau,
    alternates: { canonical: `/actualites/${a.slug}` },
    openGraph: {
      type: "article",
      title: a.titre,
      description: a.chapeau,
      publishedTime: a.published_at ?? undefined,
      images: a.cover_path ? [{ url: urlImage(a.cover_path), alt: a.cover_alt ?? "" }] : undefined,
    },
  };
}

export default function PageArticle(props: PageProps<"/actualites/[slug]">) {
  return (
    <Suspense fallback={<div className="conteneur min-h-[60vh] py-16" aria-busy="true" />}>
      <Article params={props.params} />
    </Suspense>
  );
}

async function Article({ params }: Pick<PageProps<"/actualites/[slug]">, "params">) {
  const { slug } = await params;
  const [a, tous] = await Promise.all([getArticle(slug), getArticles()]);
  if (!a) notFound();

  const url = `${urlSite()}/actualites/${a.slug}`;
  const mots = a.body_html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(mots / 200));
  // À lire aussi : même catégorie d'abord, puis les plus récents.
  const autres = tous
    .filter((x) => x.slug !== a.slug)
    .sort((x, y) => Number(y.categorie?.slug === a.categorie?.slug) - Number(x.categorie?.slug === a.categorie?.slug))
    .slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.titre,
    description: a.chapeau,
    datePublished: a.published_at,
    dateModified: a.updated_at,
    image: a.cover_path ? [new URL(urlImage(a.cover_path), urlSite()).toString()] : undefined,
    author: { "@type": "Organization", name: "vaugines, terres vivantes" },
    publisher: { "@type": "Organization", name: "vaugines, terres vivantes", logo: { "@type": "ImageObject", url: `${urlSite()}/icon.svg` } },
    mainEntityOfPage: url,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <article>
        <header className="mx-auto max-w-[820px] px-5 pb-8 pt-12 md:px-6">
          <nav aria-label="Fil d'Ariane" className="mb-5 text-[15px] text-encre-3">
            <ol className="flex flex-wrap gap-1.5">
              <li>
                <Link href="/">Accueil</Link> ›
              </li>
              <li>
                <Link href="/actualites">Actualités</Link>
                {a.categorie && " ›"}
              </li>
              {a.categorie && <li aria-current="page">{a.categorie.nom}</li>}
            </ol>
          </nav>
          {a.categorie && <Etiquette className={`mb-3.5 ${TON_PASTILLE_CLAIRE[a.categorie.ton]}`}>{a.categorie.nom}</Etiquette>}
          <h1 className="mb-[18px] font-titre text-[clamp(36px,4.8vw,58px)] font-semibold leading-[1.05] tracking-[-0.02em] [text-wrap:balance]">
            {a.titre}
          </h1>
          {a.chapeau && <p className="mb-6 text-xl leading-normal text-encre-2 md:text-[21px]">{a.chapeau}</p>}
          <div className="flex flex-wrap items-center justify-between gap-3.5 border-t border-bordure pt-[18px]">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-full bg-terre font-titre text-white" aria-hidden="true">
                {a.author_label
                  .replace(/^(le|la|les)\s+/i, "")
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((m) => m[0]?.toUpperCase())
                  .join("")}
              </span>
              <span className="text-[15px] leading-snug">
                <strong className="block">{a.author_label}</strong>
                <span className="text-encre-3">
                  {a.published_at && <time dateTime={a.published_at}>{dateLongue(a.published_at)}</time>} · {minutes} min de lecture
                </span>
              </span>
            </div>
            <Partage url={url} titre={a.titre} />
          </div>
        </header>

        {a.cover_path && (
          <figure className="mx-auto max-w-[1100px] px-5 md:px-6">
            <div className="relative h-[clamp(240px,42vw,560px)] overflow-hidden rounded-[22px] md:rounded-[28px]">
              <Image src={urlImage(a.cover_path)} alt={a.cover_alt ?? ""} fill priority sizes="(min-width: 1100px) 1050px, 100vw" className="object-cover" />
            </div>
            {a.cover_caption && <figcaption className="mt-2.5 text-center text-sm text-encre-3">{a.cover_caption}</figcaption>}
          </figure>
        )}

        <div
          className="prose-vtv prose-article mx-auto max-w-[720px] px-5 pt-8 md:px-6"
          dangerouslySetInnerHTML={{ __html: a.body_html }}
        />

        {a.tags.length > 0 && (
          <ul className="mx-auto flex max-w-[720px] flex-wrap gap-2 px-5 pt-6 md:px-6" aria-label="Mots-clés">
            {a.tags.map((t) => (
              <li key={t} className="rounded-full bg-white px-3 py-1.5 text-sm font-bold text-encre-2">
                #{t}
              </li>
            ))}
          </ul>
        )}
      </article>

      <section aria-label="Adhérer" className="mx-auto mt-12 max-w-[720px] px-5 md:px-6">
        <div className="sur-sombre flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-terre px-[30px] py-7 text-white">
          <div>
            <p className="font-titre text-[22px] font-semibold">Envie d&apos;en être ?</p>
            <p className="text-base text-[#FFF3EA]">Adhésion libre, avec ou sans cotisation.</p>
          </div>
          <LienBouton href="/adherer" variante="blanc" className="text-terre-fonce">
            Adhérer
          </LienBouton>
        </div>
      </section>

      {autres.length > 0 && (
        <section aria-labelledby="titre-lire-aussi" className="conteneur pb-[100px] pt-[72px]">
          <h2 id="titre-lire-aussi" className="mb-[22px] font-titre text-[30px] font-semibold">
            À lire aussi
          </h2>
          <ul className="grid gap-[22px] [grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr))]">
            {autres.map((x) => (
              <li key={x.id}>
                <CarteArticle article={x} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
