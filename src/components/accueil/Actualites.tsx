import Image from "next/image";
import Link from "next/link";

import type { getArticlesRecents } from "@/lib/data/contenus";
import { dateLongue } from "@/lib/dates";
import { urlImage } from "@/lib/images";
import { TON_TEXTE } from "@/lib/libelles";
import { cn } from "@/lib/cn";

export function Actualites({ articles }: { articles: Awaited<ReturnType<typeof getArticlesRecents>> }) {
  if (articles.length === 0) return null;
  return (
    <section aria-labelledby="titre-actualites" className="conteneur pb-14 pt-8 md:pb-[100px] md:pt-[60px]">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 md:mb-9">
        <div>
          <p className="surtitre">Actualités</p>
          <h2 id="titre-actualites" className="titre-section">
            La vie de l&apos;association
          </h2>
        </div>
        <Link href="/actualites" className="font-bold">
          Toutes les actualités <span aria-hidden="true">→</span>
        </Link>
      </div>
      <ul className="grid gap-2.5 md:gap-6 md:[grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]">
        {articles.map((a, i) => (
          <li key={a.id}>
            <Link
              href={`/actualites/${a.slug}`}
              className={cn(
                "carte flex h-full overflow-hidden rounded-[18px] bg-white text-encre no-underline hover:text-encre md:flex-col md:rounded-[22px]",
                i === 0 ? "flex-col" : "flex-row",
              )}
            >
              {a.cover_path && (
                <div className={cn("relative shrink-0 md:h-[210px] md:w-full", i === 0 ? "h-[170px] w-full" : "w-[100px]")}>
                  <Image
                    src={urlImage(a.cover_path)}
                    alt={a.cover_alt ?? ""}
                    fill
                    sizes="(min-width: 768px) 400px, 100vw"
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex flex-col gap-1.5 px-[18px] py-4 md:gap-2.5 md:px-6 md:pb-[26px] md:pt-[22px]">
                <span className="text-sm text-encre-3">
                  {a.categorie && <strong className={TON_TEXTE[a.categorie.ton]}>{a.categorie.nom}</strong>}
                  {a.categorie && " · "}
                  {a.published_at && <time dateTime={a.published_at}>{dateLongue(a.published_at)}</time>}
                </span>
                <h3 className="font-titre text-lg font-semibold leading-tight md:text-[22px]">{a.titre}</h3>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
