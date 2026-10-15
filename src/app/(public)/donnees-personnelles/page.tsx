import type { Metadata } from "next";

import { ARenseigner, PageTexte } from "@/components/site/PageTexte";
import { getReglages } from "@/lib/data/site";

export const metadata: Metadata = {
  title: "Données personnelles",
  description:
    "Quelles données l'association vaugines, terres vivantes recueille, pourquoi, combien de temps, et comment exercer vos droits.",
  alternates: { canonical: "/donnees-personnelles" },
};

const TRAITEMENTS = [
  {
    quoi: "Adhésion",
    donnees: "Nom, prénom, e-mail ; date de naissance, téléphone et adresse postale si vous les indiquez ; choix et montant de la cotisation.",
    pourquoi: "Gérer les adhésions et les cotisations, vous convoquer à l'Assemblée Générale, vous informer de la vie de l'association.",
    base: "Votre adhésion (exécution des statuts).",
    duree: "Le temps de votre adhésion, puis 3 ans après votre dernière cotisation ou dernier contact.",
  },
  {
    quoi: "Inscription à un événement",
    donnees: "Prénom et nom, e-mail, nombre de personnes.",
    pourquoi: "Prévoir l'accueil, vous confirmer l'inscription et vous envoyer un rappel la veille.",
    base: "Votre demande d'inscription.",
    duree: "Supprimées 3 mois après l'événement.",
  },
  {
    quoi: "Lettre d'information",
    donnees: "Adresse e-mail.",
    pourquoi: "Vous envoyer les nouvelles et rendez-vous de l'association, environ une fois par mois.",
    base: "Votre consentement, retirable à tout moment par le lien de désinscription.",
    duree: "Jusqu'à votre désinscription.",
  },
  {
    quoi: "Boîte à idées et commentaires",
    donnees: "Prénom affiché (ou anonyme), e-mail jamais affiché, texte et photo éventuelle.",
    pourquoi: "Publier votre contribution après relecture et vous prévenir de son avancement.",
    base: "Votre demande de publication.",
    duree: "Tant que la contribution est en ligne ; l'e-mail est supprimé si elle est retirée.",
  },
  {
    quoi: "Protection contre les abus",
    donnees: "Empreinte technique chiffrée (adresse IP tronquée et navigateur, rendus illisibles), cookie anti-doublon.",
    pourquoi: "Éviter les soutiens multiples et les envois automatisés.",
    base: "Intérêt légitime de l'association à préserver la sincérité des soutiens.",
    duree: "30 jours.",
  },
];

export default async function DonneesPersonnelles() {
  const r = await getReglages();
  return (
    <PageTexte
      surtitre="Vos données"
      titre="Données personnelles"
      intro={
        <p>
          Nous recueillons le minimum, uniquement pour la vie de l&apos;association. Vos données ne sont jamais vendues
          ni cédées.
        </p>
      }
    >
      <h2>Qui est responsable ?</h2>
      <p>
        L&apos;association <strong>{r.nom}</strong>, {r.adresse.lieu}, {r.adresse.rue}, {r.adresse.code_postal}{" "}
        {r.adresse.commune} — <a href={`mailto:${r.email}`}>{r.email}</a>.
      </p>

      <h2>Ce que nous recueillons, et pourquoi</h2>
      {TRAITEMENTS.map((t) => (
        <section key={t.quoi} aria-labelledby={`t-${t.quoi}`}>
          <h3 id={`t-${t.quoi}`}>{t.quoi}</h3>
          <ul>
            <li>
              <strong>Données :</strong> {t.donnees}
            </li>
            <li>
              <strong>Pour :</strong> {t.pourquoi}
            </li>
            <li>
              <strong>Fondement :</strong> {t.base}
            </li>
            <li>
              <strong>Conservation :</strong> {t.duree}
            </li>
          </ul>
        </section>
      ))}

      <h2>Qui y a accès ?</h2>
      <p>
        Seuls les membres du conseil chargés de l&apos;administration du site, avec un compte personnel. Nos
        prestataires techniques traitent les données pour notre compte uniquement : hébergement du site (Vercel),
        base de données dans l&apos;Union européenne (Supabase), envoi des e-mails (Resend). Lorsqu&apos;un prestataire est
        situé hors de l&apos;Union européenne, le transfert est encadré par les garanties prévues par le RGPD (clauses
        contractuelles types ou cadre de protection des données UE–États-Unis).
      </p>
      <p>
        La lettre d&apos;information peut être rédigée avec l&apos;aide d&apos;un outil d&apos;intelligence artificielle
        (Anthropic) : seuls des contenus déjà publiés sur le site lui sont transmis, jamais de données d&apos;adhérents.
      </p>

      <h2>Cookies et mesure d&apos;audience</h2>
      <p>
        Le site n&apos;utilise ni publicité, ni traceur tiers, ni mesure d&apos;audience. Seuls des cookies techniques
        indispensables sont déposés (connexion des administrateurs, mémorisation de vos soutiens dans la boîte à idées)
        : ils ne demandent pas de consentement. La carte des événements (OpenStreetMap) ne se charge que si vous cliquez
        pour l&apos;afficher.
      </p>

      <h2>Vos droits</h2>
      <p>
        Vous pouvez à tout moment accéder à vos données, les faire rectifier ou supprimer, vous opposer à leur
        utilisation, en demander la limitation ou la portabilité. Écrivez-nous à{" "}
        <a href={`mailto:${r.email}`}>{r.email}</a> : nous répondons sous un mois. Vous pouvez aussi adresser une
        réclamation à la CNIL (cnil.fr).
      </p>

      <p className="text-sm text-encre-3">
        Dernière mise à jour : <ARenseigner>date de validation par le conseil</ARenseigner>.
      </p>
    </PageTexte>
  );
}
