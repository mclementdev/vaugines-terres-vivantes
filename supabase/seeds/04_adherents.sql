-- =============================================================================
-- Lot 4 : année d'AG en cours et adhérents FICTIFS de la maquette (is_sample)
-- Ils servent à essayer l'espace « Adhérents » et sont supprimés par la purge
-- « Avant la mise en ligne » (Comptes & paramètres).
-- =============================================================================

insert into public.ag_periods (label, starts_on, is_current)
values ('2026–2027', '2026-04-19', true);

with exemples (prenom, nom, email, joined, mode, montant, statut, paye_le, valide_ag, source) as (
  values
    ('Camille', 'Roux', 'camille.r@exemple.fr', '2026-10-15 09:12+02', 'avec', 3000, 'attendue', null, null, 'en_ligne'),
    ('Jean-Marc', 'Tessier', 'jm.t@exemple.fr', '2026-10-14 18:40+02', 'sans', null, 'sans', null, null, 'en_ligne'),
    ('Sophie', 'Laurent', 'sophie.l@exemple.fr', '2026-10-12 10:05+02', 'avec', 2000, 'payee', '2026-10-13', null, 'en_ligne'),
    ('Marc', 'Laurent', 'marc.l@exemple.fr', '2026-10-12 10:09+02', 'avec', 2000, 'payee', '2026-10-13', null, 'en_ligne'),
    ('Odile', 'Faure', 'odile.f@exemple.fr', '2026-09-28 14:30+02', 'avec', 5000, 'attendue', null, null, 'en_ligne'),
    ('Karim', 'Benali', 'karim.b@exemple.fr', '2026-09-02 11:00+02', 'avec', 1500, 'payee', '2026-09-02', null, 'papier'),
    ('Hélène', 'Martin', 'helene.m@exemple.fr', '2026-04-20 17:20+02', 'avec', 4000, 'payee', '2026-04-22', '2026-06-27', 'en_ligne')
),
ajout as (
  insert into public.members (prenom, nom, email, code_postal, commune, source, joined_at,
                              consent_statuts_at, consent_donnees_at, ag_validated_on, welcome_sent_at, is_sample)
  select prenom, nom, email, '84160', 'Vaugines', source::public.member_source, joined::timestamptz,
         joined::timestamptz, joined::timestamptz, valide_ag::date, joined::timestamptz, true
  from exemples
  returning id, email
)
insert into public.contributions (member_id, period_id, mode, amount_cents, status, payment_method, paid_on)
select a.id, p.id, e.mode::public.contribution_mode, e.montant, e.statut::public.contribution_status,
       case when e.statut = 'payee' then 'virement'::public.payment_method end, e.paye_le::date
from ajout a
join exemples e on e.email = a.email
cross join public.ag_periods p
where p.is_current;

insert into public.member_history (member_id, event, detail, created_at)
select m.id, 'adhesion', jsonb_build_object('source', m.source), m.joined_at
from public.members m where m.is_sample;

insert into public.newsletter_subscribers (email, status, source, member_id, confirmed_at, is_sample)
select m.email, 'active', 'adhesion', m.id, m.joined_at, true
from public.members m
where m.is_sample and m.prenom in ('Camille', 'Sophie', 'Hélène');
