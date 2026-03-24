import type { CommentaireRecord, ObservationCommentRecord, ObservationRecord, SurveyRecord } from './types';

type D1PreparedStatementLike = {
  bind(...values: unknown[]): D1PreparedStatementLike;
  first<T = Record<string, unknown>>(columnName?: string): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results?: T[] }>;
};

type D1DatabaseLike = {
  prepare(query: string): D1PreparedStatementLike;
  batch<T = unknown>(statements: D1PreparedStatementLike[]): Promise<T[]>;
};

type EnvLike = {
  CONTRIBUTIONS_DB?: D1DatabaseLike;
};

type ObservationRow = {
  id: string;
  latitude: number;
  longitude: number;
  commentaire: string;
  categorie: string;
  categories_concernees_json?: string | null;
  type_autre?: string | null;
  classes_concernees_json?: string | null;
  auteur: string;
  organisation?: string | null;
  role?: string | null;
  date: string;
  heure?: string | null;
  cible_id?: string | null;
  faisceau_id?: string | null;
  segment_id?: string | null;
  segment_label?: string | null;
  segment_score_calcule?: number | null;
  indice_juge?: string | null;
  upvotes?: number | null;
  downvotes?: number | null;
  voted_by_json?: string | null;
  photos_json?: string | null;
  owner_fingerprint?: string | null;
};

type ObservationCommentRow = {
  id: string;
  observation_id: string;
  texte: string;
  auteur?: string | null;
  date: string;
  heure?: string | null;
  owner_fingerprint?: string | null;
};

type CommentaireRow = {
  id: string;
  auteur: string;
  texte: string;
  date: string;
  heure?: string | null;
  faisceau_id?: string | null;
  owner_fingerprint?: string | null;
};

type SurveyRow = {
  id: string;
  auteur: string;
  organisation?: string | null;
  faisceau_id?: string | null;
  q1: string;
  q2: string;
  q3: string;
  date: string;
  owner_fingerprint?: string | null;
};

export function createId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function jsonArray(value: unknown) {
  return JSON.stringify(Array.isArray(value) ? value : []);
}

function parseJsonArray<T>(value: unknown): T[] {
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function toNullableString(value: unknown) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function toNullableNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function mapObservationComment(row: ObservationCommentRow): ObservationCommentRecord {
  return {
    id: row.id,
    texte: row.texte,
    auteur: row.auteur || undefined,
    date: row.date,
    heure: row.heure || undefined,
    owner_fingerprint: row.owner_fingerprint || undefined,
  };
}

function mapObservation(row: ObservationRow, comments: ObservationCommentRecord[]): ObservationRecord {
  return {
    id: row.id,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    commentaire: row.commentaire,
    categorie: row.categorie,
    categories_concernees: parseJsonArray<string>(row.categories_concernees_json),
    type_autre: row.type_autre || undefined,
    classes_concernees: parseJsonArray<string>(row.classes_concernees_json),
    auteur: row.auteur,
    organisation: row.organisation || undefined,
    role: row.role || undefined,
    date: row.date,
    heure: row.heure || undefined,
    cible_id: row.cible_id || undefined,
    faisceau_id: row.faisceau_id || undefined,
    segment_id: row.segment_id || undefined,
    segment_label: row.segment_label || undefined,
    segment_score_calcule: typeof row.segment_score_calcule === 'number' ? row.segment_score_calcule : undefined,
    indice_juge: row.indice_juge || undefined,
    upvotes: row.upvotes ?? 0,
    downvotes: row.downvotes ?? 0,
    votedBy: parseJsonArray<string>(row.voted_by_json),
    commentaires: comments,
    photos: parseJsonArray<string>(row.photos_json),
    owner_fingerprint: row.owner_fingerprint || undefined,
  };
}

function mapCommentaire(row: CommentaireRow): CommentaireRecord {
  return {
    id: row.id,
    auteur: row.auteur,
    texte: row.texte,
    date: row.date,
    heure: row.heure || undefined,
    faisceau_id: row.faisceau_id || undefined,
    owner_fingerprint: row.owner_fingerprint || undefined,
  };
}

function mapSurvey(row: SurveyRow): SurveyRecord {
  return {
    id: row.id,
    auteur: row.auteur,
    organisation: row.organisation || undefined,
    faisceau_id: row.faisceau_id || undefined,
    q1: row.q1,
    q2: row.q2,
    q3: row.q3,
    date: row.date,
    owner_fingerprint: row.owner_fingerprint || undefined,
  };
}

function upsertObservationStatement(db: D1DatabaseLike, observation: ObservationRecord) {
  return db.prepare(`
    INSERT INTO observations (
      id, latitude, longitude, commentaire, categorie, categories_concernees_json, type_autre, classes_concernees_json,
      auteur, organisation, role, date, heure, cible_id, faisceau_id, segment_id,
      segment_label, segment_score_calcule, indice_juge, upvotes, downvotes,
      voted_by_json, photos_json, owner_fingerprint, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      latitude = excluded.latitude,
      longitude = excluded.longitude,
      commentaire = excluded.commentaire,
      categorie = excluded.categorie,
      categories_concernees_json = excluded.categories_concernees_json,
      type_autre = excluded.type_autre,
      classes_concernees_json = excluded.classes_concernees_json,
      auteur = excluded.auteur,
      organisation = excluded.organisation,
      role = excluded.role,
      date = excluded.date,
      heure = excluded.heure,
      cible_id = excluded.cible_id,
      faisceau_id = excluded.faisceau_id,
      segment_id = excluded.segment_id,
      segment_label = excluded.segment_label,
      segment_score_calcule = excluded.segment_score_calcule,
      indice_juge = excluded.indice_juge,
      upvotes = excluded.upvotes,
      downvotes = excluded.downvotes,
      voted_by_json = excluded.voted_by_json,
      photos_json = excluded.photos_json,
      owner_fingerprint = excluded.owner_fingerprint,
      updated_at = excluded.updated_at
  `).bind(
    observation.id,
    observation.latitude,
    observation.longitude,
    observation.commentaire,
    observation.categorie,
    jsonArray(observation.categories_concernees),
    toNullableString(observation.type_autre),
    jsonArray(observation.classes_concernees),
    observation.auteur,
    toNullableString(observation.organisation),
    toNullableString(observation.role),
    observation.date,
    toNullableString(observation.heure),
    toNullableString(observation.cible_id),
    toNullableString(observation.faisceau_id),
    toNullableString(observation.segment_id),
    toNullableString(observation.segment_label),
    toNullableNumber(observation.segment_score_calcule),
    toNullableString(observation.indice_juge),
    observation.upvotes ?? 0,
    observation.downvotes ?? 0,
    jsonArray(observation.votedBy),
    observation.photos ? jsonArray(observation.photos) : null,
    toNullableString(observation.owner_fingerprint),
    new Date().toISOString(),
  );
}

function insertObservationCommentStatement(db: D1DatabaseLike, observationId: string, comment: ObservationCommentRecord) {
  return db.prepare(`
    INSERT INTO observation_comments (
      id, observation_id, texte, auteur, date, heure, owner_fingerprint, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    comment.id,
    observationId,
    comment.texte,
    toNullableString(comment.auteur),
    comment.date,
    toNullableString(comment.heure),
    toNullableString(comment.owner_fingerprint),
    new Date().toISOString(),
  );
}

function upsertCommentaireStatement(db: D1DatabaseLike, commentaire: CommentaireRecord) {
  return db.prepare(`
    INSERT INTO commentaires (id, auteur, texte, date, heure, faisceau_id, owner_fingerprint, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      auteur = excluded.auteur,
      texte = excluded.texte,
      date = excluded.date,
      heure = excluded.heure,
      faisceau_id = excluded.faisceau_id,
      owner_fingerprint = excluded.owner_fingerprint,
      updated_at = excluded.updated_at
  `).bind(
    commentaire.id,
    commentaire.auteur,
    commentaire.texte,
    commentaire.date,
    toNullableString(commentaire.heure),
    toNullableString(commentaire.faisceau_id),
    toNullableString(commentaire.owner_fingerprint),
    new Date().toISOString(),
  );
}

function upsertSurveyStatement(db: D1DatabaseLike, survey: SurveyRecord) {
  return db.prepare(`
    INSERT INTO surveys (id, auteur, organisation, faisceau_id, q1, q2, q3, date, owner_fingerprint, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      auteur = excluded.auteur,
      organisation = excluded.organisation,
      faisceau_id = excluded.faisceau_id,
      q1 = excluded.q1,
      q2 = excluded.q2,
      q3 = excluded.q3,
      date = excluded.date,
      owner_fingerprint = excluded.owner_fingerprint,
      updated_at = excluded.updated_at
  `).bind(
    survey.id,
    survey.auteur,
    toNullableString(survey.organisation),
    toNullableString(survey.faisceau_id),
    survey.q1,
    survey.q2,
    survey.q3,
    survey.date,
    toNullableString(survey.owner_fingerprint),
    new Date().toISOString(),
  );
}

export function hasContributionsDb(env: EnvLike) {
  return Boolean(env.CONTRIBUTIONS_DB);
}

export async function listObservations(env: EnvLike): Promise<ObservationRecord[]> {
  const db = env.CONTRIBUTIONS_DB;
  if (!db) return [];

  const [observationResult, commentsResult] = await Promise.all([
    db.prepare(`
      SELECT * FROM observations
      ORDER BY date DESC, COALESCE(heure, '') DESC, updated_at DESC
    `).all<ObservationRow>(),
    db.prepare(`
      SELECT * FROM observation_comments
      ORDER BY date ASC, COALESCE(heure, '') ASC, created_at ASC
    `).all<ObservationCommentRow>(),
  ]);

  const commentsByObservation = new Map<string, ObservationCommentRecord[]>();
  for (const row of commentsResult.results || []) {
    const list = commentsByObservation.get(row.observation_id) || [];
    list.push(mapObservationComment(row));
    commentsByObservation.set(row.observation_id, list);
  }

  return (observationResult.results || []).map((row) =>
    mapObservation(row, commentsByObservation.get(row.id) || []),
  );
}

export async function getObservationById(env: EnvLike, id: string): Promise<ObservationRecord | null> {
  const observations = await listObservations(env);
  return observations.find((item) => item.id === id) || null;
}

export async function saveObservation(env: EnvLike, observation: ObservationRecord) {
  const db = env.CONTRIBUTIONS_DB;
  if (!db) return;

  const statements: D1PreparedStatementLike[] = [
    upsertObservationStatement(db, observation),
    db.prepare('DELETE FROM observation_comments WHERE observation_id = ?').bind(observation.id),
  ];

  for (const comment of observation.commentaires || []) {
    statements.push(insertObservationCommentStatement(db, observation.id, comment));
  }

  await db.batch(statements);
}

export async function deleteObservationById(env: EnvLike, id: string) {
  const db = env.CONTRIBUTIONS_DB;
  if (!db) return;
  await db.batch([
    db.prepare('DELETE FROM observation_comments WHERE observation_id = ?').bind(id),
    db.prepare('DELETE FROM observations WHERE id = ?').bind(id),
  ]);
}

export async function listCommentaires(env: EnvLike): Promise<CommentaireRecord[]> {
  const db = env.CONTRIBUTIONS_DB;
  if (!db) return [];
  const result = await db.prepare(`
    SELECT * FROM commentaires
    ORDER BY date DESC, COALESCE(heure, '') DESC, updated_at DESC
  `).all<CommentaireRow>();
  return (result.results || []).map(mapCommentaire);
}

export async function getCommentaireById(env: EnvLike, id: string): Promise<CommentaireRecord | null> {
  const db = env.CONTRIBUTIONS_DB;
  if (!db) return null;
  const row = await db.prepare('SELECT * FROM commentaires WHERE id = ?').bind(id).first<CommentaireRow>();
  return row ? mapCommentaire(row) : null;
}

export async function saveCommentaire(env: EnvLike, commentaire: CommentaireRecord) {
  const db = env.CONTRIBUTIONS_DB;
  if (!db) return;
  await db.batch([upsertCommentaireStatement(db, commentaire)]);
}

export async function deleteCommentaireById(env: EnvLike, id: string) {
  const db = env.CONTRIBUTIONS_DB;
  if (!db) return;
  await db.batch([db.prepare('DELETE FROM commentaires WHERE id = ?').bind(id)]);
}

export async function listSurveys(env: EnvLike): Promise<SurveyRecord[]> {
  const db = env.CONTRIBUTIONS_DB;
  if (!db) return [];
  const result = await db.prepare(`
    SELECT * FROM surveys
    ORDER BY date DESC, updated_at DESC
  `).all<SurveyRow>();
  return (result.results || []).map(mapSurvey);
}

export async function saveSurvey(env: EnvLike, survey: SurveyRecord) {
  const db = env.CONTRIBUTIONS_DB;
  if (!db) return;
  await db.batch([upsertSurveyStatement(db, survey)]);
}