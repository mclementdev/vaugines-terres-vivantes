"use client";

import Image from "@tiptap/extension-image";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useId, useRef, useState } from "react";

import { televerserImage } from "@/lib/admin/televersement";
import { cn } from "@/lib/cn";

import { BoiteDialogue } from "../BoiteDialogue";

export type ContenuRiche = { json: unknown; html: string };
export type EvenementLiable = { titre: string; slug: string };

type Props = {
  initial: unknown;
  onChange: (c: ContenuRiche) => void;
  evenements?: EvenementLiable[];
  /** Variante courte (réponses de FAQ) : sans titres ni images. */
  simple?: boolean;
  libelle: string;
  minHauteur?: string;
};

/** Éditeur de texte riche (Tiptap) de l'administration. */
export function EditeurRiche({ initial, onChange, evenements = [], simple = false, libelle, minHauteur = "min-h-[420px]" }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: simple ? false : { levels: [2, 3] },
        codeBlock: false,
        code: false,
        horizontalRule: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
      }),
      Image.configure({ inline: false }),
    ],
    content: (initial as object) ?? "",
    editorProps: {
      attributes: {
        class: cn("prose-vtv prose-article px-7 pb-8 pt-5 outline-none", minHauteur),
        "aria-label": libelle,
        "aria-multiline": "true",
        role: "textbox",
      },
    },
    // Seules les modifications de la personne comptent (pas la normalisation initiale).
    onUpdate: ({ editor: e }) => {
      if (e.isFocused) onChange({ json: e.getJSON(), html: e.getHTML() });
    },
  });

  return (
    <div>
      {editor && <BarreOutils editor={editor} evenements={evenements} simple={simple} />}
      <EditorContent editor={editor} />
    </div>
  );
}

const btn =
  "flex h-10 min-w-10 cursor-pointer items-center justify-center rounded-lg px-2 font-bold text-encre hover:bg-pierre aria-pressed:bg-terre aria-pressed:text-white";

function BarreOutils({ editor, evenements, simple }: { editor: Editor; evenements: EvenementLiable[]; simple: boolean }) {
  const etat = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      gras: e.isActive("bold"),
      italique: e.isActive("italic"),
      liste: e.isActive("bulletList"),
      numerotee: e.isActive("orderedList"),
      citation: e.isActive("blockquote"),
      lien: e.isActive("link"),
    }),
  });
  const [dialogue, setDialogue] = useState<null | "lien" | "image" | "evenement">(null);
  const c = () => editor.chain().focus();

  return (
    <>
      <div role="toolbar" aria-label="Mise en forme" className="flex flex-wrap gap-0.5 border-y border-[#F0E6D8] bg-[#FBF7F1] px-5 py-1.5">
        {!simple && (
          <>
            <button type="button" className={btn} aria-label="H2 : titre de section" aria-pressed={etat.h2} onClick={() => c().toggleHeading({ level: 2 }).run()}>
              H2
            </button>
            <button type="button" className={btn} aria-label="H3 : sous-titre" aria-pressed={etat.h3} onClick={() => c().toggleHeading({ level: 3 }).run()}>
              H3
            </button>
          </>
        )}
        <button type="button" className={btn} aria-label="Gras" aria-pressed={etat.gras} onClick={() => c().toggleBold().run()}>
          B
        </button>
        <button type="button" className={cn(btn, "italic")} aria-label="Italique" aria-pressed={etat.italique} onClick={() => c().toggleItalic().run()}>
          I
        </button>
        <button type="button" className={btn} aria-label="Liste à puces" aria-pressed={etat.liste} onClick={() => c().toggleBulletList().run()}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M8 5h9M8 10h9M8 15h9" />
            <circle cx="3.5" cy="5" r="1" fill="currentColor" />
            <circle cx="3.5" cy="10" r="1" fill="currentColor" />
            <circle cx="3.5" cy="15" r="1" fill="currentColor" />
          </svg>
        </button>
        <button type="button" className={btn} aria-label="Liste numérotée" aria-pressed={etat.numerotee} onClick={() => c().toggleOrderedList().run()}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M8 5h9M8 10h9M8 15h9" />
            <path d="M2.5 3.5h1.5v3.5M2.5 7h3M2.5 12.5c0-1 2.5-1 2.5 0 0 1-2.5 1.5-2.5 3h2.6" strokeWidth="1.3" />
          </svg>
        </button>
        <button type="button" className={btn} aria-label="Citation" aria-pressed={etat.citation} onClick={() => c().toggleBlockquote().run()}>
          «»
        </button>
        <button type="button" className={btn} aria-label="Lien" aria-pressed={etat.lien} onClick={() => setDialogue("lien")}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1" />
          </svg>
        </button>
        {!simple && (
          <>
            <button type="button" className={btn} aria-label="Image" onClick={() => setDialogue("image")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <circle cx="9" cy="10" r="2" />
                <path d="M21 16l-5-5-8 8" />
              </svg>
            </button>
            {evenements.length > 0 && (
              <button type="button" className={btn} aria-label="Lier un événement" onClick={() => setDialogue("evenement")}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect x="3" y="5" width="18" height="16" rx="2" />
                  <path d="M3 10h18M8 3v4M16 3v4" />
                </svg>
              </button>
            )}
          </>
        )}
        <span className="mx-1 w-px self-stretch bg-bordure" aria-hidden="true" />
        <button type="button" className={btn} aria-label="Annuler" onClick={() => c().undo().run()}>
          ↶
        </button>
        <button type="button" className={btn} aria-label="Rétablir" onClick={() => c().redo().run()}>
          ↷
        </button>
      </div>

      {dialogue === "lien" && <DialogueLien editor={editor} fermer={() => setDialogue(null)} />}
      {dialogue === "image" && <DialogueImage editor={editor} fermer={() => setDialogue(null)} />}
      {dialogue === "evenement" && <DialogueEvenement editor={editor} evenements={evenements} fermer={() => setDialogue(null)} />}
    </>
  );
}

function DialogueLien({ editor, fermer }: { editor: Editor; fermer: () => void }) {
  const id = useId();
  const [url, setUrl] = useState<string>(editor.getAttributes("link").href ?? "");
  const valider = () => {
    const propre = url.trim();
    if (!propre) editor.chain().focus().extendMarkRange("link").unsetLink().run();
    else editor.chain().focus().extendMarkRange("link").setLink({ href: /^(https?:|mailto:|\/)/.test(propre) ? propre : `https://${propre}` }).run();
    fermer();
  };
  return (
    <BoiteDialogue titre="Lien" fermer={fermer} onValider={valider} libelleValider="Appliquer">
      <label htmlFor={id} className="mb-1.5 block font-bold">
        Adresse
      </label>
      <input
        id={id}
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://… ou /evenements/…"
        className="h-12 w-full rounded-[14px] border-[1.5px] border-bordure-champ px-4"
      />
      <p className="mt-2 text-sm text-encre-3">Sélectionnez d&apos;abord le texte à lier. Laissez vide pour retirer le lien.</p>
    </BoiteDialogue>
  );
}

function DialogueImage({ editor, fermer }: { editor: Editor; fermer: () => void }) {
  const id = useId();
  const fichier = useRef<HTMLInputElement>(null);
  const [alt, setAlt] = useState("");
  const [erreur, setErreur] = useState("");
  const [enCours, setEnCours] = useState(false);

  const valider = async () => {
    const f = fichier.current?.files?.[0];
    if (!f) return setErreur("Choisissez une image.");
    if (!alt.trim()) return setErreur("Le texte alternatif est obligatoire : il décrit l'image aux personnes qui ne la voient pas.");
    setEnCours(true);
    try {
      const { url } = await televerserImage(f, "articles");
      editor.chain().focus().setImage({ src: url, alt: alt.trim() }).run();
      fermer();
    } catch (e) {
      setErreur((e as Error).message);
    } finally {
      setEnCours(false);
    }
  };

  return (
    <BoiteDialogue titre="Insérer une image" fermer={fermer} onValider={valider} libelleValider={enCours ? "Envoi…" : "Insérer"} enCours={enCours}>
      <div className="flex flex-col gap-4">
        <div>
          <label htmlFor={`${id}-f`} className="mb-1.5 block font-bold">
            Image (JPG, PNG, WebP · 10 Mo max)
          </label>
          <input id={`${id}-f`} ref={fichier} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="block w-full" />
        </div>
        <div>
          <label htmlFor={`${id}-a`} className="mb-1.5 block font-bold">
            Texte alternatif <span className="text-terre-fonce">*</span>
          </label>
          <input id={`${id}-a`} value={alt} onChange={(e) => setAlt(e.target.value)} className="h-12 w-full rounded-[14px] border-[1.5px] border-bordure-champ px-4" />
          <p className="mt-1 text-sm text-encre-3">Ex. : « La fontaine moussue, place du village ».</p>
        </div>
        {erreur && (
          <p role="alert" className="font-semibold text-erreur">
            {erreur}
          </p>
        )}
      </div>
    </BoiteDialogue>
  );
}

function DialogueEvenement({ editor, evenements, fermer }: { editor: Editor; evenements: EvenementLiable[]; fermer: () => void }) {
  const id = useId();
  const [slug, setSlug] = useState(evenements[0]?.slug ?? "");
  const valider = () => {
    const ev = evenements.find((e) => e.slug === slug);
    if (ev) {
      const { from, to } = editor.state.selection;
      if (from === to) editor.chain().focus().insertContent(`<a href="/evenements/${ev.slug}">${ev.titre}</a> `).run();
      else editor.chain().focus().setLink({ href: `/evenements/${ev.slug}` }).run();
    }
    fermer();
  };
  return (
    <BoiteDialogue titre="Lier un événement" fermer={fermer} onValider={valider} libelleValider="Insérer le lien">
      <label htmlFor={id} className="mb-1.5 block font-bold">
        Événement
      </label>
      <select id={id} value={slug} onChange={(e) => setSlug(e.target.value)} className="h-12 w-full rounded-[14px] border-[1.5px] border-bordure-champ bg-white px-3">
        {evenements.map((e) => (
          <option key={e.slug} value={e.slug}>
            {e.titre}
          </option>
        ))}
      </select>
      <p className="mt-2 text-sm text-encre-3">Le texte sélectionné devient un lien vers l&apos;événement ; sans sélection, son titre est inséré.</p>
    </BoiteDialogue>
  );
}
