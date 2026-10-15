import { formatMontant } from "@/lib/adhesion/commun";
import { MOYENS, getPeriodes, lireFiltres, requeteAdherents } from "@/lib/admin/adherents";
import { exigerAdmin } from "@/lib/auth";
import { clientSession } from "@/lib/supabase/serveur";

type Ligne = {
  prenom: string;
  nom: string;
  email: string | null;
  adresse: string | null;
  code_postal: string | null;
  commune: string | null;
  joined_at: string;
  periode: string | null;
  status: "attendue" | "payee" | "sans" | null;
  amount_cents: number | null;
  paid_on: string | null;
  payment_method: keyof typeof MOYENS | null;
  ag_validated_on: string | null;
  lettre: "pending" | "active" | "unsubscribed" | null;
  source: "en_ligne" | "papier";
};

const COLONNES =
  "prenom, nom, email, adresse, code_postal, commune, joined_at, periode, status, amount_cents, paid_on, payment_method, ag_validated_on, lettre, source";
const STATUTS = { payee: "Payée", attendue: "Virement attendu", sans: "Sans cotisation" };
const LETTRE = { active: "Abonné·e", pending: "En attente", unsubscribed: "Désinscrit·e" };

/** Cellule CSV : guillemets échappés, formules neutralisées (=, +, -, @ en tête). */
function cellule(v: string | null | undefined) {
  const s = (v ?? "").replace(/^([=+\-@\t\r])/, "'$1");
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
const date = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" }) : "");

/**
 * Export CSV des adhésions (filtres de la liste). Point-virgule et BOM UTF-8
 * pour une ouverture directe dans Excel ou LibreOffice. Le téléphone et la
 * date de naissance ne sont pas exportés.
 */
export async function GET(request: Request) {
  const admin = await exigerAdmin();
  const supabase = await clientSession();
  const periodes = await getPeriodes(supabase);
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const f = lireFiltres(params, periodes.find((p) => p.is_current)?.id);

  const lignes: Ligne[] = [];
  for (let debut = 0; ; debut += 1000) {
    const { data, error } = await requeteAdherents(supabase, f, { colonnes: COLONNES })
      .order("nom")
      .order("prenom")
      .range(debut, debut + 999);
    if (error) return new Response("Export impossible.", { status: 500 });
    lignes.push(...(data as unknown as Ligne[]));
    if (!data || data.length < 1000) break;
  }

  const entete = ["Prénom", "Nom", "E-mail", "Adresse", "Code postal", "Commune", "Adhésion le", "Année d'AG", "Cotisation", "Montant", "Payée le", "Moyen", "Validé en AG le", "Lettre", "Source"];
  const corps = lignes.map((l) =>
    [
      l.prenom,
      l.nom,
      l.email,
      l.adresse,
      l.code_postal,
      l.commune,
      date(l.joined_at),
      l.periode,
      l.status ? STATUTS[l.status] : "",
      l.status && l.status !== "sans" ? formatMontant(l.amount_cents).replace(/ | /g, " ") : "",
      date(l.paid_on),
      l.payment_method ? MOYENS[l.payment_method] : "",
      date(l.ag_validated_on),
      l.lettre ? LETTRE[l.lettre] : "Non",
      l.source === "papier" ? "Bulletin papier" : "En ligne",
    ]
      .map(cellule)
      .join(";"),
  );
  const csv = "﻿" + [entete.join(";"), ...corps].join("\r\n") + "\r\n";

  // Trace de l'export, sans donnée personnelle.
  await supabase.from("audit_log").insert({ actor_id: admin.id, action: "export_adherents", detail: { lignes: lignes.length, vue: f.vue } });

  const jour = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" });
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="adherents-${jour}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
