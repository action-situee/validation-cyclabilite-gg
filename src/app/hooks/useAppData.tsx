import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { Cible, Faisceau, ObservationLibre, CommentaireGeneral } from '../types';
import { FAISCEAUX as MOCK_FAISCEAUX } from '../mock-data/faisceaux';
import { storageService } from '../utils/storage';
import { resolveFingerprint } from '../utils/fingerprint';
import {
  loadCommentairesFromSheet,
  loadCorridors,
  loadObservationsFromSheet,
} from '../utils/data-loader';
import { contributionsApi } from '../utils/api';

interface AppDataContextType {
  cibles: Cible[];
  faisceaux: Faisceau[];
  observations: ObservationLibre[];
  commentaires: CommentaireGeneral[];
  addObservation: (obs: ObservationLibre) => string;
  addObservationComment: (observationId: string, texte: string) => void;
  deleteObservation: (id: string) => void;
  voteObservation: (id: string, direction: 'up' | 'down', voterId: string) => void;
  addCommentaire: (com: CommentaireGeneral) => string;
  updateCommentaire: (com: CommentaireGeneral) => void;
  deleteCommentaire: (id: string) => void;
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
  const [faisceaux, setFaisceaux] = useState<Faisceau[]>(MOCK_FAISCEAUX);
  const [observations, setObservations] = useState<ObservationLibre[]>([]);
  const [commentaires, setCommentaires] = useState<CommentaireGeneral[]>([]);
  const [fingerprintReady, setFingerprintReady] = useState(false);

  // Resolve fingerprint (IP-based) on mount
  useEffect(() => {
    resolveFingerprint().then(() => {
      setFingerprintReady(true);
    });
  }, []);

  // Load corridors
  useEffect(() => {
    loadCorridors().then((ext) => {
      if (ext && ext.length > 0) setFaisceaux(ext);
    });
  }, []);

  useEffect(() => {
    Promise.all([loadObservationsFromSheet(), loadCommentairesFromSheet()]).then(([remoteObservations, remoteCommentaires]) => {
      setObservations(
        mergeById(remoteObservations || [], storageService.getAllObservations()),
      );
      setCommentaires(
        mergeById(remoteCommentaires || [], storageService.getAllCommentaires()),
      );
    });
  }, []);

  const addObservation = useCallback((obs: ObservationLibre): string => {
    const saved = storageService.saveObservation(obs);
    setObservations((prev) => [...prev, saved]);
    void contributionsApi.createObservation(saved);
    return saved.id;
  }, []);

  const addObservationComment = useCallback((observationId: string, texte: string) => {
    const now = new Date();
    setObservations((prev) => prev.map((observation) => {
      if (observation.id !== observationId) return observation;

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
          },
        ],
      };

      storageService.updateObservation(updated);
      void contributionsApi.updateObservation(updated);
      return updated;
    }));
  }, []);

  const deleteObservation = useCallback((id: string) => {
    storageService.deleteObservation(id);
    setObservations((prev) => prev.filter((o) => o.id !== id));
    void contributionsApi.deleteObservation(id);
  }, []);

  const voteObservation = useCallback((id: string, direction: 'up' | 'down', voterId: string) => {
    setObservations((prev) => {
      const obs = prev.find((o) => o.id === id);
      if (!obs || obs.votedBy.includes(voterId)) return prev;
      const updated: ObservationLibre = {
        ...obs,
        upvotes: direction === 'up' ? obs.upvotes + 1 : obs.upvotes,
        downvotes: direction === 'down' ? obs.downvotes + 1 : obs.downvotes,
        votedBy: [...obs.votedBy, voterId],
      };
      storageService.updateObservation(updated);
      void contributionsApi.updateObservation(updated);
      return prev.map((o) => (o.id === id ? updated : o));
    });
  }, []);

  const addCommentaire = useCallback((com: CommentaireGeneral): string => {
    const saved = storageService.saveCommentaire(com);
    setCommentaires((prev) => [...prev, saved]);
    void contributionsApi.createCommentaire(saved);
    return saved.id;
  }, []);

  const updateCommentaire = useCallback((com: CommentaireGeneral) => {
    storageService.updateCommentaire(com);
    setCommentaires((prev) => prev.map((item) => (item.id === com.id ? com : item)));
  }, []);

  const deleteCommentaire = useCallback((id: string) => {
    storageService.deleteCommentaire(id);
    setCommentaires((prev) => prev.filter((c) => c.id !== id));
    void contributionsApi.deleteCommentaire(id);
  }, []);

  const getObservationsForCible = useCallback((cibleId: string) => {
    return observations.filter((o) => o.cible_id === cibleId);
  }, [observations]);

  const isOwnObservation = useCallback((id: string) => {
    return storageService.isOwnObservation(id);
  }, [fingerprintReady]);

  const isOwnCommentaire = useCallback((id: string) => {
    return storageService.isOwnCommentaire(id);
  }, [fingerprintReady]);

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
      addObservation: (() => '') as (obs: ObservationLibre) => string,
      addObservationComment: (() => {}) as (observationId: string, texte: string) => void,
      deleteObservation: (() => {}) as (id: string) => void,
      voteObservation: (() => {}) as (id: string, direction: 'up' | 'down', voterId: string) => void,
      addCommentaire: (() => '') as (com: CommentaireGeneral) => string,
      updateCommentaire: (() => {}) as (com: CommentaireGeneral) => void,
      deleteCommentaire: (() => {}) as (id: string) => void,
      getObservationsForCible: (() => []) as (cibleId: string) => ObservationLibre[],
      isOwnObservation: (() => false) as (id: string) => boolean,
      isOwnCommentaire: (() => false) as (id: string) => boolean,
      fingerprintReady: false,
      cibleFaisceauMap: new Map<string, string>(),
    } satisfies AppDataContextType;
  }
  return ctx;
}
