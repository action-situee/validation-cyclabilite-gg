import React, { useState } from 'react';
import { X, ThumbsUp, ThumbsDown, MessageCircle, Plus, User, Building2, Trash2, Image as ImageIcon } from 'lucide-react';
import { Cible, ObservationLibre, ROLE_LABELS, RoleContributeur } from '../types';
import { Button } from './ui/Button';
import { OBS_NEON, OBS_LABELS, THEME_NEON, THEME_LABELS, INDICE_LABELS } from '../config/palette';

interface CibleThreadProps {
  cible: Cible;
  observations: ObservationLibre[];
  onClose: () => void;
  onVote: (obsId: string, direction: 'up' | 'down') => void;
  onDelete: (obsId: string) => void;
  onAddObservation: () => void;
  isOwn: (obsId: string) => boolean;
}

export function CibleThread({ cible, observations, onClose, onVote, onDelete, onAddObservation, isOwn }: CibleThreadProps) {
  const sorted = [...observations].sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);

  return (
    <>
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-white border-2 border-[#0a0a0a] w-full max-w-lg shadow-[6px_6px_0_rgba(0,0,0,0.15)] max-h-[85vh] flex flex-col">
          {/* Header */}
          <div className="p-4 border-b-2 border-[#0a0a0a] shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-[#1b4332]" />
                <h2 className="text-[11px] uppercase tracking-[0.15em]">Fil de discussion</h2>
              </div>
              <button onClick={onClose} className="p-1 border-2 border-transparent hover:border-[#0a0a0a] transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="border-2 border-[#e0e0dc] p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className="inline-block w-2.5 h-2.5"
                  style={{
                    backgroundColor: THEME_NEON[cible.theme_principal] || '#8338ec',
                  }}
                />
                <span className="text-[9px] uppercase tracking-[0.15em]" style={{ color: THEME_NEON[cible.theme_principal] || '#8338ec' }}>
                  {THEME_LABELS[cible.theme_principal] || cible.theme_principal}
                </span>
              </div>
              <h3 className="text-[13px] mb-1">{cible.titre_affichage}</h3>
              {cible.sous_titre_affichage && (
                <p className="text-[11px] text-[#999] mb-1">{cible.sous_titre_affichage}</p>
              )}
              {cible.question_cle && (
                <p className="text-[11px] text-[#2d6a4f] mt-2 border-l-2 border-[#2d6a4f] pl-2 leading-relaxed">{cible.question_cle}</p>
              )}
            </div>
          </div>

          {/* Observations list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {sorted.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-[#e0e0dc]">
                <MessageCircle className="w-6 h-6 text-[#ccc] mx-auto mb-2" />
                <p className="text-[11px] text-[#999]">Aucune contribution</p>
                <p className="text-[10px] text-[#ccc] mt-1">Soyez le premier</p>
              </div>
            ) : (
              sorted.map((obs) => {
                const color = OBS_NEON[obs.categorie] || '#8338ec';
                const score = obs.upvotes - obs.downvotes;
                const mine = isOwn(obs.id);
                const hasPhotos = obs.photos && obs.photos.length > 0;
                return (
                  <div
                    key={obs.id}
                    className={`border-2 p-3 transition-colors ${
                      mine
                        ? 'border-[#2d6a4f] bg-[#f0fdf4]'
                        : 'border-[#e0e0dc] hover:border-[#0a0a0a]'
                    }`}
                  >
                    {/* Category tag + date */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block w-2 h-2"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-[9px] uppercase tracking-[0.12em]" style={{ color }}>
                          {OBS_LABELS[obs.categorie]}
                        </span>
                        {obs.indice_juge && (
                          <span className="text-[9px] bg-[#f0fdf4] text-[#2d6a4f] px-1.5 py-0.5 border border-[#2d6a4f] uppercase tracking-wider">
                            {INDICE_LABELS[obs.indice_juge]}
                          </span>
                        )}
                        {hasPhotos && (
                          <span className="text-[10px] text-[#999] flex items-center gap-0.5 font-mono">
                            <ImageIcon className="w-3 h-3" />
                            {obs.photos!.length}
                          </span>
                        )}
                        {mine && (
                          <span className="text-[8px] bg-[#1b4332] text-[#f0fdf4] px-1.5 py-0.5 uppercase tracking-wider">
                            Moi
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[#999] font-mono">{obs.date}</span>
                    </div>

                    {/* Comment */}
                    <p className="text-[12px] text-[#0a0a0a] mb-2 leading-relaxed">{obs.commentaire}</p>

                    {/* Photos gallery */}
                    {hasPhotos && (
                      <div className="flex gap-1.5 mb-2 overflow-x-auto pb-1">
                        {obs.photos!.map((photo, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setLightboxPhoto(photo)}
                            className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 overflow-hidden border-2 border-[#e0e0dc]
                                       hover:border-[#1b4332] transition-all active:scale-95"
                          >
                            <img
                              src={photo}
                              alt={`Photo ${i + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Structured fields */}
                    {obs.danger_fields && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {obs.danger_fields.type_usager && <span className="text-[9px] uppercase tracking-wider bg-red-50 text-red-700 px-2 py-0.5 border border-red-200">{obs.danger_fields.type_usager}</span>}
                        {obs.danger_fields.frequence && <span className="text-[9px] uppercase tracking-wider bg-red-50 text-red-700 px-2 py-0.5 border border-red-200">{obs.danger_fields.frequence}</span>}
                        {obs.danger_fields.gravite && <span className="text-[9px] uppercase tracking-wider bg-red-50 text-red-700 px-2 py-0.5 border border-red-200">Gravité : {obs.danger_fields.gravite}</span>}
                      </div>
                    )}
                    {obs.amenagement_fields && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {obs.amenagement_fields.type_infra && <span className="text-[9px] uppercase tracking-wider bg-orange-50 text-orange-700 px-2 py-0.5 border border-orange-200">{obs.amenagement_fields.type_infra.replace(/_/g, ' ')}</span>}
                        {obs.amenagement_fields.priorite && <span className="text-[9px] uppercase tracking-wider bg-orange-50 text-orange-700 px-2 py-0.5 border border-orange-200">Priorité : {obs.amenagement_fields.priorite}</span>}
                      </div>
                    )}
                    {obs.validation_fields?.criteres_mal_evalues && obs.validation_fields.criteres_mal_evalues.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {obs.validation_fields.criteres_mal_evalues.map((c) => (
                          <span key={c} className="text-[9px] uppercase tracking-wider bg-[#f0fdf4] text-[#1b4332] px-2 py-0.5 border border-[#2d6a4f]">{c}</span>
                        ))}
                      </div>
                    )}

                    {/* Author + votes + delete */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#e0e0dc]">
                      <div className="flex items-center gap-2 text-[10px] text-[#999] min-w-0">
                        <User className="w-3 h-3 shrink-0" />
                        <span className="truncate font-mono">{obs.auteur}</span>
                        {obs.organisation && (
                          <>
                            <Building2 className="w-3 h-3 text-[#ccc] shrink-0" />
                            <span className="text-[#ccc] truncate font-mono">{obs.organisation}</span>
                          </>
                        )}
                        {obs.role && (
                          <span className="bg-[#f0f0ec] text-[#5c5c5c] px-1.5 py-0.5 text-[8px] uppercase tracking-wider shrink-0">
                            {ROLE_LABELS[obs.role as RoleContributeur]}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {mine && (
                          <button
                            onClick={() => onDelete(obs.id)}
                            className="p-1 hover:bg-red-50 transition-colors group mr-1"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-[#ccc] group-hover:text-red-600" />
                          </button>
                        )}
                        <button
                          onClick={() => onVote(obs.id, 'up')}
                          className="p-1 hover:bg-[#f0fdf4] transition-colors group"
                          title="Confirmer"
                        >
                          <ThumbsUp className="w-3.5 h-3.5 text-[#ccc] group-hover:text-[#1b4332]" />
                        </button>
                        <span className={`text-[10px] min-w-[20px] text-center font-mono ${score > 0 ? 'text-[#1b4332]' : score < 0 ? 'text-red-600' : 'text-[#ccc]'}`}>
                          {score > 0 ? `+${score}` : score}
                        </span>
                        <button
                          onClick={() => onVote(obs.id, 'down')}
                          className="p-1 hover:bg-red-50 transition-colors group"
                          title="Contester"
                        >
                          <ThumbsDown className="w-3.5 h-3.5 text-[#ccc] group-hover:text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t-2 border-[#0a0a0a] shrink-0">
            <Button variant="primary" className="w-full" onClick={onAddObservation}>
              <Plus className="w-4 h-4" />
              Ajouter une contribution
            </Button>
          </div>
        </div>
      </div>

      {/* Lightbox plein écran */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 border-2 border-white/40 flex items-center justify-center
                       hover:bg-white/10 transition-colors z-10"
            onClick={() => setLightboxPhoto(null)}
            aria-label="Fermer"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <img
            src={lightboxPhoto}
            alt="Photo en grand"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}