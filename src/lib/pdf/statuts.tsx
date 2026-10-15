import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { Document, Font, Image, Page, renderToBuffer, StyleSheet, Text, View } from "@react-pdf/renderer";
import { cacheLife, cacheTag } from "next/cache";

import { getStatuts } from "@/lib/data/pages";
import { getReglages } from "@/lib/data/site";
import { TAGS } from "@/lib/data/tags";

// Pas de césure automatique (« urba-nisme ») : lecture plus confortable.
Font.registerHyphenationCallback((mot) => [mot]);

const TERRE = "#B4502A";
const ENCRE = "#2B1D14";
const ENCRE_2 = "#4A3628";

const styles = StyleSheet.create({
  page: { paddingTop: 48, paddingBottom: 56, paddingHorizontal: 56, fontFamily: "Helvetica", fontSize: 10.5, lineHeight: 1.5, color: ENCRE },
  village: { width: 300, alignSelf: "center", marginBottom: 14, opacity: 0.85 },
  surtitre: { fontSize: 9, letterSpacing: 1.4, color: "#8F3D1E", textAlign: "center", marginBottom: 4 },
  titre: { fontFamily: "Helvetica-Bold", fontSize: 20, lineHeight: 1.25, textAlign: "center", marginBottom: 6 },
  sousTitre: { fontSize: 10, textAlign: "center", color: ENCRE_2, marginBottom: 22 },
  article: { marginBottom: 12 },
  articleTitre: { fontFamily: "Helvetica-Bold", fontSize: 12, marginBottom: 4 },
  numero: { color: TERRE },
  paragraphe: { marginBottom: 4, textAlign: "justify" },
  note: { fontSize: 9, color: ENCRE_2, marginTop: 2 },
  puce: { flexDirection: "row", marginBottom: 3, paddingLeft: 8 },
  pucePoint: { width: 10, color: TERRE },
  puceTexte: { flex: 1, textAlign: "justify" },
  signature: { marginTop: 18, paddingTop: 10, borderTop: "0.5pt solid #E4D3BB" },
  signataires: { flexDirection: "row", gap: 40, marginTop: 6 },
  piedGauche: { position: "absolute", bottom: 26, left: 56, fontSize: 8, color: "#6B5646" },
});

/** Contenu HTML contrôlé des statuts (p, ul/li, a) → éléments react-pdf. */
function blocs(html: string) {
  const texte = (s: string) =>
    s
      .replace(/<span class="sr-only">.*?<\/span>/g, "")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim();

  const resultat: { type: "p" | "note" | "li"; texte: string }[] = [];
  for (const m of html.matchAll(/<(p|li)(\s[^>]*)?>([\s\S]*?)<\/\1>/g)) {
    const estNote = (m[2] ?? "").includes('class="note"');
    resultat.push({ type: m[1] === "li" ? "li" : estNote ? "note" : "p", texte: texte(m[3]) });
  }
  return resultat;
}

async function documentStatuts() {
  const [articles, reglages, village] = await Promise.all([
    getStatuts(),
    getReglages(),
    readFile(path.join(process.cwd(), "public/images/village_trait.png")),
  ]);
  const signature = reglages.statuts;
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  return (
    <Document title="Statuts — vaugines, terres vivantes" author={reglages.nom} language="fr">
      <Page size="A4" style={styles.page}>
        {/* eslint-disable-next-line jsx-a11y/alt-text -- composant react-pdf, pas une balise img HTML */}
        <Image src={village} style={styles.village} />
        <Text style={styles.surtitre}>ASSOCIATION LOI 1901</Text>
        <Text style={styles.titre}>Statuts de l’association vaugines, terres vivantes</Text>
        <Text style={styles.sousTitre}>
          {reglages.adresse.lieu}, {reglages.adresse.rue}, {reglages.adresse.code_postal} {reglages.adresse.commune}
        </Text>

        {articles.map((a) => (
          <View key={a.numero} style={styles.article}>
            <Text style={styles.articleTitre} minPresenceAhead={40}>
              <Text style={styles.numero}>Article {a.numero} · </Text>
              {a.titre}
            </Text>
            {blocs(a.body_html).map((b, i) =>
              b.type === "li" ? (
                <View key={i} style={styles.puce}>
                  <Text style={styles.pucePoint}>•</Text>
                  <Text style={styles.puceTexte}>{b.texte}</Text>
                </View>
              ) : (
                <Text key={i} style={b.type === "note" ? styles.note : styles.paragraphe}>
                  {b.texte}
                </Text>
              ),
            )}
          </View>
        ))}

        {signature && (
          <View style={styles.signature} wrap={false}>
            <Text>{signature.fait_a}</Text>
            <View style={styles.signataires}>
              {signature.signataires.map((s) => (
                <Text key={s.nom}>
                  {s.nom}, {s.qualite}
                </Text>
              ))}
            </View>
          </View>
        )}

        <Text style={styles.piedGauche} fixed>
          vaugines, terres vivantes — statuts{site ? ` · ${site.replace(/^https?:\/\//, "")}/statuts` : ""}
        </Text>
      </Page>
    </Document>
  );
}

/**
 * PDF des statuts, généré depuis le texte en base (aucune donnée personnelle).
 * Mis en cache ; sert au téléchargement et à la pièce jointe de bienvenue.
 */
export async function pdfStatutsBase64(): Promise<string> {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.statuts, TAGS.reglages);

  const buffer = await renderToBuffer(await documentStatuts());
  return Buffer.from(buffer).toString("base64");
}
