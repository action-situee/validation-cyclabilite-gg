# Architecture

## Vue d'ensemble

L'application principale est maintenant a la racine du depot. Le portail collaboratif s'appuie sur trois couches:

1. `src/` pour l'interface React/Vite
2. `public/data/` pour les donnees publiees et lisibles sans backend
3. `mock-api-data/` + `vite.config.ts` pour des endpoints locaux `/api/*` en mode dev/preview

Le dossier `copie-atlas-marchabilite-cyclabilite/` reste la source cartographique de reference. Le portail n'en consomme pas directement tout le volume; il utilise des sorties preparees par `scripts/prepare-public-data.mjs`.

## Arborescence utile

```text
.
├── src/
│   ├── main.tsx
│   ├── styles/
│   └── app/
│       ├── App.tsx
│       ├── hooks/useAppData.tsx
│       ├── components/
│       ├── types/index.ts
│       └── utils/
├── public/
│   ├── data/
│   │   ├── corridors.geojson
│   │   ├── atlas/
│   │   └── google-sheets/*.csv
│   └── tiles/
├── mock-api-data/
│   ├── observations.json
│   ├── commentaires.json
│   └── surveys.json
├── scripts/prepare-public-data.mjs
├── docs/
├── Portail web collaboratif/
└── copie-atlas-marchabilite-cyclabilite/
```

## Flux de donnees

### Lecture

- Corridors: GeoJSON via `public/data/corridors.geojson`
- Cibles: mock TypeScript par defaut, ou GeoJSON / Google Sheets CSV via variables d'environnement
- Segments atlas: PMTiles plein territoire via `VITE_PM_TILES_BIKE_SEGMENT`, avec sorties auxiliaires regenerees dans `public/data/atlas/`
- Contributions: endpoints `/api/*` si disponibles, sinon `localStorage`

### Ecriture

- Questionnaire: `POST /api/surveys`
- Observations terrain: `POST /api/observations`
- Commentaires generaux: `POST /api/commentaires`
- Votes: mise a jour de l'observation puis `PUT /api/observations/:id`

Les endpoints locaux ecrivent dans `mock-api-data/*.json`. Ils servent de contrat d'API minimal avant un deploiement serverless reel.

## Carte

- Moteur: MapLibre GL + PMTiles
- Fond: styles vectoriels Carto / swisstopo
- Corridors: polygones GeoJSON
- Segments atlas: lignes tuilées colorees selon `bike_index` ou une classe d'attribut
- Points d'attention: cercles thematiques au-dessus de l'indice
- Retours terrain: marqueurs libres au-dessus de la carte

Le clic sur un segment atlas en mode `+ Ajouter` ouvre directement le formulaire de validation sur ce segment.

## Choix de diffusion

- le rendu principal utilise le PMTiles segmentaire du Grand Geneve
- les sorties de `public/data/atlas/` servent surtout a la preparation, au debug et aux seuils quantiles
- ces sorties et les gros assets atlas ne sont pas versionnes dans git
