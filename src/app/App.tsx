import React, { Suspense, lazy, useState, useMemo, useCallback, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { Plus, X, Bike, HelpCircle, ClipboardCheck, PanelLeft, PanelRight, PanelsLeftRight } from 'lucide-react';
import { AppDataProvider, useAppData } from './hooks/useAppData';
import { Sidebar } from './components/Sidebar';
import { ValidationSidebar } from './components/ValidationSidebar';
import { Button } from './components/ui/Button';
import type { BikeSegment, ObservationLibre, CommentaireGeneral } from './types';
import { VALUE_THRESHOLDS, type BikeMetricKey } from './config/bikeMetrics';
import { DEFAULT_BASEMAP, type BasemapMode } from './config/basemaps';
import { DEFAULT_CENTER, DEFAULT_ZOOM } from './mock-data/faisceaux';
import { exportGeoJSON, exportCSV } from './utils/export';

const Map = lazy(() =>
  import('./components/Map').then((module) => ({ default: module.Map })),
);
const QuickAddForm = lazy(() =>
  import('./components/QuickAddForm').then((module) => ({ default: module.QuickAddForm })),
);
const ObservationThread = lazy(() =>
  import('./components/ObservationThread').then((module) => ({ default: module.ObservationThread })),
);
const SurveyModal = lazy(() =>
  import('./components/SurveyModal').then((module) => ({ default: module.SurveyModal })),
);

type SidebarMode = 'none' | 'left' | 'right' | 'both';

function AppInner() {
  const {
    observations, commentaires, faisceaux,
    addObservation, deleteObservation, voteObservation,
    addObservationComment, addCommentaire, updateCommentaire, deleteCommentaire,
    isOwnObservation, isOwnCommentaire,
  } = useAppData();

  const [selectedFaisceau, setSelectedFaisceau] = useState<string | null>(null);
  const [addMode, setAddMode] = useState(false);
  const [pendingPoint, setPendingPoint] = useState<{ lat: number; lng: number; segment?: BikeSegment } | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<BikeSegment | null>(null);
  const [selectedObservation, setSelectedObservation] = useState<ObservationLibre | null>(null);
  const [hoveredSegment, setHoveredSegment] = useState<BikeSegment | null>(null);
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>('both');
  const [mobileSidebarVisible, setMobileSidebarVisible] = useState(false);
  const [flyTo, setFlyTo] = useState<{ center: [number, number]; zoom: number } | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<BikeMetricKey>('bike_index');
  const [basemap, setBasemap] = useState<BasemapMode>(DEFAULT_BASEMAP);
  const [quantileMap, setQuantileMap] = useState<Partial<Record<BikeMetricKey, number[]>>>({});

  // Faisceau visibility (délimitations)
  const [showFaisceaux, setShowFaisceaux] = useState(false);

  // Help modal
  const [showHelp, setShowHelp] = useState(false);

  // Survey modal
  const [showSurvey, setShowSurvey] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch('/data/atlas/bike-metric-quantiles.json')
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (cancelled || !payload || typeof payload !== 'object') return;
        const metrics = payload.metrics && typeof payload.metrics === 'object'
          ? payload.metrics
          : payload;

        const nextQuantileMap = {} as Partial<Record<BikeMetricKey, number[]>>;
        (Object.keys(metrics) as BikeMetricKey[]).forEach((key) => {
          const thresholds = metrics[key];
          if (Array.isArray(thresholds) && thresholds.length > 0) {
            nextQuantileMap[key] = thresholds.map((value) => Number(value));
          }
        });

        setQuantileMap(nextQuantileMap);
      })
      .catch(() => {
        if (!cancelled) {
          setQuantileMap({});
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredObservations = useMemo(() => {
    let result = observations;
    if (selectedFaisceau) {
      result = result.filter((o) => {
        if (o.faisceau_id) {
          return o.faisceau_id === selectedFaisceau;
        }
        return true;
      });
    }
    return result;
  }, [observations, selectedFaisceau]);

  // Faisceau change → flyTo
  const handleFaisceauChange = useCallback((faisceauId: string | null) => {
    setSelectedFaisceau(faisceauId);
    setSelectedSegment(null);
    if (faisceauId) {
      const f = faisceaux.find((f) => f.id === faisceauId);
      if (f) setFlyTo({ center: f.center, zoom: f.zoom });
      setShowFaisceaux(true);
    } else {
      setFlyTo({ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM });
    }
  }, [faisceaux]);

  const handleMapClick = useCallback((lat: number, lng: number, segment?: BikeSegment | null) => {
    setPendingPoint({ lat, lng, segment: segment || undefined });
    setSelectedObservation(null);
    setSelectedSegment(segment || null);
    setAddMode(false);
  }, []);

  const handleMapBackgroundClick = useCallback(() => {
    setSelectedSegment(null);
    setSelectedObservation(null);
  }, []);

  const handleHoverSegment = useCallback((segment: BikeSegment | null) => {
    setHoveredSegment((previous) => {
      if (!segment && !previous) return previous;
      if (segment && previous?.segment_id === segment.segment_id) return previous;
      return segment;
    });
  }, []);

  const handleSegmentClick = useCallback((segment: BikeSegment) => {
    setSelectedSegment(segment);
    setSelectedObservation(null);

    if (addMode) {
      setPendingPoint({
        lat: segment.center[0],
        lng: segment.center[1],
        segment,
      });
      setAddMode(false);
      return;
    }
  }, [addMode]);

  const handleObservationClick = useCallback((observation: ObservationLibre) => {
    setSelectedObservation(observation);
    setSelectedSegment(null);
    setAddMode(false);
  }, []);

  const handleSubmitObservation = useCallback((obs: ObservationLibre) => {
    const savedId = addObservation(obs);
    setPendingPoint(null);
    setSelectedSegment(null);
    setSelectedObservation(null);
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

  const handleUpdateCommentaire = useCallback((com: CommentaireGeneral) => {
    if (!isOwnCommentaire(com.id)) return;
    updateCommentaire(com);
    toast.success('Commentaire mis à jour');
  }, [isOwnCommentaire, updateCommentaire]);

  const handleDeleteObservation = useCallback((id: string) => {
    if (!isOwnObservation(id)) return;
    deleteObservation(id);
    setSelectedObservation((current) => (current?.id === id ? null : current));
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

  const handleAddObservationComment = useCallback((observationId: string, texte: string) => {
    addObservationComment(observationId, texte);
  }, [addObservationComment]);

  const handleExportGeoJSON = useCallback(() => {
    exportGeoJSON([], observations, commentaires);
    toast.success('Export GeoJSON téléchargé');
  }, [observations, commentaires]);

  const handleExportCSV = useCallback(() => {
    exportCSV(observations);
    toast.success('Export CSV téléchargé');
  }, [observations]);

  const activeThresholds = useMemo(() => {
    const thresholds = quantileMap[selectedMetric];
    return Array.isArray(thresholds) && thresholds.length > 0 ? thresholds : [...VALUE_THRESHOLDS];
  }, [quantileMap, selectedMetric]);

  const currentSelectedObservation = useMemo(() => {
    if (!selectedObservation) return null;
    return observations.find((observation) => observation.id === selectedObservation.id) || null;
  }, [observations, selectedObservation]);

  const leftSidebarOpen = sidebarMode === 'left' || sidebarMode === 'both';
  const rightSidebarOpen = sidebarMode === 'right' || sidebarMode === 'both';
  const sidebarLayout = `${leftSidebarOpen ? 'left' : 'none'}-${rightSidebarOpen ? 'right' : 'none'}`;
  const shouldPulseAddButton = Boolean(selectedSegment && !pendingPoint && !addMode);

  const handleSelectSidebarMode = useCallback((mode: SidebarMode) => {
    setSidebarMode((previous) => {
      const nextMode = previous === mode ? 'none' : mode;
      if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches) {
        setMobileSidebarVisible(nextMode !== 'none');
      }
      return nextMode;
    });
  }, []);

  const handleAddButtonClick = useCallback(() => {
    if (addMode) {
      setAddMode(false);
      return;
    }

    if (selectedSegment) {
      setPendingPoint({
        lat: selectedSegment.center[0],
        lng: selectedSegment.center[1],
        segment: selectedSegment,
      });
      return;
    }

    setAddMode(true);
  }, [addMode, selectedSegment]);

  const rightSidebarProps = {
    selectedMetric,
    onMetricChange: setSelectedMetric,
    hoveredSegment: hoveredSegment || selectedSegment,
    hoveredSegmentSource: hoveredSegment ? 'hover' : selectedSegment ? 'selected' : 'none',
    activeThresholds,
  };

  const leftSidebarProps = {
    selectedFaisceau,
    onFaisceauChange: handleFaisceauChange,
    faisceaux,
    onOpenSurvey: () => setShowSurvey(true),
    showFaisceaux,
    onToggleFaisceaux: () => setShowFaisceaux((value) => !value),
    commentaires,
    onAddCommentaire: handleAddCommentaire,
    onUpdateCommentaire: handleUpdateCommentaire,
    onDeleteCommentaire: handleDeleteCommentaire,
    observationsCount: filteredObservations.length,
    onExportGeoJSON: handleExportGeoJSON,
    onExportCSV: handleExportCSV,
    isOwnCommentaire,
  };

  const sidebarToggleButtons = [
    {
      key: 'left',
      label: 'Afficher la sidebar gauche',
      active: sidebarMode === 'left',
      Icon: PanelLeft,
      onClick: () => handleSelectSidebarMode('left'),
    },
    {
      key: 'right',
      label: 'Afficher la sidebar droite',
      active: sidebarMode === 'right',
      Icon: PanelRight,
      onClick: () => handleSelectSidebarMode('right'),
    },
    {
      key: 'both',
      label: 'Afficher les deux sidebars',
      active: sidebarMode === 'both',
      Icon: PanelsLeftRight,
      onClick: () => handleSelectSidebarMode('both'),
    },
  ];

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#E5EEE6]">
      {/* Barre supérieure – brutalist */}
      <div className="bg-white border-b-2 border-[#0a0a0a] px-3 py-2.5 sm:px-4 z-20 shrink-0">
        <div className="grid grid-cols-[auto_1fr] items-start gap-x-3 gap-y-2 sm:grid-cols-[auto_1fr_auto] sm:items-center">
          <div className="flex items-center gap-4 min-w-0 shrink-0">
            <button
              onClick={() => setShowHelp(true)}
              className="p-1.5 sm:p-2 border-2 border-transparent hover:border-[#0a0a0a] transition-all"
              aria-label="Mode d'emploi"
              title="Mode d'emploi"
            >
              <HelpCircle className="w-5 h-5 text-[#2E6A4A]" />
            </button>
          </div>

          <div className="min-w-0 sm:px-4 sm:text-center">
            <h1 className="text-[12px] sm:text-[14px] leading-tight text-[#0a0a0a] uppercase tracking-[0.08em]">
              Validation de l&apos;indice de cyclabilite
            </h1>
            <p className="hidden sm:block text-[10px] leading-tight text-[#5c5c5c] uppercase tracking-[0.12em]">
              sur deux faisceaux transfrontaliers
            </p>
            <p className="sm:hidden text-[9px] leading-tight text-[#5c5c5c] uppercase tracking-[0.12em]">
              Grand Geneve
            </p>
          </div>

          <div className="col-span-2 flex flex-wrap items-center gap-1.5 sm:col-span-1 sm:justify-end sm:gap-2 shrink-0">
            <div
              className="flex items-center gap-0.5 rounded-full bg-[#DCE7DE] p-0.5"
              aria-label="Controle des sidebars"
            >
              {sidebarToggleButtons.map(({ key, label, active, Icon, onClick }) => (
                <button
                  key={key}
                  onClick={onClick}
                  className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full transition-all ${
                    active
                      ? 'bg-[#2E6A4A] text-[#D3E4D7] shadow-[0_2px_6px_rgba(46,106,74,0.22)]'
                      : 'bg-transparent text-[#5c5c5c] hover:bg-white/85'
                  }`}
                  aria-label={label}
                  title={label}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* Bandeau mode ajout */}
      {addMode && (
        <div className="bg-[#2E6A4A] text-[#D3E4D7] px-4 py-2 text-[11px] uppercase tracking-[0.15em] text-center shrink-0 z-10 border-b-2 border-[#0a0a0a]">
          Cliquez sur la carte pour ajouter un point rattache au troncon visible le plus proche
        </div>
      )}

      {/* Corps */}
      <div className="flex-1 flex overflow-hidden">
        {leftSidebarOpen && (
          <div className="hidden lg:block shrink-0">
            <ValidationSidebar {...leftSidebarProps} />
          </div>
        )}

        {/* Carte */}
        <div className="flex-1 relative">
          <div className="absolute top-3 right-3 z-30 pointer-events-auto">
            <Button
              variant={addMode ? 'primary' : 'outline'}
              size="lg"
              onClick={handleAddButtonClick}
              className={`${shouldPulseAddButton && !addMode ? 'animate-pulse' : ''} !bg-white text-[13px] font-bold uppercase tracking-[0.08em] px-4 py-3 border-2 border-[#0a0a0a] shadow-[0_4px_14px_rgba(10,10,10,0.22)]`}
            >
              {addMode ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              <span>{addMode ? 'Annuler' : 'Ajouter'}</span>
            </Button>
          </div>

          <Suspense
            fallback={
              <div className="w-full h-full flex items-center justify-center bg-[#eae8e0]">
                <div className="text-center p-4 border-2 border-[#0a0a0a] bg-white">
                  <p className="text-[12px] uppercase tracking-[0.12em] text-[#2E6A4A] mb-2">
                    Chargement de la carte
                  </p>
                  <p className="text-[11px] text-[#5c5c5c]">
                    Chargement des tuiles segmentaires du Grand Geneve...
                  </p>
                </div>
              </div>
            }
          >
            <Map
              cibles={[]}
              observations={filteredObservations}
              faisceaux={faisceaux}
              selectedCible={null}
              selectedSegment={selectedSegment}
              selectedMetric={selectedMetric}
              metricThresholds={activeThresholds}
              basemap={basemap}
              onBasemapChange={setBasemap}
              onCibleClick={() => {}}
              onObservationClick={handleObservationClick}
              onSegmentClick={handleSegmentClick}
              onHoverSegment={handleHoverSegment}
              onMapBackgroundClick={handleMapBackgroundClick}
              addMode={addMode}
              onMapClick={handleMapClick}
              flyTo={flyTo}
              selectedFaisceau={selectedFaisceau}
              showFaisceaux={showFaisceaux}
              sidebarLayout={sidebarLayout}
            />
          </Suspense>
        </div>

        {/* Sidebar desktop */}
        {rightSidebarOpen && (
          <div className="hidden lg:block shrink-0">
            <Sidebar {...rightSidebarProps} />
          </div>
        )}

        {/* Sidebar mobile overlay */}
        {mobileSidebarVisible && (
          <div className="lg:hidden fixed inset-0 z-40">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setMobileSidebarVisible(false)}
            />
            <div className="absolute inset-0 overflow-y-auto p-3 pt-14">
              <div className="mx-auto max-w-sm space-y-3">
                {leftSidebarOpen && <ValidationSidebar {...leftSidebarProps} className="w-full" />}
                {rightSidebarOpen && <Sidebar {...rightSidebarProps} className="w-full" />}
              </div>
            </div>
            <div
              className="absolute top-3 right-3 z-[60] flex items-center gap-0.5 rounded-full bg-white/95 p-0.5 shadow-[0_4px_18px_rgba(10,10,10,0.16)]"
            >
              {sidebarToggleButtons.map(({ key, label, active, Icon, onClick }) => (
                <button
                  key={key}
                  onClick={onClick}
                  className={`w-9 h-9 flex items-center justify-center rounded-full transition-all ${
                    active
                      ? 'bg-[#2E6A4A] text-[#D3E4D7] shadow-[0_2px_6px_rgba(46,106,74,0.22)]'
                      : 'bg-transparent text-[#5c5c5c] hover:bg-[#F3F6F3]'
                  }`}
                  aria-label={label}
                  title={label}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fil de discussion par remontée */}
      {currentSelectedObservation && !pendingPoint && (
        <Suspense fallback={null}>
          <ObservationThread
            observation={currentSelectedObservation}
            onClose={() => setSelectedObservation(null)}
            onVote={handleVote}
            onDelete={handleDeleteObservation}
            onAddComment={handleAddObservationComment}
            isOwn={isOwnObservation}
          />
        </Suspense>
      )}

      {/* Formulaire rapide */}
      {pendingPoint && (
        <Suspense fallback={null}>
          <QuickAddForm
            latitude={pendingPoint.lat}
            longitude={pendingPoint.lng}
            segment={pendingPoint.segment}
            onSubmit={handleSubmitObservation}
            onClose={() => { setPendingPoint(null); }}
          />
        </Suspense>
      )}

      {/* Modal Mode d'emploi */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowHelp(false)} />
          <div className="relative bg-white border-2 border-[#0a0a0a] max-w-lg w-full mx-4 max-h-[85vh] overflow-y-auto" style={{ boxShadow: '8px 8px 0 rgba(0,0,0,0.15)' }}>
            {/* Header */}
            <div className="bg-[#2E6A4A] p-5 border-b-2 border-[#0a0a0a] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bike className="w-5 h-5 text-[#D3E4D7]" />
                <h2 className="text-[#D3E4D7] text-sm uppercase tracking-[0.15em]">Mode d'emploi</h2>
              </div>
              <button onClick={() => setShowHelp(false)} className="p-1 hover:bg-[#2E6A4A] transition-colors">
                <X className="w-5 h-5 text-[#D3E4D7]" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              {/* Intro */}
              <p className="text-[12px] text-[#5c5c5c] leading-relaxed">
                Cette interface permet de visualiser et commenter l&apos;indice de cyclabilite sur <strong className="text-[#2E6A4A]">deux faisceaux transfrontaliers du Grand Geneve</strong>. Suivez les 4 etapes ci-dessous pour contribuer. Merci pour votre participation !
              </p>

              {/* Séquence */}
              <div className="border-2 border-[#2E6A4A] bg-white p-4 space-y-3" style={{ boxShadow: '4px 4px 0 rgba(0,0,0,0.08)' }}>
                <h3 className="text-[11px] uppercase tracking-[0.12em] text-[#2E6A4A]">Sequence de contribution</h3>
                {[
                  { n: '1', title: 'Questionnaire general', desc: 'Bouton dans la sidebar droite (icone presse-papier). Votre avis global sur l\'indice et vos suggestions y sont enregistres.' },
                  { n: '2', title: 'Choisir un corridor', desc: 'Selecteur dans la sidebar gauche. Zoomez sur l\'un des deux axes transfrontaliers pour evaluer les troncons en detail.' },
                  { n: '3', title: 'Poser des points sur la carte', desc: 'Bouton + Ajouter dans le header, puis cliquez sur la carte. Le point est automatiquement rattache au troncon le plus proche.' },
                  { n: '4', title: 'Laisser un commentaire general', desc: 'Section Commentaires dans la sidebar gauche. Pour les remarques qui ne se rattachent pas a un troncon precis.' },
                ].map(({ n, title, desc }) => (
                  <div key={n} className="flex items-start gap-3">
                    <span className="shrink-0 w-6 h-6 flex items-center justify-center bg-[#2E6A4A] text-[#D3E4D7] text-[10px] font-mono font-bold">{n}</span>
                    <div>
                      <p className="text-[12px] text-[#0a0a0a] font-semibold leading-tight mb-0.5">{title}</p>
                      <p className="text-[11px] text-[#5c5c5c] leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Corridors */}
              <div className="border-2 border-[#2E6A4A] bg-white p-4">
                <h3 className="text-[11px] uppercase tracking-[0.12em] text-[#2E6A4A] mb-2">Les deux corridors</h3>
                <ul className="text-[12px] text-[#5c5c5c] space-y-1 ml-4 list-disc">
                  <li><strong className="text-[#2E6A4A]">Saint-Julien – PLO – Geneve</strong></li>
                  <li><strong className="text-[#2E6A4A]">Gaillard – Thonex – Eaux-Vives</strong></li>
                </ul>
                <p className="text-[11px] text-[#999] mt-2">
                  La carte reste disponible a l&apos;echelle du territoire complet. Le selecteur de corridor sert a zoomer et a filtrer les contributions.
                </p>
              </div>

              {/* Note */}
              <div className="border border-[#e0e0dc] p-3">
                <p className="text-[11px] text-[#999] leading-relaxed">
                  <strong className="text-[#5c5c5c]">Note :</strong> seul l&apos;auteur d&apos;une contribution peut la supprimer. Votre identifiant est genere automatiquement – aucun mot de passe requis.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Enquête */}
      <Suspense fallback={null}>
        <SurveyModal
          open={showSurvey}
          onClose={() => setShowSurvey(false)}
          onSubmitted={(q3, auteur, date) => {
            setShowSurvey(false);
            toast.success('Merci pour votre retour sur l\'indice');
            if (q3?.trim()) {
              const now = new Date();
              addCommentaire({
                id: '',
                auteur: auteur || 'Anonyme',
                texte: q3.trim(),
                date: date || now.toISOString().slice(0, 10),
                heure: now.toTimeString().slice(0, 8),
              });
            }
          }}
        />
      </Suspense>

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
