# Architecture

Le depot a 4 zones utiles:

1. `src/` : frontend React/Vite.
2. `public/data/` : fichiers statiques lus par le front (`corridors.geojson`, quantiles, templates CSV).
3. `mock-api-data/` + `vite.config.ts` : endpoints locaux `/api/*` pour la lecture / ecriture en dev.
4. `copie-atlas-marchabilite-cyclabilite/` : source cartographique de reference pour regenerer l'indice.

## Fichiers clefs

- `src/app/App.tsx` : layout global, sidebars, modales, choix de metrique.
- `src/app/components/Map.tsx` : MapLibre, PMTiles, controles carte, hover/clic segment.
- `src/app/hooks/useAppData.tsx` : charge corridors, points d'attention, commentaires et observations.
- `src/app/utils/data-loader.ts` : branchement des fichiers externes en lecture.
- `src/app/utils/api.ts` : contrat HTTP des contributions.
- `vite.config.ts` : mock API locale.
- `scripts/prepare-public-data.mjs` : extraction atlas -> fichiers publics.

## Lecture des donnees

- Indice carte : `VITE_PM_TILES_BIKE_SEGMENT`
- Frontiere carte : `VITE_PM_TILES_PERIMETER`
- Corridors : `VITE_CORRIDORS_GEOJSON_URL` ou `public/data/corridors.geojson`
- Points d'attention : `VITE_CIBLES_GEOJSON_URL` ou `VITE_CIBLES_SHEETS_CSV_URL`
- Contributions existantes : `GET /api/*` ou fallback `localStorage`

## Ecriture des donnees

- Observations libres et validations segment : `POST /api/observations`
- Votes / edition observation : `PUT /api/observations/:id`
- Commentaires generaux : `POST /api/commentaires`
- Questionnaire : `POST /api/surveys`

En local, ces ecritures vont dans `mock-api-data/*.json`. En prod, il faut fournir la meme API via `VITE_CONTRIBUTIONS_API_BASE`.
