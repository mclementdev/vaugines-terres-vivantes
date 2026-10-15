"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { validerEnAg } from "@/app/admin/actions/adherents";
import { formatMontant } from "@/lib/adhesion/commun";
import { cn } from "@/lib/cn";

import { BoiteDialogue } from "../BoiteDialogue";
import { ChampAdmin } from "../ChampsAdmin";
import { BoutonAdmin, Pastille } from "../ui";

export type Ligne = {
  id: string;
  prenom: string;
  nom: string;
  email: string | null;
  joined_at: string;
  status: "attendue" | "payee" | "sans" | null;
  amount_cents: number | null;
  ag_validated_on: string | null;
  periode: string | null;
  is_sample: boolean;
};

const STATUTS = {
  payee: { libelle: "Payée", ton: "olive" },
  attendue: { libelle: "Virement attendu", ton: "ambre" },
  sans: { libelle: "Sans cotisation", ton: "neutre" },
} as const;

export function PastilleCotisation({ statut }: { statut: Ligne["status"] }) {
  if (!statut) return <span className="text-encre-3">—</span>;
  const s = STATUTS[statut];
  return <Pastille ton={s.ton}>{s.libelle}</Pastille>;
}

const dateCourte = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" });

/** Recherche et année d'AG (paramètres d'URL, l'onglet est conservé). */
export function FiltresAdherents({ q, periode, periodes, vue }: { q: string; periode: string; periodes: { id: string; label: string }[]; vue: string }) {
  const router = useRouter();
  const [, demarrer] = useTransition();
  const aller = (champs: { q?: string; periode?: string }) => {
    const p = new URLSearchParams();
    if (vue !== "tous") p.set("vue", vue);
    const periodeChoisie = champs.periode ?? periode;
    p.set("periode", periodeChoisie);
    const terme = champs.q ?? q;
    if (terme) p.set("q", terme);
    demarrer(() => router.push(`/admin/adherents?${p}`));
  };
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        aller({ q: String(new FormData(e.currentTarget).get("q") ?? "").trim() });
      }}
      className="flex flex-wrap gap-2.5 border-b border-[#EFE3D2] px-3.5 py-3"
    >
      <label className="flex h-[42px] min-w-0 flex-[1_1_220px] items-center gap-2 rounded-[10px] border-[1.5px] border-bordure-douce px-3 focus-within:border-terre">
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="#6B5646" strokeWidth="1.8" aria-hidden="true">
          <circle cx="7" cy="7" r="5" />
          <path d="M11 11l3.5 3.5" />
        </svg>
        <span className="sr-only">Rechercher un adhérent</span>
        <input type="search" name="q" defaultValue={q} placeholder="Nom, e-mail, commune…" className="min-w-0 flex-1 border-0 bg-transparent outline-none" />
      </label>
      <label className="flex items-center gap-1.5 font-bold">
        Année d&apos;AG
        <select
          value={periode}
          onChange={(e) => aller({ periode: e.target.value })}
          className="h-[42px] rounded-[10px] border-[1.5px] border-bordure-douce bg-white px-2 font-normal"
        >
          {periodes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
          <option value="toutes">Toutes</option>
        </select>
      </label>
      <BoutonAdmin type="submit" variante="secondaire" className="min-h-[42px]">
        Rechercher
      </BoutonAdmin>
    </form>
  );
}

/** Tableau des adhésions : sélection multiple pour la validation en AG. */
/** `baseFiche` : URL de la liste avec ses filtres, à laquelle on ajoute l'identifiant de la fiche. */
export function TableauAdherents({ lignes, selection, baseFiche, toutesAnnees }: { lignes: Ligne[]; selection: string | null; baseFiche: string; toutesAnnees: boolean }) {
  const [coches, setCoches] = useState<string[]>([]);
  const [dialogue, setDialogue] = useState(false);
  const [dateAg, setDateAg] = useState("");
  const [retour, setRetour] = useState<{ ok: boolean; message: string }>();
  const [enCours, demarrer] = useTransition();
  const router = useRouter();
  const aValider = lignes.filter((l) => !l.ag_validated_on);
  const ids = [...new Set(coches)];
  const basculer = (id: string) => setCoches((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));

  return (
    <>
      {ids.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 border-b border-[#EFE3D2] bg-sable-chaud px-3.5 py-2.5">
          <span className="font-bold">{ids.length} sélectionné·e{ids.length > 1 ? "s" : ""}</span>
          <BoutonAdmin
            onClick={() => {
              setDateAg(new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" }));
              setDialogue(true);
            }}
            className="min-h-10"
          >
            Valider en AG
          </BoutonAdmin>
          <BoutonAdmin variante="discret" onClick={() => setCoches([])}>
            Tout désélectionner
          </BoutonAdmin>
        </div>
      )}
      {retour && (
        <p role="status" className={cn("px-3.5 py-2.5 font-semibold", retour.ok ? "bg-tag-olive text-tag-olive-fg" : "bg-tag-terre text-erreur")}>
          {retour.message}
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-left text-[15px]">
          <caption className="sr-only">Adhésions</caption>
          <thead className="text-[13px] text-encre-3">
            <tr className="border-b border-[#EFE3D2]">
              <th scope="col" className="w-10 px-3.5 py-3">
                <input
                  type="checkbox"
                  aria-label="Sélectionner toutes les adhésions à valider de cette page"
                  checked={aValider.length > 0 && aValider.every((l) => coches.includes(l.id))}
                  onChange={(e) => setCoches(e.target.checked ? aValider.map((l) => l.id) : [])}
                  disabled={aValider.length === 0}
                  className="size-[18px] accent-terre"
                />
              </th>
              <th scope="col" className="px-3.5 py-3 font-bold">Adhérent</th>
              <th scope="col" className="px-3.5 py-3 font-bold">Adhésion</th>
              {toutesAnnees && <th scope="col" className="px-3.5 py-3 font-bold">Année d&apos;AG</th>}
              <th scope="col" className="px-3.5 py-3 font-bold">Cotisation</th>
              <th scope="col" className="px-3.5 py-3 font-bold">Montant</th>
              <th scope="col" className="px-3.5 py-3 font-bold">Validé en AG</th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((l, i) => {
              const active = l.id === selection;
              return (
                <tr key={`${l.id}-${l.periode ?? i}`} className={cn("border-b border-[#F3EADF] last:border-0", active ? "bg-sable-chaud" : "hover:bg-[#FDF8F2]")}>
                  <td className="px-3.5 py-3">
                    <input
                      type="checkbox"
                      aria-label={`Sélectionner ${l.prenom} ${l.nom}`}
                      checked={coches.includes(l.id)}
                      onChange={() => basculer(l.id)}
                      disabled={Boolean(l.ag_validated_on)}
                      className="size-[18px] accent-terre"
                    />
                  </td>
                  <td className="px-3.5 py-3">
                    <Link href={`${baseFiche}&id=${l.id}#fiche`} aria-current={active ? "true" : undefined} className="block font-bold text-encre no-underline hover:text-terre-fonce hover:underline">
                      {l.prenom} {l.nom}
                      {l.is_sample && <span className="ml-2 align-middle text-xs font-semibold text-encre-3">(exemple)</span>}
                    </Link>
                    <span className="text-[13px] text-encre-3 [overflow-wrap:anywhere]">{l.email ?? "pas d'e-mail"}</span>
                  </td>
                  <td className="whitespace-nowrap px-3.5 py-3">{dateCourte(l.joined_at)}</td>
                  {toutesAnnees && <td className="whitespace-nowrap px-3.5 py-3">{l.periode ?? "—"}</td>}
                  <td className="whitespace-nowrap px-3.5 py-3">
                    <PastilleCotisation statut={l.status} />
                  </td>
                  <td className="whitespace-nowrap px-3.5 py-3 font-bold">{l.status === "sans" ? "—" : formatMontant(l.amount_cents)}</td>
                  <td className="whitespace-nowrap px-3.5 py-3">{l.ag_validated_on ? `Oui, ${dateCourte(l.ag_validated_on)}` : "À valider"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {dialogue && (
        <BoiteDialogue
          titre={`Valider ${ids.length > 1 ? `${ids.length} adhésions` : "cette adhésion"} en AG`}
          fermer={() => setDialogue(false)}
          enCours={enCours}
          libelleValider={enCours ? "Validation…" : "Valider"}
          onValider={() => {
            demarrer(async () => {
              const r = await validerEnAg(ids, dateAg);
              setRetour(r);
              if (r.ok) {
                setCoches([]);
                setDialogue(false);
                router.refresh();
              }
            });
          }}
        >
          <p className="mb-3">L&apos;Assemblée Générale vote l&apos;adhésion des nouveaux membres (article 9 des statuts).</p>
          <ChampAdmin id="ag-date" type="date" libelle="Date de l'Assemblée Générale" required value={dateAg} onChange={(e) => setDateAg(e.target.value)} />
        </BoiteDialogue>
      )}
    </>
  );
}
