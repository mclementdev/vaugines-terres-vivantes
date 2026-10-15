-- Lot 2 : statuts, glossaire, veille, signalements et limitation de débit.

-- ---------------------------------------------------------------------------
-- Statuts (texte intégral, un enregistrement par article)
-- ---------------------------------------------------------------------------
create table public.statuts_articles (
  numero smallint primary key check (numero > 0),
  titre text not null,
  body_html text not null,
  updated_at timestamptz not null default now()
);
comment on table public.statuts_articles is
  'Texte intégral des statuts. Ne se modifie qu''après une AGE (art. 17).';

-- ---------------------------------------------------------------------------
-- Glossaire
-- ---------------------------------------------------------------------------
create type public.glossary_category as enum ('democratie', 'environnement', 'agriculture', 'association');

create table public.glossary_terms (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  terme text not null,
  categorie public.glossary_category not null,
  definition text not null,
  voir_aussi text[] not null default '{}',
  to_validate boolean not null default true,
  status public.content_status not null default 'published',
  published_at timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on column public.glossary_terms.voir_aussi is 'Slugs d''autres termes du glossaire.';

-- ---------------------------------------------------------------------------
-- Veille
-- ---------------------------------------------------------------------------
create type public.veille_theme as enum ('environnement', 'urbanisme', 'eau', 'energie', 'democratie_locale');

create table public.veille_dossiers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  titre text not null,
  intro text not null,
  image_path text,
  image_alt text,
  article_id uuid references public.articles (id) on delete set null,
  featured boolean not null default false,
  status public.content_status not null default 'draft',
  published_at timestamptz,
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint veille_dossiers_image_alt check (image_path is null or coalesce(image_alt, '') <> '')
);

create table public.veille_items (
  id uuid primary key default gen_random_uuid(),
  theme public.veille_theme not null,
  titre text not null,
  resume text not null,
  source_label text not null,
  source_url text,
  date_info date,
  dossier_id uuid references public.veille_dossiers (id) on delete set null,
  status public.content_status not null default 'draft',
  published_at timestamptz,
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index veille_items_published_idx on public.veille_items (published_at desc) where status = 'published';

-- « Signaler une info » : file privée, lue par les admins.
create table public.veille_reports (
  id uuid primary key default gen_random_uuid(),
  message text not null check (char_length(message) between 10 and 2000),
  url text check (url is null or char_length(url) <= 500),
  email extensions.citext,
  treated_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Limitation de débit (écritures publiques). Clés hachées : aucune IP en clair.
-- ---------------------------------------------------------------------------
create table public.rate_limits (
  key text not null,
  window_start timestamptz not null,
  hits integer not null default 1,
  primary key (key, window_start)
);

create or replace function public.hit_rate_limit(p_key text, p_window_seconds integer, p_max integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_start timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  v_hits integer;
begin
  insert into public.rate_limits as r (key, window_start) values (p_key, v_start)
  on conflict (key, window_start) do update set hits = r.hits + 1
  returning hits into v_hits;
  -- Ménage opportuniste des fenêtres expirées.
  delete from public.rate_limits where window_start < now() - interval '2 days';
  return v_hits <= p_max;
end;
$$;
revoke all on function public.hit_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.hit_rate_limit(text, integer, integer) to service_role;

-- ---------------------------------------------------------------------------
-- updated_at, RLS
-- ---------------------------------------------------------------------------
create trigger statuts_articles_updated_at before update on public.statuts_articles
  for each row execute function public.set_updated_at();
create trigger glossary_terms_updated_at before update on public.glossary_terms
  for each row execute function public.set_updated_at();
create trigger veille_dossiers_updated_at before update on public.veille_dossiers
  for each row execute function public.set_updated_at();
create trigger veille_items_updated_at before update on public.veille_items
  for each row execute function public.set_updated_at();

alter table public.statuts_articles enable row level security;
alter table public.glossary_terms enable row level security;
alter table public.veille_dossiers enable row level security;
alter table public.veille_items enable row level security;
alter table public.veille_reports enable row level security;
alter table public.rate_limits enable row level security;

create policy "statuts : lecture publique" on public.statuts_articles
  for select to anon, authenticated using (true);
create policy "glossaire : lecture du publié" on public.glossary_terms
  for select to anon, authenticated using (public.is_visible(status, published_at));
create policy "dossiers : lecture du publié" on public.veille_dossiers
  for select to anon, authenticated using (public.is_visible(status, published_at));
create policy "veille : lecture du publié" on public.veille_items
  for select to anon, authenticated using (public.is_visible(status, published_at));

-- Statuts : modifiables par le superadmin seulement.
create policy "statuts : superadmin" on public.statuts_articles
  for all to authenticated using ((select public.is_superadmin())) with check ((select public.is_superadmin()));
create policy "glossaire : admins" on public.glossary_terms
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "dossiers : admins" on public.veille_dossiers
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "veille : admins" on public.veille_items
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "signalements veille : admins" on public.veille_reports
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
-- rate_limits : aucune politique, accessible uniquement via la fonction (service_role).
