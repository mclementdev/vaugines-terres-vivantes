/** Silhouette de cyprès au trait (éléments signature de la DA). */
const TRACE =
  "M20 4 C27 30 33 80 31 130 C30 165 26 188 22 196 L18 196 C14 188 10 165 9 130 C7 80 13 30 20 4 Z";

type CypresProps = {
  largeur: number;
  hauteur: number;
  couleur?: string;
  epaisseur?: number;
  className?: string;
};

export function Cypres({ largeur, hauteur, couleur = "currentColor", epaisseur = 1.6, className }: CypresProps) {
  return (
    <svg
      width={largeur}
      height={hauteur}
      viewBox="0 0 40 200"
      fill="none"
      style={{ stroke: couleur }}
      strokeWidth={epaisseur}
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d={TRACE} />
    </svg>
  );
}

type GroupeProps = {
  couleurs?: [string, string, string];
  echelle?: number;
  className?: string;
};

/**
 * Groupe de trois cyprès de hauteurs différentes. La DA en autorise un seul
 * par écran : à réserver au hero ou à un bloc signature.
 */
export function GroupeCypres({ couleurs = ["#FFFFFF", "#FFFFFF", "#FFFFFF"], echelle = 1, className }: GroupeProps) {
  const s = (n: number) => Math.round(n * echelle);
  return (
    <div className={className} aria-hidden="true">
      <div className="flex items-end gap-2.5">
        <Cypres largeur={s(34)} hauteur={s(170)} couleur={couleurs[0]} epaisseur={1.6} />
        <Cypres largeur={s(42)} hauteur={s(230)} couleur={couleurs[1]} epaisseur={1.4} />
        <Cypres largeur={s(30)} hauteur={s(140)} couleur={couleurs[2]} epaisseur={1.8} />
      </div>
    </div>
  );
}
