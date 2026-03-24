import { badRequest, handleOptions, jsonResponse, methodNotAllowed, notFound, readJsonBody, serviceUnavailable } from '../_shared/http';
import { deleteCommentaireById, getCommentaireById, hasContributionsDb, saveCommentaire } from '../_shared/d1';
import type { CommentaireRecord } from '../_shared/types';

type Env = {
  CONTRIBUTIONS_DB?: {
    prepare(query: string): unknown;
    batch(statements: unknown[]): Promise<unknown[]>;
  };
};

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
  if (!hasContributionsDb(env)) {
    return serviceUnavailable('Binding Cloudflare D1 CONTRIBUTIONS_DB manquant');
  }

  const id = String(params.id || '').trim();
  if (!id) return badRequest('Identifiant manquant');

  const payload = await readJsonBody<Partial<CommentaireRecord>>(request);
  const commentaire = normalizeCommentaire(id, payload);
  if (!commentaire) {
    return badRequest('Commentaire invalide');
  }

  await saveCommentaire(env, commentaire);
  return jsonResponse(commentaire);
};

export const onRequestDelete: PagesFunction<Env> = async ({ params, env }) => {
  if (!hasContributionsDb(env)) {
    return serviceUnavailable('Binding Cloudflare D1 CONTRIBUTIONS_DB manquant');
  }
  const id = String(params.id || '').trim();
  if (!id) return badRequest('Identifiant manquant');

  const exists = await getCommentaireById(env, id);
  if (!exists) return notFound('Commentaire introuvable');

  await deleteCommentaireById(env, id);
  return jsonResponse({ ok: true });
};

export const onRequest = () => methodNotAllowed(['PUT', 'DELETE', 'OPTIONS']);