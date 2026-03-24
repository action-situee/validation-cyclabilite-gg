import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCcw } from 'lucide-react';
import type { CommentaireGeneral, ObservationLibre, SurveyResponse } from '../types';
import { contributionsApi } from '../utils/api';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

type AdminTab = 'observations' | 'commentaires' | 'surveys';

type LoadState = {
  observations: ObservationLibre[];
  commentaires: CommentaireGeneral[];
  surveys: SurveyResponse[];
};

function formatDate(date?: string, heure?: string) {
  if (!date) return '-';
  return heure ? `${date} ${heure}` : date;
}

function truncate(value: string, maxLength = 120) {
  if (!value) return '';
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value;
}

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>('observations');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<LoadState>({ observations: [], commentaires: [], surveys: [] });

  const loadData = async () => {
    setLoading(true);
    setError(null);

    const [observations, commentaires, surveys] = await Promise.all([
      contributionsApi.getObservations(),
      contributionsApi.getCommentaires(),
      contributionsApi.getSurveys(),
    ]);

    if (!observations || !commentaires || !surveys) {
      setError('Lecture admin indisponible. Verifiez le binding D1 et les endpoints /api.');
      setLoading(false);
      return;
    }

    setData({ observations, commentaires, surveys });
    setLoading(false);
  };

  useEffect(() => {
    void loadData();
  }, []);

  const sortedObservations = useMemo(
    () => [...data.observations].sort((a, b) => `${b.date} ${b.heure || ''}`.localeCompare(`${a.date} ${a.heure || ''}`)),
    [data.observations],
  );
  const sortedCommentaires = useMemo(
    () => [...data.commentaires].sort((a, b) => `${b.date} ${b.heure || ''}`.localeCompare(`${a.date} ${a.heure || ''}`)),
    [data.commentaires],
  );
  const sortedSurveys = useMemo(
    () => [...data.surveys].sort((a, b) => `${b.date}`.localeCompare(`${a.date}`)),
    [data.surveys],
  );

  return (
    <div className="min-h-screen bg-[#E5EEE6] text-[#0a0a0a]">
      <div className="border-b-2 border-[#0a0a0a] bg-white px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#5c5c5c]">Administration</p>
            <h1 className="text-[18px] font-semibold uppercase tracking-[0.08em]">Lecture tabulaire des remontees</h1>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="#"
              className="inline-flex h-9 items-center justify-center border-2 border-[#0a0a0a] bg-white px-4 text-[12px] font-semibold uppercase tracking-[0.08em] hover:bg-[#f2f5f2]"
            >
              Retour carte
            </a>
            <Button
              variant="outline"
              onClick={() => void loadData()}
              className="border-2 border-[#0a0a0a] bg-white text-[12px] font-semibold uppercase tracking-[0.08em]"
            >
              <RefreshCcw className="h-4 w-4" />
              Actualiser
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1600px] flex-col gap-6 px-4 py-6 sm:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { key: 'observations', label: 'Points', count: data.observations.length },
            { key: 'commentaires', label: 'Commentaires', count: data.commentaires.length },
            { key: 'surveys', label: 'Questionnaires', count: data.surveys.length },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key as AdminTab)}
              className={`border-2 px-4 py-4 text-left transition-all ${
                activeTab === item.key
                  ? 'border-[#0a0a0a] bg-[#2E6A4A] text-[#D3E4D7]'
                  : 'border-[#0a0a0a] bg-white hover:bg-[#f2f5f2]'
              }`}
            >
              <p className="text-[10px] uppercase tracking-[0.15em] opacity-80">{item.label}</p>
              <p className="mt-2 text-[30px] font-semibold leading-none">{item.count}</p>
            </button>
          ))}
        </div>

        {error && (
          <div className="border-2 border-[#0a0a0a] bg-[#fff3d8] px-4 py-3 text-[13px]">
            {error}
          </div>
        )}

        <div className="border-2 border-[#0a0a0a] bg-white">
          <div className="border-b-2 border-[#0a0a0a] px-4 py-3">
            <h2 className="text-[12px] uppercase tracking-[0.14em]">
              {activeTab === 'observations' && 'Observations localisees'}
              {activeTab === 'commentaires' && 'Commentaires generaux'}
              {activeTab === 'surveys' && 'Questionnaires'}
            </h2>
          </div>

          {loading ? (
            <div className="px-4 py-8 text-[13px] text-[#5c5c5c]">Chargement des donnees...</div>
          ) : (
            <div className="px-2 py-2 sm:px-4 sm:py-4">
              {activeTab === 'observations' && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Faisceau</TableHead>
                      <TableHead>Categorie</TableHead>
                      <TableHead>Auteur</TableHead>
                      <TableHead>Commentaire</TableHead>
                      <TableHead>Votes</TableHead>
                      <TableHead>Commentaires</TableHead>
                      <TableHead>Coordonnees</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedObservations.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{formatDate(item.date, item.heure)}</TableCell>
                        <TableCell>{item.faisceau_id || '-'}</TableCell>
                        <TableCell>{item.categorie}</TableCell>
                        <TableCell>{item.auteur}</TableCell>
                        <TableCell className="max-w-[440px] whitespace-normal">{truncate(item.commentaire, 180)}</TableCell>
                        <TableCell>{item.upvotes}/{item.downvotes}</TableCell>
                        <TableCell>{item.commentaires?.length || 0}</TableCell>
                        <TableCell>{item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {activeTab === 'commentaires' && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Faisceau</TableHead>
                      <TableHead>Auteur</TableHead>
                      <TableHead>Texte</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedCommentaires.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{formatDate(item.date, item.heure)}</TableCell>
                        <TableCell>{item.faisceau_id || '-'}</TableCell>
                        <TableCell>{item.auteur}</TableCell>
                        <TableCell className="max-w-[720px] whitespace-normal">{item.texte}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {activeTab === 'surveys' && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Faisceau</TableHead>
                      <TableHead>Auteur</TableHead>
                      <TableHead>Q1</TableHead>
                      <TableHead>Q2</TableHead>
                      <TableHead>Suggestion</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedSurveys.map((item) => (
                      <TableRow key={item.id || `${item.date}-${item.auteur}-${item.q1}`}>
                        <TableCell>{item.date}</TableCell>
                        <TableCell>{item.faisceau_id || '-'}</TableCell>
                        <TableCell>{item.auteur}</TableCell>
                        <TableCell>{item.q1}</TableCell>
                        <TableCell>{item.q2}</TableCell>
                        <TableCell className="max-w-[720px] whitespace-normal">{item.q3}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}