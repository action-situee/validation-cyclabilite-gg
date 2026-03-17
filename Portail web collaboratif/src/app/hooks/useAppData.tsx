import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { Cible, Faisceau, ObservationLibre, CommentaireGeneral } from '../types';
import { FAISCEAUX as MOCK_FAISCEAUX } from '../mock-data/faisceaux';
import { mockCibles } from '../mock-data/cibles';
import { storageService } from '../utils/storage';
import { resolveFingerprint } from '../utils/fingerprint';
import { loadCibles, loadCorridors } from '../utils/data-loader';

interface AppDataContextType {
  cibles: Cible[];
  faisceaux: Faisceau[];
  observations: ObservationLibre[];
  commentaires: CommentaireGeneral[];
  addObservation: (obs: ObservationLibre) => string;
  deleteObservation: (id: string) => void;
  voteObservation: (id: string, direction: 'up' | 'down', voterId: string) => void;
  addCommentaire: (com: CommentaireGeneral) => string;
  deleteCommentaire: (id: string) => void;
  getObservationsForCible: (cibleId: string) => ObservationLibre[];
  isOwnObservation: (id: string) => boolean;
  isOwnCommentaire: (id: string) => boolean;
  fingerprintReady: boolean;
  cibleFaisceauMap: Map<string, string>;
}

const AppDataContext = createContext<AppDataContextType | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [cibles, setCibles] = useState<Cible[]>(mockCibles);
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

  // Load external data (GeoJSON / Sheets) – falls back to mock
  useEffect(() => {
    loadCorridors().then((ext) => {
      if (ext && ext.length > 0) setFaisceaux(ext);
    });
    loadCibles().then((ext) => {
      if (ext && ext.length > 0) setCibles(ext);
    });
  }, []);

  useEffect(() => {
    setObservations(storageService.getAllObservations());
    setCommentaires(storageService.getAllCommentaires());
  }, []);

  const addObservation = useCallback((obs: ObservationLibre): string => {
    const saved = storageService.saveObservation(obs);
    setObservations((prev) => [...prev, saved]);
    return saved.id;
  }, []);

  const deleteObservation = useCallback((id: string) => {
    storageService.deleteObservation(id);
    setObservations((prev) => prev.filter((o) => o.id !== id));
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
      return prev.map((o) => (o.id === id ? updated : o));
    });
  }, []);

  const addCommentaire = useCallback((com: CommentaireGeneral): string => {
    const saved = storageService.saveCommentaire(com);
    setCommentaires((prev) => [...prev, saved]);
    return saved.id;
  }, []);

  const deleteCommentaire = useCallback((id: string) => {
    storageService.deleteCommentaire(id);
    setCommentaires((prev) => prev.filter((c) => c.id !== id));
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
        deleteObservation,
        voteObservation,
        addCommentaire,
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
      deleteObservation: (() => {}) as (id: string) => void,
      voteObservation: (() => {}) as (id: string, direction: 'up' | 'down', voterId: string) => void,
      addCommentaire: (() => '') as (com: CommentaireGeneral) => string,
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