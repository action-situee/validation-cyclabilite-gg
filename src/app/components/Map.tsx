import React, { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Box, Compass, Maximize2, ZoomIn, ZoomOut } from 'lucide-react';
import maplibregl from 'maplibre-gl';
import { PMTiles, Protocol } from 'pmtiles';
import type { BikeSegment, Cible, Faisceau, ObservationLibre } from '../types';
import { OBS_NEON, getThemeNeon } from '../config/palette';
import {
  BIKE_METRIC_BY_KEY,
  buildColorRampExpression,
  getMetricClass,
  getMetricValue,
  type BikeMetricKey,
} from '../config/bikeMetrics';
import type { BasemapMode } from '../config/basemaps';

interface MapProps {
  cibles: Cible[];
  observations: ObservationLibre[];
  faisceaux: Faisceau[];
  selectedCible: Cible | null;
  selectedSegment: BikeSegment | null;
  selectedMetric: BikeMetricKey;
  metricThresholds: number[];
  basemap: BasemapMode;
  onCibleClick: (cible: Cible) => void;
  onSegmentClick: (segment: BikeSegment) => void;
  onHoverSegment: (segment: BikeSegment | null) => void;
  onMapBackgroundClick?: () => void;
  addMode: boolean;
  onMapClick: (lat: number, lng: number, segment?: BikeSegment | null) => void;
  flyTo?: { center: [number, number]; zoom: number } | null;
  selectedFaisceau?: string | null;
  showCorridors?: boolean;
  sidebarLayout?: string;
}

type CameraState = {
  center: [number, number];
  zoom: number;
  bearing: number;
  pitch: number;
};

type AnalysisScale = 'segment' | 'carreau200';

const DEFAULT_CENTER: [number, number] = [6.16, 46.23];
const DEFAULT_ZOOM = 11;
const DEFAULT_BEARING = 0;
const DEFAULT_PITCH = 0;
const TERRITORY_MAX_BOUNDS: [[number, number], [number, number]] = [
  [5.100526, 45.507307],
  [7.086596, 46.995298],
];
const BIKE_SOURCE_LAYER = import.meta.env.VITE_BIKE_SOURCE_LAYER || 'bikenet';
const CARREAU_SOURCE_LAYER = import.meta.env.VITE_BIKE_CARREAU200_SOURCE_LAYER || import.meta.env.VITE_CAR_SOURCE_LAYER || 'carreau200';
const DEFAULT_VOYAGER_STYLE = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';
const DEFAULT_SWISS_LIGHT_STYLE = 'https://vectortiles.geo.admin.ch/styles/ch.swisstopo.lightbasemap.vt/style.json';
const DEFAULT_SWISS_IMAGERY_STYLE = 'https://vectortiles.geo.admin.ch/styles/ch.swisstopo.imagerybasemap.vt/style.json';
const DEFAULT_PERIMETER_PMTILES = '/tiles/canton_perimeter.pmtiles';
const DEFAULT_PERIMETER_SOURCE_LAYER = 'canton_perimeter';
const SEGMENT_DETAIL_ZOOM = 11;
const LABEL_LAYER_PATTERN = /country|state|province|region|place|settlement|locality|commune|municipality|city|town|village|hamlet|admin|airport|airfield|aerodrome|aeroway/i;
const ROUTE_NUMBER_LAYER_PATTERN = /shield|road[-_ ]?number|route[-_ ]?number|strassen[-_ ]?nummer|strassennummer|routenummer|highway[-_ ]?number|motorway[-_ ]?number|nationalstrasse|autobahn/i;
const ROUTE_NUMBER_FIELD_PATTERN = /shield|road[-_ ]?number|route[-_ ]?number|strassen[-_ ]?nummer|strassennummer|routenummer|ref|nationalstrasse|autobahn/i;
const env = import.meta.env as Record<string, string | undefined>;
const BIKE_PM_TILES_URL = env.VITE_PM_TILES_BIKE_SEGMENT || '/tiles/bike_agglo_segment.pmtiles';
const BIKE_CARREAU200_PM_TILES_URL = env.VITE_PM_TILES_BIKE_CARREAU200 || '/tiles/bike_agglo_carreau200.pmtiles';
const PERIMETER_PM_TILES_URL = env.VITE_PM_TILES_PERIMETER || DEFAULT_PERIMETER_PMTILES;
const PERIMETER_SOURCE_LAYER = env.VITE_PERIMETER_SOURCE_LAYER || DEFAULT_PERIMETER_SOURCE_LAYER;
const SEGMENT_QUERY_RADII = [0, 18, 36, 72, 144];
const MODUS_LOGO_URL = 'https://github.com/action-situee/assets/blob/main/images/modus-2025.png?raw=true';
const GENEVE_LOGO_URL = 'https://raw.githubusercontent.com/action-situee/assets/380a38d67ffe6f8270cf52c0d9431d1f05f3b12e/images/Logo_Genf.svg';

type RenderedFeature = GeoJSON.Feature<GeoJSON.Geometry, GeoJSON.GeoJsonProperties> & {
  properties?: Record<string, unknown>;
};

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizePmtilesUrl(url: string) {
  if (!url) return '';
  if (url.startsWith('pmtiles://')) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return `pmtiles://${url}`;
  if (url.startsWith('/')) return `pmtiles://${url}`;
  return `pmtiles:///${url}`;
}

function getRawPmtilesUrl(url: string) {
  return normalizePmtilesUrl(url).replace(/^pmtiles:\/\//, '');
}

function buildEmptyBasemapStyle() {
  return {
    version: 8,
    sources: {},
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: {
          'background-color': '#ffffff',
        },
      },
    ],
  };
}

function resolveBasemapStyle(basemap: BasemapMode) {
  if (basemap === 'none') return buildEmptyBasemapStyle();
  if (basemap === 'swissLight') {
    return env.VITE_MAP_STYLE_SWISS_LIGHT || DEFAULT_SWISS_LIGHT_STYLE;
  }
  if (basemap === 'swissImagery') {
    return env.VITE_MAP_STYLE_SWISS_IMAGERY || DEFAULT_SWISS_IMAGERY_STYLE;
  }
  return env.VITE_MAP_STYLE_VOYAGER || DEFAULT_VOYAGER_STYLE;
}

function pointInPolygon(point: [number, number], polygon: [number, number][]) {
  let inside = false;
  const [lng, lat] = point;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [latI, lngI] = polygon[i];
    const [latJ, lngJ] = polygon[j];
    const intersects =
      lngI > lng !== lngJ > lng &&
      lat < ((latJ - latI) * (lng - lngI)) / ((lngJ - lngI) || Number.EPSILON) + latI;
    if (intersects) inside = !inside;
  }

  return inside;
}

function findFaisceauForPoint(
  point: [number, number],
  faisceaux: Faisceau[],
  selectedFaisceau: string | null | undefined,
) {
  const candidates = selectedFaisceau
    ? faisceaux.filter((faisceau) => faisceau.id === selectedFaisceau)
    : faisceaux;

  return candidates.find((faisceau) => pointInPolygon(point, faisceau.polygon));
}

function buildCorridorsGeoJson(faisceaux: Faisceau[]) {
  return {
    type: 'FeatureCollection',
    features: faisceaux.map((faisceau) => ({
      type: 'Feature',
      properties: {
        id: faisceau.id,
        nom: faisceau.nom,
        color: faisceau.color,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [faisceau.polygon.map(([lat, lng]) => [lng, lat])],
      },
    })),
  };
}

function buildCiblesGeoJson(cibles: Cible[]) {
  return {
    type: 'FeatureCollection',
    features: cibles.map((cible) => ({
      type: 'Feature',
      properties: {
        id: cible.cible_id,
        cible_id: cible.cible_id,
        faisceau_id: cible.faisceau_id,
        faisceau_nom: cible.faisceau_nom,
        theme_principal: cible.theme_principal,
        titre_affichage: cible.titre_affichage,
        sous_titre_affichage: cible.sous_titre_affichage || '',
        question_cle: cible.question_cle || '',
        score_indice_calcule: cible.score_indice_calcule,
        classe_indice_calcule: cible.classe_indice_calcule,
        markerColor: getThemeNeon(cible.theme_principal),
      },
      geometry: {
        type: 'Point',
        coordinates: [cible.longitude, cible.latitude],
      },
    })),
  };
}

function buildObservationsGeoJson(observations: ObservationLibre[]) {
  return {
    type: 'FeatureCollection',
    features: observations.map((obs) => ({
      type: 'Feature',
      properties: {
        id: obs.id,
        categorie: obs.categorie,
        commentaire: obs.commentaire,
        auteur: obs.auteur,
        date: obs.date,
        cible_id: obs.cible_id || '',
        segment_id: obs.segment_id || '',
        obsColor: OBS_NEON[obs.categorie] || '#8338ec',
      },
      geometry: {
        type: 'Point',
        coordinates: [obs.longitude, obs.latitude],
      },
    })),
  };
}

function buildSelectedSegmentFromFeature(
  properties: Record<string, unknown>,
  lng: number,
  lat: number,
  faisceaux: Faisceau[],
  selectedFaisceau: string | null | undefined,
): BikeSegment {
  const matchedFaisceau = findFaisceauForPoint([lng, lat], faisceaux, selectedFaisceau);
  const bikeIndex = getMetricValue(properties, 'bike_index');

  return {
    segment_id: String(properties.segment_id || ''),
    corridor_id: matchedFaisceau?.id || '',
    corridor_name: matchedFaisceau?.nom || 'Grand Geneve',
    corridor_color: matchedFaisceau?.color || '#2E6A4A',
    bike_index: bikeIndex,
    bike_index_class: getMetricClass(bikeIndex),
    length: toNumber(properties.length) || 0,
    center: [lat, lng],
    bike_index_unweighted: toNumber(properties.bike_index_unweighted) || undefined,
    Classe_attractivite: toNumber(properties.Classe_attractivite) || undefined,
    Classe_confort: toNumber(properties.Classe_confort) || undefined,
    Classe_equipement: toNumber(properties.Classe_equipement) || undefined,
    Classe_infrastructure: toNumber(properties.Classe_infrastructure) || undefined,
    Classe_securite: toNumber(properties.Classe_securite) || undefined,
    amenite: toNumber(properties.amenite) || undefined,
    connectivite: toNumber(properties.connectivite) || undefined,
    pente: toNumber(properties.pente) || undefined,
    eau: toNumber(properties.eau) || undefined,
    temperature: toNumber(properties.temperature) || undefined,
    air: toNumber(properties.air) || undefined,
    alentours: toNumber(properties.alentours) || undefined,
    canopee: toNumber(properties.canopee) || undefined,
    stationnement_velo: toNumber(properties.stationnement_velo) || undefined,
    borne_reparation: toNumber(properties.borne_reparation) || undefined,
    location: toNumber(properties.location) || undefined,
    sens_inverse: toNumber(properties.sens_inverse) || undefined,
    service_velo: toNumber(properties.service_velo) || undefined,
    parking_abris: toNumber(properties.parking_abris) || undefined,
    piste: toNumber(properties.piste) || undefined,
    bande: toNumber(properties.bande) || undefined,
    revetement: toNumber(properties.revetement) || undefined,
    giratoire: toNumber(properties.giratoire) || undefined,
    tourner_droite: toNumber(properties.tourner_droite) || undefined,
    eclairage: toNumber(properties.eclairage) || undefined,
    zone_apaisee: toNumber(properties.zone_apaisee) || undefined,
    vitesse_motorisee: toNumber(properties.vitesse_motorisee) || undefined,
    conflit_md: toNumber(properties.conflit_md) || undefined,
    accident: toNumber(properties.accident) || undefined,
  };
}

function setSourceData(map: maplibregl.Map, sourceId: string, data: unknown) {
  const source = map.getSource(sourceId) as maplibregl.GeoJSONSource | undefined;
  if (source) {
    source.setData(data as GeoJSON.GeoJSON);
  }
}

function setLayerVisibility(map: maplibregl.Map, layerId: string, visible: boolean) {
  if (map.getLayer(layerId)) {
    map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
  }
}

function moveLayerToTop(map: maplibregl.Map, layerId: string) {
  if (map.getLayer(layerId)) {
    map.moveLayer(layerId);
  }
}

function bringPointLayersToFront(map: maplibregl.Map) {
  [
    'observations-halo',
    'observations-layer',
    'cibles-halo',
    'cibles-layer',
    'cibles-selected',
  ].forEach((layerId) => moveLayerToTop(map, layerId));
}

function getScaleForZoom(zoom: number, carreauAvailable = true): AnalysisScale {
  if (!carreauAvailable) return 'segment';
  return zoom > SEGMENT_DETAIL_ZOOM ? 'segment' : 'carreau200';
}

function getLabelLayerIds(map: maplibregl.Map) {
  const layers = map.getStyle()?.layers || [];
  return layers
    .filter((layer) => layer.type === 'symbol' && typeof layer.layout?.['text-field'] !== 'undefined')
    .filter((layer) => {
      const layerId = String(layer.id || '');
      const sourceLayer = String(layer['source-layer'] || '');
      return LABEL_LAYER_PATTERN.test(layerId) || LABEL_LAYER_PATTERN.test(sourceLayer);
    })
    .map((layer) => layer.id);
}

function applyFrenchTextLabels(
  map: maplibregl.Map,
  originalLabelFields: Record<string, unknown>,
) {
  const labelLayerIds = getLabelLayerIds(map);

  labelLayerIds.forEach((layerId) => {
    const styleLayer = map.getStyle()?.layers?.find((layer) => layer.id === layerId);
    const originalTextField = styleLayer?.layout?.['text-field'];

    if (typeof originalLabelFields[layerId] === 'undefined' && typeof originalTextField !== 'undefined') {
      originalLabelFields[layerId] = originalTextField;
    }

    if (!map.getLayer(layerId) || typeof originalLabelFields[layerId] === 'undefined') {
      return;
    }

    map.setLayoutProperty(layerId, 'text-field', [
      'coalesce',
      ['get', 'name_fr'],
      ['get', 'name:fr'],
      ['get', 'name_fr_latin'],
      ['get', 'name:fr-Latn'],
      originalLabelFields[layerId] as any,
      ['get', 'name'],
      ['get', 'name_en'],
    ] as any);
  });

  return labelLayerIds.length;
}

function applyTextLayerVisibility(map: maplibregl.Map, visible: boolean) {
  const labelLayerIds = getLabelLayerIds(map);
  labelLayerIds.forEach((layerId) => {
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
    }
  });
  return labelLayerIds.length;
}

function moveLabelLayersToTop(map: maplibregl.Map) {
  getLabelLayerIds(map).forEach((layerId) => moveLayerToTop(map, layerId));
}

function isRouteNumberLayer(layer: maplibregl.StyleLayer) {
  if (layer.type !== 'symbol') return false;

  const layerId = String(layer.id || '');
  const sourceLayer = String(layer['source-layer'] || '');
  const textField = typeof layer.layout?.['text-field'] === 'undefined' ? '' : JSON.stringify(layer.layout?.['text-field']);
  const iconImage = typeof layer.layout?.['icon-image'] === 'undefined' ? '' : JSON.stringify(layer.layout?.['icon-image']);

  return (
    ROUTE_NUMBER_LAYER_PATTERN.test(layerId) ||
    ROUTE_NUMBER_LAYER_PATTERN.test(sourceLayer) ||
    ROUTE_NUMBER_FIELD_PATTERN.test(textField) ||
    ROUTE_NUMBER_FIELD_PATTERN.test(iconImage)
  );
}

function hideSwissLightRouteNumberLayers(map: maplibregl.Map, basemap: BasemapMode) {
  if (basemap !== 'swissLight') return;

  const layers = map.getStyle()?.layers || [];
  layers.forEach((layer) => {
    if (!isRouteNumberLayer(layer) || !map.getLayer(layer.id)) return;
    map.setLayoutProperty(layer.id, 'visibility', 'none');
  });
}

function normalizeScreenPoint(point: maplibregl.PointLike) {
  if (Array.isArray(point)) {
    return { x: point[0], y: point[1] };
  }

  return { x: point.x, y: point.y };
}

function squaredDistanceToSegment(
  point: { x: number; y: number },
  start: { x: number; y: number },
  end: { x: number; y: number },
) {
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  const lengthSquared = deltaX * deltaX + deltaY * deltaY;

  if (lengthSquared <= Number.EPSILON) {
    const diffX = point.x - start.x;
    const diffY = point.y - start.y;
    return diffX * diffX + diffY * diffY;
  }

  const projection = Math.max(
    0,
    Math.min(1, ((point.x - start.x) * deltaX + (point.y - start.y) * deltaY) / lengthSquared),
  );
  const closestX = start.x + projection * deltaX;
  const closestY = start.y + projection * deltaY;
  const diffX = point.x - closestX;
  const diffY = point.y - closestY;
  return diffX * diffX + diffY * diffY;
}

function getFeatureLineCoordinates(geometry: GeoJSON.Geometry | null | undefined): [number, number][][] {
  if (!geometry) return [];

  if (geometry.type === 'LineString') {
    return [geometry.coordinates.map(([lng, lat]) => [Number(lng), Number(lat)] as [number, number])];
  }

  if (geometry.type === 'MultiLineString') {
    return geometry.coordinates.map((line) =>
      line.map(([lng, lat]) => [Number(lng), Number(lat)] as [number, number]),
    );
  }

  if (geometry.type === 'GeometryCollection') {
    return geometry.geometries.flatMap((childGeometry) => getFeatureLineCoordinates(childGeometry));
  }

  return [];
}

function featureDistanceToPoint(
  map: maplibregl.Map,
  feature: RenderedFeature,
  point: maplibregl.PointLike,
) {
  const target = normalizeScreenPoint(point);
  const lines = getFeatureLineCoordinates(feature.geometry);

  if (lines.length === 0) {
    return Number.POSITIVE_INFINITY;
  }

  let bestDistance = Number.POSITIVE_INFINITY;

  lines.forEach((line) => {
    if (line.length === 0) return;

    if (line.length === 1) {
      const projected = map.project({ lng: line[0][0], lat: line[0][1] });
      const diffX = target.x - projected.x;
      const diffY = target.y - projected.y;
      bestDistance = Math.min(bestDistance, diffX * diffX + diffY * diffY);
      return;
    }

    for (let index = 0; index < line.length - 1; index += 1) {
      const start = map.project({ lng: line[index][0], lat: line[index][1] });
      const end = map.project({ lng: line[index + 1][0], lat: line[index + 1][1] });
      bestDistance = Math.min(
        bestDistance,
        squaredDistanceToSegment(target, { x: start.x, y: start.y }, { x: end.x, y: end.y }),
      );
    }
  });

  return bestDistance;
}

function dedupeSegmentFeatures(features: RenderedFeature[]) {
  const uniqueFeatures: RenderedFeature[] = [];
  const seenSegmentIds = new Set<string>();

  features.forEach((feature) => {
    const segmentId = String(feature.properties?.segment_id || '');
    if (!segmentId || seenSegmentIds.has(segmentId)) return;
    seenSegmentIds.add(segmentId);
    uniqueFeatures.push(feature);
  });

  return uniqueFeatures;
}

function querySegmentFeatures(
  map: maplibregl.Map,
  point: maplibregl.PointLike,
  radius: number,
) {
  if (!map.isStyleLoaded() || !map.getLayer('segments-hit-area')) {
    return [] as RenderedFeature[];
  }

  const normalizedPoint = normalizeScreenPoint(point);
  const queryGeometry =
    radius <= 0
      ? point
      : [
          [normalizedPoint.x - radius, normalizedPoint.y - radius],
          [normalizedPoint.x + radius, normalizedPoint.y + radius],
        ];

  return map.queryRenderedFeatures(queryGeometry as any, {
    layers: ['segments-hit-area'],
  }) as RenderedFeature[];
}

function findNearestSegmentFeature(map: maplibregl.Map, point: maplibregl.PointLike) {
  for (const radius of SEGMENT_QUERY_RADII) {
    const candidates = dedupeSegmentFeatures(querySegmentFeatures(map, point, radius));
    if (candidates.length === 0) continue;

    return candidates.reduce<RenderedFeature | null>((nearestFeature, candidate) => {
      if (!nearestFeature) return candidate;
      return featureDistanceToPoint(map, candidate, point) < featureDistanceToPoint(map, nearestFeature, point)
        ? candidate
        : nearestFeature;
    }, null);
  }

  const canvas = map.getCanvas();
  const fallbackCandidates = dedupeSegmentFeatures(
    map.queryRenderedFeatures(
      [
        [0, 0],
        [canvas.clientWidth, canvas.clientHeight],
      ] as any,
      { layers: ['segments-hit-area'] },
    ) as RenderedFeature[],
  );

  if (fallbackCandidates.length === 0) {
    return null;
  }

  return fallbackCandidates.reduce<RenderedFeature | null>((nearestFeature, candidate) => {
    if (!nearestFeature) return candidate;
    return featureDistanceToPoint(map, candidate, point) < featureDistanceToPoint(map, nearestFeature, point)
      ? candidate
      : nearestFeature;
  }, null);
}

function setPerimeterVisibility(map: maplibregl.Map, visible: boolean) {
  if (map.getLayer('perimeter-casing')) {
    map.setPaintProperty('perimeter-casing', 'line-opacity', visible ? 0 : 0);
  }
  if (map.getLayer('perimeter-outline')) {
    map.setPaintProperty(
      'perimeter-outline',
      'line-opacity',
      visible ? ['interpolate', ['linear'], ['zoom'], 8, 0.18, 10, 0.32, 12, 0.62, 14, 0.92] : 0,
    );
  }
  map.triggerRepaint();
}

function reorderMapLayers(map: maplibregl.Map) {
  [
    'corridors-fill',
    'corridors-outline',
    'segments-layer',
    'carreau200-fill',
    'carreau200-outline',
    'perimeter-casing',
    'perimeter-outline',
    'segments-selected-halo',
    'segments-selected',
    'segments-hit-area',
  ].forEach((layerId) => moveLayerToTop(map, layerId));
  moveLabelLayersToTop(map);
  bringPointLayersToFront(map);
}

function styleScaleControl(host: HTMLDivElement | null, container: HTMLDivElement | null) {
  const scaleElement = container?.querySelector('.mapboxgl-ctrl-scale, .maplibregl-ctrl-scale') as HTMLElement | null;
  const scaleWrapper = scaleElement?.parentElement as HTMLElement | null;

  if (!host || !scaleElement || !scaleWrapper) return;

  if (!host.contains(scaleWrapper)) {
    host.replaceChildren(scaleWrapper);
  }

  scaleWrapper.style.margin = '0';
  scaleWrapper.style.display = 'flex';
  scaleWrapper.style.alignItems = 'center';
  scaleWrapper.style.pointerEvents = 'none';

  scaleElement.style.background = 'transparent';
  scaleElement.style.border = 'none';
  scaleElement.style.borderBottom = '1.5px solid #111111';
  scaleElement.style.borderRadius = '0';
  scaleElement.style.boxShadow = 'none';
  scaleElement.style.color = '#1A1A1A';
  scaleElement.style.fontFamily = 'Arial, sans-serif';
  scaleElement.style.fontSize = '10px';
  scaleElement.style.fontWeight = '600';
  scaleElement.style.letterSpacing = '0.04em';
  scaleElement.style.padding = '0 0 2px 0';
  scaleElement.style.minWidth = 'unset';
  scaleElement.style.textAlign = 'center';
}

function waitForStyleReady(map: maplibregl.Map, onReady: () => void) {
  const handleStyleData = () => {
    if (!map.isStyleLoaded()) return;
    map.off('styledata', handleStyleData);
    onReady();
  };

  map.on('styledata', handleStyleData);
  handleStyleData();
}

function formatCoordinate(value: number) {
  return value.toFixed(5);
}

function formatAngle(value: number) {
  return value.toFixed(1);
}

function formatZoom(value: number) {
  return value.toFixed(2);
}

function buttonBaseStyle(active = false): CSSProperties {
  return {
    width: 34,
    height: 34,
    borderRadius: 10,
    border: '1px solid #D8D2CA',
    background: active ? '#1A1A1A' : 'rgba(255, 255, 255, 0.94)',
    color: active ? '#FFFFFF' : '#5A5A5A',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
    transition: 'all 150ms ease',
  };
}

function MapInner({
  cibles,
  observations,
  faisceaux,
  selectedCible,
  selectedSegment,
  selectedMetric,
  metricThresholds,
  basemap,
  onCibleClick,
  onSegmentClick,
  onHoverSegment,
  onMapBackgroundClick,
  addMode,
  onMapClick,
  flyTo,
  selectedFaisceau,
  showCorridors = true,
  sidebarLayout = 'none-none',
}: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scaleHostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const protocolRef = useRef<Protocol | null>(null);
  const hoveredSegmentIdRef = useRef<string | null>(null);
  const appliedBasemapRef = useRef<BasemapMode | null>(null);
  const basemapRef = useRef<BasemapMode>(basemap);
  const displayScaleRef = useRef<AnalysisScale>(getScaleForZoom(DEFAULT_ZOOM, Boolean(BIKE_CARREAU200_PM_TILES_URL)));
  const cameraStateRef = useRef<CameraState>({
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
    bearing: DEFAULT_BEARING,
    pitch: DEFAULT_PITCH,
  });
  const cameraAnimationFrameRef = useRef<number | null>(null);
  const cursorAnimationFrameRef = useRef<number | null>(null);
  const cursorPositionRef = useRef<{ lng: number; lat: number } | null>(null);
  const originalLabelFieldsRef = useRef<Record<string, unknown>>({});
  const onCibleClickRef = useRef(onCibleClick);
  const onSegmentClickRef = useRef(onSegmentClick);
  const onHoverSegmentRef = useRef(onHoverSegment);
  const onMapBackgroundClickRef = useRef(onMapBackgroundClick);
  const onMapClickRef = useRef(onMapClick);
  const addModeRef = useRef(addMode);
  const metricThresholdsRef = useRef(metricThresholds);
  const selectedMetricRef = useRef(selectedMetric);
  const selectedSegmentRef = useRef(selectedSegment);
  const faisceauxRef = useRef(faisceaux);
  const selectedFaisceauRef = useRef(selectedFaisceau);
  const ciblesRef = useRef(cibles);
  const observationsRef = useRef(observations);
  const showLabelsRef = useRef(false);
  const showPerimeterRef = useRef(true);
  const carreauAvailableRef = useRef(Boolean(BIKE_CARREAU200_PM_TILES_URL));
  const perimeterAvailableRef = useRef(Boolean(PERIMETER_PM_TILES_URL));
  const [mapError, setMapError] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [displayScale, setDisplayScale] = useState<AnalysisScale>(
    getScaleForZoom(DEFAULT_ZOOM, Boolean(BIKE_CARREAU200_PM_TILES_URL)),
  );
  const [showLabels, setShowLabels] = useState(false);
  const [showPerimeter, setShowPerimeter] = useState(true);
  const [labelsAvailable, setLabelsAvailable] = useState(true);
  const [carreauAvailable, setCarreauAvailable] = useState(Boolean(BIKE_CARREAU200_PM_TILES_URL));
  const [perimeterAvailable, setPerimeterAvailable] = useState(Boolean(PERIMETER_PM_TILES_URL));
  const [cameraDebug, setCameraDebug] = useState<CameraState>(cameraStateRef.current);
  const [cursorDebug, setCursorDebug] = useState<{ lng: number; lat: number } | null>(null);

  useEffect(() => {
    onCibleClickRef.current = onCibleClick;
  }, [onCibleClick]);

  useEffect(() => {
    onSegmentClickRef.current = onSegmentClick;
  }, [onSegmentClick]);

  useEffect(() => {
    onHoverSegmentRef.current = onHoverSegment;
  }, [onHoverSegment]);

  useEffect(() => {
    onMapBackgroundClickRef.current = onMapBackgroundClick;
  }, [onMapBackgroundClick]);

  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  useEffect(() => {
    addModeRef.current = addMode;
  }, [addMode]);

  useEffect(() => {
    metricThresholdsRef.current = metricThresholds;
  }, [metricThresholds]);

  useEffect(() => {
    selectedMetricRef.current = selectedMetric;
  }, [selectedMetric]);

  useEffect(() => {
    basemapRef.current = basemap;
  }, [basemap]);

  useEffect(() => {
    selectedSegmentRef.current = selectedSegment;
  }, [selectedSegment]);

  useEffect(() => {
    faisceauxRef.current = faisceaux;
  }, [faisceaux]);

  useEffect(() => {
    selectedFaisceauRef.current = selectedFaisceau;
  }, [selectedFaisceau]);

  useEffect(() => {
    ciblesRef.current = cibles;
  }, [cibles]);

  useEffect(() => {
    observationsRef.current = observations;
  }, [observations]);

  useEffect(() => {
    showLabelsRef.current = showLabels;
  }, [showLabels]);

  useEffect(() => {
    showPerimeterRef.current = showPerimeter;
  }, [showPerimeter]);

  useEffect(() => {
    carreauAvailableRef.current = carreauAvailable;
  }, [carreauAvailable]);

  useEffect(() => {
    perimeterAvailableRef.current = perimeterAvailable;
  }, [perimeterAvailable]);

  const syncCameraState = (map: maplibregl.Map) => {
    const center = map.getCenter();
    const nextState: CameraState = {
      center: [center.lng, center.lat],
      zoom: map.getZoom(),
      bearing: map.getBearing(),
      pitch: map.getPitch(),
    };
    cameraStateRef.current = nextState;
    setCameraDebug(nextState);
  };

  const ensurePmtilesArchive = (url: string) => {
    if (!url || !protocolRef.current) return;
    const protocolWithGet = protocolRef.current as Protocol & {
      get?: (key: string) => PMTiles | undefined;
    };
    const rawUrl = getRawPmtilesUrl(url);
    if (!rawUrl) return;
    if (!protocolWithGet.get?.(rawUrl)) {
      protocolRef.current.add(new PMTiles(rawUrl));
    }
  };

  const syncStyleDecorations = (map: maplibregl.Map) => {
    originalLabelFieldsRef.current = {};
    const labelCount = applyFrenchTextLabels(map, originalLabelFieldsRef.current);
    setLabelsAvailable(labelCount > 0);
    applyTextLayerVisibility(map, showLabelsRef.current);
    hideSwissLightRouteNumberLayers(map, basemapRef.current);
    setPerimeterVisibility(map, showPerimeterRef.current && perimeterAvailableRef.current);
    reorderMapLayers(map);
  };

  const applyScaleVisibility = (map: maplibregl.Map, nextScale = displayScaleRef.current) => {
    const effectiveScale =
      nextScale === 'carreau200' && map.getLayer('carreau200-fill') ? 'carreau200' : 'segment';
    const showSegmentInteractions = effectiveScale === 'segment' || addModeRef.current;

    setLayerVisibility(map, 'segments-layer', effectiveScale === 'segment');
    setLayerVisibility(map, 'carreau200-fill', effectiveScale === 'carreau200');
    setLayerVisibility(map, 'carreau200-outline', effectiveScale === 'carreau200');
    setLayerVisibility(map, 'segments-hit-area', showSegmentInteractions);
    setLayerVisibility(map, 'segments-selected-halo', Boolean(selectedSegmentRef.current));
    setLayerVisibility(map, 'segments-selected', Boolean(selectedSegmentRef.current));
  };

  const syncScaleFromMapZoom = (map: maplibregl.Map) => {
    const nextScale = getScaleForZoom(map.getZoom(), carreauAvailableRef.current);
    if (displayScaleRef.current === nextScale) return;

    displayScaleRef.current = nextScale;
    setDisplayScale(nextScale);

    if (nextScale !== 'segment') {
      hoveredSegmentIdRef.current = null;
      onHoverSegmentRef.current(null);
    }
  };

  const ensureMapSourcesAndLayers = (map: maplibregl.Map) => {
    if (!map.getSource('segments')) {
      map.addSource('segments', {
        type: 'vector',
        url: normalizePmtilesUrl(BIKE_PM_TILES_URL),
      });
    }

    if (BIKE_CARREAU200_PM_TILES_URL && !map.getSource('carreau200')) {
      map.addSource('carreau200', {
        type: 'vector',
        url: normalizePmtilesUrl(BIKE_CARREAU200_PM_TILES_URL),
      });
    }

    if (!map.getLayer('segments-layer')) {
      map.addLayer({
        id: 'segments-layer',
        type: 'line',
        source: 'segments',
        'source-layer': BIKE_SOURCE_LAYER,
        paint: {
          'line-width': ['interpolate', ['linear'], ['zoom'], 6, 0.8, 8, 1.2, 10, 1.5, 12, 1.8, 15, 2.4],
          'line-color': buildColorRampExpression(
            BIKE_METRIC_BY_KEY[selectedMetricRef.current].field,
            metricThresholdsRef.current,
          ) as any,
          'line-opacity': ['interpolate', ['linear'], ['zoom'], 6, 0.78, 8, 0.86, 11, 0.92, 15, 0.96],
        },
      });
    }

    if (BIKE_CARREAU200_PM_TILES_URL && !map.getLayer('carreau200-fill')) {
      map.addLayer({
        id: 'carreau200-fill',
        type: 'fill',
        source: 'carreau200',
        'source-layer': CARREAU_SOURCE_LAYER,
        paint: {
          'fill-color': buildColorRampExpression(
            BIKE_METRIC_BY_KEY[selectedMetricRef.current].field,
            metricThresholdsRef.current,
          ) as any,
          'fill-opacity': ['interpolate', ['linear'], ['zoom'], 6, 0.72, 8, 0.78, 10, 0.82, 11, 0.86],
          'fill-antialias': true,
        },
        layout: {
          visibility: 'none',
        },
      });
    }

    if (BIKE_CARREAU200_PM_TILES_URL && !map.getLayer('carreau200-outline')) {
      map.addLayer({
        id: 'carreau200-outline',
        type: 'line',
        source: 'carreau200',
        'source-layer': CARREAU_SOURCE_LAYER,
        paint: {
          'line-color': 'rgba(17, 17, 17, 0.28)',
          'line-width': ['interpolate', ['linear'], ['zoom'], 6, 0.25, 8, 0.3, 10, 0.36, 11, 0.42],
          'line-opacity': ['interpolate', ['linear'], ['zoom'], 6, 0.16, 8, 0.22, 10, 0.28, 11, 0.34],
        },
        layout: {
          visibility: 'none',
        },
      });
    }

    if (!map.getLayer('segments-selected-halo')) {
      map.addLayer({
        id: 'segments-selected-halo',
        type: 'line',
        source: 'segments',
        'source-layer': BIKE_SOURCE_LAYER,
        filter: ['==', ['to-string', ['get', 'segment_id']], ''],
        paint: {
          'line-width': ['interpolate', ['linear'], ['zoom'], 6, 7, 8, 8.5, 10, 10.5, 12, 13, 15, 17],
          'line-color': '#111111',
          'line-opacity': 0.92,
          'line-blur': 0.15,
        },
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
      });
    }

    if (!map.getLayer('segments-selected')) {
      map.addLayer({
        id: 'segments-selected',
        type: 'line',
        source: 'segments',
        'source-layer': BIKE_SOURCE_LAYER,
        filter: ['==', ['to-string', ['get', 'segment_id']], ''],
        paint: {
          'line-width': ['interpolate', ['linear'], ['zoom'], 6, 3.6, 8, 4.8, 10, 6.2, 12, 8, 15, 10.8],
          'line-color': '#FFD60A',
          'line-opacity': 1,
        },
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
      });
    }

    if (!map.getLayer('segments-hit-area')) {
      map.addLayer({
        id: 'segments-hit-area',
        type: 'line',
        source: 'segments',
        'source-layer': BIKE_SOURCE_LAYER,
        paint: {
          'line-width': ['interpolate', ['linear'], ['zoom'], 6, 10, 8, 12, 10, 14, 12, 18, 15, 24],
          'line-color': 'transparent',
          'line-opacity': 0,
        },
      });
    }

    if (!map.getSource('corridors')) {
      map.addSource('corridors', {
        type: 'geojson',
        data: buildCorridorsGeoJson(faisceauxRef.current) as any,
      });
    }

    if (!map.getLayer('corridors-fill')) {
      map.addLayer({
        id: 'corridors-fill',
        type: 'fill',
        source: 'corridors',
        paint: {
          'fill-color': ['coalesce', ['get', 'color'], '#2E6A4A'],
          'fill-opacity': 0.06,
        },
      });
    }

    if (!map.getLayer('corridors-outline')) {
      map.addLayer({
        id: 'corridors-outline',
        type: 'line',
        source: 'corridors',
        paint: {
          'line-color': ['coalesce', ['get', 'color'], '#2E6A4A'],
          'line-width': ['interpolate', ['linear'], ['zoom'], 8, 1, 11, 1.6, 14, 2.3],
          'line-opacity': 0.72,
        },
      });
    }

    if (!map.getSource('observations')) {
      map.addSource('observations', {
        type: 'geojson',
        data: buildObservationsGeoJson(observationsRef.current) as any,
      });
    }

    if (!map.getLayer('observations-halo')) {
      map.addLayer({
        id: 'observations-halo',
        type: 'circle',
        source: 'observations',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 5.4, 11, 7, 14, 8.8],
          'circle-color': '#ffffff',
          'circle-opacity': 0.92,
        },
      });
    }

    if (!map.getLayer('observations-layer')) {
      map.addLayer({
        id: 'observations-layer',
        type: 'circle',
        source: 'observations',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 4.1, 11, 5.5, 14, 7.2],
          'circle-color': ['coalesce', ['get', 'obsColor'], '#8338ec'],
          'circle-stroke-width': 1.6,
          'circle-stroke-color': '#0a0a0a',
          'circle-opacity': 0.98,
        },
      });
    }

    if (!map.getSource('cibles')) {
      map.addSource('cibles', {
        type: 'geojson',
        data: buildCiblesGeoJson(ciblesRef.current) as any,
      });
    }

    if (!map.getLayer('cibles-halo')) {
      map.addLayer({
        id: 'cibles-halo',
        type: 'circle',
        source: 'cibles',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 8.6, 11, 11.2, 14, 13.8],
          'circle-color': '#ffffff',
          'circle-opacity': 0.95,
        },
      });
    }

    if (!map.getLayer('cibles-layer')) {
      map.addLayer({
        id: 'cibles-layer',
        type: 'circle',
        source: 'cibles',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 6.2, 11, 7.8, 14, 9.8],
          'circle-color': ['coalesce', ['get', 'markerColor'], '#2E6A4A'],
          'circle-stroke-width': 2.1,
          'circle-stroke-color': '#0a0a0a',
          'circle-opacity': 1,
        },
      });
    }

    if (!map.getLayer('cibles-selected')) {
      map.addLayer({
        id: 'cibles-selected',
        type: 'circle',
        source: 'cibles',
        filter: ['==', ['get', 'id'], ''],
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 8, 11, 10.5, 14, 13],
          'circle-color': 'rgba(255,255,255,0)',
          'circle-stroke-width': 3,
          'circle-stroke-color': '#0a0a0a',
          'circle-opacity': 1,
        },
      });
    }

    if (PERIMETER_PM_TILES_URL) {
      try {
        if (!map.getSource('perimeter')) {
          map.addSource('perimeter', {
            type: 'vector',
            url: normalizePmtilesUrl(PERIMETER_PM_TILES_URL),
          });
        }

        if (!map.getLayer('perimeter-casing')) {
          map.addLayer({
            id: 'perimeter-casing',
            type: 'line',
            source: 'perimeter',
            'source-layer': PERIMETER_SOURCE_LAYER,
            paint: {
              'line-color': '#FF2B2B',
              'line-width': 1,
              'line-opacity': 0,
            },
            layout: {
              visibility: 'visible',
            },
          });
        }

        if (!map.getLayer('perimeter-outline')) {
          map.addLayer({
            id: 'perimeter-outline',
            type: 'line',
            source: 'perimeter',
            'source-layer': PERIMETER_SOURCE_LAYER,
            paint: {
              'line-color': '#000000',
              'line-width': ['interpolate', ['linear'], ['zoom'], 8, 1.2, 10, 1.8, 12, 2.4, 14, 3],
              'line-dasharray': [0, 2.2],
              'line-opacity': showPerimeterRef.current ? ['interpolate', ['linear'], ['zoom'], 8, 0.18, 10, 0.32, 12, 0.62, 14, 0.92] : 0,
            },
            layout: {
              visibility: 'visible',
              'line-cap': 'round',
              'line-join': 'round',
            },
          });
        }

        setPerimeterAvailable(true);
      } catch {
        setPerimeterAvailable(false);
      }
    } else {
      setPerimeterAvailable(false);
    }

    syncStyleDecorations(map);
    applyScaleVisibility(map);
  };

  useEffect(() => {
    if (!containerRef.current) return;

    setMapError(false);
    setMapReady(false);
    hoveredSegmentIdRef.current = null;
    onHoverSegmentRef.current(null);

    try {
      const maplibreAny = maplibregl as typeof maplibregl & {
        addProtocol?: (name: string, handler: (params: any, callback: any) => void) => void;
        removeProtocol?: (name: string) => void;
      };

      protocolRef.current ||= new Protocol();
      maplibreAny.addProtocol?.('pmtiles', protocolRef.current.tile);
      ensurePmtilesArchive(BIKE_PM_TILES_URL);
      ensurePmtilesArchive(BIKE_CARREAU200_PM_TILES_URL);
      ensurePmtilesArchive(PERIMETER_PM_TILES_URL);

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: resolveBasemapStyle(basemap) as any,
        center: cameraStateRef.current.center,
        zoom: cameraStateRef.current.zoom,
        bearing: cameraStateRef.current.bearing,
        pitch: cameraStateRef.current.pitch,
        maxPitch: 60,
        maxBounds: TERRITORY_MAX_BOUNDS,
        attributionControl: false,
      });

      appliedBasemapRef.current = basemap;
      mapRef.current = map;

      const attributionControl = new maplibregl.AttributionControl({
        compact: true,
      });
      map.addControl(attributionControl, 'bottom-right');

      const scaleControl = new maplibregl.ScaleControl({
        maxWidth: 120,
        unit: 'metric',
      });
      map.addControl(scaleControl, 'bottom-left');

      requestAnimationFrame(() => {
        styleScaleControl(scaleHostRef.current, containerRef.current);
      });

      const queueCameraSync = () => {
        if (cameraAnimationFrameRef.current !== null) return;
        cameraAnimationFrameRef.current = requestAnimationFrame(() => {
          cameraAnimationFrameRef.current = null;
          syncCameraState(map);
        });
      };

      const handleZoomScale = () => {
        syncScaleFromMapZoom(map);
      };

      const resetCursor = () => {
        hoveredSegmentIdRef.current = null;
        cursorPositionRef.current = null;
        onHoverSegmentRef.current(null);
        map.getCanvas().style.cursor = '';
        if (cursorAnimationFrameRef.current !== null) {
          cancelAnimationFrame(cursorAnimationFrameRef.current);
          cursorAnimationFrameRef.current = null;
        }
        setCursorDebug(null);
      };

      const queryLayerFeature = (point: maplibregl.PointLike, layerId: string) => {
        if (!map.isStyleLoaded() || !map.getLayer(layerId)) return undefined;
        return map.queryRenderedFeatures(point, { layers: [layerId] })[0];
      };

      const handleMapClick = (event: maplibregl.MapMouseEvent & maplibregl.EventData) => {
        if (!map.isStyleLoaded()) return;

        if (addModeRef.current) {
          const nearestSegmentFeature = findNearestSegmentFeature(map, event.point);
          const nearestSegment = nearestSegmentFeature?.properties
            ? buildSelectedSegmentFromFeature(
                nearestSegmentFeature.properties as Record<string, unknown>,
                event.lngLat.lng,
                event.lngLat.lat,
                faisceauxRef.current,
                selectedFaisceauRef.current,
              )
            : null;

          onMapClickRef.current(event.lngLat.lat, event.lngLat.lng, nearestSegment);
          return;
        }

        const cibleFeature = queryLayerFeature(event.point, 'cibles-layer');
        if (cibleFeature?.properties) {
          onCibleClickRef.current({
            cible_id: String(cibleFeature.properties.cible_id || ''),
            faisceau_id: String(cibleFeature.properties.faisceau_id || ''),
            faisceau_nom: String(cibleFeature.properties.faisceau_nom || ''),
            theme_principal: String(cibleFeature.properties.theme_principal || ''),
            latitude: event.lngLat.lat,
            longitude: event.lngLat.lng,
            titre_affichage: String(cibleFeature.properties.titre_affichage || ''),
            sous_titre_affichage: String(cibleFeature.properties.sous_titre_affichage || '') || undefined,
            question_cle: String(cibleFeature.properties.question_cle || '') || undefined,
            score_indice_calcule: toNumber(cibleFeature.properties.score_indice_calcule) || 0,
            classe_indice_calcule: String(cibleFeature.properties.classe_indice_calcule || ''),
          });
          return;
        }

        const segmentFeature =
          displayScaleRef.current === 'segment'
            ? queryLayerFeature(event.point, 'segments-hit-area')
            : undefined;
        if (segmentFeature?.properties) {
          onSegmentClickRef.current(
            buildSelectedSegmentFromFeature(
              segmentFeature.properties as Record<string, unknown>,
              event.lngLat.lng,
              event.lngLat.lat,
              faisceauxRef.current,
              selectedFaisceauRef.current,
            ),
          );
          return;
        }

        onMapBackgroundClickRef.current?.();
      };

      const handleMouseMove = (event: maplibregl.MapMouseEvent & maplibregl.EventData) => {
        if (event.lngLat) {
          cursorPositionRef.current = { lng: event.lngLat.lng, lat: event.lngLat.lat };
          if (cursorAnimationFrameRef.current === null) {
            cursorAnimationFrameRef.current = requestAnimationFrame(() => {
              cursorAnimationFrameRef.current = null;
              setCursorDebug(cursorPositionRef.current);
            });
          }
        }

        if (!map.isStyleLoaded()) {
          map.getCanvas().style.cursor = addModeRef.current ? 'crosshair' : '';
          return;
        }

        const cibleFeature = queryLayerFeature(event.point, 'cibles-layer');
        if (cibleFeature?.properties) {
          hoveredSegmentIdRef.current = null;
          onHoverSegmentRef.current(null);
          map.getCanvas().style.cursor = 'pointer';
          return;
        }

        if (displayScaleRef.current !== 'segment') {
          if (hoveredSegmentIdRef.current !== null) {
            hoveredSegmentIdRef.current = null;
            onHoverSegmentRef.current(null);
          }
          map.getCanvas().style.cursor = addModeRef.current ? 'crosshair' : '';
          return;
        }

        const segmentFeature = queryLayerFeature(event.point, 'segments-hit-area');
        if (segmentFeature?.properties) {
          const nextSegmentId = String(segmentFeature.properties.segment_id || '');
          map.getCanvas().style.cursor = 'pointer';
          if (hoveredSegmentIdRef.current === nextSegmentId) return;

          hoveredSegmentIdRef.current = nextSegmentId;
          onHoverSegmentRef.current(
            buildSelectedSegmentFromFeature(
              segmentFeature.properties as Record<string, unknown>,
              event.lngLat.lng,
              event.lngLat.lat,
              faisceauxRef.current,
              selectedFaisceauRef.current,
            ),
          );
          return;
        }

        if (hoveredSegmentIdRef.current !== null) {
          hoveredSegmentIdRef.current = null;
          onHoverSegmentRef.current(null);
        }

        map.getCanvas().style.cursor = addModeRef.current ? 'crosshair' : '';
      };

      const handleMapError = (event: any) => {
        const message = String(event?.error?.message || '');
        if (!message) return;

        if (message.includes('perimeter') || message.includes('canton_perimeter')) {
          setPerimeterAvailable(false);
          setShowPerimeter(false);
          return;
        }

        if (message.includes('carreau200') || message.includes('bike_agglo_carreau200')) {
          setCarreauAvailable(false);
          displayScaleRef.current = 'segment';
          setDisplayScale('segment');
          return;
        }

        if (
          message.includes('bike_agglo_segment') ||
          (message.includes('segments') && !message.includes('selected')) ||
          message.includes('bike_agglo_segment')
        ) {
          setMapError(true);
        }
      };

      map.on('move', queueCameraSync);
      map.on('zoom', handleZoomScale);
      map.on('rotate', queueCameraSync);
      map.on('pitch', queueCameraSync);
      map.on('moveend', () => {
        syncCameraState(map);
        syncScaleFromMapZoom(map);
      });
      map.on('click', handleMapClick);
      map.on('mousemove', handleMouseMove);
      map.getCanvas().addEventListener('mouseleave', resetCursor);
      map.on('error', handleMapError);

      map.once('load', () => {
        try {
          ensureMapSourcesAndLayers(map);
          syncCameraState(map);
          syncScaleFromMapZoom(map);
          setMapReady(true);
          setMapError(false);
        } catch (error) {
          console.error(error);
          setMapError(true);
        }
      });

      return () => {
        hoveredSegmentIdRef.current = null;
        onHoverSegmentRef.current(null);
        try {
          syncCameraState(map);
        } catch {
          // ignore camera sync on teardown
        }
        if (cameraAnimationFrameRef.current !== null) {
          cancelAnimationFrame(cameraAnimationFrameRef.current);
          cameraAnimationFrameRef.current = null;
        }
        if (cursorAnimationFrameRef.current !== null) {
          cancelAnimationFrame(cursorAnimationFrameRef.current);
          cursorAnimationFrameRef.current = null;
        }
        map.off('move', queueCameraSync);
        map.off('zoom', handleZoomScale);
        map.off('rotate', queueCameraSync);
        map.off('pitch', queueCameraSync);
        map.off('click', handleMapClick);
        map.off('mousemove', handleMouseMove);
        map.getCanvas().removeEventListener('mouseleave', resetCursor);
        map.off('error', handleMapError);
        map.remove();
        mapRef.current = null;
        setMapReady(false);
        maplibreAny.removeProtocol?.('pmtiles');
      };
    } catch (error) {
      console.error(error);
      setMapError(true);
      return undefined;
    }
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (appliedBasemapRef.current === basemap) return;

    appliedBasemapRef.current = basemap;
    setMapReady(false);
    hoveredSegmentIdRef.current = null;
    onHoverSegmentRef.current(null);

    try {
      map.setStyle(resolveBasemapStyle(basemap) as any);
      waitForStyleReady(map, () => {
        if (mapRef.current !== map) return;
        try {
          ensureMapSourcesAndLayers(map);
          syncCameraState(map);
          requestAnimationFrame(() => {
            styleScaleControl(scaleHostRef.current, containerRef.current);
          });
          setMapReady(true);
          setMapError(false);
        } catch (error) {
          console.error(error);
          setMapError(true);
        }
      });
    } catch (error) {
      console.error(error);
      setMapError(true);
    }
  }, [basemap]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;
    map.setPaintProperty(
      'segments-layer',
      'line-color',
      buildColorRampExpression(
        BIKE_METRIC_BY_KEY[selectedMetric].field,
        metricThresholds,
      ) as any,
    );
    if (map.getLayer('carreau200-fill')) {
      map.setPaintProperty(
        'carreau200-fill',
        'fill-color',
        buildColorRampExpression(
          BIKE_METRIC_BY_KEY[selectedMetric].field,
          metricThresholds,
        ) as any,
      );
    }
    reorderMapLayers(map);
  }, [mapReady, selectedMetric, metricThresholds]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    setSourceData(mapRef.current, 'corridors', buildCorridorsGeoJson(faisceaux));
  }, [mapReady, faisceaux]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    setSourceData(mapRef.current, 'cibles', buildCiblesGeoJson(cibles));
    reorderMapLayers(mapRef.current);
  }, [mapReady, cibles]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    setSourceData(mapRef.current, 'observations', buildObservationsGeoJson(observations));
    reorderMapLayers(mapRef.current);
  }, [mapReady, observations]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    mapRef.current.setFilter(
      'cibles-selected',
      selectedCible
        ? ['==', ['get', 'id'], selectedCible.cible_id]
        : ['==', ['get', 'id'], ''],
    );
  }, [mapReady, selectedCible]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const selectedSegmentFilter = selectedSegment
      ? ['==', ['to-string', ['get', 'segment_id']], selectedSegment.segment_id]
      : ['==', ['to-string', ['get', 'segment_id']], ''];

    mapRef.current.setFilter('segments-selected-halo', selectedSegmentFilter as any);
    mapRef.current.setFilter('segments-selected', selectedSegmentFilter as any);
    applyScaleVisibility(mapRef.current);
  }, [mapReady, selectedSegment]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    applyScaleVisibility(mapRef.current);
    reorderMapLayers(mapRef.current);
  }, [mapReady, displayScale, addMode, carreauAvailable]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;

    setLayerVisibility(map, 'corridors-fill', showCorridors);
    setLayerVisibility(map, 'corridors-outline', showCorridors);

    if (map.getLayer('corridors-fill')) {
      map.setPaintProperty(
        'corridors-fill',
        'fill-opacity',
        showCorridors
          ? selectedFaisceau
            ? ['case', ['==', ['get', 'id'], selectedFaisceau], 0.12, 0.025]
            : 0.06
          : 0,
      );
    }

    if (map.getLayer('corridors-outline')) {
      map.setPaintProperty(
        'corridors-outline',
        'line-opacity',
        showCorridors
          ? selectedFaisceau
            ? ['case', ['==', ['get', 'id'], selectedFaisceau], 0.92, 0.24]
            : 0.72
          : 0,
      );
      map.setPaintProperty(
        'corridors-outline',
        'line-width',
        selectedFaisceau
          ? ['case', ['==', ['get', 'id'], selectedFaisceau], 2.4, 1.1]
          : ['interpolate', ['linear'], ['zoom'], 8, 1, 11, 1.6, 14, 2.3],
      );
    }

    reorderMapLayers(map);
  }, [mapReady, selectedFaisceau, showCorridors]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !flyTo) return;
    mapRef.current.flyTo({
      center: [flyTo.center[1], flyTo.center[0]],
      zoom: flyTo.zoom,
      duration: 1200,
    });
  }, [mapReady, flyTo]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const timer = setTimeout(() => {
      mapRef.current?.resize();
      styleScaleControl(scaleHostRef.current, containerRef.current);
    }, 80);
    return () => clearTimeout(timer);
  }, [mapReady, sidebarLayout]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;
    applyFrenchTextLabels(map, originalLabelFieldsRef.current);
    const labelCount = applyTextLayerVisibility(map, showLabels);
    setLabelsAvailable(labelCount > 0);
    hideSwissLightRouteNumberLayers(map, basemapRef.current);
    reorderMapLayers(map);
  }, [mapReady, showLabels]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    setPerimeterVisibility(mapRef.current, showPerimeter && perimeterAvailable);
    reorderMapLayers(mapRef.current);
  }, [mapReady, showPerimeter, perimeterAvailable]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditable =
        target instanceof HTMLElement &&
        (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
      if (isEditable || event.metaKey || event.ctrlKey || event.altKey || event.repeat) {
        return;
      }

      const key = event.key.toLowerCase();
      if (key === 't') {
        event.preventDefault();
        setShowLabels((previous) => !previous);
      }
      if (key === 'f' || key === 'p') {
        event.preventDefault();
        if (perimeterAvailableRef.current) {
          setShowPerimeter((previous) => !previous);
        }
      }
      if (key === 'o') {
        event.preventDefault();
        const map = mapRef.current;
        if (!map) return;
        const enablePerspective = map.getPitch() < 10;
        const nextBearing = enablePerspective && Math.abs(map.getBearing()) < 1 ? -18 : map.getBearing();
        map.easeTo({
          pitch: enablePerspective ? 55 : 0,
          bearing: nextBearing,
          duration: 500,
        });
      }
      if (key === 'n') {
        event.preventDefault();
        mapRef.current?.easeTo({
          bearing: 0,
          duration: 350,
        });
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const normalizedBearing = ((cameraDebug.bearing % 360) + 360) % 360;
  const isNorthAligned = Math.min(normalizedBearing, 360 - normalizedBearing) < 1;
  const isPerspective = cameraDebug.pitch > 10;

  const handleZoomIn = () => {
    mapRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapRef.current?.zoomOut();
  };

  const handleResetView = () => {
    mapRef.current?.flyTo({
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      bearing: DEFAULT_BEARING,
      pitch: DEFAULT_PITCH,
    });
  };

  const handleTogglePerspective = () => {
    const map = mapRef.current;
    if (!map) return;
    const enablePerspective = map.getPitch() < 10;
    const nextBearing = enablePerspective && Math.abs(map.getBearing()) < 1 ? -18 : map.getBearing();
    map.easeTo({
      pitch: enablePerspective ? 55 : 0,
      bearing: nextBearing,
      duration: 500,
    });
  };

  const handleResetNorth = () => {
    mapRef.current?.easeTo({
      bearing: 0,
      duration: 350,
    });
  };

  if (mapError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#eae8e0]">
        <div className="text-center p-4">
          <p className="text-[12px] text-[#0a0a0a] mb-2 uppercase tracking-wider">Impossible de charger la carte</p>
          <p className="text-[11px] text-[#5c5c5c]">Verifiez la presence du PMTiles local ou la variable `VITE_PM_TILES_BIKE_SEGMENT`.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <div ref={containerRef} className="w-full h-full" />

      <div className="absolute z-10 pointer-events-none" style={{ top: 16, left: 16 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '6px 10px',
            borderRadius: 12,
            background: 'rgba(255, 255, 255, 0.88)',
            border: '1px solid rgba(216, 210, 202, 0.9)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <img
            src={MODUS_LOGO_URL}
            alt="Modus"
            style={{ height: 24, width: 'auto', display: 'block' }}
            referrerPolicy="no-referrer"
          />
          <img
            src={GENEVE_LOGO_URL}
            alt="Geneve"
            style={{ height: 26, width: 'auto', display: 'block' }}
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      <div className="absolute z-10 pointer-events-auto" style={{ left: 16, bottom: 40 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
          <div
            ref={scaleHostRef}
            style={{
              minHeight: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              pointerEvents: 'none',
            }}
          />

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={handleZoomIn} style={buttonBaseStyle()} title="Zoom avant">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={handleZoomOut} style={buttonBaseStyle()} title="Zoom arriere">
            <ZoomOut className="w-4 h-4" />
          </button>
          <button onClick={handleResetView} style={buttonBaseStyle()} title="Recentrer">
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleTogglePerspective}
            style={buttonBaseStyle(isPerspective)}
            title="Perspective / orientation (O)"
            aria-pressed={isPerspective}
          >
            <Box className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowLabels((previous) => !previous)}
            style={{
              ...buttonBaseStyle(showLabels),
              opacity: labelsAvailable ? 1 : 0.58,
              fontFamily: 'Arial, sans-serif',
              fontSize: 14,
              fontWeight: 700,
            }}
            title="Afficher les noms de communes (T)"
            aria-pressed={showLabels}
          >
            T
          </button>
          <button
            onClick={() => perimeterAvailable && setShowPerimeter((previous) => !previous)}
            style={{
              ...buttonBaseStyle(showPerimeter && perimeterAvailable),
              opacity: perimeterAvailable ? 1 : 0.58,
              fontFamily: 'Arial, sans-serif',
              fontSize: 14,
              fontWeight: 700,
            }}
            title="Afficher / masquer la frontiere (F)"
            aria-pressed={showPerimeter && perimeterAvailable}
          >
            F
          </button>
          <button
            onClick={handleResetNorth}
            style={buttonBaseStyle(!isNorthAligned)}
            title="Remettre le nord en haut (N)"
            aria-pressed={!isNorthAligned}
          >
            <Compass className="w-4 h-4" style={{ transform: `rotate(${-cameraDebug.bearing}deg)` }} />
          </button>
          </div>
        </div>
      </div>

      <div
        className="absolute z-10 pointer-events-none"
        style={{
          left: 16,
          bottom: 10,
          color: '#7A7A7A',
          fontFamily: 'Arial, sans-serif',
          fontSize: 10,
          lineHeight: 1.2,
          whiteSpace: 'nowrap',
          maxWidth: 'calc(100% - 104px)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        z {formatZoom(cameraDebug.zoom)} | cursor {cursorDebug ? `${formatCoordinate(cursorDebug.lng)}, ${formatCoordinate(cursorDebug.lat)}` : '-, -'} | cam {formatCoordinate(cameraDebug.center[0])}, {formatCoordinate(cameraDebug.center[1])} | b {formatAngle(cameraDebug.bearing)} | p {formatAngle(cameraDebug.pitch)}
      </div>
    </div>
  );
}

export function Map(props: MapProps) {
  return <MapInner {...props} />;
}
