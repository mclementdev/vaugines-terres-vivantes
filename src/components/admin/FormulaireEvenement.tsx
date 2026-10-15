"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { enregistrerEvenement, mettreEvenementCorbeille, type DonneesEvenement } from "@/app/admin/actions/evenements";
import type { EtatForm } from "@/lib/admin/outils";
import { slugifier } from "@/lib/admin/outils";

import { BoiteDialogue } from "./BoiteDialogue";
import { CaseAdmin, ChampAdmin, ZoneAdmin } from "./ChampsAdmin";
import { EditeurRiche } from "./editeur/EditeurRiche";
import { ImageCouverture } from "./ImageCouverture";
import { PanneauPublication } from "./PanneauPublication";
import { BoutonAdmin, PastilleStatut, RetourForm, classesBoutonAdmin } from "./ui";
import { useEnregistrementAuto } from "./useEnregistrementAuto";

type Props = {
  id: string;
  initial: DonneesEvenement;
  status: string;
  publishedAt: string | null;
  publicSlug: string | null;
};

export function FormulaireEvenement({ id, initial, status, publishedAt, publicSlug }: Props) {
  const [d, setD] = useState<DonneesEvenement>(initial);
  const [etat, setEtat] = useState<EtatForm>({ statut: "inactif" });
  const [enCours, demarrer] = useTransition();
  const [corbeille, setCorbeille] = useState(false);
  // Pas d'enregistrement automatique ici : seulement l'avertissement avant de quitter.
  const suivi = useEnregistrementAuto(d, async () => true, { actif: false });
  const e = etat.erreurs ?? {};
  const maj = <K extends keyof DonneesEvenement>(k: K, v: DonneesEvenement[K]) => setD((x) => ({ ...x, [k]: v }));

  const valider = () =>
    demarrer(async () => {
      const r = await enregistrerEvenement(id, d);
      setEtat(r);
      if (r.statut === "ok") suivi.marquerEnregistre();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

  const programme = d.programme ?? [];
  const majEtape = (i: number, champ: "heure" | "texte", v: string) =>
    maj(
      "programme",
      programme.map((p, j) => (j === i ? { ...p, [champ]: v } : p)),
    );

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/admin/evenements" className="font-bold">
            ← Événements
          </Link>
          <PastilleStatut status={status} publishedAt={publishedAt} />
          {suivi.modifie && <span className="text-sm text-encre-3">Modifications non enregistrées</span>}
        </div>
        <div className="flex flex-wrap gap-2.5">
          {publicSlug && (
            <Link href={`/evenements/${publicSlug}`} target="_blank" className={classesBoutonAdmin("secondaire")}>
              Voir sur le site<span className="sr-only"> (nouvel onglet)</span>
            </Link>
          )}
          <BoutonAdmin onClick={valider} disabled={enCours}>
            {enCours ? "Enregistrement…" : "Enregistrer"}
          </BoutonAdmin>
        </div>
      </div>
      <div className="mb-4">
        <RetourForm statut={etat.statut} message={etat.message} />
      </div>

      <div className="flex flex-wrap items-start gap-5">
        <div className="flex min-w-0 flex-[999_1_520px] flex-col gap-5">
          <section className="overflow-hidden rounded-[20px] bg-white">
            <ImageCouverture chemin={d.coverPath} dossier="evenements" onChange={(c) => maj("coverPath", c)} />
            <div className="flex flex-col gap-4 px-7 py-6">
              <ChampAdmin id="ev-titre" libelle="Titre *" value={d.titre} onChange={(x) => maj("titre", x.target.value)} erreur={e.titre} />
              <ZoneAdmin id="ev-resume" libelle="Résumé" aide="Une ou deux phrases, affichées dans l'agenda et l'accueil." rows={2} value={d.resume} onChange={(x) => maj("resume", x.target.value)} />
              {d.coverPath && (
                <ChampAdmin id="ev-alt" libelle="Texte alternatif de l'image *" value={d.coverAlt} onChange={(x) => maj("coverAlt", x.target.value)} erreur={e.coverAlt} />
              )}
            </div>
            <p className="px-7 pb-1 text-sm font-bold">Le principe (texte de présentation)</p>
            <EditeurRiche libelle="Présentation de l'événement" initial={d.corpsJson} minHauteur="min-h-[200px]" onChange={({ json, html }) => setD((x) => ({ ...x, corpsJson: json, corpsHtml: html }))} />
          </section>

          <section className="flex flex-col gap-3 rounded-[20px] bg-white px-7 py-6">
            <h2 className="font-titre text-xl font-semibold">Programme</h2>
            {programme.length === 0 && <p className="text-encre-3">Aucune étape : le bloc « Programme » ne s&apos;affichera pas.</p>}
            <ol className="flex flex-col gap-2">
              {programme.map((p, i) => (
                <li key={i} className="flex flex-wrap items-end gap-2">
                  <ChampAdmin id={`ev-h-${i}`} libelle={`Heure ${i + 1}`} className="w-28" value={p.heure} placeholder="10 h 00" onChange={(x) => majEtape(i, "heure", x.target.value)} />
                  <ChampAdmin id={`ev-t-${i}`} libelle={`Étape ${i + 1}`} className="min-w-0 flex-1" value={p.texte} onChange={(x) => majEtape(i, "texte", x.target.value)} />
                  <BoutonAdmin variante="discret" onClick={() => maj("programme", programme.filter((_, j) => j !== i))}>
                    Retirer<span className="sr-only"> l&apos;étape {i + 1}</span>
                  </BoutonAdmin>
                </li>
              ))}
            </ol>
            <BoutonAdmin variante="secondaire" className="self-start" onClick={() => maj("programme", [...programme, { heure: "", texte: "" }])}>
              + Ajouter une étape
            </BoutonAdmin>
          </section>
        </div>

        <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-3.5" aria-label="Réglages de l'événement">
          <section className="flex flex-col gap-3 rounded-[18px] bg-white px-5 py-[18px]">
            <PanneauPublication mode={d.publication.mode} date={d.publication.date ?? ""} onChange={(p) => maj("publication", p)} erreur={e.publication} />
            <CaseAdmin libelle="Mettre en avant sur l'accueil" checked={d.featured} onChange={(x) => maj("featured", x.target.checked)} />
          </section>

          <section className="flex flex-col gap-3 rounded-[18px] bg-white px-5 py-[18px]">
            <h2 className="font-bold">Quand</h2>
            <ChampAdmin id="ev-debut" type="datetime-local" libelle="Début (heure de Paris)" value={d.debut} onChange={(x) => maj("debut", x.target.value)} erreur={e.debut} />
            <ChampAdmin id="ev-fin" type="datetime-local" libelle="Fin" value={d.fin} onChange={(x) => maj("fin", x.target.value)} erreur={e.fin} />
            <CaseAdmin libelle="Journée entière (affiche « journée entière »)" checked={d.journee} onChange={(x) => maj("journee", x.target.checked)} />
            <ChampAdmin
              id="ev-libelle"
              libelle="Libellé si la date n'est pas fixée"
              aide="Ex. « 2027 · date à confirmer ». Ignoré si une date de début est indiquée."
              value={d.dateLibelle}
              onChange={(x) => maj("dateLibelle", x.target.value)}
            />
          </section>

          <section className="flex flex-col gap-3 rounded-[18px] bg-white px-5 py-[18px]">
            <h2 className="font-bold">Où</h2>
            <ChampAdmin id="ev-lieu" libelle="Lieu *" placeholder="Place de la fontaine" value={d.lieu} onChange={(x) => maj("lieu", x.target.value)} erreur={e.lieu} />
            <ChampAdmin id="ev-adresse" libelle="Adresse" value={d.adresse} onChange={(x) => maj("adresse", x.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <ChampAdmin id="ev-lat" libelle="Latitude" inputMode="decimal" value={d.latitude} onChange={(x) => maj("latitude", x.target.value)} erreur={e.latitude} />
              <ChampAdmin id="ev-lng" libelle="Longitude" inputMode="decimal" value={d.longitude} onChange={(x) => maj("longitude", x.target.value)} erreur={e.longitude} />
            </div>
            <p className="text-[13px] text-encre-3">
              Pour la carte : sur openstreetmap.org, clic droit sur le lieu › « Afficher l&apos;adresse », puis copiez les deux nombres.
            </p>
            <ZoneAdmin id="ev-acces" libelle="Accessibilité" rows={2} value={d.accessibilite} onChange={(x) => maj("accessibilite", x.target.value)} />
          </section>

          <section className="flex flex-col gap-3 rounded-[18px] bg-white px-5 py-[18px]">
            <h2 className="font-bold">Participation</h2>
            <ChampAdmin id="ev-prix" libelle="Prix *" value={d.prix} onChange={(x) => maj("prix", x.target.value)} erreur={e.prix} />
            <CaseAdmin libelle="Ouvert à toutes et à tous" checked={d.ouvertATous} onChange={(x) => maj("ouvertATous", x.target.checked)} />
            <CaseAdmin libelle="Inscription en ligne" checked={d.inscription} onChange={(x) => maj("inscription", x.target.checked)} />
            <ChampAdmin id="ev-places" libelle="Nombre de places" aide="Laisser vide si illimité." inputMode="numeric" value={d.capacite} onChange={(x) => maj("capacite", x.target.value)} erreur={e.capacite} />
          </section>

          <section className="rounded-[18px] bg-white px-5 py-[18px]">
            <ChampAdmin
              id="ev-slug"
              libelle="Adresse de la page"
              aide={`/evenements/${d.slug || slugifier(d.titre) || "…"}`}
              erreur={e.slug}
              value={d.slug}
              placeholder={slugifier(d.titre)}
              onChange={(x) => maj("slug", slugifier(x.target.value))}
            />
          </section>

          <BoutonAdmin variante="danger" onClick={() => setCorbeille(true)}>
            Mettre à la corbeille
          </BoutonAdmin>
        </aside>
      </div>

      {corbeille && (
        <BoiteDialogue
          titre="Mettre cet événement à la corbeille ?"
          fermer={() => setCorbeille(false)}
          onValider={() => demarrer(() => mettreEvenementCorbeille(id))}
          libelleValider="Mettre à la corbeille"
          danger
        >
          <p>Il disparaîtra de l&apos;agenda. Vous pourrez le restaurer depuis la corbeille.</p>
        </BoiteDialogue>
      )}
    </>
  );
}
