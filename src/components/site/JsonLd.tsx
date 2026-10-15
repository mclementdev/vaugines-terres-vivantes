import type { Reglages } from "@/lib/data/site";

/** Données structurées schema.org (Organization) de l'association. */
export function JsonLdOrganisation({ reglages }: { reglages: Reglages }) {
  const url = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const data = {
    "@context": "https://schema.org",
    "@type": "NGO",
    name: reglages.nom,
    url,
    logo: `${url}/icon.svg`,
    email: reglages.email,
    foundingDate: reglages.date_creation,
    nonprofitStatus: "Nonprofit",
    address: {
      "@type": "PostalAddress",
      streetAddress: `${reglages.adresse.lieu}, ${reglages.adresse.rue}`,
      postalCode: reglages.adresse.code_postal,
      addressLocality: reglages.adresse.commune,
      addressCountry: "FR",
    },
    sameAs: [reglages.reseaux.facebook, reglages.reseaux.instagram].filter(Boolean),
  };
  return (
    <script
      type="application/ld+json"
      // JSON.stringify n'échappe pas « < » : on le neutralise pour éviter une sortie du bloc script.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
