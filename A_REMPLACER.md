# Contenus à remplacer ou à valider avant la mise en ligne

Liste tenue à jour à chaque lot. Les exemples fictifs des maquettes sont en base avec
`is_sample = true` : le superadmin les supprime en un clic dans « Comptes & paramètres › Avant la mise en ligne ».

## À fournir

| Élément | Où | Remarque |
|---|---|---|
| Numéro RNA de l'association | Mentions légales | Format `W84…` (récépissé de déclaration) |
| Direction de la publication | Mentions légales | Nom d'une ou d'un coordonnateur général |
| Crédits photographiques | Mentions légales | Auteurs des photos du village |
| Adresses Facebook / Instagram | Comptes & paramètres | Icônes masquées tant qu'elles sont vides |
| Nombre d'adhérents affiché | Paramètres | Compteur masqué ; calculé automatiquement au lot 4 |
| Photos haute définition | Médias | `aerien` (886 px), `facade` (932 px), `fontaine` (997 px), `olivier` (847 px) sont justes pour un affichage large ; `aerien` sert de fond à la page événement |
| Portraits du conseil collégial | Conseil | Initiales affichées en attendant (téléversement des portraits à prévoir) |
| Photo de l'en-tête de l'accueil | Fichier `public/images/village.jpg` | Non modifiable depuis l'admin (choix technique : image optimisée au build) ; les 3 photos des piliers le sont |
| Date de validation de la page « Données personnelles » | Page Données personnelles | Après relecture par le conseil |

## Exemples fictifs (maquettes) — `is_sample = true`

| Contenu | Détail |
|---|---|
| Événements | Balade-découverte (24 oct., 10 h, place de la fontaine, 30 places), « Habiter demain » (21 nov., salle des fêtes, 60 places), collecte de photos (12 déc., bibliothèque), débat climat (2027) : **dates, horaires, lieux, jauges et coordonnées GPS fictifs** |
| Programme et accessibilité de la balade | `[parcours à préciser]`, `[Préciser une option courte.]` |
| Article « Appel à vos archives et photos » | Date de publication fictive (12 oct.) |
| Idées de la boîte à idées | 5 idées publiées + 1 en attente, avec soutiens et commentaires fictifs |
| Veille | Dossier « réchauffement climatique » (texte du dossier entre crochets) et 6 fiches : **dates et sources fictives** (`[Arrêté préfectoral]`…), sans lien |

## Glossaire à valider (`to_validate = true`)

Les 11 définitions reprises de la maquette sont provisoires : la mention « Définitions provisoires » disparaît quand toutes sont validées.

## Statuts

Le texte est repris **mot pour mot** du PDF signé (aucune correction du fond, puisqu'il s'agit du texte déposé). Coquilles relevées, à corriger seulement lors d'une prochaine AGE (art. 17) :

- art. 2 : « bien être » → « bien-être » ; « alentours » → « alentour » ; « acteurs et actrices intervenants » → « intervenant »
- art. 10 : « Le Conseil d'Orientation […] se réunissent » → « se réunit » ; « au moins de la moitié » → « au moins la moitié »
- art. 6 : « renouvelable » → « renouvelables »

Signature : le PDF indique « I-Charlotte Clément » ; le site affiche « Charlotte Clément » (à confirmer).

## Réponses de FAQ à valider (`to_validate = true`)

- « Faut-il habiter Vaugines ? »
- « Faut-il être adhérent pour venir aux événements ? »

## À confirmer par l'association

- Vocabulaire : « conseil collégial » (maquettes, lettre n°1) ou « conseil d'orientation » (courrier de bienvenue, statuts) pour la signature des e-mails.
- Calendrier du débat climat : « printemps-été 2026 » dans la présentation du 7 mars, « en préparation / 2027 » dans les maquettes (repris).
- Glossaire : « Éco-terrorisme » n'est **pas** importé, en attente de l'accord de l'auteur du brief.
- Libellé du compteur « rendez-vous cet automne » remplacé par « rendez-vous à venir » (calculé automatiquement).
