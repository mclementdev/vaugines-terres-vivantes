import { FormulaireAdherent } from "@/components/admin/adherents/FormulaireAdherent";
import { EnTeteAdmin } from "@/components/admin/ui";
import { exigerAdmin } from "@/lib/auth";
import { clientSession } from "@/lib/supabase/serveur";

export const metadata = { title: "Ajouter un bulletin papier" };
export const instant = false;

export default async function NouvelAdherent() {
  await exigerAdmin();
  const supabase = await clientSession();
  const { data: periode } = await supabase.from("ag_periods").select("label").eq("is_current", true).maybeSingle();
  const aujourdhui = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" });

  return (
    <div className="max-w-[860px]">
      <EnTeteAdmin titre="Ajouter un bulletin papier" retour={{ href: "/admin/adherents", libelle: "Adhérents" }} />
      <FormulaireAdherent
        id={null}
        periode={periode?.label ?? null}
        valeurs={{
          prenom: "",
          nom: "",
          email: "",
          telephone: "",
          naissance: "",
          adresse: "",
          code_postal: "84160",
          commune: "Vaugines",
          notes: "",
          joined_on: aujourdhui,
          mode: "avec",
          montant: "",
          statut: "payee",
          paid_on: aujourdhui,
          moyen: "cheque",
          lettre: false,
        }}
      />
    </div>
  );
}
