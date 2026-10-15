-- Socle : extensions, rôles d'administration, fonctions utilitaires.

create extension if not exists citext with schema extensions;
create extension if not exists unaccent with schema extensions;

-- ---------------------------------------------------------------------------
-- Rôles
-- ---------------------------------------------------------------------------
create type public.admin_role as enum ('superadmin', 'admin');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  prenom text not null default '',
  nom text not null default '',
  role public.admin_role not null default 'admin',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Comptes d''administration. Un utilisateur auth sans profil n''a aucun droit.';

alter table public.profiles enable row level security;

-- Fonctions d'accès : security definer pour éviter la récursion RLS sur profiles.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.profiles p where p.id = (select auth.uid()));
$$;

create or replace function public.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'superadmin'
  );
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.is_superadmin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;
grant execute on function public.is_superadmin() to anon, authenticated, service_role;

create policy "profil : lecture par les admins"
  on public.profiles for select to authenticated
  using ((select public.is_admin()));

create policy "profil : chacun modifie son nom"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()) and role = (select p.role from public.profiles p where p.id = (select auth.uid())));

create policy "profil : gestion par le superadmin"
  on public.profiles for all to authenticated
  using ((select public.is_superadmin()))
  with check ((select public.is_superadmin()));

-- ---------------------------------------------------------------------------
-- Utilitaires
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Statut commun des contenus éditoriaux. Un contenu « published » dont la date
-- de publication est dans le futur est considéré comme programmé.
create type public.content_status as enum ('draft', 'published', 'trashed');

create or replace function public.is_visible(s public.content_status, published_at timestamptz)
returns boolean
language sql
stable
set search_path = ''
as $$
  select s = 'published' and published_at is not null and published_at <= now();
$$;
