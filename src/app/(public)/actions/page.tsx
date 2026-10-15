import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { EnTetePage } from "@/components/site/EnTetePage";
import { Etiquette } from "@/components/ui/Etiquette";
import { getActions } from "@/lib/data/contenus";
import { getCommissions } from "@/lib/data/pages";
import { getReglages } from "@/lib/data/site";
import { urlImage } from "@/lib/images";
import { TON_PASTILLE_CLAIRE } from "@/lib/libelles";

export const metadata: Metadata = {
  title: "Actions et commissions",
  description: "Les actions en cours de l'association et ses commissions de travail : urbanisme, eau, patrimoine, paysage, énergie, veille démocratique…",
  alternates: { canonical: "/actions" },
};

export default async function Actions() {
  const [actions, commissions, reglages] = await Promise.all([getActions(), getCommissions(), getReglages()]);

  return (
    <>
      <EnTetePage
        surtitre="Actions en cours"
        titre="Ce qui se prépare en 2026"
        intro={<p>Les projets décidés collégialement, et les commissions où chacune et chacun peut s&apos;investir.</p>}
      />

      <div className="conteneur flex flex-col gap-16 pb-[100px]">
        <section aria-label="Actions">
          <ul className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(min(100%,270px),1fr))]">
            {actions.map((a) => (
              <li key={a.id} className="overflow-hidden rounded-[22px] bg-white">
                {a.image_path && (
                  <div className="relative h-[170px]">
                    <Image src={urlImage(a.image_path)} alt={a.image_alt ?? ""} fill sizes="(min-width: 768px) 300px, 100vw" className="object-cover" />
                  </div>
                )}
                <div className="px-6 pb-[26px] pt-[22px]">
                  <Etiquette className={TON_PASTILLE_CLAIRE[a.ton]}>{a.periode}</Etiquette>
                  <h2 className="mb-2 mt-3 font-titre text-[22px] font-semibold leading-tight">{a.titre}</h2>
                  <p className="text-base text-encre-2">
                    {a.resume}
                    {a.lien_href && a.lien_label && (
                      <>
                        {" "}
                        <Link href={a.lien_href}>{a.lien_label}</Link>.
                      </>
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-encre-2">D&apos;autres projets sont en devenir pour 2027, décidés collégialement dans le cadre des commissions et en lien avec les acteurs du territoire.</p>
        </section>

        <section id="commissions" aria-labelledby="titre-commissions" className="scroll-mt-28">
          <div className="mb-6 max-w-[720px]">
            <p className="surtitre">Commissions</p>
            <h2 id="titre-commissions" className="titre-section mb-3">
              Rejoignez une commission
            </h2>
            <p className="text-encre-2">
              Les commissions préparent les actions et nourrissent la veille. Elles sont ouvertes à toutes les adhérentes et
              tous les adhérents : écrivez-nous en indiquant le thème qui vous intéresse.
            </p>
          </div>
          <ul className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,260px),1fr))]">
            {commissions.map((c) => (
              <li key={c.id}>
                <a
                  href={`mailto:${reglages.email}?subject=${encodeURIComponent(`Je souhaite rejoindre la commission ${c.nom.toLowerCase()}`)}`}
                  className="carte flex h-full items-center justify-between gap-3 rounded-[18px] bg-white px-5 py-4 font-bold text-encre no-underline hover:text-terre-fonce"
                >
                  <span>
                    Commission {c.nom.toLowerCase()}
                    {c.description && <span className="mt-1 block text-[15px] font-normal text-encre-3">{c.description}</span>}
                  </span>
                  <span aria-hidden="true" className="text-terre">
                    →
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-encre-3">Liste non exhaustive (statuts, art. 10).</p>
        </section>
      </div>
    </>
  );
}
