"use client";

import { useState, useTransition, type ReactNode } from "react";

import {
  enregistrerAction,
  enregistrerDossier,
  enregistrerFaq,
  enregistrerFiche,
  enregistrerTerme,
  type DonneesAction,
  type DonneesDossier,
  type DonneesFaq,
  type DonneesFiche,
  type DonneesTerme,
} from "@/app/admin/actions/contenus";
import type { EtatForm } from "@/lib/admin/outils";
import { CATEGORIES_FAQ, CATEGORIES_GLOSSAIRE, THEMES_VEILLE } from "@/lib/libelles";

import { CaseAdmin, ChampAdmin, ChoixAdmin, ZoneAdmin } from "./ChampsAdmin";
import { EditeurRiche } from "./editeur/EditeurRiche";
import { ImageCouverture } from "./ImageCouverture";
import { BoutonAdmin, RetourForm } from "./ui";
import { useEnregistrementAuto } from "./useEnregistrementAuto";

/** État + envoi d'un formulaire d'objet vers une Server Action. */
function useFormulaire<T>(initial: T, envoyer: (d: T) => Promise<EtatForm>, messageInitial?: string) {
  const [d, setD] = useState<T>(initial);
  const [etat, setEtat] = useState<EtatForm>(messageInitial ? { statut: "ok", message: messageInitial } : { statut: "inactif" });
  const [enCours, demarrer] = useTransition();
  const suivi = useEnregistrementAuto(d, async () => true, { actif: false });
  const maj = <K extends keyof T>(k: K, v: T[K]) => setD((x) => ({ ...x, [k]: v }));
  const soumettre = () =>
    demarrer(async () => {
      const r = await envoyer(d);
      if (r) {
        setEtat(r);
        if (r.statut === "ok") suivi.marquerEnregistre();
      }
    });
  return { d, setD, maj, etat, e: etat.erreurs ?? {}, enCours, soumettre, modifie: suivi.modifie };
}

function Cadre({ children, etat, enCours, modifie, soumettre, libelle = "Enregistrer", actionsSecondaires }: {
  children: ReactNode;
  etat: EtatForm;
  enCours: boolean;
  modifie: boolean;
  soumettre: () => void;
  libelle?: string;
  actionsSecondaires?: ReactNode;
}) {
  return (
    <form
      onSubmit={(ev) => {
        ev.preventDefault();
        soumettre();
      }}
      className="flex max-w-[860px] flex-col gap-4"
      noValidate
    >
      <RetourForm statut={etat.statut} message={etat.message} />
      <div className="flex flex-col gap-4 rounded-[20px] bg-white px-6 py-6">{children}</div>
      <div className="flex flex-wrap items-center gap-3">
        <BoutonAdmin type="submit" disabled={enCours}>
          {enCours ? "Enregistrement…" : libelle}
        </BoutonAdmin>
        {modifie && <span className="text-sm text-encre-3">Modifications non enregistrées</span>}
        <span className="ml-auto flex gap-2">{actionsSecondaires}</span>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------

export function FormulaireFaq({ id, initial, messageInitial, actionsSecondaires }: { id: string | null; initial: DonneesFaq & { reponseJson?: unknown }; messageInitial?: string; actionsSecondaires?: ReactNode }) {
  const f = useFormulaire(initial, (x) => enregistrerFaq(id, x), messageInitial);
  return (
    <Cadre {...f} actionsSecondaires={actionsSecondaires}>
      <ChoixAdmin id="faq-cat" libelle="Catégorie" value={f.d.categorie} onChange={(x) => f.maj("categorie", x.target.value as DonneesFaq["categorie"])}>
        {Object.entries(CATEGORIES_FAQ).map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </ChoixAdmin>
      <ChampAdmin id="faq-q" libelle="Question *" value={f.d.question} onChange={(x) => f.maj("question", x.target.value)} erreur={f.e.question} />
      <div>
        <p className="mb-1 text-sm font-bold">Réponse *</p>
        <div className="overflow-hidden rounded-[10px] border-[1.5px] border-bordure-douce">
          <EditeurRiche simple libelle="Réponse" initial={initial.reponseJson ?? initial.reponseHtml} minHauteur="min-h-[140px]" onChange={({ html }) => f.maj("reponseHtml", html)} />
        </div>
        {f.e.reponse && <p className="mt-1 text-sm font-semibold text-erreur">{f.e.reponse}</p>}
      </div>
      <ChampAdmin id="faq-pos" libelle="Ordre d'affichage" type="number" min={0} className="w-40" value={String(f.d.position)} onChange={(x) => f.maj("position", x.target.value)} />
      <CaseAdmin libelle="Afficher aussi sur l'accueil (bloc « Vous vous demandez… »)" checked={f.d.accueil} onChange={(x) => f.maj("accueil", x.target.checked)} />
      <CaseAdmin libelle="Réponse encore à valider par le conseil" checked={f.d.aValider} onChange={(x) => f.maj("aValider", x.target.checked)} />
      <CaseAdmin libelle="Publiée sur le site" checked={f.d.publie} onChange={(x) => f.maj("publie", x.target.checked)} />
    </Cadre>
  );
}

export function FormulaireTerme({ id, initial, autresTermes, messageInitial, actionsSecondaires }: { id: string | null; initial: DonneesTerme; autresTermes: { slug: string; terme: string }[]; messageInitial?: string; actionsSecondaires?: ReactNode }) {
  const f = useFormulaire(initial, (x) => enregistrerTerme(id, x), messageInitial);
  const voir = f.d.voirAussi ?? [];
  return (
    <Cadre {...f} actionsSecondaires={actionsSecondaires}>
      <ChampAdmin id="gl-terme" libelle="Terme *" value={f.d.terme} onChange={(x) => f.maj("terme", x.target.value)} erreur={f.e.terme} />
      <ChoixAdmin id="gl-cat" libelle="Catégorie" value={f.d.categorie} onChange={(x) => f.maj("categorie", x.target.value as DonneesTerme["categorie"])}>
        {Object.entries(CATEGORIES_GLOSSAIRE).map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </ChoixAdmin>
      <ZoneAdmin id="gl-def" libelle="Définition *" aide="Simple et courte : deux ou trois phrases." rows={4} value={f.d.definition} onChange={(x) => f.maj("definition", x.target.value)} erreur={f.e.definition} />
      <fieldset>
        <legend className="mb-1 text-sm font-bold">Voir aussi</legend>
        <div className="flex max-h-48 flex-col gap-1.5 overflow-y-auto rounded-[10px] border-[1.5px] border-bordure-douce p-3">
          {autresTermes.map((t) => (
            <CaseAdmin
              key={t.slug}
              libelle={t.terme}
              checked={voir.includes(t.slug)}
              onChange={(x) => f.maj("voirAussi", x.target.checked ? [...voir, t.slug] : voir.filter((s) => s !== t.slug))}
            />
          ))}
        </div>
      </fieldset>
      <CaseAdmin libelle="Définition encore à valider par le conseil" checked={f.d.aValider} onChange={(x) => f.maj("aValider", x.target.checked)} />
      <CaseAdmin libelle="Publié sur le site" checked={f.d.publie} onChange={(x) => f.maj("publie", x.target.checked)} />
    </Cadre>
  );
}

export function FormulaireFiche({ id, initial, dossiers, messageInitial, actionsSecondaires }: { id: string | null; initial: DonneesFiche; dossiers: { id: string; titre: string }[]; messageInitial?: string; actionsSecondaires?: ReactNode }) {
  const f = useFormulaire(initial, (x) => enregistrerFiche(id, x), messageInitial);
  return (
    <Cadre {...f} actionsSecondaires={actionsSecondaires}>
      <ChoixAdmin id="fi-theme" libelle="Thème" value={f.d.theme} onChange={(x) => f.maj("theme", x.target.value as DonneesFiche["theme"])}>
        {Object.entries(THEMES_VEILLE).map(([v, t]) => (
          <option key={v} value={v}>
            {t.libelle}
          </option>
        ))}
      </ChoixAdmin>
      <ChampAdmin id="fi-titre" libelle="Titre *" value={f.d.titre} onChange={(x) => f.maj("titre", x.target.value)} erreur={f.e.titre} />
      <ZoneAdmin id="fi-resume" libelle="Résumé *" rows={3} value={f.d.resume} onChange={(x) => f.maj("resume", x.target.value)} erreur={f.e.resume} />
      <div className="grid gap-3 sm:grid-cols-2">
        <ChampAdmin id="fi-source" libelle="Source *" placeholder="Arrêté préfectoral du…" value={f.d.source} onChange={(x) => f.maj("source", x.target.value)} erreur={f.e.source} />
        <ChampAdmin id="fi-url" libelle="Lien vers la source" type="url" placeholder="https://" value={f.d.url} onChange={(x) => f.maj("url", x.target.value)} erreur={f.e.url} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <ChampAdmin id="fi-date" libelle="Date de l'information" type="date" value={f.d.date} onChange={(x) => f.maj("date", x.target.value)} erreur={f.e.date} />
        <ChoixAdmin id="fi-dossier" libelle="Dossier" value={f.d.dossierId} onChange={(x) => f.maj("dossierId", x.target.value)}>
          <option value="">— Aucun —</option>
          {dossiers.map((x) => (
            <option key={x.id} value={x.id}>
              {x.titre}
            </option>
          ))}
        </ChoixAdmin>
      </div>
      <CaseAdmin libelle="Publiée sur le site" checked={f.d.publie} onChange={(x) => f.maj("publie", x.target.checked)} />
    </Cadre>
  );
}

export function FormulaireDossier({ id, initial, articles, messageInitial }: { id: string | null; initial: DonneesDossier; articles: { id: string; titre: string }[]; messageInitial?: string }) {
  const f = useFormulaire(initial, (x) => enregistrerDossier(id, x), messageInitial);
  return (
    <Cadre {...f}>
      <div className="-mx-6 -mt-6 overflow-hidden rounded-t-[20px]">
        <ImageCouverture chemin={f.d.imagePath ?? null} dossier="veille" onChange={(c) => f.maj("imagePath", c)} />
      </div>
      {f.d.imagePath && <ChampAdmin id="do-alt" libelle="Texte alternatif de l'image *" value={f.d.imageAlt} onChange={(x) => f.maj("imageAlt", x.target.value)} erreur={f.e.imageAlt} />}
      <ChampAdmin id="do-titre" libelle="Titre *" value={f.d.titre} onChange={(x) => f.maj("titre", x.target.value)} erreur={f.e.titre} />
      <ZoneAdmin id="do-intro" libelle="Introduction *" rows={3} value={f.d.intro} onChange={(x) => f.maj("intro", x.target.value)} erreur={f.e.intro} />
      <ChoixAdmin id="do-article" libelle="Article « Lire le dossier »" aide="L'article complet, rédigé dans Articles." value={f.d.articleId} onChange={(x) => f.maj("articleId", x.target.value)}>
        <option value="">— Aucun —</option>
        {articles.map((a) => (
          <option key={a.id} value={a.id}>
            {a.titre || "Sans titre"}
          </option>
        ))}
      </ChoixAdmin>
      <CaseAdmin libelle="Dossier du moment (en tête de la page Veille)" checked={f.d.aLaUne} onChange={(x) => f.maj("aLaUne", x.target.checked)} />
      <CaseAdmin libelle="Publié sur le site" checked={f.d.publie} onChange={(x) => f.maj("publie", x.target.checked)} />
    </Cadre>
  );
}

export function FormulaireAction({ id, initial, commissions, messageInitial, actionsSecondaires }: { id: string | null; initial: DonneesAction; commissions: { id: string; nom: string }[]; messageInitial?: string; actionsSecondaires?: ReactNode }) {
  const f = useFormulaire(initial, (x) => enregistrerAction(id, x), messageInitial);
  return (
    <Cadre {...f} actionsSecondaires={actionsSecondaires}>
      <div className="-mx-6 -mt-6 overflow-hidden rounded-t-[20px]">
        <ImageCouverture chemin={f.d.imagePath ?? null} dossier="actions" onChange={(c) => f.maj("imagePath", c)} />
      </div>
      {f.d.imagePath && <ChampAdmin id="ac-alt" libelle="Texte alternatif de l'image *" value={f.d.imageAlt} onChange={(x) => f.maj("imageAlt", x.target.value)} erreur={f.e.imageAlt} />}
      <ChampAdmin id="ac-titre" libelle="Titre *" value={f.d.titre} onChange={(x) => f.maj("titre", x.target.value)} erreur={f.e.titre} />
      <div className="grid gap-3 sm:grid-cols-2">
        <ChampAdmin id="ac-periode" libelle="Période *" placeholder="Automne 2026" value={f.d.periode} onChange={(x) => f.maj("periode", x.target.value)} erreur={f.e.periode} />
        <ChoixAdmin id="ac-ton" libelle="Couleur de l'étiquette" value={f.d.ton} onChange={(x) => f.maj("ton", x.target.value as DonneesAction["ton"])}>
          <option value="abricot">Abricot</option>
          <option value="olive">Olive</option>
          <option value="indigo">Indigo</option>
          <option value="terre">Terre cuite</option>
        </ChoixAdmin>
      </div>
      <ZoneAdmin id="ac-resume" libelle="Résumé *" rows={2} value={f.d.resume} onChange={(x) => f.maj("resume", x.target.value)} erreur={f.e.resume} />
      <div className="grid gap-3 sm:grid-cols-2">
        <ChampAdmin id="ac-lien-l" libelle="Texte du lien (facultatif)" placeholder="Confiez-nous les vôtres" value={f.d.lienLibelle} onChange={(x) => f.maj("lienLibelle", x.target.value)} />
        <ChampAdmin id="ac-lien-h" libelle="Adresse du lien" placeholder="/actualites/…" value={f.d.lienHref} onChange={(x) => f.maj("lienHref", x.target.value)} erreur={f.e.lienHref} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <ChoixAdmin id="ac-com" libelle="Commission" value={f.d.commissionId} onChange={(x) => f.maj("commissionId", x.target.value)}>
          <option value="">— Aucune —</option>
          {commissions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nom}
            </option>
          ))}
        </ChoixAdmin>
        <ChampAdmin id="ac-pos" libelle="Ordre d'affichage" type="number" min={0} value={String(f.d.position)} onChange={(x) => f.maj("position", x.target.value)} />
      </div>
      <CaseAdmin libelle="Publiée sur le site" checked={f.d.publie} onChange={(x) => f.maj("publie", x.target.checked)} />
    </Cadre>
  );
}
