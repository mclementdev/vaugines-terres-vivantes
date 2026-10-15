"use client";

import { useState } from "react";

import { cn } from "@/lib/cn";

const rond =
  "flex size-11 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-bordure-douce bg-transparent text-encre-2 no-underline hover:border-terre hover:text-terre-fonce";

/**
 * Partage : Facebook (lien simple, aucun script tiers chargé), e-mail, copie
 * du lien. Sur mobile, le partage natif du téléphone est proposé.
 */
export function Partage({ url, titre, className }: { url: string; titre: string; className?: string }) {
  const [copie, setCopie] = useState(false);

  const copier = async () => {
    try {
      if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ title: titre, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopie(true);
      setTimeout(() => setCopie(false), 2500);
    } catch {
      /* partage annulé par l'utilisateur */
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Partager sur Facebook (nouvelle fenêtre)"
        className={rond}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M15 3h-2.5A3.5 3.5 0 009 6.5V9H7v3h2v9h3v-9h2.5l.5-3h-3V6.8c0-.5.4-.8.8-.8H15z" />
        </svg>
      </a>
      <a href={`mailto:?subject=${encodeURIComponent(titre)}&body=${encodeURIComponent(url)}`} aria-label="Partager par e-mail" className={rond}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 7l9 6 9-6" />
        </svg>
      </a>
      <button type="button" onClick={copier} aria-label="Copier le lien" className={rond}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1" />
        </svg>
      </button>
      <span role="status" className={cn("text-sm font-semibold text-olive", !copie && "sr-only")}>
        {copie ? "Lien copié !" : ""}
      </span>
    </div>
  );
}
