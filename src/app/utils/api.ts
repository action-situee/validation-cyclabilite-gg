import type { CommentaireGeneral, ObservationLibre, SurveyResponse } from '../types';

const API_BASE = import.meta.env.VITE_CONTRIBUTIONS_API_BASE || '/api';
let warnedMissingApiBase = false;

async function request<T>(path: string, init?: RequestInit): Promise<T | null> {
  if (!API_BASE) {
    if (!warnedMissingApiBase) {
      warnedMissingApiBase = true;
      console.warn(
        '[contributionsApi] Aucun endpoint configure. Les contributions Cloudflare sont indisponibles tant que VITE_CONTRIBUTIONS_API_BASE n\'est pas defini.',
      );
    }
    return null;
  }

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...init,
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export const contributionsApi = {
  async getObservations(): Promise<ObservationLibre[] | null> {
    return request<ObservationLibre[]>('/observations');
  },

  async getSurveys(): Promise<SurveyResponse[] | null> {
    return request<SurveyResponse[]>('/surveys');
  },

  async createObservation(observation: ObservationLibre): Promise<ObservationLibre | null> {
    return request<ObservationLibre>('/observations', {
      method: 'POST',
      body: JSON.stringify(observation),
    });
  },

  async updateObservation(observation: ObservationLibre): Promise<ObservationLibre | null> {
    return request<ObservationLibre>(`/observations/${observation.id}`, {
      method: 'PUT',
      body: JSON.stringify(observation),
    });
  },

  async deleteObservation(id: string): Promise<boolean> {
    const result = await request<{ ok: boolean }>(`/observations/${id}`, {
      method: 'DELETE',
    });
    return Boolean(result?.ok);
  },

  async getCommentaires(): Promise<CommentaireGeneral[] | null> {
    return request<CommentaireGeneral[]>('/commentaires');
  },

  async createCommentaire(commentaire: CommentaireGeneral): Promise<CommentaireGeneral | null> {
    return request<CommentaireGeneral>('/commentaires', {
      method: 'POST',
      body: JSON.stringify(commentaire),
    });
  },

  async updateCommentaire(commentaire: CommentaireGeneral): Promise<CommentaireGeneral | null> {
    return request<CommentaireGeneral>(`/commentaires/${commentaire.id}`, {
      method: 'PUT',
      body: JSON.stringify(commentaire),
    });
  },

  async deleteCommentaire(id: string): Promise<boolean> {
    const result = await request<{ ok: boolean }>(`/commentaires/${id}`, {
      method: 'DELETE',
    });
    return Boolean(result?.ok);
  },

  async createSurvey(payload: SurveyResponse): Promise<SurveyResponse | null> {
    return request<SurveyResponse>('/surveys', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
