# vaugines, terres vivantes — site de l'association

Site de l'association loi 1901 **vaugines, terres vivantes** (Vaugines, 84160, Luberon).

- **Next.js 16** (App Router, Cache Components) + TypeScript + Tailwind CSS 4
- **Supabase** : Postgres (RLS sur toutes les tables), Auth, Storage
- Déploiement **Vercel** (région Paris `cdg1`), base Supabase en région Paris

> Ce README est complété à chaque lot. La checklist de mise en ligne complète arrive au lot 7.

## Démarrer en local

Prérequis : Node 20+, Docker Desktop lancé.

```bash
npm install
npm run db:start          # démarre Supabase en local, applique migrations + seed
npx supabase status       # affiche l'URL et les clés locales
cp .env.example .env.local   # puis y reporter NEXT_PUBLIC_SUPABASE_URL et les clés
npm run dev               # http://localhost:3000
```

Studio (interface de la base) : http://127.0.0.1:54323

### Commandes utiles

| Commande | Rôle |
|---|---|
| `npm run db:reset` | Recrée la base locale (migrations + `supabase/seed.sql`) |
| `npm run db:types` | Régénère `src/lib/supabase/types.ts` après une migration |
| `npm run typecheck` | Vérifie les types |
| `npm run lint` | ESLint |
| `npm run build` | Build de production (la base doit être joignable : les pages publiques sont pré-rendues) |

## Organisation

```
src/app/(public)/      pages publiques (accueil, mentions, données personnelles…)
src/app/actions/       Server Actions (écritures publiques validées par Zod)
src/components/site/   en-tête, pied de page, éléments signature (cyprès, village au trait)
src/components/accueil/ sections de la page d'accueil
src/components/ui/     boutons, étiquettes
src/lib/data/          lectures publiques mises en cache ('use cache' + cacheTag)
src/lib/supabase/      clients Supabase et types générés
supabase/migrations/   schéma SQL versionné (RLS)
supabase/seed.sql      contenus initiaux (réels + exemples fictifs marqués is_sample)
```

## Cache et publication

Les pages publiques sont pré-rendues. Chaque lecture de contenu est mise en cache avec le profil
`contenu` (rafraîchi toutes les 5 minutes, ce qui fait apparaître les contenus programmés et
actualise les dates relatives « dans 9 jours ») et une étiquette (`articles`, `evenements`…)
que l'administration invalide à chaque publication.

## Sécurité

- RLS activée partout : le public ne lit que le contenu publié ; aucune écriture directe possible
  avec la clé publique. Les écritures publiques passent par des Server Actions validées (Zod,
  champ piège, limitation de débit).
- Les inscriptions publiques de comptes sont désactivées ; les admins sont invités par le superadmin.
- Aucun secret dans le dépôt : `.env.local` est ignoré par git.

Voir aussi [`A_REMPLACER.md`](./A_REMPLACER.md) pour les contenus provisoires à remplacer avant la mise en ligne.
