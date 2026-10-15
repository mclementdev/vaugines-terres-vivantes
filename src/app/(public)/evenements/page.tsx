import type { Metadata } from "next";

import { LigneEvenement } from "@/components/evenements/LigneEvenement";
import { EnTetePage } from "@/components/site/EnTetePage";
import { getAgenda } from "@/lib/data/pages";

export const metadata: Metadata = {
  title: "Agenda",
  description: "Balades, rencontres, débats : les prochains rendez-vous de l'association vaugines, terres vivantes, ouverts à toutes et à tous.",
  alternates: { canonical: "/evenements" },
};

export default async function Agenda() {
  const { aVenir, passes } = await getAgenda();
  const fictifs = [...aVenir, ...passes].some((e) => e.is_sample);

  return (
    <>
      <EnTetePage
        surtitre="Agenda"
        titre="Venez nous retrouver"
        intro={<p>Nos rendez-vous sont ouverts à toutes et à tous, adhérents ou non.</p>}
      />
      <div className="conteneur flex flex-col gap-14 pb-[100px]">
        <section aria-labelledby="titre-a-venir">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 id="titre-a-venir" className="font-titre text-[30px] font-semibold">
              À venir
            </h2>
            {fictifs && <p className="rounded-lg bg-pierre px-3 py-1.5 text-sm text-encre-3">Dates et lieux fictifs — à remplacer</p>}
          </div>
          {aVenir.length === 0 ? (
            <p className="rounded-[22px] bg-white p-8 text-encre-2">
              Pas de rendez-vous annoncé pour le moment. Inscrivez-vous à la lettre pour être prévenu·e des prochains !
            </p>
          ) : (
            <ul className="grid gap-3.5 [grid-template-columns:repeat(auto-fill,minmax(min(100%,340px),1fr))]">
              {aVenir.map((e) => (
                <li key={e.id}>
                  <LigneEvenement e={e} className="h-full" titreNiveau={3} />
                </li>
              ))}
            </ul>
          )}
        </section>

        {passes.length > 0 && (
          <section aria-labelledby="titre-passes">
            <h2 id="titre-passes" className="mb-5 font-titre text-[30px] font-semibold">
              Ils ont eu lieu
            </h2>
            <ul className="grid gap-3.5 opacity-90 [grid-template-columns:repeat(auto-fill,minmax(min(100%,340px),1fr))]">
              {passes.map((e) => (
                <li key={e.id}>
                  <LigneEvenement e={e} className="h-full" titreNiveau={3} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
