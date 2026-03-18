import { ObservationLibre, CommentaireGeneral } from '../types';
import { getFingerprint } from './fingerprint';

const OBS_KEY = 'cyclabilite_observations';
const COM_KEY = 'cyclabilite_commentaires';
// Legacy keys kept for backward compatibility migration
const OWN_OBS_KEY = 'cyclabilite_my_observations';
const OWN_COM_KEY = 'cyclabilite_my_commentaires';

export const storageService = {
  // --- Ownership: fingerprint-based + legacy localStorage fallback ---

  /**
   * Vérifie si l'observation appartient à l'utilisateur courant.
   * Priorité : fingerprint IP > legacy localStorage registry.
   */
  isOwnObservation(id: string): boolean {
    const fp = getFingerprint();

    // Check fingerprint match on the observation itself
    const obs = this.getAllObservations().find((o) => o.id === id);
    if (obs?.owner_fingerprint) {
      return obs.owner_fingerprint === fp;
    }

    // Fallback: legacy localStorage registry (old contributions sans fingerprint)
    return this._getLegacyOwnedObsIds().has(id);
  },

  isOwnCommentaire(id: string): boolean {
    const fp = getFingerprint();

    const com = this.getAllCommentaires().find((c) => c.id === id);
    if (com?.owner_fingerprint) {
      return com.owner_fingerprint === fp;
    }

    return this._getLegacyOwnedComIds().has(id);
  },

  // Legacy helpers (read-only, kept for backward compat)
  _getLegacyOwnedObsIds(): Set<string> {
    try {
      const data = localStorage.getItem(OWN_OBS_KEY);
      return new Set(data ? JSON.parse(data) : []);
    } catch {
      return new Set();
    }
  },

  _getLegacyOwnedComIds(): Set<string> {
    try {
      const data = localStorage.getItem(OWN_COM_KEY);
      return new Set(data ? JSON.parse(data) : []);
    } catch {
      return new Set();
    }
  },

  _addLegacyOwnedObs(id: string): void {
    const ids = this._getLegacyOwnedObsIds();
    ids.add(id);
    localStorage.setItem(OWN_OBS_KEY, JSON.stringify([...ids]));
  },

  _removeLegacyOwnedObs(id: string): void {
    const ids = this._getLegacyOwnedObsIds();
    ids.delete(id);
    localStorage.setItem(OWN_OBS_KEY, JSON.stringify([...ids]));
  },

  _addLegacyOwnedCom(id: string): void {
    const ids = this._getLegacyOwnedComIds();
    ids.add(id);
    localStorage.setItem(OWN_COM_KEY, JSON.stringify([...ids]));
  },

  _removeLegacyOwnedCom(id: string): void {
    const ids = this._getLegacyOwnedComIds();
    ids.delete(id);
    localStorage.setItem(OWN_COM_KEY, JSON.stringify([...ids]));
  },

  // --- Observations ---
  saveObservation(obs: ObservationLibre): ObservationLibre {
    const fp = getFingerprint();
    const all = this.getAllObservations();
    const now = new Date();
    const saved: ObservationLibre = {
      ...obs,
      id: obs.id || `OBS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      date: obs.date || now.toISOString().slice(0, 10),
      heure: obs.heure || now.toTimeString().slice(0, 8),
      upvotes: obs.upvotes ?? 0,
      downvotes: obs.downvotes ?? 0,
      votedBy: obs.votedBy ?? [],
      commentaires: obs.commentaires ?? [],
      owner_fingerprint: fp,
    };
    all.push(saved);
    localStorage.setItem(OBS_KEY, JSON.stringify(all));
    // Also keep legacy registry for double safety
    this._addLegacyOwnedObs(saved.id);
    return saved;
  },

  getAllObservations(): ObservationLibre[] {
    try {
      const data = localStorage.getItem(OBS_KEY);
      const parsed = data ? JSON.parse(data) : [];
      // Migrate old observations missing new fields
      return parsed.map((o: any) => ({
        ...o,
        upvotes: o.upvotes ?? 0,
        downvotes: o.downvotes ?? 0,
        votedBy: o.votedBy ?? [],
        commentaires: Array.isArray(o.commentaires) ? o.commentaires : [],
      }));
    } catch {
      return [];
    }
  },

  replaceAllObservations(observations: ObservationLibre[]): void {
    localStorage.setItem(OBS_KEY, JSON.stringify(observations));
  },

  updateObservation(updated: ObservationLibre): void {
    const all = this.getAllObservations().map((o) =>
      o.id === updated.id ? updated : o
    );
    localStorage.setItem(OBS_KEY, JSON.stringify(all));
  },

  deleteObservation(id: string): void {
    const all = this.getAllObservations().filter((o) => o.id !== id);
    localStorage.setItem(OBS_KEY, JSON.stringify(all));
    this._removeLegacyOwnedObs(id);
  },

  // --- Commentaires généraux ---
  saveCommentaire(com: CommentaireGeneral): CommentaireGeneral {
    const fp = getFingerprint();
    const all = this.getAllCommentaires();
    const now = new Date();
    const saved = {
      ...com,
      id: com.id || `COM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      auteur: com.auteur || 'Anonyme',
      date: com.date || now.toISOString().slice(0, 10),
      heure: com.heure || now.toTimeString().slice(0, 8),
      owner_fingerprint: fp,
    };
    all.push(saved);
    localStorage.setItem(COM_KEY, JSON.stringify(all));
    this._addLegacyOwnedCom(saved.id);
    return saved;
  },

  getAllCommentaires(): CommentaireGeneral[] {
    try {
      const data = localStorage.getItem(COM_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  replaceAllCommentaires(commentaires: CommentaireGeneral[]): void {
    localStorage.setItem(COM_KEY, JSON.stringify(commentaires));
  },

  updateCommentaire(updated: CommentaireGeneral): void {
    const all = this.getAllCommentaires().map((c) =>
      c.id === updated.id ? updated : c
    );
    localStorage.setItem(COM_KEY, JSON.stringify(all));
  },

  deleteCommentaire(id: string): void {
    const all = this.getAllCommentaires().filter((c) => c.id !== id);
    localStorage.setItem(COM_KEY, JSON.stringify(all));
    this._removeLegacyOwnedCom(id);
  },
};
