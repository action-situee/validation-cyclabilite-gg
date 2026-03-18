import React, { useMemo, useState } from 'react';
import {
  X,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  User,
  Building2,
  Trash2,
  Image as ImageIcon,
  Send,
} from 'lucide-react';
import type { ObservationLibre } from '../types';
import { Button } from './ui/Button';
import { INDICE_LABELS, OBS_LABELS } from '../config/palette';

interface ObservationThreadProps {
  observation: ObservationLibre;
  onClose: () => void;
  onVote: (obsId: string, direction: 'up' | 'down') => void;
  onDelete: (obsId: string) => void;
  onAddComment: (observationId: string, texte: string) => void;
  isOwn: (obsId: string) => boolean;
}

function formatTimestamp(observation: { date: string; heure?: string }) {
  return observation.heure ? `${observation.date} · ${observation.heure}` : observation.date;
}

export function ObservationThread({
  observation,
  onClose,
  onVote,
  onDelete,
  onAddComment,
  isOwn,
}: ObservationThreadProps) {
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const mine = isOwn(observation.id);
  const score = observation.upvotes - observation.downvotes;
  const observationComments = useMemo(
    () => [...(observation.commentaires || [])].reverse(),
    [observation.commentaires],
  );

  return (
    <>
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-white border-2 border-[#0a0a0a] w-full max-w-xl shadow-[6px_6px_0_rgba(0,0,0,0.15)] max-h-[90vh] flex flex-col">
          <div className="p-4 border-b-2 border-[#0a0a0a] shrink-0">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#f72585]" />
                <h2 className="text-[11px] uppercase tracking-[0.15em]">Remontee terrain</h2>
              </div>
              <button onClick={onClose} className="p-1 border-2 border-transparent hover:border-[#0a0a0a] transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="border-2 border-[#e0e0dc] p-3 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] uppercase tracking-[0.12em] text-[#f72585]">
                  {OBS_LABELS[observation.categorie] || observation.categorie}
                </span>
                {observation.type_autre && (
                  <span className="text-[9px] uppercase tracking-[0.12em] px-2 py-0.5 border border-[#0a0a0a]">
                    {observation.type_autre}
                  </span>
                )}
                {observation.indice_juge && (
                  <span className="text-[9px] uppercase tracking-[0.12em] px-2 py-0.5 border border-[#2E6A4A] bg-[#D3E4D7] text-[#2E6A4A]">
                    {INDICE_LABELS[observation.indice_juge]}
                  </span>
                )}
                {mine && (
                  <span className="text-[8px] bg-[#2E6A4A] text-[#D3E4D7] px-1.5 py-0.5 uppercase tracking-wider">
                    Moi
                  </span>
                )}
              </div>

              {observation.classes_concernees && observation.classes_concernees.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {observation.classes_concernees.map((classe) => (
                    <span
                      key={classe}
                      className="text-[9px] uppercase tracking-wider bg-[#f0f0ec] text-[#5c5c5c] px-2 py-0.5 border border-[#d8d2ca]"
                    >
                      {classe}
                    </span>
                  ))}
                </div>
              )}

              <p className="text-[13px] text-[#0a0a0a] leading-relaxed">{observation.commentaire}</p>

              {observation.photos && observation.photos.length > 0 && (
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {observation.photos.map((photo, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setLightboxPhoto(photo)}
                      className="shrink-0 w-16 h-16 overflow-hidden border-2 border-[#e0e0dc] hover:border-[#f72585] transition-all"
                    >
                      <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#e0e0dc]">
                <div className="flex flex-wrap items-center gap-2 text-[10px] text-[#999] min-w-0">
                  <User className="w-3 h-3 shrink-0" />
                  <span className="font-mono">{observation.auteur}</span>
                  {observation.organisation && (
                    <>
                      <Building2 className="w-3 h-3 text-[#ccc] shrink-0" />
                      <span className="font-mono">{observation.organisation}</span>
                    </>
                  )}
                  {observation.photos && observation.photos.length > 0 && (
                    <span className="flex items-center gap-1 font-mono">
                      <ImageIcon className="w-3 h-3" />
                      {observation.photos.length}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-[#999] font-mono">{formatTimestamp(observation)}</span>
                  {mine && (
                    <button
                      onClick={() => onDelete(observation.id)}
                      className="p-1 hover:bg-red-50 transition-colors"
                      title="Supprimer ma remontée"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  )}
                  <button
                    onClick={() => onVote(observation.id, 'up')}
                    className="p-1 hover:bg-[#D3E4D7] transition-colors"
                    title="Pouce vers le haut"
                  >
                    <ThumbsUp className="w-3.5 h-3.5 text-[#2E6A4A]" />
                  </button>
                  <span className={`text-[10px] min-w-[20px] text-center font-mono ${score > 0 ? 'text-[#2E6A4A]' : score < 0 ? 'text-red-600' : 'text-[#999]'}`}>
                    {score > 0 ? `+${score}` : score}
                  </span>
                  <button
                    onClick={() => onVote(observation.id, 'down')}
                    className="p-1 hover:bg-red-50 transition-colors"
                    title="Pouce vers le bas"
                  >
                    <ThumbsDown className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div>
              <h3 className="text-[10px] uppercase tracking-[0.12em] text-[#5c5c5c] mb-2">
                Commentaires sur cette remontée
              </h3>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!newComment.trim()) return;
                  onAddComment(observation.id, newComment.trim());
                  setNewComment('');
                }}
                className="space-y-2 mb-4"
              >
                <textarea
                  value={newComment}
                  onChange={(event) => setNewComment(event.target.value)}
                  placeholder="Ajouter un commentaire sur cette remontée..."
                  className="w-full px-3 py-2 border-2 border-[#0a0a0a] bg-white text-[12px] resize-none focus:outline-none focus:border-[#f72585] transition-colors"
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button variant="primary" size="sm" type="submit" disabled={!newComment.trim()}>
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </form>

              <div className="space-y-2">
                {observationComments.length === 0 && (
                  <div className="text-center py-6 border-2 border-dashed border-[#e0e0dc]">
                    <MessageCircle className="w-5 h-5 text-[#ccc] mx-auto mb-2" />
                    <p className="text-[11px] text-[#999]">Aucun commentaire pour l’instant</p>
                  </div>
                )}

                {observationComments.map((commentaire) => (
                  <div key={commentaire.id} className="border-2 border-[#e0e0dc] p-3">
                    <p className="text-[12px] text-[#0a0a0a] leading-relaxed mb-1.5">{commentaire.texte}</p>
                    <div className="flex items-center justify-between gap-2 text-[10px] text-[#999] font-mono">
                      <span>{commentaire.auteur || 'Anonyme'}</span>
                      <span>{formatTimestamp(commentaire)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 border-2 border-white/40 flex items-center justify-center hover:bg-white/10 transition-colors z-10"
            onClick={() => setLightboxPhoto(null)}
            aria-label="Fermer"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <img
            src={lightboxPhoto}
            alt="Photo en grand"
            className="max-w-full max-h-full object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
