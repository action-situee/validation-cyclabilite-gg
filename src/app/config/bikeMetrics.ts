import type { BikeSegment } from '../types';

export const VALUE_PALETTE = [
  '#B00020',
  '#D02F1E',
  '#E24F24',
  '#FFD98A',
  '#F1F5A0',
  '#DDF4A3',
  '#C8EE9A',
  '#A6E083',
  '#7FCB62',
  '#38A74A',
  '#007A35',
] as const;

export const VALUE_THRESHOLDS = [0.18, 0.2, 0.25, 0.29, 0.33, 0.37, 0.41, 0.45, 0.52, 0.95] as const;
const QUANTILE_CLASS_LABELS = ['tres_faible', 'faible', 'moyen', 'bon', 'tres_bon'] as const;

export interface BikeAttributeDefinition {
  name: string;
  technicalName: keyof BikeSegment;
}

export interface BikeMetricDefinition {
  key: string;
  field: string;
  label: string;
  shortLabel: string;
  description: string;
}

export interface BikeClassDefinition extends BikeMetricDefinition {
  color: string;
  attributes: readonly BikeAttributeDefinition[];
}

export const BIKE_CLASS_DEFINITIONS = [
  {
    key: 'Classe_attractivite',
    field: 'Classe_attractivite',
    label: 'Attractivite',
    shortLabel: 'Attractivite',
    description: 'Le reseau donne-t-il envie de circuler a velo ?',
    color: '#8DBA9A',
    attributes: [
      { name: 'Amenites', technicalName: 'amenite' },
      { name: 'Connectivite', technicalName: 'connectivite' },
      { name: 'Pente', technicalName: 'pente' },
    ],
  },
  {
    key: 'Classe_confort',
    field: 'Classe_confort',
    label: 'Confort',
    shortLabel: 'Confort',
    description: 'Le trajet est-il confortable a velo ?',
    color: '#5F9A73',
    attributes: [
      { name: 'Eau', technicalName: 'eau' },
      { name: 'Temperature', technicalName: 'temperature' },
      { name: 'Qualite de l\'air', technicalName: 'air' },
      { name: 'Alentours', technicalName: 'alentours' },
      { name: 'Canopee', technicalName: 'canopee' },
    ],
  },
  {
    key: 'Classe_equipement',
    field: 'Classe_equipement',
    label: 'Equipement',
    shortLabel: 'Equipement',
    description: 'Les services utiles aux cyclistes sont-ils presents ?',
    color: '#3F7C58',
    attributes: [
      { name: 'Stationnement velo', technicalName: 'stationnement_velo' },
      { name: 'Borne de reparation', technicalName: 'borne_reparation' },
      { name: 'Location', technicalName: 'location' },
      { name: 'Sens inverse cyclable', technicalName: 'sens_inverse' },
      { name: 'Services velo', technicalName: 'service_velo' },
      { name: 'Parking abri', technicalName: 'parking_abris' },
    ],
  },
  {
    key: 'Classe_infrastructure',
    field: 'Classe_infrastructure',
    label: 'Infrastructure',
    shortLabel: 'Infrastructure',
    description: "L'amenagement cyclable est-il qualitatif ?",
    color: '#2E6A4A',
    attributes: [
      { name: 'Piste cyclable', technicalName: 'piste' },
      { name: 'Bande cyclable', technicalName: 'bande' },
      { name: 'Revetement', technicalName: 'revetement' },
      { name: 'Giratoire', technicalName: 'giratoire' },
      { name: 'Tourner a droite', technicalName: 'tourner_droite' },
    ],
  },
  {
    key: 'Classe_securite',
    field: 'Classe_securite',
    label: 'Securite',
    shortLabel: 'Securite',
    description: 'Puis-je circuler a velo en securite ?',
    color: '#1E4F37',
    attributes: [
      { name: 'Eclairage', technicalName: 'eclairage' },
      { name: 'Zone apaisee', technicalName: 'zone_apaisee' },
      { name: 'Vitesse motorisee', technicalName: 'vitesse_motorisee' },
      { name: 'Conflits modes doux', technicalName: 'conflit_md' },
      { name: 'Historique accidents', technicalName: 'accident' },
    ],
  },
] as const satisfies ReadonlyArray<BikeClassDefinition>;

export const BIKE_METRICS = [
  {
    key: 'bike_index',
    field: 'bike_index',
    label: 'Indice global',
    shortLabel: 'Global',
    description: "Lecture globale de l'indice de cyclabilite.",
  },
  ...BIKE_CLASS_DEFINITIONS,
] as const satisfies ReadonlyArray<BikeMetricDefinition>;

export type BikeMetricKey = typeof BIKE_METRICS[number]['key'];
export type BikeClassMetricKey = typeof BIKE_CLASS_DEFINITIONS[number]['key'];

export const BIKE_METRIC_BY_KEY = Object.fromEntries(
  BIKE_METRICS.map((metric) => [metric.key, metric]),
) as Record<BikeMetricKey, (typeof BIKE_METRICS)[number]>;

export const BIKE_CLASS_BY_KEY = Object.fromEntries(
  BIKE_CLASS_DEFINITIONS.map((bikeClass) => [bikeClass.key, bikeClass]),
) as Record<BikeClassMetricKey, (typeof BIKE_CLASS_DEFINITIONS)[number]>;

export function buildColorRampExpression(field: string, thresholds: readonly number[] = VALUE_THRESHOLDS) {
  const input = ['coalesce', ['to-number', ['get', field]], 0];
  const expr: any[] = ['step', input, VALUE_PALETTE[0]];
  const safeThresholds = thresholds.length > 0 ? thresholds : VALUE_THRESHOLDS;
  safeThresholds.forEach((threshold, index) => {
    expr.push(threshold, VALUE_PALETTE[index + 1]);
  });
  return expr;
}

export function getMetricValue(feature: Record<string, unknown>, field: string): number | null {
  const raw = feature[field];
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string' && raw.trim() !== '') {
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  }
  return null;
}

export function getMetricValueByKey(feature: BikeSegment | Record<string, unknown>, key: BikeMetricKey): number | null {
  return getMetricValue(feature as Record<string, unknown>, BIKE_METRIC_BY_KEY[key].field);
}

export function getThresholdBucketIndex(value: number | null, thresholds: readonly number[] = VALUE_THRESHOLDS) {
  if (value === null || Number.isNaN(value)) return 'non_evalue';

  const safeThresholds = thresholds.length > 0 ? thresholds : VALUE_THRESHOLDS;
  for (let index = 0; index < safeThresholds.length; index += 1) {
    if (value < safeThresholds[index]) return index;
  }

  return safeThresholds.length;
}

export function getMetricClass(value: number | null, thresholds: readonly number[] = VALUE_THRESHOLDS) {
  const bucketIndex = getThresholdBucketIndex(value, thresholds);
  if (bucketIndex === 'non_evalue') return bucketIndex;

  const totalBuckets = (thresholds.length > 0 ? thresholds : VALUE_THRESHOLDS).length + 1;
  const classIndex = Math.min(
    QUANTILE_CLASS_LABELS.length - 1,
    Math.floor((bucketIndex / totalBuckets) * QUANTILE_CLASS_LABELS.length),
  );

  return QUANTILE_CLASS_LABELS[classIndex];
}

export function getPaletteColor(value: number, thresholds: readonly number[] = VALUE_THRESHOLDS): string {
  const safeValue = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
  const safeThresholds = thresholds.length > 0 ? thresholds : VALUE_THRESHOLDS;
  if (safeValue < safeThresholds[0]) return VALUE_PALETTE[0];

  for (let index = 0; index < safeThresholds.length - 1; index += 1) {
    if (safeValue >= safeThresholds[index] && safeValue < safeThresholds[index + 1]) {
      return VALUE_PALETTE[index + 1];
    }
  }

  return VALUE_PALETTE[VALUE_PALETTE.length - 1];
}

export function buildQuantileLegendBins(thresholds: readonly number[] = VALUE_THRESHOLDS) {
  const safeThresholds = thresholds.length > 0 ? thresholds : VALUE_THRESHOLDS;

  return VALUE_PALETTE.map((color, index) => {
    if (index === 0) {
      return {
        color,
        label: `< ${formatLegendThreshold(safeThresholds[0])}`,
      };
    }

    if (index === VALUE_PALETTE.length - 1) {
      return {
        color,
        label: `>= ${formatLegendThreshold(safeThresholds[safeThresholds.length - 1])}`,
      };
    }

    return {
      color,
      label: `${formatLegendThreshold(safeThresholds[index - 1])} - ${formatLegendThreshold(safeThresholds[index])}`,
    };
  });
}

function formatLegendThreshold(value: number) {
  if (!Number.isFinite(value)) return 'n/a';
  if (Math.abs(value) < 0.001) return value.toFixed(4);
  if (Math.abs(value) < 0.01) return value.toFixed(3);
  return value.toFixed(2);
}
