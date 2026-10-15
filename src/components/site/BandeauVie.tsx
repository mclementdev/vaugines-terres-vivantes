import { cacheLife, cacheTag } from "next/cache";
import Link from "next/link";

import { getEvenementsAVenir } from "@/lib/data/contenus";
import { TAGS } from "@/lib/data/tags";
import { dansCombien, jour } from "@/lib/dates";

/** Bandeau « prochain rendez-vous » avec pastille en direct (2 s). */
export async function BandeauVie() {
  "use cache";
  cacheLife("contenu");
  cacheTag(TAGS.evenements);

  const [prochain] = (await getEvenementsAVenir(1)).filter((e) => e.starts_at);
  if (!prochain?.starts_at) return null;

  const relatif = dansCombien(prochain.starts_at) ?? `le ${jour(prochain.starts_at).toLowerCase()}`;
  const quand = relatif.charAt(0).toUpperCase() + relatif.slice(1);

  return (
    <div className="print:hidden sur-sombre bg-brun text-sm text-sable">
      <div className="conteneur flex items-center justify-center gap-x-4 py-2.5 md:gap-x-7">
        <span className="inline-flex min-w-0 items-center gap-2">
          <span className="inline-block size-2 shrink-0 animate-pulse-vie rounded-full bg-[#E9A06B]" aria-hidden="true" />
          <span className="truncate">
            <strong className="font-bold">{quand}</strong> · {prochain.titre}
          </span>
        </span>
        <Link
          href={`/evenements/${prochain.slug}${prochain.registration_enabled ? "#inscription" : ""}`}
          className="shrink-0 font-semibold text-abricot-clair hover:text-white"
        >
          {prochain.registration_enabled ? "S'inscrire" : "Voir"}
          <span aria-hidden="true"> →</span>
          <span className="sr-only"> : {prochain.titre}</span>
        </Link>
      </div>
    </div>
  );
}
