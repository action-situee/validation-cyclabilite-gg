import React, { useEffect, useRef, useState } from 'react';
import { Cible, Faisceau, ObservationLibre } from '../types';
import { DEFAULT_CENTER, DEFAULT_ZOOM } from '../mock-data/faisceaux';
import { THEME_LABELS, OBS_NEON, OBS_LABELS, getThemeNeon } from '../config/palette';

interface MapProps {
  cibles: Cible[];
  observations: ObservationLibre[];
  faisceaux: Faisceau[];
  selectedCible: Cible | null;
  onCibleClick: (cible: Cible) => void;
  addMode: boolean;
  onMapClick: (lat: number, lng: number) => void;
  flyTo?: { center: [number, number]; zoom: number } | null;
  selectedFaisceau?: string | null;
  showCorridors?: boolean;
  sidebarOpen?: boolean;
}

/* ── Basemap ── */
const TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

/* ── Geneva bounds ── */
const GENEVA_BOUNDS: [[number, number], [number, number]] = [
  [46.05, 5.85],
  [46.35, 6.40],
];
const MIN_ZOOM = 11;

/* ── Commune labels along corridors ── */
const COMMUNE_LABELS: { name: string; lat: number; lng: number; faisceau?: string }[] = [
  { name: 'Saint-Julien-en-Genevois', lat: 46.1410, lng: 6.0810, faisceau: 'plo_stjulien' },
  { name: 'Bardonnex', lat: 46.1520, lng: 6.0970, faisceau: 'plo_stjulien' },
  { name: 'Compesières', lat: 46.1600, lng: 6.1050, faisceau: 'plo_stjulien' },
  { name: 'Plan-les-Ouates', lat: 46.1680, lng: 6.1110, faisceau: 'plo_stjulien' },
  { name: 'Bachet-de-Pesay', lat: 46.1790, lng: 6.1230, faisceau: 'plo_stjulien' },
  { name: 'Carouge', lat: 46.1855, lng: 6.1340, faisceau: 'plo_stjulien' },
  { name: 'Gaillard', lat: 46.1940, lng: 6.2310, faisceau: 'thonex_gaillard' },
  { name: 'Moillesulaz', lat: 46.1985, lng: 6.2210, faisceau: 'thonex_gaillard' },
  { name: 'Thônex', lat: 46.2010, lng: 6.2060, faisceau: 'thonex_gaillard' },
  { name: 'Chêne-Bourg', lat: 46.2035, lng: 6.1870, faisceau: 'thonex_gaillard' },
  { name: 'Chêne-Bougeries', lat: 46.2048, lng: 6.1760, faisceau: 'thonex_gaillard' },
  { name: 'Eaux-Vives', lat: 46.2060, lng: 6.1530, faisceau: 'thonex_gaillard' },
];

/* ── Marker builders – brutalist squares ── */

function cibleDot(color: string, size: number, selected = false): string {
  const border = selected ? '2px solid #0a0a0a' : 'none';
  return `<div style="
    width:${size}px; height:${size}px;
    background:${color};
    border:${border};
    box-shadow:0 0 ${size}px ${color}66;
    cursor:pointer;
    transition:transform .15s;
  "></div>`;
}

function obsCross(color: string, size: number): string {
  const arm = Math.round(size * 0.35);
  return `<div style="
    width:${size}px; height:${size}px;
    position:relative;
    cursor:pointer;
    filter:drop-shadow(0 0 ${Math.round(size * 0.6)}px ${color}88);
  ">
    <div style="
      position:absolute; top:50%; left:50%;
      width:${size}px; height:${arm}px;
      background:${color};
      transform:translate(-50%,-50%) rotate(45deg);
    "></div>
    <div style="
      position:absolute; top:50%; left:50%;
      width:${size}px; height:${arm}px;
      background:${color};
      transform:translate(-50%,-50%) rotate(-45deg);
    "></div>
  </div>`;
}

function MapInner({ cibles, observations, faisceaux, selectedCible, onCibleClick, addMode, onMapClick, flyTo, selectedFaisceau, showCorridors = true, sidebarOpen = false }: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const cibleMarkersRef = useRef<any[]>([]);
  const obsMarkersRef = useRef<any[]>([]);
  const corridorLayersRef = useRef<any[]>([]);
  const communeLabelsRef = useRef<any[]>([]);
  const [L, setL] = useState<any>(null);

  // Load Leaflet
  useEffect(() => {
    import('leaflet').then((mod) => {
      const Lmod = mod.default || mod;
      delete (Lmod.Icon.Default.prototype as any)._getIconUrl;
      setL(Lmod);
    });
  }, []);

  // Init map with bounds restriction
  useEffect(() => {
    if (!L || !containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: false,
      scrollWheelZoom: true,
      minZoom: MIN_ZOOM,
      maxBounds: L.latLngBounds(GENEVA_BOUNDS[0], GENEVA_BOUNDS[1]),
      maxBoundsViscosity: 0.8,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer(TILE_URL, {
      attribution: TILE_ATTR,
      maxZoom: 20,
      detectRetina: true,
    }).addTo(map);

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, [L]);

  // Callback refs
  const onCibleClickRef = useRef(onCibleClick);
  useEffect(() => { onCibleClickRef.current = onCibleClick; }, [onCibleClick]);
  const onMapClickRef = useRef(onMapClick);
  useEffect(() => { onMapClickRef.current = onMapClick; }, [onMapClick]);
  const addModeRef = useRef(addMode);
  useEffect(() => { addModeRef.current = addMode; }, [addMode]);

  // Map click
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const handler = (e: any) => {
      if (addModeRef.current) onMapClickRef.current(e.latlng.lat, e.latlng.lng);
    };
    map.on('click', handler);
    return () => { map.off('click', handler); };
  }, [L]);

  // Cursor
  useEffect(() => {
    if (containerRef.current) containerRef.current.style.cursor = addMode ? 'crosshair' : '';
  }, [addMode]);

  // Fly to
  useEffect(() => {
    if (!mapRef.current || !flyTo) return;
    mapRef.current.flyTo(flyTo.center, flyTo.zoom, { duration: 1.2 });
  }, [flyTo]);

  // ── Invalidate map size when sidebar toggles ──
  useEffect(() => {
    if (!mapRef.current) return;
    const timer = setTimeout(() => {
      mapRef.current?.invalidateSize({ animate: false });
    }, 50);
    return () => clearTimeout(timer);
  }, [sidebarOpen]);

  // ── Corridor overlays – use polygon directly ──
  useEffect(() => {
    if (!L || !mapRef.current) return;

    corridorLayersRef.current.forEach((layer) => layer.remove());
    corridorLayersRef.current = [];

    if (!showCorridors) return;

    const map = mapRef.current;
    const WORLD_RING: [number, number][] = [[-90, -180], [-90, 180], [90, 180], [90, -180]];

    const drawCorridor = (faisceau: Faisceau, isSelected: boolean) => {
      const hole = faisceau.polygon;
      if (!hole || hole.length < 3) return;

      // Inverse mask – gray outside, clear inside
      const mask = L.polygon([WORLD_RING, hole], {
        stroke: false,
        fillColor: '#1a1a1a',
        fillOpacity: isSelected ? 0.18 : 0.10,
        interactive: false,
      }).addTo(map);
      corridorLayersRef.current.push(mask);

      // Corridor outline
      const outline = L.polygon([hole], {
        color: faisceau.color,
        weight: isSelected ? 2.5 : 1.5,
        opacity: isSelected ? 0.7 : 0.4,
        dashArray: isSelected ? '' : '8 5',
        fill: false,
        interactive: false,
      }).addTo(map);
      corridorLayersRef.current.push(outline);

      // Thin dashed centerline
      if (faisceau.centerline && faisceau.centerline.length >= 2) {
        const center = L.polyline(faisceau.centerline, {
          color: faisceau.color,
          weight: isSelected ? 1.5 : 1,
          opacity: isSelected ? 0.35 : 0.2,
          dashArray: '3 6',
          interactive: false,
        }).addTo(map);
        corridorLayersRef.current.push(center);
      }
    };

    if (!selectedFaisceau) {
      faisceaux.forEach((f) => drawCorridor(f, false));
    } else {
      const selected = faisceaux.find((f) => f.id === selectedFaisceau);
      if (selected) {
        // Dim others – just a light outline
        faisceaux.filter((f) => f.id !== selectedFaisceau).forEach((f) => {
          if (!f.polygon || f.polygon.length < 3) return;
          const outline = L.polygon([f.polygon], {
            color: f.color,
            weight: 1,
            opacity: 0.15,
            dashArray: '6 6',
            fill: false,
            interactive: false,
          }).addTo(map);
          corridorLayersRef.current.push(outline);
        });
        drawCorridor(selected, true);
      }
    }
  }, [L, faisceaux, selectedFaisceau, showCorridors]);

  // ── Commune labels at zoom 15+ ──
  useEffect(() => {
    if (!L || !mapRef.current) return;
    const map = mapRef.current;

    const updateLabels = () => {
      communeLabelsRef.current.forEach((m) => m.remove());
      communeLabelsRef.current = [];

      const zoom = map.getZoom();
      if (zoom < 15 || !showCorridors) return;

      COMMUNE_LABELS.forEach((cl) => {
        if (selectedFaisceau && cl.faisceau !== selectedFaisceau) return;

        const icon = L.divIcon({
          className: '',
          html: `<div style="
            font-family: 'Inter', 'Helvetica Neue', sans-serif;
            font-size: 9px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.15em;
            color: #1b4332;
            background: rgba(255,255,255,0.88);
            border: 1px solid #1b4332;
            padding: 2px 6px;
            white-space: nowrap;
            pointer-events: none;
          ">${cl.name}</div>`,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });

        const marker = L.marker([cl.lat, cl.lng], { icon, interactive: false }).addTo(map);
        communeLabelsRef.current.push(marker);
      });
    };

    updateLabels();
    map.on('zoomend', updateLabels);

    return () => {
      map.off('zoomend', updateLabels);
      communeLabelsRef.current.forEach((m) => m.remove());
      communeLabelsRef.current = [];
    };
  }, [L, selectedFaisceau, showCorridors]);

  // ── Cible markers ──
  useEffect(() => {
    if (!L || !mapRef.current) return;
    cibleMarkersRef.current.forEach((m) => m.remove());
    cibleMarkersRef.current = [];

    cibles.filter((c) => c.latitude && c.longitude).forEach((cible) => {
      const isSelected = selectedCible?.cible_id === cible.cible_id;
      const color = getThemeNeon(cible.theme_principal);
      const size = isSelected ? 14 : 10;
      const themeLabel = THEME_LABELS[cible.theme_principal] || cible.theme_principal;

      const icon = L.divIcon({
        className: '',
        html: cibleDot(color, size, isSelected),
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -size / 2 - 2],
      });

      const marker = L.marker([cible.latitude, cible.longitude], { icon }).addTo(mapRef.current);

      marker.bindPopup(`
        <div style="font-family:'Inter','Helvetica Neue',sans-serif;min-width:160px;max-width:200px;">
          <div style="display:flex;align-items:center;gap:5px;margin-bottom:5px;">
            <span style="display:inline-block;width:8px;height:8px;background:${color};"></span>
            <span style="font-size:9px;text-transform:uppercase;letter-spacing:0.12em;color:${color};">${themeLabel}</span>
          </div>
          <div style="font-weight:600;font-size:12px;line-height:1.3;margin-bottom:6px;">${cible.titre_affichage}</div>
          <div style="font-size:9px;color:#2d6a4f;text-transform:uppercase;letter-spacing:0.1em;cursor:pointer;">▸ Ouvrir le fil</div>
        </div>
      `, { className: 'clean-popup' });

      marker.on('click', () => { onCibleClickRef.current(cible); });
      cibleMarkersRef.current.push(marker);
    });
  }, [L, cibles, selectedCible]);

  // ── Observation markers ──
  useEffect(() => {
    if (!L || !mapRef.current) return;
    obsMarkersRef.current.forEach((m) => m.remove());
    obsMarkersRef.current = [];

    observations.forEach((obs) => {
      const color = OBS_NEON[obs.categorie] || '#8338ec';
      const size = 10;
      const hasPhotos = obs.photos && obs.photos.length > 0;

      const icon = L.divIcon({
        className: '',
        html: obsCross(color, size),
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -size / 2 - 2],
      });

      const marker = L.marker([obs.latitude, obs.longitude], { icon }).addTo(mapRef.current);
      marker.bindPopup(`
        <div style="font-family:'Inter','Helvetica Neue',sans-serif;max-width:200px;">
          <div style="display:flex;align-items:center;gap:5px;margin-bottom:4px;">
            <span style="display:inline-block;width:8px;height:8px;position:relative;">
              <span style="position:absolute;top:50%;left:50%;width:8px;height:2px;background:${color};transform:translate(-50%,-50%) rotate(45deg);"></span>
              <span style="position:absolute;top:50%;left:50%;width:8px;height:2px;background:${color};transform:translate(-50%,-50%) rotate(-45deg);"></span>
            </span>
            <span style="font-size:9px;text-transform:uppercase;letter-spacing:0.1em;color:${color};">${OBS_LABELS[obs.categorie] || 'Observation'}</span>
          </div>
          <div style="font-size:11px;line-height:1.4;">${obs.commentaire}</div>
        </div>
      `, { className: 'clean-popup' });

      obsMarkersRef.current.push(marker);
    });
  }, [L, observations]);

  if (!L) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#eae8e0]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#1b4332] border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-[10px] uppercase tracking-[0.15em] text-[#999]">Chargement</p>
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className="w-full h-full" />;
}

export function Map(props: MapProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#eae8e0]">
        <div className="text-center p-4">
          <p className="text-[12px] text-[#0a0a0a] mb-2 uppercase tracking-wider">Impossible de charger la carte</p>
          <button onClick={() => setHasError(false)} className="text-[11px] text-[#1b4332] border-b-2 border-[#1b4332] hover:text-[#0a0a0a] uppercase tracking-wider transition-colors">Réessayer</button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <ErrorCatcher onError={() => setHasError(true)}>
        <MapInner {...props} />
      </ErrorCatcher>
    </div>
  );
}

class ErrorCatcher extends React.Component<{ children: React.ReactNode; onError: () => void }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error) { console.error('Map error:', error); this.props.onError(); }
  render() { return this.state.hasError ? null : this.props.children; }
}