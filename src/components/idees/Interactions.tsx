"use client";

import Link from "next/link";
import { useActionState, useId, useState, useTransition } from "react";

import { commenter, signaler, suivreIdee, type EtatDepot } from "@/app/actions/idees";
import { ChampPiege } from "@/components/ui/Champ";
import { cn } from "@/lib/cn";

const champ =
  "w-full rounded-[14px] border-[1.5px] border-bordure-champ bg-white px-4 text-[17px] text-encre aria-[invalid=true]:border-2 aria-[invalid=true]:border-erreur";
const INITIAL: EtatDepot = { statut: "inactif" };

function Erreur({ id, texte }: { id: string; texte?: string }) {
  if (!texte) return null;
  return (
    <p id={id} className="mt-1 text-sm font-semibold text-erreur">
      {texte}
    </p>
  );
}

/** Commentaire (relu avant publication). */
export function FormulaireCommentaire({ ideaId }: { ideaId: string }) {
  const [etat, action, enCours] = useActionState(commenter.bind(null, ideaId), INITIAL);
  const [, demarrer] = useTransition();
  const id = useId();
  const e = etat.erreurs ?? {};
  if (etat.statut === "ok") {
    return (
      <p role="status" className="rounded-2xl bg-tag-olive px-4 py-3 font-semibold text-tag-olive-fg">
        {etat.message ?? "Merci ! Votre commentaire sera publié après relecture."}
      </p>
    );
  }
  return (
    <form
      method="post"
      noValidate
      // Envoi manuel : la saisie n'est pas effacée en cas d'erreur.
      onSubmit={(ev) => {
        ev.preventDefault();
        const fd = new FormData(ev.currentTarget);
        demarrer(() => action(fd));
      }}
      className="flex flex-col gap-3.5 rounded-[22px] bg-white p-5 md:p-6"
    >
      <h3 className="font-titre text-xl font-semibold">Ajouter un commentaire</h3>
      <div>
        <label htmlFor={`${id}-texte`} className="mb-1.5 block text-[15px] font-bold">
          Votre commentaire
        </label>
        <textarea
          id={`${id}-texte`}
          name="texte"
          rows={4}
          maxLength={1500}
          required
          aria-invalid={e.texte ? true : undefined}
          aria-describedby={e.texte ? `${id}-texte-err` : undefined}
          className={cn(champ, "py-3 leading-normal")}
        />
        <Erreur id={`${id}-texte-err`} texte={e.texte} />
      </div>
      <div>
        <label htmlFor={`${id}-prenom`} className="mb-1.5 block text-[15px] font-bold">
          Prénom affiché <span className="font-normal text-encre-3">(facultatif : sinon « Anonyme »)</span>
        </label>
        <input id={`${id}-prenom`} name="prenom" autoComplete="given-name" maxLength={60} className={cn(champ, "h-[52px] sm:max-w-xs")} />
      </div>
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          name="charte"
          aria-invalid={e.charte ? true : undefined}
          aria-describedby={e.charte ? `${id}-charte-err` : undefined}
          className="mt-[3px] size-[22px] shrink-0 accent-terre"
        />
        <span>
          Je respecte la{" "}
          <Link href="/idees/charte" target="_blank">
            charte de bienveillance<span className="sr-only"> (nouvel onglet)</span>
          </Link>
          .
        </span>
      </label>
      <Erreur id={`${id}-charte-err`} texte={e.charte} />
      <ChampPiege />
      {etat.statut === "erreur" && etat.message && !Object.keys(e).length && (
        <p role="alert" className="font-semibold text-erreur">
          {etat.message}
        </p>
      )}
      <button
        type="submit"
        disabled={enCours}
        className="bouton-anime min-h-12 self-start rounded-full bg-terre px-6 font-bold text-white hover:bg-terre-fonce disabled:opacity-70"
      >
        {enCours ? "Envoi…" : "Envoyer mon commentaire"}
      </button>
      <p className="text-[13px] text-encre-3">Les commentaires sont relus avant publication, sous 48 h.</p>
    </form>
  );
}

/** « Me prévenir de l'avancement » (e-mail à chaque étape, lien d'arrêt dans chaque message). */
export function FormulaireSuivi({ ideaId }: { ideaId: string }) {
  const [etat, action, enCours] = useActionState(suivreIdee.bind(null, ideaId), INITIAL);
  const id = useId();
  if (etat.statut === "ok") {
    return (
      <p role="status" className="text-[15px] font-semibold text-tag-olive-fg">
        {etat.message}
      </p>
    );
  }
  const err = etat.erreurs?.email ?? (etat.statut === "erreur" ? etat.message : undefined);
  return (
    <form action={action} noValidate>
      <label htmlFor={`${id}-email`} className="mb-1.5 block text-[15px] font-bold">
        Être prévenu·e de l&apos;avancement
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="prenom@exemple.fr"
          aria-invalid={err ? true : undefined}
          aria-describedby={err ? `${id}-err` : `${id}-aide`}
          className={cn(champ, "h-12 min-w-0 flex-[1_1_180px]")}
        />
        <button type="submit" disabled={enCours} className="min-h-12 cursor-pointer rounded-full border-2 border-terre px-5 font-bold text-terre-fonce hover:bg-tag-terre disabled:opacity-70">
          {enCours ? "…" : "Me prévenir"}
        </button>
      </div>
      <ChampPiege />
      {err ? (
        <Erreur id={`${id}-err`} texte={err} />
      ) : (
        <p id={`${id}-aide`} className="mt-1.5 text-[13px] text-encre-3">
          Un e-mail à chaque étape, rien d&apos;autre. Jamais affiché.
        </p>
      )}
    </form>
  );
}

/** Signaler une idée ou un commentaire à la modération. */
export function Signaler({ cible, libelle = "Signaler" }: { cible: { idee?: string; commentaire?: string }; libelle?: string }) {
  const [ouvert, setOuvert] = useState(false);
  const [motif, setMotif] = useState("");
  const [retour, setRetour] = useState<{ ok: boolean; message: string }>();
  const [enCours, demarrer] = useTransition();
  const id = useId();

  if (retour?.ok) {
    return (
      <span role="status" className="text-sm text-encre-3">
        {retour.message}
      </span>
    );
  }
  if (!ouvert) {
    return (
      <button type="button" onClick={() => setOuvert(true)} className="cursor-pointer text-sm text-encre-3 underline-offset-4 hover:text-terre-fonce hover:underline">
        {libelle}
      </button>
    );
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        demarrer(async () => setRetour(await signaler(cible, motif)));
      }}
      className="mt-2 flex w-full flex-col gap-2 rounded-2xl bg-sable p-3.5"
    >
      <label htmlFor={`${id}-motif`} className="text-sm font-bold">
        Pourquoi ce contenu pose-t-il problème ? <span className="font-normal text-encre-3">(facultatif)</span>
      </label>
      <textarea id={`${id}-motif`} value={motif} onChange={(e) => setMotif(e.target.value)} rows={2} maxLength={500} className={cn(champ, "py-2 text-base")} />
      {retour && !retour.ok && <p className="text-sm font-semibold text-erreur">{retour.message}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={enCours} className="min-h-10 cursor-pointer rounded-full bg-brun px-4 text-sm font-bold text-white disabled:opacity-70">
          Envoyer le signalement
        </button>
        <button type="button" onClick={() => setOuvert(false)} className="cursor-pointer text-sm font-bold text-terre-fonce">
          Annuler
        </button>
      </div>
    </form>
  );
}
