import { changerRole, retirerAcces } from "@/app/admin/actions/parametres";
import { BoutonSupprimer } from "@/components/admin/BoutonSupprimer";
import { BoutonPurge, FormulaireInvitation, FormulaireReglages } from "@/components/admin/FormulairesParametres";
import { BoutonAdmin, CarteAdmin, EnTeteAdmin, Pastille, TableauAdmin } from "@/components/admin/ui";
import { exigerSuperadmin } from "@/lib/auth";
import type { Reglages } from "@/lib/data/site";
import { ilYA } from "@/lib/dates";
import { clientSession } from "@/lib/supabase/serveur";

export const metadata = { title: "Comptes & paramètres" };
export const instant = false;

const MESSAGES: Record<string, string> = {
  role: "Rôle modifié.",
  retrait: "Accès retiré.",
  purge: "Exemples fictifs supprimés.",
  "dernier-superadmin": "Il doit toujours rester au moins un superadmin.",
  "soi-meme": "Vous ne pouvez pas retirer votre propre accès.",
  "retrait-echec": "Le retrait de l'accès a échoué.",
  "purge-echec": "La purge a échoué.",
};

export default async function ComptesParametres(props: PageProps<"/admin/comptes">) {
  const admin = await exigerSuperadmin();
  const sp = await props.searchParams;
  const supabase = await clientSession();
  const [profils, reglages, prive, exemples, journal] = await Promise.all([
    supabase.from("profiles").select("id, email, prenom, nom, role, invited_at, created_at").order("created_at"),
    supabase.from("site_settings").select("data").eq("id", 1).single(),
    supabase.from("private_settings").select("data").eq("id", 1).single(),
    supabase.rpc("compter_exemples"),
    supabase.from("audit_log").select("id, action, cible, created_at, auteur:profiles(prenom, nom)").order("created_at", { ascending: false }).limit(15),
  ]);
  const r = reglages.data?.data as unknown as Reglages;
  const alertes = (prive.data?.data as { email_alertes?: string } | null)?.email_alertes ?? r.email;
  const message = typeof sp.ok === "string" ? MESSAGES[sp.ok] : typeof sp.erreur === "string" ? MESSAGES[sp.erreur] : undefined;

  return (
    <>
      <EnTeteAdmin titre="Comptes & paramètres" />
      {message && (
        <p role={sp.erreur ? "alert" : "status"} className={`mb-5 rounded-[14px] px-4 py-3 font-semibold ${sp.erreur ? "bg-tag-terre text-erreur" : "bg-tag-olive text-tag-olive-fg"}`}>
          {message}
        </p>
      )}

      <div className="flex max-w-[1100px] flex-col gap-5">
        <CarteAdmin titre="Comptes d'administration">
          <TableauAdmin
            legende="Comptes"
            colonnes={["Personne", "Rôle", "Actions"]}
            lignes={(profils.data ?? []).map((p) => ({
              cle: p.id,
              cellules: [
                <span key="n">
                  <strong>{[p.prenom, p.nom].filter(Boolean).join(" ") || "—"}</strong>
                  {p.id === admin.id && " (vous)"}
                  <span className="block text-sm text-encre-3">{p.email}</span>
                </span>,
                <Pastille key="r" ton={p.role === "superadmin" ? "terre" : "indigo"}>
                  {p.role === "superadmin" ? "Superadmin" : "Admin"}
                </Pastille>,
                p.id === admin.id ? (
                  <span key="a" className="text-sm text-encre-3">—</span>
                ) : (
                  <span key="a" className="flex flex-wrap gap-2">
                    <form action={changerRole.bind(null, p.id, p.role === "superadmin" ? "admin" : "superadmin")}>
                      <BoutonAdmin type="submit" variante="secondaire">
                        {p.role === "superadmin" ? "Passer admin" : "Passer superadmin"}
                      </BoutonAdmin>
                    </form>
                    <BoutonSupprimer action={retirerAcces.bind(null, p.id)} quoi={`l'accès de ${p.prenom || p.email}`} libelle="Retirer l'accès" />
                  </span>
                ),
              ],
            }))}
          />
          <h3 className="mb-2 mt-6 font-bold">Inviter une personne</h3>
          <p className="mb-3 text-sm text-encre-3">
            Elle reçoit un e-mail pour activer son accès ; elle se connectera ensuite avec un lien envoyé par e-mail, sans mot de passe.
          </p>
          <FormulaireInvitation />
        </CarteAdmin>

        <CarteAdmin titre="Paramètres du site">
          <FormulaireReglages
            initial={{
              adresse: r.adresse,
              email: r.email,
              virement: r.virement,
              reseaux: { facebook: r.reseaux.facebook ?? "", instagram: r.reseaux.instagram ?? "" },
              chiffres: {
                adherents: { valeur: r.chiffres.adherents.valeur ?? "", visible: r.chiffres.adherents.visible },
                actions: { valeur: r.chiffres.actions.valeur ?? "", visible: r.chiffres.actions.visible },
                rendez_vous: { valeur: r.chiffres.rendez_vous.valeur ?? "", visible: r.chiffres.rendez_vous.visible },
                conseil: { valeur: r.chiffres.conseil.valeur ?? "", visible: r.chiffres.conseil.visible },
              },
              signature_email: r.signature_email,
              email_alertes: alertes,
            }}
          />
        </CarteAdmin>

        <CarteAdmin titre="Avant la mise en ligne">
          <p className="mb-3 text-encre-2">
            Les maquettes ont fourni des exemples fictifs (événements, idées, fiches de veille, un article) pour montrer le site
            rempli. Supprimez-les quand les vrais contenus sont prêts.
          </p>
          <BoutonPurge nombre={exemples.data ?? 0} />
        </CarteAdmin>

        <CarteAdmin titre="Journal des actions sensibles">
          {(journal.data ?? []).length === 0 ? (
            <p className="text-encre-3">Rien pour le moment.</p>
          ) : (
            <ul className="text-[15px]">
              {(journal.data ?? []).map((j) => (
                <li key={j.id} className="border-t border-[#F0E6D8] py-2 first:border-t-0">
                  <strong>{j.action.replaceAll("_", " ")}</strong>
                  {j.cible && ` · ${j.cible}`}
                  <span className="text-encre-3">
                    {" "}
                    · {[j.auteur?.prenom, j.auteur?.nom].filter(Boolean).join(" ") || "système"} · {ilYA(j.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CarteAdmin>
      </div>
    </>
  );
}
