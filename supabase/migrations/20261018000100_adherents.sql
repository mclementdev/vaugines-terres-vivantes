-- =============================================================================
-- Lot 4 : adhésions, cotisations, historique, abonnés à la lettre d'information
-- Données personnelles : lecture et écriture réservées aux admins (RLS),
-- suppression (droit à l'effacement) réservée au superadmin. Les écritures
-- publiques passent par des routes serveur (clé secrète), jamais par la clé publique.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Années d'AG : une cotisation vaut d'une Assemblée Générale à la suivante
-- ---------------------------------------------------------------------------
create table public.ag_periods (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  starts_on date not null,
  ends_on date,
  is_current boolean not null default false,
  created_at timestamptz not null default now()
);
comment on table public.ag_periods is 'Années d''AG (ex. 2026–2027). Une seule est « en cours ».';
create unique index ag_periods_une_courante on public.ag_periods (is_current) where is_current;

-- ---------------------------------------------------------------------------
-- Adhérents
-- ---------------------------------------------------------------------------
create type public.member_source as enum ('en_ligne', 'papier');

create table public.members (
  id uuid primary key default gen_random_uuid(),
  prenom text not null check (char_length(prenom) between 1 and 80),
  nom text not null check (char_length(nom) between 1 and 80),
  -- Facultatif pour un bulletin papier (personne sans adresse e-mail).
  email text check (email is null or (char_length(email) <= 254 and email = lower(email))),
  adresse text check (char_length(adresse) <= 200),
  code_postal text check (char_length(code_postal) <= 10),
  commune text check (char_length(commune) <= 80),
  source public.member_source not null default 'en_ligne',
  joined_at timestamptz not null default now(),
  consent_statuts_at timestamptz,
  consent_donnees_at timestamptz,
  -- Date de l'AG qui a validé l'adhésion (null : à valider).
  ag_validated_on date,
  welcome_sent_at timestamptz,
  notes text check (char_length(notes) <= 2000),
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.members is 'Adhérentes et adhérents (données personnelles : admins uniquement).';
create index members_email on public.members (email);
create index members_joined_at on public.members (joined_at desc);
create trigger members_updated_at before update on public.members
  for each row execute function public.set_updated_at();

-- Date de naissance et téléphone : facultatifs, dans une table à part sans
-- lecture directe. Ils ne se lisent que par member_private_read(), qui trace
-- chaque consultation dans l'historique de l'adhérent.
create table public.member_private (
  member_id uuid primary key references public.members (id) on delete cascade,
  birth_date date check (birth_date is null or birth_date between '1900-01-01' and current_date),
  phone text check (phone is null or char_length(phone) <= 30),
  updated_at timestamptz not null default now()
);
comment on table public.member_private is 'Coordonnées sensibles facultatives. Lecture tracée via member_private_read().';
create trigger member_private_updated_at before update on public.member_private
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Cotisations (une par adhérent et par année d'AG)
-- ---------------------------------------------------------------------------
create type public.contribution_mode as enum ('avec', 'sans');
create type public.contribution_status as enum ('attendue', 'payee', 'sans');
create type public.payment_method as enum ('virement', 'especes', 'cheque', 'carte');

create table public.contributions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members (id) on delete cascade,
  period_id uuid not null references public.ag_periods (id) on delete restrict,
  mode public.contribution_mode not null,
  amount_cents integer check (amount_cents is null or amount_cents between 100 and 1000000),
  status public.contribution_status not null,
  payment_method public.payment_method,
  paid_on date,
  last_reminder_at timestamptz,
  reminders_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (member_id, period_id),
  constraint cotisation_coherente check (
    (mode = 'sans' and status = 'sans' and amount_cents is null)
    or (mode = 'avec' and status in ('attendue', 'payee') and amount_cents is not null)
  )
);
create index contributions_period_status on public.contributions (period_id, status);
create trigger contributions_updated_at before update on public.contributions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Historique d'un adhérent (adhésion, e-mails, paiements, consultations…)
-- ---------------------------------------------------------------------------
create table public.member_history (
  id bigint generated always as identity primary key,
  member_id uuid not null references public.members (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  event text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index member_history_member on public.member_history (member_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Lettre d'information : double confirmation, désinscription par jeton
-- ---------------------------------------------------------------------------
create type public.subscriber_status as enum ('pending', 'active', 'unsubscribed');

create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null check (char_length(email) <= 254 and email = lower(email)),
  status public.subscriber_status not null default 'pending',
  -- Jeton des liens de confirmation et de désinscription (aucune donnée lisible).
  token uuid not null unique default gen_random_uuid(),
  source text not null default 'formulaire' check (source in ('formulaire', 'adhesion', 'papier', 'admin')),
  member_id uuid references public.members (id) on delete set null,
  confirmation_sent_at timestamptz,
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.newsletter_subscribers is 'Abonnés à la lettre (admins uniquement).';
create unique index newsletter_subscribers_email on public.newsletter_subscribers (email);
create trigger newsletter_subscribers_updated_at before update on public.newsletter_subscribers
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.ag_periods enable row level security;
alter table public.members enable row level security;
alter table public.member_private enable row level security;
alter table public.contributions enable row level security;
alter table public.member_history enable row level security;
alter table public.newsletter_subscribers enable row level security;

create policy "années d'AG : lecture admins" on public.ag_periods
  for select to authenticated using ((select public.is_admin()));
create policy "années d'AG : écriture superadmin" on public.ag_periods
  for all to authenticated using ((select public.is_superadmin())) with check ((select public.is_superadmin()));

create policy "adhérents : lecture admins" on public.members
  for select to authenticated using ((select public.is_admin()));
create policy "adhérents : ajout admins" on public.members
  for insert to authenticated with check ((select public.is_admin()));
create policy "adhérents : modification admins" on public.members
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "adhérents : suppression superadmin" on public.members
  for delete to authenticated using ((select public.is_superadmin()));

-- Pas de politique de lecture : on passe par member_private_read().
create policy "coordonnées sensibles : ajout admins" on public.member_private
  for insert to authenticated with check ((select public.is_admin()));
create policy "coordonnées sensibles : modification admins" on public.member_private
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "cotisations : lecture admins" on public.contributions
  for select to authenticated using ((select public.is_admin()));
create policy "cotisations : ajout admins" on public.contributions
  for insert to authenticated with check ((select public.is_admin()));
create policy "cotisations : modification admins" on public.contributions
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "cotisations : suppression superadmin" on public.contributions
  for delete to authenticated using ((select public.is_superadmin()));

create policy "historique : lecture admins" on public.member_history
  for select to authenticated using ((select public.is_admin()));
create policy "historique : ajout admins" on public.member_history
  for insert to authenticated with check ((select public.is_admin()) and actor_id = (select auth.uid()));

create policy "abonnés : lecture admins" on public.newsletter_subscribers
  for select to authenticated using ((select public.is_admin()));
create policy "abonnés : ajout admins" on public.newsletter_subscribers
  for insert to authenticated with check ((select public.is_admin()));
create policy "abonnés : modification admins" on public.newsletter_subscribers
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "abonnés : suppression superadmin" on public.newsletter_subscribers
  for delete to authenticated using ((select public.is_superadmin()));

-- ---------------------------------------------------------------------------
-- Lecture tracée des coordonnées sensibles
-- ---------------------------------------------------------------------------
create or replace function public.member_private_read(p_member_id uuid)
returns table (birth_date date, phone text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Réservé aux admins.' using errcode = '42501';
  end if;
  insert into public.member_history (member_id, actor_id, event)
  values (p_member_id, auth.uid(), 'coordonnees_consultees');
  return query
    select mp.birth_date, mp.phone from public.member_private mp where mp.member_id = p_member_id;
end;
$$;
revoke all on function public.member_private_read(uuid) from public, anon;
grant execute on function public.member_private_read(uuid) to authenticated;

-- Écriture des coordonnées sensibles par un admin (la table n'a pas de lecture
-- directe, ce qu'exigerait un upsert soumis à la RLS).
create or replace function public.member_private_write(p_member_id uuid, p_birth_date date, p_phone text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Réservé aux admins.' using errcode = '42501';
  end if;
  insert into public.member_private (member_id, birth_date, phone)
  values (p_member_id, p_birth_date, nullif(trim(p_phone), ''))
  on conflict (member_id) do update set birth_date = excluded.birth_date, phone = excluded.phone;
end;
$$;
revoke all on function public.member_private_write(uuid, date, text) from public, anon;
grant execute on function public.member_private_write(uuid, date, text) to authenticated;

-- Indique seulement si ces champs sont renseignés (pour l'affichage masqué).
create or replace function public.member_private_presence(p_member_id uuid)
returns table (has_birth_date boolean, has_phone boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select mp.birth_date is not null, mp.phone is not null
  from public.member_private mp
  where mp.member_id = p_member_id and public.is_admin();
$$;
revoke all on function public.member_private_presence(uuid) from public, anon;
grant execute on function public.member_private_presence(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Compteur public : nombre d'adhérents de l'année d'AG en cours (aucune donnée nominative)
-- ---------------------------------------------------------------------------
create or replace function public.public_stats()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'adherents', (select count(*) from public.contributions c
                  join public.ag_periods p on p.id = c.period_id and p.is_current
                  join public.members m on m.id = c.member_id and not m.is_sample),
    'actions', (select count(*) from public.actions a
                where public.is_visible(a.status, a.published_at)),
    'rendez_vous', (select count(*) from public.events e
                    where public.is_visible(e.status, e.published_at)
                      and e.starts_at >= now()),
    'conseil', (select count(*) from public.council_members)
  );
$$;

-- ---------------------------------------------------------------------------
-- Purge des exemples : inclut désormais les adhérents et abonnés fictifs
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
  delete from public.newsletter_subscribers where is_sample; get diagnostics c = row_count; n := n || jsonb_build_object('abonnes', c);
  delete from public.members where is_sample; get diagnostics c = row_count; n := n || jsonb_build_object('adherents', c);
  insert into public.audit_log (actor_id, action, detail) values (auth.uid(), 'purge_exemples', n);
  return n;
end;
$$;

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
       + (select count(*) from public.actions where is_sample)
       + (select count(*) from public.newsletter_subscribers where is_sample)
       + (select count(*) from public.members where is_sample))::integer;
$$;

-- ---------------------------------------------------------------------------
-- Vue du CRM : une ligne par adhérent et par année d'AG (RLS des tables appliquée)
-- ---------------------------------------------------------------------------
create view public.adherents_vue with (security_invoker = true) as
select
  m.id, m.prenom, m.nom, m.email, m.adresse, m.code_postal, m.commune, m.source, m.joined_at, m.ag_validated_on, m.is_sample,
  c.id as contribution_id, c.period_id, p.label as periode, p.is_current,
  c.mode, c.status, c.amount_cents, c.payment_method, c.paid_on, c.last_reminder_at, c.reminders_count,
  (select s.status from public.newsletter_subscribers s where s.email = m.email) as lettre
from public.members m
left join public.contributions c on c.member_id = m.id
left join public.ag_periods p on p.id = c.period_id;
comment on view public.adherents_vue is 'CRM des adhésions (admins uniquement, via la RLS des tables).';
revoke all on public.adherents_vue from anon;
