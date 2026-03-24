import React, { useState } from 'react';
import { X, MapPin } from 'lucide-react';
import {
  BikeSegment,
  ObservationCategory,
  ObservationIndiceFeedback,
  ObservationLibre,
  ObservationMetricClass,
} from '../types';
import { Button } from './ui/button';
import { PhotoPicker } from './PhotoPicker';

interface QuickAddFormProps {
  latitude: number;
  longitude: number;
  segment?: BikeSegment | null;
  onSubmit: (obs: ObservationLibre) => void;
  onClose: () => void;
}

const RETURN_TYPES: { value: ObservationCategory; label: string }[] = [
  { value: 'securite_intersections', label: 'Sécurité intersections' },
  { value: 'giratoire', label: 'Giratoire' },
  { value: 'equipement', label: 'Équipement' },
  { value: 'bande_piste', label: 'Bande / piste' },
  { value: 'conflits_usage', label: 'Conflits d’usage' },
  { value: 'autre', label: 'Autre' },
];

const METRIC_CLASSES: { value: ObservationMetricClass; label: string }[] = [
  { value: 'attractivite', label: 'Attractivité' },
  { value: 'confort', label: 'Confort' },
  { value: 'equipement', label: 'Équipement' },
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'securite', label: 'Sécurité' },
];

const INDICE_OPTIONS: { value: ObservationIndiceFeedback; label: string }[] = [
  { value: 'sous_estime', label: 'Sous-estimé' },
  { value: 'adapte', label: 'Adapté' },
  { value: 'sur_estime', label: 'Sur-estimé' },
];

function ToggleGroup({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`px-2 py-1 text-[9px] uppercase tracking-[0.08em] transition-all border ${
            value === option.value
              ? 'border-[#f72585] bg-[#fff0f6] text-[#0a0a0a]'
              : 'border-[#e0e0dc] text-[#5c5c5c] hover:border-[#0a0a0a]'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function MultiSelect({
  options,
  values,
  onChange,
}: {
  options: { value: string; label: string }[];
  values: string[];
  onChange: (values: string[]) => void;
}) {
  const toggle = (value: string) => {
    onChange(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => toggle(option.value)}
          className={`px-2 py-1 text-[9px] uppercase tracking-[0.08em] transition-all border ${
            values.includes(option.value)
              ? 'border-[#2E6A4A] bg-[#D3E4D7] text-[#2E6A4A]'
              : 'border-[#e0e0dc] text-[#5c5c5c] hover:border-[#0a0a0a]'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function QuickAddForm({ latitude, longitude, segment, onSubmit, onClose }: QuickAddFormProps) {
  const [categoriesConcernees, setCategoriesConcernees] = useState<ObservationCategory[]>(['securite_intersections']);
  const [typeAutre, setTypeAutre] = useState('');
  const [classesConcernees, setClassesConcernees] = useState<ObservationMetricClass[]>([]);
  const [indiceJuge, setIndiceJuge] = useState<ObservationIndiceFeedback | ''>('');
  const [commentaire, setCommentaire] = useState('');
  const [auteur, setAuteur] = useState('');
  const [organisation, setOrganisation] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

  const primaryCategory = categoriesConcernees[0] || 'autre';
  const hasAutreCategory = categoriesConcernees.includes('autre');
  const canSubmit = commentaire.trim() && indiceJuge && categoriesConcernees.length > 0 && (!hasAutreCategory || typeAutre.trim());
  const sectionTitleClass = 'block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#3b403d] mb-2';
  const inputClass = 'w-full px-3 py-2 border border-[#d0d4ce] bg-white focus:outline-none focus:border-[#2E6A4A] transition-colors text-[13px]';
  const dividerClass = 'border-t border-[#ece9e4] pt-4';

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    const now = new Date();
    onSubmit({
      id: '',
      latitude,
      longitude,
      commentaire: commentaire.trim(),
      categorie: primaryCategory,
      categories_concernees: categoriesConcernees,
      type_autre: hasAutreCategory ? typeAutre.trim() : undefined,
      classes_concernees: classesConcernees,
      auteur: auteur.trim() || 'Anonyme',
      organisation: organisation.trim() || undefined,
      date: now.toISOString().slice(0, 10),
      heure: now.toTimeString().slice(0, 8),
      faisceau_id: segment?.faisceau_id,
      segment_id: segment?.segment_id,
      segment_label: segment ? `${segment.faisceau_nom} - segment ${segment.segment_id}` : undefined,
      segment_score_calcule: segment?.bike_index ?? undefined,
      indice_juge: indiceJuge as ObservationIndiceFeedback,
      upvotes: 0,
      downvotes: 0,
      votedBy: [],
      commentaires: [],
      photos: photos.length > 0 ? photos : undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white border-2 border-[#0a0a0a] w-full max-w-lg shadow-[6px_6px_0_rgba(0,0,0,0.15)] max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-4 border-b-2 border-[#0a0a0a] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="w-5 h-5 text-[#f72585] shrink-0" />
            <div className="min-w-0">
              <h2 className="text-[12px] uppercase tracking-[0.12em]">Nouvelle observation</h2>
              {segment ? (
                <p className="text-[10px] text-[#999] font-mono">
                  {segment.faisceau_nom} · segment {segment.segment_id}
                </p>
              ) : (
                <p className="text-[10px] text-[#999] font-mono">
                  {latitude.toFixed(5)}, {longitude.toFixed(5)}
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1 border-2 border-transparent hover:border-[#0a0a0a] transition-all" aria-label="Fermer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form id="quick-add-form" onSubmit={handleSubmit} className="overflow-y-auto flex-1">
          <div className="p-4 space-y-4 sm:space-y-5">
            <div>
              <label className={sectionTitleClass}>
                L’indice vous semble
              </label>
              <ToggleGroup
                options={INDICE_OPTIONS}
                value={indiceJuge}
                onChange={(value) => setIndiceJuge(value as ObservationIndiceFeedback)}
              />
            </div>

            <div className={dividerClass}>
              <label className={sectionTitleClass}>
                Objet concerné
              </label>
              <MultiSelect
                options={RETURN_TYPES}
                values={categoriesConcernees}
                onChange={(values) => setCategoriesConcernees(values as ObservationCategory[])}
              />
            </div>

            {hasAutreCategory && (
              <div className={dividerClass}>
                <label className="block text-[10px] uppercase tracking-[0.12em] text-[#5c5c5c] mb-1">
                  Préciser
                </label>
                <input
                  type="text"
                  value={typeAutre}
                  onChange={(event) => setTypeAutre(event.target.value)}
                  className={inputClass}
                  placeholder="Ex : stationnement, revêtement, signalisation..."
                />
              </div>
            )}

            <div className={dividerClass}>
              <label className={sectionTitleClass}>
              Classe concernée
            </label>
            <MultiSelect
              options={METRIC_CLASSES}
              values={classesConcernees}
              onChange={(values) => setClassesConcernees(values as ObservationMetricClass[])}
            />
            </div>

            <div className={dividerClass}>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#3b403d] mb-1">
              Commentaire / suggestion <span className="text-red-600">*</span>
            </label>
            <textarea
              value={commentaire}
              onChange={(event) => setCommentaire(event.target.value)}
                className="w-full px-3 py-2 border border-[#d0d4ce] bg-white resize-none focus:outline-none focus:border-[#2E6A4A] transition-colors text-[13px]"
              rows={4}
              placeholder="Décrivez le problème, le point d’attention ou la suggestion d’amélioration..."
              required
              autoFocus
            />
            </div>

            <div className={dividerClass}>
              <PhotoPicker photos={photos} onChange={setPhotos} />
            </div>

            <div className={`${dividerClass} grid grid-cols-1 gap-3 sm:grid-cols-2`}>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#3b403d] mb-1">
                Nom
                </label>
                <input
                  type="text"
                  value={auteur}
                  onChange={(event) => setAuteur(event.target.value)}
                  className={inputClass}
                  placeholder="Anonyme"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#3b403d] mb-1">
                Entité
                </label>
                <input
                  type="text"
                  value={organisation}
                  onChange={(event) => setOrganisation(event.target.value)}
                  className={inputClass}
                  placeholder="Association, commune, service..."
                />
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 border-t border-[#ece9e4] bg-white/95 backdrop-blur px-4 py-3 shrink-0">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button className="w-full sm:w-auto" variant="ghost" size="sm" type="button" onClick={onClose}>Annuler</Button>
              <Button className="w-full sm:w-auto" variant="primary" size="sm" form="quick-add-form" type="submit" disabled={!canSubmit}>Enregistrer</Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
