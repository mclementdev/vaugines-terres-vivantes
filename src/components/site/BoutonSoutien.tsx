import Link from "next/link";

import { cn } from "@/lib/cn";

/**
 * Pavé « soutenir » d'une idée (planche DA). Au lot 1, il mène à la fiche de
 * l'idée ; le soutien en un clic (anti-abus) est branché au lot 5.
 */
export function BoutonSoutien({
  slug,
  soutiens,
  titre,
  petit = false,
}: {
  slug: string;
  soutiens: number;
  titre: string;
  petit?: boolean;
}) {
  return (
    <Link
      href={`/idees/${slug}`}
      aria-label={`Soutenir l'idée « ${titre} », ${soutiens} soutien${soutiens > 1 ? "s" : ""}`}
      className={cn(
        "flex shrink-0 flex-col items-center justify-center rounded-[14px] border-[1.5px] border-bordure-douce bg-sable leading-[1.05] text-terre-fonce no-underline hover:border-terre hover:text-terre-fonce",
        petit ? "h-[52px] w-[50px] rounded-xl" : "h-[58px] w-[58px]",
      )}
    >
      <svg width="14" height="10" viewBox="0 0 14 10" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M1 9l6-7 6 7" />
      </svg>
      <strong className={petit ? "text-base" : "text-[17px]"}>{soutiens}</strong>
    </Link>
  );
}
