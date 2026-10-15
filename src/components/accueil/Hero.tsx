import Image from "next/image";

import { GroupeCypres } from "@/components/site/Cypres";
import { LienBouton } from "@/components/ui/Bouton";
import type { BlocsAccueil } from "@/lib/data/site";

import village from "../../../public/images/village.jpg";

export function Hero({ bloc }: { bloc: BlocsAccueil["hero"] }) {
  return (
    <section className="sur-sombre relative isolate flex min-h-[600px] items-end overflow-hidden text-white lg:min-h-[680px]">
      <Image
        src={village}
        alt=""
        fill
        priority
        quality={80}
        sizes="100vw"
        placeholder="blur"
        className="-z-20 object-cover object-[62%_center] md:object-[center_40%]"
      />
      <div
        className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(43,25,15,.12)_0%,rgba(43,25,15,.3)_40%,rgba(43,25,15,.85)_100%)] md:bg-[linear-gradient(180deg,rgba(43,25,15,.15)_0%,rgba(43,25,15,.25)_45%,rgba(43,25,15,.78)_100%)]"
        aria-hidden="true"
      />
      {/* Voile latéral : garantit le contraste AA du texte sur la photo. */}
      <div
        className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(43,25,15,.55)_0%,rgba(43,25,15,.35)_45%,rgba(43,25,15,0)_75%)]"
        aria-hidden="true"
      />
      <div className="conteneur flex flex-wrap items-end justify-between gap-10 pb-8 pt-28 md:pb-[72px] md:pt-[120px]">
        <div className="max-w-[760px] flex-[1_1_560px]">
          <p className="mb-[18px] inline-flex rounded-full border border-white/35 bg-white/15 px-3.5 py-1.5 text-sm font-semibold tracking-[0.02em]">
            {bloc.surtitre}
          </p>
          <h1 className="font-titre text-[44px] font-semibold leading-[1.02] tracking-[-0.025em] [text-wrap:balance] md:text-[clamp(44px,6vw,80px)]">
            {bloc.titre} <span className="text-abricot">{bloc.titre_accent}</span>
          </h1>
          <p className="mt-[22px] max-w-[600px] text-lg leading-normal text-[#FBF4EA] md:text-xl">{bloc.texte}</p>
          <div className="mt-8 flex flex-col gap-3.5 sm:flex-row sm:flex-wrap">
            <LienBouton href="/adherer" taille="lg">
              Adhérer à l&apos;association
            </LienBouton>
            <LienBouton href="/#evenements" variante="blanc" taille="lg">
              Voir les prochains événements
            </LienBouton>
          </div>
          <p className="mt-4 text-[15px] text-[#F1E3D1]">{bloc.note}</p>
        </div>
        <GroupeCypres className="hidden opacity-85 md:block" />
      </div>
    </section>
  );
}
