import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const corridorsDir = path.join(repoRoot, 'public', 'data', 'corridors');

const inputs = [
  {
    input: path.join(corridorsDir, 'f3_perimetre_arrondi.geojson'),
    id: 'thonex_gaillard',
    nom: 'Gaillard - Thonex - Eaux-Vives',
    description: 'Corridor est : de Gaillard aux Eaux-Vives via Thonex.',
    color: '#2E6A4A',
    source_name: 'f3_perimetre_arrondi',
  },
  {
    input: path.join(corridorsDir, 'f4_perimetre_arrondi.geojson'),
    id: 'plo_stjulien',
    nom: 'Saint-Julien - PLO - Carouge',
    description: 'Corridor sud : de Saint-Julien-en-Genevois a Carouge via Plan-les-Ouates.',
    color: '#2E6A4A',
    source_name: 'f4_perimetre_arrondi',
  },
];

const outputGeojson = path.join(corridorsDir, 'corridors.geojson');
const outputMbtiles = path.join(corridorsDir, 'corridors.mbtiles');
const outputPmtiles = path.join(corridorsDir, 'corridors.pmtiles');
const outputMaskGeojson = path.join(corridorsDir, 'corridors-mask.geojson');
const outputMaskMbtiles = path.join(corridorsDir, 'corridors-mask.mbtiles');
const outputMaskPmtiles = path.join(corridorsDir, 'corridors-mask.pmtiles');
const layerName = 'corridors';
const maskLayerName = 'corridors_mask';
const territoryBounds = {
  west: 5.100526,
  south: 45.507307,
  east: 7.086596,
  north: 46.995298,
};
const maskOuterRing = [
  [territoryBounds.west - 0.2, territoryBounds.south - 0.15],
  [territoryBounds.east + 0.2, territoryBounds.south - 0.15],
  [territoryBounds.east + 0.2, territoryBounds.north + 0.15],
  [territoryBounds.west - 0.2, territoryBounds.north + 0.15],
  [territoryBounds.west - 0.2, territoryBounds.south - 0.15],
];

function readGeojson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function buildFeatureCollection() {
  const features = inputs.flatMap((entry) => {
    const collection = readGeojson(entry.input);
    return (collection.features || []).map((feature, index) => ({
      type: 'Feature',
      properties: {
        ...feature.properties,
        id: entry.id,
        nom: entry.nom,
        description: entry.description,
        color: entry.color,
        source_name: entry.source_name,
        source_index: index,
      },
      geometry: feature.geometry,
    }));
  });

  return {
    type: 'FeatureCollection',
    features,
  };
}

function closeRing(ring) {
  if (!Array.isArray(ring) || ring.length < 3) return ring;
  const [firstLng, firstLat] = ring[0];
  const [lastLng, lastLat] = ring[ring.length - 1];
  if (firstLng === lastLng && firstLat === lastLat) return ring;
  return [...ring, ring[0]];
}

function getHoleRings(geometry) {
  if (!geometry) return [];

  if (geometry.type === 'Polygon') {
    return geometry.coordinates.map((ring) => closeRing(ring));
  }

  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates
      .flatMap((polygon) => polygon)
      .map((ring) => closeRing(ring));
  }

  return [];
}

function buildMaskFeatureCollection() {
  const perCorridorFeatures = inputs.flatMap((entry) => {
    const collection = readGeojson(entry.input);
    return (collection.features || []).flatMap((feature, index) => {
      const holeRings = getHoleRings(feature.geometry);
      if (holeRings.length === 0) return [];

      return [{
        type: 'Feature',
        properties: {
          id: entry.id,
          nom: entry.nom,
          description: entry.description,
          color: '#ffffff',
          kind: 'mask',
          source_name: entry.source_name,
          source_index: index,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [maskOuterRing, ...holeRings],
        },
      }];
    });
  });

  const allHoleRings = inputs.flatMap((entry) => {
    const collection = readGeojson(entry.input);
    return (collection.features || []).flatMap((feature) => getHoleRings(feature.geometry));
  });

  const features = allHoleRings.length > 0
    ? [{
        type: 'Feature',
        properties: {
          id: 'all',
          nom: 'Tous les faisceaux',
          description: 'Masque global hors faisceaux.',
          color: '#ffffff',
          kind: 'mask',
          source_name: 'all',
          source_index: -1,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [maskOuterRing, ...allHoleRings],
        },
      }, ...perCorridorFeatures]
    : perCorridorFeatures;

  return {
    type: 'FeatureCollection',
    features,
  };
}

function buildPmtilesArchive({ outputGeojsonPath, outputMbtilesPath, outputPmtilesPath, layer }) {
  writeFileSync(outputGeojsonPath.filePath, `${JSON.stringify(outputGeojsonPath.data, null, 2)}\n`);

  rmSync(outputMbtilesPath, { force: true });
  rmSync(outputPmtilesPath, { force: true });

  run('tippecanoe', [
    '--force',
    '--output',
    outputMbtilesPath,
    '--layer',
    layer,
    '--minimum-zoom=0',
    '--maximum-zoom=14',
    '--detect-shared-borders',
    '--coalesce-densest-as-needed',
    '--extend-zooms-if-still-dropping',
    '--no-feature-limit',
    '--no-tile-size-limit',
    outputGeojsonPath.filePath,
  ]);

  run('pmtiles', ['convert', outputMbtilesPath, outputPmtilesPath]);
  rmSync(outputMbtilesPath, { force: true });
}

function run(command, args) {
  execFileSync(command, args, {
    stdio: 'inherit',
  });
}

mkdirSync(corridorsDir, { recursive: true });
buildPmtilesArchive({
  outputGeojsonPath: {
    filePath: outputGeojson,
    data: buildFeatureCollection(),
  },
  outputMbtilesPath: outputMbtiles,
  outputPmtilesPath: outputPmtiles,
  layer: layerName,
});

buildPmtilesArchive({
  outputGeojsonPath: {
    filePath: outputMaskGeojson,
    data: buildMaskFeatureCollection(),
  },
  outputMbtilesPath: outputMaskMbtiles,
  outputPmtilesPath: outputMaskPmtiles,
  layer: maskLayerName,
});

console.log(`Generated ${path.relative(repoRoot, outputPmtiles)}`);
console.log(`Generated ${path.relative(repoRoot, outputMaskPmtiles)}`);