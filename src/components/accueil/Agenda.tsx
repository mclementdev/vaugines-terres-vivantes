import Image from "next/image";
import Link from "next/link";

import { CarteDate } from "@/components/site/CarteDate";
import { LienBouton } from "@/components/ui/Bouton";
import { Etiquette } from "@/components/ui/Etiquette";
import type { EvenementResume } from "@/lib/data/contenus";
import { dansCombien, heure, jour, plageHoraire } from "@/lib/dates";
import { urlImage } from "@/lib/images";

export function Agenda({ evenements }: { evenements: EvenementResume[] }) {
  const vedette = evenements.find((e) => e.starts_at);
  const autres = evenements.filter((e) => e !== vedette).slice(0, 3);
  const fictifs = evenements.some((e) => e.is_sample);

  return (
    <section id="evenements" aria-labelledby="titre-agenda" className="conteneur pb-6 pt-14 md:pb-[60px] md:pt-[100px]">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 md:mb-9">
        <div>
          <p className="surtitre">Agenda</p>
          <h2 id="titre-agenda" className="titre-section">
            Venez nous retrouver
          </h2>
        </div>
        {fictifs && <NoteFictif>Dates et lieux fictifs — à remplacer</NoteFictif>}
      </div>

      {evenements.length === 0 ? (
        <p className="rounded-[22px] bg-white p-8 text-encre-2">
          Pas de rendez-vous annoncé pour le moment. Inscrivez-vous à la lettre pour être prévenu·e des prochains !
        </p>
      ) : (
        <div className="flex flex-wrap gap-6">
          {vedette?.starts_at && (
            <article className="flex min-w-0 flex-[1.3_1_520px] flex-wrap overflow-hidden rounded-[22px] bg-white md:rounded-[28px]">
              {vedette.cover_path && (
                <div className="relative h-[180px] w-full flex-[1_1_260px] md:h-auto md:min-h-[280px]">
                  <Image
                    src={urlImage(vedette.cover_path)}
                    alt={vedette.cover_alt ?? ""}
                    fill
                    sizes="(min-width: 768px) 360px, 100vw"
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex flex-[1_1_280px] flex-col gap-3 p-6 md:p-8">
                <Etiquette className="self-start bg-terre text-white">
                  Prochain rendez-vous{dansCombien(vedette.starts_at) ? ` · ${dansCombien(vedette.starts_at)}` : ""}
                </Etiquette>
                <h3 className="font-titre text-2xl font-semibold leading-[1.12] md:text-[30px]">
                  <Link href={`/evenements/${vedette.slug}`} className="text-encre no-underline hover:text-terre-fonce">
                    {vedette.titre}
                  </Link>
                </h3>
                <p className="text-encre-2">
                  <strong>
                    {jour(vedette.starts_at)}, {vedette.all_day ? "journée entière" : heure(vedette.starts_at)}
                  </strong>
                  <br />
                  {vedette.lieu}
                </p>
                {vedette.resume && <p className="text-base text-encre-2">{vedette.resume}</p>}
                <div className="mt-auto flex flex-wrap gap-2.5 pt-2">
                  <LienBouton href={`/evenements/${vedette.slug}${vedette.registration_enabled ? "#inscription" : ""}`}>
                    {vedette.registration_enabled ? "Je m'inscris" : "En savoir plus"}
                    <span className="sr-only"> : {vedette.titre}</span>
                  </LienBouton>
                  <a href={`/evenements/${vedette.slug}/agenda.ics`} className="inline-flex min-h-12 items-center px-2 font-bold">
                    Ajouter à mon agenda
                  </a>
                </div>
              </div>
            </article>
          )}

          <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-3.5">
            {autres.map((e) => (
              <Link
                key={e.id}
                href={`/evenements/${e.slug}`}
                className="carte flex items-center gap-[18px] rounded-[20px] bg-white px-5 py-[18px] text-encre no-underline hover:text-encre"
              >
                <CarteDate date={e.starts_at} libelle={e.date_label} />
                <span>
                  <strong className="block text-lg leading-tight">{e.titre}</strong>
                  <span className="text-[15px] text-encre-3">
                    {e.starts_at ? (
                      <>
                        <span className="sr-only">{jour(e.starts_at)} · </span>
                        {e.lieu} · {plageHoraire(e.starts_at, e.ends_at, e.all_day)}
                      </>
                    ) : (
                      (e.date_label ?? "Date à confirmer")
                    )}
                  </span>
                </span>
              </Link>
            ))}
            <Link href="/evenements" className="self-start px-1 py-2 font-bold">
              Tout l&apos;agenda <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}

export function NoteFictif({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg bg-pierre px-3 py-1.5 text-sm text-encre-3">{children}</p>;
}
