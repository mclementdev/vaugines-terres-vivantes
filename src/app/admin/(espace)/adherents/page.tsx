import Link from "next/link";

import { supprimerAdherent } from "@/app/admin/actions/adherents";
import { ActionsAdherent, CoordonneesMasquees, NouvelleAnneeAg, RelanceGroupee } from "@/components/admin/adherents/ActionsAdherent";
import { FiltresAdherents, PastilleCotisation, TableauAdherents, type Ligne } from "@/components/admin/adherents/ListeAdherents";
import { BoutonSupprimer } from "@/components/admin/BoutonSupprimer";
import { CarteAdmin, EnTeteAdmin, LienAdmin, Pastille } from "@/components/admin/ui";
import { formatMontant } from "@/lib/adhesion/commun";
import { MOYENS, PAR_PAGE, VUES, compterVues, getFiche, getPeriodes, libelleHistorique, lireFiltres, requeteAdherents, requeteARelancer, type Filtres } from "@/lib/admin/adherents";
import { exigerAdmin } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { clientSession } from "@/lib/supabase/serveur";

export const metadata = { title: "Adhérents" };
export const instant = false;

const MESSAGES: Record<string, { texte: string; erreur?: boolean }> = {
  ajoute: { texte: "Adhérent·e ajouté·e." },
  modifie: { texte: "Fiche enregistrée." },
  supprime: { texte: "Fiche supprimée définitivement (droit à l'effacement), avec son historique et son abonnement à la lettre." },
  "suppression-echec": { texte: "La suppression a échoué. Réessayez.", erreur: true },
};

const date = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" });
const dateHeure = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", { timeZone: "Europe/Paris", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

/** URL du CRM avec les filtres en cours. */
function url(f: Filtres, extra: Record<string, string | number | undefined> = {}) {
  const p = new URLSearchParams();
  if (f.vue !== "tous") p.set("vue", f.vue);
  p.set("periode", f.periode);
  if (f.q) p.set("q", f.q);
  for (const [k, v] of Object.entries(extra)) if (v !== undefined && v !== "") p.set(k, String(v));
  return `/admin/adherents?${p}`;
}

export default async function Adherents(props: PageProps<"/admin/adherents">) {
  const admin = await exigerAdmin();
  const sp = await props.searchParams;
  const supabase = await clientSession();
  const periodes = await getPeriodes(supabase);
  const courante = periodes.find((p) => p.is_current);
  const f = lireFiltres(sp, courante?.id);
  const id = typeof sp.id === "string" ? sp.id : null;
  const ok = typeof sp.ok === "string" ? MESSAGES[sp.ok] : undefined;

  const [liste, nombres, aRelancer, fiche] = await Promise.all([
    requeteAdherents(supabase, f, { colonnes: "id, prenom, nom, email, joined_at, status, amount_cents, ag_validated_on, periode, is_sample" })
      .order("joined_at", { ascending: false })
      .order("periode", { ascending: false })
      .range((f.page - 1) * PAR_PAGE, f.page * PAR_PAGE - 1),
    compterVues(supabase, f),
    requeteARelancer(supabase, { compter: true }),
    id ? getFiche(supabase, id) : Promise.resolve(null),
  ]);

  const lignes = (liste.data ?? []) as unknown as Ligne[];
  const total = liste.count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAR_PAGE));
  const libellePeriode = f.periode === "toutes" ? "toutes les années d'AG" : `année d'AG ${periodes.find((p) => p.id === f.periode)?.label ?? "?"}`;

  return (
    <>
      <EnTeteAdmin
        titre="Adhérents"
        surtitre={courante ? `Année d'AG en cours : ${courante.label}` : "Aucune année d'AG en cours"}
        actions={
          <>
            <a href={`/admin/adherents/export.csv?${new URLSearchParams({ vue: f.vue, periode: f.periode, ...(f.q && { q: f.q }) })}`} download className="inline-flex min-h-11 items-center rounded-xl border-[1.5px] border-bordure-champ bg-white px-[18px] font-bold text-encre no-underline hover:border-terre hover:text-terre-fonce">
              Exporter CSV
            </a>
            <RelanceGroupee nombre={aRelancer.count ?? 0} />
            <LienAdmin href="/admin/adherents/nouveau">+ Ajouter (bulletin papier)</LienAdmin>
          </>
        }
      />

      {ok && (
        <p role={ok.erreur ? "alert" : "status"} className={cn("mb-4 rounded-[14px] px-4 py-3 font-semibold", ok.erreur ? "bg-tag-terre text-erreur" : "bg-tag-olive text-tag-olive-fg")}>
          {ok.texte}
        </p>
      )}

      <nav aria-label="Statut de cotisation" className="mb-3.5 flex flex-wrap gap-2">
        {VUES.map((v) => (
          <Link
            key={v.cle}
            href={url({ ...f, vue: v.cle, page: 1 })}
            aria-current={f.vue === v.cle ? "page" : undefined}
            className={cn(
              "rounded-full border-[1.5px] px-3.5 py-2 text-[15px] font-bold no-underline",
              f.vue === v.cle ? "border-brun bg-brun text-white hover:text-white" : "border-bordure-douce bg-white text-encre hover:border-terre",
            )}
          >
            {v.libelle} · {nombres[v.cle]}
          </Link>
        ))}
      </nav>

      <div className="flex flex-wrap items-start gap-[18px]">
        <div className="min-w-0 flex-[999_1_520px] overflow-hidden rounded-[18px] bg-white">
          <FiltresAdherents q={f.q} periode={f.periode} vue={f.vue} periodes={periodes} />
          {lignes.length === 0 ? (
            <p className="px-5 py-10 text-center text-encre-2">{f.q ? `Aucun résultat pour « ${f.q} ».` : `Aucune adhésion dans cet onglet (${libellePeriode}).`}</p>
          ) : (
            <TableauAdherents lignes={lignes} selection={id} toutesAnnees={f.periode === "toutes"} baseFiche={url(f, { page: f.page > 1 ? f.page : undefined })} />
          )}
          <div className="flex flex-wrap justify-between gap-2 px-3.5 py-3 text-sm text-encre-3">
            <span>
              {lignes.length} sur {total} · {libellePeriode}
            </span>
            <span className="flex gap-3">
              {f.page > 1 && <Link href={url(f, { page: f.page - 1, id: id ?? undefined })}>← Précédente</Link>}
              <span>
                Page {f.page} / {pages}
              </span>
              {f.page < pages && <Link href={url(f, { page: f.page + 1, id: id ?? undefined })}>Suivante →</Link>}
            </span>
          </div>
        </div>

        <aside id="fiche" aria-label="Fiche adhérent" className="min-w-0 flex-[1_1_320px] rounded-[18px] bg-white p-[22px]">
          {fiche ? (
            <FicheAdherent fiche={fiche} periode={f.periode} superadmin={admin.role === "superadmin"} />
          ) : (
            <p className="text-encre-2">{id ? "Cette fiche n'existe plus." : "Choisissez une personne dans la liste pour afficher sa fiche."}</p>
          )}
        </aside>
      </div>

      {admin.role === "superadmin" && (
        <CarteAdmin titre="Années d'AG" className="mt-6">
          <p className="mb-3 text-[15px] text-encre-2">
            La cotisation vaut d&apos;une Assemblée Générale à la suivante. Après l&apos;AG, ouvrez la nouvelle année :{" "}
            {periodes.map((p) => `${p.label}${p.is_current ? " (en cours)" : ""}`).join(", ") || "aucune année pour l'instant"}.
          </p>
          <NouvelleAnneeAg suggestion={suggestionAnnee(courante?.label)} />
        </CarteAdmin>
      )}
    </>
  );
}

/** « 2026–2027 » → « 2027–2028 » */
function suggestionAnnee(label?: string) {
  const m = label?.match(/(\d{4})\D+(\d{4})/);
  return m ? `${Number(m[1]) + 1}–${Number(m[2]) + 1}` : "";
}

function FicheAdherent({ fiche, periode, superadmin }: { fiche: NonNullable<Awaited<ReturnType<typeof getFiche>>>; periode: string; superadmin: boolean }) {
  const cotisation = fiche.cotisations.find((c) => (periode === "toutes" ? c.ag_periods?.is_current : c.ag_periods?.id === periode)) ?? fiche.cotisations[0] ?? null;
  const initiales = `${fiche.prenom[0] ?? ""}${fiche.nom[0] ?? ""}`.toUpperCase();
  const adresse = [fiche.adresse, [fiche.code_postal, fiche.commune].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  const LETTRE = { active: "Abonné·e", pending: "En attente de confirmation", unsubscribed: "Désinscrit·e" } as const;
  const lettre = fiche.lettre ? LETTRE[fiche.lettre.status] : "Non abonné·e";

  return (
    <>
      <div className="mb-3.5 flex items-center gap-3">
        <span aria-hidden="true" className="flex size-[52px] shrink-0 items-center justify-center rounded-full bg-tag-terre font-titre text-lg font-semibold text-tag-terre-fg">
          {initiales}
        </span>
        <div className="min-w-0">
          <h2 className="font-titre text-[22px] font-semibold leading-tight">
            {fiche.prenom} {fiche.nom}
          </h2>
          <span className="text-sm text-encre-3">
            Adhérent·e depuis le {date(fiche.joined_at)}
            {fiche.source === "papier" && " · bulletin papier"}
          </span>
          {fiche.is_sample && (
            <span className="ml-2">
              <Pastille ton="ambre">Exemple fictif</Pastille>
            </span>
          )}
        </div>
      </div>

      <dl className="mb-4 grid grid-cols-2 gap-2.5 text-sm">
        <div className="col-span-2">
          <dt className="text-encre-3">E-mail</dt>
          <dd className="font-bold [overflow-wrap:anywhere]">{fiche.email ? <a href={`mailto:${fiche.email}`}>{fiche.email}</a> : "—"}</dd>
        </div>
        <CoordonneesMasquees key={fiche.id} memberId={fiche.id} aTelephone={fiche.prive.has_phone} aNaissance={fiche.prive.has_birth_date} />
        <div>
          <dt className="text-encre-3">Cotisation {cotisation?.ag_periods?.label}</dt>
          <dd className="font-bold">
            {cotisation ? (
              <>
                <PastilleCotisation statut={cotisation.status} /> {cotisation.status !== "sans" && formatMontant(cotisation.amount_cents)}
                {cotisation.status === "payee" && cotisation.paid_on && (
                  <span className="block text-[13px] font-normal text-encre-3">
                    reçue le {date(cotisation.paid_on)}
                    {cotisation.payment_method && ` (${MOYENS[cotisation.payment_method]})`}
                  </span>
                )}
              </>
            ) : (
              "—"
            )}
          </dd>
        </div>
        <div>
          <dt className="text-encre-3">Lettre</dt>
          <dd className="font-bold">{lettre}</dd>
        </div>
        <div>
          <dt className="text-encre-3">Validé en AG</dt>
          <dd className="font-bold">{fiche.ag_validated_on ? `le ${date(fiche.ag_validated_on)}` : "À valider"}</dd>
        </div>
        {adresse && (
          <div className="col-span-2">
            <dt className="text-encre-3">Adresse</dt>
            <dd className="font-bold">{adresse}</dd>
          </div>
        )}
        {fiche.notes && (
          <div className="col-span-2">
            <dt className="text-encre-3">Notes internes</dt>
            <dd className="whitespace-pre-line">{fiche.notes}</dd>
          </div>
        )}
      </dl>

      <ActionsAdherent
        key={fiche.id}
        memberId={fiche.id}
        email={fiche.email}
        valideEnAg={Boolean(fiche.ag_validated_on)}
        cotisation={
          cotisation?.ag_periods?.is_current
            ? {
                id: cotisation.id,
                status: cotisation.status,
                montant: formatMontant(cotisation.amount_cents),
                derniereRelance: cotisation.last_reminder_at ? `${date(cotisation.last_reminder_at)} (${cotisation.reminders_count} au total)` : null,
              }
            : null
        }
      />
      <LienAdmin href={`/admin/adherents/${fiche.id}`} variante="discret" className="mt-1 px-0">
        Modifier la fiche
      </LienAdmin>

      {fiche.cotisations.length > 1 && (
        <>
          <h3 className="mb-2 mt-4 text-[15px] font-bold">Cotisations</h3>
          <ul className="flex flex-col gap-1 text-sm">
            {fiche.cotisations.map((c) => (
              <li key={c.id}>
                <strong>{c.ag_periods?.label}</strong> · <PastilleCotisation statut={c.status} /> {c.status !== "sans" && formatMontant(c.amount_cents)}
              </li>
            ))}
          </ul>
        </>
      )}

      <h3 className="mb-2 mt-[18px] text-[15px] font-bold">Historique</h3>
      <ol className="flex flex-col gap-2 border-l-2 border-pierre pl-3.5 text-sm">
        {fiche.historique.map((h) => (
          <li key={h.id}>
            <strong>{dateHeure(h.created_at)}</strong> · {libelleHistorique(h.event, (h.detail ?? {}) as Record<string, unknown>)}
            {h.profiles && <span className="text-encre-3"> · par {h.profiles.prenom || "un admin"}</span>}
          </li>
        ))}
        {fiche.historique.length === 0 && <li className="text-encre-3">Aucun évènement.</li>}
      </ol>

      <div className="mt-5 border-t border-[#EFE3D2] pt-4">
        {superadmin ? (
          <BoutonSupprimer action={supprimerAdherent.bind(null, fiche.id)} quoi={`la fiche de ${fiche.prenom} ${fiche.nom} et tout son historique`} libelle="Supprimer (droit à l'effacement)" />
        ) : (
          <p className="text-[13px] text-encre-3">Supprimer l&apos;adhérent (droit à l&apos;effacement) : superadmin uniquement.</p>
        )}
      </div>
    </>
  );
}
