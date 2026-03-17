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

/* ── Catégories de retours terrain (croix néon) ── */

export const OBS_NEON: Record<string, string> = {
  danger:      '#f72585',
  amenagement: '#ffd60a',
  positif:     '#00f5d4',
  validation:  '#4cc9f0',
};

export const OBS_LABELS: Record<string, string> = {
  danger:      'Danger',
  amenagement: 'Aménagement',
  positif:     'Point positif',
  validation:  'Validation d\'indice',
};

/** Entrées ordonnées pour la légende sidebar (ordre: validation first) */
export const OBS_CATEGORIES = [
  { key: 'validation',  color: '#4cc9f0', label: 'Validation d\'indice' },
  { key: 'danger',      color: '#f72585', label: 'Danger signalé' },
  { key: 'amenagement', color: '#ffd60a', label: 'Aménagement souhaité' },
  { key: 'positif',     color: '#00f5d4', label: 'Point positif' },
];

/* ── Labels d'indice jugé ── */

export const INDICE_LABELS: Record<string, string> = {
  trop_faible: 'Sous-estimé',
  juste:       'Cohérent',
  trop_eleve:  'Surestimé',
};
