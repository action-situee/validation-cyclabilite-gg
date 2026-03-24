# Portail de Cyclabilité du Grand Genève

## Vue d'ensemble

Ce portail web collaboratif permet de valider et challenger l'indice de cyclabilité transfrontalier du Grand Genève. Le deploiement courant lit l'indice depuis les sorties atlas publiees, les contributions depuis D1 via `/api`, et les tuiles reseau depuis R2 avec CORS explicite.

## Fonctionnalités principales

### 1. Carte interactive
- Visualisation des cibles de cyclabilité sur une carte OpenStreetMap
- Marqueurs colorés selon la classe d'indice (très faible à très bon)
- Clustering automatique pour une meilleure lisibilité
- Filtrage en temps réel des cibles affichées

### 2. Panneaux de filtrage et détails
- **Panneau gauche** : Filtres avancés par faisceau, type de cible, thème, classe d'indice, priorité, etc.
- **Panneau droit** : Détails complets d'une cible sélectionnée avec question clé et indicateurs

### 3. Formulaire de retour
- Formulaire adaptatif selon le type de cible
- Collecte de données qualitatives et quantitatives
- Calcul automatique de la divergence entre indice calculé et cyclabilité perçue
- Support pour photos géolocalisées (prévu)

### 4. Vue synthèse
- Statistiques agrégées des retours
- Moyennes par critère d'évaluation
- Identification des problèmes fréquents
- Détection des fortes divergences d'évaluation
- Filtrage par faisceau

### 5. Galerie terrain
- Photos et observations de terrain
- Filtrage par faisceau
- Métadonnées complètes (association, date, mode de relevé)

## Architecture technique

### Structure du projet
Le front actif vit dans `src/app/`, les endpoints Pages Functions dans `functions/api/`, les sorties atlas dans `public/data/atlas/` et les migrations D1 dans `migrations/`.

### Technologies utilisées
- **React 18** avec TypeScript
- **React Router 7** pour la navigation
- **React Leaflet** pour la cartographie
- **Tailwind CSS v4** pour le style
- **PapaCSV** pour le parsing CSV
- **Sonner** pour les notifications
- **Lucide React** pour les icônes

## Source de données

### Configuration actuelle
Le portail lit les contributions exclusivement via l'API `/api`, stockee en D1. Les couches de reseau sont servies par PMTiles et les quantiles par `public/data/atlas/`.

**URL CSV configurée** :
```
https://docs.google.com/spreadsheets/d/e/2PACX-1vQQZ4HanB-X05k-nt7MR7wJlNh33ILlx_UEoWXYRGO6rnGMLCVW1tcmbPdFVVK8YWlvq9drJ6HXdJKA/pub?output=csv
```

## Persistence des données

Les retours terrain, commentaires generaux et questionnaires sont stockes en D1 via les endpoints `/api/observations`, `/api/commentaires` et `/api/surveys`.

## Utilisation

### Filtrage des cibles
1. Utilisez le panneau gauche pour sélectionner vos critères de filtrage
2. La carte se met à jour en temps réel
3. Utilisez la recherche pour trouver une cible par ID ou titre

### Donner un avis
1. Cliquez sur un marqueur de la carte
2. Le panneau droit s'ouvre avec les détails
3. Cliquez sur "Donner un avis"
4. Remplissez le formulaire adapté au type de cible
5. Soumettez votre retour

### Consulter la synthèse
1. Cliquez sur "Synthèse" dans le header
2. Consultez les statistiques agrégées
3. Filtrez par faisceau si nécessaire
4. Identifiez les cibles avec forte divergence

### Voir la galerie terrain
1. Cliquez sur "Galerie" dans le header
2. Parcourez les photos et observations
3. Filtrez par faisceau

## Calcul de divergence

Le portail calcule automatiquement la divergence entre l'indice calculé et la cyclabilité perçue :

```
divergence = cyclabilité_perçue - score_indice_normalisé
```

Catégorisation :
- **Sous-estimé** : divergence > +1
- **Cohérent** : divergence entre -1 et +1
- **Surestimé** : divergence < -1

## Faisceaux de travail

### Thonex - Gaillard
Zone transfrontalière entre Thonex (Suisse) et Gaillard (France), comprenant des enjeux de perméabilité frontalière et de continuité cyclable.

### Plan-les-Ouates - Saint-Julien
Axe stratégique entre Plan-les-Ouates (Suisse) et Saint-Julien-en-Genevois (France), avec des problématiques d'infrastructure et d'interconnexion.

## Modèle de données

### Cible
Structure complète définie dans `/src/app/types/index.ts` incluant :
- Identifiants et localisation
- Score et classe d'indice
- Métadonnées (faisceau, secteur, thème)
- Indicateurs spécifiques (delta potentiel, épaisseur frontière)

### Retour questionnaire
Formulaire complet avec :
- Informations du répondant
- Contexte d'observation
- Notes sur 5 pour différents critères
- Commentaires qualitatifs
- Support photo

## Personnalisation

### Ajouter un nouveau faisceau
1. Publiez son perimetre GeoJSON dans `public/data/corridors/` ou exposez-le par URL.
2. Publiez ses segments / quantiles dans les sorties atlas ou dans vos PMTiles.

### Modifier les critères d'évaluation
1. Mettez à jour les types dans `/src/app/types/index.ts`
2. Ajoutez les champs dans `/src/app/components/FeedbackForm.tsx`
3. Mettez à jour le calcul de synthèse dans `/src/app/utils/synthese.ts`

### Changer les couleurs de classes
1. Modifiez la fonction `getMarkerColor` dans `/src/app/components/Map.tsx`
2. Mettez à jour la légende dans `/src/app/components/LeftPanel.tsx`

## Prochaines étapes

### Connexion backend
- [ ] Implémenter l'API de soumission de retours
- [ ] Configurer le stockage de photos
- [ ] Connecter à une base de données PostgreSQL ou Supabase

### Fonctionnalités avancées
- [ ] Export des données en CSV/Excel
- [ ] Impression de rapports
- [ ] Authentification des utilisateurs
- [ ] Gestion des droits (lecture/écriture)
- [ ] Notifications email pour les nouveaux retours
- [ ] Dashboard administrateur

### Améliorations UX
- [ ] Mode hors ligne (Progressive Web App)
- [ ] Géolocalisation automatique pour les photos
- [ ] Dessin sur carte pour signaler des zones
- [ ] Comparaison côte à côte de plusieurs cibles

## Contact et support

Pour toute question sur l'utilisation ou le développement du portail, contactez l'équipe projet cyclabilité Grand Genève.

---

**Version** : 1.0.0  
**Dernière mise à jour** : Mars 2026  
**Lot** : 5 - Validation indice de cyclabilité transfrontalier
