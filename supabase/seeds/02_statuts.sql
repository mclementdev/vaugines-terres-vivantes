-- Statuts de l'association : texte intégral repris mot pour mot de
-- DOC/votre-adhésion-vtv-MC.pdf (pages 3 à 5), sans retouche du fond.
-- Seules la typographie (apostrophes, espaces) et les liens vers le
-- glossaire (<a class="terme">) sont ajoutés.

insert into public.statuts_articles (numero, titre, body_html) values
(1, 'Dénomination', $$<p>L’association Vauginoise, ci-après « Vaugines, terres vivantes » est une association apolitique et <a class="terme" href="/glossaire#laicite">laïque</a> déclarée, régie par la <a class="terme" href="/glossaire#loi-1901">loi du 1er juillet 1901</a> (<a href="https://www.legifrance.gouv.fr/loda/id/LEGITEXT000006069570/" rel="noopener noreferrer" target="_blank">Légifrance<span class="sr-only"> (nouvelle fenêtre)</span></a>).</p>$$),

(2, 'Objet', $$<p>L’Association se fixe pour objectif de prendre soin du vivant à Vaugines sous toutes ses formes et dans toute sa diversité : elle se veut engagée et attentive à la vie villageoise, à son cadre de vie et son urbanisme, à l’environnement et à sa <a class="terme" href="/glossaire#biodiversite">biodiversité</a>. Elle veille à favoriser la solidarité, le bien être et le bien vivre ensemble à travers des activités autour de ces objectifs.</p>
<p>L’Association encourage le dialogue, l’échange et la construction d’un débat démocratique concernant le développement du village en se posant comme interlocutrice de la mairie, des collectivités locales alentours et des acteurs et actrices intervenants sur le territoire vauginois et à proximité.</p>$$),

(3, 'Siège', $$<p>L’Association a son siège social à Vaugines, Bibliothèque de Vaugines, 84, rue Vieille 84160 Vaugines.</p>
<p>Il pourra être transféré par simple décision du <a class="terme" href="/glossaire#conseil-d-orientation">Conseil d’Orientation</a>.</p>$$),

(4, 'Durée', $$<p>La durée de l’Association est illimitée.</p>$$),

(5, 'Moyens', $$<p>Les moyens d’action de l’Association sont les moyens légaux dévolus aux associations régies par la loi du 1er juillet 1901.</p>
<p>L’association peut, en particulier :</p>
<ul>
<li>Développer des collaborations ou des partenariats avec les associations, sociétés, organismes publics ou privés poursuivant les mêmes buts ;</li>
<li>Organiser des conférences, des sorties thématiques des rencontres et des expositions publiques, publier des communiqués de presse, bulletins, brochures, livres, sous toutes les formes ;</li>
<li>Inciter à la création de Réserves Naturelles ou protégées et participer à leur gestion éventuelle ;</li>
<li>Engager toutes actions légales, y compris auprès des tribunaux, nécessaires à la défense et à la préservation de la nature, de l’environnement et du cadre de vie et d’urbanisme à Vaugines ;</li>
<li>Participer à toute manifestation ou événement en rapport avec l’objet de l’Association.</li>
</ul>$$),

(6, 'Composition', $$<p>L’association se compose de :</p>
<ul>
<li>Membres de l’association : ce sont les membres adhérent·es. Ils et elles ont chacun·e une voix délibérative.</li>
<li>Membres du Conseil d’Orientation (CO).</li>
</ul>
<p>Le Conseil d’Orientation comprend :</p>
<ul>
<li>Les coordonnateurs généraux au nombre de trois à six membres, choisis pour deux ans en <a class="terme" href="/glossaire#assemblee-generale">Assemblée Générale Ordinaire</a> (AGO), renouvelable.</li>
<li>Un ou deux membres de chacune des commissions de travail* indiquées au règlement intérieur,</li>
</ul>$$),

(7, 'Membres – cotisations', $$<p>Sont membres ceux qui ont pris l’engagement de verser annuellement une cotisation d’un montant qui reste au choix de l’adhérent.</p>
<p>Un membre à jour de sa cotisation a le pouvoir de voter à l’assemblée générale.</p>$$),

(8, 'Prise de décisions', $$<p>Toutes les décisions de l’association, hors AGO, sont prises par <a class="terme" href="/glossaire#consensus">consensus</a> au sein du Conseil d’Orientation dans l’objectif d’inclure l’opinion de chacun·e. Le consensus est atteint lorsqu’une proposition est largement approuvée et ne rencontre pas d’oppositions fortes. Contrairement à l’unanimité, le processus de prise de décision par consensus construit sa décision collectivement sans avoir recours au vote. Si les décisions ne trouvent pas de consensus, elles pourront se satisfaire du <a class="terme" href="/glossaire#consentement">consentement</a>. Le consentement permet de ne pas entraver une décision prise pour le bon fonctionnement de l’association, mais d’indiquer à titre personnel, son désaccord.</p>
<p>Le vote à la majorité des deux tiers des présents ou représentés ne pourra être utilisé qu’en dernier recours et après avoir épuisé toutes les possibilités précédentes. Les propositions minoritaires sont consignées ainsi que les résultats complets des votes le cas échéant.</p>$$),

(9, 'Assemblée générale ordinaire (AGO)', $$<p>L’assemblée générale ordinaire comprend tous les membres de l’association. Elle se réunit chaque année.</p>
<p>Quinze jours au moins avant la date fixée, les membres de l’association sont convoqués par courrier ou par e-mail par les soins des Coordonnateurs Généraux.</p>
<p>L’ordre du jour figure sur les convocations.</p>
<p>Un des Coordonnateurs Généraux assisté des membres du Conseil d’Orientation, préside l’assemblée et expose la situation morale et l’activité de l’association.</p>
<p>Le Conseil d’Orientation rend compte de sa gestion et soumet les comptes annuels (bilan, compte de résultat et annexe) à l’approbation de l’assemblée.</p>
<p>Ne peuvent être abordés que les points inscrits à l’ordre du jour.</p>
<p>Les décisions sont prises à main levée à la majorité des voix des membres présents ou représentés.</p>
<p>Il est procédé, après épuisement de l’ordre du jour, au renouvellement des membres sortants du Conseil d’Orientation.</p>
<p>Elle vote pour l’adhésion des nouveaux membres. Elle élit les membres du Conseil d’Orientation dont les Coordonnateurs Généraux.</p>
<p>Les décisions des assemblées générales s’imposent à tous les membres, y compris absents ou représentés.</p>
<p>L’Assemblée Générale Ordinaire fixe le montant des cotisations annuelles des membres, sur proposition du Conseil d’Orientation.</p>$$),

(10, 'Administration', $$<p>L’association est dirigée par un Conseil d’Orientation chargé d’animer et d’organiser la vie de l’association.</p>
<p>L’acceptation du Conseil d’Orientation se fait par l’Assemblée Générale Ordinaire conformément à l’article 6.</p>
<p>Les coordonnateurs généraux assurent collégialement, alternativement, simultanément et solidairement les fonctions de président, de secrétaire et de trésorier. Ils s’assurent que les orientations prises lors de l’assemblée générale sont respectées. Ils font partie du Conseil d’Orientation.</p>
<p>Le Conseil d’Orientation composé des Coordonnateurs Généraux et des responsables de commissions* se réunissent au moins une fois tous les six mois sur convocation des Coordonnateurs Généraux ou sur la demande d’au moins de la moitié des membres du CO. Tout membre de l’Association peut demander à être invité à titre consultatif. Le CO est investi des pouvoirs les plus étendus pour prendre toutes les décisions qui ne sont pas réservées à l’Assemblée Générale. Le CO établit l’ordre du jour des assemblées générales et l’exécution des décisions de ces assemblées. Il autorise les conventions entre l’Association et les collectivités ou organismes publics qui lui apportent une aide financière. Le CO dispose d’une plénitude de compétences s’agissant du droit d’action en justice de l’association et sa mise en œuvre.</p>
<p class="note">* Commissions, liste non-exhaustive : commission finance, commission urbanisme, mobilité et développement, commission environnement et écologie, commission eau, commission patrimoine, commission culturelle et sociale, commission paysage, commission éducation, commission énergie, commission veille démocratique,….</p>$$),

(11, 'Indemnités', $$<p>Toutes les fonctions, y compris celles des membres du Conseil d’Orientation, sont gratuites et bénévoles. Seuls les frais occasionnés par l’accomplissement de leur mandat sont remboursés sur justificatifs. Le rapport financier présenté à l’assemblée générale ordinaire présente, par bénéficiaire, les remboursements de frais de mission, de déplacement ou de représentation.</p>$$),

(12, 'Assemblées', $$<p>L’Assemblée générale est composée de tous les membres à jour de leur cotisation.</p>
<p>L’Assemblée générale délibère valablement à la majorité des suffrages exprimés.</p>$$),

(13, 'Assemblée générale extraordinaire', $$<p>L’Assemblée Générale Extraordinaire est seule compétente pour modifier les statuts, décider la dissolution de l’Association et l’attribution des biens de l’Association, sa fusion avec toute autre association poursuivant un but analogue, proposée par le Conseil d’Orientation ou un tiers des membres de l’Association. Elle doit être convoquée spécialement à cet effet, par les coordonnateurs généraux, ou à la requête du tiers des membres de l’Association dans un délai de 15 jours avant la date fixée.</p>$$),

(14, 'Ressources de l’association', $$<p>Elles se composent :</p>
<ul>
<li>Des cotisations versées par les membres qui en sont redevables ; des dons éventuels. Si l’Association est reconnue d’intérêt général au regard du code général des impôts, elle sera habilitée à délivrer des reçus fiscaux.</li>
<li>Des subventions qui peuvent lui être accordées par l’Etat et autres collectivités publiques.</li>
<li>De toute autre ressource autorisée par la loi.</li>
</ul>$$),

(15, 'Règlement intérieur', $$<p>Un règlement intérieur fixe les questions relatives à l’exécution des présents statuts et à l’administration de l’Association. Il est soumis à l’approbation du Conseil d’Orientation et peut être modifié, en tout temps, à la majorité simple des voix des votants.</p>$$),

(16, 'Responsabilité', $$<p>Pour toutes ses activités, l’Association est couverte par un contrat d’assurance.</p>$$),

(17, 'Modification des statuts', $$<p>Les présents statuts ne pourront être modifiés qu’en Assemblée Générale Extraordinaire et à la majorité des deux tiers des membres votants ou représentés.</p>$$),

(18, 'Dissolution', $$<p>La dissolution de l’Association ne pourra être prononcée que par une Assemblée Générale Extraordinaire. En cas de dissolution volontaire, statutaire ou judiciaire, l’Assemblée Générale Extraordinaire désigne un ou plusieurs liquidateurs et l’actif, s’il y a lieu, est dévolu conformément à l’article 9 de la loi du 1er juillet 1901 et au décret du 16 août 1901.</p>$$);

-- Signature et date (affichées sous le texte et dans le PDF).
update public.site_settings
set data = data || jsonb_build_object('statuts', jsonb_build_object(
  'fait_a', 'Fait à Vaugines, le 20 avril 2026',
  'signataires', jsonb_build_array(
    jsonb_build_object('nom', 'Maëlle Calandra', 'qualite', 'coordinatrice'),
    jsonb_build_object('nom', 'Charlotte Clément', 'qualite', 'coordinatrice')
  )
))
where id = 1;
