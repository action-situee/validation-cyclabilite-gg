import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { Cible, Faisceau, ObservationLibre, CommentaireGeneral } from '../types';
import { FAISCEAUX as DEFAULT_FAISCEAUX } from '../mock-data/faisceaux';
import { getFingerprint, resolveFingerprint } from '../utils/fingerprint';
import { loadFaisceaux } from '../utils/data-loader';
import { contributionsApi } from '../utils/api';

interface AppDataContextType {
  cibles: Cible[];
  faisceaux: Faisceau[];
  observations: ObservationLibre[];
  commentaires: CommentaireGeneral[];
  addObservation: (obs: ObservationLibre) => Promise<string>;
  addObservationComment: (observationId: string, texte: string) => Promise<void>;
  deleteObservation: (id: string) => Promise<void>;
  voteObservation: (id: string, direction: 'up' | 'down', voterId: string) => Promise<void>;
  addCommentaire: (com: CommentaireGeneral) => Promise<string>;
  updateCommentaire: (com: CommentaireGeneral) => Promise<void>;
  deleteCommentaire: (id: string) => Promise<void>;
  getObservationsForCible: (cibleId: string) => ObservationLibre[];
  isOwnObservation: (id: string) => boolean;
  isOwnCommentaire: (id: string) => boolean;
  fingerprintReady: boolean;
  cibleFaisceauMap: Map<string, string>;
}

const AppDataContext = createContext<AppDataContextType | null>(null);

function mergeById<T extends { id: string }>(base: T[], local: T[]) {
  const map = new Map<string, T>();
  base.forEach((item) => map.set(item.id, item));
  local.forEach((item) => map.set(item.id, item));
  return [...map.values()];
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [cibles] = useState<Cible[]>([]);
  const [faisceaux, setFaisceaux] = useState<Faisceau[]>(DEFAULT_FAISCEAUX);
  const [observations, setObservations] = useState<ObservationLibre[]>([]);
  const [commentaires, setCommentaires] = useState<CommentaireGeneral[]>([]);
  const [fingerprintReady, setFingerprintReady] = useState(false);

  // Resolve fingerprint (IP-based) on mount
  useEffect(() => {
    resolveFingerprint().then(() => {
      setFingerprintReady(true);
    });
  }, []);

  // Load faisceaux (délimitations)
  useEffect(() => {
    loadFaisceaux().then((ext) => {
      if (ext && ext.length > 0) setFaisceaux(ext);
    });
  }, []);

  useEffect(() => {
    Promise.all([
      contributionsApi.getObservations(),
      contributionsApi.getCommentaires(),
    ]).then(([
      apiObservations,
      apiCommentaires,
    ]) => {
      setObservations(apiObservations || []);
      setCommentaires(apiCommentaires || []);
    });
  }, []);

  const addObservation = useCallback(async (obs: ObservationLibre): Promise<string> => {
    const now = new Date();
    const payload: ObservationLibre = {
      ...obs,
      id: obs.id || `OBS_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      date: obs.date || now.toISOString().slice(0, 10),
      heure: obs.heure || now.toTimeString().slice(0, 8),
      upvotes: obs.upvotes ?? 0,
      downvotes: obs.downvotes ?? 0,
      votedBy: obs.votedBy ?? [],
      commentaires: obs.commentaires ?? [],
      owner_fingerprint: obs.owner_fingerprint || getFingerprint(),
    };

    const saved = await contributionsApi.createObservation(payload);
    if (!saved) return '';

    setObservations((prev) => mergeById(prev, [saved]));
    return saved.id;
  }, []);

  const addObservationComment = useCallback(async (observationId: string, texte: string) => {
    const now = new Date();
    const observation = observations.find((item) => item.id === observationId);
    if (!observation) return;

    const updated: ObservationLibre = {
      ...observation,
      commentaires: [
        ...(observation.commentaires || []),
        {
          id: `OBS_COM_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          texte,
          auteur: 'Anonyme',
          date: now.toISOString().slice(0, 10),
          heure: now.toTimeString().slice(0, 8),
          owner_fingerprint: getFingerprint(),
        },
      ],
    };

    const saved = await contributionsApi.updateObservation(updated);
    if (!saved) return;

    setObservations((prev) => prev.map((item) => (item.id === saved.id ? saved : item)));
  }, [observations]);

  const deleteObservation = useCallback(async (id: string) => {
    const deleted = await contributionsApi.deleteObservation(id);
    if (!deleted) return;

    setObservations((prev) => prev.filter((o) => o.id !== id));
  }, []);

  const voteObservation = useCallback(async (id: string, direction: 'up' | 'down', voterId: string) => {
    const observation = observations.find((item) => item.id === id);
    if (!observation || observation.votedBy.includes(voterId)) return;

    const updated: ObservationLibre = {
      ...observation,
      upvotes: direction === 'up' ? observation.upvotes + 1 : observation.upvotes,
      downvotes: direction === 'down' ? observation.downvotes + 1 : observation.downvotes,
      votedBy: [...observation.votedBy, voterId],
    };

    const saved = await contributionsApi.updateObservation(updated);
    if (!saved) return;

    setObservations((prev) => prev.map((item) => (item.id === saved.id ? saved : item)));
  }, [observations]);

  const addCommentaire = useCallback(async (com: CommentaireGeneral): Promise<string> => {
    const now = new Date();
    const payload: CommentaireGeneral = {
      ...com,
      id: com.id || `COM_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      auteur: com.auteur || 'Anonyme',
      date: com.date || now.toISOString().slice(0, 10),
      heure: com.heure || now.toTimeString().slice(0, 8),
      owner_fingerprint: com.owner_fingerprint || getFingerprint(),
    };

    const saved = await contributionsApi.createCommentaire(payload);
    if (!saved) return '';

    setCommentaires((prev) => mergeById(prev, [saved]));
    return saved.id;
  }, []);

  const updateCommentaire = useCallback(async (com: CommentaireGeneral) => {
    const saved = await contributionsApi.updateCommentaire(com);
    if (!saved) return;

    setCommentaires((prev) => prev.map((item) => (item.id === saved.id ? saved : item)));
  }, []);

  const deleteCommentaire = useCallback(async (id: string) => {
    const deleted = await contributionsApi.deleteCommentaire(id);
    if (!deleted) return;

    setCommentaires((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const getObservationsForCible = useCallback((cibleId: string) => {
    return observations.filter((o) => o.cible_id === cibleId);
  }, [observations]);

  const isOwnObservation = useCallback((id: string) => {
    const fingerprint = getFingerprint();
    return observations.some((item) => item.id === id && item.owner_fingerprint === fingerprint);
  }, [observations, fingerprintReady]);

  const isOwnCommentaire = useCallback((id: string) => {
    const fingerprint = getFingerprint();
    return commentaires.some((item) => item.id === id && item.owner_fingerprint === fingerprint);
  }, [commentaires, fingerprintReady]);

  /** Map cible_id → faisceau_id for O(1) lookups in filters */
  const cibleFaisceauMap = useMemo(() => {
    const map = new Map<string, string>();
    cibles.forEach((c) => map.set(c.cible_id, c.faisceau_id));
    return map;
  }, [cibles]);

  return (
    <AppDataContext.Provider
      value={{
        cibles,
        faisceaux,
        observations,
        commentaires,
        addObservation,
        addObservationComment,
        deleteObservation,
        voteObservation,
        addCommentaire,
        updateCommentaire,
        deleteCommentaire,
        getObservationsForCible,
        isOwnObservation,
        isOwnCommentaire,
        fingerprintReady,
        cibleFaisceauMap,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) {
    // During HMR / React Fast Refresh the provider may temporarily be absent.
    // Return a safe stub so the tree doesn't crash – it will re-mount correctly.
    return {
      cibles: [] as Cible[],
      faisceaux: [] as Faisceau[],
      observations: [] as ObservationLibre[],
      commentaires: [] as CommentaireGeneral[],
      addObservation: (async () => '') as (obs: ObservationLibre) => Promise<string>,
      addObservationComment: (async () => {}) as (observationId: string, texte: string) => Promise<void>,
      deleteObservation: (async () => {}) as (id: string) => Promise<void>,
      voteObservation: (async () => {}) as (id: string, direction: 'up' | 'down', voterId: string) => Promise<void>,
      addCommentaire: (async () => '') as (com: CommentaireGeneral) => Promise<string>,
      updateCommentaire: (async () => {}) as (com: CommentaireGeneral) => Promise<void>,
      deleteCommentaire: (async () => {}) as (id: string) => Promise<void>,
      getObservationsForCible: (() => []) as (cibleId: string) => ObservationLibre[],
      isOwnObservation: (() => false) as (id: string) => boolean,
      isOwnCommentaire: (() => false) as (id: string) => boolean,
      fingerprintReady: false,
      cibleFaisceauMap: new Map<string, string>(),
    } satisfies AppDataContextType;
  }
  return ctx;
}
