import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Rendu PDF (statuts) exécuté tel quel par Node, hors bundle.
  serverExternalPackages: ["@react-pdf/renderer"],
  experimental: {
    // Photo d'une idée : réduite dans le navigateur (1 600 px), 3 Mo au plus.
    serverActions: { bodySizeLimit: "4mb" },
  },
  cacheLife: {
    // Contenus éditoriaux : rafraîchis toutes les 5 min (contenus programmés,
    // dates relatives « dans 9 jours ») et immédiatement à chaque publication
    // via revalidateTag.
    contenu: { stale: 300, revalidate: 300, expire: 86400 },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [70, 80],
    // En local, le Storage Supabase est sur 127.0.0.1 (adresse bloquée par défaut).
    dangerouslyAllowLocalIP: process.env.NODE_ENV === "development",
    remotePatterns: supabaseUrl
      ? [new URL(`${supabaseUrl}/storage/v1/object/public/**`)]
      : [],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
