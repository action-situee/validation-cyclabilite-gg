import { badRequest, handleOptions, jsonResponse, methodNotAllowed, notFound, readJsonBody, serviceUnavailable } from '../_shared/http';
import { deleteObservationById, getObservationById, hasContributionsDb, saveObservation } from '../_shared/d1';
import type { ObservationRecord } from '../_shared/types';

type Env = {
  CONTRIBUTIONS_DB?: {
    prepare(query: string): unknown;
    batch(statements: unknown[]): Promise<unknown[]>;
  };
};

function normalizeObservation(id: string, payload: Partial<ObservationRecord> | null): ObservationRecord | null {
  if (!payload) return null;
  if (!Number.isFinite(payload.latitude) || !Number.isFinite(payload.longitude)) return null;
  if (!String(payload.commentaire || '').trim()) return null;
  const categories = Array.isArray(payload.categories_concernees)
    ? payload.categories_concernees.map((value) => String(value)).filter(Boolean)
    : [];
  const primaryCategory = String(payload.categorie || categories[0] || '').trim();
  if (!primaryCategory) return null;

  return {
    id,
    latitude: Number(payload.latitude),
    longitude: Number(payload.longitude),
    commentaire: String(payload.commentaire || ''),
    categorie: primaryCategory,
    categories_concernees: categories.length > 0 ? categories : [primaryCategory],
    type_autre: payload.type_autre ? String(payload.type_autre) : undefined,
    classes_concernees: Array.isArray(payload.classes_concernees)
      ? payload.classes_concernees.map((value) => String(value))
      : undefined,
    auteur: String(payload.auteur || 'Anonyme'),
    organisation: payload.organisation ? String(payload.organisation) : undefined,
    role: payload.role ? String(payload.role) : undefined,
    date: String(payload.date || new Date().toISOString().slice(0, 10)),
    heure: payload.heure ? String(payload.heure) : undefined,
    cible_id: payload.cible_id ? String(payload.cible_id) : undefined,
    faisceau_id: payload.faisceau_id ? String(payload.faisceau_id) : undefined,
    segment_id: payload.segment_id ? String(payload.segment_id) : undefined,
    segment_label: payload.segment_label ? String(payload.segment_label) : undefined,
    segment_score_calcule:
      typeof payload.segment_score_calcule === 'number' ? payload.segment_score_calcule : undefined,
    indice_juge: payload.indice_juge ? String(payload.indice_juge) : undefined,
    upvotes: typeof payload.upvotes === 'number' ? payload.upvotes : 0,
    downvotes: typeof payload.downvotes === 'number' ? payload.downvotes : 0,
    votedBy: Array.isArray(payload.votedBy) ? payload.votedBy.map((value) => String(value)) : [],
    commentaires: Array.isArray(payload.commentaires) ? payload.commentaires : [],
    photos: Array.isArray(payload.photos) ? payload.photos.map((value) => String(value)) : undefined,
    owner_fingerprint: payload.owner_fingerprint ? String(payload.owner_fingerprint) : undefined,
  };
}

export const onRequestOptions = () => handleOptions();

export const onRequestPut: PagesFunction<Env> = async ({ params, request, env }) => {
  if (!hasContributionsDb(env)) {
    return serviceUnavailable('Binding Cloudflare D1 CONTRIBUTIONS_DB manquant');
  }
  const id = String(params.id || '').trim();
  if (!id) return badRequest('Identifiant manquant');

  const payload = await readJsonBody<Partial<ObservationRecord>>(request);
  const observation = normalizeObservation(id, payload);
  if (!observation) {
    return badRequest('Observation invalide');
  }

  await saveObservation(env, observation);
  return jsonResponse(observation);
};

export const onRequestDelete: PagesFunction<Env> = async ({ params, env }) => {
  if (!hasContributionsDb(env)) {
    return serviceUnavailable('Binding Cloudflare D1 CONTRIBUTIONS_DB manquant');
  }
  const id = String(params.id || '').trim();
  if (!id) return badRequest('Identifiant manquant');

  const exists = await getObservationById(env, id);
  if (!exists) return notFound('Observation introuvable');

  await deleteObservationById(env, id);
  return jsonResponse({ ok: true });
};

export const onRequest = () => methodNotAllowed(['PUT', 'DELETE', 'OPTIONS']);