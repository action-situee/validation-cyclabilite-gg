import { Faisceau } from '../types';

export const FAISCEAUX: Faisceau[] = [
  {
    id: 'plo_stjulien',
    nom: 'Saint-Julien · PLO · Carouge',
    description: 'Corridor sud : de Saint-Julien-en-Genevois à Genève via Plan-les-Ouates et Bardonnex',
    center: [46.158, 6.112],
    zoom: 13,
    bounds: [[46.130, 6.055], [46.195, 6.160]],
    color: '#2E6A4A',
    labelAnchor: [46.162, 6.068],
    // Centerline for circle chain rendering
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
      // ── West side, south to north ──
      [46.1350, 6.0680],  // St-Julien SW
      [46.1400, 6.0720],
      [46.1450, 6.0770],  // approaching border
      [46.1490, 6.0840],  // concave pinch – border
      [46.1520, 6.0890],
      [46.1555, 6.0940],  // Bardonnex W
      [46.1590, 6.0970],
      [46.1620, 6.0985],  // Compesières – slight pinch
      [46.1660, 6.1000],
      [46.1700, 6.1020],  // PLO W
      [46.1730, 6.1040],  // Saconnex pinch
      [46.1760, 6.1070],
      [46.1800, 6.1120],  // Bachet approach
      [46.1840, 6.1190],
      [46.1880, 6.1270],  // Carouge / Genève

      // ── North tip ──
      [46.1920, 6.1350],

      // ── East side, north to south ──
      [46.1880, 6.1450],
      [46.1840, 6.1380],
      [46.1800, 6.1310],
      [46.1760, 6.1250],
      [46.1730, 6.1220],  // Saconnex pinch east
      [46.1700, 6.1190],
      [46.1660, 6.1170],  // PLO E
      [46.1620, 6.1155],  // Compesières pinch east
      [46.1590, 6.1135],
      [46.1555, 6.1110],  // Bardonnex E
      [46.1520, 6.1060],
      [46.1490, 6.1010],  // concave pinch – border east
      [46.1450, 6.0950],
      [46.1400, 6.0900],
      [46.1350, 6.0860],  // St-Julien SE
    ],
  },
  {
    id: 'thonex_gaillard',
    nom: 'Gaillard – Thonex – Eaux-Vives',
    description: 'Corridor est : de Gaillard (FR) aux Eaux-Vives (GE) via Thonex et Chêne-Bougeries',
    center: [46.197, 6.195],
    zoom: 13,
    bounds: [[46.180, 6.135], [46.215, 6.250]],
    color: '#2E6A4A',
    labelAnchor: [46.212, 6.190],
    // Centerline for circle chain rendering
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
      // ── North side, west to east ──
      [46.2085, 6.1440],  // Eaux-Vives NW
      [46.2090, 6.1520],
      [46.2088, 6.1600],
      [46.2082, 6.1680],
      [46.2072, 6.1740],  // Chêne-Bougeries pinch N
      [46.2065, 6.1800],
      [46.2060, 6.1870],  // Chêne-Bourg N
      [46.2052, 6.1940],
      [46.2045, 6.2000],  // Gradelle pinch N
      [46.2038, 6.2060],
      [46.2030, 6.2120],  // Thônex N
      [46.2020, 6.2180],
      [46.2008, 6.2230],  // Foron pinch N
      [46.1992, 6.2280],
      [46.1975, 6.2330],  // Gaillard N

      // ── East tip ──
      [46.1950, 6.2390],

      // ── South side, east to west ──
      [46.1920, 6.2330],  // Gaillard S
      [46.1935, 6.2280],
      [46.1948, 6.2230],  // Foron pinch S
      [46.1960, 6.2180],
      [46.1970, 6.2120],  // Thônex S
      [46.1978, 6.2060],
      [46.1985, 6.2000],  // Gradelle pinch S
      [46.1992, 6.1940],
      [46.1998, 6.1870],  // Chêne-Bourg S
      [46.2005, 6.1800],
      [46.2012, 6.1740],  // Chêne-Bougeries pinch S
      [46.2020, 6.1680],
      [46.2028, 6.1600],
      [46.2032, 6.1520],
      [46.2035, 6.1440],  // Eaux-Vives SW
    ],
  },
];

export const DEFAULT_CENTER: [number, number] = [46.178, 6.170];
export const DEFAULT_ZOOM = 12;