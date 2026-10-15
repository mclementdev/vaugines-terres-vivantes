import { cn } from "@/lib/cn";

type Etape = 1 | 2 | 3;
const ETAPES = ["Votre choix", "Vos coordonnées", "Validation"] as const;

/** Mobile : « Étape 2 sur 3 » et barre de progression. */
export function ProgressionMobile({ etape }: { etape: Etape }) {
  return (
    <div className="mb-2 flex items-center gap-2.5 md:hidden">
      <span className="text-sm font-bold text-terre-fonce">Étape {etape} sur 3</span>
      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-pierre" aria-hidden="true">
        <span className="block h-full bg-terre transition-[width]" style={{ width: `${Math.round((etape / 3) * 100)}%` }} />
      </span>
    </div>
  );
}

/** Ordinateur : pastilles des 3 étapes (les étapes franchies sont cliquables). */
export function EtapesBureau({ etape, allerA }: { etape: Etape; allerA: (e: Etape) => void }) {
  return (
    <ol aria-label="Étapes" className="mb-10 hidden flex-wrap gap-2.5 md:flex">
      {ETAPES.map((libelle, i) => {
        const n = (i + 1) as Etape;
        const faite = n < etape;
        const actuelle = n === etape;
        const contenu = (
          <>
            <span
              className={cn(
                "flex size-[30px] items-center justify-center rounded-full",
                faite && "bg-olive text-white",
                actuelle && "bg-white text-terre",
                !faite && !actuelle && "bg-pierre text-encre-2",
              )}
            >
              {faite ? (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                  <path d="M2 7.5l3 3 7-7" />
                </svg>
              ) : (
                n
              )}
            </span>
            {libelle}
            {faite && <span className="sr-only"> (étape terminée, revenir à cette étape)</span>}
          </>
        );
        const classes = cn(
          "flex items-center gap-2.5 rounded-full py-2.5 pl-2.5 pr-[18px] font-bold",
          faite && "cursor-pointer bg-tag-olive text-tag-olive-fg hover:outline-2 hover:outline-olive",
          actuelle && "bg-terre text-white",
          !faite && !actuelle && "bg-white text-encre-3",
        );
        return (
          <li key={n} aria-current={actuelle ? "step" : undefined}>
            {faite ? (
              <button type="button" onClick={() => allerA(n)} className={classes}>
                {contenu}
              </button>
            ) : (
              <span className={classes}>{contenu}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
