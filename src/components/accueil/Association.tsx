import Image from "next/image";
import Link from "next/link";

import { VillageTrait } from "@/components/site/VillageTrait";
import type { BlocsAccueil, getConseil } from "@/lib/data/site";
import { cn } from "@/lib/cn";
import { urlImage } from "@/lib/images";

const TEINTES_PILIERS = [
  { carte: "bg-white", numero: "text-olive", texte: "text-encre-2" },
  { carte: "bg-white", numero: "text-indigo", texte: "text-encre-2" },
  { carte: "sur-sombre bg-brun text-sable", numero: "text-abricot", texte: "text-creme" },
];

export function Association({ bloc }: { bloc: BlocsAccueil["association"] }) {
  return (
    <section id="association" aria-labelledby="titre-association" className="conteneur pb-6 pt-14 md:pb-10 md:pt-[110px]">
      <div className="flex flex-wrap items-start gap-x-12 gap-y-4">
        <div className="flex-[1_1_420px]">
          <p className="surtitre">{bloc.surtitre}</p>
          <h2 id="titre-association" className="titre-section [text-wrap:balance]">
            {bloc.titre}
          </h2>
        </div>
        <div className="flex-[1_1_480px] text-encre-2 md:text-[19px]">
          {bloc.paragraphes.map((p, i) => (
            <p key={i} className={i > 0 ? "mt-4" : undefined}>
              {p}
            </p>
          ))}
        </div>
      </div>

      <ul className="mt-8 grid gap-4 md:mt-16 md:gap-6 md:[grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]">
        {bloc.piliers.map((p, i) => {
          const t = TEINTES_PILIERS[i % TEINTES_PILIERS.length];
          return (
            <li key={p.titre} className={cn("carte flex overflow-hidden rounded-[22px] md:flex-col md:rounded-3xl", t.carte)}>
              <div className="relative w-[104px] shrink-0 md:h-[200px] md:w-full">
                <Image src={urlImage(p.image)} alt={p.alt} fill sizes="(min-width: 768px) 400px, 104px" className="object-cover" />
              </div>
              <div className="px-5 py-4 md:px-7 md:pb-[30px] md:pt-[26px]">
                <span className={cn("font-titre text-[15px] font-semibold", t.numero)}>{p.numero}</span>
                <h3 className="mb-1 mt-1 font-titre text-xl font-semibold leading-tight md:mb-2.5 md:mt-1.5 md:text-[25px]">
                  {p.titre}
                </h3>
                <p className={cn("text-base md:text-[17px]", t.texte)}>{p.texte}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function PourquoiCeNom({ bloc }: { bloc: BlocsAccueil["nom"] }) {
  return (
    <section aria-labelledby="titre-nom" className="conteneur py-8 md:py-[70px]">
      <div className="overflow-hidden rounded-[28px] bg-pierre px-6 pt-10 md:rounded-[32px] md:px-12 md:pt-14">
        <p className="surtitre">{bloc.surtitre}</p>
        <h2
          id="titre-nom"
          className="mb-7 font-titre text-[clamp(36px,5vw,64px)] font-medium leading-none tracking-[-0.02em] md:mb-9"
        >
          vaugines, <span className="font-semibold text-terre">terres vivantes</span>
        </h2>
        <div className="grid gap-x-14 gap-y-8 md:grid-cols-2">
          <ListeNom titre="terres" couleur="text-olive" items={bloc.terres} />
          <ListeNom titre="vivantes" couleur="text-terre" items={bloc.vivantes} />
        </div>
        <VillageTrait className="mx-auto mt-8 h-auto w-full max-w-[980px] opacity-80" />
      </div>
    </section>
  );
}

function ListeNom({ titre, couleur, items }: { titre: string; couleur: string; items: string[] }) {
  return (
    <div>
      <h3 className={cn("mb-3 font-titre text-[28px] font-semibold", couleur)}>{titre}</h3>
      <ul className="flex list-disc flex-col gap-2 pl-5 text-encre-2">
        {items.map((it) => (
          <li key={it}>{it}</li>
        ))}
      </ul>
    </div>
  );
}

const PASTILLES = ["bg-terre", "bg-olive", "bg-indigo", "bg-ocre", "bg-brun"];

export function Gouvernance({
  bloc,
  conseil,
}: {
  bloc: BlocsAccueil["gouvernance"];
  conseil: Awaited<ReturnType<typeof getConseil>>;
}) {
  return (
    <section aria-labelledby="titre-gouvernance" className="conteneur pb-14 pt-6 md:pb-[100px] md:pt-10">
      <div className="flex flex-wrap items-center gap-12">
        <div className="flex-[1_1_380px]">
          <p className="surtitre">{bloc.surtitre}</p>
          <h2 id="titre-gouvernance" className="mb-[18px] font-titre text-[clamp(30px,3.4vw,44px)] font-semibold leading-[1.1] tracking-[-0.02em]">
            {bloc.titre}
          </h2>
          <p className="mb-3.5 text-encre-2">{bloc.texte}</p>
          <p className="text-encre-2">
            {bloc.commissions} <Link href="/actions#commissions">Rejoignez une commission</Link>.
          </p>
        </div>
        <div className="flex-[1_1_560px]">
          <h3 className="mb-4 font-bold">{bloc.titre_conseil}</h3>
          <ul className="grid grid-cols-3 gap-x-2 gap-y-4 md:gap-4 md:[grid-template-columns:repeat(auto-fit,minmax(150px,1fr))]">
            {conseil.map((m, i) => (
              <li
                key={m.id}
                className="flex flex-col items-center gap-1.5 text-center text-sm font-semibold md:gap-2.5 md:text-[17px]"
              >
                <span
                  className={cn(
                    "flex size-[68px] items-center justify-center rounded-full font-titre text-[22px] font-medium text-white md:size-24 md:text-3xl",
                    PASTILLES[i % PASTILLES.length],
                  )}
                  aria-hidden="true"
                >
                  {m.prenom[0]}
                  {m.nom[0]}
                </span>
                <span className="leading-tight">
                  {m.prenom} {m.nom}
                  {m.role && <span className="block text-sm font-normal text-encre-3">{m.role}</span>}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3.5 text-sm text-encre-3">{bloc.note_portraits}</p>
        </div>
      </div>
    </section>
  );
}
