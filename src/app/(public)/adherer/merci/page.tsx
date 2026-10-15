import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import Link from "next/link";

import { MessageMerci } from "@/components/adhesion/Merci";
import { getEvenementsAVenir } from "@/lib/data/contenus";
import { getReglages } from "@/lib/data/site";
import { TAGS } from "@/lib/data/tags";
import { dansCombien, jour } from "@/lib/dates";

export const metadata: Metadata = {
  title: "Bienvenue dans l'association",
  robots: { index: false },
};

export default async function Merci() {
  const r = await getReglages();
  return (
    <div className="conteneur max-w-[880px] pb-[100px] pt-10 md:pt-14">
      <MessageMerci virement={r.virement} />
      <Suites />
    </div>
  );
}

/** « Et maintenant ? » : prochain rendez-vous, idées, commissions (mis en cache : dates relatives). */
async function Suites() {
  "use cache";
  cacheLife("contenu");
  cacheTag(TAGS.evenements);

  const prochain = (await getEvenementsAVenir(4)).find((e) => e.starts_at);
  const suites = [
    prochain?.starts_at
      ? {
          href: `/evenements/${prochain.slug}`,
          surtitre: dansCombien(prochain.starts_at) ?? jour(prochain.starts_at),
          couleur: "text-terre-fonce",
          titre: `Venez : ${prochain.titre}`,
          texte: prochain.registration_enabled ? "Inscription en un clic" : "Ouvert à toutes et à tous",
        }
      : { href: "/evenements", surtitre: "Agenda", couleur: "text-terre-fonce", titre: "Les prochains rendez-vous", texte: "Balades, ateliers, débats" },
    { href: "/#idees", surtitre: "Boîte à idées", couleur: "text-olive", titre: "Proposez votre première idée", texte: "Pour le village" },
    { href: "/actions", surtitre: "Commissions", couleur: "text-indigo", titre: "Rejoignez une commission", texte: "Eau, patrimoine, paysage…" },
  ];

  return (
    <section aria-labelledby="titre-suite" className="mt-6">
      <h2 id="titre-suite" className="mb-3.5 font-titre text-[26px] font-semibold">
        Et maintenant ?
      </h2>
      <ul className="grid gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
        {suites.map((s) => (
          <li key={s.href}>
            <Link href={s.href} className="block h-full rounded-[20px] bg-white p-[22px] text-encre no-underline hover:text-encre hover:shadow-md">
              <span className={`text-[13px] font-bold ${s.couleur}`}>{s.surtitre}</span>
              <strong className="mb-1.5 mt-1 block text-lg leading-snug">{s.titre}</strong>
              <span className="text-[15px] text-encre-3">{s.texte}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
