-- Glossaire : définitions de la maquette, provisoires (to_validate = true),
-- à relire par le conseil collégial. « Éco-terrorisme » volontairement absent
-- (en attente de confirmation par l'auteur du brief).

insert into public.glossary_terms (slug, terme, categorie, definition, voir_aussi) values
('agriculture-biologique', 'Agriculture biologique', 'agriculture',
 'Mode de production qui exclut les pesticides et engrais chimiques de synthèse et les OGM. Il est encadré par un cahier des charges européen et contrôlé (label AB).',
 '{agriculture-raisonnee}'),
('agriculture-raisonnee', 'Agriculture raisonnée', 'agriculture',
 'Approche qui cherche à limiter l’usage des produits chimiques en les adaptant aux besoins réels des cultures, sans les interdire. Moins exigeante que le bio.',
 '{agriculture-biologique}'),
('assemblee-generale', 'Assemblée générale', 'association',
 'Réunion annuelle de tous les membres. Elle approuve les comptes, élit le Conseil d’Orientation et fixe les cotisations.',
 '{conseil-d-orientation}'),
('biodiversite', 'Biodiversité', 'environnement',
 'Diversité du vivant : espèces animales et végétales, milieux naturels et liens qui les unissent.',
 '{}'),
('consensus', 'Consensus', 'democratie',
 'Décision largement approuvée qui ne rencontre pas d’opposition forte, construite collectivement sans passer par un vote.',
 '{consentement}'),
('consentement', 'Consentement', 'democratie',
 'Une personne peut ne pas être d’accord mais choisir de ne pas bloquer une décision, en exprimant son désaccord à titre personnel.',
 '{consensus}'),
('conseil-d-orientation', 'Conseil d’Orientation', 'association',
 'Organe qui anime l’association : coordonnateurs généraux élus en AG et responsables de commissions. Il décide par consensus.',
 '{assemblee-generale,consensus}'),
('democratie-participative', 'Démocratie participative', 'democratie',
 'Ensemble de pratiques qui associent les habitants aux décisions publiques, au-delà du seul vote aux élections.',
 '{consensus}'),
('loi-1901', 'Loi 1901', 'association',
 'Loi du 1er juillet 1901 qui encadre les associations à but non lucratif en France.',
 '{assemblee-generale}'),
('plu', 'PLU', 'democratie',
 'Plan local d’urbanisme : document qui fixe les règles de construction et d’usage des sols sur la commune.',
 '{democratie-participative}'),
('laicite', 'Laïcité', 'association',
 'Principe de neutralité à l’égard des religions : l’association accueille chacun quelles que soient ses convictions.',
 '{loi-1901}');

-- ---------------------------------------------------------------------------
-- Veille — dossier et fiches FICTIFS (maquette)
-- ---------------------------------------------------------------------------
insert into public.articles (slug, titre, chapeau, cover_path, cover_alt, body_html, category_id, tags, status, published_at, is_sample) values
('dossier-rechauffement-climatique-vaugines',
 'Le réchauffement climatique, à l''échelle de Vaugines',
 'Eau, cultures, chaleur dans le village : nous rassemblons les données et les questions avant la réunion-débat avec des experts.',
 '/images/champ.jpg', 'Champs et collines du Luberon',
 '<p>[Texte du dossier à rédiger par la commission environnement et écologie.]</p><h2>Ce que nous savons</h2><p>[…]</p><h2>Les questions que nous poserons aux experts</h2><ul><li>[…]</li></ul>',
 (select id from public.categories where slug = 'veille'), '{climat,eau,veille}',
 'published', '2026-10-05 09:00+02', true);

insert into public.veille_dossiers (slug, titre, intro, image_path, image_alt, article_id, featured, status, published_at, is_sample) values
('rechauffement-climatique',
 'Le réchauffement climatique, à l''échelle de Vaugines',
 'Eau, cultures, chaleur dans le village : nous rassemblons les données et les questions avant la réunion-débat avec des experts.',
 '/images/champ.jpg', 'Champs et collines du Luberon',
 (select id from public.articles where slug = 'dossier-rechauffement-climatique-vaugines'),
 true, 'published', '2026-10-05 09:00+02', true);

insert into public.veille_items (theme, titre, resume, source_label, date_info, dossier_id, status, published_at, is_sample) values
('eau', 'Restrictions d’eau : ce qui s’applique à Vaugines',
 'Les niveaux d’alerte sécheresse, ce qu’ils changent pour les jardins, les piscines et l’agriculture.',
 '[Arrêté préfectoral]', '2026-10-08', (select id from public.veille_dossiers where slug = 'rechauffement-climatique'), 'published', '2026-10-08 09:00+02', true),
('urbanisme', 'Le plan local d’urbanisme, comment ça marche ?',
 'Qui décide de ce qui se construit, quand peut-on donner son avis, et où trouver les documents.',
 '[Site de la commune]', '2026-10-01', null, 'published', '2026-10-01 09:00+02', true),
('environnement', 'Biodiversité dans le Parc du Luberon : les espèces à surveiller',
 'Ce que les relevés disent des oiseaux, des insectes pollinisateurs et des haies.',
 '[Parc naturel régional]', '2026-09-24', (select id from public.veille_dossiers where slug = 'rechauffement-climatique'), 'published', '2026-09-24 09:00+02', true),
('energie', 'Panneaux solaires sur les toits anciens : ce qui est permis',
 'Les règles en secteur patrimonial et les alternatives possibles.',
 '[Architecte des Bâtiments de France]', '2026-09-17', null, 'published', '2026-09-17 09:00+02', true),
('democratie_locale', 'Assister au conseil municipal : mode d’emploi',
 'Les séances sont publiques : dates, ordre du jour, comptes rendus.',
 '[Mairie de Vaugines]', '2026-09-10', null, 'published', '2026-09-10 09:00+02', true),
('environnement', 'Feux de forêt : les obligations de débroussaillement',
 'Qui est concerné, sur quelle distance, et à quelle période.',
 '[Préfecture]', '2026-09-03', (select id from public.veille_dossiers where slug = 'rechauffement-climatique'), 'published', '2026-09-03 09:00+02', true);
