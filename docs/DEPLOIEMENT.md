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

## Creation de la base D1 Cloudflare

Authentification Cloudflare:

```bash
npx wrangler login
```

Creation de la base D1:

```bash
npx wrangler d1 create validation-cyclabilite-gg
```

Application du schema SQL:

```bash
npx wrangler d1 migrations apply validation-cyclabilite-gg
```

Ajoutez ensuite le binding D1 dans Cloudflare Pages ou dans `wrangler.toml` avec ce bloc:

```toml
[[d1_databases]]
binding = "CONTRIBUTIONS_DB"
database_name = "validation-cyclabilite-gg"
database_id = "<D1_DATABASE_ID>"
migrations_dir = "migrations"
```

## Ce qui doit exister

- `VITE_PM_TILES_BIKE_SEGMENT` si vous ne servez pas `public/tiles/bike_agglo_segment.pmtiles`
- `VITE_PM_TILES_BIKE_CARREAU200` si vous ne servez pas `public/tiles/bike_agglo_carreau200.pmtiles`
- `public/data/corridors/f3_perimetre_arrondi.geojson` et `public/data/corridors/f4_perimetre_arrondi.geojson`, ou les variables `VITE_FAISCEAU_GAILLARD_GEOJSON_URL` et `VITE_FAISCEAU_STJULIEN_GEOJSON_URL`
- `VITE_CIBLES_GEOJSON_URL` ou `VITE_CIBLES_SHEETS_CSV_URL` si vous voulez afficher des points d'attention
- `VITE_CONTRIBUTIONS_API_BASE=/api` pour utiliser les Pages Functions incluses
- un binding D1 `CONTRIBUTIONS_DB` pour la persistance des contributions

## Prod simple

1. Deployez `dist/` sur un hebergement statique.
2. Servez les PMTiles et GeoJSON, idealement depuis Cloudflare Pages ou R2.
3. Activez `VITE_CONTRIBUTIONS_API_BASE=/api` pour utiliser les Pages Functions du dossier `functions/`.
4. Ajoutez un binding D1 `CONTRIBUTIONS_DB` si vous voulez conserver observations, commentaires et surveys entre les deploiements.
5. Si les points d'attention sont en ligne, exposez-les en GeoJSON ou CSV et renseignez les variables `VITE_CIBLES_*`.

## Deploiement Cloudflare Pages

Creation du projet Pages depuis le CLI:

```bash
npx wrangler pages project create validation-cyclabilite-gg --production-branch main
```

Premier deploiement depuis le repo local:

```bash
npm run deploy:pages
```

Cette commande:

- regenere `dist/`
- supprime les `.pmtiles` locaux de `dist/tiles/` pour eviter la limite Pages de 25 MiB par fichier
- deploye ensuite `dist` sur le projet Pages existant

Si vous preferez creer le projet dans l'interface Cloudflare:

1. Ouvrez Workers & Pages.
2. Creez un projet Pages.
3. Connectez le repo GitHub.
4. Configurez la commande de build `npm run build`.
5. Configurez le dossier de sortie `dist`.
6. Ajoutez les variables d'environnement presentes dans `wrangler.toml` si vous pilotez la config depuis l'UI.
7. Ajoutez le binding D1 `CONTRIBUTIONS_DB` dans Settings > Functions > D1 bindings.

## Verification post-deploiement

Controlez ces URLs:

```bash
curl https://<votre-domaine-pages>/api/observations
curl https://<votre-domaine-pages>/api/commentaires
curl https://<votre-domaine-pages>/api/surveys
```

Si D1 est bien branchee, vous devez obtenir `[]` sur un projet vierge, pas une erreur `503`.

Si `wrangler pages deploy` echoue avec un message sur un fichier trop volumineux dans `dist/tiles`, utilisez `npm run deploy:pages` plutot que la commande brute.

Un Google Sheet publie "to web" ne sert qu'en lecture. Les ecritures passent ici par les Pages Functions `/api/*`, stockees en D1.
