# Changelog - Portail Cyclabilité Grand Genève

Toutes les modifications notables de ce projet sont documentées dans ce fichier.

## [1.0.0] - 2026-03-11

### Ajouté

#### Fonctionnalités principales
- 🗺️ Carte interactive avec React Leaflet et OpenStreetMap
- 📊 Système de filtrage avancé des cibles (faisceau, type, thème, classe, priorité)
- 📝 Formulaire de retour adaptatif selon le type de cible
- 📈 Page de synthèse avec statistiques et analyses
- 📸 Galerie terrain pour les photos et observations
- 🔍 Recherche par ID ou titre de cible
- 💾 Stockage local des retours dans le navigateur

#### Composants
- `LeftPanel` : Panneau de filtrage avec légende
- `RightPanel` : Panneau de détails de cible
- `Map` : Composant carte avec marqueurs personnalisés
- `FeedbackForm` : Formulaire conditionnel de saisie
- `FeedbackList` : Liste détaillée des retours
- `ScoreDisplay` : Affichage des notes sur 5
- `Badge` : Badges pour statuts et catégories
- `Button` : Boutons avec variantes
- `LoadingState` : États de chargement et erreur
- `HelpTooltip` : Info-bulles d'aide contextuelle

#### Pages
- `/` : Page principale avec carte et panneaux
- `/synthese` : Statistiques et analyses agrégées
- `/galerie` : Photos et observations terrain
- `404` : Page d'erreur

#### Données
- 11 cibles mockées réparties sur 2 faisceaux
- 6 retours questionnaire exemples
- Configuration CSV pour chargement distant

#### Utilitaires
- `csvParser` : Parsing de CSV avec PapaCSV
- `storage` : Gestion du localStorage et interface backend
- `synthese` : Calcul des statistiques
- `cn` : Utility pour fusion de classes Tailwind
- `calculateDivergence` : Calcul automatique des divergences

#### Types TypeScript
- `Cible` : Structure complète des cibles
- `RetourQuestionnaire` : Structure des retours
- `Filters` : État des filtres
- `SyntheseStats` : Statistiques calculées
- `DataSourceConfig` : Configuration source de données

#### Documentation
- `README.md` : Vue d'ensemble du projet
- `GUIDE_UTILISATION.md` : Guide complet d'utilisation
- `DESIGN.md` : Design system et guidelines
- `CHANGELOG.md` : Historique des modifications

### Configuration

#### Packages installés
- `react-leaflet` et `leaflet` pour la cartographie
- `papaparse` pour le parsing CSV
- `react-router` v7 pour la navigation
- `sonner` pour les notifications
- `lucide-react` pour les icônes

#### Styles
- Tailwind CSS v4 avec configuration personnalisée
- Styles Leaflet personnalisés
- Palette de couleurs institutionnelle

### Architecture

#### Structure de fichiers
```
/src/app
  /components      - Composants réutilisables
  /pages          - Pages de navigation
  /types          - Définitions TypeScript
  /utils          - Fonctions utilitaires
  /hooks          - Custom hooks
  /mock-data      - Données de démonstration
  /config         - Constantes et configuration
  routes.tsx      - Configuration du routeur
  App.tsx         - Composant racine
```

### Techniques

#### Fonctionnalités implémentées
- Filtrage en temps réel avec useMemo
- Marqueurs de carte colorés selon classe d'indice
- Formulaire conditionnel (champs selon type de cible)
- Calcul automatique de divergence
- Stockage persistant dans localStorage
- Interface préparée pour backend

#### Performance
- Filtrage optimisé avec mémoïsation
- Composants React fonctionnels
- Lazy loading prévu pour futures optimisations

### À venir (v1.1.0)

- [ ] Connexion à un backend réel (Supabase/PostgreSQL)
- [ ] Authentification utilisateurs
- [ ] Upload de photos vers service cloud
- [ ] Export CSV/Excel des données
- [ ] Impression de rapports
- [ ] Géolocalisation automatique des photos
- [ ] Mode hors ligne (PWA)
- [ ] Dashboard administrateur
- [ ] Notifications email
- [ ] Chargement CSV en temps réel

### Notes techniques

- Le portail fonctionne actuellement avec des données mockées
- Les retours sont stockés dans le localStorage
- L'URL CSV Google Sheets est configurée mais non activée par défaut
- Le code est structuré pour faciliter la migration backend
- Tous les textes sont en français
- Aucun texte lorem ipsum n'est utilisé

---

## Format du changelog

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

### Types de changements

- **Ajouté** pour les nouvelles fonctionnalités
- **Modifié** pour les changements aux fonctionnalités existantes
- **Déprécié** pour les fonctionnalités qui seront retirées
- **Retiré** pour les fonctionnalités retirées
- **Corrigé** pour les corrections de bugs
- **Sécurité** pour les vulnérabilités

---

**Projet** : Portail de Cyclabilité du Grand Genève  
**Lot** : 5 - Validation indice de cyclabilité transfrontalier  
**Date de première version** : 11 mars 2026
