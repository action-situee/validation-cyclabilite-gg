import React, { useState } from 'react';
import { Bike, MapPin, MessageSquare, Send, Trash2, ChevronDown, ChevronUp, Eye, EyeOff, Download, Layers, Info } from 'lucide-react';
import { CommentaireGeneral, Faisceau } from '../types';
import { Button } from './ui/Button';
import { CIBLE_THEMES, OBS_CATEGORIES } from '../config/palette';

/** Tiny inline x swatch for legend */
function CrossSwatch({ color, active }: { color: string; active: boolean }) {
  return (
    <span
      className="relative inline-flex items-center justify-center w-3 h-3 shrink-0"
      style={{ opacity: active ? 1 : 0.4 }}
    >
      <span
        className="absolute w-3 h-0.5"
        style={{
          backgroundColor: color,
          transform: 'rotate(45deg)',
        }}
      />
      <span
        className="absolute w-3 h-0.5"
        style={{
          backgroundColor: color,
          transform: 'rotate(-45deg)',
        }}
      />
    </span>
  );
}

/** Discrete info tooltip on hover */
function InfoTip({ text }: { text: string }) {
  return (
    <span className="relative group inline-flex ml-1">
      <Info className="w-3 h-3 text-[#ccc] group-hover:text-[#2d6a4f] transition-colors cursor-help" />
      <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:block z-50 w-52 px-2.5 py-2 bg-[#1b4332] text-[#f0fdf4] text-[10px] leading-snug border border-[#0a0a0a] pointer-events-none"
        style={{ boxShadow: '3px 3px 0 rgba(0,0,0,0.15)' }}>
        {text}
      </span>
    </span>
  );
}

interface SidebarProps {
  selectedFaisceau: string | null;
  onFaisceauChange: (faisceauId: string | null) => void;
  faisceaux: Faisceau[];
  commentaires: CommentaireGeneral[];
  onAddCommentaire: (com: CommentaireGeneral) => void;
  onDeleteCommentaire: (id: string) => void;
  observationsCount: number;
  activeClasses: string[];
  activeObsCats: string[];
  onToggleClass: (cls: string) => void;
  onToggleObsCat: (cat: string) => void;
  onExportGeoJSON: () => void;
  onExportCSV: () => void;
  isOwnCommentaire: (id: string) => boolean;
  showCorridors: boolean;
  onToggleCorridors: () => void;
  onToggleAllClasses: () => void;
  onToggleAllObsCats: () => void;
}

export function Sidebar({
  selectedFaisceau,
  onFaisceauChange,
  faisceaux,
  commentaires,
  onAddCommentaire,
  onDeleteCommentaire,
  observationsCount,
  activeClasses,
  activeObsCats,
  onToggleClass,
  onToggleObsCat,
  onExportGeoJSON,
  onExportCSV,
  isOwnCommentaire,
  showCorridors,
  onToggleCorridors,
  onToggleAllClasses,
  onToggleAllObsCats,
}: SidebarProps) {
  const [newComment, setNewComment] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [showComments, setShowComments] = useState(true);
  const [showExport, setShowExport] = useState(false);

  const allClassesActive = activeClasses.length === CIBLE_THEMES.length;
  const allObsCatsActive = activeObsCats.length === OBS_CATEGORIES.length;

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    onAddCommentaire({
      id: '',
      auteur: newAuthor.trim() || 'Anonyme',
      texte: newComment.trim(),
      date: new Date().toISOString().split('T')[0],
      faisceau_id: selectedFaisceau || undefined,
    });
    setNewComment('');
  };

  const filteredComments = selectedFaisceau
    ? commentaires.filter((c) => !c.faisceau_id || c.faisceau_id === selectedFaisceau)
    : commentaires;

  return (
    <div className="w-80 bg-white border-r-2 border-[#0a0a0a] flex flex-col h-full overflow-hidden">
      {/* En-tête */}
      <div className="p-5 border-b-2 border-[#0a0a0a] bg-[#1b4332]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 border-2 border-[#52b788] flex items-center justify-center">
            <Bike className="w-5 h-5 text-[#52b788]" />
          </div>
          <div>
            <h1 className="text-[#f0fdf4] text-sm uppercase tracking-[0.15em]">Cyclabilité</h1>
            <p className="text-[#74c69d] text-[10px] uppercase tracking-[0.1em]">Grand Genève – Validation</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Sélecteur de faisceau */}
        <div className="p-4 border-b-2 border-[#0a0a0a]">
          <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-[#5c5c5c] mb-2">
            <MapPin className="w-3.5 h-3.5 text-[#2d6a4f]" />
            Corridor transfrontalier
          </label>
          <div className="relative">
            <select
              value={selectedFaisceau || ''}
              onChange={(e) => onFaisceauChange(e.target.value || null)}
              className="w-full px-3 py-2 pr-9 border-2 border-[#0a0a0a] bg-white text-[13px] focus:outline-none focus:border-[#2d6a4f] transition-colors appearance-none"
            >
              <option value="">Vue d'ensemble</option>
              {faisceaux.map((f) => (
                <option key={f.id} value={f.id}>{f.nom}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5c5c5c] pointer-events-none" />
          </div>

          {/* Toggle corridors visibility */}
          <button
            onClick={onToggleCorridors}
            className={`mt-2.5 flex items-center gap-2 text-[10px] uppercase tracking-[0.1em] px-2 py-1.5 w-full border transition-all ${
              showCorridors
                ? 'border-[#2d6a4f] text-[#1b4332] bg-[#f0fdf4]'
                : 'border-[#e0e0dc] text-[#999] bg-transparent'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="flex-1 text-left">Délimitations corridors</span>
            {showCorridors
              ? <Eye className="w-3 h-3" />
              : <EyeOff className="w-3 h-3" />
            }
          </button>
        </div>

        {/* Compteurs */}
        <div className="p-4 border-b-2 border-[#0a0a0a] grid grid-cols-2 gap-0">
          <div className="border-2 border-[#0a0a0a] border-r p-3 text-center">
            <div className="text-2xl text-[#1b4332] font-mono">{observationsCount}</div>
            <div className="text-[10px] uppercase tracking-[0.12em] text-[#5c5c5c]">Retours</div>
          </div>
          <div className="border-2 border-[#0a0a0a] border-l-0 p-3 text-center">
            <div className="text-2xl text-[#2d6a4f] font-mono">{commentaires.length}</div>
            <div className="text-[10px] uppercase tracking-[0.12em] text-[#5c5c5c]">Commentaires</div>
          </div>
        </div>

        {/* Légende interactive */}
        <div className="p-4 border-b-2 border-[#0a0a0a]">
          <h3 className="text-[10px] uppercase tracking-[0.15em] text-[#5c5c5c] mb-3">
            Filtres thématiques
          </h3>

          {/* Cible themes */}
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] uppercase tracking-[0.1em] text-[#1b4332] flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 bg-[#1b4332]" />
              Points d'attention
              <InfoTip text="Points de discussion suggérés par l'étude le long des corridors – cliquez dessus sur la carte pour voter et commenter." />
            </p>
            <button
              onClick={onToggleAllClasses}
              className="text-[9px] uppercase tracking-wider text-[#2d6a4f] hover:text-[#1b4332] transition-colors border-b border-[#2d6a4f] hover:border-[#1b4332] pb-px"
            >
              {allClassesActive ? 'Tout masquer' : 'Tout afficher'}
            </button>
          </div>
          {/* removed description paragraph - info now in InfoTip */}
          <div className="space-y-px mb-4">
            {CIBLE_THEMES.map((item) => {
              const active = activeClasses.includes(item.key);
              return (
                <button
                  key={item.key}
                  onClick={() => onToggleClass(item.key)}
                  className={`flex items-center gap-2.5 w-full px-2 py-1.5 text-[11px] transition-all border-l-2 ${
                    active
                      ? 'bg-[#fafaf8] border-current text-[#0a0a0a]'
                      : 'opacity-30 border-transparent hover:opacity-50'
                  }`}
                  style={{ borderLeftColor: active ? item.color : 'transparent' }}
                >
                  <span
                    className="w-2.5 h-2.5 shrink-0 transition-all"
                    style={{
                      backgroundColor: item.color,
                      boxShadow: active ? `0 0 6px ${item.color}66` : 'none',
                    }}
                  />
                  <span className="flex-1 text-left tracking-wide">{item.label}</span>
                  {active
                    ? <Eye className="w-3 h-3 text-[#999]" />
                    : <EyeOff className="w-3 h-3 text-[#ccc]" />
                  }
                </button>
              );
            })}
          </div>

          {/* Observation categories */}
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] uppercase tracking-[0.1em] text-[#1b4332] flex items-center gap-1.5">
              <CrossSwatch color="#1b4332" active />
              Vos retours terrain
              <InfoTip text="Contributions en champ libre – utilisez « + Ajouter » pour signaler un danger, proposer un aménagement ou valider un indice n'importe où sur la carte." />
            </p>
            <button
              onClick={onToggleAllObsCats}
              className="text-[9px] uppercase tracking-wider text-[#2d6a4f] hover:text-[#1b4332] transition-colors border-b border-[#2d6a4f] hover:border-[#1b4332] pb-px"
            >
              {allObsCatsActive ? 'Tout masquer' : 'Tout afficher'}
            </button>
          </div>
          <div className="space-y-px">
            {OBS_CATEGORIES.map((item) => {
              const active = activeObsCats.includes(item.key);
              return (
                <button
                  key={item.key}
                  onClick={() => onToggleObsCat(item.key)}
                  className={`flex items-center gap-2.5 w-full px-2 py-1.5 text-[11px] transition-all border-l-2 ${
                    active
                      ? 'bg-[#fafaf8] text-[#0a0a0a]'
                      : 'opacity-30 border-transparent hover:opacity-50'
                  }`}
                  style={{ borderLeftColor: active ? item.color : 'transparent' }}
                >
                  <CrossSwatch color={item.color} active={active} />
                  <span className="flex-1 text-left tracking-wide">{item.label}</span>
                  {active
                    ? <Eye className="w-3 h-3 text-[#999]" />
                    : <EyeOff className="w-3 h-3 text-[#ccc]" />
                  }
                </button>
              );
            })}
          </div>
        </div>

        {/* Commentaires généraux */}
        <div className="p-4 border-b-2 border-[#0a0a0a]">
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center justify-between w-full mb-3"
          >
            <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-[#5c5c5c]">
              <MessageSquare className="w-3.5 h-3.5 text-[#2d6a4f]" />
              Commentaires ({filteredComments.length})
            </span>
            {showComments ? <ChevronUp className="w-4 h-4 text-[#999]" /> : <ChevronDown className="w-4 h-4 text-[#999]" />}
          </button>

          {showComments && (
            <>
              {/* Formulaire */}
              <form onSubmit={handleSubmitComment} className="mb-4 space-y-2">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Votre commentaire..."
                  className="w-full px-3 py-2 border-2 border-[#0a0a0a] bg-white text-[12px] resize-none focus:outline-none focus:border-[#2d6a4f] transition-colors"
                  rows={2}
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    placeholder="Votre nom"
                    className="flex-1 px-3 py-1.5 border-2 border-[#0a0a0a] bg-white text-[12px] focus:outline-none focus:border-[#2d6a4f] transition-colors"
                  />
                  <Button variant="primary" size="sm" type="submit" disabled={!newComment.trim()}>
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </form>

              {/* Liste */}
              <div className="space-y-2">
                {filteredComments.length === 0 && (
                  <p className="text-[11px] text-[#999] text-center py-3 border border-dashed border-[#e0e0dc]">Aucun commentaire</p>
                )}
                {filteredComments.slice().reverse().map((com) => (
                  <div key={com.id} className="border-2 border-[#e0e0dc] p-3 group relative hover:border-[#1b4332] transition-colors">
                    <p className="text-[12px] text-[#0a0a0a] mb-1.5 leading-relaxed">{com.texte}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#999] font-mono">{com.auteur} – {com.date}</span>
                      {isOwnCommentaire(com.id) && (
                        <button
                          onClick={() => onDeleteCommentaire(com.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 transition-all"
                          title="Supprimer mon commentaire"
                        >
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Export */}
        <div className="p-4">
          <button
            onClick={() => setShowExport(!showExport)}
            className="flex items-center justify-between w-full text-[10px] uppercase tracking-[0.12em] text-[#999] hover:text-[#1b4332] transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" />
              Exporter les données
            </span>
            {showExport ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showExport && (
            <div className="mt-3 space-y-2">
              <p className="text-[10px] text-[#999]">
                Téléchargez pour votre SIG ou tableur.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={onExportGeoJSON}
                  className="flex-1 px-3 py-2 text-[10px] uppercase tracking-wider border-2 border-[#0a0a0a] hover:bg-[#1b4332] hover:text-[#f0fdf4] transition-all text-center"
                >
                  GeoJSON
                </button>
                <button
                  onClick={onExportCSV}
                  className="flex-1 px-3 py-2 text-[10px] uppercase tracking-wider border-2 border-[#0a0a0a] hover:bg-[#1b4332] hover:text-[#f0fdf4] transition-all text-center"
                >
                  CSV
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}