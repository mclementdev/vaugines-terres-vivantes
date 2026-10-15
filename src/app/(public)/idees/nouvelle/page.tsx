import type { Metadata } from "next";
import Link from "next/link";

import { deposerIdee } from "@/app/actions/idees";
import { FormulaireIdee } from "@/components/idees/FormulaireIdee";

export const metadata: Metadata = {
  title: "Proposer une idée pour Vaugines",
  description: "Petite ou grande, toute idée est la bienvenue. Elle est relue par l'équipe sous 48 h avant publication dans la boîte à idées.",
  alternates: { canonical: "/idees/nouvelle" },
};

export default function NouvelleIdee() {
  return (
    <div className="conteneur pb-16 pt-8 md:pb-[100px] md:pt-12">
      <Link href="/idees" className="mb-4 inline-block font-bold">
        ← Toutes les idées
      </Link>
      <h1 className="mb-2.5 font-titre text-[32px] font-semibold leading-[1.05] tracking-[-0.02em] md:text-[clamp(34px,4.2vw,50px)]">
        Proposer une idée pour Vaugines
      </h1>
      <p className="mb-8 max-w-[640px] text-encre-2">Petite ou grande, toute idée est la bienvenue. Elle sera relue par l&apos;équipe sous 48 h avant publication.</p>
      <div className="flex flex-wrap items-start gap-8">
        <FormulaireIdee action={deposerIdee} />
        <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
          <div className="rounded-[22px] bg-white p-6">
            <h2 className="mb-3 font-titre text-xl font-semibold">Une bonne idée, c&apos;est…</h2>
            <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[15px] text-encre-2">
              <li>concrète : un lieu, un besoin ;</li>
              <li>utile au village, pas seulement à soi ;</li>
              <li>formulée positivement.</li>
            </ul>
          </div>
          <div className="rounded-[22px] bg-pierre p-6 text-[15px] text-encre-2">
            <p className="mb-1.5 font-bold text-encre">Et après ?</p>
            <p>Relecture sous 48 h → publication → soutiens et commentaires → étude en commission. Vous êtes prévenu·e à chaque étape.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
