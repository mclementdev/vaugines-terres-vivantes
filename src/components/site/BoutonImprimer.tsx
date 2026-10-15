"use client";

import { Bouton } from "@/components/ui/Bouton";

export function BoutonImprimer() {
  return (
    <Bouton variante="secondaire" onClick={() => window.print()}>
      Imprimer
    </Bouton>
  );
}
