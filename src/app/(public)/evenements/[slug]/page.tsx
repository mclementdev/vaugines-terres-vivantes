import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { cacheLife, cacheTag } from "next/cache";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ActionsEvenement } from "@/components/evenements/ActionsEvenement";
import { CarteOSM } from "@/components/evenements/CarteOSM";
import { FormulaireInscription } from "@/components/evenements/FormulaireInscription";
import { LigneEvenement } from "@/components/evenements/LigneEvenement";
import { Etiquette } from "@/components/ui/Etiquette";
import { getAgenda, getEvenement, getSlugsEvenements, type EtapeProgramme } from "@/lib/data/pages";
import { getReglages } from "@/lib/data/site";
import { TAGS } from "@/lib/data/tags";
import { aBientot, dansCombien, jour, plageHoraire } from "@/lib/dates";
import { urlImage } from "@/lib/images";
import { publicClient } from "@/lib/supabase/public";

import aerien from "../../../../../public/images/aerien.jpg";

const urlSite = () => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function generateStaticParams() {
  // Au moins un paramètre est exigé au build (Cache Components) : repli en 404 si la liste est vide.
  const slugs = await getSlugsEvenements();
  return (slugs.length ? slugs : ["aucun"]).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/evenements/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const e = await getEvenement(slug);
  if (!e) return { title: "Événement introuvable", robots: { index: false } };
  const quand = e.starts_at ? `${jour(e.starts_at)} · ` : "";
  return {
    title: e.titre,
    description: `${quand}${e.lieu}. ${e.resume}`,
    alternates: { canonical: `/evenements/${e.slug}` },
    openGraph: {
      title: e.titre,
      description: e.resume,
      images: e.cover_path ? [{ url: urlImage(e.cover_path), alt: e.cover_alt ?? "" }] : undefined,
    },
  };
}

export default function PageEvenement(props: PageProps<"/evenements/[slug]">) {
  return (
    <Suspense fallback={<div className="min-h-[70vh] bg-brun" aria-busy="true" />}>
      <Evenement params={props.params} />
    </Suspense>
  );
}

async function Evenement({ params }: Pick<PageProps<"/evenements/[slug]">, "params">) {
  const { slug } = await params;
  return <ContenuEvenement slug={slug} />;
}

/** Mis en cache : « dans 9 jours » et « passé » se recalculent toutes les 5 min. */
async function ContenuEvenement({ slug }: { slug: string }) {
  "use cache";
  cacheLife("contenu");
  cacheTag(TAGS.evenements, `evenement:${slug}`, TAGS.reglages);

  const [e, agenda, reglages] = await Promise.all([getEvenement(slug), getAgenda(), getReglages()]);
  if (!e) notFound();

  const url = `${urlSite()}/evenements/${e.slug}`;
  const prises = e.registration_enabled ? ((await publicClient().rpc("places_prises", { p_event_id: e.id })).data ?? 0) : 0;
  const restantes = e.capacity ? Math.max(e.capacity - prises, 0) : null;
  const auRevoir = e.starts_at ? aBientot(e.starts_at) : "à bientôt";
  const passe = e.starts_at ? new Date(e.ends_at ?? e.starts_at) < new Date() : false;
  const relatif = e.starts_at && !passe ? dansCombien(e.starts_at) : null;
  const programme = (e.programme as EtapeProgramme[] | null) ?? [];
  const autres = agenda.aVenir.filter((x) => x.slug !== e.slug).slice(0, 3);

  const jsonLd = e.starts_at && {
    "@context": "https://schema.org",
    "@type": "Event",
    name: e.titre,
    description: e.resume,
    startDate: e.starts_at,
    endDate: e.ends_at ?? undefined,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: e.lieu,
      address: e.adresse ?? `${reglages.adresse.code_postal} ${reglages.adresse.commune}`,
    },
    image: e.cover_path ? [new URL(urlImage(e.cover_path), urlSite()).toString()] : undefined,
    organizer: { "@type": "Organization", name: reglages.nom, url: urlSite() },
    isAccessibleForFree: /gratuit/i.test(e.prix),
    url,
  };

  return (
    <>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />}

      <section className="sur-sombre relative isolate text-white">
        <Image
          src={e.cover_path ? urlImage(e.cover_path) : aerien}
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(43,25,15,.25),rgba(43,25,15,.85))]" aria-hidden="true" />
        <div className="conteneur pb-12 pt-24 md:pt-[120px]">
          <nav aria-label="Fil d'Ariane" className="mb-[18px] text-[15px] text-[#F1E3D1]">
            <ol className="flex flex-wrap gap-1.5">
              <li>
                <Link href="/" className="text-white">
                  Accueil
                </Link>{" "}
                ›
              </li>
              <li>
                <Link href="/evenements" className="text-white">
                  Agenda
                </Link>
              </li>
            </ol>
          </nav>
          <div className="mb-3.5 flex flex-wrap gap-2">
            {relatif && <Etiquette className="bg-terre">{relatif.charAt(0).toUpperCase() + relatif.slice(1)}</Etiquette>}
            {passe && <Etiquette className="bg-white/20">Événement passé</Etiquette>}
            {e.ouvert_a_tous && <Etiquette className="border border-white/40 bg-white/20">Ouvert à toutes et à tous</Etiquette>}
          </div>
          <h1 className="max-w-[820px] font-titre text-[clamp(38px,5vw,64px)] font-semibold leading-[1.03] tracking-[-0.02em] [text-wrap:balance]">
            {e.titre}
          </h1>
        </div>
      </section>

      <div className="conteneur flex flex-wrap items-start gap-9 pb-[100px] pt-10">
        <div className="min-w-0 flex-[999_1_560px]">
          <dl className="mb-8 grid grid-cols-2 gap-3 md:[grid-template-columns:repeat(auto-fit,minmax(170px,1fr))]">
            <Info terme="Quand">
              {e.starts_at ? (
                <>
                  {jour(e.starts_at)}
                  <br />
                  {plageHoraire(e.starts_at, e.ends_at, e.all_day)}
                </>
              ) : (
                (e.date_label ?? "Date à confirmer")
              )}
            </Info>
            <Info terme="Où">
              {e.lieu}
              {e.adresse && (
                <>
                  <br />
                  <span className="font-semibold text-encre-2">{e.adresse.replace(`${e.lieu}, `, "")}</span>
                </>
              )}
            </Info>
            <Info terme="Prix">{e.prix}</Info>
            {e.capacity && (
              <Info terme="Places">
                {e.registration_enabled ? (
                  <>
                    {prises} / {e.capacity} inscrits
                    <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-pierre" aria-hidden="true">
                      <span className="block h-full rounded-full bg-terre" style={{ width: `${Math.min(100, Math.round((prises / e.capacity) * 100))}%` }} />
                    </span>
                  </>
                ) : (
                  `${e.capacity} places`
                )}
              </Info>
            )}
          </dl>

          {e.is_sample && (
            <p className="mb-6 inline-block rounded-lg bg-pierre px-2.5 py-1 text-sm text-encre-3">Date, horaires, lieu et jauge : fictifs</p>
          )}

          {(e.body_html || e.resume) && (
            <>
              <h2 className="mb-3 font-titre text-[28px] font-semibold">Le principe</h2>
              <div className="prose-vtv mb-4 text-encre-2" dangerouslySetInnerHTML={{ __html: e.body_html || `<p>${e.resume}</p>` }} />
            </>
          )}

          {programme.length > 0 && (
            <>
              <h2 className="mb-3 mt-7 font-titre text-[28px] font-semibold">Programme</h2>
              <ol className="mb-6 flex flex-col gap-2.5">
                {programme.map((etape, i) => (
                  <li key={i} className="flex gap-4 rounded-2xl bg-white px-[18px] py-3.5">
                    <strong className="w-16 shrink-0 font-titre text-terre-fonce">{etape.heure}</strong>
                    {etape.texte}
                  </li>
                ))}
              </ol>
            </>
          )}

          {e.latitude != null && e.longitude != null && (
            <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
              {e.cover_path && (
                <div className="relative h-[220px] overflow-hidden rounded-[18px]">
                  <Image src={urlImage(e.cover_path)} alt={e.cover_alt ?? ""} fill sizes="400px" className="object-cover" />
                </div>
              )}
              <CarteOSM latitude={e.latitude} longitude={e.longitude} lieu={e.lieu} />
            </div>
          )}

          {e.accessibilite && (
            <p className="mt-5 text-[15px] text-encre-3">
              <strong className="text-encre">Accessibilité</strong> : {e.accessibilite}
            </p>
          )}
        </div>

        <aside id="inscription" aria-labelledby="titre-inscription" className="min-w-0 flex-[1_1_340px] scroll-mt-28 rounded-[26px] bg-white p-7 lg:sticky lg:top-24">
          {passe ? (
            <>
              <h2 id="titre-inscription" className="mb-1.5 font-titre text-2xl font-semibold">
                Cet événement est passé
              </h2>
              <p className="text-[15px] text-encre-3">Retrouvez les prochains rendez-vous dans l&apos;agenda.</p>
            </>
          ) : e.registration_enabled ? (
            <>
              <h2 id="titre-inscription" className="mb-1.5 font-titre text-2xl font-semibold">
                Je m&apos;inscris
              </h2>
              <p className="mb-4 text-[15px] text-encre-3">
                {e.prix}. L&apos;inscription nous aide à prévoir.
                {restantes !== null && restantes > 0 && restantes <= 10 && (
                  <strong className="block text-terre-fonce">
                    Plus que {restantes} place{restantes > 1 ? "s" : ""} !
                  </strong>
                )}
              </p>
              <FormulaireInscription eventId={e.id} slug={e.slug} restantes={restantes} aBientot={auRevoir} />
              {restantes === 0 && (
                <p className="mt-3 text-[15px] text-encre-3">
                  Pour être prévenu·e si une place se libère, écrivez-nous :{" "}
                  <a href={`mailto:${reglages.email}?subject=${encodeURIComponent(`Liste d'attente : ${e.titre}`)}`}>{reglages.email}</a>
                </p>
              )}
            </>
          ) : (
            <>
              <h2 id="titre-inscription" className="mb-1.5 font-titre text-2xl font-semibold">
                Venez librement
              </h2>
              <p className="text-[15px] text-encre-3">Pas besoin de vous inscrire : rendez-vous sur place.</p>
            </>
          )}
          {!passe && e.starts_at && (
            <div className="mt-[22px] border-t border-[#EFE3D2] pt-[18px]">
              <ActionsEvenement slug={e.slug} titre={e.titre} url={url} />
            </div>
          )}
        </aside>
      </div>

      {autres.length > 0 && (
        <section aria-labelledby="titre-autres" className="bg-pierre">
          <div className="conteneur pb-20 pt-16">
            <h2 id="titre-autres" className="mb-5 font-titre text-[30px] font-semibold">
              Les autres rendez-vous
            </h2>
            <ul className="grid gap-3.5 [grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr))]">
              {autres.map((x) => (
                <li key={x.id}>
                  <LigneEvenement e={x} className="h-full" />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}

function Info({ terme, children }: { terme: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[18px] bg-white px-4 py-3.5 md:px-[18px] md:py-4">
      <dt className="text-sm text-encre-3">{terme}</dt>
      <dd className="font-bold">{children}</dd>
    </div>
  );
}
