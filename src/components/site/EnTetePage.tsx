import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/** En-tête des pages intérieures : surtitre, titre, introduction, actions. */
export function EnTetePage({
  surtitre,
  titre,
  intro,
  actions,
  bandeau = false,
  className,
}: {
  surtitre: string;
  titre: string;
  intro?: ReactNode;
  actions?: ReactNode;
  /** Fond pierre pleine largeur (page Statuts). */
  bandeau?: boolean;
  className?: string;
}) {
  const contenu = (
    <div className={cn("conteneur flex flex-wrap items-end justify-between gap-6", bandeau ? "pb-12 pt-14" : "pb-8 pt-12 md:pt-14", className)}>
      <div className="flex-[1_1_520px]">
        <p className="surtitre mb-2">{surtitre}</p>
        <h1 className="mb-2.5 font-titre text-[clamp(36px,4.6vw,56px)] font-semibold leading-[1.05] tracking-[-0.02em] [text-wrap:balance]">
          {titre}
        </h1>
        {intro && <div className="max-w-[640px] text-encre-2">{intro}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2.5 print:hidden">{actions}</div>}
    </div>
  );
  return bandeau ? <section className="bg-pierre print:bg-transparent">{contenu}</section> : contenu;
}
