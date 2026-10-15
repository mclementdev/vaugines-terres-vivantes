import type { ReactNode } from "react";

/** Gabarit sobre des pages de texte (mentions, données personnelles…). */
export function PageTexte({
  surtitre,
  titre,
  intro,
  children,
}: {
  surtitre: string;
  titre: string;
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <article className="conteneur max-w-[820px] pb-20 pt-12 md:pb-28 md:pt-16">
      <p className="surtitre">{surtitre}</p>
      <h1 className="font-titre text-[clamp(36px,5vw,56px)] font-semibold leading-[1.05] tracking-[-0.02em]">{titre}</h1>
      {intro && <div className="mt-5 text-lg text-encre-2 md:text-[19px]">{intro}</div>}
      <div className="prose-vtv mt-10 rounded-[22px] bg-white p-6 md:p-10">{children}</div>
    </article>
  );
}

/** Valeur à compléter par le superadmin, bien visible. */
export function ARenseigner({ children }: { children: ReactNode }) {
  return <mark className="rounded bg-tag-ambre px-1 text-tag-ambre-fg">[{children}]</mark>;
}
