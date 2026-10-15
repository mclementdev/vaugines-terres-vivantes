import Image from "next/image";
import Link from "next/link";

import type { CarteArticle as Article } from "@/lib/data/pages";
import { dateLongue } from "@/lib/dates";
import { urlImage } from "@/lib/images";
import { TON_TEXTE } from "@/lib/libelles";

/** Carte d'actualité : image, catégorie colorée, date, titre. */
export function CarteArticle({ article: a, titreNiveau = 3 }: { article: Article; titreNiveau?: 2 | 3 }) {
  const Titre = `h${titreNiveau}` as const;
  return (
    <Link
      href={`/actualites/${a.slug}`}
      className="carte flex h-full flex-col overflow-hidden rounded-[22px] bg-white text-encre no-underline hover:text-encre"
    >
      {a.cover_path && (
        <div className="relative h-[190px] w-full md:h-[210px]">
          <Image src={urlImage(a.cover_path)} alt={a.cover_alt ?? ""} fill sizes="(min-width: 768px) 400px, 100vw" className="object-cover" />
        </div>
      )}
      <div className="flex flex-col gap-2 px-[22px] pb-6 pt-[18px]">
        <span className="text-sm text-encre-3">
          {a.categorie && <strong className={TON_TEXTE[a.categorie.ton]}>{a.categorie.nom}</strong>}
          {a.categorie && a.published_at && " · "}
          {a.published_at && <time dateTime={a.published_at}>{dateLongue(a.published_at)}</time>}
        </span>
        <Titre className="font-titre text-[21px] font-semibold leading-tight">{a.titre}</Titre>
      </div>
    </Link>
  );
}
