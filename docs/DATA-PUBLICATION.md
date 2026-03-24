# Publication Des Donnees

## Donnees que le portail sait lire

### 1. Indice de cyclabilite

Le front attend une tuile vectorielle PMTiles, pas un parquet brut:

- `VITE_PM_TILES_BIKE_SEGMENT`
- `VITE_PM_TILES_BIKE_CARREAU200`
- `VITE_BIKE_SOURCE_LAYER`

Le brut reste dans l'atlas `copie-atlas-marchabilite-cyclabilite/` puis passe par le pipeline atlas. Pour le portail, il faut publier:

- `bike_agglo_segment.pmtiles`
- `bike_agglo_carreau200.pmtiles`
- `bike-metric-quantiles.json`

### 2. Faisceaux

Format: GeoJSON `Polygon` ou `MultiPolygon`.

Chemins locaux par defaut:

- `public/data/corridors/f3_perimetre_arrondi.geojson`
- `public/data/corridors/f4_perimetre_arrondi.geojson`

Override possible:

- `VITE_FAISCEAU_GAILLARD_GEOJSON_URL`
- `VITE_FAISCEAU_STJULIEN_GEOJSON_URL`

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

Le front lit et ecrit via `VITE_CONTRIBUTIONS_API_BASE`, fixe a `/api` en deployment Cloudflare.

Routes attendues:

- `GET/POST/PUT/DELETE /observations`
- `GET/POST/DELETE /commentaires`
- `GET/POST /surveys`

Important:

- un Google Sheet publie en CSV est seulement lisible
- le depot fournit deja cette API via `functions/api/*`
- pour activer cette API, ajoutez un binding D1 `CONTRIBUTIONS_DB`
- sans binding D1, les endpoints `/api/*` repondent en `503`
- cette API peut ensuite etre redirigee vers D1, R2, Sheets, Airtable, Notion, Postgres, etc.

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
VITE_PM_TILES_BIKE_CARREAU200=https://.../bike_agglo_carreau200.pmtiles
VITE_PM_TILES_PERIMETER=https://.../canton_perimeter.pmtiles
VITE_BIKE_SOURCE_LAYER=bikenet
VITE_PERIMETER_SOURCE_LAYER=canton_perimeter
VITE_FAISCEAU_GAILLARD_GEOJSON_URL=/data/corridors/f3_perimetre_arrondi.geojson
VITE_FAISCEAU_STJULIEN_GEOJSON_URL=/data/corridors/f4_perimetre_arrondi.geojson
VITE_CIBLES_GEOJSON_URL=
VITE_CIBLES_SHEETS_CSV_URL=
VITE_FORCE_LOCAL_MOCKS=false
VITE_CONTRIBUTIONS_API_BASE=/api
```
