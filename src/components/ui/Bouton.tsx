import Link from "next/link";
import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

type Variante = "principal" | "secondaire" | "blanc" | "sombre" | "lien" | "lien-clair";
type Taille = "md" | "lg" | "xl";

const VARIANTES: Record<Variante, string> = {
  principal: "bg-terre text-white hover:bg-terre-fonce hover:text-white",
  secondaire: "border-2 border-terre text-terre-fonce bg-transparent hover:bg-tag-terre hover:text-terre-fonce",
  blanc: "bg-white text-brun hover:bg-sable hover:text-brun",
  sombre: "bg-brun text-white hover:bg-nuit hover:text-white",
  lien: "text-terre-fonce underline-offset-4 hover:underline px-1",
  "lien-clair": "text-abricot-clair underline-offset-4 hover:underline hover:text-white px-1",
};

const TAILLES: Record<Taille, string> = {
  md: "min-h-12 px-[22px] text-[17px]",
  lg: "min-h-[52px] px-[28px] text-[18px]",
  xl: "min-h-14 px-[34px] text-[19px]",
};

export function classesBouton(variante: Variante = "principal", taille: Taille = "md") {
  const estLien = variante === "lien" || variante === "lien-clair";
  return cn(
    "inline-flex items-center justify-center gap-2 font-bold no-underline",
    !estLien && "rounded-full bouton-anime",
    estLien ? "min-h-12" : TAILLES[taille],
    VARIANTES[variante],
  );
}

type LienBoutonProps = ComponentProps<typeof Link> & { variante?: Variante; taille?: Taille };

/** Lien stylé en bouton (forme pilule, hauteur mini 48 px). */
export function LienBouton({ variante, taille, className, ...props }: LienBoutonProps) {
  return <Link {...props} className={cn(classesBouton(variante, taille), className)} />;
}

type BoutonProps = ComponentProps<"button"> & { variante?: Variante; taille?: Taille };

export function Bouton({ variante, taille, className, type = "button", ...props }: BoutonProps) {
  return (
    <button
      type={type}
      {...props}
      className={cn(classesBouton(variante, taille), "cursor-pointer disabled:cursor-not-allowed disabled:opacity-60", className)}
    />
  );
}
