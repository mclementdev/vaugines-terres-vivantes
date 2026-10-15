import { getStatistiques } from "@/lib/data/contenus";
import type { Reglages } from "@/lib/data/site";

/** Compteurs : calculés depuis la base, valeur forcée ou masquage possibles. */
export async function Chiffres({ reglages }: { reglages: Reglages }) {
  const stats = await getStatistiques();
  const c = reglages.chiffres;
  const pluriel = (n: number, un: string, plusieurs: string) => (n > 1 ? plusieurs : un);

  const tuiles = [
    { cle: "adherents", n: c.adherents.valeur ?? stats.adherents, visible: c.adherents.visible,
      libelle: (n: number) => pluriel(n, "adhérente ou adhérent", "adhérentes et adhérents") },
    { cle: "actions", n: c.actions.valeur ?? stats.actions, visible: c.actions.visible,
      libelle: (n: number) => pluriel(n, "action lancée en 2026", "actions lancées en 2026") },
    { cle: "rendez_vous", n: c.rendez_vous.valeur ?? stats.rendez_vous, visible: c.rendez_vous.visible,
      libelle: (n: number) => pluriel(n, "rendez-vous à venir", "rendez-vous à venir") },
    { cle: "conseil", n: c.conseil.valeur ?? stats.conseil, visible: c.conseil.visible,
      libelle: (n: number) => pluriel(n, "membre au conseil collégial", "membres au conseil collégial") },
  ].filter((t): t is typeof t & { n: number } => t.visible && typeof t.n === "number" && t.n > 0);

  if (tuiles.length === 0) return null;

  return (
    <section aria-label="L'association en chiffres" className="bg-terre text-white">
      <dl className="conteneur grid grid-cols-2 gap-4 py-[22px] md:gap-5 md:py-7 md:[grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
        {tuiles.map((t) => (
          <div key={t.cle} className="flex flex-col-reverse">
            <dt className="text-[15px] leading-snug text-[#FFF3EA]">{t.libelle(t.n)}</dt>
            <dd className="font-titre text-[36px] font-semibold leading-none md:text-[44px]">{t.n}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
