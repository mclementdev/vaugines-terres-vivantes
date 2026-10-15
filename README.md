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
| `npm run db:reset` | Recrée la base locale (migrations + `supabase/seeds/*.sql`) |
| `npm run db:types` | Régénère `src/lib/supabase/types.ts` après une migration |
| `npm run typecheck` | Vérifie les types |
| `npm run lint` | ESLint |
| `npm run build` | Build de production (la base doit être joignable : les pages publiques sont pré-rendues) |

## Administration

- Accès : `/admin`. Connexion par **lien magique** (pas de mot de passe), sans création de compte publique.
- **Premier superadmin** (une seule fois, sur chaque environnement) :

  ```bash
  npm run admin:superadmin -- prenom.nom@exemple.fr "Prénom" "Nom"
  ```

  La personne reçoit un e-mail d'invitation ; elle invite ensuite les autres admins depuis « Comptes & paramètres ».
- En local, les e-mails arrivent dans Mailpit : http://127.0.0.1:54324 (rien ne part réellement).
- **Rôles** : `superadmin` (tout, plus comptes, paramètres, purge des exemples, statuts) ; `admin` (contenus,
  adhérents, newsletter, modération). Contrôlés à trois niveaux : proxy (session), `exigerAdmin()` /
  `exigerSuperadmin()` dans chaque page et action, et RLS Postgres (y compris Storage). Un déclencheur
  empêche un admin de changer un rôle, et il reste toujours au moins un superadmin.
- **Modèles d'e-mails d'authentification** : `supabase/templates/` (appliqués en local par `config.toml`).
  En production, les recopier dans Supabase › Authentication › Email Templates (« Magic Link » et « Invite ») :
  ils pointent vers `/auth/confirm?token_hash=…`.
- Convention : chaque page de `src/app/admin/(espace)/` exporte `instant = false` (back-office toujours
  rendu à la requête) et commence par `await exigerAdmin()`.
- Les textes riches sont nettoyés côté serveur (`sanitize-html`) avant enregistrement ; les images sont
  téléversées directement dans le bucket `medias` (10 Mo max, JPG/PNG/WebP/AVIF) avec un texte alternatif obligatoire.

## Organisation

```
src/app/(public)/      pages publiques (accueil, mentions, données personnelles…)
src/app/actions/       Server Actions publiques (validées par Zod)
src/app/admin/         back-office : connexion, (espace) protégé, actions/ serveur de l'admin
src/components/admin/  éditeur Tiptap, formulaires, menu, tableaux
src/components/site/   en-tête, pied de page, éléments signature (cyprès, village au trait)
src/components/accueil/ sections de la page d'accueil
src/components/ui/     boutons, étiquettes
src/lib/data/          lectures publiques mises en cache ('use cache' + cacheTag)
src/lib/supabase/      clients Supabase (public mis en cache, session, service, navigateur) et types
src/lib/admin/         publication, nettoyage HTML, téléversement, outils de formulaires
scripts/               création du premier superadmin
supabase/migrations/   schéma SQL versionné (RLS)
supabase/seeds/        contenus initiaux, appliqués dans l'ordre (01 contenus, 02 statuts, 03 glossaire et veille) ;
                       exemples fictifs marqués is_sample
```

## Cache et publication

Les pages publiques sont pré-rendues. Chaque lecture de contenu est mise en cache avec le profil
`contenu` (rafraîchi toutes les 5 minutes, ce qui fait apparaître les contenus programmés et
actualise les dates relatives « dans 9 jours ») et une étiquette (`articles`, `evenements`…)
que l'administration invalide à chaque publication.

> **Développement** : si une modification n'apparaît pas (CSS ou module partagé), arrêter `npm run dev`,
> supprimer le dossier `.next` puis relancer. Le cache disque de Turbopack peut manquer certaines modifications.

## Fichiers générés

- `/statuts/statuts-vtv.pdf` : PDF des statuts produit depuis la base (`src/lib/pdf/statuts.tsx`),
  mis en cache et régénéré quand les statuts changent ; il servira aussi de pièce jointe à l'e-mail de bienvenue.
- `/evenements/[slug]/agenda.ics` : fichier agenda (iCalendar) de chaque événement daté.

## Sécurité

- RLS activée partout : le public ne lit que le contenu publié ; aucune écriture directe possible
  avec la clé publique. Les écritures publiques passent par des Server Actions validées (Zod,
  champ piège, limitation de débit).
- Limitation de débit dans Postgres (`hit_rate_limit`) avec des clés HMAC (IP tronquée + navigateur, salées
  par `ANTI_ABUS_SEL`) : aucune adresse IP n'est stockée en clair.
- Les inscriptions publiques de comptes sont désactivées ; les admins sont invités par le superadmin.
- Aucun secret dans le dépôt : `.env.local` est ignoré par git.

Voir aussi [`A_REMPLACER.md`](./A_REMPLACER.md) pour les contenus provisoires à remplacer avant la mise en ligne.
