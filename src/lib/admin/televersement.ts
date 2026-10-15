"use client";

import { clientNavigateur } from "@/lib/supabase/navigateur";

const TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX = 10 * 1024 * 1024;

/**
 * Téléverse une image dans le bucket « medias » avec la session de l'admin
 * (la RLS de Storage n'autorise que les admins). Renvoie le chemin et l'URL publique.
 */
export async function televerserImage(fichier: File, dossier: string) {
  if (!TYPES.includes(fichier.type)) throw new Error("Format accepté : JPG, PNG, WebP ou AVIF.");
  if (fichier.size > MAX) throw new Error("Image trop lourde (10 Mo maximum).");
  const ext = fichier.type.split("/")[1].replace("jpeg", "jpg");
  const chemin = `${dossier}/${new Date().getFullYear()}/${crypto.randomUUID()}.${ext}`;
  const supabase = clientNavigateur();
  const { error } = await supabase.storage.from("medias").upload(chemin, fichier, { contentType: fichier.type, cacheControl: "31536000" });
  if (error) throw new Error("Le téléversement a échoué. Réessayez.");
  return { chemin, url: supabase.storage.from("medias").getPublicUrl(chemin).data.publicUrl };
}
