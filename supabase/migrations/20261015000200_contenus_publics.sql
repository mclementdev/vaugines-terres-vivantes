-- Contenus publics affichés sur le site (accueil, actualités, agenda, actions,
-- FAQ, boîte à idées). Lecture publique limitée au publié ; écriture : admins.
-- La colonne is_sample marque les exemples fictifs des maquettes, purgeables
-- en un clic avant la mise en ligne.

-- ---------------------------------------------------------------------------
-- Réglages
-- ---------------------------------------------------------------------------
create table public.site_settings (
  id smallint primary key default 1 check (id = 1),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
comment on table public.site_settings is
  'Réglages publics (coordonnées, virement, réseaux, chiffres). Une seule ligne.';

create table public.private_settings (
  id smallint primary key default 1 check (id = 1),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
comment on table public.private_settings is
  'Réglages réservés aux admins (adresses d''alerte, etc.). Une seule ligne.';

create table public.home_blocks (
  key text primary key,
  content jsonb not null,
  updated_at timestamptz not null default now()
);
comment on table public.home_blocks is 'Textes modifiables de la page d''accueil.';

create table public.council_members (
  id uuid primary key default gen_random_uuid(),
  prenom text not null,
  nom text not null,
  role text,
  photo_path text,
  position smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Commissions et actions
-- ---------------------------------------------------------------------------
create table public.commissions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nom text not null,
  description text,
  position smallint not null default 0,
  status public.content_status not null default 'published',
  published_at timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.actions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  titre text not null,
  periode text not null,
  resume text not null,
  description_html text,
  image_path text,
  image_alt text,
  commission_id uuid references public.commissions (id) on delete set null,
  position smallint not null default 0,
  status public.content_status not null default 'draft',
  published_at timestamptz,
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint actions_image_alt check (image_path is null or coalesce(image_alt, '') <> '')
);

-- ---------------------------------------------------------------------------
-- Actualités
-- ---------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nom text not null,
  position smallint not null default 0
);

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  titre text not null,
  chapeau text not null default '',
  cover_path text,
  cover_alt text,
  cover_caption text,
  body_json jsonb,
  body_html text not null default '',
  category_id uuid references public.categories (id) on delete set null,
  tags text[] not null default '{}',
  status public.content_status not null default 'draft',
  published_at timestamptz,
  featured boolean not null default false,
  newsletter_candidate boolean not null default false,
  author_label text not null default 'Le conseil collégial',
  author_id uuid references public.profiles (id) on delete set null,
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint articles_cover_alt check (cover_path is null or coalesce(cover_alt, '') <> '')
);
create index articles_published_idx on public.articles (published_at desc) where status = 'published';

-- ---------------------------------------------------------------------------
-- Agenda
-- ---------------------------------------------------------------------------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  titre text not null,
  resume text not null default '',
  body_json jsonb,
  body_html text not null default '',
  starts_at timestamptz,
  ends_at timestamptz,
  all_day boolean not null default false,
  date_label text,
  lieu text not null default '',
  adresse text,
  latitude double precision,
  longitude double precision,
  prix text not null default 'Gratuit',
  capacity integer check (capacity is null or capacity > 0),
  programme jsonb not null default '[]'::jsonb,
  accessibilite text,
  infos_pratiques text,
  ouvert_a_tous boolean not null default true,
  registration_enabled boolean not null default false,
  cover_path text,
  cover_alt text,
  status public.content_status not null default 'draft',
  published_at timestamptz,
  featured boolean not null default false,
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_dates check (ends_at is null or starts_at is null or ends_at >= starts_at),
  constraint events_cover_alt check (cover_path is null or coalesce(cover_alt, '') <> ''),
  constraint events_date_or_label check (starts_at is not null or coalesce(date_label, '') <> '')
);
comment on column public.events.date_label is
  'Libellé affiché quand la date n''est pas encore fixée (ex. « 2027 · date à confirmer »).';
create index events_starts_idx on public.events (starts_at);

-- ---------------------------------------------------------------------------
-- FAQ
-- ---------------------------------------------------------------------------
create type public.faq_category as enum
  ('association', 'adherer', 'cotisation', 'evenements', 'participer', 'donnees');

create table public.faq_items (
  id uuid primary key default gen_random_uuid(),
  category public.faq_category not null,
  question text not null,
  answer_html text not null,
  position smallint not null default 0,
  show_on_home boolean not null default false,
  home_position smallint,
  to_validate boolean not null default false,
  status public.content_status not null default 'published',
  published_at timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Boîte à idées (complétée au lot 5 : soutiens, commentaires, signalements)
-- ---------------------------------------------------------------------------
create type public.idea_theme as enum
  ('cadre_de_vie', 'eau', 'biodiversite', 'mobilite', 'patrimoine', 'energie', 'vivre_ensemble');
create type public.idea_moderation as enum ('pending', 'changes_requested', 'published', 'rejected');
create type public.idea_progress as enum ('proposee', 'etudiee', 'en_projet', 'realisee');

create table public.ideas (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  titre text not null check (char_length(titre) between 3 and 90),
  description text not null,
  theme public.idea_theme not null,
  photo_path text,
  display_name text,
  author_email extensions.citext,
  moderation public.idea_moderation not null default 'pending',
  progress public.idea_progress not null default 'proposee',
  support_count integer not null default 0,
  comment_count integer not null default 0,
  published_at timestamptz,
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on column public.ideas.display_name is 'Prénom affiché ; null = idée anonyme.';
comment on column public.ideas.author_email is 'Jamais affiché ni exposé publiquement.';

-- Vue publique : sans l'e-mail de l'auteur.
create view public.ideas_public
with (security_invoker = false)
as
  select id, slug, titre, description, theme, photo_path, display_name, progress,
         support_count, comment_count, published_at, is_sample
  from public.ideas
  where moderation = 'published' and published_at is not null and published_at <= now();

revoke all on public.ideas_public from public;
grant select on public.ideas_public to anon, authenticated;

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------
create trigger site_settings_updated_at before update on public.site_settings
  for each row execute function public.set_updated_at();
create trigger private_settings_updated_at before update on public.private_settings
  for each row execute function public.set_updated_at();
create trigger home_blocks_updated_at before update on public.home_blocks
  for each row execute function public.set_updated_at();
create trigger council_members_updated_at before update on public.council_members
  for each row execute function public.set_updated_at();
create trigger commissions_updated_at before update on public.commissions
  for each row execute function public.set_updated_at();
create trigger actions_updated_at before update on public.actions
  for each row execute function public.set_updated_at();
create trigger articles_updated_at before update on public.articles
  for each row execute function public.set_updated_at();
create trigger events_updated_at before update on public.events
  for each row execute function public.set_updated_at();
create trigger faq_items_updated_at before update on public.faq_items
  for each row execute function public.set_updated_at();
create trigger ideas_updated_at before update on public.ideas
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.site_settings enable row level security;
alter table public.private_settings enable row level security;
alter table public.home_blocks enable row level security;
alter table public.council_members enable row level security;
alter table public.commissions enable row level security;
alter table public.actions enable row level security;
alter table public.categories enable row level security;
alter table public.articles enable row level security;
alter table public.events enable row level security;
alter table public.faq_items enable row level security;
alter table public.ideas enable row level security;

-- Toujours publics
create policy "réglages : lecture publique" on public.site_settings
  for select to anon, authenticated using (true);
create policy "accueil : lecture publique" on public.home_blocks
  for select to anon, authenticated using (true);
create policy "conseil : lecture publique" on public.council_members
  for select to anon, authenticated using (true);
create policy "catégories : lecture publique" on public.categories
  for select to anon, authenticated using (true);

-- Publics une fois publiés
create policy "commissions : lecture du publié" on public.commissions
  for select to anon, authenticated using (public.is_visible(status, published_at));
create policy "actions : lecture du publié" on public.actions
  for select to anon, authenticated using (public.is_visible(status, published_at));
create policy "articles : lecture du publié" on public.articles
  for select to anon, authenticated using (public.is_visible(status, published_at));
create policy "événements : lecture du publié" on public.events
  for select to anon, authenticated using (public.is_visible(status, published_at));
create policy "faq : lecture du publié" on public.faq_items
  for select to anon, authenticated using (public.is_visible(status, published_at));
-- ideas : pas de lecture directe publique (e-mail de l'auteur) ; passer par ideas_public.

-- Admins : tout
create policy "réglages : admins" on public.site_settings
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "réglages privés : admins" on public.private_settings
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "accueil : admins" on public.home_blocks
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "conseil : admins" on public.council_members
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "commissions : admins" on public.commissions
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "actions : admins" on public.actions
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "catégories : admins" on public.categories
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "articles : admins" on public.articles
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "événements : admins" on public.events
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "faq : admins" on public.faq_items
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "idées : admins" on public.ideas
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Chiffres publics de l'accueil (étendu au lot 4 avec les adhérents)
-- ---------------------------------------------------------------------------
create or replace function public.public_stats()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'adherents', null,
    'actions', (select count(*) from public.actions a
                where public.is_visible(a.status, a.published_at)),
    'rendez_vous', (select count(*) from public.events e
                    where public.is_visible(e.status, e.published_at)
                      and e.starts_at >= now()),
    'conseil', (select count(*) from public.council_members)
  );
$$;
revoke all on function public.public_stats() from public;
grant execute on function public.public_stats() to anon, authenticated, service_role;
