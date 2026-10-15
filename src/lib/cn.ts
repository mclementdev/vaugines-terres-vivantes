import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Fait connaître à tailwind-merge les couleurs de la DA (text-terre-fonce…).
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      color: [
        "terre", "terre-fonce", "terre-sombre", "abricot", "abricot-clair", "sable", "sable-chaud",
        "pierre", "brun", "brun-clair", "nuit", "olive", "olive-clair", "indigo", "indigo-clair", "ocre",
        "encre", "encre-2", "encre-3", "bordure", "bordure-champ", "bordure-douce", "erreur",
        "creme", "creme-2", "creme-3",
        "tag-terre", "tag-terre-fg", "tag-olive", "tag-olive-fg", "tag-indigo", "tag-indigo-fg",
        "tag-ambre", "tag-ambre-fg", "tag-neutre", "tag-neutre-fg",
      ],
    },
  },
});

export function cn(...classes: ClassValue[]) {
  return twMerge(clsx(classes));
}
