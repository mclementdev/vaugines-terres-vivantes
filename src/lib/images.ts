/**
 * Résout le chemin d'une image de contenu : les images livrées avec le site
 * commencent par « / » (dossier public), les autres sont dans le Storage
 * Supabase (bucket public « medias »).
 */
export function urlImage(chemin: string): string {
  if (chemin.startsWith("/") || chemin.startsWith("http")) return chemin;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/medias/${chemin}`;
}
