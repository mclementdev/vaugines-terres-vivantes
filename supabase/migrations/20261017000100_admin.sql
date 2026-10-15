-- Lot 3 : administration — médias, comptes, journal, purge des exemples.

-- ---------------------------------------------------------------------------
-- Comptes : e-mail affiché dans « Comptes & paramètres »
-- ---------------------------------------------------------------------------
alter table public.profiles add column email extensions.citext;
alter table public.profiles add column invited_at timestamptz;

-- Il doit toujours rester au moins un superadmin.
create or replace function public.garder_un_superadmin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (tg_op = 'DELETE' and old.role = 'superadmin')
     or (tg_op = 'UPDATE' and old.role = 'superadmin' and new.role <> 'superadmin') then
    if (select count(*) from public.profiles where role = 'superadmin' and id <> old.id) = 0 then
      raise exception 'Il doit rester au moins un superadmin.' using errcode = 'P0001';
    end if;
  end if;
  return coalesce(new, old);
end;
$$;

create trigger profiles_garder_superadmin
  before update or delete on public.profiles
  for each row execute function public.garder_un_superadmin();

-- ---------------------------------------------------------------------------
-- Journal des actions sensibles (comptes, paramètres, purge, suppressions)
-- ---------------------------------------------------------------------------
create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  cible text,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.audit_log enable row level security;
create policy "journal : lecture superadmin" on public.audit_log
  for select to authenticated using ((select public.is_superadmin()));
create policy "journal : écriture admins" on public.audit_log
  for insert to authenticated with check ((select public.is_admin()) and actor_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Médias : bucket public en lecture, écriture réservée aux admins
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('medias', 'medias', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update set public = excluded.public,
  file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "médias : ajout par les admins" on storage.objects
  for insert to authenticated with check (bucket_id = 'medias' and (select public.is_admin()));
create policy "médias : modification par les admins" on storage.objects
  for update to authenticated using (bucket_id = 'medias' and (select public.is_admin()));
create policy "médias : suppression par les admins" on storage.objects
  for delete to authenticated using (bucket_id = 'medias' and (select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Purge des exemples fictifs des maquettes (superadmin, avant mise en ligne)
-- ---------------------------------------------------------------------------
create or replace function public.purger_exemples()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  n jsonb := '{}'::jsonb;
  c integer;
begin
  if not public.is_superadmin() then
    raise exception 'Réservé au superadmin.' using errcode = '42501';
  end if;
  delete from public.veille_items where is_sample; get diagnostics c = row_count; n := n || jsonb_build_object('veille', c);
  delete from public.veille_dossiers where is_sample; get diagnostics c = row_count; n := n || jsonb_build_object('dossiers', c);
  delete from public.ideas where is_sample; get diagnostics c = row_count; n := n || jsonb_build_object('idees', c);
  delete from public.events where is_sample; get diagnostics c = row_count; n := n || jsonb_build_object('evenements', c);
  delete from public.articles where is_sample; get diagnostics c = row_count; n := n || jsonb_build_object('articles', c);
  delete from public.actions where is_sample; get diagnostics c = row_count; n := n || jsonb_build_object('actions', c);
  insert into public.audit_log (actor_id, action, detail) values (auth.uid(), 'purge_exemples', n);
  return n;
end;
$$;
revoke all on function public.purger_exemples() from public, anon;
grant execute on function public.purger_exemples() to authenticated;

-- Nombre d'exemples restants (affiché avant la purge).
create or replace function public.compter_exemples()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select ((select count(*) from public.veille_items where is_sample)
       + (select count(*) from public.veille_dossiers where is_sample)
       + (select count(*) from public.ideas where is_sample)
       + (select count(*) from public.events where is_sample)
       + (select count(*) from public.articles where is_sample)
       + (select count(*) from public.actions where is_sample))::integer;
$$;
revoke all on function public.compter_exemples() from public, anon;
grant execute on function public.compter_exemples() to authenticated;
