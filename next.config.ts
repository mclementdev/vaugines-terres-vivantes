import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Rendu PDF (statuts) exécuté tel quel par Node, hors bundle.
  serverExternalPackages: ["@react-pdf/renderer"],
  cacheLife: {
    // Contenus éditoriaux : rafraîchis toutes les 5 min (contenus programmés,
    // dates relatives « dans 9 jours ») et immédiatement à chaque publication
    // via revalidateTag.
    contenu: { stale: 300, revalidate: 300, expire: 86400 },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [70, 80],
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
