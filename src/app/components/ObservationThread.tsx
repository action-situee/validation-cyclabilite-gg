import React, { useMemo, useState } from 'react';
import {
  X,
  ThumbsUp,
  ThumbsDown,
  User,
  Trash2,
  Send,
} from 'lucide-react';
import type { ObservationLibre } from '../types';
import { Button } from './ui/button';
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
  const categoryLabels = (observation.categories_concernees && observation.categories_concernees.length > 0
    ? observation.categories_concernees
    : [observation.categorie]
  ).map((category) => OBS_LABELS[category] || category);
  const indiceLabel = observation.indice_juge ? INDICE_LABELS[observation.indice_juge] : null;
  const hasDetails = Boolean(observation.type_autre);

  return (
    <>
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-white border border-[#d0d4ce] w-full max-w-xl shadow-[4px_4px_0_rgba(0,0,0,0.15)] max-h-[90vh] flex flex-col">
          <div className="p-4 border-b border-[#e0e0dc] shrink-0 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#7b2ff7]" />
                  <h2 className="text-[11px] uppercase tracking-[0.15em]">
                    Observation · <span className="font-mono normal-case tracking-normal">{observation.id}</span>
                  </h2>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1 border-2 border-transparent hover:border-[#0a0a0a] transition-all shrink-0"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0 flex-1 space-y-2 text-[10px] text-[#5c5c5c]">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-[#0a0a0a]"><User className="w-3 h-3" /></span>
                  <div className="min-w-0 space-y-1">
                    <p className="text-[#0a0a0a]">
                      <span className="font-semibold uppercase tracking-[0.12em] text-[#5c5c5c]">Nom :</span>{' '}
                      <span className="font-mono">{observation.auteur}</span>
                    </p>
                    {observation.organisation && (
                      <p className="text-[#80867f]">
                        <span className="font-semibold uppercase tracking-[0.12em]">Organisation :</span>{' '}
                        <span className="font-mono">{observation.organisation}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="font-semibold uppercase tracking-[0.12em] text-[#5c5c5c] mb-1">Objet :</p>
                  <div className="flex flex-wrap gap-1.5">
                    {categoryLabels.map((label) => (
                      <span
                        key={label}
                        className="px-1.5 py-0.5 border border-[#d8d2ca] bg-[#f7f7f3] text-[9px] uppercase tracking-[0.08em] text-[#7b2ff7]"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>

                {observation.classes_concernees && observation.classes_concernees.length > 0 && (
                  <div>
                    <p className="font-semibold uppercase tracking-[0.12em] text-[#5c5c5c] mb-1">Classe concernée :</p>
                    <div className="flex flex-wrap gap-1.5">
                      {observation.classes_concernees.map((classe) => (
                        <span
                          key={classe}
                          className="px-1.5 py-0.5 border border-[#d8d2ca] bg-[#f7f7f3] text-[9px] uppercase tracking-[0.08em]"
                        >
                          {classe}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {indiceLabel && (
                  <div>
                    <p className="font-semibold uppercase tracking-[0.12em] text-[#5c5c5c] mb-1">Avis sur l’indice :</p>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="px-1.5 py-0.5 border border-[#d8d2ca] bg-[#f7f7f3] text-[9px] uppercase tracking-[0.08em]">
                        {indiceLabel}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {observation.photos && observation.photos.length > 0 && (
                <div className="md:w-[180px] md:shrink-0">
                  <button
                    type="button"
                    onClick={() => setLightboxPhoto(observation.photos![0])}
                    className="block w-full overflow-hidden border-2 border-[#e0e0dc] hover:border-[#7b2ff7] transition-all bg-[#f7f7f3]"
                  >
                    <img
                      src={observation.photos[0]}
                      alt="Photo principale"
                      className="h-36 w-full object-cover md:h-[180px]"
                    />
                  </button>
                  {observation.photos.length > 1 && (
                    <div className="mt-1.5 flex gap-1.5 overflow-x-auto pb-1">
                      {observation.photos.slice(1).map((photo, index) => (
                        <button
                          key={photo}
                          type="button"
                          onClick={() => setLightboxPhoto(photo)}
                          className="shrink-0 w-12 h-12 overflow-hidden border border-[#e0e0dc] hover:border-[#7b2ff7] transition-all"
                        >
                          <img src={photo} alt={`Photo ${index + 2}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {hasDetails && (
              <div className="mt-2 border-2 border-[#e0e0dc] p-3 space-y-2">
                {observation.type_autre && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] text-[#999] uppercase tracking-[0.12em]">Type autre</span>
                    <span className="text-[11px] text-[#0a0a0a] font-mono">{observation.type_autre}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            <section className="mx-auto w-full max-w-2xl text-center">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#3b403d] mb-3">
                Feed des commentaires
              </h3>
              <div
                className="border border-[#d0d4ce] bg-white px-5 py-6 md:px-8 md:py-8"
                style={{ boxShadow: '4px 4px 0 rgba(0,0,0,0.08)' }}
              >
                <p className="text-[16px] text-[#0a0a0a] leading-relaxed md:text-[18px]">
                  {observation.commentaire}
                </p>
              </div>
            </section>

            <section className="mx-auto w-full max-w-lg border-t border-[#ece8e1] pt-3">
              <h3 className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#8a8f88] mb-1.5">
                Compléter ce commentaire
              </h3>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!newComment.trim()) return;
                  onAddComment(observation.id, newComment.trim());
                  setNewComment('');
                }}
                className="space-y-1.5 mb-3"
              >
                <textarea
                  value={newComment}
                  onChange={(event) => setNewComment(event.target.value)}
                  placeholder="Compléter ce commentaire..."
                  className="w-full px-2.5 py-2 border border-[#ddd8cf] bg-[#fcfcfa] text-[11px] resize-none focus:outline-none focus:border-[#f72585] transition-colors"
                  rows={2}
                />
                <div className="flex justify-end">
                  <Button variant="primary" size="sm" type="submit" disabled={!newComment.trim()} className="h-7 px-2.5">
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </form>

              <div className="space-y-1.5">
                {observationComments.length > 0 && (
                  <h4 className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#8a8f88] pt-0.5">
                    Compléments
                  </h4>
                )}

                {observationComments.map((commentaire) => (
                  <div key={commentaire.id} className="border border-[#e6e2db] bg-[#fcfcfa] p-2.5">
                    <p className="text-[11px] text-[#303330] leading-relaxed mb-1">{commentaire.texte}</p>
                    <div className="flex items-center justify-between gap-2 text-[9px] text-[#999] font-mono">
                      <span>{commentaire.auteur || 'Anonyme'}</span>
                      <span>{formatTimestamp(commentaire)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Footer: actions + score */}
          <div className="p-4 border-t border-[#e0e0dc] shrink-0">
            <div className="flex items-center justify-center gap-3">
              {mine && (
                <button
                  onClick={() => onDelete(observation.id)}
                  className="p-1 hover:bg-red-50 transition-colors"
                  title="Supprimer"
                  aria-label="Supprimer"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              )}
              <button
                onClick={() => onVote(observation.id, 'up')}
                className="p-1 hover:bg-[#efe9ff] transition-colors"
                title="Pouce vers le haut"
                aria-label="Pouce vers le haut"
              >
                <ThumbsUp className="w-4 h-4 text-[#7b2ff7]" />
              </button>
              <span
                className={`text-[11px] min-w-[24px] text-center font-mono ${
                  score > 0 ? 'text-[#7b2ff7]' : score < 0 ? 'text-red-600' : 'text-[#999]'
                }`}
              >
                {score > 0 ? `+${score}` : score}
              </span>
              <button
                onClick={() => onVote(observation.id, 'down')}
                className="p-1 hover:bg-red-50 transition-colors"
                title="Pouce vers le bas"
                aria-label="Pouce vers le bas"
              >
                <ThumbsDown className="w-4 h-4 text-red-500" />
              </button>
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
