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
 * ║  Si aucune source n'est configurée, les données mock locales    ║
 * ║  sont utilisées (fallback transparent).                         ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * ── CONFIGURATION ──
 *
 * Collez vos URLs dans les constantes ci-dessous.
 * Laissez une chaîne vide '' pour utiliser les données mock.
 */

import { Cible, Faisceau } from '../types';
const env = import.meta.env as Record<string, string | undefined>;

// ─────────────────────────────────────────────────
// SOURCES DE DONNÉES – à configurer ici
// ─────────────────────────────────────────────────

/**
 * URL du GeoJSON des corridors (Polygon ou MultiPolygon).
 * Peut être :
 *  - un fichier local servi statiquement (ex: '/data/corridors.geojson')
 *  - une URL GitHub raw
 *  - un Google Drive shared link (voir README)
 *
 * Chaque Feature doit contenir ces propriétés :
 *   id, nom, color, center_lat, center_lng, zoom, label_lat, label_lng
 *
 * Propriétés optionnelles :
 *   description, centerline (JSON array de [lat,lng])
 */
export const CORRIDORS_GEOJSON_URL = env.VITE_CORRIDORS_GEOJSON_URL || '/data/corridors.geojson';

/**
 * URL du GeoJSON des points d'attention (Point).
 * Chaque Feature doit contenir ces propriétés :
 *   cible_id, faisceau_id, faisceau_nom, theme_principal,
 *   titre_affichage, score, classe
 *
 * Propriétés optionnelles :
 *   sous_titre_affichage, question_cle
 */
export const CIBLES_GEOJSON_URL = '';

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
export const CIBLES_SHEETS_CSV_URL = '';


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


// ─────────────────────────────────────────────────
// CORRIDORS – chargement GeoJSON
// ─────────────────────────────────────────────────

/**
 * Convertit une Feature GeoJSON (Polygon/MultiPolygon) en Faisceau.
 *
 * Coordonnées GeoJSON = [lng, lat] → on inverse en [lat, lng] pour Leaflet.
 */
function featureToFaisceau(feature: any): Faisceau | null {
  const p = feature.properties || {};
  const geom = feature.geometry;
  if (!geom || !p.id) return null;

  // Extraire le ring principal du polygone
  let ring: [number, number][] = [];
  if (geom.type === 'Polygon' && geom.coordinates?.[0]) {
    ring = geom.coordinates[0].map(([lng, lat]: number[]) => [lat, lng] as [number, number]);
  } else if (geom.type === 'MultiPolygon' && geom.coordinates?.[0]?.[0]) {
    ring = geom.coordinates[0][0].map(([lng, lat]: number[]) => [lat, lng] as [number, number]);
  }
  if (ring.length === 0) return null;

  // Calculer le bounds
  let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
  ring.forEach(([lat, lng]) => {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  });

  // Centerline optionnelle (stockée en propriété JSON)
  let centerline: [number, number][] = [];
  if (p.centerline) {
    try {
      centerline = typeof p.centerline === 'string' ? JSON.parse(p.centerline) : p.centerline;
    } catch { /* ignore */ }
  }
  // Fallback : générer une centerline à partir du centre vertical du polygon
  if (centerline.length === 0) {
    const midLat = (minLat + maxLat) / 2;
    const midLng = (minLng + maxLng) / 2;
    centerline = [[midLat, minLng], [midLat, midLng], [midLat, maxLng]];
  }

  return {
    id: String(p.id),
    nom: String(p.nom || p.name || p.id),
    description: p.description || undefined,
    center: [
      p.center_lat ? Number(p.center_lat) : (minLat + maxLat) / 2,
      p.center_lng ? Number(p.center_lng) : (minLng + maxLng) / 2,
    ],
    zoom: p.zoom ? Number(p.zoom) : 13,
    bounds: [[minLat, minLng], [maxLat, maxLng]],
    color: String(p.color || '#1b4332'),
    labelAnchor: [
      p.label_lat ? Number(p.label_lat) : maxLat + 0.002,
      p.label_lng ? Number(p.label_lng) : (minLng + maxLng) / 2,
    ],
    centerline,
    polygon: ring,
  };
}

export async function loadCorridorsFromGeoJSON(): Promise<Faisceau[] | null> {
  if (!CORRIDORS_GEOJSON_URL) return null;

  try {
    const res = await fetch(CORRIDORS_GEOJSON_URL);
    if (!res.ok) { console.warn(`[data-loader] Corridors HTTP ${res.status}`); return null; }

    const geojson = await res.json();
    const features = geojson.features || [];
    const faisceaux = features.map(featureToFaisceau).filter(Boolean) as Faisceau[];

    console.log(`[data-loader] ${faisceaux.length} corridors chargés depuis GeoJSON`);
    return faisceaux.length > 0 ? faisceaux : null;
  } catch (err) {
    console.warn('[data-loader] Erreur chargement corridors :', err);
    return null;
  }
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
    const lines = text.split('\n').filter((l) => l.trim());
    if (lines.length < 2) return null;

    const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, '_'));
    const col = (row: string[], name: string): string => {
      const idx = headers.indexOf(name);
      return idx >= 0 ? row[idx] : '';
    };

    const cibles: Cible[] = [];
    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVLine(lines[i]);
      if (row.length < 3) continue;

      const lat = parseFloat(col(row, 'latitude'));
      const lng = parseFloat(col(row, 'longitude'));
      const score = parseFloat(col(row, 'score'));
      if (isNaN(lat) || isNaN(lng)) continue;

      cibles.push({
        cible_id: col(row, 'cible_id') || `GS_${i}`,
        faisceau_id: col(row, 'faisceau_id'),
        faisceau_nom: col(row, 'faisceau_nom'),
        theme_principal: col(row, 'theme_principal'),
        latitude: lat,
        longitude: lng,
        titre_affichage: col(row, 'titre_affichage'),
        sous_titre_affichage: col(row, 'sous_titre_affichage') || undefined,
        question_cle: col(row, 'question_cle') || undefined,
        score_indice_calcule: isNaN(score) ? 0 : score,
        classe_indice_calcule: col(row, 'classe') || 'non_evalue',
      });
    }

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
 *   3. null (→ mock data en fallback dans useAppData)
 */
export async function loadCibles(): Promise<Cible[] | null> {
  const fromGeoJSON = await loadCiblesFromGeoJSON();
  if (fromGeoJSON) return fromGeoJSON;

  const fromSheet = await loadCiblesFromSheet();
  if (fromSheet) return fromSheet;

  return null;
}

/**
 * Charge les corridors :
 *   1. GeoJSON
 *   2. null (→ mock data en fallback dans useAppData)
 */
export async function loadCorridors(): Promise<Faisceau[] | null> {
  return loadCorridorsFromGeoJSON();
}
