import type { MetadataRoute } from "next";

const urlSite = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  // Déploiements de prévisualisation Vercel : rien n'est indexé.
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/adherer/merci", "/evenements/inscription/", "/idees/modifier/", "/idees/suivi/", "/lettre/"],
    },
    sitemap: `${urlSite}/sitemap.xml`,
  };
}
