import type { Metadata } from "next";

import { Cypres } from "@/components/site/Cypres";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { LienBouton } from "@/components/ui/Bouton";

export const metadata: Metadata = {
  title: "Page introuvable",
  robots: { index: false },
};

export default function PageIntrouvable() {
  return (
    <>
      <Header />
      <main id="contenu" className="flex-1">
        <section className="conteneur flex flex-col items-center py-20 text-center md:py-28">
          <Cypres largeur={34} hauteur={170} couleur="var(--color-terre)" epaisseur={1.6} />
          <p className="surtitre mt-8">Erreur 404</p>
          <h1 className="max-w-[640px] font-titre text-[clamp(34px,5vw,56px)] font-semibold leading-[1.05] tracking-[-0.02em]">
            Ce chemin ne mène nulle part… pour l&apos;instant.
          </h1>
          <p className="mt-5 max-w-[520px] text-encre-2">
            La page que vous cherchez a peut-être changé d&apos;adresse. Revenez à l&apos;accueil ou consultez les
            prochains rendez-vous.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <LienBouton href="/">Retour à l&apos;accueil</LienBouton>
            <LienBouton href="/#evenements" variante="secondaire">
              Les prochains rendez-vous
            </LienBouton>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
