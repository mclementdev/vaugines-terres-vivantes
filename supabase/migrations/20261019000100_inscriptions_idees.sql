-- =============================================================================
-- Lot 5 : inscriptions aux événements, boîte à idées (soutiens, commentaires,
-- signalements, suivi), modération.
-- Données personnelles (inscrits, e-mails des auteurs et des suiveurs) : admins
-- uniquement. Les écritures publiques passent par des routes serveur (clé secrète).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Inscriptions aux événements
-- ---------------------------------------------------------------------------
create type public.registration_status as enum ('confirmee', 'annulee');

create table public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  nom text not null check (char_length(nom) between 2 and 120),
  email text not null check (char_length(email) <= 254 and email = lower(email)),
  places integer not null default 1 check (places between 1 and 6),
  status public.registration_status not null default 'confirmee',
  -- Jeton du lien « modifier ou annuler mon inscription ».
  token uuid not null unique default gen_random_uuid(),
  reminder_sent_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, email)
);
comment on table public.event_registrations is 'Inscriptions aux événements (admins uniquement).';
create index event_registrations_event on public.event_registrations (event_id, status);
create trigger event_registrations_updated_at before update on public.event_registrations
  for each row execute function public.set_updated_at();

alter table public.event_registrations enable row level security;
create policy "inscriptions : lecture admins" on public.event_registrations
  for select to authenticated using ((select public.is_admin()));
create policy "inscriptions : modification admins" on public.event_registrations
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "inscriptions : suppression admins" on public.event_registrations
  for delete to authenticated using ((select public.is_admin()));

-- Places prises par événement publié (agrégat seulement, aucune donnée nominative).
create or replace function public.places_prises(p_event_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum(r.places), 0)::integer
  from public.event_registrations r
  join public.events e on e.id = r.event_id
  where r.event_id = p_event_id and r.status = 'confirmee'
    and public.is_visible(e.status, e.published_at);
$$;
revoke all on function public.places_prises(uuid) from public;
grant execute on function public.places_prises(uuid) to anon, authenticated, service_role;

-- Inscription atomique : la jauge ne peut pas être dépassée, même avec des
-- inscriptions simultanées (verrou sur la ligne de l'événement).
-- Résultat : statut = ok | deja | complet | ferme, token, places restantes.
create or replace function public.inscrire_evenement(p_event_id uuid, p_nom text, p_email text, p_places integer)
returns table (statut text, token uuid, restantes integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  e public.events%rowtype;
  prises integer;
  existante public.event_registrations%rowtype;
  deja_connue boolean;
begin
  select * into e from public.events where id = p_event_id for update;
  if not found or not e.registration_enabled or not public.is_visible(e.status, e.published_at)
     or (e.starts_at is not null and coalesce(e.ends_at, e.starts_at) < now()) then
    return query select 'ferme'::text, null::uuid, null::integer;
    return;
  end if;

  select * into existante from public.event_registrations
  where event_id = p_event_id and email = lower(p_email);
  -- FOUND est réécrit par chaque requête : on le mémorise tout de suite.
  deja_connue := found;
  if deja_connue and existante.status = 'confirmee' then
    return query select 'deja'::text, existante.token, null::integer;
    return;
  end if;

  select coalesce(sum(places), 0) into prises from public.event_registrations
  where event_id = p_event_id and status = 'confirmee';
  if e.capacity is not null and prises + p_places > e.capacity then
    return query select 'complet'::text, null::uuid, greatest(e.capacity - prises, 0);
    return;
  end if;

  if deja_connue then
    -- Inscription annulée puis reprise : même ligne, nouveau jeton.
    update public.event_registrations
      set nom = p_nom, places = p_places, status = 'confirmee', cancelled_at = null,
          reminder_sent_at = null, token = gen_random_uuid()
      where id = existante.id
      returning event_registrations.token into existante.token;
  else
    insert into public.event_registrations (event_id, nom, email, places)
      values (p_event_id, p_nom, lower(p_email), p_places)
      returning event_registrations.token into existante.token;
  end if;

  return query select 'ok'::text, existante.token,
    case when e.capacity is null then null else e.capacity - prises - p_places end;
end;
$$;
revoke all on function public.inscrire_evenement(uuid, text, text, integer) from public, anon, authenticated;
grant execute on function public.inscrire_evenement(uuid, text, text, integer) to service_role;

-- Changement du nombre de places par l'inscrit (lien à jeton), sous la même jauge.
create or replace function public.modifier_inscription(p_token uuid, p_places integer)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.event_registrations%rowtype;
  e public.events%rowtype;
  prises integer;
begin
  select * into r from public.event_registrations where token = p_token;
  if not found or r.status <> 'confirmee' then return 'introuvable'; end if;
  select * into e from public.events where id = r.event_id for update;
  if e.starts_at is not null and coalesce(e.ends_at, e.starts_at) < now() then return 'ferme'; end if;
  select coalesce(sum(places), 0) into prises from public.event_registrations
  where event_id = r.event_id and status = 'confirmee' and id <> r.id;
  if e.capacity is not null and prises + p_places > e.capacity then return 'complet'; end if;
  update public.event_registrations set places = p_places where id = r.id;
  return 'ok';
end;
$$;
revoke all on function public.modifier_inscription(uuid, integer) from public, anon, authenticated;
grant execute on function public.modifier_inscription(uuid, integer) to service_role;

-- ---------------------------------------------------------------------------
-- Idées : relecture, jeton de modification par l'auteur
-- ---------------------------------------------------------------------------
alter table public.ideas
  add column moderation_note text check (char_length(moderation_note) <= 1000),
  add column edit_token uuid unique default gen_random_uuid(),
  add column moderated_at timestamptz,
  add column report_count integer not null default 0;
comment on column public.ideas.moderation_note is 'Motif de refus ou modification demandée (envoyé à l''auteur, jamais publié).';

-- Photos des idées : lecture publique (noms aléatoires), écriture par le serveur seulement.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('idees', 'idees', true, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public,
  file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
create policy "photos d'idées : suppression par les admins" on storage.objects
  for delete to authenticated using (bucket_id = 'idees' and (select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Soutiens : une ligne par idée et par votant (clé HMAC d'un cookie aléatoire)
-- ---------------------------------------------------------------------------
create table public.idea_supports (
  idea_id uuid not null references public.ideas (id) on delete cascade,
  voter_key text not null check (char_length(voter_key) = 64),
  created_at timestamptz not null default now(),
  primary key (idea_id, voter_key)
);
alter table public.idea_supports enable row level security;
-- Aucune politique : accès par le serveur (clé secrète) uniquement.

create or replace function public.compter_soutien()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.ideas set support_count = support_count + 1 where id = new.idea_id;
  else
    update public.ideas set support_count = greatest(support_count - 1, 0) where id = old.idea_id;
  end if;
  return null;
end;
$$;
create trigger idea_supports_compteur after insert or delete on public.idea_supports
  for each row execute function public.compter_soutien();

-- ---------------------------------------------------------------------------
-- Commentaires (relus avant publication)
-- ---------------------------------------------------------------------------
create type public.comment_moderation as enum ('pending', 'published', 'rejected');

create table public.idea_comments (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas (id) on delete cascade,
  display_name text check (char_length(display_name) <= 60),
  body text not null check (char_length(body) between 3 and 1500),
  moderation public.comment_moderation not null default 'pending',
  moderation_note text check (char_length(moderation_note) <= 1000),
  report_count integer not null default 0,
  published_at timestamptz,
  moderated_at timestamptz,
  is_sample boolean not null default false,
  created_at timestamptz not null default now()
);
create index idea_comments_idea on public.idea_comments (idea_id, moderation, created_at);
alter table public.idea_comments enable row level security;
create policy "commentaires : admins" on public.idea_comments
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create view public.idea_comments_public
with (security_invoker = false)
as
  select c.id, c.idea_id, c.display_name, c.body, c.published_at
  from public.idea_comments c
  join public.ideas i on i.id = c.idea_id
  where c.moderation = 'published' and i.moderation = 'published';
revoke all on public.idea_comments_public from public;
grant select on public.idea_comments_public to anon, authenticated;

-- Compteur de commentaires publiés (par incréments, comme les soutiens).
create or replace function public.compter_commentaires()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  avant boolean := tg_op <> 'INSERT' and old.moderation = 'published';
  apres boolean := tg_op <> 'DELETE' and new.moderation = 'published';
begin
  if apres and not avant then
    update public.ideas set comment_count = comment_count + 1 where id = new.idea_id;
  elsif avant and not apres then
    update public.ideas set comment_count = greatest(comment_count - 1, 0) where id = old.idea_id;
  end if;
  return null;
end;
$$;
create trigger idea_comments_compteur after insert or update of moderation or delete on public.idea_comments
  for each row execute function public.compter_commentaires();

-- ---------------------------------------------------------------------------
-- Signalements (idée ou commentaire publiés)
-- ---------------------------------------------------------------------------
create table public.idea_reports (
  id bigint generated always as identity primary key,
  idea_id uuid references public.ideas (id) on delete cascade,
  comment_id uuid references public.idea_comments (id) on delete cascade,
  reporter_key text not null check (char_length(reporter_key) = 64),
  motif text check (char_length(motif) <= 500),
  treated_at timestamptz,
  created_at timestamptz not null default now(),
  constraint signalement_une_cible check ((idea_id is null) <> (comment_id is null))
);
create unique index idea_reports_unique on public.idea_reports (coalesce(idea_id, comment_id), reporter_key);
alter table public.idea_reports enable row level security;
create policy "signalements : admins" on public.idea_reports
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create or replace function public.compter_signalements()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.idea_id is not null then
    update public.ideas set report_count = (select count(*) from public.idea_reports r where r.idea_id = new.idea_id and r.treated_at is null) where id = new.idea_id;
  else
    update public.idea_comments set report_count = (select count(*) from public.idea_reports r where r.comment_id = new.comment_id and r.treated_at is null) where id = new.comment_id;
  end if;
  return null;
end;
$$;
create trigger idea_reports_compteur after insert or update of treated_at on public.idea_reports
  for each row execute function public.compter_signalements();

-- ---------------------------------------------------------------------------
-- Suivi d'une idée par e-mail (auteur prévenu d'office ; soutiens volontaires)
-- ---------------------------------------------------------------------------
create table public.idea_followers (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas (id) on delete cascade,
  email text not null check (char_length(email) <= 254 and email = lower(email)),
  token uuid not null unique default gen_random_uuid(),
  created_at timestamptz not null default now(),
  unique (idea_id, email)
);
alter table public.idea_followers enable row level security;
create policy "suivis : lecture admins" on public.idea_followers
  for select to authenticated using ((select public.is_admin()));
create policy "suivis : suppression admins" on public.idea_followers
  for delete to authenticated using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Journal de modération
-- ---------------------------------------------------------------------------
create table public.moderation_log (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles (id) on delete set null,
  idea_id uuid references public.ideas (id) on delete set null,
  comment_id uuid references public.idea_comments (id) on delete set null,
  -- Titre ou extrait conservé pour l'historique, même après suppression.
  libelle text not null,
  action text not null,
  motif text,
  created_at timestamptz not null default now()
);
create index moderation_log_date on public.moderation_log (created_at desc);
alter table public.moderation_log enable row level security;
create policy "journal de modération : lecture admins" on public.moderation_log
  for select to authenticated using ((select public.is_admin()));
create policy "journal de modération : écriture admins" on public.moderation_log
  for insert to authenticated with check ((select public.is_admin()) and actor_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Purge des exemples : commentaires fictifs inclus
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
  delete from public.idea_comments where is_sample; get diagnostics c = row_count; n := n || jsonb_build_object('commentaires', c);
  delete from public.ideas where is_sample; get diagnostics c = row_count; n := n || jsonb_build_object('idees', c);
  delete from public.events where is_sample; get diagnostics c = row_count; n := n || jsonb_build_object('evenements', c);
  delete from public.articles where is_sample; get diagnostics c = row_count; n := n || jsonb_build_object('articles', c);
  delete from public.actions where is_sample; get diagnostics c = row_count; n := n || jsonb_build_object('actions', c);
  delete from public.newsletter_subscribers where is_sample; get diagnostics c = row_count; n := n || jsonb_build_object('abonnes', c);
  delete from public.members where is_sample; get diagnostics c = row_count; n := n || jsonb_build_object('adherents', c);
  insert into public.audit_log (actor_id, action, detail) values (auth.uid(), 'purge_exemples', n);
  return n;
end;
$$;
