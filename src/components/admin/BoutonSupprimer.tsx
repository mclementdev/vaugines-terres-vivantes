"use client";

import { useState, useTransition } from "react";

import { BoiteDialogue } from "./BoiteDialogue";
import { BoutonAdmin } from "./ui";

/** Suppression avec confirmation (action serveur liée). */
export function BoutonSupprimer({ action, quoi, libelle = "Supprimer" }: { action: () => Promise<void>; quoi: string; libelle?: string }) {
  const [ouvert, setOuvert] = useState(false);
  const [enCours, demarrer] = useTransition();
  return (
    <>
      <BoutonAdmin variante="danger" onClick={() => setOuvert(true)}>
        {libelle}
      </BoutonAdmin>
      {ouvert && (
        <BoiteDialogue
          titre={`Supprimer ${quoi} ?`}
          fermer={() => setOuvert(false)}
          onValider={() => demarrer(() => action())}
          libelleValider={enCours ? "Suppression…" : "Supprimer définitivement"}
          enCours={enCours}
          danger
        >
          <p>Cette action est définitive.</p>
        </BoiteDialogue>
      )}
    </>
  );
}
