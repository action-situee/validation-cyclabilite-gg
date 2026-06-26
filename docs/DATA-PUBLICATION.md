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

Les scores publies doivent rester inchanges et normalises entre 0 et 1. Les seuils couleur ne servent qu'a la visualisation:

- mode lineaire: seuils fixes `0.1, 0.2, ..., 1.0`;
- mode quantile: seuils calcules sur les valeurs numeriques valides, en ignorant les valeurs non numeriques ou hors `[0, 1]`.

Le manifeste `bike-metric-quantiles.json` conserve `metrics` a la racine pour compatibilite et peut aussi exposer des seuils par echelle:

```json
{
  "metrics": { "bike_index": [0.3023, 0.3304, 0.3538, 0.3734, 0.4008, 0.4186, 0.4318, 0.4502, 0.4767, 0.504] },
  "layers": {
    "segment": { "metrics": { "bike_index": [0.3023, 0.3304, 0.3538, 0.3734, 0.4008, 0.4186, 0.4318, 0.4502, 0.4767, 0.504] } },
    "carreau200": { "metrics": { "bike_index": [0.313805, 0.34431, 0.362867, 0.384963, 0.406012, 0.419667, 0.430277, 0.442676, 0.464901, 0.48597] } }
  }
}
```

En production, la carte, la legende et les classes de consultation utilisent toujours le meme tableau de seuils actif.

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
- les observations, commentaires et surveys affiches par l'application proviennent uniquement de D1 via cette API

## Deploiement Cloudflare et quantiles

Les PMTiles sont servis depuis R2 en production et restent ignores par Git (`public/tiles/`). Le build Cloudflare ne peut donc pas recalculer les seuils quantiles depuis les tuiles locales.

Le petit manifeste `public/data/atlas/bike-metric-quantiles.json` est versionne explicitement. Il doit etre regenere localement apres mise a jour des PMTiles:

```bash
npm run data:prepare
```

Puis le manifeste doit etre commite avec le code. Si les sources atlas lourdes sont absentes pendant le build Cloudflare, le script conserve ce manifeste au lieu de l'ecraser par un fichier vide.

## Regenerer les fichiers publics depuis l'atlas

```bash
npm run data:prepare
```

Le script lit les sorties atlas preparees et regenere:

- `public/data/atlas/bike-segments.geojson`
- `public/data/atlas/bike-segments-summary.json`
- `public/data/atlas/bike-metric-quantiles.json`, avec seuils quantiles strictement croissants par metrique et par echelle disponible

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
VITE_CONTRIBUTIONS_API_BASE=/api
```
