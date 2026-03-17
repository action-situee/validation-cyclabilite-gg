import React, { useState, useMemo, useCallback } from 'react';
import { Toaster, toast } from 'sonner';
import { Plus, X, Menu, Bike, HelpCircle, ClipboardCheck } from 'lucide-react';
import { AppDataProvider, useAppData } from './hooks/useAppData';
import { Sidebar } from './components/Sidebar';
import { Map } from './components/Map';
import { QuickAddForm } from './components/QuickAddForm';
import { CibleThread } from './components/CibleThread';
import { SurveyModal } from './components/SurveyModal';
import { Button } from './components/ui/Button';
import type { Cible, ObservationLibre, CommentaireGeneral } from './types';
import { DEFAULT_CENTER, DEFAULT_ZOOM } from './mock-data/faisceaux';
import { exportGeoJSON, exportCSV } from './utils/export';

const ALL_CLASSES = ['permeabilite_frontiere', 'intersections', 'giratoires', 'alternatives', 'continuite', 'equipements', 'attractivite'];
const ALL_OBS_CATS = ['validation', 'danger', 'amenagement', 'positif'];

function AppInner() {
  const {
    cibles, observations, commentaires, faisceaux,
    addObservation, deleteObservation, voteObservation,
    addCommentaire, deleteCommentaire, getObservationsForCible,
    isOwnObservation, isOwnCommentaire, cibleFaisceauMap,
  } = useAppData();

  const [selectedFaisceau, setSelectedFaisceau] = useState<string | null>(null);
  const [addMode, setAddMode] = useState(false);
  const [pendingPoint, setPendingPoint] = useState<{ lat: number; lng: number; cible?: Cible } | null>(null);
  const [selectedCible, setSelectedCible] = useState<Cible | null>(null);
  const [threadCible, setThreadCible] = useState<Cible | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [flyTo, setFlyTo] = useState<{ center: [number, number]; zoom: number } | null>(null);

  // Corridor visibility
  const [showCorridors, setShowCorridors] = useState(false);

  // Help modal
  const [showHelp, setShowHelp] = useState(false);

  // Survey modal
  const [showSurvey, setShowSurvey] = useState(false);

  // Legend filters
  const [activeClasses, setActiveClasses] = useState<string[]>(ALL_CLASSES);
  const [activeObsCats, setActiveObsCats] = useState<string[]>(ALL_OBS_CATS);

  const toggleClass = useCallback((cls: string) => {
    setActiveClasses((prev) =>
      prev.includes(cls) ? prev.filter((c) => c !== cls) : [...prev, cls]
    );
  }, []);

  const toggleObsCat = useCallback((cat: string) => {
    setActiveObsCats((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }, []);

  // Toggle all classes / all obs cats
  const toggleAllClasses = useCallback(() => {
    setActiveClasses((prev) => prev.length === ALL_CLASSES.length ? [] : [...ALL_CLASSES]);
  }, []);

  const toggleAllObsCats = useCallback(() => {
    setActiveObsCats((prev) => prev.length === ALL_OBS_CATS.length ? [] : [...ALL_OBS_CATS]);
  }, []);

  // Filters
  const filteredCibles = useMemo(() => {
    let result = cibles;
    if (selectedFaisceau) result = result.filter((c) => c.faisceau_id === selectedFaisceau);
    result = result.filter((c) => activeClasses.includes(c.theme_principal));
    return result;
  }, [cibles, selectedFaisceau, activeClasses]);

  const filteredObservations = useMemo(() => {
    let result = observations;
    if (selectedFaisceau) {
      result = result.filter((o) => {
        if (o.cible_id) {
          return cibleFaisceauMap.get(o.cible_id) === selectedFaisceau;
        }
        return true;
      });
    }
    result = result.filter((o) => activeObsCats.includes(o.categorie));
    return result;
  }, [observations, selectedFaisceau, cibleFaisceauMap, activeObsCats]);

  // Faisceau change → flyTo
  const handleFaisceauChange = useCallback((faisceauId: string | null) => {
    setSelectedFaisceau(faisceauId);
    if (faisceauId) {
      const f = faisceaux.find((f) => f.id === faisceauId);
      if (f) setFlyTo({ center: f.center, zoom: f.zoom });
      setShowCorridors(true);
    } else {
      setFlyTo({ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM });
    }
  }, [faisceaux]);

  const handleCibleClick = useCallback((cible: Cible) => {
    setSelectedCible(cible);
    setThreadCible(cible);
    setAddMode(false);
  }, []);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setPendingPoint({ lat, lng });
    setAddMode(false);
  }, []);

  const handleSubmitObservation = useCallback((obs: ObservationLibre) => {
    const savedId = addObservation(obs);
    setPendingPoint(null);
    setSelectedCible(null);
    toast.success('Observation enregistrée', {
      description: 'Merci pour votre contribution.',
      action: {
        label: 'Annuler',
        onClick: () => {
          deleteObservation(savedId);
          toast.info('Observation supprimée');
        },
      },
      duration: 8000,
    });
  }, [addObservation, deleteObservation]);

  const handleAddCommentaire = useCallback((com: CommentaireGeneral) => {
    const savedId = addCommentaire(com);
    toast.success('Commentaire ajouté', {
      action: {
        label: 'Annuler',
        onClick: () => {
          deleteCommentaire(savedId);
          toast.info('Commentaire supprimé');
        },
      },
      duration: 8000,
    });
  }, [addCommentaire, deleteCommentaire]);

  const handleDeleteObservation = useCallback((id: string) => {
    if (!isOwnObservation(id)) return;
    deleteObservation(id);
    toast.info('Votre observation a été supprimée');
  }, [deleteObservation, isOwnObservation]);

  const handleDeleteCommentaire = useCallback((id: string) => {
    if (!isOwnCommentaire(id)) return;
    deleteCommentaire(id);
    toast.info('Votre commentaire a été supprimé');
  }, [deleteCommentaire, isOwnCommentaire]);

  const handleVote = useCallback((obsId: string, direction: 'up' | 'down') => {
    let voterId = localStorage.getItem('cyclabilite_voter_id');
    if (!voterId) {
      voterId = `voter_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      localStorage.setItem('cyclabilite_voter_id', voterId);
    }
    voteObservation(obsId, direction, voterId);
  }, [voteObservation]);

  const handleThreadAddObservation = useCallback(() => {
    if (threadCible) {
      setPendingPoint({ lat: threadCible.latitude, lng: threadCible.longitude, cible: threadCible });
    }
  }, [threadCible]);

  const handleExportGeoJSON = useCallback(() => {
    exportGeoJSON(cibles, observations, commentaires);
    toast.success('Export GeoJSON téléchargé');
  }, [cibles, observations, commentaires]);

  const handleExportCSV = useCallback(() => {
    exportCSV(observations);
    toast.success('Export CSV téléchargé');
  }, [observations]);

  const threadObservations = useMemo(() => {
    if (!threadCible) return [];
    return getObservationsForCible(threadCible.cible_id);
  }, [threadCible, getObservationsForCible]);

  const sidebarProps = {
    selectedFaisceau,
    onFaisceauChange: handleFaisceauChange,
    faisceaux,
    commentaires,
    onAddCommentaire: handleAddCommentaire,
    onDeleteCommentaire: handleDeleteCommentaire,
    observationsCount: filteredObservations.length,
    activeClasses,
    activeObsCats,
    onToggleClass: toggleClass,
    onToggleObsCat: toggleObsCat,
    onToggleAllClasses: toggleAllClasses,
    onToggleAllObsCats: toggleAllObsCats,
    onExportGeoJSON: handleExportGeoJSON,
    onExportCSV: handleExportCSV,
    isOwnCommentaire,
    showCorridors,
    onToggleCorridors: () => setShowCorridors((v) => !v),
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#fafaf8]">
      {/* Barre supérieure – brutalist */}
      <div className="bg-white border-b-2 border-[#0a0a0a] px-4 py-2.5 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 border-2 border-transparent hover:border-[#0a0a0a] transition-all"
            aria-label="Menu"
          >
            <Menu className="w-5 h-5 text-[#0a0a0a]" />
          </button>
          <Bike className="w-5 h-5 text-[#1b4332]" />
          <div>
            <p className="text-[11px] text-[#5c5c5c] tracking-wide font-mono">
              {filteredCibles.length} point{filteredCibles.length > 1 ? 's' : ''}
              {filteredObservations.length > 0 && <> · {filteredObservations.length} retour{filteredObservations.length > 1 ? 's' : ''}</>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSurvey(true)}
            className="p-2 border-2 border-transparent hover:border-[#0a0a0a] transition-all"
            aria-label="Questionnaire"
            title="Questionnaire rapide"
          >
            <ClipboardCheck className="w-5 h-5 text-[#2d6a4f]" />
          </button>

          <button
            onClick={() => setShowHelp(true)}
            className="p-2 border-2 border-transparent hover:border-[#0a0a0a] transition-all"
            aria-label="Mode d'emploi"
            title="Mode d'emploi"
          >
            <HelpCircle className="w-5 h-5 text-[#2d6a4f]" />
          </button>

          <Button
            variant={addMode ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setAddMode(!addMode)}
          >
            {addMode ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span className="hidden sm:inline">{addMode ? 'Annuler' : 'Ajouter'}</span>
          </Button>
        </div>
      </div>

      {/* Bandeau mode ajout */}
      {addMode && (
        <div className="bg-[#1b4332] text-[#f0fdf4] px-4 py-2 text-[11px] uppercase tracking-[0.15em] text-center shrink-0 z-10 border-b-2 border-[#0a0a0a]">
          Cliquez sur la carte pour placer votre observation
        </div>
      )}

      {/* Corps */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar desktop */}
        {sidebarOpen && (
          <div className="hidden lg:block shrink-0">
            <Sidebar {...sidebarProps} />
          </div>
        )}

        {/* Sidebar mobile overlay */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-40">
            <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-80 z-50">
              <Sidebar {...sidebarProps} />
            </div>
            {/* Bouton fermer – toujours visible sur mobile */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-3 right-3 z-[60] w-10 h-10 flex items-center justify-center bg-white border-2 border-[#0a0a0a] text-[#0a0a0a] hover:bg-[#1b4332] hover:text-[#f0fdf4] transition-all"
              style={{ boxShadow: '3px 3px 0 rgba(0,0,0,0.15)' }}
              aria-label="Fermer le panneau"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Carte */}
        <div className="flex-1 relative">
          <Map
            cibles={filteredCibles}
            observations={filteredObservations}
            faisceaux={faisceaux}
            selectedCible={selectedCible}
            onCibleClick={handleCibleClick}
            addMode={addMode}
            onMapClick={handleMapClick}
            flyTo={flyTo}
            selectedFaisceau={selectedFaisceau}
            showCorridors={showCorridors}
            sidebarOpen={sidebarOpen}
          />
        </div>
      </div>

      {/* Fil de discussion par cible */}
      {threadCible && !pendingPoint && (
        <CibleThread
          cible={threadCible}
          observations={threadObservations}
          onClose={() => { setThreadCible(null); setSelectedCible(null); }}
          onVote={handleVote}
          onDelete={handleDeleteObservation}
          onAddObservation={handleThreadAddObservation}
          isOwn={isOwnObservation}
        />
      )}

      {/* Formulaire rapide */}
      {pendingPoint && (
        <QuickAddForm
          latitude={pendingPoint.lat}
          longitude={pendingPoint.lng}
          cible={pendingPoint.cible}
          onSubmit={handleSubmitObservation}
          onClose={() => { setPendingPoint(null); setSelectedCible(null); }}
        />
      )}

      {/* Modal Mode d'emploi */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowHelp(false)} />
          <div className="relative bg-white border-2 border-[#0a0a0a] max-w-lg w-full mx-4 max-h-[85vh] overflow-y-auto" style={{ boxShadow: '8px 8px 0 rgba(0,0,0,0.15)' }}>
            {/* Header */}
            <div className="bg-[#1b4332] p-5 border-b-2 border-[#0a0a0a] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bike className="w-5 h-5 text-[#52b788]" />
                <h2 className="text-[#f0fdf4] text-sm uppercase tracking-[0.15em]">Mode d'emploi</h2>
              </div>
              <button onClick={() => setShowHelp(false)} className="p-1 hover:bg-[#2d6a4f] transition-colors">
                <X className="w-5 h-5 text-[#f0fdf4]" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              {/* Intro */}
              <p className="text-[12px] text-[#5c5c5c] leading-relaxed">
                Cette carte collaborative permet de valider l'indice de cyclabilité le long de deux <strong className="text-[#1b4332]">corridors transfrontaliers</strong> du Grand Genève. Votre expertise de terrain est essentielle.
              </p>

              {/* Appel à l'action principal */}
              <div className="border-2 border-[#1b4332] bg-[#f0fdf4] p-4" style={{ boxShadow: '4px 4px 0 rgba(0,0,0,0.08)' }}>
                <h3 className="text-[11px] uppercase tracking-[0.12em] text-[#1b4332] mb-2">Comment contribuer</h3>
                <ol className="text-[12px] text-[#5c5c5c] space-y-1.5 list-decimal list-inside leading-relaxed">
                  <li><strong className="text-[#1b4332]">Répondre au questionnaire</strong> – icône <ClipboardCheck className="w-3.5 h-3.5 inline text-[#2d6a4f] -mt-0.5" /> dans la barre supérieure</li>
                  <li><strong className="text-[#1b4332]">Commenter les points d'attention</strong> – cliquez sur les pastilles colorées pour voter et discuter</li>
                  <li><strong className="text-[#1b4332]">Ajouter des retours terrain</strong> – « + Ajouter » puis cliquez sur la carte</li>
                  <li><strong className="text-[#1b4332]">Voter</strong> – +1 / -1 sur les contributions existantes</li>
                </ol>
              </div>

              {/* Corridors */}
              <div className="border-2 border-[#2d6a4f] bg-[#f0fdf4] p-4">
                <h3 className="text-[11px] uppercase tracking-[0.12em] text-[#1b4332] mb-2">Les corridors</h3>
                <ul className="text-[12px] text-[#5c5c5c] space-y-1 ml-4 list-disc">
                  <li><strong className="text-[#1b4332]">Saint-Julien – PLO – Genève</strong> – axe sud</li>
                  <li><strong className="text-[#2d6a4f]">Gaillard – Thonex – Eaux-Vives</strong> – axe est</li>
                </ul>
                <p className="text-[11px] text-[#999] mt-2">
                  Sélectionnez un corridor dans le panneau latéral pour zoomer et afficher ses délimitations.
                </p>
              </div>

              {/* Suppression */}
              <div className="border border-[#e0e0dc] p-3">
                <p className="text-[11px] text-[#999] leading-relaxed">
                  <strong className="text-[#5c5c5c]">Note :</strong> seul l'auteur d'une contribution peut la supprimer. Votre identifiant est généré automatiquement – aucun mot de passe requis.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Enquête */}
      <SurveyModal
        open={showSurvey}
        onClose={() => setShowSurvey(false)}
        onSubmitted={() => {
          setShowSurvey(false);
          toast.success('Merci pour votre retour sur l\'indice');
        }}
      />

      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          style: {
            borderRadius: '0',
            border: '2px solid #0a0a0a',
            boxShadow: '3px 3px 0 rgba(0,0,0,0.12)',
            fontFamily: 'Inter, Helvetica Neue, Helvetica, Arial, sans-serif',
            fontSize: '12px',
            letterSpacing: '0.02em',
          },
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppDataProvider>
      <AppInner />
    </AppDataProvider>
  );
}