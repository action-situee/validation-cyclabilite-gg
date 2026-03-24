# Validation Cyclabilite GG

Portail collaboratif de validation de l'indice de cyclabilite du Grand Geneve.

## Ce qu'il faut brancher

| Besoin | Format attendu | Source par defaut | Variable utile |
| --- | --- | --- | --- |
| Indice segmentaire affiche sur la carte | `.pmtiles` vectoriel | `public/tiles/bike_agglo_segment.pmtiles` si present | `VITE_PM_TILES_BIKE_SEGMENT` |
| Indice agrege carreau 200 m | `.pmtiles` vectoriel | `public/tiles/bike_agglo_carreau200.pmtiles` si present | `VITE_PM_TILES_BIKE_CARREAU200` |
| Couche frontiere `F` | `.pmtiles` vectoriel | URL distante atlas | `VITE_PM_TILES_PERIMETER` |
| Delimitations des faisceaux | `.geojson` Polygon / MultiPolygon | `public/data/corridors/f3_perimetre_arrondi.geojson` et `public/data/corridors/f4_perimetre_arrondi.geojson` | `VITE_FAISCEAU_GAILLARD_GEOJSON_URL` / `VITE_FAISCEAU_STJULIEN_GEOJSON_URL` |
| Points d'attention | `.geojson` Point ou CSV | aucune | `VITE_CIBLES_GEOJSON_URL` / `VITE_CIBLES_SHEETS_CSV_URL` |
| Retours terrain | API JSON | D1 via `/api/observations` | `VITE_CONTRIBUTIONS_API_BASE` |
| Commentaires generaux | API JSON | D1 via `/api/commentaires` | `VITE_CONTRIBUTIONS_API_BASE` |
| Quantiles de l'indice | `.json` | `public/data/atlas/bike-metric-quantiles.json` | regenere par script |
| Ecriture distante des contributions | endpoints HTTP JSON | D1 via `/api` | `VITE_CONTRIBUTIONS_API_BASE` |

Le portail ne lit pas directement un `.parquet` dans le navigateur. Le brut vit dans `copie-atlas-marchabilite-cyclabilite/` puis passe par le pipeline atlas (`parquet -> ndjson/tiles -> pmtiles + quantiles`).

Les contributions chargees par le front proviennent uniquement de D1 via `/api`. Il n'y a plus de fallback CSV ni de mode mock pour les observations, commentaires ou questionnaires.

## Lecture locale

- `public/data/atlas/` : sorties atlas versionnees pour l'indice
- `public/data/corridors/` : delimitations des faisceaux
- `public/data/google-sheets/*-template.csv` : templates de structure pour des imports eventuels

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
- `src/app/utils/api.ts` : contrat HTTP des contributions D1 via `/api`
- `vite.config.ts` : configuration Vite
- `scripts/prepare-public-data.mjs` : regeneration des sorties atlas publiques
- `docs/DATA-PUBLICATION.md` : formats attendus
