"use client";

import "leaflet/dist/leaflet.css";

import { useEffect, useRef, useState } from "react";

/**
 * Carte OpenStreetMap chargée seulement à la demande : aucune requête vers
 * un serveur tiers tant que la personne n'a pas cliqué (cf. page Données
 * personnelles), et un score Lighthouse préservé.
 */
export function CarteOSM({ latitude, longitude, lieu }: { latitude: number; longitude: number; lieu: string }) {
  const [active, setActive] = useState(false);
  const conteneur = useRef<HTMLDivElement>(null);
  const lienOSM = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=17/${latitude}/${longitude}`;

  useEffect(() => {
    if (!active || !conteneur.current) return;
    let carte: import("leaflet").Map | undefined;
    let annule = false;
    import("leaflet").then((L) => {
      if (annule || !conteneur.current) return;
      carte = L.map(conteneur.current, { scrollWheelZoom: false }).setView([latitude, longitude], 16);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">contributeurs OpenStreetMap</a>',
      }).addTo(carte);
      L.circleMarker([latitude, longitude], { radius: 10, color: "#8F3D1E", weight: 3, fillColor: "#B4502A", fillOpacity: 0.9 })
        .addTo(carte)
        .bindTooltip(lieu, { permanent: true, direction: "top", offset: [0, -10] });
    });
    return () => {
      annule = true;
      carte?.remove();
    };
  }, [active, latitude, longitude, lieu]);

  return (
    <div className="flex h-[220px] flex-col overflow-hidden rounded-[18px] bg-pierre">
      {active ? (
        <div ref={conteneur} className="h-full w-full" role="region" aria-label={`Carte : ${lieu}`} />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center text-encre-3">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M12 21s-7-6.2-7-11.5A7 7 0 0119 9.5C19 14.8 12 21 12 21z" />
            <circle cx="12" cy="9.5" r="2.5" />
          </svg>
          <button
            type="button"
            onClick={() => setActive(true)}
            className="cursor-pointer rounded-full bg-white px-4 py-2.5 font-bold text-encre hover:text-terre-fonce"
          >
            Afficher la carte
          </button>
          <span className="text-sm">
            Carte OpenStreetMap ·{" "}
            <a href={lienOSM} target="_blank" rel="noopener noreferrer">
              ouvrir dans un nouvel onglet
            </a>
          </span>
        </div>
      )}
    </div>
  );
}
