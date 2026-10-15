import { carteDate } from "@/lib/dates";

/** Pavé date de l'agenda : jour en grand, mois abrégé en capitales. */
export function CarteDate({ date, libelle }: { date: string | null; libelle?: string | null }) {
  const { jour, mois } = date
    ? carteDate(date)
    : { jour: "—", mois: libelle?.match(/\d{4}/)?.[0] ?? "à venir" };
  return (
    <span
      className="flex h-[72px] w-[68px] shrink-0 flex-col items-center justify-center rounded-[14px] bg-pierre leading-none"
      aria-hidden="true"
    >
      <span className="font-titre text-[28px] font-semibold text-terre-fonce">{jour}</span>
      <span className="mt-1 text-[13px] font-bold uppercase">{mois}</span>
    </span>
  );
}
