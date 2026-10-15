"use client";

import { useState } from "react";

export type Virement = { titulaire: string; iban: string; bic: string };

/** Titulaire, IBAN (bouton Copier) et libellé du virement. */
export function CoordonneesBancaires({ virement, libelle }: { virement: Virement; libelle: string }) {
  const [copie, setCopie] = useState(false);
  const copier = async () => {
    try {
      await navigator.clipboard.writeText(virement.iban.replace(/\s+/g, ""));
      setCopie(true);
      setTimeout(() => setCopie(false), 2500);
    } catch {
      /* presse-papiers refusé : l'IBAN reste sélectionnable */
    }
  };
  return (
    <span className="mt-2.5 block rounded-[14px] bg-sable px-4 py-3.5 text-[15px]">
      <span className="block text-encre-3">Titulaire</span>
      <strong className="mb-2 block">{virement.titulaire}</strong>
      <span className="block text-encre-3">IBAN</span>
      <span className="mb-2 flex flex-wrap items-center gap-2.5">
        <strong className="select-all font-mono text-base tracking-[.02em]">{virement.iban}</strong>
        <button
          type="button"
          onClick={copier}
          className="h-9 cursor-pointer rounded-full border-[1.5px] border-terre bg-white px-3 text-sm font-bold text-terre-fonce hover:bg-tag-terre"
        >
          {copie ? "Copié !" : "Copier"}
          <span className="sr-only"> l&apos;IBAN</span>
        </button>
        <span role="status" className="sr-only">
          {copie ? "IBAN copié dans le presse-papiers" : ""}
        </span>
      </span>
      {virement.bic && (
        <>
          <span className="block text-encre-3">BIC</span>
          <strong className="mb-2 block font-mono">{virement.bic}</strong>
        </>
      )}
      <span className="block text-encre-3">Libellé à indiquer</span>
      <strong className="select-all font-mono [overflow-wrap:anywhere]">{libelle}</strong>
    </span>
  );
}
