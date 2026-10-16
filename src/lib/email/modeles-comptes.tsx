import "server-only";

import { Text } from "@react-email/components";

import type { Reglages } from "@/lib/data/site";

import { Bouton, C, Gabarit, p, produire, Signature, TITRE } from "./modeles";

/** Lien de connexion envoyé par un superadmin : il mène au choix du mot de passe. */
export function emailLienConnexion(r: Reglages, d: { prenom: string; lien: string; nouveau: boolean }) {
  return produire(
    <Gabarit
      apercu={d.nouveau ? "Votre accès à l'administration du site" : "Votre lien pour choisir un nouveau mot de passe"}
      reglages={r}
      mention="Ce lien est personnel, valable une heure et une seule fois. Si vous n'attendiez pas ce message, ignorez-le."
    >
      <Text style={{ ...p, fontFamily: TITRE, fontSize: "24px", fontWeight: 600, lineHeight: "1.2" }}>
        {d.nouveau ? "Bienvenue dans l'équipe du site" : "Nouveau mot de passe"}
      </Text>
      <Text style={p}>Bonjour{d.prenom ? ` ${d.prenom}` : ""},</Text>
      <Text style={{ ...p, margin: "0 0 20px" }}>
        {d.nouveau
          ? "Un accès à l'administration du site vous a été ouvert. Choisissez votre mot de passe pour l'activer :"
          : "Voici votre lien pour choisir un nouveau mot de passe :"}
      </Text>
      <Bouton href={d.lien}>Choisir mon mot de passe</Bouton>
      <Text style={{ ...p, margin: "20px 0 0", fontSize: "14px", color: C.encre3 }}>
        Vous vous connecterez ensuite avec votre adresse e-mail et ce mot de passe, sur la page « Connexion » de l&apos;administration.
      </Text>
      <Signature reglages={r} />
    </Gabarit>,
  );
}
