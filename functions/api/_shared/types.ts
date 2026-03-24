export interface ObservationCommentRecord {
  id: string;
  texte: string;
  auteur?: string;
  date: string;
  heure?: string;
  owner_fingerprint?: string;
}

export interface ObservationRecord {
  id: string;
  latitude: number;
  longitude: number;
  commentaire: string;
  categorie: string;
  type_autre?: string;
  classes_concernees?: string[];
  auteur: string;
  organisation?: string;
  role?: string;
  date: string;
  heure?: string;
  cible_id?: string;
  faisceau_id?: string;
  segment_id?: string;
  segment_label?: string;
  segment_score_calcule?: number;
  indice_juge?: string;
  upvotes: number;
  downvotes: number;
  votedBy: string[];
  commentaires?: ObservationCommentRecord[];
  photos?: string[];
  owner_fingerprint?: string;
}

export interface CommentaireRecord {
  id: string;
  auteur: string;
  texte: string;
  date: string;
  heure?: string;
  faisceau_id?: string;
  owner_fingerprint?: string;
}

export interface SurveyRecord {
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