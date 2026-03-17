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
- `VITE_OBSERVATIONS_SHEETS_CSV_URL` et `VITE_COMMENTAIRES_SHEETS_CSV_URL` si vous remplacez les CSV mock locaux
- `VITE_CONTRIBUTIONS_API_BASE` seulement quand une API distante existe

## Contrat local de dev

Donnees lues directement par le front:

- `public/data/google-sheets/cibles-mock.csv`
- `public/data/google-sheets/remontees-mock.csv`
- `public/data/google-sheets/commentaires-mock.csv`
- `public/data/google-sheets/questionnaire-mock.csv`

Stockage d'ecriture local:

- `localStorage` du navigateur

## Prod simple

1. Deployez `dist/` sur un hebergement statique.
2. Servez les PMTiles et GeoJSON.
3. Pointez `VITE_CONTRIBUTIONS_API_BASE` vers votre backend serverless.
4. Si les points d'attention, retours ou commentaires sont en ligne, exposez-les en CSV et renseignez les variables `VITE_*_SHEETS_CSV_URL`.

Un Google Sheet publie "to web" ne sert qu'en lecture. Pour ecrire les retours utilisateurs, il faut une API intermediaire (Apps Script, Cloudflare Worker, Netlify Function, etc.).
