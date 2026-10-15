import { notFound } from "next/navigation";
import { z } from "zod";

import { FormulaireAdherent } from "@/components/admin/adherents/FormulaireAdherent";
import { EnTeteAdmin } from "@/components/admin/ui";
import { afficherDateNaissance } from "@/lib/adhesion/commun";
import { exigerAdmin } from "@/lib/auth";
import { clientSession } from "@/lib/supabase/serveur";

export const metadata = { title: "Modifier une fiche adhérent" };
export const instant = false;

export default async function ModifierAdherent(props: PageProps<"/admin/adherents/[id]">) {
  await exigerAdmin();
  const { id } = await props.params;
  if (!z.uuid().safeParse(id).success) notFound();
  const supabase = await clientSession();
  const [{ data: m }, { data: periode }] = await Promise.all([
    supabase.from("members").select("prenom, nom, email, adresse, code_postal, commune, notes, joined_at").eq("id", id).maybeSingle(),
    supabase.from("ag_periods").select("id, label").eq("is_current", true).maybeSingle(),
  ]);
  if (!m) notFound();

  // La modification affiche le téléphone et la date de naissance : consultation notée dans l'historique.
  const [prive, cotisation, abonne] = await Promise.all([
    supabase.rpc("member_private_read", { p_member_id: id }),
    periode
      ? supabase.from("contributions").select("mode, status, amount_cents, payment_method, paid_on").eq("member_id", id).eq("period_id", periode.id).maybeSingle()
      : Promise.resolve({ data: null }),
    m.email ? supabase.from("newsletter_subscribers").select("status").eq("email", m.email).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const p = prive.data?.[0];
  const c = cotisation.data;

  return (
    <div className="max-w-[860px]">
      <EnTeteAdmin titre={`${m.prenom} ${m.nom}`} surtitre="Modifier la fiche" retour={{ href: `/admin/adherents?id=${id}`, libelle: "Adhérents" }} />
      <FormulaireAdherent
        id={id}
        periode={periode?.label ?? null}
        valeurs={{
          prenom: m.prenom,
          nom: m.nom,
          email: m.email ?? "",
          telephone: p?.phone ?? "",
          naissance: afficherDateNaissance(p?.birth_date),
          adresse: m.adresse ?? "",
          code_postal: m.code_postal ?? "",
          commune: m.commune ?? "",
          notes: m.notes ?? "",
          joined_on: m.joined_at.slice(0, 10),
          mode: c?.mode ?? "sans",
          montant: c?.amount_cents ? String(c.amount_cents / 100).replace(".", ",") : "",
          statut: c?.status === "payee" ? "payee" : "attendue",
          paid_on: c?.paid_on ?? "",
          moyen: c?.payment_method ?? "virement",
          lettre: abonne.data?.status === "active" || abonne.data?.status === "pending",
        }}
      />
    </div>
  );
}
