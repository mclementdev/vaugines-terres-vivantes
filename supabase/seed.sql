-- Contenus initiaux.
-- Contenus réels : DOC/ (présentation du 7 mars 2026, lettre n°1, statuts).
-- Exemples fictifs des maquettes : is_sample = true (voir A_REMPLACER.md).

-- ---------------------------------------------------------------------------
-- Réglages
-- ---------------------------------------------------------------------------
insert into public.site_settings (id, data) values (1, jsonb_build_object(
  'nom', 'vaugines, terres vivantes',
  'statut_juridique', 'Association loi 1901 — apolitique, non partisane, laïque.',
  'date_creation', '2026-04-19',
  'adresse', jsonb_build_object(
    'lieu', 'Bibliothèque de Vaugines',
    'rue', '84 rue Vieille',
    'code_postal', '84160',
    'commune', 'Vaugines'
  ),
  'email', 'vauginesterresvivantes@gmail.com',
  'virement', jsonb_build_object(
    'titulaire', 'VAUGINES, TERRES VIVANTES',
    'iban', 'FR76 1679 8000 0100 0197 5650 046',
    'bic', 'TRZOFR21XXX'
  ),
  'paiement_en_ligne', false,
  'reseaux', jsonb_build_object('facebook', null, 'instagram', null),
  'chiffres', jsonb_build_object(
    'adherents', jsonb_build_object('valeur', null, 'visible', false),
    'actions', jsonb_build_object('valeur', null, 'visible', true),
    'rendez_vous', jsonb_build_object('valeur', null, 'visible', true),
    'conseil', jsonb_build_object('valeur', null, 'visible', true)
  ),
  'signature_email', 'Le conseil collégial'
));

insert into public.private_settings (id, data) values (1, jsonb_build_object(
  'email_alertes', 'vauginesterresvivantes@gmail.com'
));

-- ---------------------------------------------------------------------------
-- Textes de l'accueil
-- ---------------------------------------------------------------------------
insert into public.home_blocks (key, content) values
('hero', jsonb_build_object(
  'surtitre', 'Association loi 1901 · Vaugines, Luberon · depuis le 19 avril 2026',
  'titre', 'Prenons soin du vivant,',
  'titre_accent', 'ensemble.',
  'texte', 'Une association d''habitants, apolitique et ouverte à toutes et à tous, pour faire vivre le dialogue sur l''avenir de notre village.',
  'note', 'Cotisation libre — vous pouvez aussi adhérer sans cotiser.'
)),
('association', jsonb_build_object(
  'surtitre', 'L''association',
  'titre', 'Prendre soin du vivant à Vaugines, sous toutes ses formes.',
  'paragraphes', jsonb_build_array(
    'Nous sommes attentifs à la vie villageoise, au cadre de vie et à l''urbanisme, à l''environnement et à la biodiversité.',
    'Nous voulons favoriser la solidarité, le bien-être et le bien vivre ensemble — et encourager un vrai débat démocratique sur le développement du village, en dialogue avec la mairie, les collectivités et les acteurs du territoire.'
  ),
  'piliers', jsonb_build_array(
    jsonb_build_object('numero', '01', 'titre', 'Prendre soin du vivant',
      'texte', 'Sous toutes ses formes et dans toute sa diversité, sur le territoire vauginois.',
      'image', '/images/olivier.jpg', 'alt', 'Branche d''olivier au soleil'),
    jsonb_build_object('numero', '02', 'titre', 'Trouver l''équilibre',
      'texte', 'Entre la protection de la nature et les activités humaines qui font notre territoire.',
      'image', '/images/vignes.jpg', 'alt', 'Vignes au pied du Luberon'),
    jsonb_build_object('numero', '03 · et surtout', 'titre', 'Dialoguer et débattre',
      'texte', 'Construire un débat démocratique sur le développement du village, avec toutes et tous.',
      'image', '/images/fontaine.jpg', 'alt', 'La fontaine moussue de Vaugines')
  )
)),
('nom', jsonb_build_object(
  'surtitre', 'Pourquoi ce nom ?',
  'terres', jsonb_build_array(
    'pour l''identité rurale de notre territoire,',
    'pour notre ancrage dans le paysage,',
    'pour le sable de Vaugines, présent dans son architecture.'
  ),
  'vivantes', jsonb_build_array(
    'car Vaugines a gardé son identité et son caractère historique,',
    'par ses projets nés de l''initiative de ses habitants, et leur diversité,',
    'parce que le village saura relever les défis de demain — grâce à sa démocratie participative.'
  )
)),
('gouvernance', jsonb_build_object(
  'surtitre', 'Gouvernance',
  'titre', 'Horizontale et collégiale.',
  'texte', 'Pas de président : un Conseil d''Orientation, composé de coordonnateurs choisis en Assemblée Générale et des responsables de commissions, décide par consensus.',
  'commissions', 'Urbanisme, eau, patrimoine, paysage, énergie, veille démocratique…',
  'titre_conseil', 'Le conseil collégial',
  'note_portraits', 'Portraits à venir (initiales en attendant).'
)),
('idees', jsonb_build_object(
  'surtitre', 'Boîte à idées',
  'titre', 'Et vous, qu''imaginez-vous pour Vaugines ?',
  'texte', 'Proposez, soutenez, commentez. Les idées les plus soutenues sont étudiées en commission.'
)),
('appel', jsonb_build_object(
  'titre', 'Rejoignez-nous.',
  'titre_suite', 'Vaugines a besoin de toutes ses voix.',
  'texte', 'Adhérer, c''est suivre, participer, proposer. Avec ou sans cotisation : c''est vous qui choisissez.',
  'bouton', 'J''adhère en 3 étapes'
)),
('lettre', jsonb_build_object(
  'titre', 'La lettre de l''association',
  'texte', 'Les rendez-vous et nouvelles du village, une fois par mois environ.',
  'mention', 'Désinscription en un clic. Vos données ne sont jamais cédées.'
));

-- ---------------------------------------------------------------------------
-- Conseil collégial (lettre d'information n°1)
-- ---------------------------------------------------------------------------
insert into public.council_members (prenom, nom, position) values
  ('Maëlle', 'Calandra', 1),
  ('Charlotte', 'Clément', 2),
  ('Najib', 'Sassenou', 3),
  ('Félix', 'Blanc', 4),
  ('Danielle', 'Morand', 5);

-- ---------------------------------------------------------------------------
-- Commissions (statuts, art. 10 — liste non exhaustive)
-- ---------------------------------------------------------------------------
insert into public.commissions (slug, nom, position) values
  ('finance', 'Finance', 1),
  ('urbanisme-mobilite-developpement', 'Urbanisme, mobilité et développement', 2),
  ('environnement-ecologie', 'Environnement et écologie', 3),
  ('eau', 'Eau', 4),
  ('patrimoine', 'Patrimoine', 5),
  ('culturelle-sociale', 'Culturelle et sociale', 6),
  ('paysage', 'Paysage', 7),
  ('education', 'Éducation', 8),
  ('energie', 'Énergie', 9),
  ('veille-democratique', 'Veille démocratique', 10);

-- ---------------------------------------------------------------------------
-- Actions 2026 (présentation du 7 mars, lettre n°1)
-- ---------------------------------------------------------------------------
insert into public.actions (slug, titre, periode, resume, image_path, image_alt, position, status, published_at, commission_id) values
  ('balade-decouverte-participative', 'Balade-découverte participative', 'Automne 2026',
   'Redécouvrir Vaugines à pied, ensemble, et partager ce que chacun y voit.',
   '/images/aerien.jpg', 'Vue aérienne de Vaugines', 1, 'published', '2026-04-19 12:00+02', null),
  ('journee-rencontre-habiter-demain', 'Journée-rencontre « Habiter demain »', 'Automne 2026',
   'Comment voulons-nous vivre et nous loger à Vaugines dans dix ans ?',
   '/images/facade.jpg', 'Façades en pierre du village', 2, 'published', '2026-04-19 12:00+02',
   (select id from public.commissions where slug = 'urbanisme-mobilite-developpement')),
  ('reunion-debat-climat', 'Réunion-débat sur le climat', 'En préparation',
   'Des experts pour comprendre le réchauffement climatique à l''échelle de Vaugines.',
   '/images/champ.jpg', 'Champ et collines du Luberon', 3, 'published', '2026-04-19 12:00+02',
   (select id from public.commissions where slug = 'environnement-ecologie')),
  ('deambulation-villageoise', 'Déambulation villageoise', 'Automne–hiver',
   'À partir des archives et photos confiées par les habitants.',
   '/images/fontaine.jpg', 'Fontaine du village', 4, 'published', '2026-04-19 12:00+02',
   (select id from public.commissions where slug = 'patrimoine'));

-- ---------------------------------------------------------------------------
-- Catégories d'actualités
-- ---------------------------------------------------------------------------
insert into public.categories (slug, nom, position) values
  ('association', 'Association', 1),
  ('rencontre', 'Rencontre', 2),
  ('patrimoine', 'Patrimoine', 3),
  ('veille', 'Veille', 4);

-- ---------------------------------------------------------------------------
-- Actualités
-- ---------------------------------------------------------------------------
insert into public.articles (slug, titre, chapeau, cover_path, cover_alt, body_html, category_id, tags, status, published_at, featured, is_sample) values
('statuts-deposes-association-nee',
 'Les statuts sont déposés : l''association est née',
 'Depuis le 19 avril 2026, vaugines, terres vivantes existe officiellement. Une association collégiale, apolitique et ouverte à toutes et à tous.',
 '/images/facade.jpg', 'Maisons de pierre à Vaugines',
 '<p>Merci d''être venus nombreux à la présentation du 7 mars. L''association a déposé ses statuts et existe depuis le <strong>19 avril 2026</strong>.</p>'
 '<h2>Notre objectif</h2>'
 '<p>Prendre soin du vivant à Vaugines sous toutes ses formes et dans toute sa diversité : nous voulons être attentifs à la vie villageoise, au cadre de vie et à l''urbanisme, à l''environnement et à la biodiversité, et favoriser la solidarité, le bien-être et le bien vivre ensemble.</p>'
 '<p>L''association encourage le dialogue, l''échange et la construction d''un débat démocratique concernant le développement du village.</p>'
 '<h2>Deux rendez-vous pour l''automne</h2>'
 '<ul><li>une balade-découverte participative de Vaugines ;</li><li>une journée-rencontre autour du thème « Habiter demain ».</li></ul>'
 '<h2>Nous rejoindre</h2>'
 '<p>Toutes les adhésions sont les bienvenues. Vous pouvez adhérer sans cotiser, ou avec la cotisation de votre choix.</p>',
 (select id from public.categories where slug = 'association'), '{association,statuts}',
 'published', '2026-04-19 18:00+02', true, false),
('retour-presentation-ancienne-ecole',
 'Retour sur la présentation à l''ancienne école',
 'Le 7 mars 2026, nous avons présenté aux habitants le projet d''une nouvelle association pour Vaugines : pourquoi, pour quels objectifs, avec quelle gouvernance et sous quel nom.',
 '/images/village.jpg', 'Le village de Vaugines et ses collines',
 '<p>Merci à toutes celles et ceux qui sont venus à l''ancienne école. Voici l''essentiel de ce que nous avons partagé ce soir-là.</p>'
 '<h2>Une nouvelle association, pour quels objectifs ?</h2>'
 '<p>D''abord, prendre soin du vivant sous toutes ses formes et dans toute sa diversité sur le territoire vauginois. Ensuite, veiller à l''équilibre entre la protection de la nature et le développement des activités humaines qui font notre territoire.</p>'
 '<blockquote><p>« Et surtout : encourager le dialogue et la construction d''un débat démocratique concernant le développement du village. »</p></blockquote>'
 '<h2>Par quels moyens ?</h2>'
 '<ul><li>un état des lieux de l''existant et des projets à venir ;</li><li>la préservation de l''environnement naturel ;</li><li>la cohésion sociale ;</li><li>la veille sur les défis d''aujourd''hui et de demain.</li></ul>'
 '<h2>Pourquoi « terres vivantes » ?</h2>'
 '<p><strong>Terres</strong> pour l''identité rurale, l''ancrage dans le paysage et le sable de Vaugines. <strong>Vivantes</strong> parce que le village a gardé son caractère historique, que ses projets naissent de ses habitants et de leur diversité, et qu''il saura relever les défis de demain grâce à sa démocratie participative.</p>'
 '<h2>Et maintenant ?</h2>'
 '<p>L''association existe depuis le 19 avril 2026. Deux rendez-vous se préparent pour l''automne : une balade-découverte participative et une journée-rencontre « Habiter demain ».</p>',
 (select id from public.categories where slug = 'rencontre'), '{rencontre,association,gouvernance}',
 'published', '2026-03-09 18:00+01', true, false),
('appel-archives-photos',
 'Appel à vos archives et photos de Vaugines',
 'Pour la déambulation villageoise de cet hiver, nous rassemblons les photos et documents anciens que vous voudrez bien nous confier.',
 '/images/fontaine.jpg', 'La fontaine moussue de Vaugines',
 '<p>Cartes postales, photos de famille, de fêtes, de vendanges, de chantiers… Tout ce qui raconte Vaugines nous intéresse.</p>'
 '<h2>Comment nous les confier ?</h2>'
 '<ul><li>à la bibliothèque, aux heures d''ouverture ;</li><li>par e-mail, en version numérisée.</li></ul>'
 '<p>Tout est scanné puis rendu à son propriétaire.</p>',
 (select id from public.categories where slug = 'patrimoine'), '{archives,déambulation}',
 'published', '2026-10-12 09:00+02', true, true);

-- ---------------------------------------------------------------------------
-- Agenda — dates, horaires, lieux et jauges FICTIFS (maquettes)
-- ---------------------------------------------------------------------------
insert into public.events (slug, titre, resume, body_html, starts_at, ends_at, lieu, adresse, latitude, longitude, prix, capacity, programme, accessibilite, ouvert_a_tous, registration_enabled, cover_path, cover_alt, status, published_at, featured, is_sample) values
('balade-decouverte-participative-de-vaugines',
 'Balade-découverte participative de Vaugines',
 'Ouverte à toutes et à tous, adhérents ou non. Prévoir de bonnes chaussures.',
 '<p>Redécouvrir Vaugines à pied, ensemble. Chacun apporte son regard : un lieu qu''il aime, un endroit qui l''inquiète, une histoire à raconter. Nous noterons tout pour nourrir l''état des lieux du village.</p>',
 '2026-10-24 10:00+02', '2026-10-24 12:30+02',
 'Place de la fontaine', 'Place de la fontaine, 84160 Vaugines', 43.7781, 5.4143,
 'Gratuit', 30,
 '[{"heure":"10 h 00","texte":"Accueil à la fontaine, café offert"},{"heure":"10 h 20","texte":"Balade dans le vieux village et les chemins [parcours à préciser]"},{"heure":"12 h 00","texte":"Mise en commun des observations"}]'::jsonb,
 'Parcours en partie en pente et pavé. [Préciser une option courte.]',
 true, true, '/images/aerien.jpg', 'Vaugines vu du ciel', 'published', '2026-09-15 09:00+02', true, true),
('journee-rencontre-habiter-demain',
 'Journée-rencontre « Habiter demain »',
 'Comment voulons-nous vivre et nous loger à Vaugines dans dix ans ?',
 '<p>Une journée d''échanges pour imaginer ensemble l''avenir du logement et de la vie au village.</p>',
 '2026-11-21 09:30+01', '2026-11-21 17:30+01',
 'Salle des fêtes', 'Salle des fêtes, 84160 Vaugines', null, null,
 'Gratuit', 60, '[]'::jsonb, null,
 true, true, '/images/facade.jpg', 'Façades en pierre du village', 'published', '2026-09-15 09:00+02', false, true),
('collecte-photos-anciennes',
 'Collecte de photos anciennes',
 'Apportez vos photos et documents anciens : nous les numérisons sur place et vous les rendons.',
 '<p>Pour la déambulation villageoise, nous numérisons sur place vos photos et documents anciens.</p>',
 '2026-12-12 14:00+01', '2026-12-12 17:00+01',
 'Bibliothèque', 'Bibliothèque de Vaugines, 84 rue Vieille, 84160 Vaugines', null, null,
 'Gratuit', null, '[]'::jsonb, null,
 true, false, '/images/fontaine.jpg', 'La fontaine de Vaugines', 'published', '2026-10-01 09:00+02', false, true);

insert into public.events (slug, titre, resume, date_label, lieu, prix, status, published_at, is_sample) values
('reunion-debat-climat-a-vaugines',
 'Réunion-débat : le climat à Vaugines',
 'Des experts pour comprendre le réchauffement climatique à l''échelle de Vaugines.',
 '2027 · date à confirmer', 'Lieu à confirmer', 'Gratuit', 'published', '2026-10-01 09:00+02', true);

-- ---------------------------------------------------------------------------
-- FAQ (maquettes FAQ et accueil ; réponses entre crochets à valider)
-- ---------------------------------------------------------------------------
insert into public.faq_items (category, question, answer_html, position, show_on_home, home_position, to_validate) values
('association', 'Qu''est-ce que vaugines, terres vivantes ?',
 '<p>Une association loi 1901 créée le 19 avril 2026. Elle veut prendre soin du vivant à Vaugines sous toutes ses formes, être attentive à la vie villageoise, au cadre de vie et à l''environnement, et encourager un débat démocratique sur le développement du village.</p>', 1, false, null, false),
('association', 'L''association est-elle politique ?',
 '<p>Non. Elle est apolitique, non partisane et laïque, ouverte à toutes et à tous.</p>', 2, true, 2, false),
('association', 'Qui dirige l''association ?',
 '<p>Personne seul : la gouvernance est horizontale et collégiale. Un Conseil d''Orientation, composé de coordonnateurs élus en Assemblée Générale et de responsables de commissions, décide par consensus.</p>', 3, false, null, false),
('adherer', 'Comment adhérer ?',
 '<p>En ligne en 3 étapes sur la page <a href="/adherer">Adhérer</a>, ou avec le bulletin papier à déposer à la bibliothèque.</p>', 1, false, null, false),
('adherer', 'Faut-il habiter Vaugines ?',
 '<p>[Réponse à valider par le conseil collégial]</p>', 2, false, null, true),
('adherer', 'Que se passe-t-il après mon adhésion ?',
 '<p>Vous recevez un e-mail de bienvenue avec les statuts, puis des e-mails d''information réguliers sur les rencontres et événements. Selon les statuts, l''Assemblée Générale vote l''adhésion des nouveaux membres.</p>', 3, false, null, false),
('cotisation', 'Combien coûte l''adhésion ?',
 '<p>Le montant est libre. Vous pouvez adhérer sans cotiser, ou verser la cotisation de votre choix par virement. Elle vaut d''une Assemblée Générale à la suivante.</p>', 1, true, 1, false),
('cotisation', 'Combien de temps est valable ma cotisation ?',
 '<p>Une année, d''une Assemblée Générale à la suivante. Un membre à jour de sa cotisation peut voter à l''Assemblée Générale.</p>', 2, false, null, false),
('evenements', 'Faut-il être adhérent pour venir aux événements ?',
 '<p>[Réponse à valider par le conseil collégial — par exemple : la plupart sont ouverts à toutes et à tous, l''inscription aide à prévoir.]</p>', 1, true, 3, true),
('participer', 'Comment rejoindre une commission ?',
 '<p>Écrivez-nous à <a href="mailto:vauginesterresvivantes@gmail.com">vauginesterresvivantes@gmail.com</a> en indiquant le thème qui vous intéresse : finance, urbanisme, environnement, eau, patrimoine, culture, paysage, éducation, énergie, veille démocratique…</p>', 1, true, 4, false),
('participer', 'J''ai des photos anciennes du village, elles vous intéressent ?',
 '<p>Oui ! Elles nourriront la déambulation villageoise à partir des archives et photos confiées par les habitants. Contactez-nous.</p>', 2, false, null, false),
('donnees', 'Que faites-vous de mes données ?',
 '<p>Elles servent uniquement à la gestion des adhésions et à la vie de l''association, ne sont jamais cédées, et vous pouvez demander leur modification ou suppression à tout moment.</p>', 1, false, null, false);

-- ---------------------------------------------------------------------------
-- Boîte à idées — idées FICTIVES (maquettes)
-- ---------------------------------------------------------------------------
insert into public.ideas (slug, titre, description, theme, display_name, moderation, progress, support_count, comment_count, published_at, created_at, is_sample) values
('bancs-ombre-chemin-ecole', 'Des bancs à l''ombre le long du chemin de l''école',
 'Pour que les anciens et les parents puissent faire une pause à mi-chemin, surtout l''été.',
 'cadre_de_vie', 'Anne', 'published', 'etudiee', 23, 4, '2026-09-24 10:00+02', '2026-09-23 18:00+02', true),
('recuperateur-eau-pluie-jardin-partage', 'Un récupérateur d''eau de pluie pour le jardin partagé',
 'Une cuve reliée à la gouttière de la salle des fêtes pour arroser sans puiser dans le réseau.',
 'eau', null, 'published', 'proposee', 17, 2, '2026-10-10 10:00+02', '2026-10-09 20:00+02', true),
('grainotheque-bibliotheque', 'Une grainothèque à la bibliothèque',
 'Déposer et prendre des graines de variétés locales, avec des fiches de semis.',
 'biodiversite', 'Paul', 'published', 'en_projet', 11, 6, '2026-09-15 10:00+02', '2026-09-14 09:00+02', true),
('covoiturage-marche-cucuron', 'Un covoiturage du marché de Cucuron le mardi',
 'Un tableau en ligne et à la bibliothèque pour proposer et trouver des places.',
 'mobilite', null, 'published', 'proposee', 8, 1, '2026-10-14 10:00+02', '2026-10-13 21:00+02', true),
('panneaux-histoire-maisons-vieux-village', 'Des panneaux sur l''histoire des maisons du vieux village',
 'Quelques plaques discrètes avec photos d''archives, à scanner avec un téléphone.',
 'patrimoine', 'Lucie', 'published', 'proposee', 6, 3, '2026-10-13 10:00+02', '2026-10-12 16:00+02', true);

insert into public.ideas (slug, titre, description, theme, display_name, moderation, created_at, is_sample) values
('composteur-collectif-ecole', 'Un composteur collectif près de l''école',
 'Les familles pourraient y déposer leurs épluchures, et l''école utiliser le compost pour son potager.',
 'biodiversite', 'Lucie', 'pending', '2026-10-14 18:00+02', true);

-- ---------------------------------------------------------------------------
-- Teintes (maquette Main) et liens
-- ---------------------------------------------------------------------------
update public.categories set ton = 'terre' where slug = 'association';
update public.categories set ton = 'olive' where slug = 'rencontre';
update public.categories set ton = 'indigo' where slug = 'patrimoine';
update public.categories set ton = 'olive' where slug = 'veille';

update public.actions set ton = 'olive' where slug = 'reunion-debat-climat';
update public.events set all_day = true where slug = 'journee-rencontre-habiter-demain';
update public.actions set ton = 'indigo',
  lien_label = 'Confiez-nous les vôtres',
  lien_href = '/actualites/appel-archives-photos'
  where slug = 'deambulation-villageoise';
