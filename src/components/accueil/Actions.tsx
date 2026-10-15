import Image from "next/image";
import Link from "next/link";

import { Etiquette } from "@/components/ui/Etiquette";
import type { getActions } from "@/lib/data/contenus";
import { urlImage } from "@/lib/images";
import { TON_PASTILLE_SOMBRE } from "@/lib/libelles";

/** Actions en cours : grille sur ordinateur, carrousel glissable sur mobile. */
export function Actions({ actions }: { actions: Awaited<ReturnType<typeof getActions>> }) {
  if (actions.length === 0) return null;
  return (
    <section aria-labelledby="titre-actions" className="sur-sombre bg-brun py-14 text-sable md:py-[100px]">
      <div className="conteneur">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4 md:mb-11">
          <div>
            <p className="surtitre text-abricot">Actions en cours</p>
            <h2 id="titre-actions" className="titre-section">
              Ce qui se prépare en 2026
            </h2>
          </div>
          <Link href="/actions" className="hidden font-bold text-abricot-clair hover:text-white md:inline">
            Toutes les actions et commissions <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
      <ul className="conteneur flex snap-x snap-mandatory scroll-px-5 gap-3.5 overflow-x-auto pb-2 md:grid md:snap-none md:gap-5 md:overflow-visible md:pb-0 md:[grid-template-columns:repeat(auto-fit,minmax(250px,1fr))]">
        {actions.map((a) => (
          <li key={a.id} className="carte w-[78%] shrink-0 snap-start overflow-hidden rounded-[20px] bg-brun-clair md:w-auto md:rounded-[22px]">
            {a.image_path && (
              <div className="relative h-[140px] md:h-[170px]">
                <Image
                  src={urlImage(a.image_path)}
                  alt={a.image_alt ?? ""}
                  fill
                  sizes="(min-width: 768px) 300px, 78vw"
                  className="object-cover"
                />
              </div>
            )}
            <div className="px-5 pb-6 pt-5 md:px-6 md:pb-[26px] md:pt-[22px]">
              <Etiquette className={TON_PASTILLE_SOMBRE[a.ton]}>{a.periode}</Etiquette>
              <h3 className="mb-2 mt-3 font-titre text-xl font-semibold leading-tight md:text-[22px]">{a.titre}</h3>
              <p className="text-base text-creme-2">
                {a.resume}
                {a.lien_href && a.lien_label && (
                  <>
                    {" "}
                    <Link href={a.lien_href} className="text-abricot-clair hover:text-white">
                      {a.lien_label}
                    </Link>
                    .
                  </>
                )}
              </p>
            </div>
          </li>
        ))}
      </ul>
      <div className="conteneur mt-4 flex flex-wrap items-center justify-between gap-2 md:hidden">
        <p className="text-sm text-creme-2" aria-hidden="true">
          Faites glisser pour voir la suite →
        </p>
        <Link href="/actions" className="font-bold text-abricot-clair">
          Toutes les actions
        </Link>
      </div>
    </section>
  );
}
