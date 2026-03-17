Construis un portail web collaboratif sobre, rapide et responsive pour la validation d un indice de cyclabilite transfrontalier dans le Grand Geneve. Le portail doit fonctionner comme un prototype quasi reel et pouvoir ensuite etre connecte a de vraies donnees.

Contexte du projet
- Le portail sert au lot 5 d un projet de cyclabilite.
- Objectif principal : challenger et valider la justesse de l indice.
- Objectifs secondaires : identifier des secteurs d intervention rapide, documenter la permeabilite de la frontiere, analyser le maillage entre origines et destinations, faire ressortir les alternatives cyclables, objectiver les ecarts France - Suisse, preparer une synthese exploitable pour un atelier restreint avec des associations.
- Deux faisceaux de travail : Thonex - Gaillard et Plan-les-Ouates - Saint-Julien.
- Les utilisateurs principaux sont des associations cyclistes, des experts mobilite et l equipe projet.
- Le ton visuel doit etre institutionnel, leger, cartographique, lisible et non gadget.

Architecture fonctionnelle demandee
1. Une page principale avec carte plein ecran.
2. Un panneau lateral gauche avec :
   - titre du projet
   - choix du faisceau
   - filtres par type de cible, theme, classe d indice, priorite, quick win, cote frontiere
   - legende des classes
   - bouton pour afficher uniquement les cibles avec fort delta potentiel
   - bouton pour afficher uniquement les cibles liees a la frontiere
3. Un panneau lateral droit contextuel qui s ouvre quand on clique une cible sur la carte et qui affiche :
   - titre de la cible
   - faisceau
   - theme principal
   - score d indice calcule et classe
   - question cle
   - champs descriptifs
   - bouton "Donner un avis"
   - bouton "Voir les retours deja saisis"
4. Une fenetre de formulaire modale ou plein panneau pour saisir un retour structure.
5. Une page ou vue "Synthese" avec indicateurs et tableaux simples.
6. Une page ou vue "Galerie terrain" avec photos, commentaires et mini-carte.

Source de donnees carte
- Le portail doit lire une URL de CSV publie depuis Google Sheets: https://docs.google.com/spreadsheets/d/e/2PACX-1vQQZ4HanB-X05k-nt7MR7wJlNh33ILlx_UEoWXYRGO6rnGMLCVW1tcmbPdFVVK8YWlvq9drJ6HXdJKA/pub?output=csv
- Le CSV contient les cibles a commenter.
- Prevoir une couche d abstraction "data source config" avec :
  - csvUrl
  - delimiter
  - latitudeField
  - longitudeField
  - geometryField
  - idField
- Si geometry_geojson est disponible, afficher la geometrie reelle.
- Sinon, afficher un marqueur a partir de latitude et longitude.
- Prevoir des donnees mockees localement pour que le prototype fonctionne meme sans URL reelle.

Modele de donnees cible
Utiliser comme structure les champs suivants :
cible_id, faisceau_id, faisceau_nom, secteur_nom, theme_principal, theme_secondaire, type_cible, niveau_reseau, cote_frontiere, od_amont, od_aval, pama_id, pama_nom, priorite_revue, score_indice_calcule, classe_indice_calcule, delta_potentiel, quick_win_potentiel, epaisseur_frontiere_m, differentiel_fr_ch_calcule, type_geometrie, latitude, longitude, geometrie_geojson, titre_affichage, sous_titre_affichage, question_cle, couche_carte, statut_validation, derniere_mise_a_jour, source_donnees, url_reference, commentaire_interne

Formulaire de retour
Le formulaire doit etre directif mais court. Il doit etre simple a remplir sur mobile pendant une visite de terrain.

Champs du formulaire
- association
- nom_repondant
- email_repondant
- mode_releve : carte, terrain, atelier
- faisceau_id pre-rempli
- cible_id pre-rempli
- date_observation
- heure_observation
- sens_deplacement : fr_vers_ch, ch_vers_fr, les_deux, local
- motif_deplacement : travail, etudes, achats, loisirs, multiple, autre
- coherence_indice_note sur 5
- indice_calcule_juge : trop_faible, juste, trop_eleve, ne_sait_pas
- cyclabilite_percue_note sur 5
- permeabilite_note sur 5
- alternatives_note sur 5
- continuite_note sur 5
- intersections_note sur 5
- giratoires_note sur 5
- epaisseur_frontiere_note sur 5
- differentiel_fr_ch_note sur 5
- securite_note sur 5
- confort_note sur 5
- stress_ressenti_note sur 5
- potentiel_intervention_rapide_note sur 5
- priorite_action_note sur 5
- probleme_principal
- probleme_secondaire
- point_positif_principal
- type_action_suggeree
- description_alternative
- proposition_concrete
- commentaire_libre
- photo_url
- photo_legende
- photo_latitude
- photo_longitude
- photo_source_geoloc
- accord_publication_photo
- besoin_contact_suivi

Logique conditionnelle du formulaire
- Si theme_principal = permeabilite_frontiere, afficher en premier permeabilite_note, epaisseur_frontiere_note et differentiel_fr_ch_note.
- Si type_cible = intersection, mettre intersections_note en avant.
- Si type_cible = roundabout, mettre giratoires_note en avant.
- Si type_cible = alternative_route, mettre alternatives_note et description_alternative en avant.
- Toujours garder coherence_indice_note, indice_calcule_juge, cyclabilite_percue_note, securite_note, confort_note, stress_ressenti_note, potentiel_intervention_rapide_note et proposition_concrete.

Ergonomie attendue
- Interface tres lisible, contraste correct, fond neutre.
- Pas de style trop marketing.
- Mobile first pour le formulaire.
- Carte avec clustering leger, filtres rapides et recherche par ID / nom.
- Clic sur carte = popup simple puis ouverture du panneau detail.
- Tous les boutons et libelles en francais.
- Echelle 1 a 5 toujours explicitee par des ancres textuelles.
- Afficher les scores sous forme de puces ou segments simples, pas de jauges decoratives.
- Prevoir une option "N/A" pour les questions non pertinentes.
- Ajouter un bouton "Signaler une observation hors cible" qui permet de deposer un commentaire geolocalise libre.

Photos et geolocalisation
- Ajouter un composant d upload d image avec apercu.
- Tenter de lire la geolocalisation EXIF cote client si elle existe.
- Si pas de geolocalisation detectee, proposer :
  - reprendre la position de la carte
  - utiliser la position du navigateur si autorisee
  - saisir latitude et longitude manuellement
- Afficher la photo dans le recapitulatif de la reponse avec legende et commentaire.
- Prevoir un champ consentement pour publication de la photo.
- Si aucun backend fichier n est disponible, prevoir un mode de secours avec simple champ photo_url.

Synthese
Creer une vue de synthese exploitable directement en reunion avec :
- nombre de retours par faisceau
- nombre de retours par cible
- moyenne de coherence_indice_note par cible
- part des reponses "indice trop eleve"
- moyenne de permeabilite_note, alternatives_note, intersections_note, giratoires_note, epaisseur_frontiere_note, differentiel_fr_ch_note
- moyenne de potentiel_intervention_rapide_note
- moyenne de priorite_action_note
- classement des problemes principaux
- classement des types d action suggeree
- galerie des photos les plus utiles
- carte de chaleur simple des retours
- filtre pour n afficher que les divergences fortes entre indice calcule et cyclabilite percue

Modele de divergence
Calculer un indicateur simple de divergence :
- normaliser score_indice_calcule sur 5 si necessaire
- divergence = cyclabilite_percue_note - score_indice_normalise
- stocker aussi une categorie : sous_estime, coherent, surestime
- afficher cette divergence dans la vue synthese et dans la fiche cible

Technique
- React + TypeScript.
- Composants bien separes.
- Carte avec une librairie web cartographique moderne.
- Etat clair et typage strict.
- Pas de dependances exotiques inutiles.
- Utiliser une architecture propre avec :
  - components
  - pages
  - hooks
  - utils
  - types
  - mock-data
- Generer de faux jeux de donnees compatibles avec les deux CSV.
- Commenter peu mais clairement.
- Prevoir des fonctions d import CSV robustes.
- Gerer les erreurs de chargement et afficher un message comprehensible.

Backend et persistence
- Le prototype doit pouvoir fonctionner sans backend avec stockage local mocke.
- Mais prevoir une interface de service pour brancher ensuite :
  - un endpoint de soumission de formulaire
  - un stockage photo
  - une base de donnees ou table externe
- Si un backend est disponible, utiliser un schema simple de table "retours_questionnaire".
- Ne pas coder de secrets dans le front.

Design system
- Typographie simple de type sans-serif.
- Grille sobre.
- Couleurs retenues inspirant lecture cartographique : fond clair, gris neutres, un bleu principal, un vert secondaire, rouge reserve aux alertes ou forts deltas.
- Auto layout et composants reutilisables.
- Icônes simples et fines.
- Etats hover, focus et selected clairs.
- Garder un niveau de densite eleve mais confortable.

Je veux en sortie
- une app ou prototype navigable avec vraies interactions
- des donnees mockees pour les deux faisceaux
- une carte, un formulaire conditionnel, une galerie terrain et une vue synthese
- un code propre et facile a reprendre
- aucun texte lorem ipsum
- tout le contenu et tous les labels en francais
