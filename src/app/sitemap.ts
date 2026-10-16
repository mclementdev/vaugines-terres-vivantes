import type { MetadataRoute } from "next";

import { getSlugsIdees } from "@/lib/data/idees";
import { getSlugsArticles, getSlugsEvenements } from "@/lib/data/pages";

const urlSite = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Pages publiques indexables ; les pages à jeton (inscriptions, suivi, lettre) en sont exclues. */
const PAGES_FIXES = [
  "",
  "/adherer",
  "/actions",
  "/actualites",
  "/evenements",
  "/idees",
  "/idees/nouvelle",
  "/idees/charte",
  "/veille",
  "/statuts",
  "/faq",
  "/glossaire",
  "/donnees-personnelles",
  "/mentions-legales",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, evenements, idees] = await Promise.all([getSlugsArticles(), getSlugsEvenements(), getSlugsIdees()]);
  return [
    ...PAGES_FIXES.map((p) => ({ url: `${urlSite}${p}` })),
    ...articles.map((s) => ({ url: `${urlSite}/actualites/${s}` })),
    ...evenements.map((s) => ({ url: `${urlSite}/evenements/${s}` })),
    ...idees.map((s) => ({ url: `${urlSite}/idees/${s}` })),
  ];
}
