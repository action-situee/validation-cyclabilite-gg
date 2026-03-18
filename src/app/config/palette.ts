/**
 * Palettes centralisées – source unique de vérité
 * pour les couleurs et labels des thèmes / catégories.
 */

/* ── Thèmes des points d'attention (ronds colorés) ── */

export const THEME_NEON: Record<string, string> = {
  permeabilite_frontiere: '#8338ec',
  intersections:          '#ff006e',
  giratoires:             '#fb5607',
  alternatives:           '#3a86ff',
  continuite:             '#06d6a0',
  equipements:            '#ffbe0b',
  attractivite:           '#e056a0',
};

export const THEME_LABELS: Record<string, string> = {
  permeabilite_frontiere: 'Perméabilité frontière',
  intersections:          'Sécurité intersections',
  giratoires:             'Giratoires',
  alternatives:           'Maillage & alternatives',
  continuite:             'Continuité & confort',
  equipements:            'Équipements',
  attractivite:           'Attractivité',
};

export function getThemeNeon(theme: string): string {
  return THEME_NEON[theme] || '#8338ec';
}

/** Entrées ordonnées pour les légendes de la sidebar */
export const CIBLE_THEMES = Object.entries(THEME_NEON).map(([key, color]) => ({
  key,
  color,
  label: THEME_LABELS[key] || key,
}));

/* ── Catégories de retours terrain ── */

export const OBS_NEON: Record<string, string> = {
  securite_intersections: '#f72585',
  giratoire: '#f72585',
  maillage_alternative: '#f72585',
  equipement: '#f72585',
  permeabilite_frontiere: '#f72585',
  bande_piste: '#f72585',
  conflits_usage: '#f72585',
  autre: '#f72585',
};

export const OBS_LABELS: Record<string, string> = {
  securite_intersections: 'Sécurité intersections',
  giratoire: 'Giratoire',
  maillage_alternative: 'Maillage et alternative',
  equipement: 'Équipement',
  permeabilite_frontiere: 'Perméabilité de la frontière',
  bande_piste: 'Bande / piste',
  conflits_usage: 'Conflits d\'usage',
  autre: 'Autre',
};

/** Entrées ordonnées pour la légende sidebar */
export const OBS_CATEGORIES = [
  { key: 'securite_intersections', color: '#f72585', label: 'Sécurité intersections' },
  { key: 'giratoire', color: '#f72585', label: 'Giratoire' },
  { key: 'maillage_alternative', color: '#f72585', label: 'Maillage et alternative' },
  { key: 'equipement', color: '#f72585', label: 'Équipement' },
  { key: 'permeabilite_frontiere', color: '#f72585', label: 'Perméabilité de la frontière' },
  { key: 'bande_piste', color: '#f72585', label: 'Bande / piste' },
  { key: 'conflits_usage', color: '#f72585', label: 'Conflits d\'usage' },
  { key: 'autre', color: '#f72585', label: 'Autre' },
];

/* ── Labels d'indice jugé ── */

export const INDICE_LABELS: Record<string, string> = {
  adapte: 'Adapté',
  sur_estime: 'Sur-estimé',
  sous_estime: 'Sous-estimé',
};
