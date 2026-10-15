export type LienAdmin = { cle: string; libelle: string; href: string; badge?: string; superadmin?: boolean };
export type GroupeAdmin = { titre: string; liens: LienAdmin[]; superadmin?: boolean };

export function groupesAdmin(badges: { moderation: number; signalements: number }): GroupeAdmin[] {
  return [
    { titre: "Pilotage", liens: [{ cle: "dashboard", libelle: "Tableau de bord", href: "/admin" }] },
    {
      titre: "Contenus",
      liens: [
        { cle: "articles", libelle: "Articles", href: "/admin/articles" },
        { cle: "evenements", libelle: "Événements", href: "/admin/evenements" },
        { cle: "actions", libelle: "Actions & commissions", href: "/admin/actions" },
        { cle: "veille", libelle: "Veille", href: "/admin/veille", badge: badges.signalements ? String(badges.signalements) : undefined },
        { cle: "glossaire", libelle: "Glossaire", href: "/admin/glossaire" },
        { cle: "faq", libelle: "FAQ", href: "/admin/faq" },
        { cle: "accueil", libelle: "Textes de l'accueil", href: "/admin/accueil" },
      ],
    },
    {
      titre: "Communauté",
      liens: [
        { cle: "adherents", libelle: "Adhérents", href: "/admin/adherents" },
        { cle: "newsletter", libelle: "Newsletter IA", href: "/admin/newsletter" },
        { cle: "moderation", libelle: "Modération", href: "/admin/moderation", badge: badges.moderation ? String(badges.moderation) : undefined },
      ],
    },
    { titre: "Superadmin", superadmin: true, liens: [{ cle: "comptes", libelle: "Comptes & paramètres", href: "/admin/comptes" }] },
  ];
}

export function estActif(href: string, chemin: string) {
  return href === "/admin" ? chemin === "/admin" : chemin === href || chemin.startsWith(`${href}/`);
}
