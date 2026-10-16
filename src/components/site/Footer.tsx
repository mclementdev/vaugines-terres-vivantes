import Link from "next/link";

import { classesBouton } from "@/components/ui/Bouton";
import { getReglages } from "@/lib/data/site";

import { VillageTrait } from "./VillageTrait";

const LIENS = [
  { libelle: "Statuts", href: "/statuts" },
  { libelle: "Glossaire", href: "/glossaire" },
  { libelle: "Questions fréquentes", href: "/faq" },
  { libelle: "Mentions légales", href: "/mentions-legales" },
  { libelle: "Données personnelles", href: "/donnees-personnelles" },
];

export async function Footer() {
  const r = await getReglages();
  const reseaux = [
    { nom: "Facebook", url: r.reseaux.facebook, icone: <IconeFacebook /> },
    { nom: "Instagram", url: r.reseaux.instagram, icone: <IconeInstagram /> },
  ].filter((x): x is typeof x & { url: string } => Boolean(x.url));

  return (
    <footer className="print:hidden sur-sombre bg-nuit text-base text-creme">
      <div className="conteneur grid gap-9 pb-8 pt-16 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
        <div>
          <p className="mb-3 font-titre text-2xl font-medium leading-[1.1] text-white">
            vaugines,
            <br />
            <span className="text-abricot">terres vivantes</span>
          </p>
          <p className="text-[15px]">{r.statut_juridique}</p>
        </div>

        <div>
          <h2 className="mb-2.5 text-base font-bold text-white">Nous trouver</h2>
          <address className="not-italic">
            {r.adresse.lieu}
            <br />
            {r.adresse.rue}, {r.adresse.code_postal} {r.adresse.commune}
          </address>
          <p className="mt-2">
            <a href={`mailto:${r.email}`} className="break-all text-abricot-clair hover:text-white">
              {r.email}
            </a>
          </p>
        </div>

        <nav aria-label="Liens utiles">
          <h2 className="mb-1.5 text-base font-bold text-white">L&apos;association</h2>
          <ul className="flex flex-col">
            {LIENS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="inline-block py-1 text-creme hover:text-white">
                  {l.libelle}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          {reseaux.length > 0 && (
            <>
              <h2 className="mb-2.5 text-base font-bold text-white">Suivez-nous</h2>
              <ul className="mb-5 flex gap-2.5">
                {reseaux.map((x) => (
                  <li key={x.nom}>
                    <a
                      href={x.url}
                      aria-label={`${x.nom} (nouvelle fenêtre)`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-encre-3 text-creme hover:border-abricot hover:text-white"
                    >
                      {x.icone}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
          <Link href="/adherer" className={classesBouton("principal")}>
            Adhérer
          </Link>
        </div>
      </div>
      <div className="conteneur pb-7">
        <VillageTrait
          decoratif
          sizes="(min-width: 800px) 760px, 100vw"
          className="mx-auto mb-5 h-auto w-full max-w-[760px] opacity-25 invert"
        />
        <p className="text-center text-sm text-creme-3">© 2026 vaugines, terres vivantes</p>
      </div>
    </footer>
  );
}

function IconeFacebook() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M15 3h-2.5A3.5 3.5 0 009 6.5V9H7v3h2v9h3v-9h2.5l.5-3h-3V6.8c0-.5.4-.8.8-.8H15z" />
    </svg>
  );
}

function IconeInstagram() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r=".8" />
    </svg>
  );
}
