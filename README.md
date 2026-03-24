# Validation Cyclabilite GG

Portail collaboratif de validation de l'indice de cyclabilite du Grand Geneve.

## Ce qu'il faut brancher

| Besoin | Format attendu | Source par defaut | Variable utile |
| --- | --- | --- | --- |
| Indice segmentaire affiche sur la carte | `.pmtiles` vectoriel | `public/tiles/bike_agglo_segment.pmtiles` si present | `VITE_PM_TILES_BIKE_SEGMENT` |
| Indice agrege carreau 200 m | `.pmtiles` vectoriel | `public/tiles/bike_agglo_carreau200.pmtiles` si present | `VITE_PM_TILES_BIKE_CARREAU200` |
| Couche frontiere `F` | `.pmtiles` vectoriel | URL distante atlas | `VITE_PM_TILES_PERIMETER` |
| Delimitations des faisceaux | `.geojson` Polygon / MultiPolygon | `public/data/corridors/f3_perimetre_arrondi.geojson` et `public/data/corridors/f4_perimetre_arrondi.geojson` | `VITE_FAISCEAU_GAILLARD_GEOJSON_URL` / `VITE_FAISCEAU_STJULIEN_GEOJSON_URL` |
| Points d'attention | `.geojson` Point ou CSV | mock local | `VITE_CIBLES_GEOJSON_URL` / `VITE_CIBLES_SHEETS_CSV_URL` |
| Retours terrain | CSV | `public/data/google-sheets/remontees-mock.csv` | `VITE_OBSERVATIONS_SHEETS_CSV_URL` |
| Commentaires generaux | CSV | `public/data/google-sheets/commentaires-mock.csv` | `VITE_COMMENTAIRES_SHEETS_CSV_URL` |
| Quantiles de l'indice | `.json` | `public/data/atlas/bike-metric-quantiles.json` | regenere par script |
| Ecriture distante des contributions | endpoints HTTP JSON optionnels | desactivee en local | `VITE_CONTRIBUTIONS_API_BASE` |

Le portail ne lit pas directement un `.parquet` dans le navigateur. Le brut vit dans `copie-atlas-marchabilite-cyclabilite/` puis passe par le pipeline atlas (`parquet -> ndjson/tiles -> pmtiles + quantiles`).

Par defaut, les CSV mock locaux restent le fallback. Pour forcer explicitement ce mode, definir `VITE_FORCE_LOCAL_MOCKS=true`. Sinon, toute URL `VITE_*` renseignee sera prise en compte avant le fallback local.

## Lecture locale

- `public/data/google-sheets/cibles-mock.csv` : points d'attention
- `public/data/google-sheets/remontees-mock.csv` : observations sur la carte
- `public/data/google-sheets/commentaires-mock.csv` : commentaires dans la sidebar
- `public/data/google-sheets/questionnaire-mock.csv` : donnees de questionnaire

En local, ces fichiers sont lus directement par le front.

## API Cloudflare

Le depot inclut maintenant des endpoints Cloudflare Pages Functions:

- `GET /api/observations`
- `POST /api/observations`
- `PUT /api/observations/:id`
- `DELETE /api/observations/:id`
- `GET /api/commentaires`
- `POST /api/commentaires`
- `DELETE /api/commentaires/:id`
- `GET /api/surveys`
- `POST /api/surveys`

En production Cloudflare, le front cible `/api` via `VITE_CONTRIBUTIONS_API_BASE=/api`.

Pour une persistance durable, ajoutez un binding D1 `CONTRIBUTIONS_DB` dans Cloudflare Pages. Sans binding, les fonctions `/api` repondent en `503` et aucune contribution n'est stockee cote Cloudflare.

Commandes Cloudflare minimales:

```bash
npx wrangler login
npx wrangler d1 create validation-cyclabilite-gg
npx wrangler d1 migrations apply validation-cyclabilite-gg
npx wrangler pages project create validation-cyclabilite-gg --production-branch main
npm run deploy:pages
```

## Commandes

```bash
npm install
npm run data:prepare
npm run dev
```

Autres commandes:

```bash
npm run build
npm run preview
```

## Fichiers importants

- `src/app/utils/data-loader.ts` : lecture directe des corridors, points, retours et commentaires
- `src/app/utils/api.ts` : contrat HTTP optionnel pour les ecritures distantes
- `vite.config.ts` : configuration Vite
- `scripts/prepare-public-data.mjs` : regeneration des sorties atlas publiques
- `docs/DATA-PUBLICATION.md` : formats attendus
