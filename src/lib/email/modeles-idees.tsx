import "server-only";

import { Text } from "@react-email/components";

import type { Reglages } from "@/lib/data/site";

import { Bouton, Encadre, Gabarit, Signature, TITRE, etiquette, p, produire, valeur } from "./modeles";

const titre = { ...p, fontFamily: TITRE, fontSize: "24px", fontWeight: 600, lineHeight: "1.2" };
const bonjour = (prenom?: string | null) => (prenom ? `Bonjour ${prenom},` : "Bonjour,");
const mentionAuteur = (r: Reglages) => `Vous recevez cet e-mail parce que vous avez proposé une idée. Une question : ${r.email}`;

export function emailIdeeRecue(r: Reglages, d: { prenom: string | null; titre: string }) {
  return produire(
    <Gabarit apercu="Merci ! Votre idée est en relecture." reglages={r} mention={mentionAuteur(r)}>
      <Text style={titre}>Merci pour votre idée !</Text>
      <Text style={p}>{bonjour(d.prenom)}</Text>
      <Text style={p}>
        Nous avons bien reçu « <strong>{d.titre}</strong> ». L&apos;équipe la relit sous 48 h environ, puis elle sera publiée sur le site pour que chacun puisse
        la soutenir et la commenter.
      </Text>
      <Text style={p}>Nous vous écrirons dès qu&apos;elle sera en ligne, puis à chaque étape : étude en commission, mise en projet, réalisation.</Text>
      <Signature reglages={r} />
    </Gabarit>,
  );
}

export function emailIdeePubliee(r: Reglages, d: { prenom: string | null; titre: string; lien: string }) {
  return produire(
    <Gabarit apercu={`Votre idée est en ligne : ${d.titre}`} reglages={r} mention={mentionAuteur(r)}>
      <Text style={titre}>Votre idée est en ligne !</Text>
      <Text style={p}>{bonjour(d.prenom)}</Text>
      <Text style={p}>
        « <strong>{d.titre}</strong> » est maintenant publiée dans la boîte à idées. Partagez-la autour de vous : les idées les plus soutenues sont étudiées en
        commission.
      </Text>
      <Bouton href={d.lien}>Voir mon idée</Bouton>
      <Signature reglages={r} />
    </Gabarit>,
  );
}

export function emailIdeeModification(r: Reglages, d: { prenom: string | null; titre: string; motif: string; lien: string }) {
  return produire(
    <Gabarit apercu="Une petite modification avant publication" reglages={r} mention={mentionAuteur(r)}>
      <Text style={titre}>Presque prête !</Text>
      <Text style={p}>{bonjour(d.prenom)}</Text>
      <Text style={p}>
        Merci pour « <strong>{d.titre}</strong> ». Avant de la publier, l&apos;équipe vous propose une petite modification :
      </Text>
      <Encadre>
        <Text style={{ ...valeur, margin: 0, whiteSpace: "pre-line" }}>{d.motif}</Text>
      </Encadre>
      <Text style={{ ...p, margin: "0 0 20px" }}>Vous pouvez modifier votre idée directement, puis la renvoyer en relecture :</Text>
      <Bouton href={d.lien}>Modifier mon idée</Bouton>
      <Signature reglages={r} />
    </Gabarit>,
  );
}

export function emailIdeeRefusee(r: Reglages, d: { prenom: string | null; titre: string; motif: string }) {
  return produire(
    <Gabarit apercu="À propos de votre idée" reglages={r} mention={mentionAuteur(r)}>
      <Text style={p}>{bonjour(d.prenom)}</Text>
      <Text style={p}>
        Merci d&apos;avoir pris le temps de proposer « <strong>{d.titre}</strong> ». Nous ne pouvons pas la publier dans la boîte à idées, pour la raison
        suivante :
      </Text>
      <Encadre>
        <Text style={{ ...valeur, margin: 0, whiteSpace: "pre-line" }}>{d.motif}</Text>
      </Encadre>
      <Text style={p}>N&apos;hésitez pas à nous répondre pour en parler, ou à proposer une autre idée.</Text>
      <Signature reglages={r} />
    </Gabarit>,
  );
}

const ETAPES = {
  proposee: { titre: "Votre idée est de nouveau ouverte aux soutiens", texte: "Elle est de nouveau ouverte aux soutiens et aux commentaires." },
  etudiee: { titre: "L'idée passe en commission", texte: "Elle est maintenant étudiée en commission : nous regardons comment la réaliser." },
  en_projet: { titre: "L'idée devient un projet !", texte: "Elle devient un projet : on s'y met. Nous donnerons des nouvelles sur le site." },
  realisee: { titre: "C'est fait !", texte: "Elle est réalisée. Merci à toutes celles et ceux qui l'ont portée !" },
} as const;

/** Avancement d'une idée : envoyé à l'auteur et aux personnes qui la suivent. */
export function emailAvancement(r: Reglages, d: { titre: string; etape: keyof typeof ETAPES; lien: string; lienArret: string | null }) {
  const e = ETAPES[d.etape];
  return produire(
    <Gabarit
      apercu={`${e.titre} : ${d.titre}`}
      reglages={r}
      mention={d.lienArret ? "Vous recevez cet e-mail parce que vous suivez cette idée." : mentionAuteur(r)}
    >
      <Text style={titre}>{e.titre}</Text>
      <Text style={p}>Bonjour,</Text>
      <Text style={p}>
        Des nouvelles de « <strong>{d.titre}</strong> » : {e.texte.charAt(0).toLowerCase() + e.texte.slice(1)}
      </Text>
      <Bouton href={d.lien}>Voir l&apos;idée</Bouton>
      {d.lienArret && (
        <Text style={{ ...p, margin: "18px 0 0", fontSize: "14px" }}>
          <a href={d.lienArret} style={{ color: "#8F3D1E", fontWeight: 700 }}>
            Ne plus suivre cette idée
          </a>
        </Text>
      )}
      <Signature reglages={r} />
    </Gabarit>,
  );
}

/** Alerte à l'équipe : un dépôt ou un signalement attend la modération. */
export function emailAlerteModeration(r: Reglages, d: { quoi: string; titre: string; extrait: string; lien: string }) {
  return produire(
    <Gabarit apercu={`${d.quoi} : ${d.titre}`} reglages={r} mention="Message automatique envoyé à l'équipe de modération.">
      <Text style={{ ...titre, fontSize: "22px" }}>{d.quoi}</Text>
      <Encadre>
        <Text style={etiquette}>Titre</Text>
        <Text style={{ ...valeur, fontWeight: 700 }}>{d.titre}</Text>
        <Text style={etiquette}>Extrait</Text>
        <Text style={{ ...valeur, margin: 0 }}>{d.extrait}</Text>
      </Encadre>
      <Text style={{ ...p, margin: "0 0 20px" }}>Objectif : répondre sous 48 h.</Text>
      <Bouton href={d.lien}>Ouvrir la modération</Bouton>
    </Gabarit>,
  );
}
