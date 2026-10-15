"use client";

import { useActionState, useState, useTransition } from "react";

import { enregistrerBloc, enregistrerMembre, supprimerMembre, type CleBloc } from "@/app/admin/actions/parametres";
import { ETAT_INITIAL, type EtatForm } from "@/lib/admin/outils";

import { BoutonSupprimer } from "./BoutonSupprimer";
import { ChampAdmin, ZoneAdmin } from "./ChampsAdmin";
import { ImageCouverture } from "./ImageCouverture";
import { BoutonAdmin, RetourForm } from "./ui";

export type ChampBloc = { cle: string; libelle: string; type: "texte" | "zone" | "liste"; aide?: string };
type Valeurs = Record<string, unknown>;

/** Bloc de texte de l'accueil : champs simples, listes et (pour l'association) les 3 piliers. */
export function EditeurBloc({ cle, titre, champs, initial }: { cle: CleBloc; titre: string; champs: ChampBloc[]; initial: Valeurs }) {
  const [v, setV] = useState<Valeurs>(initial);
  const [etat, setEtat] = useState<EtatForm>(ETAT_INITIAL);
  const [enCours, demarrer] = useTransition();
  const maj = (k: string, x: unknown) => setV((o) => ({ ...o, [k]: x }));
  const piliers = (v.piliers as { numero: string; titre: string; texte: string; image: string; alt: string }[] | undefined) ?? null;

  return (
    <form
      method="post"
      id={`bloc-${cle}`}
      className="flex scroll-mt-6 flex-col gap-4 rounded-[20px] bg-white px-6 py-6"
      onSubmit={(e) => {
        e.preventDefault();
        demarrer(async () => setEtat(await enregistrerBloc(cle, v)));
      }}
      noValidate
    >
      <h2 className="font-titre text-xl font-semibold">{titre}</h2>
      {champs.map((c) => {
        const id = `${cle}-${c.cle}`;
        if (c.type === "liste") {
          const items = (v[c.cle] as string[]) ?? [];
          return (
            <fieldset key={c.cle} className="flex flex-col gap-2">
              <legend className="mb-1 text-sm font-bold">{c.libelle}</legend>
              {items.map((it, i) => (
                <div key={i} className="flex items-end gap-2">
                  <ZoneAdmin
                    id={`${id}-${i}`}
                    libelle={<span className="sr-only">{`${c.libelle} ${i + 1}`}</span>}
                    rows={2}
                    className="flex-1"
                    value={it}
                    onChange={(e) => maj(c.cle, items.map((x, j) => (j === i ? e.target.value : x)))}
                  />
                  {items.length > 1 && (
                    <BoutonAdmin variante="discret" onClick={() => maj(c.cle, items.filter((_, j) => j !== i))}>
                      Retirer
                    </BoutonAdmin>
                  )}
                </div>
              ))}
              {items.length < 6 && (
                <BoutonAdmin variante="secondaire" className="self-start" onClick={() => maj(c.cle, [...items, ""])}>
                  + Ajouter
                </BoutonAdmin>
              )}
            </fieldset>
          );
        }
        return c.type === "zone" ? (
          <ZoneAdmin key={c.cle} id={id} libelle={c.libelle} aide={c.aide} rows={3} value={String(v[c.cle] ?? "")} onChange={(e) => maj(c.cle, e.target.value)} erreur={etat.erreurs?.[c.cle]} />
        ) : (
          <ChampAdmin key={c.cle} id={id} libelle={c.libelle} aide={c.aide} value={String(v[c.cle] ?? "")} onChange={(e) => maj(c.cle, e.target.value)} erreur={etat.erreurs?.[c.cle]} />
        );
      })}

      {piliers && (
        <fieldset className="flex flex-col gap-4">
          <legend className="mb-1 text-sm font-bold">Les trois piliers</legend>
          <div className="grid gap-4 lg:grid-cols-3">
            {piliers.map((p, i) => {
              const majP = (k: string, x: unknown) => maj("piliers", piliers.map((q, j) => (j === i ? { ...q, [k]: x } : q)));
              return (
                <div key={i} className="flex flex-col gap-2 overflow-hidden rounded-[16px] border-[1.5px] border-bordure-douce pb-3">
                  <ImageCouverture chemin={p.image} dossier="accueil" onChange={(c) => majP("image", c ?? "")} />
                  <div className="flex flex-col gap-2 px-3">
                    <ChampAdmin id={`pil-${i}-alt`} libelle="Texte alternatif de l'image" value={p.alt} onChange={(e) => majP("alt", e.target.value)} />
                    <ChampAdmin id={`pil-${i}-num`} libelle="Numéro" value={p.numero} onChange={(e) => majP("numero", e.target.value)} />
                    <ChampAdmin id={`pil-${i}-titre`} libelle="Titre" value={p.titre} onChange={(e) => majP("titre", e.target.value)} />
                    <ZoneAdmin id={`pil-${i}-texte`} libelle="Texte" rows={3} value={p.texte} onChange={(e) => majP("texte", e.target.value)} />
                  </div>
                </div>
              );
            })}
          </div>
        </fieldset>
      )}

      <RetourForm statut={etat.statut} message={etat.statut === "erreur" ? "Vérifiez les champs : tous sont obligatoires sauf mention contraire." : etat.message} />
      <BoutonAdmin type="submit" className="self-start" disabled={enCours}>
        {enCours ? "Enregistrement…" : "Enregistrer ce bloc"}
      </BoutonAdmin>
    </form>
  );
}

/** Membre du conseil collégial (modifiable sur place) ; id null = ajout. */
export function LigneMembre({ id, prenom = "", nom = "", role = "", position = 0 }: { id: string | null; prenom?: string; nom?: string; role?: string | null; position?: number }) {
  const [etat, action, enCours] = useActionState<EtatForm, FormData>(enregistrerMembre.bind(null, id), ETAT_INITIAL);
  const p = id ?? "nouveau";
  const champ = "h-11 w-full rounded-[10px] border-[1.5px] border-bordure-douce px-2.5";
  return (
    <form action={action} className="flex flex-wrap items-end gap-2 border-t border-[#F0E6D8] py-3 first:border-t-0">
      <div className="min-w-[140px] flex-1">
        <label htmlFor={`m-p-${p}`} className="mb-1 block text-sm font-bold">
          Prénom
        </label>
        <input id={`m-p-${p}`} name="prenom" defaultValue={prenom} required className={champ} />
      </div>
      <div className="min-w-[140px] flex-1">
        <label htmlFor={`m-n-${p}`} className="mb-1 block text-sm font-bold">
          Nom
        </label>
        <input id={`m-n-${p}`} name="nom" defaultValue={nom} required className={champ} />
      </div>
      <div className="min-w-[160px] flex-1">
        <label htmlFor={`m-r-${p}`} className="mb-1 block text-sm font-bold">
          Rôle (facultatif)
        </label>
        <input id={`m-r-${p}`} name="role" defaultValue={role ?? ""} placeholder="Coordinatrice" className={champ} />
      </div>
      <div className="w-20">
        <label htmlFor={`m-o-${p}`} className="mb-1 block text-sm font-bold">
          Ordre
        </label>
        <input id={`m-o-${p}`} name="position" type="number" min={0} defaultValue={position} className={champ} />
      </div>
      <BoutonAdmin type="submit" variante={id ? "secondaire" : "principal"} disabled={enCours}>
        {id ? "Enregistrer" : "Ajouter"}
      </BoutonAdmin>
      {id && <BoutonSupprimer action={supprimerMembre.bind(null, id)} quoi="ce membre du conseil" libelle="Retirer" />}
      {etat.message && (
        <p role={etat.statut === "erreur" ? "alert" : "status"} className={`w-full text-sm font-semibold ${etat.statut === "erreur" ? "text-erreur" : "text-olive"}`}>
          {etat.message}
        </p>
      )}
    </form>
  );
}
