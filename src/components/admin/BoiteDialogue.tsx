"use client";

import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";

import { BoutonAdmin } from "./ui";

/** Petite fenêtre de dialogue de l'administration (focus piégé, Échap). */
export function BoiteDialogue({
  titre,
  children,
  fermer,
  onValider,
  libelleValider = "Valider",
  enCours = false,
  danger = false,
}: {
  titre: string;
  children: ReactNode;
  fermer: () => void;
  onValider: () => void;
  libelleValider?: string;
  enCours?: boolean;
  danger?: boolean;
}) {
  return (
    <Dialog.Root open onOpenChange={(o) => !o && fermer()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-nuit/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100%-32px)] max-w-[520px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[22px] bg-sable p-6 shadow-2xl">
          <Dialog.Title className="mb-4 font-titre text-2xl font-semibold">{titre}</Dialog.Title>
          <Dialog.Description className="sr-only">{titre}</Dialog.Description>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onValider();
            }}
          >
            {children}
            <div className="mt-6 flex flex-wrap justify-end gap-2.5">
              <BoutonAdmin variante="secondaire" onClick={fermer}>
                Annuler
              </BoutonAdmin>
              <BoutonAdmin type="submit" variante={danger ? "danger" : "principal"} disabled={enCours}>
                {libelleValider}
              </BoutonAdmin>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
