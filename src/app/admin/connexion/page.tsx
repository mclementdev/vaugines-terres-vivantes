import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { FormulaireConnexion } from "@/components/admin/FormulaireConnexion";
import { SessionInvitation } from "@/components/admin/SessionInvitation";
import { Cypres } from "@/components/site/Cypres";

export const metadata: Metadata = { title: "Connexion" };

const ALERTES: Record<string, string> = {
  lien: "Ce lien n'est plus valable (déjà utilisé ou expiré). Demandez-en un nouveau.",
};

export default function Connexion(props: PageProps<"/admin/connexion">) {
  return (
    <main id="contenu" className="flex min-h-dvh items-center justify-center bg-sable px-5 py-12">
      <div className="w-full max-w-[460px] rounded-[28px] bg-white p-7 md:p-10">
        <div className="mb-6 flex items-center gap-3">
          <Cypres largeur={22} hauteur={40} couleur="var(--color-terre)" epaisseur={6} />
          <p className="font-titre text-xl leading-tight">
            vaugines,
            <br />
            <span className="font-semibold text-terre">administration</span>
          </p>
        </div>
        <h1 className="mb-5 font-titre text-[30px] font-semibold leading-tight">Connexion</h1>
        <SessionInvitation />
        <Suspense fallback={<FormulaireConnexion />}>
          <AvecAlerte searchParams={props.searchParams} />
        </Suspense>
        <p className="mt-8 text-sm">
          <Link href="/">← Retour au site</Link>
        </p>
      </div>
    </main>
  );
}

async function AvecAlerte({ searchParams }: Pick<PageProps<"/admin/connexion">, "searchParams">) {
  const sp = await searchParams;
  const cle = typeof sp.erreur === "string" ? sp.erreur : undefined;
  const alerte = sp.deconnecte ? "Vous êtes déconnecté·e. À bientôt !" : cle ? ALERTES[cle] : undefined;
  return <FormulaireConnexion alerte={alerte} />;
}
