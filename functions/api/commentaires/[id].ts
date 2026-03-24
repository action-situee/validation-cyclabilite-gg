import { badRequest, handleOptions, jsonResponse, methodNotAllowed, notFound, readJsonBody, serviceUnavailable } from '../_shared/http';
import { hasContributionsKv, loadCollection, removeById, saveCollection, upsertById } from '../_shared/store';
import type { CommentaireRecord } from '../_shared/types';

type Env = {
  CONTRIBUTIONS_KV?: {
    get(key: string, type: 'json'): Promise<unknown | null>;
    put(key: string, value: string): Promise<void>;
  };
};

const STORAGE_KEY = 'commentaires';

function normalizeCommentaire(id: string, payload: Partial<CommentaireRecord> | null): CommentaireRecord | null {
  if (!payload) return null;
  if (!String(payload.texte || '').trim()) return null;

  return {
    id,
    auteur: String(payload.auteur || 'Anonyme'),
    texte: String(payload.texte || ''),
    date: String(payload.date || new Date().toISOString().slice(0, 10)),
    heure: payload.heure ? String(payload.heure) : undefined,
    faisceau_id: payload.faisceau_id ? String(payload.faisceau_id) : undefined,
    owner_fingerprint: payload.owner_fingerprint ? String(payload.owner_fingerprint) : undefined,
  };
}

export const onRequestOptions = () => handleOptions();

export const onRequestPut: PagesFunction<Env> = async ({ params, request, env }) => {
  if (!hasContributionsKv(env)) {
    return serviceUnavailable('Binding Cloudflare KV CONTRIBUTIONS_KV manquant');
  }

  const id = String(params.id || '').trim();
  if (!id) return badRequest('Identifiant manquant');

  const payload = await readJsonBody<Partial<CommentaireRecord>>(request);
  const commentaire = normalizeCommentaire(id, payload);
  if (!commentaire) {
    return badRequest('Commentaire invalide');
  }

  const items = await loadCollection<CommentaireRecord>(env, STORAGE_KEY);
  const next = upsertById(items, commentaire, id);
  await saveCollection(env, STORAGE_KEY, next);
  return jsonResponse(commentaire);
};

export const onRequestDelete: PagesFunction<Env> = async ({ params, env }) => {
  if (!hasContributionsKv(env)) {
    return serviceUnavailable('Binding Cloudflare KV CONTRIBUTIONS_KV manquant');
  }
  const id = String(params.id || '').trim();
  if (!id) return badRequest('Identifiant manquant');

  const items = await loadCollection<CommentaireRecord>(env, STORAGE_KEY);
  const exists = items.some((item) => item.id === id);
  if (!exists) return notFound('Commentaire introuvable');

  await saveCollection(env, STORAGE_KEY, removeById(items, id));
  return jsonResponse({ ok: true });
};

export const onRequest = () => methodNotAllowed(['PUT', 'DELETE', 'OPTIONS']);