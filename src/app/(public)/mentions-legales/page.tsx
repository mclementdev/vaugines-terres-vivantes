import type { Metadata } from "next";
import Link from "next/link";

import { ARenseigner, PageTexte } from "@/components/site/PageTexte";
import { getReglages } from "@/lib/data/site";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Éditeur, hébergement et crédits du site de l'association vaugines, terres vivantes.",
  alternates: { canonical: "/mentions-legales" },
};

export default async function MentionsLegales() {
  const r = await getReglages();
  return (
    <PageTexte surtitre="Informations légales" titre="Mentions légales">
      <h2>Éditeur du site</h2>
      <p>
        Association <strong>{r.nom}</strong>, association loi 1901 déclarée, apolitique, non partisane et laïque.
        <br />
        Siège : {r.adresse.lieu}, {r.adresse.rue}, {r.adresse.code_postal} {r.adresse.commune}.
        <br />
        Contact : <a href={`mailto:${r.email}`}>{r.email}</a>
        <br />
        Numéro RNA : <ARenseigner>W84… à renseigner</ARenseigner>
      </p>
      <p>
        Direction de la publication : <ARenseigner>nom de la ou du coordonnateur général responsable</ARenseigner>,
        pour le Conseil d&apos;Orientation.
      </p>

      <h2>Hébergement</h2>
      <p>
        Site hébergé par Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis — vercel.com.
        <br />
        Base de données et fichiers hébergés par Supabase, dans l&apos;Union européenne (région de Paris).
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        Les textes, photographies et le dessin au trait du village sont la propriété de l&apos;association ou de leurs
        auteurs, qui en ont autorisé l&apos;usage. Toute reproduction demande notre accord préalable.
      </p>
      <p>
        Crédits photographiques : <ARenseigner>auteurs des photos</ARenseigner>. Polices Outfit et Nunito Sans (licence
        SIL Open Font License). Fonds de carte © contributeurs OpenStreetMap.
      </p>

      <h2>Données personnelles</h2>
      <p>
        Pour savoir comment nous utilisons et protégeons vos données, consultez la page{" "}
        <Link href="/donnees-personnelles">Données personnelles</Link>.
      </p>
    </PageTexte>
  );
}
