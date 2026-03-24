import { badRequest, handleOptions, jsonResponse, methodNotAllowed, readJsonBody, serviceUnavailable } from '../_shared/http';
import { createId, hasContributionsDb, listCommentaires, saveCommentaire } from '../_shared/d1';
import type { CommentaireRecord } from '../_shared/types';

type Env = {
  CONTRIBUTIONS_DB?: {
    prepare(query: string): unknown;
    batch(statements: unknown[]): Promise<unknown[]>;
  };
};

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
  if (!hasContributionsDb(env)) {
    return serviceUnavailable('Binding Cloudflare D1 CONTRIBUTIONS_DB manquant');
  }
  const items = await listCommentaires(env);
  return jsonResponse(items);
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!hasContributionsDb(env)) {
    return serviceUnavailable('Binding Cloudflare D1 CONTRIBUTIONS_DB manquant');
  }
  const payload = await readJsonBody<Partial<CommentaireRecord>>(request);
  const commentaire = normalizeCommentaire(payload);
  if (!commentaire) {
    return badRequest('Commentaire invalide');
  }

  await saveCommentaire(env, commentaire);
  return jsonResponse(commentaire, 201);
};

export const onRequest = () => methodNotAllowed(['GET', 'POST', 'OPTIONS']);