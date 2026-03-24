# Architecture

Le depot a 4 zones utiles:

1. `src/` : frontend React/Vite.
2. `public/data/` : fichiers statiques lus par le front (`corridors.geojson`, sorties atlas, templates CSV).
3. `src/app/utils/api.ts` : contrat HTTP du front vers les endpoints `/api`.
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
- Faisceaux : `VITE_FAISCEAU_GAILLARD_GEOJSON_URL`, `VITE_FAISCEAU_STJULIEN_GEOJSON_URL` ou les GeoJSON locaux dans `public/data/corridors/`
- Points d'attention : `VITE_CIBLES_GEOJSON_URL` ou `VITE_CIBLES_SHEETS_CSV_URL`
- Retours terrain : `GET /api/observations`
- Commentaires : `GET /api/commentaires`
- Questionnaires existants : `GET /api/surveys`

## Ecriture des donnees

- Observations libres et validations segment : `POST /api/observations`
- Votes / edition observation : `PUT /api/observations/:id`
- Commentaires generaux : `POST /api/commentaires`
- Questionnaire : `POST /api/surveys`

Le front charge ses contributions uniquement via `VITE_CONTRIBUTIONS_API_BASE`, fixe a `/api` en deployment Cloudflare.

Le depot contient maintenant cette API dans `functions/api/` pour Cloudflare Pages. Avec un binding D1 `CONTRIBUTIONS_DB`, elle devient persistante et lisible de facon tabulaire; sans binding, elle repond en `503` pour signaler une configuration Cloudflare incomplete.
