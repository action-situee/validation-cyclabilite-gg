# Publication Des Donnees

## Donnees prêtes dans le repo

Le portail peut deja tourner sans service externe grace a:

- `public/data/corridors.geojson`
- `public/data/atlas/bike-segments.geojson`
- `public/data/google-sheets/cibles-template.csv`
- `public/data/google-sheets/questionnaire-template.csv`
- `public/data/google-sheets/remontees-template.csv`

## Lecture depuis Google Sheets

Pour les cibles, le front supporte deja un CSV publie via:

- `VITE_CIBLES_SHEETS_CSV_URL`

Utilisez `public/data/google-sheets/cibles-template.csv` comme schema de colonnes.

Procedure:

1. creez un Google Sheet avec exactement ces colonnes
2. remplissez ou collez vos cibles
3. `File -> Share -> Publish to web`
4. choisissez `CSV`
5. placez l'URL publiee dans `.env.local`:

```env
VITE_CIBLES_SHEETS_CSV_URL=https://docs.google.com/spreadsheets/d/e/.../pub?output=csv
```

## Ecriture simple pour les retours utilisateurs

Le front ecrit vers `VITE_CONTRIBUTIONS_API_BASE`, par defaut `/api`.

En local:

- `/api/observations`
- `/api/commentaires`
- `/api/surveys`

En deploiement, remplacez cette base par:

- un backend serverless maison
- une fonction Cloudflare / Vercel / Netlify
- ou un Google Apps Script qui respecte les memes chemins

Exemple:

```env
VITE_CONTRIBUTIONS_API_BASE=https://script.google.com/macros/s/DEPLOYMENT_ID/exec
```

## Contrat attendu pour un backend externe

### Observations

- `GET /observations` -> liste JSON
- `POST /observations` -> cree une observation
- `PUT /observations/:id` -> met a jour une observation
- `DELETE /observations/:id` -> supprime une observation

### Commentaires

- `GET /commentaires`
- `POST /commentaires`
- `DELETE /commentaires/:id`

### Questionnaire

- `GET /surveys`
- `POST /surveys`

## Regeneration des segments atlas

Le fichier `public/data/atlas/bike-segments.geojson` est genere depuis:

- `copie-atlas-marchabilite-cyclabilite/data_tiles/tmp/bike_agglo_segment.ndjson`

Commande:

```bash
npm run data:prepare
```

Le resume du filtrage est dans:

- `public/data/atlas/bike-segments-summary.json`

## Variables d'environnement utiles

```env
VITE_CORRIDORS_GEOJSON_URL=/data/corridors.geojson
VITE_PM_TILES_BIKE_SEGMENT=https://.../bike_agglo_segment.pmtiles
VITE_CIBLES_GEOJSON_URL=
VITE_CIBLES_SHEETS_CSV_URL=
VITE_CONTRIBUTIONS_API_BASE=/api
```
