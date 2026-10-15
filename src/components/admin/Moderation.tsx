"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { changerAvancement, deciderCommentaire, deciderIdee, traiterSignalement, type Retour } from "@/app/admin/actions/moderation";
import { AVANCEMENT_IDEES, type AvancementIdee } from "@/lib/libelles";
import { cn } from "@/lib/cn";

import { BoiteDialogue } from "./BoiteDialogue";
import { ZoneAdmin } from "./ChampsAdmin";
import { BoutonAdmin } from "./ui";

function useAction() {
  const [retour, setRetour] = useState<Retour>();
  const [enCours, demarrer] = useTransition();
  const router = useRouter();
  const lancer = (f: () => Promise<Retour>, apres?: () => void) =>
    demarrer(async () => {
      const r = await f();
      setRetour(r);
      if (r.ok) {
        apres?.();
        router.refresh();
      }
    });
  return { retour, enCours, lancer };
}

function Message({ retour }: { retour?: Retour }) {
  if (!retour) return null;
  return (
    <p role="status" className={cn("w-full rounded-xl px-3 py-2 text-sm font-semibold", retour.ok ? "bg-tag-olive text-tag-olive-fg" : "bg-tag-terre text-erreur")}>
      {retour.message}
    </p>
  );
}

/** Décision sur une idée en attente : publier, demander une modification, refuser (avec motif). */
export function DecisionIdee({ id }: { id: string }) {
  const { retour, enCours, lancer } = useAction();
  const [dialogue, setDialogue] = useState<null | "modification" | "refusee">(null);
  const [motif, setMotif] = useState("");
  return (
    <div className="flex flex-wrap gap-2">
      <BoutonAdmin disabled={enCours} onClick={() => lancer(() => deciderIdee(id, "publiee"))} className="bg-olive hover:bg-[#46511d]">
        Publier
      </BoutonAdmin>
      <BoutonAdmin variante="secondaire" onClick={() => setDialogue("modification")}>
        Demander une modification
      </BoutonAdmin>
      <BoutonAdmin variante="danger" onClick={() => setDialogue("refusee")}>
        Refuser (avec motif)
      </BoutonAdmin>
      <Message retour={retour} />
      {dialogue && (
        <BoiteDialogue
          titre={dialogue === "modification" ? "Demander une modification" : "Refuser l'idée"}
          fermer={() => setDialogue(null)}
          enCours={enCours}
          danger={dialogue === "refusee"}
          libelleValider={enCours ? "Envoi…" : dialogue === "modification" ? "Envoyer la demande" : "Refuser et prévenir l'auteur"}
          onValider={() => lancer(() => deciderIdee(id, dialogue, motif), () => setDialogue(null))}
        >
          <ZoneAdmin
            id="motif"
            rows={4}
            libelle={dialogue === "modification" ? "Ce qu'il faudrait modifier" : "Motif du refus"}
            aide="Envoyé à l'auteur par e-mail, jamais publié. Restez bienveillant·e : merci pour sa proposition."
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            erreur={retour && !retour.ok ? retour.message : undefined}
          />
        </BoiteDialogue>
      )}
    </div>
  );
}

export function DecisionCommentaire({ id }: { id: string }) {
  const { retour, enCours, lancer } = useAction();
  return (
    <div className="flex flex-wrap gap-2">
      <BoutonAdmin disabled={enCours} onClick={() => lancer(() => deciderCommentaire(id, true))} className="bg-olive hover:bg-[#46511d]">
        Publier
      </BoutonAdmin>
      <BoutonAdmin variante="danger" disabled={enCours} onClick={() => lancer(() => deciderCommentaire(id, false))}>
        Refuser
      </BoutonAdmin>
      <Message retour={retour} />
    </div>
  );
}

export function DecisionSignalement({ cible }: { cible: { idee?: string; commentaire?: string } }) {
  const { retour, enCours, lancer } = useAction();
  return (
    <div className="flex flex-wrap gap-2">
      <BoutonAdmin variante="secondaire" disabled={enCours} onClick={() => lancer(() => traiterSignalement(cible, false))}>
        Garder en ligne
      </BoutonAdmin>
      <BoutonAdmin variante="danger" disabled={enCours} onClick={() => lancer(() => traiterSignalement(cible, true))}>
        Retirer du site
      </BoutonAdmin>
      <Message retour={retour} />
    </div>
  );
}

/** Statut public d'une idée publiée. */
export function Avancement({ id, actuel }: { id: string; actuel: AvancementIdee }) {
  const { retour, enCours, lancer } = useAction();
  return (
    <div className="flex flex-col gap-2">
      <div role="group" aria-label="Statut" className="flex flex-wrap gap-1.5">
        {(Object.keys(AVANCEMENT_IDEES) as AvancementIdee[]).map((e) => (
          <button
            key={e}
            type="button"
            aria-pressed={actuel === e}
            disabled={enCours || actuel === e}
            onClick={() => lancer(() => changerAvancement(id, e))}
            className={cn(
              "min-h-10 cursor-pointer rounded-full border-[1.5px] px-3.5 text-sm font-bold disabled:cursor-default",
              actuel === e ? "border-brun bg-brun text-white" : "border-bordure-douce bg-white text-encre hover:border-terre",
            )}
          >
            {AVANCEMENT_IDEES[e].libelle}
          </button>
        ))}
      </div>
      <Message retour={retour} />
    </div>
  );
}
