import "server-only";

import { Body, Button, Container, Head, Hr, Html, Img, Preview, Section, Text } from "@react-email/components";
import { render } from "@react-email/render";
import type { ReactNode } from "react";

import type { Reglages } from "@/lib/data/site";

const C = {
  sable: "#F6EEE2",
  creme: "#EAD9BF",
  terre: "#B4502A",
  terreFonce: "#8F3D1E",
  encre: "#2B1D14",
  encre2: "#4A3628",
  encre3: "#6B5646",
  bordure: "#E4D3BB",
};
const POLICE = "'Nunito Sans', Helvetica, Arial, sans-serif";
const TITRE = "Outfit, 'Nunito Sans', Helvetica, Arial, sans-serif";

export const urlSite = () => (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

const p = { margin: "0 0 14px", fontSize: "16px", lineHeight: "1.6", color: C.encre };

/** Mise en page commune : dessin du village, contenu, pied avec coordonnées. */
function Gabarit({ apercu, reglages, children, mention }: { apercu: string; reglages: Reglages; children: ReactNode; mention: string }) {
  const a = reglages.adresse;
  return (
    <Html lang="fr">
      <Head />
      <Preview>{apercu}</Preview>
      <Body style={{ margin: 0, backgroundColor: C.sable, fontFamily: POLICE, color: C.encre }}>
        <Container style={{ maxWidth: "560px", margin: "0 auto", padding: "24px 12px" }}>
          <Section style={{ backgroundColor: "#FFFFFF", borderRadius: "20px", overflow: "hidden", border: `1px solid ${C.bordure}` }}>
            <Section style={{ backgroundColor: C.sable, padding: "20px 24px 0" }}>
              <Text style={{ margin: "0 0 8px", fontFamily: TITRE, fontSize: "20px", lineHeight: "1.1", color: C.encre }}>
                vaugines,
                <br />
                <span style={{ color: C.terre, fontWeight: 600 }}>terres vivantes</span>
              </Text>
              <Img src={`${urlSite()}/images/village_trait.png`} alt="Dessin du village de Vaugines" width="512" style={{ display: "block", width: "100%", height: "auto", opacity: 0.8 }} />
            </Section>
            <Section style={{ padding: "24px 26px 26px" }}>{children}</Section>
          </Section>
          <Text style={{ margin: "18px 8px 0", fontSize: "13px", lineHeight: "1.5", color: C.encre3, textAlign: "center" }}>
            {reglages.nom || "vaugines, terres vivantes"} · {a.lieu}, {a.rue}, {a.code_postal} {a.commune}
            <br />
            {mention}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

function Bouton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Button href={href} style={{ display: "inline-block", padding: "12px 22px", borderRadius: "999px", backgroundColor: C.terre, color: "#FFFFFF", fontWeight: 700, fontSize: "16px", textDecoration: "none" }}>
      {children}
    </Button>
  );
}

function Encadre({ children }: { children: ReactNode }) {
  return <Section style={{ backgroundColor: C.sable, borderRadius: "14px", padding: "14px 16px", margin: "0 0 16px" }}>{children}</Section>;
}

const mono = { fontFamily: "ui-monospace, Menlo, Consolas, monospace", fontWeight: 700 };
const etiquette = { margin: 0, fontSize: "13px", color: C.encre3 };
const valeur = { margin: "0 0 8px", fontSize: "15px", color: C.encre };

/** Coordonnées bancaires et libellé du virement. */
function Virement({ reglages, montant, libelle }: { reglages: Reglages; montant: string; libelle: string }) {
  const v = reglages.virement;
  return (
    <>
      <Text style={{ ...p, fontWeight: 700, margin: "0 0 8px" }}>Pour finaliser votre cotisation de {montant}</Text>
      <Text style={p}>Effectuez le virement quand vous le souhaitez :</Text>
      <Encadre>
        <Text style={etiquette}>Titulaire</Text>
        <Text style={{ ...valeur, fontWeight: 700 }}>{v.titulaire}</Text>
        <Text style={etiquette}>IBAN</Text>
        <Text style={{ ...valeur, ...mono }}>{v.iban}</Text>
        {v.bic && (
          <>
            <Text style={etiquette}>BIC</Text>
            <Text style={{ ...valeur, ...mono }}>{v.bic}</Text>
          </>
        )}
        <Text style={etiquette}>Libellé à indiquer</Text>
        <Text style={{ ...valeur, ...mono, margin: 0 }}>{libelle}</Text>
      </Encadre>
    </>
  );
}

function Signature({ reglages }: { reglages: Reglages }) {
  return (
    <Text style={{ ...p, margin: "18px 0 0" }}>
      Bien amicalement,
      <br />
      {reglages.signature_email}
    </Text>
  );
}

async function produire(el: React.ReactElement) {
  const [html, texte] = await Promise.all([render(el), render(el, { plainText: true })]);
  return { html, texte };
}

// ---------------------------------------------------------------------------
// Bienvenue (avec les statuts en pièce jointe)
// ---------------------------------------------------------------------------
export type DonneesBienvenue = {
  prenom: string;
  cotisation: { statut: "attendue" | "payee" | "sans"; montant: string; libelle: string };
  lienLettre?: string;
  prochainRdv?: { titre: string; quand: string; href: string };
};

export function emailBienvenue(r: Reglages, d: DonneesBienvenue) {
  return produire(
    <Gabarit apercu="Merci de nous rejoindre ! Les statuts de l'association sont en pièce jointe." reglages={r} mention={`Vous recevez cet e-mail à la suite de votre adhésion. Pour modifier ou supprimer vos données : ${r.email}`}>
      <Text style={{ ...p, fontFamily: TITRE, fontSize: "24px", fontWeight: 600, lineHeight: "1.2" }}>Bienvenue dans l&apos;association !</Text>
      <Text style={p}>Bonjour {d.prenom},</Text>
      <Text style={p}>Merci de nous rejoindre ! Votre adhésion est enregistrée. Vous trouverez ci-joint les statuts de l&apos;association.</Text>
      {d.cotisation.statut === "attendue" && <Virement reglages={r} montant={d.cotisation.montant} libelle={d.cotisation.libelle} />}
      {d.cotisation.statut === "payee" && <Text style={p}>Votre cotisation de {d.cotisation.montant} est bien reçue : merci pour votre soutien.</Text>}
      {d.lienLettre && (
        <Encadre>
          <Text style={{ ...p, margin: "0 0 10px" }}>Vous avez demandé à recevoir la lettre d&apos;information. Confirmez votre abonnement d&apos;un clic :</Text>
          <Bouton href={d.lienLettre}>Confirmer mon abonnement</Bouton>
        </Encadre>
      )}
      {d.prochainRdv && (
        <Text style={p}>
          Prochain rendez-vous : <strong>{d.prochainRdv.titre}</strong>, {d.prochainRdv.quand}.
        </Text>
      )}
      <Text style={p}>Vous pouvez rejoindre une commission, proposer une idée pour le village et voter à l&apos;Assemblée Générale.</Text>
      <Bouton href={`${urlSite()}/evenements`}>Voir l&apos;agenda</Bouton>
      <Signature reglages={r} />
    </Gabarit>,
  );
}

// ---------------------------------------------------------------------------
// Relance d'un virement attendu
// ---------------------------------------------------------------------------
export function emailRelance(r: Reglages, d: { prenom: string; montant: string; libelle: string; periode: string }) {
  return produire(
    <Gabarit apercu={`Petit rappel pour votre cotisation ${d.periode}`} reglages={r} mention={`Vous recevez cet e-mail en tant qu'adhérente ou adhérent. Une question : ${r.email}`}>
      <Text style={p}>Bonjour {d.prenom},</Text>
      <Text style={p}>
        Merci encore pour votre adhésion ! Sauf erreur de notre part, nous n&apos;avons pas encore reçu votre cotisation pour l&apos;année d&apos;AG {d.periode}. Si le virement est déjà parti, ne tenez pas compte de ce message.
      </Text>
      <Virement reglages={r} montant={d.montant} libelle={d.libelle} />
      <Text style={p}>La cotisation est libre : si vous préférez finalement adhérer sans cotiser, répondez simplement à cet e-mail.</Text>
      <Signature reglages={r} />
    </Gabarit>,
  );
}

// ---------------------------------------------------------------------------
// Lettre d'information : confirmation de l'abonnement
// ---------------------------------------------------------------------------
export function emailConfirmationLettre(r: Reglages, d: { lien: string }) {
  return produire(
    <Gabarit apercu="Confirmez votre inscription à la lettre d'information" reglages={r} mention="Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail : vous ne recevrez rien.">
      <Text style={{ ...p, fontFamily: TITRE, fontSize: "24px", fontWeight: 600, lineHeight: "1.2" }}>Encore un clic !</Text>
      <Text style={p}>Bonjour,</Text>
      <Text style={p}>
        Vous avez demandé à recevoir la lettre d&apos;information de l&apos;association : les rendez-vous, l&apos;avancée des actions et les nouvelles du village, environ une fois par mois.
      </Text>
      <Text style={{ ...p, margin: "0 0 20px" }}>Pour confirmer votre inscription :</Text>
      <Bouton href={d.lien}>Confirmer mon inscription</Bouton>
      <Text style={{ ...p, margin: "20px 0 0", fontSize: "14px", color: C.encre3 }}>Vous pourrez vous désinscrire à tout moment, en un clic, depuis chaque lettre.</Text>
      <Signature reglages={r} />
    </Gabarit>,
  );
}

// ---------------------------------------------------------------------------
// Alerte au conseil : nouvelle adhésion
// ---------------------------------------------------------------------------
export function emailAlerteAdhesion(r: Reglages, d: { nom: string; commune: string; cotisation: string; lettre: boolean; lienFiche: string; total: number }) {
  return produire(
    <Gabarit apercu={`Nouvelle adhésion : ${d.nom}`} reglages={r} mention="Message automatique envoyé au conseil à chaque adhésion en ligne.">
      <Text style={{ ...p, fontFamily: TITRE, fontSize: "22px", fontWeight: 600, lineHeight: "1.2" }}>Nouvelle adhésion en ligne</Text>
      <Encadre>
        <Text style={etiquette}>Adhérent·e</Text>
        <Text style={{ ...valeur, fontWeight: 700 }}>{d.nom}</Text>
        {d.commune && (
          <>
            <Text style={etiquette}>Commune</Text>
            <Text style={valeur}>{d.commune}</Text>
          </>
        )}
        <Text style={etiquette}>Cotisation</Text>
        <Text style={valeur}>{d.cotisation}</Text>
        <Text style={etiquette}>Lettre d&apos;information</Text>
        <Text style={{ ...valeur, margin: 0 }}>{d.lettre ? "Demandée (en attente de confirmation)" : "Non"}</Text>
      </Encadre>
      <Text style={p}>
        Cela fait {d.total} adhésion{d.total > 1 ? "s" : ""} pour l&apos;année d&apos;AG en cours. L&apos;e-mail de bienvenue et les statuts sont partis automatiquement.
      </Text>
      <Bouton href={d.lienFiche}>Ouvrir la fiche</Bouton>
      <Hr style={{ borderColor: C.bordure, margin: "22px 0 0" }} />
    </Gabarit>,
  );
}
