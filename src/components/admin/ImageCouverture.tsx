"use client";

import { useId, useState } from "react";

import { televerserImage } from "@/lib/admin/televersement";
import { urlImage } from "@/lib/images";

/** Image de couverture : téléversement direct vers Storage, aperçu, retrait. */
export function ImageCouverture({
  chemin,
  dossier,
  onChange,
}: {
  chemin: string | null;
  dossier: string;
  onChange: (c: string | null) => void;
}) {
  const id = useId();
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState("");

  const choisir = async (f: File | undefined) => {
    if (!f) return;
    setErreur("");
    setEnCours(true);
    try {
      onChange((await televerserImage(f, dossier)).chemin);
    } catch (e) {
      setErreur((e as Error).message);
    } finally {
      setEnCours(false);
    }
  };

  return (
    <div>
      <label
        htmlFor={id}
        className="relative flex h-[200px] cursor-pointer flex-col items-center justify-center gap-1.5 bg-pierre bg-cover bg-center text-center font-bold text-white focus-within:outline-3 focus-within:outline-indigo"
        style={chemin ? { backgroundImage: `linear-gradient(rgba(58,36,24,.45), rgba(58,36,24,.45)), url("${urlImage(chemin)}")` } : undefined}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={chemin ? "#FFF" : "#6B5646"} strokeWidth="1.8" aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="9" cy="10" r="2" />
          <path d="M21 16l-5-5-8 8" />
        </svg>
        <span className={chemin ? "" : "text-encre-2"}>
          {enCours ? "Envoi en cours…" : chemin ? "Changer l'image de couverture" : "Ajouter une image de couverture"}
        </span>
        <span className={chemin ? "text-sm font-normal" : "text-sm font-normal text-encre-3"}>JPG, PNG, WebP · 10 Mo max</span>
        <input
          id={id}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="sr-only"
          disabled={enCours}
          onChange={(e) => choisir(e.target.files?.[0])}
        />
      </label>
      {(erreur || chemin) && (
        <div className="flex items-center justify-between gap-3 px-7 pt-2 text-sm">
          {erreur ? (
            <p role="alert" className="font-semibold text-erreur">
              {erreur}
            </p>
          ) : (
            <span />
          )}
          {chemin && (
            <button type="button" onClick={() => onChange(null)} className="cursor-pointer font-bold text-terre-fonce underline">
              Retirer l&apos;image
            </button>
          )}
        </div>
      )}
    </div>
  );
}
