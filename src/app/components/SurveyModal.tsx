import React, { useEffect, useState } from 'react';
import { X, ClipboardCheck, Send, CheckCircle } from 'lucide-react';
import { contributionsApi } from '../utils/api';
import { getFingerprint, resolveFingerprint } from '../utils/fingerprint';

interface SurveyData {
  id?: string;
  q1: string;
  q2: string;
  q3: string;
  auteur: string;
  date: string;
  owner_fingerprint?: string;
}

const LIKERT_OPTIONS = [
  { value: '1', label: 'Pas du tout' },
  { value: '2', label: 'Plutôt non' },
  { value: '3', label: 'Mitigé' },
  { value: '4', label: 'Plutôt oui' },
  { value: '5', label: 'Tout à fait' },
];

const Q2_OPTIONS = [
  { value: '1', label: 'Très insuffisants' },
  { value: '2', label: 'Insuffisants' },
  { value: '3', label: 'Acceptables' },
  { value: '4', label: 'Pertinents' },
  { value: '5', label: 'Très pertinents' },
];

interface SurveyModalProps {
  open: boolean;
  onClose: () => void;
  onSubmitted: (q3?: string, auteur?: string, date?: string) => void;
}

function LikertQuestion({
  number,
  title,
  options,
  value,
  onChange,
}: {
  number: number;
  title: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset className="space-y-3 pb-4 border-b border-[#ece9e4]">
      <legend className="text-[11px] uppercase tracking-[0.12em] text-[#0a0a0a] pb-1 block w-full">
        <span className="font-mono text-[#2E6A4A] mr-2">Question {number}</span>
        {title}
      </legend>
      <div className="space-y-1.5">
        <div className="mx-auto grid max-w-[240px] grid-cols-5 gap-1 px-1">
          {options.map((option) => (
            <label key={option.value} className="cursor-pointer">
              <input
                type="radio"
                name={`survey_q${number}`}
                value={option.value}
                checked={value === option.value}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              <span
                className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-all text-[13px] font-mono ${
                  value === option.value
                    ? 'bg-[#2E6A4A] text-[#D3E4D7]'
                    : 'text-[#5c5c5c] hover:bg-[#e9efe9]'
                }`}
              >
                {option.value}
              </span>
            </label>
          ))}
        </div>
        <div className="flex items-center justify-between text-[10px] text-[#999] px-1">
          <span>{options[0]?.label}</span>
          <span>{options[options.length - 1]?.label}</span>
        </div>
      </div>
    </fieldset>
  );
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
    if (!open) return;

    void resolveFingerprint()
      .then(() => contributionsApi.getSurveys())
      .then((surveys) => {
        const ownerFingerprint = getFingerprint();
        const existing = (surveys || [])
          .filter((survey) => survey.owner_fingerprint === ownerFingerprint)
          .sort((a, b) => String(b.date).localeCompare(String(a.date)))[0] as SurveyData | undefined;

        if (existing) {
          setPreviousResponse(existing);
          setAlreadyAnswered(true);
          setQ1(existing.q1);
          setQ2(existing.q2);
          setQ3(existing.q3);
          setAuteur(existing.auteur);
        } else {
          setAlreadyAnswered(false);
          setPreviousResponse(null);
          setQ1('');
          setQ2('');
          setQ3('');
          setAuteur('');
        }
      })
      .catch(() => {
        setAlreadyAnswered(false);
        setPreviousResponse(null);
        setQ1('');
        setQ2('');
        setQ3('');
        setAuteur('');
      });

    setSubmitted(false);
  }, [open]);

  if (!open) return null;

  const canSubmit = q1 && q2 && q3.trim();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    const response: SurveyData = {
      q1,
      q2,
      q3: q3.trim(),
      auteur: auteur.trim() || 'Anonyme',
      date: new Date().toISOString().slice(0, 10),
      owner_fingerprint: getFingerprint(),
    };

    void contributionsApi.createSurvey(response).then((saved) => {
      if (!saved) return;

      setPreviousResponse(saved);
      setAlreadyAnswered(true);
      setSubmitted(true);
      setTimeout(() => {
        onSubmitted(saved.q3 || undefined, saved.auteur, saved.date);
      }, 1500);
    });
  };

  const handleReset = () => {
    setAlreadyAnswered(false);
    setPreviousResponse(null);
    setQ1('');
    setQ2('');
    setQ3('');
    setAuteur('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative bg-white border-2 border-[#0a0a0a] max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: '8px 8px 0 rgba(0,0,0,0.15)' }}
      >
        <div className="bg-[#2E6A4A] p-5 border-b border-[#d7d7d7] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="w-5 h-5 text-[#D3E4D7]" />
            <h2 className="text-[#D3E4D7] text-sm uppercase tracking-[0.15em]">Questionnaire</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-[#2E6A4A] transition-colors">
            <X className="w-5 h-5 text-[#D3E4D7]" />
          </button>
        </div>

        {submitted && (
          <div className="p-10 text-center">
            <div className="w-14 h-14 border-2 border-[#2E6A4A] bg-[#D3E4D7] flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-[#2E6A4A]" />
            </div>
            <p className="text-[13px] text-[#2E6A4A] uppercase tracking-[0.12em] mb-2">Merci pour votre retour</p>
            <p className="text-[11px] text-[#999]">Vos réponses ont été enregistrées.</p>
          </div>
        )}

        {!submitted && alreadyAnswered && previousResponse && (
          <div className="p-6 space-y-5">
            <div className="border-2 border-[#2E6A4A] bg-[#D3E4D7] p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-4 h-4 text-[#2E6A4A]" />
                <p className="text-[11px] uppercase tracking-[0.12em] text-[#2E6A4A]">Vous avez déjà répondu</p>
              </div>
              <div className="space-y-3 text-[12px] text-[#5c5c5c]">
                <p>Question 1: {LIKERT_OPTIONS.find((option) => option.value === previousResponse.q1)?.label || previousResponse.q1}</p>
                <p>Question 2: {Q2_OPTIONS.find((option) => option.value === previousResponse.q2)?.label || previousResponse.q2}</p>
                {previousResponse.q3 && <p>Question 3: {previousResponse.q3}</p>}
                <p className="text-[10px] text-[#999] font-mono">{previousResponse.auteur} · {previousResponse.date}</p>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="w-full px-4 py-2.5 text-[11px] uppercase tracking-[0.12em] border-2 border-[#0a0a0a] hover:bg-[#2E6A4A] hover:text-[#D3E4D7] transition-all text-center"
            >
              Modifier ma réponse
            </button>
          </div>
        )}

        {!submitted && !alreadyAnswered && (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <p className="text-[12px] text-[#5c5c5c] leading-relaxed">
              Quelques questions pour recueillir votre avis global sur l’indice de cyclabilité et sa lecture.
            </p>

            <LikertQuestion
              number={1}
              title="Globalement, l’indice est-il un bon outil de travail et de planification ?"
              options={LIKERT_OPTIONS}
              value={q1}
              onChange={setQ1}
            />

            <LikertQuestion
              number={2}
              title="Que pensez-vous des classes et des attributs qui composent l’indice ?"
              options={Q2_OPTIONS}
              value={q2}
              onChange={setQ2}
            />

            <fieldset className="space-y-2.5 pb-4 border-b border-[#ece9e4]">
              <legend className="text-[11px] uppercase tracking-[0.12em] text-[#0a0a0a] pb-1 block w-full">
                <span className="font-mono text-[#2E6A4A] mr-2">Question 3</span>
                Avez-vous des suggestions ou des remarques plus générales ?
              </legend>
              <textarea
                value={q3}
                onChange={(event) => setQ3(event.target.value)}
                placeholder="Vos remarques, suggestions, points d’amélioration..."
                className="w-full px-3 py-2.5 border-2 border-[#0a0a0a] bg-white text-[12px] resize-none focus:outline-none focus:border-[#2E6A4A] transition-colors leading-relaxed"
                rows={4}
                required
              />
              <p className="text-[10px] text-[#999]">Obligatoire</p>
            </fieldset>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-[0.12em] text-[#5c5c5c]">
                Votre nom ou organisation (facultatif)
              </label>
              <input
                type="text"
                value={auteur}
                onChange={(event) => setAuteur(event.target.value)}
                placeholder="Ex: association, service, commune..."
                className="w-full px-3 py-2 border-2 border-[#0a0a0a] bg-white text-[12px] focus:outline-none focus:border-[#2E6A4A] transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-[#0a0a0a] text-[11px] uppercase tracking-[0.15em] transition-all ${
                canSubmit
                  ? 'bg-[#2E6A4A] text-[#D3E4D7] hover:bg-[#2E6A4A]'
                  : 'bg-[#f0f0ee] text-[#ccc] cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
              Envoyer mes réponses
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
