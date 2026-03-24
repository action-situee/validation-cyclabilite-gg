/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║           CHARGEUR DE DONNÉES – GeoJSON & Google Sheets         ║
 * ╠══════════════════════════════════════════════════════════════════╣
 * ║  Ce module charge les corridors (faisceaux) et les points       ║
 * ║  d'attention (cibles) depuis des sources externes :             ║
 * ║                                                                  ║
 * ║  1. GeoJSON  – fichier local ou URL distante                    ║
 * ║  2. Google Sheets publié en CSV                                 ║
 * ║                                                                  ║
 * ║  Les sources doivent etre explicites : GeoJSON local, URL       ║
 * ║  distante ou sorties atlas publiees dans public/data/.          ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * ── CONFIGURATION ──
 *
 * Collez vos URLs dans les constantes ci-dessous.
 * Laissez une chaîne vide '' pour desactiver une source.
 */

import { BikeSegment, Cible, Faisceau } from '../types';
import { FAISCEAUX as BASE_FAISCEAUX } from '../mock-data/faisceaux';

const env = import.meta.env as Record<string, string | undefined>;

// ─────────────────────────────────────────────────
// SOURCES DE DONNÉES – à configurer ici
// ─────────────────────────────────────────────────

/**
 * Délimitations des faisceaux.
 *
 * On charge **deux fichiers** GeoJSON (Polygon/MultiPolygon) et on associe chaque fichier
 * à un `faisceau.id` stable (pas de dépendance à des `properties.id` dans le GeoJSON).
 *
 * Par défaut:
 * - Gaillard / Thônex / Eaux-Vives → `/data/corridors/f3_perimetre_arrondi.geojson`
 * - Saint-Julien / PLO / Genève    → `/data/corridors/f4_perimetre_arrondi.geojson`
 *
 * Override possible via env:
 * - `VITE_FAISCEAU_GAILLARD_GEOJSON_URL`
 * - `VITE_FAISCEAU_STJULIEN_GEOJSON_URL`
 */
export const FAISCEAU_GAILLARD_GEOJSON_URL =
  env.VITE_FAISCEAU_GAILLARD_GEOJSON_URL || '/data/corridors/f3_perimetre_arrondi.geojson';

export const FAISCEAU_STJULIEN_GEOJSON_URL =
  env.VITE_FAISCEAU_STJULIEN_GEOJSON_URL || '/data/corridors/f4_perimetre_arrondi.geojson';

/**
 * URL du GeoJSON des points d'attention (Point).
 * Chaque Feature doit contenir ces propriétés :
 *   cible_id, faisceau_id, faisceau_nom, theme_principal,
 *   titre_affichage, score, classe
 *
 * Propriétés optionnelles :
 *   sous_titre_affichage, question_cle
 */
export const CIBLES_GEOJSON_URL = env.VITE_CIBLES_GEOJSON_URL || '';

/**
 * URL du Google Sheet publié en CSV pour les points d'attention.
 * Alternative au GeoJSON – le GeoJSON est prioritaire s'il est renseigné.
 *
 * Colonnes obligatoires :
 *   cible_id, faisceau_id, faisceau_nom, theme_principal,
 *   latitude, longitude, titre_affichage, score, classe
 *
 * Colonnes facultatives :
 *   sous_titre_affichage, question_cle
 */
export const CIBLES_SHEETS_CSV_URL = env.VITE_CIBLES_SHEETS_CSV_URL || '';

/**
 * URL du GeoJSON segmentaire derive de l'atlas.
 * Par defaut, on charge un extrait corridor-centre prepare dans /public/data/atlas.
 */
export const BIKE_SEGMENTS_GEOJSON_URL =
  env.VITE_BIKE_SEGMENTS_GEOJSON_URL || '/data/atlas/bike-segments.geojson';


// ─────────────────────────────────────────────────
// Parseur CSV
// ─────────────────────────────────────────────────

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function normalizeCSVHeader(value: string) {
  return value.replace(/^\uFEFF/, '').trim().toLowerCase().replace(/\s+/g, '_');
}

function parseCSVText(text: string) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) {
    return null;
  }

  const headers = parseCSVLine(lines[0]).map(normalizeCSVHeader);
  const rows = lines.slice(1).map((line) => parseCSVLine(line));
  return { headers, rows };
}

function getCSVColumn(row: string[], headers: string[], name: string) {
  const index = headers.indexOf(name);
  return index >= 0 ? row[index] || '' : '';
}

function toOptionalString(value: string) {
  const normalized = value.trim();
  return normalized ? normalized : undefined;
}

function toOptionalNumber(value: string) {
  const normalized = value.trim();
  if (!normalized) return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseListColumn(value: string) {
  return value
    .split(/[|;,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}


// ─────────────────────────────────────────────────
// FAISCEAUX – chargement des délimitations GeoJSON
// ─────────────────────────────────────────────────

/**
 * Coordonnées GeoJSON = [lng, lat].
 * Dans l'app on stocke les polygones en [lat, lng] (Leaflet-style), puis MapLibre
 * ré-inverse au moment de construire le GeoJSON de rendu.
 */
function normalizeLngLatToLatLng(coord: unknown): [number, number] | null {
  if (!Array.isArray(coord) || coord.length < 2) return null;
  const a = Number(coord[0]);
  const b = Number(coord[1]);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;

  // Expecting [lng, lat] around Genève ~ [6.x, 46.x].
  // If swapped, values will look like [46.x, 6.x].
  const looksSwapped = Math.abs(a) > 20 && Math.abs(b) < 20;
  const lng = looksSwapped ? b : a;
  const lat = looksSwapped ? a : b;

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return [lat, lng];
}

function extractLatLngRingFromGeometry(geometry: any): [number, number][] {
  if (!geometry) return [];

  // Polygon: coordinates[ring][pos][lng,lat]
  if (geometry.type === 'Polygon' && Array.isArray(geometry.coordinates?.[0])) {
    return geometry.coordinates[0]
      .map(normalizeLngLatToLatLng)
      .filter(Boolean) as [number, number][];
  }

  // MultiPolygon: coordinates[poly][ring][pos][lng,lat]
  if (geometry.type === 'MultiPolygon' && Array.isArray(geometry.coordinates?.[0]?.[0])) {
    return geometry.coordinates[0][0]
      .map(normalizeLngLatToLatLng)
      .filter(Boolean) as [number, number][];
  }

  return [];
}

function closeRingIfNeeded(ring: [number, number][]): [number, number][] {
  if (ring.length < 3) return ring;
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] === last[0] && first[1] === last[1]) return ring;
  return [...ring, first];
}

async function loadFaisceauPolygonFromGeoJSON(url: string): Promise<[number, number][] | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[data-loader] Faisceau GeoJSON HTTP ${res.status} (${url})`);
      return null;
    }
    const geojson = await res.json();
    const feature = (geojson?.features || [])[0];
    const ring = extractLatLngRingFromGeometry(feature?.geometry);
    const closed = closeRingIfNeeded(ring);
    return closed.length >= 4 ? closed : null;
  } catch (err) {
    console.warn('[data-loader] Erreur chargement faisceau GeoJSON :', err);
    return null;
  }
}

export async function loadFaisceauxFromGeoJSON(): Promise<Faisceau[] | null> {
  const baseById = new Map(BASE_FAISCEAUX.map((f) => [f.id, f] as const));

  const [gaillardRing, stjulienRing] = await Promise.all([
    loadFaisceauPolygonFromGeoJSON(FAISCEAU_GAILLARD_GEOJSON_URL),
    loadFaisceauPolygonFromGeoJSON(FAISCEAU_STJULIEN_GEOJSON_URL),
  ]);

  const gaillardBase = baseById.get('thonex_gaillard');
  const stjulienBase = baseById.get('plo_stjulien');
  if (!gaillardBase || !stjulienBase) {
    console.warn('[data-loader] Faisceaux de reference introuvables (ids attendus)');
    return null;
  }

  const faisceaux: Faisceau[] = [
    gaillardRing ? { ...gaillardBase, polygon: gaillardRing } : gaillardBase,
    stjulienRing ? { ...stjulienBase, polygon: stjulienRing } : stjulienBase,
  ];

  console.log(
    `[data-loader] Faisceaux chargés (délimitations): gaillard=${!!gaillardRing}, stjulien=${!!stjulienRing}`,
  );

  return faisceaux;
}


// ─────────────────────────────────────────────────
// CIBLES – chargement GeoJSON
// ─────────────────────────────────────────────────

function featureToCible(feature: any): Cible | null {
  const p = feature.properties || {};
  const geom = feature.geometry;
  if (!geom || geom.type !== 'Point' || !geom.coordinates) return null;

  const [lng, lat] = geom.coordinates;

  return {
    cible_id: String(p.cible_id || p.id || ''),
    faisceau_id: String(p.faisceau_id || ''),
    faisceau_nom: String(p.faisceau_nom || ''),
    theme_principal: String(p.theme_principal || ''),
    latitude: lat,
    longitude: lng,
    titre_affichage: String(p.titre_affichage || p.titre || p.name || ''),
    sous_titre_affichage: p.sous_titre_affichage || undefined,
    question_cle: p.question_cle || undefined,
    score_indice_calcule: Number(p.score ?? p.score_indice_calcule ?? 0),
    classe_indice_calcule: String(p.classe ?? p.classe_indice_calcule ?? 'non_evalue'),
  };
}

export async function loadCiblesFromGeoJSON(): Promise<Cible[] | null> {
  if (!CIBLES_GEOJSON_URL) return null;

  try {
    const res = await fetch(CIBLES_GEOJSON_URL);
    if (!res.ok) { console.warn(`[data-loader] Cibles GeoJSON HTTP ${res.status}`); return null; }

    const geojson = await res.json();
    const features = geojson.features || [];
    const cibles = features.map(featureToCible).filter(Boolean) as Cible[];

    console.log(`[data-loader] ${cibles.length} cibles chargées depuis GeoJSON`);
    return cibles.length > 0 ? cibles : null;
  } catch (err) {
    console.warn('[data-loader] Erreur chargement cibles GeoJSON :', err);
    return null;
  }
}


// ─────────────────────────────────────────────────
// CIBLES – chargement Google Sheets CSV
// ─────────────────────────────────────────────────

export async function loadCiblesFromSheet(): Promise<Cible[] | null> {
  if (!CIBLES_SHEETS_CSV_URL) return null;

  try {
    const res = await fetch(CIBLES_SHEETS_CSV_URL);
    if (!res.ok) { console.warn(`[data-loader] Sheets HTTP ${res.status}`); return null; }

    const text = await res.text();
    const parsed = parseCSVText(text);
    if (!parsed) return null;

    const cibles: Cible[] = [];
    parsed.rows.forEach((row, index) => {
      if (row.length < 3) return;

      const lat = Number(getCSVColumn(row, parsed.headers, 'latitude'));
      const lng = Number(getCSVColumn(row, parsed.headers, 'longitude'));
      const score = Number(getCSVColumn(row, parsed.headers, 'score'));
      if (isNaN(lat) || isNaN(lng)) return;

      cibles.push({
        cible_id: getCSVColumn(row, parsed.headers, 'cible_id') || `GS_${index + 1}`,
        faisceau_id: getCSVColumn(row, parsed.headers, 'faisceau_id'),
        faisceau_nom: getCSVColumn(row, parsed.headers, 'faisceau_nom'),
        theme_principal: getCSVColumn(row, parsed.headers, 'theme_principal'),
        latitude: lat,
        longitude: lng,
        titre_affichage: getCSVColumn(row, parsed.headers, 'titre_affichage'),
        sous_titre_affichage: toOptionalString(getCSVColumn(row, parsed.headers, 'sous_titre_affichage')),
        question_cle: toOptionalString(getCSVColumn(row, parsed.headers, 'question_cle')),
        score_indice_calcule: isNaN(score) ? 0 : score,
        classe_indice_calcule: getCSVColumn(row, parsed.headers, 'classe') || 'non_evalue',
      });
    });

    console.log(`[data-loader] ${cibles.length} cibles chargées depuis Google Sheets`);
    return cibles.length > 0 ? cibles : null;
  } catch (err) {
    console.warn('[data-loader] Erreur chargement Sheets :', err);
    return null;
  }
}

// ─────────────────────────────────────────────────
// ORCHESTRATEUR – cascade de sources
// ─────────────────────────────────────────────────

/**
 * Charge les cibles en cascade :
 *   1. GeoJSON (prioritaire)
 *   2. Google Sheets CSV
 *   3. null
 */
export async function loadCibles(): Promise<Cible[] | null> {
  const fromGeoJSON = await loadCiblesFromGeoJSON();
  if (fromGeoJSON) return fromGeoJSON;

  const fromSheet = await loadCiblesFromSheet();
  if (fromSheet) return fromSheet;

  return null;
}

/**
 * Charge les faisceaux (délimitations) :
 *   1. GeoJSON
 *   2. null
 */
export async function loadFaisceaux(): Promise<Faisceau[] | null> {
  return loadFaisceauxFromGeoJSON();
}

function lineStringToLatLngs(geometry: any): [number, number][] {
  if (!geometry) return [];

  if (geometry.type === 'LineString' && Array.isArray(geometry.coordinates)) {
    return geometry.coordinates.map(([lng, lat]: number[]) => [lat, lng] as [number, number]);
  }

  if (
    geometry.type === 'MultiLineString' &&
    Array.isArray(geometry.coordinates) &&
    Array.isArray(geometry.coordinates[0])
  ) {
    return geometry.coordinates[0].map(([lng, lat]: number[]) => [lat, lng] as [number, number]);
  }

  return [];
}


function featureToBikeSegment(feature: any): BikeSegment | null {
  const p = feature.properties || {};
  const geometry = lineStringToLatLngs(feature.geometry);
  if (!p.segment_id || geometry.length < 2) return null;

  const midpoint = geometry[Math.floor(geometry.length / 2)] || geometry[0];

  return {
    segment_id: String(p.segment_id),
    faisceau_id: String(p.faisceau_id || p.corridor_id || ''),
    faisceau_nom: String(p.faisceau_nom || p.corridor_name || ''),
    faisceau_color: String(p.faisceau_color || p.corridor_color || '#2E6A4A'),
    bike_index:
      typeof p.bike_index === 'number' ? p.bike_index : p.bike_index ? Number(p.bike_index) : null,
    bike_index_class: String(p.bike_index_class || 'non_evalue'),
    length: Number(p.length || 0),
    center: [
      p.center_lat ? Number(p.center_lat) : midpoint[0],
      p.center_lng ? Number(p.center_lng) : midpoint[1],
    ],
    geometry,
    bike_index_unweighted: Number(p.bike_index_unweighted || 0),
    Classe_attractivite: Number(p.Classe_attractivite || 0),
    Classe_confort: Number(p.Classe_confort || 0),
    Classe_equipement: Number(p.Classe_equipement || 0),
    Classe_infrastructure: Number(p.Classe_infrastructure || 0),
    Classe_securite: Number(p.Classe_securite || 0),
    amenite: Number(p.amenite || 0),
    connectivite: Number(p.connectivite || 0),
    pente: Number(p.pente || 0),
    eau: Number(p.eau || 0),
    temperature: Number(p.temperature || 0),
    air: Number(p.air || 0),
    alentours: Number(p.alentours || 0),
    canopee: Number(p.canopee || 0),
    stationnement_velo: Number(p.stationnement_velo || 0),
    borne_reparation: Number(p.borne_reparation || 0),
    location: Number(p.location || 0),
    sens_inverse: Number(p.sens_inverse || 0),
    service_velo: Number(p.service_velo || 0),
    parking_abris: Number(p.parking_abris || 0),
    piste: Number(p.piste || 0),
    bande: Number(p.bande || 0),
    revetement: Number(p.revetement || 0),
    giratoire: Number(p.giratoire || 0),
    tourner_droite: Number(p.tourner_droite || 0),
    eclairage: Number(p.eclairage || 0),
    zone_apaisee: Number(p.zone_apaisee || 0),
    vitesse_motorisee: Number(p.vitesse_motorisee || 0),
    conflit_md: Number(p.conflit_md || 0),
    accident: Number(p.accident || 0),
  };
}

export async function loadBikeSegmentsFromGeoJSON(): Promise<BikeSegment[] | null> {
  if (!BIKE_SEGMENTS_GEOJSON_URL) return null;

  try {
    const res = await fetch(BIKE_SEGMENTS_GEOJSON_URL);
    if (!res.ok) {
      console.warn(`[data-loader] Segments GeoJSON HTTP ${res.status}`);
      return null;
    }

    const geojson = await res.json();
    const features = geojson.features || [];
    const segments = features.map(featureToBikeSegment).filter(Boolean) as BikeSegment[];

    console.log(`[data-loader] ${segments.length} segments velo charges depuis GeoJSON`);
    return segments.length > 0 ? segments : null;
  } catch (err) {
    console.warn('[data-loader] Erreur chargement segments GeoJSON :', err);
    return null;
  }
}

export async function loadBikeSegments(): Promise<BikeSegment[] | null> {
  return loadBikeSegmentsFromGeoJSON();
}
