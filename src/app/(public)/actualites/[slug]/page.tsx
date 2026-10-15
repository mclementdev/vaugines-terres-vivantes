import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ArticleVue } from "@/components/site/ArticleVue";
import { getArticle, getArticles, getSlugsArticles } from "@/lib/data/pages";
import { urlImage } from "@/lib/images";

export async function generateStaticParams() {
  // Au moins un paramètre est exigé au build (Cache Components) : repli en 404 si la liste est vide.
  const slugs = await getSlugsArticles();
  return (slugs.length ? slugs : ["aucun"]).map((slug) => ({ slug }));
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

  return <ArticleVue a={a} tous={tous} />;
}
