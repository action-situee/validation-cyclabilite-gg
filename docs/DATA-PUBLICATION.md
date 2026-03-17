# Publication Des Donnees

## Donnees que le portail sait lire

### 1. Indice de cyclabilite

Le front attend une tuile vectorielle PMTiles, pas un parquet brut:

- `VITE_PM_TILES_BIKE_SEGMENT`
- `VITE_BIKE_SOURCE_LAYER`

Le brut reste dans l'atlas `copie-atlas-marchabilite-cyclabilite/` puis passe par le pipeline atlas. Pour le portail, il faut publier:

- `bike_agglo_segment.pmtiles`
- `bike-metric-quantiles.json`

### 2. Corridors

Format: GeoJSON `Polygon` ou `MultiPolygon`.

Chemin local par defaut:

- `public/data/corridors.geojson`

Override possible:

- `VITE_CORRIDORS_GEOJSON_URL`

Proprietes utiles par feature:

- `id`
- `nom`
- `color`
- `center_lat`
- `center_lng`
- `zoom`

### 3. Points d'attention

Deux options:

- `VITE_CIBLES_GEOJSON_URL` vers un GeoJSON `Point`
- `VITE_CIBLES_SHEETS_CSV_URL` vers un Google Sheet publie en CSV

Colonnes attendues pour le CSV:

- `cible_id`
- `faisceau_id`
- `faisceau_nom`
- `theme_principal`
- `latitude`
- `longitude`
- `titre_affichage`
- `score`
- `classe`

Template fourni:

- `public/data/google-sheets/cibles-template.csv`

## Lecture / ecriture des contributions

Le front lit et ecrit via `VITE_CONTRIBUTIONS_API_BASE`, par defaut `/api`.

Routes attendues:

- `GET/POST/PUT/DELETE /observations`
- `GET/POST/DELETE /commentaires`
- `GET/POST /surveys`

Important:

- un Google Sheet publie en CSV est seulement lisible
- pour ecrire les retours utilisateurs, il faut une API intermediaire
- cette API peut ensuite ecrire dans Sheets, Airtable, Notion, Postgres, etc.

## Regenerer les fichiers publics depuis l'atlas

```bash
npm run data:prepare
```

Le script lit les sorties atlas preparees et regenere:

- `public/data/atlas/bike-segments.geojson`
- `public/data/atlas/bike-segments-summary.json`
- `public/data/atlas/bike-metric-quantiles.json`

## Variables utiles

```env
VITE_PM_TILES_BIKE_SEGMENT=https://.../bike_agglo_segment.pmtiles
VITE_PM_TILES_PERIMETER=https://.../canton_perimeter.pmtiles
VITE_BIKE_SOURCE_LAYER=bikenet
VITE_PERIMETER_SOURCE_LAYER=canton_perimeter
VITE_CORRIDORS_GEOJSON_URL=/data/corridors.geojson
VITE_CIBLES_GEOJSON_URL=
VITE_CIBLES_SHEETS_CSV_URL=
VITE_CONTRIBUTIONS_API_BASE=/api
```
