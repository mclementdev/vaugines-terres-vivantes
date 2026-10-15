import "server-only";

import { Text } from "@react-email/components";

import type { Reglages } from "@/lib/data/site";

import { Bouton, C, Encadre, Gabarit, Signature, TITRE, etiquette, p, produire, valeur } from "./modeles";

// ---------------------------------------------------------------------------
// Inscriptions aux événements
// ---------------------------------------------------------------------------
export type DonneesEvenementEmail = {
  prenom: string;
  titre: string;
  quand: string;
  lieu: string;
  adresse: string | null;
  places: number;
  lienGestion: string;
  lienEvenement: string;
  lienAgenda: string | null;
};

function RecapEvenement({ d }: { d: DonneesEvenementEmail }) {
  return (
    <Encadre>
      <Text style={{ ...valeur, fontFamily: TITRE, fontSize: "19px", fontWeight: 600 }}>{d.titre}</Text>
      <Text style={etiquette}>Quand</Text>
      <Text style={valeur}>{d.quand}</Text>
      <Text style={etiquette}>Où</Text>
      <Text style={valeur}>
        {d.lieu}
        {d.adresse && d.adresse !== d.lieu ? `, ${d.adresse.replace(`${d.lieu}, `, "")}` : ""}
      </Text>
      <Text style={etiquette}>Inscription</Text>
      <Text style={{ ...valeur, margin: 0 }}>
        {d.places} personne{d.places > 1 ? "s" : ""}
      </Text>
    </Encadre>
  );
}

const lienDiscret = { color: C.terreFonce, fontWeight: 700 };

export function emailConfirmationInscription(r: Reglages, d: DonneesEvenementEmail) {
  return produire(
    <Gabarit apercu={`Inscription confirmée : ${d.titre}, ${d.quand}`} reglages={r} mention={`Vous recevez cet e-mail à la suite de votre inscription. Une question : ${r.email}`}>
      <Text style={{ ...p, fontFamily: TITRE, fontSize: "24px", fontWeight: 600, lineHeight: "1.2" }}>C&apos;est noté, à bientôt !</Text>
      <Text style={p}>Bonjour {d.prenom},</Text>
      <Text style={p}>Votre inscription est confirmée. Nous vous enverrons un petit rappel la veille.</Text>
      <RecapEvenement d={d} />
      <Bouton href={d.lienEvenement}>Voir l&apos;événement</Bouton>
      <Text style={{ ...p, margin: "18px 0 0", fontSize: "15px" }}>
        {d.lienAgenda && (
          <>
            <a href={d.lienAgenda} style={lienDiscret}>
              Ajouter à mon agenda
            </a>
            {" · "}
          </>
        )}
        <a href={d.lienGestion} style={lienDiscret}>
          Modifier ou annuler mon inscription
        </a>
      </Text>
      <Signature reglages={r} />
    </Gabarit>,
  );
}

export function emailRappelEvenement(r: Reglages, d: DonneesEvenementEmail) {
  return produire(
    <Gabarit apercu={`C'est demain : ${d.titre}`} reglages={r} mention={`Vous recevez ce rappel parce que vous êtes inscrit·e. Une question : ${r.email}`}>
      <Text style={{ ...p, fontFamily: TITRE, fontSize: "24px", fontWeight: 600, lineHeight: "1.2" }}>C&apos;est demain !</Text>
      <Text style={p}>Bonjour {d.prenom},</Text>
      <Text style={p}>Un petit rappel : nous vous attendons demain.</Text>
      <RecapEvenement d={d} />
      <Text style={p}>
        Un empêchement ? Prévenez-nous en un clic, la place pourra servir à quelqu&apos;un d&apos;autre :{" "}
        <a href={d.lienGestion} style={lienDiscret}>
          annuler mon inscription
        </a>
        .
      </Text>
      <Bouton href={d.lienEvenement}>Voir le programme</Bouton>
      <Signature reglages={r} />
    </Gabarit>,
  );
}

export function emailAnnulationInscription(r: Reglages, d: Pick<DonneesEvenementEmail, "prenom" | "titre" | "quand" | "lienEvenement">) {
  return produire(
    <Gabarit apercu={`Inscription annulée : ${d.titre}`} reglages={r} mention={`Une question : ${r.email}`}>
      <Text style={p}>Bonjour {d.prenom},</Text>
      <Text style={p}>
        Votre inscription à <strong>{d.titre}</strong> ({d.quand}) est bien annulée. Merci de nous avoir prévenus !
      </Text>
      <Text style={p}>Si vous changez d&apos;avis, vous pouvez vous réinscrire depuis la page de l&apos;événement, tant qu&apos;il reste des places.</Text>
      <Bouton href={d.lienEvenement}>Voir l&apos;événement</Bouton>
      <Signature reglages={r} />
    </Gabarit>,
  );
}
