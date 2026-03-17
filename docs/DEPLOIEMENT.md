# Deploiement

## Local

```bash
npm install
npm run data:prepare
npm run dev
```

Preview du build:

```bash
npm run build
npm run preview
```

## Ce qui doit exister

- `VITE_PM_TILES_BIKE_SEGMENT` si vous ne servez pas `public/tiles/bike_agglo_segment.pmtiles`
- `public/data/corridors.geojson` ou `VITE_CORRIDORS_GEOJSON_URL`
- `VITE_CIBLES_GEOJSON_URL` ou `VITE_CIBLES_SHEETS_CSV_URL` si vous ne voulez pas les mocks
- `VITE_CONTRIBUTIONS_API_BASE` si vous remplacez le `/api` local

## Contrat local de dev

Routes disponibles via Vite en dev et preview:

- `GET/POST/PUT/DELETE /api/observations`
- `GET/POST/DELETE /api/commentaires`
- `GET/POST /api/surveys`

Stockage local:

- `mock-api-data/observations.json`
- `mock-api-data/commentaires.json`
- `mock-api-data/surveys.json`

## Prod simple

1. Deployez `dist/` sur un hebergement statique.
2. Servez les PMTiles et GeoJSON.
3. Pointez `VITE_CONTRIBUTIONS_API_BASE` vers votre backend serverless.
4. Si les points d'attention sont dans Google Sheets, publiez le tableur en CSV et renseignez `VITE_CIBLES_SHEETS_CSV_URL`.

Un Google Sheet publie "to web" ne sert qu'en lecture. Pour ecrire les retours utilisateurs, il faut une API intermediaire (Apps Script, Cloudflare Worker, Netlify Function, etc.).
