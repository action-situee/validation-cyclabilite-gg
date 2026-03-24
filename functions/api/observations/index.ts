import { badRequest, handleOptions, jsonResponse, methodNotAllowed, readJsonBody, serviceUnavailable } from '../_shared/http';
import { createId, hasContributionsKv, loadCollection, saveCollection, upsertById } from '../_shared/store';
import type { ObservationRecord } from '../_shared/types';

type Env = {
  CONTRIBUTIONS_KV?: {
    get(key: string, type: 'json'): Promise<unknown | null>;
    put(key: string, value: string): Promise<void>;
  };
};

const STORAGE_KEY = 'observations';

function normalizeObservation(payload: Partial<ObservationRecord> | null): ObservationRecord | null {
  if (!payload) return null;
  if (!Number.isFinite(payload.latitude) || !Number.isFinite(payload.longitude)) return null;
  if (!String(payload.commentaire || '').trim()) return null;
  if (!String(payload.categorie || '').trim()) return null;

  return {
    id: String(payload.id || createId('obs')),
    latitude: Number(payload.latitude),
    longitude: Number(payload.longitude),
    commentaire: String(payload.commentaire || ''),
    categorie: String(payload.categorie || 'autre'),
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

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  if (!hasContributionsKv(env)) {
    return serviceUnavailable('Binding Cloudflare KV CONTRIBUTIONS_KV manquant');
  }
  const items = await loadCollection<ObservationRecord>(env, STORAGE_KEY);
  return jsonResponse(items);
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!hasContributionsKv(env)) {
    return serviceUnavailable('Binding Cloudflare KV CONTRIBUTIONS_KV manquant');
  }
  const payload = await readJsonBody<Partial<ObservationRecord>>(request);
  const observation = normalizeObservation(payload);
  if (!observation) {
    return badRequest('Observation invalide');
  }

  const items = await loadCollection<ObservationRecord>(env, STORAGE_KEY);
  const next = upsertById(items, observation, observation.id);
  await saveCollection(env, STORAGE_KEY, next);
  return jsonResponse(observation, 201);
};

export const onRequest = () => methodNotAllowed(['GET', 'POST', 'OPTIONS']);