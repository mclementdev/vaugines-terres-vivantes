import Image from "next/image";

import village from "../../../public/images/village_trait.png";

/** Dessin au trait du village perché (courrier de bienvenue). */
export function VillageTrait({
  decoratif = false,
  className,
  sizes = "(min-width: 1024px) 980px, 100vw",
}: {
  decoratif?: boolean;
  className?: string;
  sizes?: string;
}) {
  return (
    <Image
      src={village}
      alt={decoratif ? "" : "Dessin au trait du village perché de Vaugines"}
      sizes={sizes}
      className={className}
    />
  );
}
