"use client";

import Link from "next/link";
import { useCallback, useMemo, useState, useTransition } from "react";

import { enregistrerArticle, mettreArticleCorbeille, type DonneesArticle } from "@/app/admin/actions/articles";
import type { EtatForm } from "@/lib/admin/outils";
import { slugifier } from "@/lib/admin/outils";
import type { ModePublication } from "@/lib/admin/publication";

import { BoiteDialogue } from "./BoiteDialogue";
import { CaseAdmin, ChampAdmin, ChoixAdmin } from "./ChampsAdmin";
import { EditeurRiche, type EvenementLiable } from "./editeur/EditeurRiche";
import { ImageCouverture } from "./ImageCouverture";
import { PanneauPublication } from "./PanneauPublication";
import { BoutonAdmin, PastilleStatut, RetourForm, classesBoutonAdmin } from "./ui";
import { useEnregistrementAuto, useIlYa } from "./useEnregistrementAuto";

export type ArticleEdition = {
  id: string;
  titre: string;
  chapeau: string;
  body_json: unknown;
  body_html: string;
  cover_path: string | null;
  cover_alt: string | null;
  cover_caption: string | null;
  category_id: string | null;
  tags: string[];
  slug: string;
  featured: boolean;
  newsletter_candidate: boolean;
  status: string;
  published_at: string | null;
};

type Props = {
  article: ArticleEdition;
  categories: { id: string; nom: string }[];
  evenements: EvenementLiable[];
  modeInitial: ModePublication;
  dateInitiale: string;
};

/** Éditeur d'article (maquette Admin-editeur). */
export function FormulaireArticle({ article, categories, evenements, modeInitial, dateInitiale }: Props) {
  const [d, setD] = useState<DonneesArticle>({
    titre: article.titre,
    chapeau: article.chapeau,
    corpsJson: article.body_json ?? article.body_html,
    corpsHtml: article.body_html,
    coverPath: article.cover_path,
    coverAlt: article.cover_alt ?? "",
    coverCaption: article.cover_caption ?? "",
    categoryId: article.category_id,
    tags: article.tags.join(", "),
    slug: article.slug.startsWith("brouillon-") ? "" : article.slug,
    featured: article.featured,
    newsletter: article.newsletter_candidate,
    publication: { mode: modeInitial, date: dateInitiale },
  });
  const [etat, setEtat] = useState<EtatForm>({ statut: "inactif" });
  const [statut, setStatut] = useState({ status: article.status, published_at: article.published_at });
  const [enCours, demarrer] = useTransition();
  const [corbeille, setCorbeille] = useState(false);
  const deja = article.status === "published";

  const maj = <K extends keyof DonneesArticle>(k: K, v: DonneesArticle[K]) => setD((x) => ({ ...x, [k]: v }));

  // Enregistrement automatique des brouillons seulement : un article en ligne
  // (ou programmé) ne change que sur « Mettre à jour ».
  const sauver = useCallback(async (x: DonneesArticle) => (await enregistrerArticle(article.id, x, true)).statut === "ok", [article.id]);
  const auto = useEnregistrementAuto(d, sauver, { actif: statut.status !== "published" });
  const ilYa = useIlYa(auto.derniere);

  const valider = () =>
    demarrer(async () => {
      const r = await enregistrerArticle(article.id, d, false);
      setEtat(r);
      if (r.statut === "ok") {
        auto.marquerEnregistre();
        const m = d.publication.mode;
        setStatut({
          status: m === "brouillon" ? "draft" : "published",
          published_at: m === "brouillon" ? null : m === "maintenant" ? (statut.published_at ?? new Date().toISOString()) : new Date(d.publication.date ?? "").toISOString(),
        });
        if (!d.slug) maj("slug", slugifier(d.titre));
      }
    });

  const libellePrincipal = useMemo(() => {
    if (d.publication.mode === "brouillon") return "Enregistrer le brouillon";
    if (d.publication.mode === "programmer") return "Programmer";
    return deja ? "Mettre à jour" : "Publier";
  }, [d.publication.mode, deja]);

  const adresse = `/actualites/${d.slug || slugifier(d.titre) || "…"}`;

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/admin/articles" className="font-bold">
            ← Articles
          </Link>
          <PastilleStatut status={statut.status} publishedAt={statut.published_at} />
          <span className="text-sm text-encre-3" aria-live="polite">
            {auto.enCours ? "Enregistrement…" : auto.modifie ? "Modifications non enregistrées" : ilYa ? `Enregistré automatiquement ${ilYa}` : ""}
          </span>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link href={`/admin/articles/${article.id}/apercu`} target="_blank" className={classesBoutonAdmin("secondaire")}>
            Aperçu<span className="sr-only"> (nouvel onglet)</span>
          </Link>
          <BoutonAdmin onClick={valider} disabled={enCours}>
            {enCours ? "Enregistrement…" : libellePrincipal}
          </BoutonAdmin>
        </div>
      </div>

      <div className="mb-4">
        <RetourForm statut={etat.statut} message={etat.message} />
      </div>

      <div className="flex flex-wrap items-start gap-5">
        <div className="min-w-0 flex-[999_1_520px] overflow-hidden rounded-[20px] bg-white">
          <ImageCouverture chemin={d.coverPath} dossier="articles" onChange={(c) => maj("coverPath", c)} />
          <div className="px-7 pb-2 pt-6">
            <label htmlFor="ed-titre" className="sr-only">
              Titre
            </label>
            <input
              id="ed-titre"
              value={d.titre}
              onChange={(e) => maj("titre", e.target.value)}
              placeholder="Titre de l'article"
              aria-invalid={etat.erreurs?.titre ? true : undefined}
              aria-describedby={etat.erreurs?.titre ? "ed-titre-err" : undefined}
              className="w-full border-0 bg-transparent py-1 font-titre text-[28px] font-semibold leading-tight outline-none placeholder:text-encre-3/60 md:text-[34px]"
            />
            {etat.erreurs?.titre && (
              <p id="ed-titre-err" className="text-sm font-semibold text-erreur">
                {etat.erreurs.titre}
              </p>
            )}
            <label htmlFor="ed-chapo" className="sr-only">
              Chapeau
            </label>
            <textarea
              id="ed-chapo"
              rows={2}
              value={d.chapeau}
              onChange={(e) => maj("chapeau", e.target.value)}
              placeholder="Chapeau : deux ou trois phrases qui donnent envie de lire."
              className="w-full resize-none border-0 bg-transparent py-1 text-lg text-encre-2 outline-none placeholder:text-encre-3/60"
            />
          </div>
          <EditeurRiche
            libelle="Texte de l'article"
            initial={d.corpsJson}
            evenements={evenements}
            onChange={({ json, html }) => setD((x) => ({ ...x, corpsJson: json, corpsHtml: html }))}
          />
        </div>

        <aside className="flex min-w-0 flex-[1_1_280px] flex-col gap-3.5" aria-label="Réglages de l'article">
          <section className="flex flex-col gap-3 rounded-[18px] bg-white px-5 py-[18px]">
            <PanneauPublication
              mode={d.publication.mode}
              date={d.publication.date ?? ""}
              onChange={(p) => maj("publication", p)}
              erreur={etat.erreurs?.publication}
              libelleMaintenant={deja ? "Publié" : "Publier maintenant"}
            />
            <CaseAdmin libelle="Mettre en avant sur l'accueil" checked={d.featured} onChange={(e) => maj("featured", e.target.checked)} />
            <CaseAdmin libelle="Proposer pour la prochaine newsletter" checked={d.newsletter} onChange={(e) => maj("newsletter", e.target.checked)} />
          </section>

          <section className="flex flex-col gap-3 rounded-[18px] bg-white px-5 py-[18px]">
            <ChoixAdmin id="ed-cat" libelle="Catégorie" value={d.categoryId ?? ""} onChange={(e) => maj("categoryId", e.target.value || null)}>
              <option value="">— Sans catégorie —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom}
                </option>
              ))}
            </ChoixAdmin>
            <ChampAdmin id="ed-tags" libelle="Mots-clés" aide="Séparés par des virgules." value={d.tags} onChange={(e) => maj("tags", e.target.value)} />
            {d.coverPath && (
              <>
                <ChampAdmin
                  id="ed-alt"
                  libelle={
                    <>
                      Texte alternatif de l&apos;image <span className="text-terre-fonce">*</span>
                    </>
                  }
                  aide="Décrivez l'image pour les personnes qui ne la voient pas."
                  erreur={etat.erreurs?.coverAlt}
                  value={d.coverAlt}
                  onChange={(e) => maj("coverAlt", e.target.value)}
                />
                <ChampAdmin id="ed-legende" libelle="Légende (facultatif)" value={d.coverCaption} onChange={(e) => maj("coverCaption", e.target.value)} />
              </>
            )}
            <ChampAdmin
              id="ed-slug"
              libelle="Adresse"
              aide={deja ? "Attention : changer l'adresse casse les liens déjà partagés." : `${adresse}`}
              erreur={etat.erreurs?.slug}
              value={d.slug}
              placeholder={slugifier(d.titre)}
              onChange={(e) => maj("slug", slugifier(e.target.value))}
            />
          </section>

          <BoutonAdmin variante="danger" onClick={() => setCorbeille(true)}>
            Mettre à la corbeille
          </BoutonAdmin>
        </aside>
      </div>

      {corbeille && (
        <BoiteDialogue
          titre="Mettre cet article à la corbeille ?"
          fermer={() => setCorbeille(false)}
          onValider={() => demarrer(() => mettreArticleCorbeille(article.id))}
          libelleValider="Mettre à la corbeille"
          danger
        >
          <p>Il ne sera plus visible sur le site. Vous pourrez le restaurer depuis la corbeille.</p>
        </BoiteDialogue>
      )}
    </>
  );
}
