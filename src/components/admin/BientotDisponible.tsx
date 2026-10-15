import { EnTeteAdmin } from "./ui";

/** Rubrique prévue dans un lot ultérieur. */
export function BientotDisponible({ titre, lot, contenu }: { titre: string; lot: number; contenu: string[] }) {
  return (
    <>
      <EnTeteAdmin titre={titre} />
      <section className="max-w-[720px] rounded-[20px] bg-white px-6 py-6">
        <p className="mb-3 font-bold">Cette rubrique arrive au lot {lot}.</p>
        <ul className="list-disc pl-5 text-encre-2">
          {contenu.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </section>
    </>
  );
}
