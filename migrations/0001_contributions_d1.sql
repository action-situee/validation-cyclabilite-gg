CREATE TABLE IF NOT EXISTS observations (
  id TEXT PRIMARY KEY,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  commentaire TEXT NOT NULL,
  categorie TEXT NOT NULL,
  type_autre TEXT,
  classes_concernees_json TEXT NOT NULL DEFAULT '[]',
  auteur TEXT NOT NULL,
  organisation TEXT,
  role TEXT,
  date TEXT NOT NULL,
  heure TEXT,
  cible_id TEXT,
  faisceau_id TEXT,
  segment_id TEXT,
  segment_label TEXT,
  segment_score_calcule REAL,
  indice_juge TEXT,
  upvotes INTEGER NOT NULL DEFAULT 0,
  downvotes INTEGER NOT NULL DEFAULT 0,
  voted_by_json TEXT NOT NULL DEFAULT '[]',
  photos_json TEXT,
  owner_fingerprint TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS observation_comments (
  id TEXT PRIMARY KEY,
  observation_id TEXT NOT NULL,
  texte TEXT NOT NULL,
  auteur TEXT,
  date TEXT NOT NULL,
  heure TEXT,
  owner_fingerprint TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (observation_id) REFERENCES observations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS commentaires (
  id TEXT PRIMARY KEY,
  auteur TEXT NOT NULL,
  texte TEXT NOT NULL,
  date TEXT NOT NULL,
  heure TEXT,
  faisceau_id TEXT,
  owner_fingerprint TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS surveys (
  id TEXT PRIMARY KEY,
  auteur TEXT NOT NULL,
  organisation TEXT,
  faisceau_id TEXT,
  q1 TEXT NOT NULL,
  q2 TEXT NOT NULL,
  q3 TEXT NOT NULL,
  date TEXT NOT NULL,
  owner_fingerprint TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_observations_date ON observations(date DESC, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_observations_faisceau ON observations(faisceau_id);
CREATE INDEX IF NOT EXISTS idx_observation_comments_observation ON observation_comments(observation_id, date ASC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_commentaires_date ON commentaires(date DESC, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_commentaires_faisceau ON commentaires(faisceau_id);
CREATE INDEX IF NOT EXISTS idx_surveys_date ON surveys(date DESC, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_surveys_faisceau ON surveys(faisceau_id);