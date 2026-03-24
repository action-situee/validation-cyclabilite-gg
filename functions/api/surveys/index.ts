import { badRequest, handleOptions, jsonResponse, methodNotAllowed, readJsonBody, serviceUnavailable } from '../_shared/http';
import { createId, hasContributionsKv, loadCollection, saveCollection, upsertById } from '../_shared/store';
import type { SurveyRecord } from '../_shared/types';

type Env = {
  CONTRIBUTIONS_KV?: {
    get(key: string, type: 'json'): Promise<unknown | null>;
    put(key: string, value: string): Promise<void>;
  };
};

const STORAGE_KEY = 'surveys';

function normalizeSurvey(payload: Partial<SurveyRecord> | null): SurveyRecord | null {
  if (!payload) return null;
  if (!String(payload.q1 || '').trim()) return null;
  if (!String(payload.q2 || '').trim()) return null;
  if (!String(payload.q3 || '').trim()) return null;

  return {
    id: String(payload.id || createId('survey')),
    auteur: String(payload.auteur || 'Anonyme'),
    organisation: payload.organisation ? String(payload.organisation) : undefined,
    faisceau_id: payload.faisceau_id ? String(payload.faisceau_id) : undefined,
    q1: String(payload.q1 || ''),
    q2: String(payload.q2 || ''),
    q3: String(payload.q3 || ''),
    date: String(payload.date || new Date().toISOString().slice(0, 10)),
    owner_fingerprint: payload.owner_fingerprint ? String(payload.owner_fingerprint) : undefined,
  };
}

export const onRequestOptions = () => handleOptions();

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  if (!hasContributionsKv(env)) {
    return serviceUnavailable('Binding Cloudflare KV CONTRIBUTIONS_KV manquant');
  }
  const items = await loadCollection<SurveyRecord>(env, STORAGE_KEY);
  return jsonResponse(items);
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!hasContributionsKv(env)) {
    return serviceUnavailable('Binding Cloudflare KV CONTRIBUTIONS_KV manquant');
  }
  const payload = await readJsonBody<Partial<SurveyRecord>>(request);
  const survey = normalizeSurvey(payload);
  if (!survey) {
    return badRequest('Questionnaire invalide');
  }

  const items = await loadCollection<SurveyRecord>(env, STORAGE_KEY);
  const next = upsertById(items, survey, String(survey.id));
  await saveCollection(env, STORAGE_KEY, next);
  return jsonResponse(survey, 201);
};

export const onRequest = () => methodNotAllowed(['GET', 'POST', 'OPTIONS']);