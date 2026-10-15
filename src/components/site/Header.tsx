"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { classesBouton } from "@/components/ui/Bouton";
import { cn } from "@/lib/cn";

import { Logo } from "./Logo";
import { cleActive, NAV_PLUS, NAV_PRINCIPALE } from "./navigation";

const lienNav =
  "rounded-full px-3.5 py-2.5 font-semibold text-encre no-underline hover:bg-tag-terre hover:text-terre-fonce";
const lienNavActif = "bg-tag-terre text-terre-fonce";

export function Header() {
  const chemin = usePathname();
  const actif = cleActive(chemin);

  return (
    <header className="print:hidden sticky top-0 z-30 border-b border-bordure bg-sable/95 backdrop-blur-sm">
      <div className="conteneur flex items-center justify-between gap-3 py-2.5 lg:py-3.5">
        <Logo className="lg:hidden" compact />
        <Logo className="hidden lg:flex" />

        <nav aria-label="Navigation principale" className="hidden items-center gap-1.5 lg:flex">
          {NAV_PRINCIPALE.map((l) => (
            <Link
              key={l.cle}
              href={l.href}
              aria-current={actif === l.cle ? "page" : undefined}
              className={cn(lienNav, actif === l.cle && lienNavActif)}
            >
              {l.libelle}
            </Link>
          ))}
          <MenuPlus actif={actif === "plus"} chemin={chemin} />
          <Link href="/adherer" className={cn(classesBouton("principal"), "ml-2 px-[22px]")}>
            Adhérer
          </Link>
        </nav>

        <div className="flex items-center gap-2.5 lg:hidden">
          <Link href="/adherer" className={cn(classesBouton("principal"), "min-h-11 px-4 text-[15px]")}>
            Adhérer
          </Link>
          <TiroirMobile actif={actif} />
        </div>
      </div>
    </header>
  );
}

/** Menu « Plus » : simple divulgation (pas de rôle menu ARIA pour des liens). */
function MenuPlus({ actif, chemin }: { actif: boolean; chemin: string }) {
  const [ouvert, setOuvert] = useState(false);
  const conteneur = useRef<HTMLDivElement>(null);
  const bouton = useRef<HTMLButtonElement>(null);

  // Referme au clic extérieur et sur Échap (et au clic sur un lien, plus bas).
  useEffect(() => {
    if (!ouvert) return;
    const surClic = (e: MouseEvent) => {
      if (!conteneur.current?.contains(e.target as Node)) setOuvert(false);
    };
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOuvert(false);
        bouton.current?.focus();
      }
    };
    document.addEventListener("mousedown", surClic);
    document.addEventListener("keydown", surTouche);
    return () => {
      document.removeEventListener("mousedown", surClic);
      document.removeEventListener("keydown", surTouche);
    };
  }, [ouvert]);

  return (
    <div
      ref={conteneur}
      className="relative"
      onBlur={(e) => {
        if (!conteneur.current?.contains(e.relatedTarget as Node)) setOuvert(false);
      }}
    >
      <button
        ref={bouton}
        type="button"
        aria-expanded={ouvert}
        aria-controls="menu-plus"
        onClick={() => setOuvert((o) => !o)}
        className={cn(lienNav, "inline-flex cursor-pointer items-center gap-1.5", actif && lienNavActif)}
      >
        Plus
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
          className={cn("transition-transform", ouvert && "rotate-180")}
        >
          <path d="M2 4l4 4 4-4" />
        </svg>
      </button>
      <ul
        id="menu-plus"
        hidden={!ouvert}
        className="absolute right-0 top-12 z-20 w-[230px] rounded-2xl border border-bordure bg-white p-2 shadow-[0_16px_36px_rgba(58,36,24,0.16)]"
      >
        {NAV_PLUS.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              onClick={() => setOuvert(false)}
              aria-current={chemin.startsWith(l.href) ? "page" : undefined}
              className="block rounded-[10px] px-3.5 py-3 text-encre no-underline hover:bg-sable hover:text-terre-fonce aria-[current=page]:font-bold aria-[current=page]:text-terre-fonce"
            >
              {l.libelle}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Tiroir plein écran sur mobile (Radix Dialog : piège du focus, Échap). */
function TiroirMobile({ actif }: { actif: string | null }) {
  const [ouvert, setOuvert] = useState(false);
  const fermer = () => setOuvert(false);

  const liens = [
    ...NAV_PRINCIPALE.map((l) => ({ ...l, courant: actif === l.cle })),
    ...NAV_PLUS.map((l) => ({ cle: l.href, libelle: l.libelle, href: l.href, courant: false })),
  ];

  return (
    <Dialog.Root open={ouvert} onOpenChange={setOuvert}>
      <Dialog.Trigger
        aria-label="Ouvrir le menu"
        className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-bordure-douce bg-white text-encre"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M3 6h14M3 10h14M3 14h14" />
        </svg>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-nuit/40" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col overflow-y-auto bg-sable px-5 pb-8 pt-3 shadow-2xl">
          <div className="flex items-center justify-between">
            <Dialog.Title className="font-titre text-xl font-semibold">Menu</Dialog.Title>
            <Dialog.Close
              aria-label="Fermer le menu"
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-bordure-douce bg-white text-encre"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M4 4l10 10M14 4L4 14" />
              </svg>
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">Navigation du site</Dialog.Description>
          <nav aria-label="Navigation principale" className="mt-6">
            <ul className="flex flex-col gap-1">
              {liens.map((l) => (
                <li key={l.cle}>
                  <Link
                    href={l.href}
                    onClick={fermer}
                    aria-current={l.courant ? "page" : undefined}
                    className="block rounded-2xl px-4 py-3.5 text-[19px] font-semibold text-encre no-underline hover:bg-tag-terre aria-[current=page]:bg-tag-terre aria-[current=page]:text-terre-fonce"
                  >
                    {l.libelle}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <Link href="/adherer" onClick={fermer} className={cn(classesBouton("principal", "lg"), "mt-6 w-full")}>
            Adhérer à l&apos;association
          </Link>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
