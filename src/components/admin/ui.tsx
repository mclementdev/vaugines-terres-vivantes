import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/cn";
import { etatPublication } from "@/lib/admin/outils";

type VarianteAdmin = "principal" | "secondaire" | "danger" | "discret";

export function classesBoutonAdmin(v: VarianteAdmin = "principal") {
  return cn(
    "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl px-[18px] font-bold no-underline disabled:cursor-not-allowed disabled:opacity-60",
    v === "principal" && "bg-terre text-white hover:bg-terre-fonce hover:text-white",
    v === "secondaire" && "border-[1.5px] border-bordure-champ bg-white text-encre hover:border-terre hover:text-terre-fonce",
    v === "danger" && "border-[1.5px] border-erreur/40 bg-white text-erreur hover:bg-erreur hover:text-white",
    v === "discret" && "px-2 text-terre-fonce underline-offset-4 hover:underline",
  );
}

export function BoutonAdmin({ variante, className, type = "button", ...p }: ComponentProps<"button"> & { variante?: VarianteAdmin }) {
  return <button type={type} {...p} className={cn(classesBoutonAdmin(variante), className)} />;
}

export function LienAdmin({ variante, className, ...p }: ComponentProps<typeof Link> & { variante?: VarianteAdmin }) {
  return <Link {...p} className={cn(classesBoutonAdmin(variante), className)} />;
}

export function EnTeteAdmin({ surtitre, titre, actions, retour }: { surtitre?: ReactNode; titre: string; actions?: ReactNode; retour?: { href: string; libelle: string } }) {
  return (
    <div className="mb-[26px] flex flex-wrap items-center justify-between gap-3.5">
      <div>
        {retour && (
          <Link href={retour.href} className="mb-1 inline-block text-[15px] font-semibold">
            ← {retour.libelle}
          </Link>
        )}
        {surtitre && <p className="text-[15px] text-encre-3">{surtitre}</p>}
        <h1 className="font-titre text-[30px] font-semibold leading-tight md:text-[34px]">{titre}</h1>
      </div>
      {actions && <div className="flex flex-wrap gap-2.5">{actions}</div>}
    </div>
  );
}

export function CarteAdmin({ titre, lien, children, className }: { titre?: string; lien?: { href: string; libelle: string }; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-[20px] bg-white px-6 py-[22px]", className)}>
      {(titre || lien) && (
        <div className="mb-3 flex items-baseline justify-between gap-3">
          {titre && <h2 className="font-titre text-xl font-semibold">{titre}</h2>}
          {lien && (
            <Link href={lien.href} className="text-sm font-bold">
              {lien.libelle}
            </Link>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

const STATUTS = {
  brouillon: { libelle: "Brouillon", classes: "bg-tag-neutre text-tag-neutre-fg" },
  programme: { libelle: "Programmé", classes: "bg-tag-indigo text-tag-indigo-fg" },
  publie: { libelle: "Publié", classes: "bg-tag-olive text-tag-olive-fg" },
  corbeille: { libelle: "Corbeille", classes: "bg-tag-terre text-tag-terre-fg" },
};

export function PastilleStatut({ status, publishedAt }: { status: string; publishedAt: string | null }) {
  const s = STATUTS[etatPublication(status, publishedAt)];
  return <span className={cn("inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[13px] font-bold", s.classes)}>{s.libelle}</span>;
}

const TONS = {
  neutre: "bg-tag-neutre text-tag-neutre-fg",
  olive: "bg-tag-olive text-tag-olive-fg",
  indigo: "bg-tag-indigo text-tag-indigo-fg",
  terre: "bg-tag-terre text-tag-terre-fg",
  ambre: "bg-tag-ambre text-tag-ambre-fg",
};

export function Pastille({ children, ton = "neutre" }: { children: ReactNode; ton?: keyof typeof TONS }) {
  return <span className={cn("inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[13px] font-bold", TONS[ton])}>{children}</span>;
}

/** Message de retour d'un formulaire (annoncé aux lecteurs d'écran). */
export function RetourForm({ statut, message }: { statut: string; message?: string }) {
  if (!message) return null;
  return (
    <p
      role={statut === "erreur" ? "alert" : "status"}
      className={cn("rounded-[14px] px-4 py-3 font-semibold", statut === "erreur" ? "bg-tag-terre text-erreur" : "bg-tag-olive text-tag-olive-fg")}
    >
      {message}
    </p>
  );
}

export function TableauVide({ children }: { children: ReactNode }) {
  return <p className="rounded-[20px] bg-white p-8 text-center text-encre-2">{children}</p>;
}

/** Onglets de filtrage par lien (?vue=…). */
export function VuesAdmin({ base, vues, actuelle }: { base: string; vues: { cle: string; libelle: string; nombre?: number }[]; actuelle: string }) {
  return (
    <nav aria-label="Filtrer" className="mb-4 flex flex-wrap gap-2">
      {vues.map((v, i) => (
        <Link
          key={v.cle}
          href={i === 0 ? base : `${base}?vue=${v.cle}`}
          aria-current={actuelle === v.cle ? "page" : undefined}
          className={cn(
            "rounded-full border-[1.5px] px-3.5 py-2 text-[15px] font-bold no-underline",
            actuelle === v.cle ? "border-terre bg-terre text-white hover:text-white" : "border-bordure-douce bg-white text-encre",
          )}
        >
          {v.libelle}
          {v.nombre !== undefined && ` · ${v.nombre}`}
        </Link>
      ))}
    </nav>
  );
}

/** Tableau de liste de l'administration (défilement horizontal sur mobile). */
export function TableauAdmin({ legende, colonnes, lignes }: { legende: string; colonnes: string[]; lignes: { cle: string; cellules: ReactNode[] }[] }) {
  return (
    <div className="overflow-x-auto rounded-[20px] bg-white">
      <table className="w-full min-w-[640px] text-left">
        <caption className="sr-only">{legende}</caption>
        <thead className="border-b border-[#F0E6D8] text-sm text-encre-3">
          <tr>
            {colonnes.map((c, i) => (
              <th key={c} scope="col" className={cn("py-3 font-semibold", i === 0 ? "px-5" : "px-3")}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lignes.map((l) => (
            <tr key={l.cle} className="border-t border-[#F0E6D8] align-top first:border-t-0">
              {l.cellules.map((c, i) => (
                <td key={i} className={cn("py-3", i === 0 ? "px-5" : "px-3")}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
