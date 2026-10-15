"use client";

import Link from "next/link";
import { useActionState, useEffect, useId, useState, useTransition } from "react";

import type { EtatDepot } from "@/app/actions/idees";
import { ChampPiege } from "@/components/ui/Champ";
import { PHOTO_MAX_ORIGINE } from "@/lib/idees/commun";
import { THEMES_IDEES, type ThemeIdee } from "@/lib/libelles";
import { cn } from "@/lib/cn";

const champ =
  "w-full rounded-[14px] border-[1.5px] border-bordure-champ bg-white px-4 text-[17px] text-encre placeholder:text-encre-3 aria-[invalid=true]:border-2 aria-[invalid=true]:border-erreur";

/** Réduit une photo à 1 600 px de côté (JPEG) : envoi rapide, même depuis un téléphone. */
async function reduire(fichier: File): Promise<Blob> {
  const image = await createImageBitmap(fichier);
  const echelle = Math.min(1, 1600 / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * echelle);
  canvas.height = Math.round(image.height * echelle);
  canvas.getContext("2d")!.drawImage(image, 0, 0, canvas.width, canvas.height);
  image.close();
  return new Promise((ok, ko) => canvas.toBlob((b) => (b ? ok(b) : ko(new Error("réduction"))), "image/jpeg", 0.85));
}

export type ValeursIdee = { titre: string; description: string; theme: ThemeIdee | ""; signer: boolean; prenom: string };

/**
 * Dépôt d'une idée, ou modification par l'auteur (mode « modification » :
 * sans e-mail, sans photo, sans charte).
 */
export function FormulaireIdee({
  action: actionServeur,
  valeurs,
  modification = false,
}: {
  action: (etat: EtatDepot, fd: FormData) => Promise<EtatDepot>;
  valeurs?: ValeursIdee;
  modification?: boolean;
}) {
  const [etat, action, enCours] = useActionState(actionServeur, { statut: "inactif" } as EtatDepot);
  const [, demarrer] = useTransition();
  const [titre, setTitre] = useState(valeurs?.titre ?? "");
  const [theme, setTheme] = useState<ThemeIdee | "">(valeurs?.theme ?? "");
  const [signer, setSigner] = useState(valeurs?.signer ?? true);
  const [photo, setPhoto] = useState<{ blob: Blob; apercu: string } | null>(null);
  const [erreurPhoto, setErreurPhoto] = useState<string>();
  const id = useId();
  const e: Record<string, string | undefined> = { ...etat.erreurs, ...(erreurPhoto && { photo: erreurPhoto }) };

  useEffect(
    () => () => {
      if (photo) URL.revokeObjectURL(photo.apercu);
    },
    [photo],
  );

  // Focus sur le premier champ en erreur après un envoi refusé.
  useEffect(() => {
    if (etat.statut === "erreur") document.querySelector<HTMLElement>("#depot-idee [aria-invalid='true']")?.focus();
  }, [etat]);

  const choisirPhoto = async (f: File | undefined) => {
    setErreurPhoto(undefined);
    setPhoto(null);
    if (!f) return;
    if (!f.type.startsWith("image/")) return setErreurPhoto("Choisissez une photo (JPG ou PNG).");
    if (f.size > PHOTO_MAX_ORIGINE) return setErreurPhoto("Cette photo dépasse 8 Mo : choisissez-en une plus légère.");
    try {
      const blob = await reduire(f);
      setPhoto({ blob, apercu: URL.createObjectURL(blob) });
    } catch {
      setErreurPhoto("Cette photo n'a pas pu être lue. Essayez-en une autre (JPG ou PNG).");
    }
  };

  if (etat.statut === "ok") {
    return (
      <div role="status" className="rounded-[26px] bg-white p-7 md:p-9">
        <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-tag-olive text-olive" aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 7.5l3 3 7-7" />
          </svg>
        </span>
        <h2 className="mb-2 font-titre text-[28px] font-semibold">{modification ? "C'est renvoyé, merci !" : "Merci pour votre idée !"}</h2>
        <p className="mb-5 text-encre-2">
          {modification
            ? "L'équipe relit votre idée modifiée ; vous recevrez un e-mail dès qu'elle sera en ligne."
            : "Elle est entre les mains de l'équipe, qui la relit sous 48 h. Un e-mail vient de vous être envoyé, et vous serez prévenu·e dès sa publication."}
        </p>
        <Link href="/idees" className="font-bold">
          ← Voir les autres idées
        </Link>
      </div>
    );
  }

  return (
    <form
      id="depot-idee"
      method="post"
      noValidate
      encType="multipart/form-data"
      onSubmit={(ev) => {
        // Envoi manuel : saisie conservée en cas d'erreur, photo réduite jointe.
        ev.preventDefault();
        const fd = new FormData(ev.currentTarget);
        fd.delete("photo_brute");
        if (photo) fd.set("photo", photo.blob, "photo.jpg");
        demarrer(() => action(fd));
      }}
      className="flex min-w-0 flex-[999_1_560px] flex-col gap-6 rounded-[26px] bg-white p-5 md:p-[34px]"
    >
      <div>
        <label htmlFor={`${id}-titre`} className="mb-1.5 block text-[15px] font-bold">
          Votre idée en une phrase <Requis />
        </label>
        <input
          id={`${id}-titre`}
          name="titre"
          maxLength={90}
          value={titre}
          onChange={(ev) => setTitre(ev.target.value)}
          placeholder="Ex. : Des bancs à l'ombre le long du chemin de l'école"
          aria-invalid={e.titre ? true : undefined}
          aria-describedby={`${id}-titre-n${e.titre ? ` ${id}-titre-err` : ""}`}
          className={cn(champ, "h-[52px]")}
        />
        <p id={`${id}-titre-n`} className="mt-1 text-right text-[13px] text-encre-3">
          {titre.length} / 90
        </p>
        <Erreur id={`${id}-titre-err`} texte={e.titre} />
      </div>

      <div>
        <label htmlFor={`${id}-desc`} className="mb-1.5 block text-[15px] font-bold">
          Décrivez-la <Requis />
        </label>
        <textarea
          id={`${id}-desc`}
          name="description"
          rows={6}
          maxLength={2000}
          defaultValue={valeurs?.description}
          placeholder="Pourquoi cette idée ? Où ? Pour qui ? Avez-vous une piste pour la réaliser ?"
          aria-invalid={e.description ? true : undefined}
          aria-describedby={e.description ? `${id}-desc-err` : undefined}
          className={cn(champ, "py-3 leading-normal")}
        />
        <Erreur id={`${id}-desc-err`} texte={e.description} />
      </div>

      <fieldset aria-describedby={e.theme ? `${id}-theme-err` : undefined}>
        <legend className="mb-2.5 text-[15px] font-bold">
          Thème <Requis />
        </legend>
        <input type="hidden" name="theme" value={theme} />
        <div className="flex flex-wrap gap-2">
          {(Object.keys(THEMES_IDEES) as ThemeIdee[]).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={theme === t}
              aria-invalid={e.theme && !theme ? true : undefined}
              onClick={() => setTheme(t)}
              className={cn(
                "min-h-11 cursor-pointer rounded-full border-2 px-4 font-bold",
                theme === t ? "border-terre bg-terre text-white" : "border-bordure-douce bg-white text-encre hover:border-terre",
              )}
            >
              {THEMES_IDEES[t]}
            </button>
          ))}
        </div>
        <Erreur id={`${id}-theme-err`} texte={e.theme} />
      </fieldset>

      {!modification && (
        <div>
          <p className="mb-2 text-[15px] font-bold">
            Une photo ? <span className="font-normal text-encre-3">(facultatif)</span>
          </p>
          {photo ? (
            <div className="flex flex-wrap items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element -- aperçu local (blob) */}
              <img src={photo.apercu} alt="Aperçu de la photo choisie" className="h-28 w-40 rounded-2xl object-cover" />
              <button type="button" onClick={() => setPhoto(null)} className="cursor-pointer font-bold text-terre-fonce underline-offset-4 hover:underline">
                Retirer la photo
              </button>
            </div>
          ) : (
            <label
              className={cn(
                "flex cursor-pointer flex-col items-center gap-1 rounded-[18px] border-2 border-dashed px-5 py-6 text-center focus-within:outline-3 focus-within:outline-abricot",
                e.photo ? "border-erreur" : "border-bordure-champ hover:border-terre",
              )}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8F3D1E" strokeWidth="1.8" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <circle cx="9" cy="11" r="2" />
                <path d="M21 17l-5-5-8 7" />
              </svg>
              <strong>Ajouter une photo</strong>
              <span className="text-sm text-encre-3">JPG ou PNG, 8 Mo max · depuis votre téléphone ou ordinateur</span>
              <input
                type="file"
                name="photo_brute"
                accept="image/jpeg,image/png,image/webp,image/heic"
                className="sr-only"
                aria-invalid={e.photo ? true : undefined}
                aria-describedby={e.photo ? `${id}-photo-err` : undefined}
                onChange={(ev) => choisirPhoto(ev.target.files?.[0])}
              />
            </label>
          )}
          <Erreur id={`${id}-photo-err`} texte={e.photo} />
        </div>
      )}

      <fieldset>
        <legend className="mb-2.5 text-[15px] font-bold">Signer votre idée</legend>
        <input type="hidden" name="signer" value={signer ? "oui" : "non"} />
        <div className="mb-4 inline-flex rounded-full bg-sable p-1">
          {[
            [true, "Avec mon prénom"],
            [false, "Anonymement"],
          ].map(([v, libelle]) => (
            <button
              key={String(v)}
              type="button"
              aria-pressed={signer === v}
              onClick={() => setSigner(v as boolean)}
              className={cn("min-h-11 cursor-pointer rounded-full px-4 font-bold", signer === v ? "bg-white text-encre shadow-sm" : "text-encre-3")}
            >
              {libelle as string}
            </button>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {signer && (
            <div>
              <label htmlFor={`${id}-prenom`} className="mb-1.5 block text-[15px] font-bold">
                Prénom affiché <Requis />
              </label>
              <input
                id={`${id}-prenom`}
                name="prenom"
                autoComplete="given-name"
                maxLength={60}
                defaultValue={valeurs?.prenom}
                aria-invalid={e.prenom ? true : undefined}
                aria-describedby={e.prenom ? `${id}-prenom-err` : undefined}
                className={cn(champ, "h-[52px]")}
              />
              <Erreur id={`${id}-prenom-err`} texte={e.prenom} />
            </div>
          )}
          {!modification && (
            <div>
              <label htmlFor={`${id}-mail`} className="mb-1.5 block text-[15px] font-bold">
                E-mail <Requis />
              </label>
              <input
                id={`${id}-mail`}
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                spellCheck={false}
                aria-invalid={e.email ? true : undefined}
                aria-describedby={`${id}-mail-aide${e.email ? ` ${id}-mail-err` : ""}`}
                className={cn(champ, "h-[52px]")}
              />
              <p id={`${id}-mail-aide`} className="mt-1 text-[13px] text-encre-3">
                Jamais affiché. Pour vous prévenir quand votre idée avance.
              </p>
              <Erreur id={`${id}-mail-err`} texte={e.email} />
            </div>
          )}
        </div>
      </fieldset>

      {!modification && (
        <div>
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
              </Link>{" "}
              de la boîte à idées. <Requis />
            </span>
          </label>
          <Erreur id={`${id}-charte-err`} texte={e.charte} />
        </div>
      )}
      <ChampPiege />

      {etat.statut === "erreur" && etat.message && (
        <p role="alert" className="rounded-[14px] bg-tag-terre px-4 py-3 font-semibold text-erreur">
          {etat.message}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#EFE3D2] pt-5">
        <Link href="/idees" className="px-1 py-3 font-bold">
          Annuler
        </Link>
        <button
          type="submit"
          disabled={enCours}
          className="bouton-anime min-h-[52px] cursor-pointer rounded-full bg-terre px-8 text-lg font-bold text-white hover:bg-terre-fonce disabled:cursor-wait disabled:opacity-70"
        >
          {enCours ? "Envoi…" : modification ? "Renvoyer en relecture" : "Envoyer mon idée"}
        </button>
      </div>
    </form>
  );
}

function Requis() {
  return (
    <>
      <span className="text-terre-fonce" aria-hidden="true">
        *
      </span>
      <span className="sr-only">(obligatoire)</span>
    </>
  );
}

function Erreur({ id, texte }: { id: string; texte?: string }) {
  if (!texte) return null;
  return (
    <p id={id} className="mt-1.5 text-sm font-semibold text-erreur">
      {texte}
    </p>
  );
}
