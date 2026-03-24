import { badRequest, handleOptions, jsonResponse, methodNotAllowed, readJsonBody, serviceUnavailable } from '../_shared/http';
import { createId, hasContributionsDb, listSurveys, saveSurvey } from '../_shared/d1';
import type { SurveyRecord } from '../_shared/types';

type Env = {
  CONTRIBUTIONS_DB?: {
    prepare(query: string): unknown;
    batch(statements: unknown[]): Promise<unknown[]>;
  };
};

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
  if (!hasContributionsDb(env)) {
    return serviceUnavailable('Binding Cloudflare D1 CONTRIBUTIONS_DB manquant');
  }
  const items = await listSurveys(env);
  return jsonResponse(items);
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!hasContributionsDb(env)) {
    return serviceUnavailable('Binding Cloudflare D1 CONTRIBUTIONS_DB manquant');
  }
  const payload = await readJsonBody<Partial<SurveyRecord>>(request);
  const survey = normalizeSurvey(payload);
  if (!survey) {
    return badRequest('Questionnaire invalide');
  }

  await saveSurvey(env, survey);
  return jsonResponse(survey, 201);
};

export const onRequest = () => methodNotAllowed(['GET', 'POST', 'OPTIONS']);