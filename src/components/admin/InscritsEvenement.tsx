import { annulerInscriptionAdmin } from "@/app/admin/actions/inscriptions";
import { clientSession } from "@/lib/supabase/serveur";

import { BoutonAdmin, CarteAdmin, Pastille } from "./ui";

const date = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" });

/** Liste des inscrits d'un événement (fiche admin). */
export async function InscritsEvenement({ eventId, capacite }: { eventId: string; capacite: number | null }) {
  const supabase = await clientSession();
  const { data } = await supabase
    .from("event_registrations")
    .select("id, nom, email, places, status, created_at, reminder_sent_at")
    .eq("event_id", eventId)
    .order("status")
    .order("created_at");
  const lignes = data ?? [];
  const confirmees = lignes.filter((l) => l.status === "confirmee");
  const total = confirmees.reduce((s, l) => s + l.places, 0);

  return (
    <CarteAdmin titre={`Inscrits · ${total}${capacite ? ` / ${capacite} places` : ""}`} className="mt-6">
      {lignes.length === 0 ? (
        <p className="text-encre-2">Personne n&apos;est encore inscrit.</p>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-encre-3">
              {confirmees.length} inscription{confirmees.length > 1 ? "s" : ""} · effacées automatiquement un mois après l&apos;événement.
            </p>
            <a
              href={`/admin/evenements/${eventId}/inscrits.csv`}
              download
              className="inline-flex min-h-10 items-center rounded-xl border-[1.5px] border-bordure-champ bg-white px-4 font-bold text-encre no-underline hover:border-terre"
            >
              Exporter CSV
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-[15px]">
              <caption className="sr-only">Inscrits</caption>
              <thead className="text-[13px] text-encre-3">
                <tr className="border-b border-[#EFE3D2]">
                  <th scope="col" className="py-2 pr-3 font-bold">Nom</th>
                  <th scope="col" className="py-2 pr-3 font-bold">E-mail</th>
                  <th scope="col" className="py-2 pr-3 font-bold">Pers.</th>
                  <th scope="col" className="py-2 pr-3 font-bold">Inscrit le</th>
                  <th scope="col" className="py-2 font-bold"><span className="sr-only">Action</span></th>
                </tr>
              </thead>
              <tbody>
                {lignes.map((l) => (
                  <tr key={l.id} className="border-b border-[#F3EADF] last:border-0">
                    <td className="py-2.5 pr-3 font-bold">{l.nom}</td>
                    <td className="py-2.5 pr-3 [overflow-wrap:anywhere]">
                      <a href={`mailto:${l.email}`}>{l.email}</a>
                    </td>
                    <td className="py-2.5 pr-3">{l.places}</td>
                    <td className="whitespace-nowrap py-2.5 pr-3">{date(l.created_at)}</td>
                    <td className="py-2.5 text-right">
                      {l.status === "confirmee" ? (
                        <form action={annulerInscriptionAdmin.bind(null, l.id)}>
                          <BoutonAdmin type="submit" variante="discret" className="min-h-0 text-sm">
                            Annuler
                          </BoutonAdmin>
                        </form>
                      ) : (
                        <Pastille>Annulée</Pastille>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </CarteAdmin>
  );
}
