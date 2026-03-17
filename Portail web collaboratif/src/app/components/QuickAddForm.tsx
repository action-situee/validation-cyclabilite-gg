import React, { useState } from 'react';
import { X, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import {
  ObservationLibre,
  Cible,
  RoleContributeur,
  ROLE_LABELS,
  DangerFields,
  AmenagementFields,
  ValidationFields,
} from '../types';
import { Button } from './ui/Button';
import { PhotoPicker } from './PhotoPicker';

interface QuickAddFormProps {
  latitude: number;
  longitude: number;
  cible?: Cible | null;
  onSubmit: (obs: ObservationLibre) => void;
  onClose: () => void;
}

const CATEGORIES: { value: ObservationLibre['categorie']; label: string; activeClass: string }[] = [
  { value: 'validation', label: 'Valider l\'indice', activeClass: 'border-[#4cc9f0] bg-[#edfaff] text-[#0a0a0a]' },
  { value: 'danger', label: 'Danger', activeClass: 'border-[#f72585] bg-[#fff0f6] text-[#0a0a0a]' },
  { value: 'amenagement', label: 'Aménagement', activeClass: 'border-[#ffd60a] bg-[#fffdf0] text-[#0a0a0a]' },
  { value: 'positif', label: 'Point positif', activeClass: 'border-[#00f5d4] bg-[#f0fffc] text-[#0a0a0a]' },
];

const INDICE_OPTIONS: { value: ObservationLibre['indice_juge']; label: string }[] = [
  { value: 'trop_faible', label: 'Sous-estimé' },
  { value: 'juste', label: 'Cohérent' },
  { value: 'trop_eleve', label: 'Surestimé' },
];

const DANGER_USAGERS = [
  { value: 'cycliste', label: 'Cycliste' },
  { value: 'pieton', label: 'Piéton' },
  { value: 'tous', label: 'Tous usagers' },
];
const DANGER_FREQUENCES = [
  { value: 'quotidien', label: 'Quotidien' },
  { value: 'hebdomadaire', label: 'Hebdomadaire' },
  { value: 'occasionnel', label: 'Occasionnel' },
];
const DANGER_GRAVITES = [
  { value: 'faible', label: 'Faible' },
  { value: 'moderee', label: 'Modérée' },
  { value: 'elevee', label: 'Élevée' },
  { value: 'critique', label: 'Critique' },
];

const AMENAGEMENT_TYPES = [
  { value: 'piste_separee', label: 'Piste séparée' },
  { value: 'bande', label: 'Bande cyclable' },
  { value: 'zone30', label: 'Zone 30' },
  { value: 'eclairage', label: 'Éclairage' },
  { value: 'signalisation', label: 'Signalisation' },
  { value: 'stationnement', label: 'Stationnement' },
];
const AMENAGEMENT_PRIORITES = [
  { value: 'basse', label: 'Basse' },
  { value: 'moyenne', label: 'Moyenne' },
  { value: 'haute', label: 'Haute' },
  { value: 'urgente', label: 'Urgente' },
];

const VALIDATION_CRITERES = [
  { value: 'trafic', label: 'Trafic' },
  { value: 'revetement', label: 'Revêtement' },
  { value: 'continuite', label: 'Continuité' },
  { value: 'securite', label: 'Sécurité' },
  { value: 'confort', label: 'Confort' },
  { value: 'signalisation', label: 'Signalisation' },
];

function ChipSelect({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string | undefined;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-2.5 py-1 text-[10px] uppercase tracking-wider transition-all border-2 ${
            value === opt.value
              ? 'border-[#1b4332] bg-[#f0fdf4] text-[#1b4332]'
              : 'border-[#e0e0dc] text-[#999] hover:border-[#0a0a0a]'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function MultiChipSelect({
  options,
  values,
  onChange,
}: {
  options: { value: string; label: string }[];
  values: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (v: string) => {
    onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => toggle(opt.value)}
          className={`px-2.5 py-1 text-[10px] uppercase tracking-wider transition-all border-2 ${
            values.includes(opt.value)
              ? 'border-[#1b4332] bg-[#f0fdf4] text-[#1b4332]'
              : 'border-[#e0e0dc] text-[#999] hover:border-[#0a0a0a]'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function QuickAddForm({ latitude, longitude, cible, onSubmit, onClose }: QuickAddFormProps) {
  const [categorie, setCategorie] = useState<ObservationLibre['categorie']>(cible ? 'validation' : 'danger');
  const [commentaire, setCommentaire] = useState('');
  const [auteur, setAuteur] = useState('');
  const [organisation, setOrganisation] = useState('');
  const [role, setRole] = useState<RoleContributeur | ''>('');
  const [indiceJuge, setIndiceJuge] = useState<ObservationLibre['indice_juge'] | undefined>(undefined);
  const [showProfil, setShowProfil] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [dangerFields, setDangerFields] = useState<DangerFields>({});
  const [amenagementFields, setAmenagementFields] = useState<AmenagementFields>({});
  const [validationFields, setValidationFields] = useState<ValidationFields>({ criteres_mal_evalues: [] });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentaire.trim()) return;
    onSubmit({
      id: '',
      latitude,
      longitude,
      commentaire: commentaire.trim(),
      categorie,
      auteur: auteur.trim() || 'Anonyme',
      organisation: organisation.trim() || undefined,
      role: role || undefined,
      date: new Date().toISOString().split('T')[0],
      cible_id: cible?.cible_id,
      indice_juge: categorie === 'validation' ? indiceJuge : undefined,
      upvotes: 0,
      downvotes: 0,
      votedBy: [],
      photos: photos.length > 0 ? photos : undefined,
      danger_fields: categorie === 'danger' ? dangerFields : undefined,
      amenagement_fields: categorie === 'amenagement' ? amenagementFields : undefined,
      validation_fields: categorie === 'validation' ? validationFields : undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white border-2 border-[#0a0a0a] w-full max-w-md shadow-[6px_6px_0_rgba(0,0,0,0.15)] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b-2 border-[#0a0a0a] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="w-5 h-5 text-[#1b4332] shrink-0" />
            <div className="min-w-0">
              {cible ? (
                <>
                  <h2 className="text-[12px] uppercase tracking-wider truncate">{cible.titre_affichage}</h2>
                  <p className="text-[10px] text-[#999] font-mono">
                    Score : {cible.score_indice_calcule.toFixed(1)} – {cible.classe_indice_calcule.replace(/_/g, ' ')}
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-[12px] uppercase tracking-[0.12em]">Nouvelle observation</h2>
                  <p className="text-[10px] text-[#999] font-mono">{latitude.toFixed(5)}, {longitude.toFixed(5)}</p>
                </>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1 border-2 border-transparent hover:border-[#0a0a0a] transition-all" aria-label="Fermer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Categorie */}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.12em] text-[#5c5c5c] mb-2">Type de retour</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategorie(cat.value)}
                  className={`px-3 py-2 border-2 text-[11px] uppercase tracking-wider transition-all text-left ${
                    categorie === cat.value ? cat.activeClass : 'border-[#e0e0dc] hover:border-[#0a0a0a] text-[#5c5c5c]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Index validation */}
          {categorie === 'validation' && (
            <div>
              <label className="block text-[10px] uppercase tracking-[0.12em] text-[#5c5c5c] mb-2">L'indice calculé vous semble</label>
              <div className="flex gap-2">
                {INDICE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setIndiceJuge(opt.value)}
                    className={`flex-1 px-2 py-2 border-2 text-[10px] uppercase tracking-wider transition-all ${
                      indiceJuge === opt.value
                        ? 'border-[#1b4332] bg-[#f0fdf4] text-[#1b4332]'
                        : 'border-[#e0e0dc] hover:border-[#0a0a0a] text-[#5c5c5c]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Champs structurés */}
          {categorie === 'danger' && (
            <div className="space-y-3 border-2 border-[#f72585]/30 bg-[#fff0f6] p-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-[#f72585]">Détails du danger</p>
              <div>
                <label className="block text-[10px] text-[#5c5c5c] mb-1">Usager concerné</label>
                <ChipSelect options={DANGER_USAGERS} value={dangerFields.type_usager} onChange={(v) => setDangerFields((p) => ({ ...p, type_usager: v }))} />
              </div>
              <div>
                <label className="block text-[10px] text-[#5c5c5c] mb-1">Fréquence</label>
                <ChipSelect options={DANGER_FREQUENCES} value={dangerFields.frequence} onChange={(v) => setDangerFields((p) => ({ ...p, frequence: v }))} />
              </div>
              <div>
                <label className="block text-[10px] text-[#5c5c5c] mb-1">Gravité estimée</label>
                <ChipSelect options={DANGER_GRAVITES} value={dangerFields.gravite} onChange={(v) => setDangerFields((p) => ({ ...p, gravite: v }))} />
              </div>
            </div>
          )}

          {categorie === 'amenagement' && (
            <div className="space-y-3 border-2 border-[#ffd60a]/30 bg-[#fffdf0] p-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-[#b8960a]">Détails de l'aménagement</p>
              <div>
                <label className="block text-[10px] text-[#5c5c5c] mb-1">Type d'infrastructure</label>
                <ChipSelect options={AMENAGEMENT_TYPES} value={amenagementFields.type_infra} onChange={(v) => setAmenagementFields((p) => ({ ...p, type_infra: v }))} />
              </div>
              <div>
                <label className="block text-[10px] text-[#5c5c5c] mb-1">Priorité</label>
                <ChipSelect options={AMENAGEMENT_PRIORITES} value={amenagementFields.priorite} onChange={(v) => setAmenagementFields((p) => ({ ...p, priorite: v }))} />
              </div>
            </div>
          )}

          {categorie === 'validation' && (
            <div className="space-y-3 border-2 border-[#2d6a4f]/30 bg-[#f0fdf4] p-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-[#2d6a4f]">Critères à revoir</p>
              <div>
                <label className="block text-[10px] text-[#5c5c5c] mb-1">Quels critères mal évalués ?</label>
                <MultiChipSelect
                  options={VALIDATION_CRITERES}
                  values={validationFields.criteres_mal_evalues || []}
                  onChange={(v) => setValidationFields((p) => ({ ...p, criteres_mal_evalues: v }))}
                />
              </div>
            </div>
          )}

          {/* Question clé */}
          {cible?.question_cle && (
            <div className="border-l-2 border-[#2d6a4f] bg-[#f0fdf4] p-3">
              <p className="text-[12px] text-[#1b4332] leading-relaxed">{cible.question_cle}</p>
            </div>
          )}

          {/* Commentaire */}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.12em] text-[#5c5c5c] mb-1">
              Commentaire <span className="text-red-600">*</span>
            </label>
            <textarea
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              className="w-full px-3 py-2 border-2 border-[#0a0a0a] bg-white resize-none focus:outline-none focus:border-[#2d6a4f] transition-colors text-[13px]"
              rows={3}
              placeholder={
                categorie === 'validation'
                  ? 'Expliquez votre avis sur cet indice...'
                  : 'Décrivez votre observation...'
              }
              required
              autoFocus
            />
          </div>

          {/* Photos */}
          <PhotoPicker photos={photos} onChange={setPhotos} />

          {/* Profil contributeur */}
          <div className="border-2 border-[#e0e0dc] overflow-hidden">
            <button
              type="button"
              onClick={() => setShowProfil(!showProfil)}
              className="w-full px-3 py-2.5 flex items-center justify-between text-[10px] uppercase tracking-[0.12em] text-[#5c5c5c] hover:bg-[#f0f0ec] transition-colors"
            >
              <span>Profil contributeur {organisation && `– ${organisation}`}</span>
              {showProfil ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showProfil && (
              <div className="px-3 pb-3 space-y-3 border-t-2 border-[#e0e0dc] pt-3">
                <div>
                  <label className="block text-[10px] text-[#5c5c5c] mb-1">Votre nom</label>
                  <input
                    type="text"
                    value={auteur}
                    onChange={(e) => setAuteur(e.target.value)}
                    className="w-full px-3 py-1.5 border-2 border-[#0a0a0a] bg-white text-[12px] focus:outline-none focus:border-[#2d6a4f] transition-colors"
                    placeholder="Anonyme"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#5c5c5c] mb-1">Organisation</label>
                  <input
                    type="text"
                    value={organisation}
                    onChange={(e) => setOrganisation(e.target.value)}
                    className="w-full px-3 py-1.5 border-2 border-[#0a0a0a] bg-white text-[12px] focus:outline-none focus:border-[#2d6a4f] transition-colors"
                    placeholder="Ex : Pro Velo Geneve, ADTC..."
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#5c5c5c] mb-1">Rôle</label>
                  <div className="flex flex-wrap gap-1.5">
                    {(Object.entries(ROLE_LABELS) as [RoleContributeur, string][]).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setRole(role === key ? '' : key)}
                        className={`px-2.5 py-1 text-[10px] uppercase tracking-wider transition-all border-2 ${
                          role === key
                            ? 'border-[#1b4332] bg-[#f0fdf4] text-[#1b4332]'
                            : 'border-[#e0e0dc] text-[#999] hover:border-[#0a0a0a]'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* If profil collapsed, show simple name field */}
          {!showProfil && (
            <div>
              <label className="block text-[10px] uppercase tracking-[0.12em] text-[#5c5c5c] mb-1">Votre nom</label>
              <input
                type="text"
                value={auteur}
                onChange={(e) => setAuteur(e.target.value)}
                className="w-full px-3 py-2 border-2 border-[#0a0a0a] bg-white focus:outline-none focus:border-[#2d6a4f] transition-colors text-[13px]"
                placeholder="Anonyme"
              />
            </div>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" type="button" onClick={onClose}>Annuler</Button>
            <Button variant="primary" type="submit" disabled={!commentaire.trim()}>Enregistrer</Button>
          </div>
        </form>
      </div>
    </div>
  );
}