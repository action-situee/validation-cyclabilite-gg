import { badRequest, handleOptions, jsonResponse, methodNotAllowed, readJsonBody, serviceUnavailable } from '../_shared/http';
import { createId, hasContributionsKv, loadCollection, saveCollection, upsertById } from '../_shared/store';
import type { CommentaireRecord } from '../_shared/types';

type Env = {
  CONTRIBUTIONS_KV?: {
    get(key: string, type: 'json'): Promise<unknown | null>;
    put(key: string, value: string): Promise<void>;
  };
};

const STORAGE_KEY = 'commentaires';

function normalizeCommentaire(payload: Partial<CommentaireRecord> | null): CommentaireRecord | null {
  if (!payload) return null;
  if (!String(payload.texte || '').trim()) return null;

  return {
    id: String(payload.id || createId('com')),
    auteur: String(payload.auteur || 'Anonyme'),
    texte: String(payload.texte || ''),
    date: String(payload.date || new Date().toISOString().slice(0, 10)),
    heure: payload.heure ? String(payload.heure) : undefined,
    faisceau_id: payload.faisceau_id ? String(payload.faisceau_id) : undefined,
    owner_fingerprint: payload.owner_fingerprint ? String(payload.owner_fingerprint) : undefined,
  };
}

export const onRequestOptions = () => handleOptions();

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  if (!hasContributionsKv(env)) {
    return serviceUnavailable('Binding Cloudflare KV CONTRIBUTIONS_KV manquant');
  }
  const items = await loadCollection<CommentaireRecord>(env, STORAGE_KEY);
  return jsonResponse(items);
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!hasContributionsKv(env)) {
    return serviceUnavailable('Binding Cloudflare KV CONTRIBUTIONS_KV manquant');
  }
  const payload = await readJsonBody<Partial<CommentaireRecord>>(request);
  const commentaire = normalizeCommentaire(payload);
  if (!commentaire) {
    return badRequest('Commentaire invalide');
  }

  const items = await loadCollection<CommentaireRecord>(env, STORAGE_KEY);
  const next = upsertById(items, commentaire, commentaire.id);
  await saveCollection(env, STORAGE_KEY, next);
  return jsonResponse(commentaire, 201);
};

export const onRequest = () => methodNotAllowed(['GET', 'POST', 'OPTIONS']);