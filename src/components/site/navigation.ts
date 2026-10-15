export const NAV_PRINCIPALE = [
  { cle: "accueil", libelle: "Accueil", href: "/" },
  { cle: "association", libelle: "L'association", href: "/#association" },
  { cle: "veille", libelle: "Veille", href: "/veille" },
  { cle: "idees", libelle: "Idées", href: "/idees" },
] as const;

export const NAV_PLUS = [
  { libelle: "Statuts", href: "/statuts" },
  { libelle: "Glossaire", href: "/glossaire" },
  { libelle: "Questions fréquentes", href: "/faq" },
] as const;

export function cleActive(chemin: string): string | null {
  if (chemin === "/") return "accueil";
  if (chemin.startsWith("/veille")) return "veille";
  if (chemin.startsWith("/idees")) return "idees";
  if (NAV_PLUS.some((l) => chemin.startsWith(l.href))) return "plus";
  return null;
}
