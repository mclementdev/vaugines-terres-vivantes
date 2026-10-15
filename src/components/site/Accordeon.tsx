/** Question / réponse dépliable (details natif : accessible sans JavaScript). */
export function Accordeon({ question, reponseHtml, ouvert = false }: { question: string; reponseHtml: string; ouvert?: boolean }) {
  return (
    <details open={ouvert} className="group rounded-[18px] bg-white px-[18px] py-4 md:px-6 md:py-5">
      <summary className="flex items-start justify-between gap-4 font-bold md:text-lg">
        {question}
        <span className="text-[26px] leading-none text-terre transition-transform group-open:rotate-45" aria-hidden="true">
          +
        </span>
      </summary>
      <div className="prose-vtv mt-3 text-encre-2" dangerouslySetInnerHTML={{ __html: reponseHtml }} />
    </details>
  );
}
