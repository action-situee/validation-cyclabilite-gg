# Architecture

Le depot a 4 zones utiles:

1. `src/` : frontend React/Vite.
2. `public/data/` : fichiers statiques lus par le front (`corridors.geojson`, quantiles, CSV mocks).
3. `src/app/utils/api.ts` : contrat HTTP optionnel pour une future API distante.
4. `copie-atlas-marchabilite-cyclabilite/` : source cartographique de reference pour regenerer l'indice.

## Fichiers clefs

- `src/app/App.tsx` : layout global, sidebars, modales, choix de metrique.
- `src/app/components/Map.tsx` : MapLibre, PMTiles, controles carte, hover/clic segment.
- `src/app/hooks/useAppData.tsx` : charge corridors, points d'attention, commentaires et observations.
- `src/app/utils/data-loader.ts` : branchement des fichiers externes en lecture.
- `src/app/utils/api.ts` : contrat HTTP optionnel des contributions.
- `vite.config.ts` : configuration Vite.
- `scripts/prepare-public-data.mjs` : extraction atlas -> fichiers publics.

## Lecture des donnees

- Indice carte : `VITE_PM_TILES_BIKE_SEGMENT`
- Frontiere carte : `VITE_PM_TILES_PERIMETER`
- Corridors : `VITE_CORRIDORS_GEOJSON_URL` ou `public/data/corridors.geojson`
- Points d'attention : `VITE_CIBLES_GEOJSON_URL` ou `VITE_CIBLES_SHEETS_CSV_URL`
- Retours terrain : `VITE_OBSERVATIONS_SHEETS_CSV_URL` ou `public/data/google-sheets/remontees-mock.csv`
- Commentaires : `VITE_COMMENTAIRES_SHEETS_CSV_URL` ou `public/data/google-sheets/commentaires-mock.csv`
- Questionnaires existants : `public/data/google-sheets/questionnaire-mock.csv`
- Fallback d'ecriture locale : `localStorage`

## Ecriture des donnees

- Observations libres et validations segment : `POST /api/observations`
- Votes / edition observation : `PUT /api/observations/:id`
- Commentaires generaux : `POST /api/commentaires`
- Questionnaire : `POST /api/surveys`

En local, sans `VITE_CONTRIBUTIONS_API_BASE`, ces ecritures restent locales au navigateur via `localStorage`. En prod, il faut fournir une API via `VITE_CONTRIBUTIONS_API_BASE`.
