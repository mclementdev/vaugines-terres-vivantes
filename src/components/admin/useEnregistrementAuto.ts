"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Enregistrement automatique : `enregistrer` est appelé quelques secondes
 * après la dernière modification. Prévient aussi avant de quitter la page
 * avec des changements non enregistrés.
 */
export function useEnregistrementAuto<T>(donnees: T, enregistrer: (d: T) => Promise<boolean>, { actif = true, delai = 3000 } = {}) {
  const [modifie, setModifie] = useState(false);
  const [derniere, setDerniere] = useState<Date | null>(null);
  const [enCours, setEnCours] = useState(false);
  const precedent = useRef(donnees);
  const fn = useRef(enregistrer);

  useEffect(() => {
    fn.current = enregistrer;
  }, [enregistrer]);

  useEffect(() => {
    // Ne réagit qu'à une vraie modification des données (pas au montage ni à un changement de statut).
    if (precedent.current === donnees) return;
    precedent.current = donnees;
    setModifie(true);
    if (!actif) return;
    const t = setTimeout(async () => {
      setEnCours(true);
      const ok = await fn.current(donnees);
      setEnCours(false);
      if (ok) {
        setModifie(false);
        setDerniere(new Date());
      }
    }, delai);
    return () => clearTimeout(t);
  }, [donnees, delai, actif]);

  useEffect(() => {
    if (!modifie) return;
    const avertir = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", avertir);
    return () => window.removeEventListener("beforeunload", avertir);
  }, [modifie]);

  return { modifie, derniere, enCours, marquerEnregistre: () => (setModifie(false), setDerniere(new Date())) };
}

/** « il y a 12 s », mis à jour toutes les 5 secondes. */
export function useIlYa(date: Date | null) {
  const [maintenant, setMaintenant] = useState(() => Date.now());
  useEffect(() => {
    if (!date) return;
    const t = setInterval(() => setMaintenant(Date.now()), 5000);
    return () => clearInterval(t);
  }, [date]);
  if (!date) return null;
  const s = Math.max(0, Math.round((maintenant - date.getTime()) / 1000));
  if (s < 60) return s < 5 ? "à l'instant" : `il y a ${s} s`;
  return `il y a ${Math.round(s / 60)} min`;
}
