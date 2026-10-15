-- =============================================================================
-- Lot 5 : exemples FICTIFS (supprimés avec leurs événements et idées par la
-- purge « Avant la mise en ligne »).
-- =============================================================================

-- 18 places prises sur 30 pour la balade (comme la maquette).
insert into public.event_registrations (event_id, nom, email, places, created_at)
select e.id, v.nom, v.email, v.places, now() - (v.jours || ' days')::interval
from public.events e
cross join (values
  ('Camille Roux', 'camille.r@exemple.fr', 2, 6),
  ('Famille Tessier', 'jm.t@exemple.fr', 4, 5),
  ('Sophie Laurent', 'sophie.l@exemple.fr', 2, 4),
  ('Odile Faure', 'odile.f@exemple.fr', 1, 3),
  ('Karim Benali', 'karim.b@exemple.fr', 3, 2),
  ('Hélène Martin', 'helene.m@exemple.fr', 2, 2),
  ('Anne Morel', 'anne.m@exemple.fr', 4, 1)
) as v (nom, email, places, jours)
where e.slug = 'balade-decouverte-participative-de-vaugines';

-- Commentaires : deux publiés, un en attente de relecture.
insert into public.idea_comments (idea_id, display_name, body, moderation, published_at, created_at, is_sample)
select i.id, v.nom, v.texte, v.etat::public.comment_moderation,
       case when v.etat = 'published' then now() - (v.jours || ' days')::interval end,
       now() - (v.jours || ' days')::interval, true
from public.ideas i
join (values
  ('bancs-ombre-chemin-ecole', 'Marie', 'Oui ! Surtout entre la place et l''école, il n''y a aucune ombre en juin.', 'published', 12),
  ('bancs-ombre-chemin-ecole', null, 'Un banc près du lavoir serait parfait, il y a déjà un platane.', 'published', 9),
  ('grainotheque-bibliotheque', 'Jacques', 'Je peux apporter des graines de tomates anciennes de mon jardin.', 'pending', 1)
) as v (slug, nom, texte, etat, jours) on v.slug = i.slug;

-- Les compteurs des idées fictives restent ceux de la maquette.
update public.ideas set comment_count = 4 where slug = 'bancs-ombre-chemin-ecole';
