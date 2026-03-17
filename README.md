# Validation Cyclabilite GG

Application principale de validation collaborative de l'indice de cyclabilite pour deux corridors transfrontaliers du Grand Geneve.

Le portail vit maintenant a la racine du depot. Il combine:

- une interface React/Vite simple pour des usagers non techniques
- des points d'attention thematiques a commenter
- un questionnaire rapide
- une couche segmentaire velo derivee de l'atlas `copie-atlas-marchabilite-cyclabilite/`
- des endpoints locaux `/api/*` pour simuler la lecture/ecriture collaborative en dev et en preview

## Structure utile

```text
.
├── src/                            # frontend principal
├── public/data/                    # corridors, templates CSV et sorties atlas regenerees localement
├── public/tiles/                   # PMTiles locaux optionnels pour le dev
├── mock-api-data/                  # stock JSON local pour /api/* (non versionne)
├── scripts/prepare-public-data.mjs # extraction atlas -> public/data
├── docs/                           # architecture, deploiement, publication des donnees
├── Portail web collaboratif/       # copie historique du prototype initial
└── copie-atlas-marchabilite-cyclabilite/ # source de verite cartographique
```

## Donnees integrees

- Corridors publies: `public/data/corridors.geojson`
- Segments velo filtres sur 2 corridors: `public/data/atlas/bike-segments.geojson`
- Resume d'extraction: `public/data/atlas/bike-segments-summary.json`
- Templates Google Sheets: `public/data/google-sheets/cibles-template.csv`, `public/data/google-sheets/questionnaire-template.csv`, `public/data/google-sheets/remontees-template.csv`

L'extraction segmentaire part du NDJSON atlas:

- `copie-atlas-marchabilite-cyclabilite/data_tiles/tmp/bike_agglo_segment.ndjson`

et conserve les champs utiles a la validation:

- `segment_id`, `bike_index`, `bike_index_class`, `length`
- `Classe_attractivite`, `Classe_confort`, `Classe_equipement`, `Classe_infrastructure`, `Classe_securite`
- les attributs fins de confort, equipement, infrastructure et securite

## Versionnement des donnees

Le depot git est prepare pour ne pas versionner:

- les tuiles PMTiles locales
- les extractions atlas regenerees dans `public/data/atlas/`
- les stocks locaux `mock-api-data/*.json`
- les gros repertoires de donnees du dossier `copie-atlas-marchabilite-cyclabilite/`

En local, la carte peut lire `public/tiles/bike_agglo_segment.pmtiles`.
En deploiement Pages, la variable `VITE_PM_TILES_BIKE_SEGMENT` definie dans `wrangler.toml` pointe vers la tuile distante de l'atlas.

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

## Mode local "serverless"

- `npm run dev` expose le frontend Vite et des endpoints locaux `/api/observations`, `/api/commentaires`, `/api/surveys`
- `npm run preview` sert le build `dist/` avec les memes endpoints locaux
- les donnees de ces endpoints sont stockees dans `mock-api-data/*.json`

Le frontend ecrit vers `/api/*` quand ils existent, et garde `localStorage` comme repli si aucun endpoint n'est joignable.

## Sources externes

Le chargeur de donnees supporte deja:

- `VITE_CORRIDORS_GEOJSON_URL`
- `VITE_CIBLES_GEOJSON_URL`
- `VITE_CIBLES_SHEETS_CSV_URL`
- `VITE_BIKE_SEGMENTS_GEOJSON_URL`
- `VITE_CONTRIBUTIONS_API_BASE`

Cela permet de remplacer les fichiers locaux par:

- un GeoJSON publie pour les corridors
- un Google Sheet publie en CSV pour les points d'attention
- un endpoint externe pour la lecture/ecriture des contributions

## Docs

- `docs/ARCHITECTURE.md`
- `docs/DEPLOIEMENT.md`
- `docs/DATA-PUBLICATION.md`
