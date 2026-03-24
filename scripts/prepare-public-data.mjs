import { createReadStream } from 'node:fs';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const dataDirs = {
  publicData: path.join(repoRoot, 'public', 'data'),
  atlas: path.join(repoRoot, 'public', 'data', 'atlas'),
  sheets: path.join(repoRoot, 'public', 'data', 'google-sheets'),
};

const atlasPaths = {
  sourceNdjson: path.join(
    repoRoot,
    'copie-atlas-marchabilite-cyclabilite',
    'data_tiles',
    'tmp',
    'bike_agglo_segment.ndjson',
  ),
  sourcePmtiles: '/tiles/bike_agglo_segment.pmtiles',
  outputSegments: path.join(dataDirs.atlas, 'bike-segments.geojson'),
  outputSummary: path.join(dataDirs.atlas, 'bike-segments-summary.json'),
  outputQuantiles: path.join(dataDirs.atlas, 'bike-metric-quantiles.json'),
  outputCorridors: path.join(dataDirs.publicData, 'corridors.geojson'),
  outputCiblesTemplate: path.join(dataDirs.sheets, 'cibles-template.csv'),
  outputQuestionnaireTemplate: path.join(dataDirs.sheets, 'questionnaire-template.csv'),
  outputRemonteesTemplate: path.join(dataDirs.sheets, 'remontees-template.csv'),
};

const quantileMetricFields = [
  'bike_index',
  'Classe_attractivite',
  'Classe_confort',
  'Classe_equipement',
  'Classe_infrastructure',
  'Classe_securite',
];

const corridors = [
  {
    id: 'plo_stjulien',
    nom: 'Saint-Julien - PLO - Geneve',
    description: 'Corridor sud de Saint-Julien-en-Genevois a Geneve via Bardonnex et Plan-les-Ouates.',
    color: '#1b4332',
    center: [46.158, 6.112],
    zoom: 13,
    labelAnchor: [46.162, 6.068],
    centerline: [
      [46.1350, 6.0770],
      [46.1400, 6.0810],
      [46.1450, 6.0860],
      [46.1490, 6.0925],
      [46.1520, 6.0975],
      [46.1555, 6.1025],
      [46.1590, 6.1053],
      [46.1620, 6.1070],
      [46.1660, 6.1085],
      [46.1700, 6.1105],
      [46.1730, 6.1130],
      [46.1760, 6.1160],
      [46.1800, 6.1215],
      [46.1840, 6.1285],
      [46.1880, 6.1360],
      [46.1920, 6.1350],
    ],
    polygon: [
      [46.1350, 6.0680],
      [46.1400, 6.0720],
      [46.1450, 6.0770],
      [46.1490, 6.0840],
      [46.1520, 6.0890],
      [46.1555, 6.0940],
      [46.1590, 6.0970],
      [46.1620, 6.0985],
      [46.1660, 6.1000],
      [46.1700, 6.1020],
      [46.1730, 6.1040],
      [46.1760, 6.1070],
      [46.1800, 6.1120],
      [46.1840, 6.1190],
      [46.1880, 6.1270],
      [46.1920, 6.1350],
      [46.1880, 6.1450],
      [46.1840, 6.1380],
      [46.1800, 6.1310],
      [46.1760, 6.1250],
      [46.1730, 6.1220],
      [46.1700, 6.1190],
      [46.1660, 6.1170],
      [46.1620, 6.1155],
      [46.1590, 6.1135],
      [46.1555, 6.1110],
      [46.1520, 6.1060],
      [46.1490, 6.1010],
      [46.1450, 6.0950],
      [46.1400, 6.0900],
      [46.1350, 6.0860],
      [46.1350, 6.0680],
    ],
  },
  {
    id: 'thonex_gaillard',
    nom: 'Gaillard - Thonex - Eaux-Vives',
    description: 'Corridor est de Gaillard aux Eaux-Vives via Thonex et Chene-Bougeries.',
    color: '#2d6a4f',
    center: [46.197, 6.195],
    zoom: 13,
    labelAnchor: [46.212, 6.190],
    centerline: [
      [46.2060, 6.1440],
      [46.2061, 6.1520],
      [46.2060, 6.1600],
      [46.2051, 6.1680],
      [46.2042, 6.1740],
      [46.2035, 6.1800],
      [46.2029, 6.1870],
      [46.2022, 6.1940],
      [46.2015, 6.2000],
      [46.2008, 6.2060],
      [46.2000, 6.2120],
      [46.1990, 6.2180],
      [46.1978, 6.2230],
      [46.1964, 6.2280],
      [46.1948, 6.2330],
      [46.1950, 6.2390],
    ],
    polygon: [
      [46.2085, 6.1440],
      [46.2090, 6.1520],
      [46.2088, 6.1600],
      [46.2082, 6.1680],
      [46.2072, 6.1740],
      [46.2065, 6.1800],
      [46.2060, 6.1870],
      [46.2052, 6.1940],
      [46.2045, 6.2000],
      [46.2038, 6.2060],
      [46.2030, 6.2120],
      [46.2020, 6.2180],
      [46.2008, 6.2230],
      [46.1992, 6.2280],
      [46.1975, 6.2330],
      [46.1950, 6.2390],
      [46.1920, 6.2330],
      [46.1935, 6.2280],
      [46.1948, 6.2230],
      [46.1960, 6.2180],
      [46.1970, 6.2120],
      [46.1978, 6.2060],
      [46.1985, 6.2000],
      [46.1992, 6.1940],
      [46.1998, 6.1870],
      [46.2005, 6.1800],
      [46.2012, 6.1740],
      [46.2020, 6.1680],
      [46.2028, 6.1600],
      [46.2032, 6.1520],
      [46.2035, 6.1440],
      [46.2085, 6.1440],
    ],
  },
];

const ciblesTemplateRows = [
  'cible_id,faisceau_id,faisceau_nom,theme_principal,latitude,longitude,titre_affichage,sous_titre_affichage,question_cle,score,classe',
  'PS_001,plo_stjulien,Saint-Julien - PLO - Geneve,equipements,46.1432,6.0835,Parking velo gare routiere St-Julien,Stationnement securise absent,Le stationnement velo est-il suffisant ?,1.8,tres_faible',
  "PS_007,plo_stjulien,Saint-Julien - PLO - Geneve,continuite,46.1680,6.1110,Discontinuite Route de Saconnex-d'Arve,Rupture majeure de la piste,La continuite cyclable est-elle assuree ?,2.2,faible",
  'TG_003,thonex_gaillard,Gaillard - Thonex - Eaux-Vives,permeabilite_frontiere,46.1985,6.2220,Passage frontiere Moillesulaz,,La permeabilite frontaliere est-elle suffisante ?,2.3,faible',
  'TG_006,thonex_gaillard,Gaillard - Thonex - Eaux-Vives,intersections,46.2028,6.1940,Carrefour Gradelle / Route de Chene,,La gestion de cette intersection est-elle securisee ?,3.1,moyen',
];

const questionnaireTemplateRows = [
  'id,auteur,organisation,faisceau_id,q1,q2,q3,date',
  'SURVEY_001,Association velo exemple,Pro Velo,plo_stjulien,plutot_oui,globalement_ok,Les classes sont bonnes mais certains giratoires sont sous-notes,2026-03-17',
];

const remonteesTemplateRows = [
  'id,type,auteur,organisation,faisceau_id,segment_id,cible_id,latitude,longitude,indice_juge,commentaire,date',
  'OBS_001,validation,Association velo exemple,Pro Velo,plo_stjulien,000123,PS_007,46.1680,6.1110,trop_faible,Le score est trop optimiste vu la rupture de piste observee,2026-03-17',
];

function toLngLatRing(points) {
  return points.map(([lat, lng]) => [lng, lat]);
}

function pointInPolygon(point, polygon) {
  let inside = false;
  const [x, y] = point;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersects =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / ((yj - yi) || Number.EPSILON) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function getFeatureMidpoint(coordinates) {
  if (!Array.isArray(coordinates) || coordinates.length === 0) {
    return null;
  }
  const middle = coordinates[Math.floor(coordinates.length / 2)];
  return Array.isArray(middle) && middle.length >= 2 ? middle : coordinates[0];
}

function classifyBikeIndex(value) {
  if (!Number.isFinite(value)) return 'non_evalue';
  if (value < 0.2) return 'tres_faible';
  if (value < 0.4) return 'faible';
  if (value < 0.6) return 'moyen';
  if (value < 0.8) return 'bon';
  return 'tres_bon';
}

function computeQuantileThresholds(values, stepCount = 10) {
  if (!Array.isArray(values) || values.length < stepCount + 1) return [];
  const sorted = [...values].sort((a, b) => a - b);
  const thresholds = [];

  for (let i = 1; i <= stepCount; i += 1) {
    const position = ((sorted.length - 1) * i) / stepCount;
    const lower = Math.floor(position);
    const upper = Math.ceil(position);
    const weight = position - lower;
    const quantileValue = sorted[lower] * (1 - weight) + sorted[upper] * weight;
    thresholds.push(Number(quantileValue.toFixed(6)));
  }

  for (let i = 1; i < thresholds.length; i += 1) {
    if (thresholds[i] <= thresholds[i - 1]) {
      thresholds[i] = Number((thresholds[i - 1] + 1e-6).toFixed(6));
    }
  }

  return thresholds;
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function writeJson(filePath, payload) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

async function writeText(filePath, text) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, text, 'utf8');
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function prepareCorridorsGeoJson() {
  const features = corridors.map((corridor) => ({
    type: 'Feature',
    properties: {
      id: corridor.id,
      nom: corridor.nom,
      description: corridor.description,
      color: corridor.color,
      center_lat: corridor.center[0],
      center_lng: corridor.center[1],
      zoom: corridor.zoom,
      label_lat: corridor.labelAnchor[0],
      label_lng: corridor.labelAnchor[1],
      centerline: corridor.centerline,
    },
    geometry: {
      type: 'Polygon',
      coordinates: [toLngLatRing(corridor.polygon)],
    },
  }));

  await writeJson(atlasPaths.outputCorridors, {
    type: 'FeatureCollection',
    features,
  });
}

async function prepareTemplates() {
  await writeText(atlasPaths.outputCiblesTemplate, `${ciblesTemplateRows.join('\n')}\n`);
  await writeText(atlasPaths.outputQuestionnaireTemplate, `${questionnaireTemplateRows.join('\n')}\n`);
  await writeText(atlasPaths.outputRemonteesTemplate, `${remonteesTemplateRows.join('\n')}\n`);
}

function selectCorridor(pointLngLat) {
  for (const corridor of corridors) {
    if (pointInPolygon(pointLngLat, toLngLatRing(corridor.polygon))) {
      return corridor;
    }
  }
  return null;
}

async function prepareBikeSegments() {
  try {
    await fs.access(atlasPaths.sourceNdjson);
  } catch {
    const existingOutputs = await Promise.all([
      fileExists(atlasPaths.outputSegments),
      fileExists(atlasPaths.outputSummary),
      fileExists(atlasPaths.outputQuantiles),
    ]);

    if (existingOutputs.every(Boolean)) {
      console.warn(
        `[prepare-public-data] Source NDJSON introuvable (${path.relative(repoRoot, atlasPaths.sourceNdjson)}). Fichiers atlas existants conserves.`,
      );
      return;
    }

    await writeJson(atlasPaths.outputSegments, { type: 'FeatureCollection', features: [] });
    await writeJson(atlasPaths.outputSummary, {
      generated_at: new Date().toISOString(),
      source_ndjson: path.relative(repoRoot, atlasPaths.sourceNdjson),
      source_pmtiles: atlasPaths.sourcePmtiles,
      segment_count: 0,
      by_corridor: {},
      warning: 'Source NDJSON introuvable. Lancez le pipeline atlas avant de regenerer.',
    });
    await writeJson(atlasPaths.outputQuantiles, {
      generated_at: new Date().toISOString(),
      source_ndjson: path.relative(repoRoot, atlasPaths.sourceNdjson),
      metrics: {},
      warning: 'Source NDJSON introuvable. Quantiles non generes.',
    });
    return;
  }

  const summary = {};
  const features = [];
  const quantileBuckets = Object.fromEntries(
    quantileMetricFields.map((field) => [field, []]),
  );
  const stream = createReadStream(atlasPaths.sourceNdjson, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  for await (const line of rl) {
    if (!line.trim()) continue;

    let feature;
    try {
      feature = JSON.parse(line);
    } catch {
      continue;
    }

    const coordinates = feature.geometry?.coordinates;
    const midpoint = getFeatureMidpoint(coordinates);
    if (!midpoint) continue;

    const corridor = selectCorridor(midpoint);
    if (!corridor) continue;

    const properties = feature.properties || {};
    for (const field of quantileMetricFields) {
      const rawValue = Number(properties[field]);
      if (Number.isFinite(rawValue) && rawValue >= 0 && rawValue <= 1) {
        quantileBuckets[field].push(rawValue);
      }
    }

    const bikeIndex = Number(properties.bike_index);
    const exportedProperties = {
      segment_id: String(properties.segment_id ?? ''),
      length: Number(properties.length ?? 0),
      bike_index: Number.isFinite(bikeIndex) ? bikeIndex : null,
      bike_index_unweighted: Number(properties.bike_index_unweighted ?? 0),
      bike_index_class: classifyBikeIndex(bikeIndex),
      corridor_id: corridor.id,
      corridor_name: corridor.nom,
      corridor_color: corridor.color,
      center_lat: midpoint[1],
      center_lng: midpoint[0],
      Classe_attractivite: Number(properties.Classe_attractivite ?? 0),
      Classe_confort: Number(properties.Classe_confort ?? 0),
      Classe_equipement: Number(properties.Classe_equipement ?? 0),
      Classe_infrastructure: Number(properties.Classe_infrastructure ?? 0),
      Classe_securite: Number(properties.Classe_securite ?? 0),
      amenite: Number(properties.amenite ?? 0),
      connectivite: Number(properties.connectivite ?? 0),
      pente: Number(properties.pente ?? 0),
      eau: Number(properties.eau ?? 0),
      temperature: Number(properties.temperature ?? 0),
      air: Number(properties.air ?? 0),
      alentours: Number(properties.alentours ?? 0),
      canopee: Number(properties.canopee ?? 0),
      stationnement_velo: Number(properties.stationnement_velo ?? 0),
      borne_reparation: Number(properties.borne_reparation ?? 0),
      location: Number(properties.location ?? 0),
      sens_inverse: Number(properties.sens_inverse ?? 0),
      service_velo: Number(properties.service_velo ?? 0),
      parking_abris: Number(properties.parking_abris ?? 0),
      piste: Number(properties.piste ?? 0),
      bande: Number(properties.bande ?? 0),
      revetement: Number(properties.revetement ?? 0),
      giratoire: Number(properties.giratoire ?? 0),
      tourner_droite: Number(properties.tourner_droite ?? 0),
      eclairage: Number(properties.eclairage ?? 0),
      zone_apaisee: Number(properties.zone_apaisee ?? 0),
      vitesse_motorisee: Number(properties.vitesse_motorisee ?? 0),
      conflit_md: Number(properties.conflit_md ?? 0),
      accident: Number(properties.accident ?? 0),
    };

    summary[corridor.id] = (summary[corridor.id] || 0) + 1;
    features.push({
      type: 'Feature',
      properties: exportedProperties,
      geometry: feature.geometry,
    });
  }

  await writeJson(atlasPaths.outputSegments, {
    type: 'FeatureCollection',
    features,
  });

  await writeJson(atlasPaths.outputSummary, {
    generated_at: new Date().toISOString(),
    source_ndjson: path.relative(repoRoot, atlasPaths.sourceNdjson),
    source_pmtiles: atlasPaths.sourcePmtiles,
    segment_count: features.length,
    by_corridor: summary,
  });

  await writeJson(atlasPaths.outputQuantiles, {
    generated_at: new Date().toISOString(),
    source_ndjson: path.relative(repoRoot, atlasPaths.sourceNdjson),
    metrics: Object.fromEntries(
      quantileMetricFields.map((field) => [field, computeQuantileThresholds(quantileBuckets[field])]),
    ),
  });
}

async function main() {
  await ensureDir(dataDirs.publicData);
  await ensureDir(dataDirs.atlas);
  await ensureDir(dataDirs.sheets);
  await prepareCorridorsGeoJson();
  await prepareTemplates();
  await prepareBikeSegments();

  console.log('Prepared public data in public/data/');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
