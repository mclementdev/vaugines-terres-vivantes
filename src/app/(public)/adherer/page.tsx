import type { Metadata } from "next";

import { ParcoursAdhesion } from "@/components/adhesion/ParcoursAdhesion";
import { getReglages } from "@/lib/data/site";

export const metadata: Metadata = {
  title: "Adhérer",
  description:
    "Rejoignez l'association vaugines, terres vivantes en 3 étapes : cotisation libre, ou adhésion sans cotiser. Environ 2 minutes.",
  alternates: { canonical: "/adherer" },
};

export default async function Adherer() {
  const r = await getReglages();
  return <ParcoursAdhesion virement={r.virement} paiementEnLigne={r.paiement_en_ligne} />;
}
