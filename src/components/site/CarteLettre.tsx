import "server-only";

import { connection } from "next/server";
import type { ReactNode } from "react";
import { z } from "zod";

import { serviceClient } from "@/lib/supabase/service";

/** Carte centrée des pages à jeton (lettre, inscription, suivi d'idée). */
export function CarteLettre({ titre, surtitre = "Lettre d'information", children }: { titre: string; surtitre?: string; children: ReactNode }) {
  return (
    <div className="rounded-[28px] bg-white px-6 py-8 md:px-10 md:py-10">
      <p className="mb-2 text-sm font-bold uppercase tracking-[.14em] text-terre-fonce">{surtitre}</p>
      <h1 className="mb-4 font-titre text-[clamp(30px,4vw,44px)] font-semibold leading-[1.08] tracking-[-0.02em] [text-wrap:balance]">{titre}</h1>
      <div className="flex flex-col gap-4 text-encre-2">{children}</div>
    </div>
  );
}

/** « elodie@exemple.fr » → « e•••@exemple.fr » */
export function masquerEmail(email: string) {
  const [local, domaine] = email.split("@");
  return `${local.slice(0, 1)}•••@${domaine}`;
}

/** Abonné correspondant au jeton d'un lien (lecture à la requête, jamais mise en cache). */
export async function abonneParJeton(token: string) {
  await connection();
  if (!z.uuid().safeParse(token).success) return null;
  const { data } = await serviceClient().from("newsletter_subscribers").select("email, status").eq("token", token).maybeSingle();
  return data;
}
