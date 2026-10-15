"use client";

import { useActionState } from "react";

import { enregistrerCommission, supprimerCommission } from "@/app/admin/actions/contenus";
import { ETAT_INITIAL, type EtatForm } from "@/lib/admin/outils";

import { BoutonSupprimer } from "./BoutonSupprimer";
import { BoutonAdmin } from "./ui";

/** Une commission, modifiable sur place (ou formulaire d'ajout si id null). */
export function LigneCommission({ id, nom = "", description = "", position = 0 }: { id: string | null; nom?: string; description?: string | null; position?: number }) {
  const [etat, action, enCours] = useActionState<EtatForm, FormData>(enregistrerCommission.bind(null, id), ETAT_INITIAL);
  const p = id ?? "nouvelle";
  return (
    <form action={action} className="flex flex-wrap items-end gap-2 border-t border-[#F0E6D8] py-3 first:border-t-0">
      <div className="min-w-[180px] flex-1">
        <label htmlFor={`co-n-${p}`} className="mb-1 block text-sm font-bold">
          Nom
        </label>
        <input id={`co-n-${p}`} name="nom" defaultValue={nom} required className="h-11 w-full rounded-[10px] border-[1.5px] border-bordure-douce px-2.5" />
      </div>
      <div className="min-w-[220px] flex-[2]">
        <label htmlFor={`co-d-${p}`} className="mb-1 block text-sm font-bold">
          Description (facultatif)
        </label>
        <input id={`co-d-${p}`} name="description" defaultValue={description ?? ""} className="h-11 w-full rounded-[10px] border-[1.5px] border-bordure-douce px-2.5" />
      </div>
      <div className="w-20">
        <label htmlFor={`co-p-${p}`} className="mb-1 block text-sm font-bold">
          Ordre
        </label>
        <input id={`co-p-${p}`} name="position" type="number" min={0} defaultValue={position} className="h-11 w-full rounded-[10px] border-[1.5px] border-bordure-douce px-2.5" />
      </div>
      <BoutonAdmin type="submit" variante={id ? "secondaire" : "principal"} disabled={enCours}>
        {id ? "Enregistrer" : "Ajouter"}
      </BoutonAdmin>
      {id && <BoutonSupprimer action={supprimerCommission.bind(null, id)} quoi="cette commission" libelle="Supprimer" />}
      {etat.message && (
        <p role={etat.statut === "erreur" ? "alert" : "status"} className={`w-full text-sm font-semibold ${etat.statut === "erreur" ? "text-erreur" : "text-olive"}`}>
          {etat.message}
        </p>
      )}
    </form>
  );
}
