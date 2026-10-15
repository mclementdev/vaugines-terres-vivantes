-- Corrige la politique « chacun modifie son nom » : sa vérification relisait
-- profiles et provoquait une récursion infinie de la RLS. Le rôle est
-- désormais protégé par un déclencheur (seul un superadmin peut le changer).

drop policy if exists "profil : chacun modifie son nom" on public.profiles;

create policy "profil : chacun modifie son nom"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create or replace function public.proteger_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- auth.uid() est nul pour la clé de service et les scripts d'administration.
  if new.role is distinct from old.role and auth.uid() is not null and not public.is_superadmin() then
    raise exception 'Seul un superadmin peut changer un rôle.' using errcode = '42501';
  end if;
  if new.email is distinct from old.email and auth.uid() is not null and not public.is_superadmin() then
    raise exception 'Seul un superadmin peut changer l''e-mail d''un compte.' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger profiles_proteger_role
  before update on public.profiles
  for each row execute function public.proteger_role();
