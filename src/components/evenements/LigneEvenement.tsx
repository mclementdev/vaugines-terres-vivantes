import Link from "next/link";

import { CarteDate } from "@/components/site/CarteDate";
import { cn } from "@/lib/cn";
import { jour, plageHoraire } from "@/lib/dates";

type Ev = {
  slug: string;
  titre: string;
  starts_at: string | null;
  ends_at: string | null;
  all_day: boolean;
  date_label: string | null;
  lieu: string;
};

/** Rendez-vous compact : carte date + titre + lieu et horaires. */
export function LigneEvenement({ e, className, titreNiveau }: { e: Ev; className?: string; titreNiveau?: 2 | 3 }) {
  const Titre = titreNiveau ? (`h${titreNiveau}` as const) : "strong";
  return (
    <Link
      href={`/evenements/${e.slug}`}
      className={cn("carte flex items-center gap-[18px] rounded-[20px] bg-white px-5 py-[18px] text-encre no-underline hover:text-encre", className)}
    >
      <CarteDate date={e.starts_at} libelle={e.date_label} />
      <span>
        <Titre className="block text-lg font-bold leading-tight">{e.titre}</Titre>
        <span className="text-[15px] text-encre-3">
          {e.starts_at ? (
            <>
              <span className="sr-only">{jour(e.starts_at)} · </span>
              {e.lieu} · {plageHoraire(e.starts_at, e.ends_at, e.all_day)}
            </>
          ) : (
            (e.date_label ?? "Date à confirmer")
          )}
        </span>
      </span>
    </Link>
  );
}
