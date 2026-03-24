// Types pour l'application de cyclabilité du Grand Genève

export interface Cible {
  cible_id: string;
  faisceau_id: string;
  faisceau_nom: string;
  theme_principal: string;
  latitude: number;
  longitude: number;
  titre_affichage: string;
  sous_titre_affichage?: string;
  question_cle?: string;
  score_indice_calcule: number;
  classe_indice_calcule: string;
  // Champs optionnels (conservés pour compatibilité tableur)
  secteur_nom?: string;
  type_cible?: string;
  cote_frontiere?: string;
  priorite_revue?: string;
  delta_potentiel?: number;
  quick_win_potentiel?: boolean;
  type_geometrie?: string;
  statut_validation?: string;
  derniere_mise_a_jour?: string;
}

/* ── Profil contributeur ── */
export type RoleContributeur =
  | 'usager_expert'
  | 'technicien'
  | 'elu'
  | 'associatif'
  | 'autre';

export const ROLE_LABELS: Record<RoleContributeur, string> = {
  usager_expert: 'Usager·ère expert·e',
  technicien: 'Technicien·ne',
  elu: 'Élu·e',
  associatif: 'Membre d\'association',
  autre: 'Autre',
};

export type ObservationCategory =
  | 'securite_intersections'
  | 'giratoire'
  | 'maillage_alternative'
  | 'equipement'
  | 'permeabilite_frontiere'
  | 'bande_piste'
  | 'conflits_usage'
  | 'autre';

export type ObservationMetricClass =
  | 'attractivite'
  | 'confort'
  | 'equipement'
  | 'infrastructure'
  | 'securite';

export type ObservationIndiceFeedback =
  | 'adapte'
  | 'sur_estime'
  | 'sous_estime';

export interface ObservationComment {
  id: string;
  texte: string;
  auteur?: string;
  date: string;
  heure?: string;
  owner_fingerprint?: string;
}

export interface ObservationLibre {
  id: string;
  latitude: number;
  longitude: number;
  commentaire: string;
  categorie: ObservationCategory;
  categories_concernees?: ObservationCategory[];
  type_autre?: string;
  classes_concernees?: ObservationMetricClass[];
  auteur: string;
  organisation?: string;
  role?: RoleContributeur;
  date: string;
  heure?: string;
  cible_id?: string;
  faisceau_id?: string;
  segment_id?: string;
  segment_label?: string;
  segment_score_calcule?: number;
  indice_juge?: ObservationIndiceFeedback;
  upvotes: number;
  downvotes: number;
  votedBy: string[];  // list of voter identifiers to prevent double vote
  commentaires?: ObservationComment[];
  // Photos (base64 data URIs, compressed)
  photos?: string[];
  // Fingerprint propriétaire (hash IP ou fallback local)
  owner_fingerprint?: string;
}

export interface CommentaireGeneral {
  id: string;
  auteur: string;
  texte: string;
  date: string;
  heure?: string;
  faisceau_id?: string;
  // Fingerprint propriétaire (hash IP ou fallback local)
  owner_fingerprint?: string;
}

export interface Faisceau {
  id: string;
  nom: string;
  description?: string;
  center: [number, number];
  zoom: number;
  bounds: [[number, number], [number, number]];
  color: string;
  /** Position for the label, outside the corridor */
  labelAnchor: [number, number];
  /** Centerline points for circle chain rendering [lat, lng][] */
  centerline: [number, number][];
  /** Polygon corridor as [lat, lng][] ring */
  polygon: [number, number][];
}

export interface BikeSegment {
  segment_id: string;
  spatial_unit?: 'segment' | 'carreau200';
  faisceau_id: string;
  faisceau_nom: string;
  faisceau_color: string;
  bike_index: number | null;
  bike_index_class: string;
  length: number;
  center: [number, number];
  geometry?: [number, number][];
  bike_index_unweighted?: number;
  Classe_attractivite?: number;
  Classe_confort?: number;
  Classe_equipement?: number;
  Classe_infrastructure?: number;
  Classe_securite?: number;
  amenite?: number;
  connectivite?: number;
  pente?: number;
  eau?: number;
  temperature?: number;
  air?: number;
  alentours?: number;
  canopee?: number;
  stationnement_velo?: number;
  borne_reparation?: number;
  location?: number;
  sens_inverse?: number;
  service_velo?: number;
  parking_abris?: number;
  piste?: number;
  bande?: number;
  revetement?: number;
  giratoire?: number;
  tourner_droite?: number;
  eclairage?: number;
  zone_apaisee?: number;
  vitesse_motorisee?: number;
  conflit_md?: number;
  accident?: number;
}

export interface SurveyResponse {
  id?: string;
  auteur: string;
  organisation?: string;
  faisceau_id?: string;
  q1: string;
  q2: string;
  q3: string;
  date: string;
  owner_fingerprint?: string;
}
