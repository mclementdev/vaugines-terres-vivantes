import type { Metadata } from "next";
import Link from "next/link";

import { PageTexte } from "@/components/site/PageTexte";

export const metadata: Metadata = {
  title: "Charte de la boîte à idées",
  description: "Les règles de bienveillance de la boîte à idées de l'association vaugines, terres vivantes.",
  alternates: { canonical: "/idees/charte" },
};

export default function Charte() {
  return (
    <PageTexte
      surtitre="Boîte à idées"
      titre="Notre charte de bienveillance"
      intro="La boîte à idées est un espace pour imaginer ensemble l'avenir du village. Pour qu'il le reste, chaque idée et chaque commentaire est relu avant publication."
    >
      <h2>Ce que nous attendons</h2>
      <ul>
        <li>
          <strong>La bienveillance</strong> : on discute des idées, jamais des personnes. On peut ne pas être d&apos;accord, poliment.
        </li>
        <li>
          <strong>Des propositions concrètes et utiles au village</strong> : un lieu, un besoin, une piste pour agir.
        </li>
        <li>
          <strong>Le respect de la neutralité de l&apos;association</strong>, apolitique, non partisane et laïque (article 2 des statuts) : pas de
          propagande électorale, partisane ou religieuse.
        </li>
      </ul>

      <h2>Ce qui n&apos;est pas publié</h2>
      <ul>
        <li>les attaques nominatives, moqueries, insultes ou propos discriminants ;</li>
        <li>les informations personnelles sur un tiers (nom, adresse, photo d&apos;une personne reconnaissable sans son accord) ;</li>
        <li>la publicité ou la promotion commerciale ;</li>
        <li>les contenus illégaux, ou qui mettraient en cause une personne sans preuve.</li>
      </ul>

      <h2>Comment fonctionne la relecture</h2>
      <p>
        L&apos;équipe de modération relit chaque dépôt sous 48 h environ. Elle peut publier l&apos;idée, vous proposer une modification (vous recevez alors un
        lien pour la corriger), ou la refuser en vous expliquant pourquoi. Les commentaires suivent le même principe.
      </p>
      <p>
        Chacun peut signaler une idée ou un commentaire publiés : l&apos;équipe les relit à nouveau et peut les retirer. Une idée publiée peut évoluer
        (« étudiée », « en projet », « réalisée ») : son auteur et les personnes qui la suivent sont prévenus.
      </p>

      <h2>Vos données</h2>
      <p>
        Votre adresse e-mail n&apos;est jamais affichée : elle sert uniquement à vous tenir au courant de votre idée. Vous pouvez publier avec votre prénom
        ou anonymement. Le soutien d&apos;une idée ne demande aucune donnée personnelle (un cookie technique évite simplement les doublons). Plus de
        détails dans la page <Link href="/donnees-personnelles">Données personnelles</Link>.
      </p>

      <p>
        <Link href="/idees/nouvelle">Proposer une idée</Link> · <Link href="/idees">Voir les idées</Link>
      </p>
    </PageTexte>
  );
}
