"use client";

import { useState } from "react";

/** « Ajouter à mon agenda » (.ics) et « Partager l'événement ». */
export function ActionsEvenement({ slug, titre, url }: { slug: string; titre: string; url: string }) {
  const [message, setMessage] = useState("");

  const partager = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: titre, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setMessage("Lien copié : vous pouvez le coller dans un message.");
      setTimeout(() => setMessage(""), 4000);
    } catch {
      /* partage annulé */
    }
  };

  return (
    <div className="flex flex-col gap-2.5">
      <a href={`/evenements/${slug}/agenda.ics`} className="inline-flex min-h-11 items-center gap-2.5 font-bold">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4M12 13v5M9.5 15.5h5" />
        </svg>
        Ajouter à mon agenda
      </a>
      <button type="button" onClick={partager} className="inline-flex min-h-11 cursor-pointer items-center gap-2.5 font-bold text-terre-fonce hover:text-terre-sombre">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <circle cx="18" cy="5" r="2.5" />
          <circle cx="6" cy="12" r="2.5" />
          <circle cx="18" cy="19" r="2.5" />
          <path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4" />
        </svg>
        Partager l&apos;événement
      </button>
      <p role="status" className="text-sm font-semibold text-olive">
        {message}
      </p>
    </div>
  );
}
