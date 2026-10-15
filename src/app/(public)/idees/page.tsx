import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import Link from "next/link";

import { ListeIdees } from "@/components/idees/ListeIdees";
import { LienBouton } from "@/components/ui/Bouton";
import { getIdees } from "@/lib/data/idees";
import { TAGS } from "@/lib/data/tags";
import { ilYA } from "@/lib/dates";
import { AVANCEMENT_IDEES, type AvancementIdee } from "@/lib/libelles";

export const metadata: Metadata = {
  title: "La boîte à idées du village",
  description: "Proposez, soutenez et commentez des idées pour Vaugines. Les plus soutenues sont étudiées en commission ; suivez leur avancement.",
  alternates: { canonical: "/idees" },
};

const PARCOURS: { cle: AvancementIdee; aide: string; couleur: string }[] = [
  { cle: "proposee", aide: "ouverte aux soutiens", couleur: "text-terre-fonce" },
  { cle: "etudiee", aide: "en commission", couleur: "text-olive" },
  { cle: "en_projet", aide: "on s'y met", couleur: "text-indigo" },
  { cle: "realisee", aide: "c'est fait !", couleur: "text-brun" },
];

/** Mis en cache : les dates relatives (« il y a 3 jours ») se recalculent toutes les 5 min. */
export default async function Idees() {
  "use cache";
  cacheLife("contenu");
  cacheTag(TAGS.idees);

  const idees = await getIdees();
  const depuis = Object.fromEntries(idees.map((i) => [i.id, ilYA(i.published_at)]));
  const nombre = (cle: AvancementIdee) => idees.filter((i) => i.progress === cle).length;

  return (
    <>
      <section className="bg-pierre">
        <div className="conteneur flex flex-wrap items-end justify-between gap-6 pb-8 pt-10 md:pb-10 md:pt-14">
          <div className="min-w-0 flex-[1_1_560px]">
            <p className="surtitre">Démocratie participative</p>
            <h1 className="mb-2.5 font-titre text-[34px] font-semibold leading-[1.05] tracking-[-0.02em] md:text-[clamp(36px,4.6vw,56px)]">La boîte à idées du village</h1>
            <p className="max-w-[620px] text-encre-2">
              Proposez, soutenez, commentez. Les idées les plus soutenues sont étudiées en commission, et vous suivez leur avancement ici.
            </p>
          </div>
          <LienBouton href="/idees/nouvelle" taille="lg" className="hidden md:inline-flex">
            Proposer une idée
          </LienBouton>
        </div>
        <div className="conteneur pb-10">
          <ol aria-label="Parcours d'une idée" className="grid grid-cols-2 gap-2.5 md:[grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
            {PARCOURS.map((p) => (
              <li key={p.cle} className="flex items-center justify-between rounded-[18px] bg-white px-[18px] py-4">
                <span>
                  <strong className="block">{AVANCEMENT_IDEES[p.cle].libelle}</strong>
                  <span className="text-sm text-encre-3">{p.aide}</span>
                </span>
                <span className={`font-titre text-[30px] font-semibold ${p.couleur}`}>{nombre(p.cle)}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <div className="conteneur flex flex-wrap items-start gap-8 pb-16 pt-8 md:pb-[100px] md:pt-10">
        <div className="min-w-0 flex-[999_1_600px]">
          <ListeIdees idees={idees} depuis={depuis} />
        </div>
        <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
          <div className="rounded-[22px] bg-white p-6">
            <h2 className="mb-3 font-titre text-xl font-semibold">Comment ça marche ?</h2>
            <ol className="flex list-decimal flex-col gap-2 pl-5 text-[15px] text-encre-2">
              <li>Vous proposez une idée (avec votre prénom ou anonymement).</li>
              <li>Elle est relue par l&apos;équipe sous 48 h, puis publiée.</li>
              <li>Chacun peut la soutenir et la commenter.</li>
              <li>Les idées les plus soutenues sont étudiées en commission.</li>
            </ol>
          </div>
          <div className="rounded-[22px] bg-pierre p-6">
            <h2 className="mb-2 font-titre text-xl font-semibold">Notre charte</h2>
            <p className="text-[15px] text-encre-2">
              Bienveillance, respect des personnes, pas d&apos;attaque nominative ni de propos partisans. <Link href="/idees/charte">Lire la charte</Link>
            </p>
          </div>
        </aside>
      </div>

      {/* Mobile : action principale collée en bas de l'écran */}
      <div className="sticky bottom-0 z-10 border-t border-bordure bg-white px-5 pb-[max(14px,env(safe-area-inset-bottom))] pt-3.5 md:hidden">
        <LienBouton href="/idees/nouvelle" taille="lg" className="w-full">
          Proposer une idée
        </LienBouton>
      </div>
    </>
  );
}
