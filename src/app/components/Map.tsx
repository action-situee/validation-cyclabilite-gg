import React, { useEffect, useRef, useState } from 'react';
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
  addMode: boolean;
  onMapClick: (lat: number, lng: number) => void;
  flyTo?: { center: [number, number]; zoom: number } | null;
  selectedFaisceau?: string | null;
  showCorridors?: boolean;
  sidebarLayout?: string;
}

const DEFAULT_CENTER: [number, number] = [6.16, 46.23];
const DEFAULT_ZOOM = 11;
const TERRITORY_MAX_BOUNDS: [[number, number], [number, number]] = [
  [5.100526, 45.507307],
  [7.086596, 46.995298],
];
const BIKE_SOURCE_LAYER = import.meta.env.VITE_BIKE_SOURCE_LAYER || 'bikenet';
const DEFAULT_VOYAGER_STYLE = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';
const DEFAULT_SWISS_LIGHT_STYLE = 'https://vectortiles.geo.admin.ch/styles/ch.swisstopo.lightbasemap.vt/style.json';
const DEFAULT_SWISS_IMAGERY_STYLE = 'https://vectortiles.geo.admin.ch/styles/ch.swisstopo.imagerybasemap.vt/style.json';
const env = import.meta.env as Record<string, string | undefined>;
const BIKE_PM_TILES_URL = env.VITE_PM_TILES_BIKE_SEGMENT || '/tiles/bike_agglo_segment.pmtiles';

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizePmtilesUrl(url: string) {
  if (url.startsWith('pmtiles://')) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return `pmtiles://${url}`;
  if (url.startsWith('/')) return `pmtiles://${url}`;
  return `pmtiles:///${url}`;
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
  addMode,
  onMapClick,
  flyTo,
  selectedFaisceau,
  showCorridors = true,
  sidebarLayout = 'none-none',
}: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const protocolRef = useRef<Protocol | null>(null);
  const segmentClickHandledRef = useRef(false);
  const hoveredSegmentIdRef = useRef<string | null>(null);
  const cameraStateRef = useRef<{ center: [number, number]; zoom: number }>({
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
  });
  const onCibleClickRef = useRef(onCibleClick);
  const onSegmentClickRef = useRef(onSegmentClick);
  const onHoverSegmentRef = useRef(onHoverSegment);
  const onMapClickRef = useRef(onMapClick);
  const addModeRef = useRef(addMode);
  const metricThresholdsRef = useRef(metricThresholds);
  const faisceauxRef = useRef(faisceaux);
  const selectedFaisceauRef = useRef(selectedFaisceau);
  const [mapError, setMapError] = useState(false);
  const [mapReady, setMapReady] = useState(false);

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
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  useEffect(() => {
    addModeRef.current = addMode;
  }, [addMode]);

  useEffect(() => {
    metricThresholdsRef.current = metricThresholds;
  }, [metricThresholds]);

  useEffect(() => {
    faisceauxRef.current = faisceaux;
  }, [faisceaux]);

  useEffect(() => {
    selectedFaisceauRef.current = selectedFaisceau;
  }, [selectedFaisceau]);

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
      const protocolWithGet = protocolRef.current as (Protocol & {
        get?: (key: string) => PMTiles | undefined;
      }) | null;

      protocolRef.current ||= new Protocol();
      maplibreAny.addProtocol?.('pmtiles', protocolRef.current.tile);
      if (!protocolWithGet?.get?.(BIKE_PM_TILES_URL)) {
        protocolRef.current.add(new PMTiles(BIKE_PM_TILES_URL));
      }

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: resolveBasemapStyle(basemap) as any,
        center: cameraStateRef.current.center,
        zoom: cameraStateRef.current.zoom,
        attributionControl: true,
        maxBounds: TERRITORY_MAX_BOUNDS,
      });

      const syncCameraState = () => {
        const center = map.getCenter();
        cameraStateRef.current = {
          center: [center.lng, center.lat],
          zoom: map.getZoom(),
        };
      };

      mapRef.current = map;

      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
      map.on('moveend', syncCameraState);

      map.on('load', () => {
        map.addSource('segments', {
          type: 'vector',
          url: normalizePmtilesUrl(BIKE_PM_TILES_URL),
        });

        map.addLayer({
          id: 'segments-layer',
          type: 'line',
          source: 'segments',
          'source-layer': BIKE_SOURCE_LAYER,
          paint: {
            'line-width': ['interpolate', ['linear'], ['zoom'], 6, 0.8, 8, 1.2, 10, 1.5, 12, 1.8, 15, 2.4],
            'line-color': buildColorRampExpression(
              BIKE_METRIC_BY_KEY[selectedMetric].field,
              metricThresholdsRef.current,
            ) as any,
            'line-opacity': ['interpolate', ['linear'], ['zoom'], 6, 0.78, 8, 0.86, 11, 0.92, 15, 0.96],
          },
        });

        map.addLayer({
          id: 'segments-selected',
          type: 'line',
          source: 'segments',
          'source-layer': BIKE_SOURCE_LAYER,
          filter: ['==', ['to-string', ['get', 'segment_id']], ''],
          paint: {
            'line-width': ['interpolate', ['linear'], ['zoom'], 6, 2.6, 8, 3.2, 10, 4, 12, 4.8, 15, 5.8],
            'line-color': '#0a0a0a',
            'line-opacity': 1,
          },
        });

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

        map.addSource('corridors', {
          type: 'geojson',
          data: buildCorridorsGeoJson(faisceauxRef.current) as any,
        });

        map.addLayer({
          id: 'corridors-fill',
          type: 'fill',
          source: 'corridors',
          paint: {
            'fill-color': ['coalesce', ['get', 'color'], '#2E6A4A'],
            'fill-opacity': 0.06,
          },
        });

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

        map.addSource('observations', {
          type: 'geojson',
          data: buildObservationsGeoJson(observations) as any,
        });

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

        map.addSource('cibles', {
          type: 'geojson',
          data: buildCiblesGeoJson(cibles) as any,
        });

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

        map.on('click', 'segments-hit-area', (event: any) => {
          const feature = event.features?.[0];
          if (!feature?.properties) return;

          segmentClickHandledRef.current = true;
          const segment = buildSelectedSegmentFromFeature(
            feature.properties as Record<string, unknown>,
            event.lngLat.lng,
            event.lngLat.lat,
            faisceauxRef.current,
            selectedFaisceauRef.current,
          );

          onSegmentClickRef.current(segment);
        });

        map.on('click', 'cibles-layer', (event: any) => {
          const feature = event.features?.[0];
          if (!feature?.properties) return;

          segmentClickHandledRef.current = true;
          onCibleClickRef.current({
            cible_id: String(feature.properties.cible_id || ''),
            faisceau_id: String(feature.properties.faisceau_id || ''),
            faisceau_nom: String(feature.properties.faisceau_nom || ''),
            theme_principal: String(feature.properties.theme_principal || ''),
            latitude: event.lngLat.lat,
            longitude: event.lngLat.lng,
            titre_affichage: String(feature.properties.titre_affichage || ''),
            sous_titre_affichage: String(feature.properties.sous_titre_affichage || '') || undefined,
            question_cle: String(feature.properties.question_cle || '') || undefined,
            score_indice_calcule: toNumber(feature.properties.score_indice_calcule) || 0,
            classe_indice_calcule: String(feature.properties.classe_indice_calcule || ''),
          });
        });

        map.on('click', (event) => {
          if (segmentClickHandledRef.current) {
            segmentClickHandledRef.current = false;
            return;
          }

          if (addModeRef.current) {
            onMapClickRef.current(event.lngLat.lat, event.lngLat.lng);
          }
        });

        bringPointLayersToFront(map);
        setMapReady(true);
      });

      map.on('error', (event) => {
        const message = event.error?.message || '';
        if (message.includes('pmtiles') || message.includes('segments')) {
          setMapError(true);
        }
      });

      return () => {
        hoveredSegmentIdRef.current = null;
        onHoverSegmentRef.current(null);
        try {
          syncCameraState();
        } catch {
          // ignore camera sync on teardown
        }
        map.off('moveend', syncCameraState);
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
    bringPointLayersToFront(map);
  }, [mapReady, selectedMetric, metricThresholds]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    setSourceData(mapRef.current, 'corridors', buildCorridorsGeoJson(faisceaux));
  }, [mapReady, faisceaux]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    setSourceData(mapRef.current, 'cibles', buildCiblesGeoJson(cibles));
  }, [mapReady, cibles]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    setSourceData(mapRef.current, 'observations', buildObservationsGeoJson(observations));
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
    mapRef.current.setFilter(
      'segments-selected',
      selectedSegment
        ? ['==', ['to-string', ['get', 'segment_id']], selectedSegment.segment_id]
        : ['==', ['to-string', ['get', 'segment_id']], ''],
    );
  }, [mapReady, selectedSegment]);

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
    }, 80);
    return () => clearTimeout(timer);
  }, [mapReady, sidebarLayout]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;

    const handleMove = (event: maplibregl.MapMouseEvent & maplibregl.EventData) => {
      const segmentFeature = map.queryRenderedFeatures(event.point, { layers: ['segments-hit-area'] })[0];
      const cibleFeature = map.queryRenderedFeatures(event.point, { layers: ['cibles-layer'] })[0];

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

      map.getCanvas().style.cursor = cibleFeature ? 'pointer' : addModeRef.current ? 'crosshair' : '';
    };

    const handleLeave = () => {
      hoveredSegmentIdRef.current = null;
      onHoverSegmentRef.current(null);
      map.getCanvas().style.cursor = '';
    };

    map.on('mousemove', handleMove);
    map.getCanvas().addEventListener('mouseleave', handleLeave);

    return () => {
      map.off('mousemove', handleMove);
      map.getCanvas().removeEventListener('mouseleave', handleLeave);
    };
  }, [mapReady]);

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
    </div>
  );
}

export function Map(props: MapProps) {
  return <MapInner {...props} />;
}
