import Image from "next/image";

import { FormulaireLettre } from "@/components/site/FormulaireLettre";
import { LienBouton } from "@/components/ui/Bouton";
import type { BlocsAccueil } from "@/lib/data/site";

import vignes from "../../../public/images/vignes.jpg";

export function Appel({ appel, lettre }: { appel: BlocsAccueil["appel"]; lettre: BlocsAccueil["lettre"] }) {
  return (
    <section aria-labelledby="titre-appel" className="sur-sombre relative isolate overflow-hidden text-white">
      <Image src={vignes} alt="" fill sizes="100vw" placeholder="blur" className="-z-20 object-cover" />
      <div
        className="absolute inset-0 -z-10 bg-[rgba(143,61,30,.92)] md:bg-[linear-gradient(90deg,rgba(143,61,30,.96)_0%,rgba(143,61,30,.88)_55%,rgba(143,61,30,.55)_100%)]"
        aria-hidden="true"
      />
      <div className="conteneur flex flex-wrap items-center gap-12 py-14 md:py-[100px]">
        <div className="flex-[1_1_520px]">
          <h2
            id="titre-appel"
            className="mb-4 font-titre text-[36px] font-semibold leading-[1.04] tracking-[-0.025em] md:text-[clamp(36px,4.6vw,60px)]"
          >
            {appel.titre}
            <br className="hidden md:block" /> {appel.titre_suite}
          </h2>
          <p className="mb-7 max-w-[540px] text-[#FFF3EA] md:text-[19px]">{appel.texte}</p>
          <LienBouton href="/adherer" variante="blanc" taille="xl" className="w-full font-extrabold text-terre-fonce sm:w-auto">
            {appel.bouton}
          </LienBouton>
        </div>
        <FormulaireLettre {...lettre} className="flex-[1_1_380px]" />
      </div>
    </section>
  );
}
