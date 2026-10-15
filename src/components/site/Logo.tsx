import Link from "next/link";

import { cn } from "@/lib/cn";

import { Cypres } from "./Cypres";

/** Le nom s'écrit toujours en minuscules avec une virgule. */
export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <Link
      href="/"
      className={cn("flex items-center gap-2.5 text-encre no-underline hover:text-encre", className)}
    >
      <Cypres
        largeur={compact ? 22 : 26}
        hauteur={compact ? 38 : 44}
        couleur="var(--color-terre)"
        epaisseur={5}
      />
      <span
        className={cn(
          "font-titre font-medium leading-[1.1] tracking-[-0.01em]",
          compact ? "text-[17px]" : "text-[22px]",
        )}
      >
        vaugines,
        <br />
        <span className="font-semibold text-terre">terres vivantes</span>
      </span>
      <span className="sr-only"> — accueil</span>
    </Link>
  );
}
