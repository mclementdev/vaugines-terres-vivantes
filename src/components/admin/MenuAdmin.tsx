"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { seDeconnecter } from "@/app/actions/auth";
import { Cypres } from "@/components/site/Cypres";
import { cn } from "@/lib/cn";

import { estActif, type GroupeAdmin } from "./navigation";

type Props = { groupes: GroupeAdmin[]; nom: string; role: "superadmin" | "admin"; initiales: string };

function Navigation({ groupes, surClic }: { groupes: GroupeAdmin[]; surClic?: () => void }) {
  const chemin = usePathname();
  return (
    <nav aria-label="Administration" className="flex flex-col gap-3.5">
      {groupes.map((g) => (
        <div key={g.titre} className="flex flex-col gap-0.5">
          <p className="mb-1 px-2.5 text-xs font-bold uppercase tracking-[0.12em] text-creme-3">{g.titre}</p>
          {g.liens.map((l) => {
            const actif = estActif(l.href, chemin);
            return (
              <Link
                key={l.cle}
                href={l.href}
                onClick={surClic}
                aria-current={actif ? "page" : undefined}
                className={cn(
                  "flex items-center justify-between rounded-[10px] px-3 py-2.5 no-underline",
                  actif ? "bg-terre font-bold text-white hover:text-white" : "font-semibold text-creme hover:bg-brun-clair hover:text-white",
                )}
              >
                {l.libelle}
                {l.badge && (
                  <span className={cn("rounded-full px-2 text-xs font-bold", actif ? "text-white" : "bg-abricot/15 text-abricot")}>
                    {l.badge}
                    <span className="sr-only"> à traiter</span>
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function Pied({ nom, role, initiales }: Omit<Props, "groupes">) {
  return (
    <div className="mt-auto flex flex-col gap-3 border-t border-[#5A4130] px-2 pt-3.5">
      <div className="flex items-center gap-2.5">
        <span className="flex size-[38px] shrink-0 items-center justify-center rounded-full bg-abricot font-bold text-brun" aria-hidden="true">
          {initiales}
        </span>
        <span className="min-w-0 leading-tight">
          <strong className="block truncate text-white">{nom}</strong>
          <span className="text-[13px] text-[#CDB9A2]">{role === "superadmin" ? "Superadmin" : "Admin"}</span>
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <Link href="/" className="text-abricot-clair hover:text-white">
          Voir le site →
        </Link>
        <form action={seDeconnecter}>
          <button type="submit" className="cursor-pointer text-creme underline-offset-4 hover:text-white hover:underline">
            Se déconnecter
          </button>
        </form>
      </div>
    </div>
  );
}

function Marque() {
  return (
    <Link href="/admin" className="flex items-center gap-2.5 px-2 text-white no-underline hover:text-white">
      <Cypres largeur={18} hauteur={34} couleur="var(--color-abricot)" epaisseur={6} />
      <span className="font-titre text-[17px] leading-[1.1]">
        vaugines,
        <br />
        <span className="font-semibold text-abricot">administration</span>
      </span>
    </Link>
  );
}

/** Menu latéral (maquette AdminSidebar) ; barre + tiroir sous 1024 px. */
export function MenuAdmin(props: Props) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <>
      <div className="sur-sombre hidden min-h-dvh flex-col gap-[18px] px-3.5 py-[22px] text-[15px] lg:sticky lg:top-0 lg:flex lg:max-h-dvh lg:overflow-y-auto">
        <Marque />
        <Navigation groupes={props.groupes} />
        <Pied {...props} />
      </div>

      <div className="sur-sombre flex items-center justify-between gap-3 px-4 py-3 lg:hidden">
        <Marque />
        <Dialog.Root open={ouvert} onOpenChange={setOuvert}>
          <Dialog.Trigger className="flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-[#5A4130] px-3.5 font-bold text-white">
            Menu
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-40 bg-nuit/50" />
            <Dialog.Content className="sur-sombre fixed inset-y-0 left-0 z-50 flex w-[86%] max-w-[300px] flex-col gap-[18px] overflow-y-auto bg-brun px-3.5 py-5 text-[15px]">
              <Dialog.Title className="sr-only">Menu d&apos;administration</Dialog.Title>
              <Dialog.Description className="sr-only">Rubriques de l&apos;administration</Dialog.Description>
              <Marque />
              <Navigation groupes={props.groupes} surClic={() => setOuvert(false)} />
              <Pied {...props} />
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </>
  );
}
