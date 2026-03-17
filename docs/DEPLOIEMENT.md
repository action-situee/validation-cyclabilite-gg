# Deploiement

## Local

Installation:

```bash
npm install
```

Preparation des donnees publiees:

```bash
npm run data:prepare
```

Demarrage dev:

```bash
npm run dev
```

Build + preview:

```bash
npm run build
npm run preview
```

Le build est deja valide dans cet environnement. `npm run preview` expose aussi les endpoints locaux `/api/*`.

## Contrat d'API local

Routes actuellement disponibles en dev/preview:

- `GET /api/observations`
- `POST /api/observations`
- `PUT /api/observations/:id`
- `DELETE /api/observations/:id`
- `GET /api/commentaires`
- `POST /api/commentaires`
- `DELETE /api/commentaires/:id`
- `GET /api/surveys`
- `POST /api/surveys`

Le stockage se fait dans:

- `mock-api-data/observations.json`
- `mock-api-data/commentaires.json`
- `mock-api-data/surveys.json`

## Deploiement statique + backend externe

Le frontend peut etre deploie sur n'importe quel hebergement statique compatible Vite:

- Cloudflare Pages
- Netlify
- Vercel
- GitHub Pages

Ensuite:

1. servez `dist/`
2. pointez `VITE_CONTRIBUTIONS_API_BASE` vers un backend externe
3. pointez `VITE_CIBLES_SHEETS_CSV_URL` vers un Google Sheet publie si vous externalisez les cibles
4. gardez `public/data/corridors.geojson` et fournissez `VITE_PM_TILES_BIKE_SEGMENT` pour la tuile segmentaire

## Recommandation pour la prod

- Frontend statique: Pages / Netlify / Vercel
- Lecture des cibles: Google Sheets publie en CSV si besoin d'edition simple
- Ecriture des contributions: petit backend serverless ou Google Apps Script
- Regeneration cartographique: `scripts/prepare-public-data.mjs` a relancer apres mise a jour de l'atlas
