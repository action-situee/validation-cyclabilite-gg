import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Send,
  Trash2,
  ChevronDown,
  ChevronUp,
  MapPin,
  Layers,
  Pencil,
  ClipboardCheck,
} from 'lucide-react';
import type { CommentaireGeneral, Faisceau } from '../types';
import { Button } from './ui/button';

interface ValidationSidebarProps {
  className?: string;
  selectedFaisceau: string | null;
  onFaisceauChange: (faisceauId: string | null) => void;
  faisceaux: Faisceau[];
  onOpenSurvey: () => void;
  showFaisceaux: boolean;
  onToggleFaisceaux: () => void;
  commentaires: CommentaireGeneral[];
  onAddCommentaire: (com: CommentaireGeneral) => void;
  onUpdateCommentaire: (com: CommentaireGeneral) => void;
  onDeleteCommentaire: (id: string) => void;
  observationsCount: number;
  onExportGeoJSON: () => void;
  onExportCSV: () => void;
  isOwnCommentaire: (id: string) => boolean;
}

function formatCommentTimestamp(commentaire: CommentaireGeneral) {
  return commentaire.heure
    ? `${commentaire.date} · ${commentaire.heure}`
    : commentaire.date;
}

export function ValidationSidebar({
  className = '',
  selectedFaisceau,
  onFaisceauChange,
  faisceaux,
  onOpenSurvey,
  showFaisceaux,
  onToggleFaisceaux,
  commentaires,
  onAddCommentaire,
  onUpdateCommentaire,
  onDeleteCommentaire,
  observationsCount,
  onExportGeoJSON,
  onExportCSV,
  isOwnCommentaire,
}: ValidationSidebarProps) {
  const [newComment, setNewComment] = useState('');
  const [showSequence, setShowSequence] = useState(true);
  const [showComments, setShowComments] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const sectionClass = 'p-4 border-b border-[#dfe3df] bg-white';
  const sectionTitleClass = 'text-[11px] uppercase tracking-[0.12em] text-[#1f2b24] mb-3 font-extrabold';
  const bodyTextClass = 'text-[11px] text-[#4d5853] leading-relaxed';
  const fieldClass = 'w-full px-3 py-2 border border-[#c9d0cc] bg-white text-[12px] resize-none focus:outline-none focus:border-[#2E6A4A] transition-colors';

  const filteredComments = useMemo(() => (
    selectedFaisceau
      ? commentaires.filter((commentaire) => !commentaire.faisceau_id || commentaire.faisceau_id === selectedFaisceau)
      : commentaires
  ), [commentaires, selectedFaisceau]);

  const handleSubmitComment = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newComment.trim()) return;

    const now = new Date();
    onAddCommentaire({
      id: '',
      auteur: 'Anonyme',
      texte: newComment.trim(),
      date: now.toISOString().slice(0, 10),
      heure: now.toTimeString().slice(0, 8),
      faisceau_id: selectedFaisceau || undefined,
    });
    setNewComment('');
  };

  const handleSaveEdit = (commentaire: CommentaireGeneral) => {
    if (!editingText.trim()) return;

    const now = new Date();
    onUpdateCommentaire({
      ...commentaire,
      texte: editingText.trim(),
      heure: now.toTimeString().slice(0, 8),
    });
    setEditingId(null);
    setEditingText('');
  };

  return (
    <div className={`w-[360px] bg-[rgba(229,238,230,0.82)] backdrop-blur-[2px] border-r-2 border-[#0a0a0a] flex flex-col h-full overflow-hidden ${className}`}>
      <div className="p-5 border-b-2 border-[#0a0a0a] bg-[#2E6A4A]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 border-2 border-[#D3E4D7] flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-[#D3E4D7]" />
          </div>
          <div>
            <h1 className="text-[#D3E4D7] text-sm uppercase tracking-[0.15em]">Contribution</h1>
            <p className="text-[#8AA894] text-[10px] uppercase tracking-[0.1em]">Remontees & commentaires</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-[rgba(229,238,230,0.66)]">
        {/* Sequence steps */}
        <div className="p-4 border-b border-[#dfe3df] bg-[#D3E4D7]">
          <button
            onClick={() => setShowSequence((previous) => !previous)}
            className="w-full flex items-center justify-between"
          >
            <p className="text-[9px] uppercase tracking-[0.15em] text-[#999]">Séquence de contribution</p>
            {showSequence ? <ChevronUp className="w-4 h-4 text-[#999]" /> : <ChevronDown className="w-4 h-4 text-[#999]" />}
          </button>

          {showSequence && (
            <div className="space-y-2 mt-3">
              {[
                { n: '1', label: 'Remplir le questionnaire general', sub: 'Section Questionnaire ci-dessous' },
                { n: '2', label: 'Choisir un faisceau', sub: 'Selecteur ci-dessous' },
                { n: '3', label: 'Poser des points sur la carte', sub: 'Bouton Ajouter en haut a droite de la carte' },
                { n: '4', label: 'Laisser un commentaire general', sub: 'Section Commentaires ci-dessous' },
              ].map(({ n, label, sub }, index, steps) => (
                <React.Fragment key={n}>
                  <div className="flex items-start gap-2.5">
                    <span className="shrink-0 w-5 h-5 flex items-center justify-center bg-[#2E6A4A] text-[#D3E4D7] text-[9px] font-mono font-bold">{n}</span>
                    <div>
                      <p className="text-[11px] text-[#0a0a0a] font-semibold leading-tight">{label}</p>
                      <p className="text-[10px] text-[#999]">{sub}</p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="pl-[2px]">
                      <ChevronDown className="w-3.5 h-3.5 text-[#2E6A4A]" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        <div className={sectionClass}>
          <h3 className={sectionTitleClass}>
            Etape 1 · Questionnaire general
          </h3>
          <p className={`${bodyTextClass} mb-3`}>
            Donnez votre avis global sur l&apos;indice et proposez vos suggestions.
          </p>
          <button
            onClick={onOpenSurvey}
            className="w-full flex items-center justify-center gap-2 px-2.5 py-2 border border-[#2E6A4A] bg-white text-[#2E6A4A] hover:bg-[#2E6A4A] hover:text-[#D3E4D7] transition-all text-[10px] uppercase tracking-[0.1em]"
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            Repondre au questionnaire
          </button>
        </div>

        <div className={sectionClass}>
          <h3 className={sectionTitleClass}>
            Etape 2 · Faisceau transfrontalier
          </h3>

          <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-[#4d5853] mb-2">
            <MapPin className="w-3.5 h-3.5 text-[#2E6A4A]" />
            Focus carte
          </label>
          <div className="relative">
            <select
              value={selectedFaisceau || ''}
              onChange={(event) => onFaisceauChange(event.target.value || null)}
              className="w-full px-3 py-2 pr-9 border border-[#c9d0cc] bg-white text-[13px] focus:outline-none focus:border-[#2E6A4A] transition-colors appearance-none"
            >
              <option value="">Vue d&apos;ensemble</option>
              {faisceaux.map((faisceau) => (
                <option key={faisceau.id} value={faisceau.id}>
                  {faisceau.nom}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5c5c5c] pointer-events-none" />
          </div>

          <button
            onClick={onToggleFaisceaux}
            className={`mt-2.5 flex items-center gap-2 text-[10px] uppercase tracking-[0.1em] px-2 py-1.5 w-full border transition-all ${
              showFaisceaux
                ? 'border-[#2E6A4A] text-[#2E6A4A] bg-[#D3E4D7]'
                : 'border-[#e0e0dc] text-[#999] bg-transparent'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="flex-1 text-left">Delimitations des faisceaux</span>
          </button>
        </div>

        <div className={sectionClass}>
          <div className={sectionTitleClass}>
            Etape 3 · Contributions localisees sur la carte
          </div>
          <p className={bodyTextClass}>
            Ajoutez directement des points sur la carte. Cliquez sur + Ajouter pour creer un point. Appuyez sur un point existant pour lire la discussion, voter ou y ajouter un commentaire.
          </p>
        </div>

        <div className={sectionClass}>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center justify-between w-full mb-3"
          >
            <span className="text-[11px] uppercase tracking-[0.12em] text-[#1f2b24] font-extrabold">
              Etape 4 · Commentaires
            </span>
            {showComments ? <ChevronUp className="w-4 h-4 text-[#999]" /> : <ChevronDown className="w-4 h-4 text-[#999]" />}
          </button>

          {showComments && (
            <>
              <form onSubmit={handleSubmitComment} className="mb-4 space-y-2">
                <textarea
                  value={newComment}
                  onChange={(event) => setNewComment(event.target.value)}
                  placeholder="Commentaire ou suggestion generale..."
                  className={fieldClass}
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button variant="primary" size="sm" type="submit" disabled={!newComment.trim()}>
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </form>

              <div className="space-y-2">
                {filteredComments.length === 0 && (
                  <p className="text-[11px] text-[#999] text-center py-3 border border-dashed border-[#e0e0dc]">
                    Aucun commentaire
                  </p>
                )}

                {filteredComments.slice().reverse().map((commentaire) => {
                  const isEditing = editingId === commentaire.id;
                  const isOwn = isOwnCommentaire(commentaire.id);

                  return (
                    <div
                      key={commentaire.id}
                      className="border border-[#d5dbd7] bg-white p-3 group relative hover:border-[#2E6A4A] transition-colors"
                    >
                      {isEditing ? (
                        <div className="space-y-2">
                          <textarea
                            value={editingText}
                            onChange={(event) => setEditingText(event.target.value)}
                            className={fieldClass}
                            rows={3}
                          />
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" type="button" onClick={() => setEditingId(null)}>
                              Annuler
                            </Button>
                            <Button variant="primary" size="sm" type="button" onClick={() => handleSaveEdit(commentaire)}>
                              Enregistrer
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-[12px] text-[#0a0a0a] mb-1.5 leading-relaxed">{commentaire.texte}</p>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-[10px] text-[#999] font-mono">
                              {formatCommentTimestamp(commentaire)}
                            </span>
                            {isOwn && (
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => {
                                    setEditingId(commentaire.id);
                                    setEditingText(commentaire.texte);
                                  }}
                                  className="p-1 hover:bg-[#D3E4D7] transition-all"
                                  title="Modifier mon commentaire"
                                >
                                  <Pencil className="w-3 h-3 text-[#2E6A4A]" />
                                </button>
                                <button
                                  onClick={() => onDeleteCommentaire(commentaire.id)}
                                  className="p-1 hover:bg-red-50 transition-all"
                                  title="Supprimer mon commentaire"
                                >
                                  <Trash2 className="w-3 h-3 text-red-500" />
                                </button>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

      </div>

      <div className="border-t border-[#d5dbd7] bg-white grid grid-cols-2 shrink-0">
        <div className="border-r border-[#d5dbd7] p-3 text-center">
          <div className="text-2xl text-[#2E6A4A] font-mono">{observationsCount}</div>
          <div className="text-[10px] uppercase tracking-[0.12em] text-[#4d5853]">Remontees</div>
        </div>
        <div className="p-3 text-center">
          <div className="text-2xl text-[#2E6A4A] font-mono">{commentaires.length}</div>
          <div className="text-[10px] uppercase tracking-[0.12em] text-[#4d5853]">Commentaires</div>
        </div>
      </div>
    </div>
  );
}
