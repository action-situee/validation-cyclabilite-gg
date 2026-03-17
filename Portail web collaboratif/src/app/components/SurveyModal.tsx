import React, { useState, useEffect } from 'react';
import { X, ClipboardCheck, Send, CheckCircle } from 'lucide-react';

const STORAGE_KEY = 'cyclabilite_survey';

interface SurveyData {
  q1: string;
  q2: string;
  q3: string;
  auteur: string;
  date: string;
}

const Q1_OPTIONS = [
  { value: 'tout_a_fait', label: 'Tout à fait' },
  { value: 'plutot_oui', label: 'Plutôt oui' },
  { value: 'partiellement', label: 'Partiellement' },
  { value: 'plutot_non', label: 'Plutôt non' },
  { value: 'pas_du_tout', label: 'Pas du tout' },
  { value: 'ne_sais_pas', label: 'Ne sais pas' },
];

const Q2_OPTIONS = [
  { value: 'tres_pertinents', label: 'Très pertinents et bien calibrés' },
  { value: 'globalement_ok', label: 'Globalement adéquats, ajustements mineurs' },
  { value: 'a_revoir', label: 'À revoir sur certains points' },
  { value: 'insuffisants', label: 'Insuffisants ou mal adaptés' },
  { value: 'ne_sais_pas', label: 'Pas assez de recul pour juger' },
];

interface SurveyModalProps {
  open: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}

export function SurveyModal({ open, onClose, onSubmitted }: SurveyModalProps) {
  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');
  const [q3, setQ3] = useState('');
  const [auteur, setAuteur] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [alreadyAnswered, setAlreadyAnswered] = useState(false);
  const [previousResponse, setPreviousResponse] = useState<SurveyData | null>(null);

  useEffect(() => {
    if (open) {
      try {
        const existing = localStorage.getItem(STORAGE_KEY);
        if (existing) {
          const data = JSON.parse(existing) as SurveyData;
          setPreviousResponse(data);
          setAlreadyAnswered(true);
          setQ1(data.q1);
          setQ2(data.q2);
          setQ3(data.q3);
          setAuteur(data.auteur);
        } else {
          setAlreadyAnswered(false);
          setPreviousResponse(null);
        }
      } catch {
        setAlreadyAnswered(false);
      }
      setSubmitted(false);
    }
  }, [open]);

  if (!open) return null;

  const canSubmit = q1 && q2;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const response: SurveyData = {
      q1,
      q2,
      q3: q3.trim(),
      auteur: auteur.trim() || 'Anonyme',
      date: new Date().toISOString().split('T')[0],
    };

    // Save all responses (append to array for export)
    try {
      const allKey = 'cyclabilite_survey_all';
      const existing = localStorage.getItem(allKey);
      const all: SurveyData[] = existing ? JSON.parse(existing) : [];
      all.push(response);
      localStorage.setItem(allKey, JSON.stringify(all));
    } catch { /* ignore */ }

    // Save current user's response
    localStorage.setItem(STORAGE_KEY, JSON.stringify(response));

    setSubmitted(true);
    setTimeout(() => {
      onSubmitted();
    }, 2000);
  };

  const handleReset = () => {
    setAlreadyAnswered(false);
    setPreviousResponse(null);
    setQ1('');
    setQ2('');
    setQ3('');
    setAuteur('');
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative bg-white border-2 border-[#0a0a0a] max-w-xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: '8px 8px 0 rgba(0,0,0,0.15)' }}
      >
        {/* Header */}
        <div className="bg-[#1b4332] p-5 border-b-2 border-[#0a0a0a] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="w-5 h-5 text-[#52b788]" />
            <h2 className="text-[#f0fdf4] text-sm uppercase tracking-[0.15em]">Questionnaire rapide</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-[#2d6a4f] transition-colors">
            <X className="w-5 h-5 text-[#f0fdf4]" />
          </button>
        </div>

        {/* Submitted state */}
        {submitted && (
          <div className="p-10 text-center">
            <div
              className="w-14 h-14 border-2 border-[#2d6a4f] bg-[#f0fdf4] flex items-center justify-center mx-auto mb-4"
              style={{ boxShadow: '4px 4px 0 rgba(0,0,0,0.08)' }}
            >
              <CheckCircle className="w-7 h-7 text-[#2d6a4f]" />
            </div>
            <p className="text-[13px] text-[#1b4332] uppercase tracking-[0.12em] mb-2">Merci pour votre retour</p>
            <p className="text-[11px] text-[#999]">Vos réponses ont été enregistrées.</p>
          </div>
        )}

        {/* Already answered – show summary */}
        {!submitted && alreadyAnswered && previousResponse && (
          <div className="p-6 space-y-5">
            <div className="border-2 border-[#2d6a4f] bg-[#f0fdf4] p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-4 h-4 text-[#2d6a4f]" />
                <p className="text-[11px] uppercase tracking-[0.12em] text-[#1b4332]">Vous avez déjà répondu</p>
              </div>
              <div className="space-y-3 text-[12px] text-[#5c5c5c]">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#999]">Outil de travail</span>
                  <p className="text-[#0a0a0a] mt-0.5">{Q1_OPTIONS.find(o => o.value === previousResponse.q1)?.label || previousResponse.q1}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#999]">Classes & attributs</span>
                  <p className="text-[#0a0a0a] mt-0.5">{Q2_OPTIONS.find(o => o.value === previousResponse.q2)?.label || previousResponse.q2}</p>
                </div>
                {previousResponse.q3 && (
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-[#999]">Remarques</span>
                    <p className="text-[#0a0a0a] mt-0.5 leading-relaxed">{previousResponse.q3}</p>
                  </div>
                )}
                <p className="text-[10px] text-[#999] font-mono">{previousResponse.auteur} – {previousResponse.date}</p>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="w-full px-4 py-2.5 text-[11px] uppercase tracking-[0.12em] border-2 border-[#0a0a0a] hover:bg-[#1b4332] hover:text-[#f0fdf4] transition-all text-center"
            >
              Modifier ma réponse
            </button>
          </div>
        )}

        {/* Form */}
        {!submitted && !alreadyAnswered && (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <p className="text-[12px] text-[#5c5c5c] leading-relaxed">
              Quelques questions pour recueillir votre avis global sur <strong className="text-[#1b4332]">l'indice de cyclabilité</strong> et son utilisation comme outil de planification transfrontalière.
            </p>

            {/* Q1 – closed */}
            <fieldset className="space-y-2.5">
              <legend className="text-[11px] uppercase tracking-[0.12em] text-[#0a0a0a] border-b-2 border-[#0a0a0a] pb-2 mb-1 block w-full">
                <span className="font-mono text-[#2d6a4f] mr-2">01</span>
                Globalement, l'indice vous semble-t-il être un bon outil de travail et de planification ?
              </legend>
              <div className="grid grid-cols-2 gap-1.5">
                {Q1_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-2.5 px-3 py-2.5 border-2 cursor-pointer transition-all text-[11px] ${
                      q1 === opt.value
                        ? 'border-[#1b4332] bg-[#f0fdf4] text-[#1b4332]'
                        : 'border-[#e0e0dc] text-[#5c5c5c] hover:border-[#999]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="survey_q1"
                      value={opt.value}
                      checked={q1 === opt.value}
                      onChange={() => setQ1(opt.value)}
                      className="sr-only"
                    />
                    <span
                      className={`w-3 h-3 border-2 shrink-0 flex items-center justify-center transition-all ${
                        q1 === opt.value
                          ? 'border-[#1b4332] bg-[#1b4332]'
                          : 'border-[#ccc]'
                      }`}
                    >
                      {q1 === opt.value && (
                        <span className="w-1.5 h-1.5 bg-white" />
                      )}
                    </span>
                    {opt.label}
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Q2 – closed */}
            <fieldset className="space-y-2.5">
              <legend className="text-[11px] uppercase tracking-[0.12em] text-[#0a0a0a] border-b-2 border-[#0a0a0a] pb-2 mb-1 block w-full">
                <span className="font-mono text-[#2d6a4f] mr-2">02</span>
                Que pensez-vous des classes et des attributs qui composent l'indice ?
              </legend>
              <div className="space-y-1.5">
                {Q2_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-2.5 px-3 py-2.5 border-2 cursor-pointer transition-all text-[11px] ${
                      q2 === opt.value
                        ? 'border-[#1b4332] bg-[#f0fdf4] text-[#1b4332]'
                        : 'border-[#e0e0dc] text-[#5c5c5c] hover:border-[#999]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="survey_q2"
                      value={opt.value}
                      checked={q2 === opt.value}
                      onChange={() => setQ2(opt.value)}
                      className="sr-only"
                    />
                    <span
                      className={`w-3 h-3 border-2 shrink-0 flex items-center justify-center transition-all ${
                        q2 === opt.value
                          ? 'border-[#1b4332] bg-[#1b4332]'
                          : 'border-[#ccc]'
                      }`}
                    >
                      {q2 === opt.value && (
                        <span className="w-1.5 h-1.5 bg-white" />
                      )}
                    </span>
                    {opt.label}
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Q3 – free text */}
            <fieldset className="space-y-2.5">
              <legend className="text-[11px] uppercase tracking-[0.12em] text-[#0a0a0a] border-b-2 border-[#0a0a0a] pb-2 mb-1 block w-full">
                <span className="font-mono text-[#2d6a4f] mr-2">03</span>
                Avez-vous des suggestions ou des remarques plus générales ?
              </legend>
              <textarea
                value={q3}
                onChange={(e) => setQ3(e.target.value)}
                placeholder="Vos remarques, suggestions, points d'amélioration..."
                className="w-full px-3 py-2.5 border-2 border-[#0a0a0a] bg-white text-[12px] resize-none focus:outline-none focus:border-[#2d6a4f] transition-colors leading-relaxed"
                rows={4}
              />
              <p className="text-[10px] text-[#999]">Facultatif – champ libre</p>
            </fieldset>

            {/* Author */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-[0.12em] text-[#5c5c5c]">
                Votre nom ou organisation (facultatif)
              </label>
              <input
                type="text"
                value={auteur}
                onChange={(e) => setAuteur(e.target.value)}
                placeholder="Ex: ADTC, Mairie de St-Julien, etc."
                className="w-full px-3 py-2 border-2 border-[#0a0a0a] bg-white text-[12px] focus:outline-none focus:border-[#2d6a4f] transition-colors"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-[#0a0a0a] text-[11px] uppercase tracking-[0.15em] transition-all ${
                canSubmit
                  ? 'bg-[#1b4332] text-[#f0fdf4] hover:bg-[#2d6a4f]'
                  : 'bg-[#f0f0ee] text-[#ccc] cursor-not-allowed'
              }`}
              style={canSubmit ? { boxShadow: '4px 4px 0 rgba(0,0,0,0.12)' } : {}}
            >
              <Send className="w-4 h-4" />
              Envoyer mes réponses
            </button>

            {!canSubmit && (
              <p className="text-[10px] text-[#999] text-center">
                Veuillez répondre aux questions 01 et 02 pour envoyer.
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}