# Validation Cyclabilite GG

Portail collaboratif de validation de l'indice de cyclabilite du Grand Geneve.

## Ce qu'il faut brancher

| Besoin | Format attendu | Source par defaut | Variable utile |
| --- | --- | --- | --- |
| Indice segmentaire affiche sur la carte | `.pmtiles` vectoriel | `public/tiles/bike_agglo_segment.pmtiles` si present | `VITE_PM_TILES_BIKE_SEGMENT` |
| Couche frontiere `F` | `.pmtiles` vectoriel | URL distante atlas | `VITE_PM_TILES_PERIMETER` |
| Corridors transfrontaliers | `.geojson` Polygon / MultiPolygon | `public/data/corridors.geojson` | `VITE_CORRIDORS_GEOJSON_URL` |
| Points d'attention | `.geojson` Point ou Google Sheet publie en CSV | mock local | `VITE_CIBLES_GEOJSON_URL` / `VITE_CIBLES_SHEETS_CSV_URL` |
| Quantiles de l'indice | `.json` | `public/data/atlas/bike-metric-quantiles.json` | regenere par script |
| Lecture / ecriture des contributions | endpoints HTTP JSON | `/api/*` local en dev/preview | `VITE_CONTRIBUTIONS_API_BASE` |

Le portail ne lit pas directement un `.parquet` dans le navigateur. Le brut vit dans `copie-atlas-marchabilite-cyclabilite/` puis passe par le pipeline atlas (`parquet -> ndjson/tiles -> pmtiles + quantiles`).

## Endpoints

Lecture:

- `GET /api/observations`
- `GET /api/commentaires`
- `GET /api/surveys`

Ecriture:

- `POST /api/observations`
- `PUT /api/observations/:id`
- `DELETE /api/observations/:id`
- `POST /api/commentaires`
- `DELETE /api/commentaires/:id`
- `POST /api/surveys`

En local, ces routes sont servies par `vite.config.ts` et stockent dans `mock-api-data/*.json`.

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

- `src/app/utils/data-loader.ts` : lecture des corridors et points d'attention
- `src/app/utils/api.ts` : contrat HTTP lecture / ecriture
- `vite.config.ts` : endpoints locaux `/api/*`
- `scripts/prepare-public-data.mjs` : regeneration des sorties atlas publiques
- `docs/DATA-PUBLICATION.md` : formats attendus
