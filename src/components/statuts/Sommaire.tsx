"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/cn";

/** Sommaire ancré ; l'article en cours de lecture est mis en évidence. */
export function Sommaire({ articles }: { articles: { numero: number; titre: string }[] }) {
  const [actif, setActif] = useState(articles[0]?.numero ?? 1);
  // Replié par défaut sur mobile pour laisser le texte en premier écran.
  const [deplie, setDeplie] = useState(false);

  useEffect(() => {
    const observateur = new IntersectionObserver(
      (entrees) => {
        const visible = entrees.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActif(Number(visible.target.id.slice(1)));
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    articles.forEach((a) => {
      const el = document.getElementById(`a${a.numero}`);
      if (el) observateur.observe(el);
    });
    return () => observateur.disconnect();
  }, [articles]);

  return (
    <nav
      aria-label="Sommaire des statuts"
      className="min-w-0 flex-[1_1_260px] rounded-[22px] bg-white p-[22px] lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto print:hidden"
    >
      <h2 className="font-bold lg:mb-2.5">
        <button
          type="button"
          aria-expanded={deplie}
          aria-controls="sommaire-statuts"
          onClick={() => setDeplie((d) => !d)}
          className="flex w-full cursor-pointer items-center justify-between gap-3 text-left lg:pointer-events-none lg:cursor-default"
        >
          Sommaire <span className="font-normal text-encre-3 lg:hidden">({articles.length} articles)</span>
          <svg width="14" height="14" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className={cn("ml-auto transition-transform lg:hidden", deplie && "rotate-180")}>
            <path d="M2 4l4 4 4-4" />
          </svg>
        </button>
      </h2>
      <ol id="sommaire-statuts" className={cn("mt-2.5 flex-col gap-0.5 text-[15px] lg:mt-0 lg:flex", deplie ? "flex" : "hidden")}>
        {articles.map((a) => (
          <li key={a.numero}>
            <a
              href={`#a${a.numero}`}
              onClick={() => setDeplie(false)}
              aria-current={actif === a.numero ? "location" : undefined}
              className={cn(
                "block rounded-lg px-2.5 py-1.5 text-encre no-underline hover:bg-sable hover:text-terre-fonce",
                actif === a.numero && "bg-tag-terre font-bold text-tag-terre-fg hover:bg-tag-terre",
              )}
            >
              {a.numero} · {a.titre.replace(/ \(AGO\)$/, "")}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
