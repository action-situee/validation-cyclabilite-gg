# Sources de donnees – Guide de branchement

Ce document explique comment brancher vos propres donnees (corridors et points d'attention) sur l'application, en remplacement des donnees mock embarquees.

## Architecture

```
src/app/utils/data-loader.ts    ← Point d'entree unique pour les donnees externes
src/app/mock-data/faisceaux.ts  ← Corridors mock (fallback)
src/app/mock-data/cibles.ts     ← Points d'attention mock (fallback)
src/app/hooks/useAppData.tsx    ← Orchestre le chargement (externe → mock)
```

Le chargement suit une cascade :
1. **GeoJSON distant** (prioritaire)
2. **Google Sheets CSV** (cibles uniquement)
3. **Donnees mock locales** (fallback silencieux)

---

## 1. Corridors (faisceaux)

### Format GeoJSON attendu

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [6.068, 46.135],
            [6.072, 46.140],
            ...
            [6.068, 46.135]
          ]
        ]
      },
      "properties": {
        "id": "plo_stjulien",
        "nom": "Saint-Julien – PLO – Geneve",
        "color": "#1b4332",
        "center_lat": 46.158,
        "center_lng": 6.112,
        "zoom": 13,
        "label_lat": 46.162,
        "label_lng": 6.068,
        "description": "Corridor sud"
      }
    }
  ]
}
```

**Proprietes obligatoires :**

| Propriete    | Type   | Description                           |
|-------------|--------|---------------------------------------|
| `id`        | string | Identifiant unique du corridor         |
| `nom`       | string | Nom affiche dans le selecteur          |
| `color`     | string | Couleur hex du contour                 |

**Proprietes optionnelles :**

| Propriete     | Type   | Defaut                    |
|--------------|--------|---------------------------|
| `center_lat` | number | Centre calcule du polygon  |
| `center_lng` | number | Centre calcule du polygon  |
| `zoom`       | number | 13                         |
| `label_lat`  | number | Au-dessus du polygon       |
| `label_lng`  | number | Centre horizontal          |
| `description`| string | –                          |
| `centerline` | JSON   | Genere automatiquement     |

**Coordonnees :** GeoJSON standard `[longitude, latitude]`. L'application inverse automatiquement en `[lat, lng]` pour Leaflet.

### Comment brancher

Ouvrez `/src/app/utils/data-loader.ts` et renseignez :

```ts
export const CORRIDORS_GEOJSON_URL = 'https://votre-url/corridors.geojson';
```

Options d'hebergement :
- **GitHub raw** : `https://raw.githubusercontent.com/user/repo/main/corridors.geojson`
- **Google Drive** : partagez le fichier en acces public, utilisez `https://drive.google.com/uc?export=download&id=FILE_ID`
- **Serveur statique** : placez le fichier dans `/public/data/corridors.geojson` et utilisez `/data/corridors.geojson`

---

## 2. Points d'attention (cibles)

Deux sources possibles (le GeoJSON est prioritaire) :

### Option A – GeoJSON

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [6.0835, 46.1432]
      },
      "properties": {
        "cible_id": "PS_001",
        "faisceau_id": "plo_stjulien",
        "faisceau_nom": "Saint-Julien – PLO – Geneve",
        "theme_principal": "equipements",
        "titre_affichage": "Parking velo gare routiere",
        "sous_titre_affichage": "Stationnement securise absent",
        "question_cle": "Le stationnement est-il suffisant ?",
        "score": 1.8,
        "classe": "tres_faible"
      }
    }
  ]
}
```

Renseignez dans `data-loader.ts` :

```ts
export const CIBLES_GEOJSON_URL = 'https://votre-url/cibles.geojson';
```

### Option B – Google Sheets (CSV publie)

Creez un Google Sheet avec ces colonnes en ligne 1 :

| cible_id | faisceau_id | faisceau_nom | theme_principal | latitude | longitude | titre_affichage | sous_titre_affichage | question_cle | score | classe |
|----------|-------------|--------------|-----------------|----------|-----------|-----------------|---------------------|-------------|-------|--------|
| PS_001 | plo_stjulien | Saint-Julien – PLO | equipements | 46.1432 | 6.0835 | Parking velo gare | Stationnement absent | Le stationnement est-il suffisant ? | 1.8 | tres_faible |

**Colonnes obligatoires :** `cible_id`, `faisceau_id`, `faisceau_nom`, `theme_principal`, `latitude`, `longitude`, `titre_affichage`, `score`, `classe`

**Colonnes facultatives :** `sous_titre_affichage`, `question_cle`

**Publication du tableur :**
1. Dans Google Sheets : **Fichier > Partager > Publier sur le web**
2. Selectionnez l'onglet contenant les cibles
3. Format : **CSV**
4. Copiez l'URL generee

Renseignez dans `data-loader.ts` :

```ts
export const CIBLES_SHEETS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?gid=0&single=true&output=csv';
```

---

## 3. Valeurs possibles

### `theme_principal`

| Valeur | Couleur | Description |
|--------|---------|-------------|
| `permeabilite_frontiere` | #8338ec | Passages frontaliers |
| `intersections` | #ff006e | Securite aux intersections |
| `giratoires` | #fb5607 | Giratoires |
| `alternatives` | #3a86ff | Maillage et itineraires alternatifs |
| `continuite` | #06d6a0 | Continuite et confort |
| `equipements` | #ffbe0b | Equipements (stationnement, pompes...) |
| `attractivite` | #e056a0 | Attractivite de l'itineraire |

### `classe` (classe d'indice)

| Valeur | Description |
|--------|-------------|
| `tres_faible` | Score < 2 |
| `faible` | Score 2-3 |
| `moyen` | Score 3-3.5 |
| `bon` | Score 3.5-4 |
| `tres_bon` | Score > 4 |

---

## 4. Donnees en ecriture

Les **contributions des utilisateurs** (observations, votes, commentaires) sont stockees en `localStorage` dans le navigateur de chaque contributeur. Pour les collecter :

### Export integre

L'application propose un export via le panneau lateral :
- **GeoJSON** : toutes les contributions georeferencees
- **CSV** : tableau plat des observations

### Centraliser avec Supabase (optionnel)

Pour persister les contributions sur un serveur partage, connectez une base Supabase. L'application est pre-cableee pour cette evolution dans `useAppData.tsx`.

---

## 5. Workflow recommande

```
┌─────────────────────────────┐
│   QGIS / SIG                │
│   Dessiner les corridors    │
│   → Exporter en GeoJSON     │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│   GitHub / Drive            │
│   Heberger le GeoJSON       │
│   → URL brute               │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│   Google Sheets             │
│   Points d'attention (CSV)  │
│   → Publier sur le web      │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│   data-loader.ts            │
│   Coller les URLs           │
│   → L'app charge auto       │
└─────────────────────────────┘
```

### Modifier les donnees en direct

- **Corridors** : editez le GeoJSON, re-uploadez. L'app recharge au prochain rafraichissement.
- **Points d'attention via Sheets** : modifiez le tableur. La publication CSV se met a jour automatiquement (delai ~5min Google).
- **Points d'attention via GeoJSON** : meme principe que les corridors.
