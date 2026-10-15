"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";

import { exigerAdmin } from "@/lib/auth";
import { clientSession } from "@/lib/supabase/serveur";

/** Annulation d'une inscription par un admin (sans e-mail : la personne a prévenu autrement). */
export async function annulerInscriptionAdmin(id: string) {
  await exigerAdmin();
  if (!z.uuid().safeParse(id).success) return;
  const supabase = await clientSession();
  const { data } = await supabase
    .from("event_registrations")
    .update({ status: "annulee", cancelled_at: new Date().toISOString() })
    .eq("id", id)
    .select("event_id, events(slug)")
    .single();
  if (!data) return;
  const slug = (data.events as { slug: string } | null)?.slug;
  if (slug) updateTag(`evenement:${slug}`);
  revalidatePath(`/admin/evenements/${data.event_id}`);
}
