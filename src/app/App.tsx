import React, { Suspense, lazy, useState, useMemo, useCallback, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { Plus, X, Bike, HelpCircle, ClipboardCheck, PanelLeft, PanelRight, PanelsLeftRight } from 'lucide-react';
import { AppDataProvider, useAppData } from './hooks/useAppData';
import { Sidebar } from './components/Sidebar';
import { ValidationSidebar } from './components/ValidationSidebar';
import { Button } from './components/ui/Button';
import type { BikeSegment, Cible, ObservationLibre, CommentaireGeneral } from './types';
import { BIKE_METRIC_BY_KEY, VALUE_THRESHOLDS, type BikeMetricKey } from './config/bikeMetrics';
import { DEFAULT_BASEMAP, type BasemapMode } from './config/basemaps';
import { DEFAULT_CENTER, DEFAULT_ZOOM } from './mock-data/faisceaux';
import { exportGeoJSON, exportCSV } from './utils/export';

const ALL_CLASSES = ['permeabilite_frontiere', 'intersections', 'giratoires', 'alternatives', 'continuite', 'equipements', 'attractivite'];
const ALL_OBS_CATS = ['validation', 'danger', 'amenagement', 'positif'];
const Map = lazy(() =>
  import('./components/Map').then((module) => ({ default: module.Map })),
);
const QuickAddForm = lazy(() =>
  import('./components/QuickAddForm').then((module) => ({ default: module.QuickAddForm })),
);
const CibleThread = lazy(() =>
  import('./components/CibleThread').then((module) => ({ default: module.CibleThread })),
);
const SurveyModal = lazy(() =>
  import('./components/SurveyModal').then((module) => ({ default: module.SurveyModal })),
);

type SidebarMode = 'left' | 'right' | 'both';

function AppInner() {
  const {
    cibles, observations, commentaires, faisceaux,
    addObservation, deleteObservation, voteObservation,
    addCommentaire, deleteCommentaire, getObservationsForCible,
    isOwnObservation, isOwnCommentaire, cibleFaisceauMap,
  } = useAppData();

  const [selectedFaisceau, setSelectedFaisceau] = useState<string | null>(null);
  const [addMode, setAddMode] = useState(false);
  const [pendingPoint, setPendingPoint] = useState<{ lat: number; lng: number; cible?: Cible; segment?: BikeSegment } | null>(null);
  const [selectedCible, setSelectedCible] = useState<Cible | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<BikeSegment | null>(null);
  const [hoveredSegment, setHoveredSegment] = useState<BikeSegment | null>(null);
  const [threadCible, setThreadCible] = useState<Cible | null>(null);
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>('both');
  const [mobileSidebarVisible, setMobileSidebarVisible] = useState(false);
  const [flyTo, setFlyTo] = useState<{ center: [number, number]; zoom: number } | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<BikeMetricKey>('bike_index');
  const [basemap, setBasemap] = useState<BasemapMode>(DEFAULT_BASEMAP);
  const [quantileMap, setQuantileMap] = useState<Partial<Record<BikeMetricKey, number[]>>>({});

  // Corridor visibility
  const [showCorridors, setShowCorridors] = useState(false);

  // Help modal
  const [showHelp, setShowHelp] = useState(false);

  // Survey modal
  const [showSurvey, setShowSurvey] = useState(false);

  // Legend filters
  const [activeClasses, setActiveClasses] = useState<string[]>(ALL_CLASSES);
  const [activeObsCats, setActiveObsCats] = useState<string[]>(ALL_OBS_CATS);

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
        if (o.corridor_id) {
          return o.corridor_id === selectedFaisceau;
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
    setSelectedSegment(null);
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
    setSelectedSegment(null);
    setThreadCible(cible);
    setAddMode(false);
  }, []);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setPendingPoint({ lat, lng });
    setSelectedSegment(null);
    setAddMode(false);
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
    setSelectedCible(null);
    setThreadCible(null);

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

  const handleSubmitObservation = useCallback((obs: ObservationLibre) => {
    const savedId = addObservation(obs);
    setPendingPoint(null);
    setSelectedCible(null);
    setSelectedSegment(null);
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
      setSelectedSegment(null);
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

  const activeThresholds = useMemo(() => {
    const thresholds = quantileMap[selectedMetric];
    return Array.isArray(thresholds) && thresholds.length > 0 ? thresholds : [...VALUE_THRESHOLDS];
  }, [quantileMap, selectedMetric]);

  const leftSidebarOpen = sidebarMode === 'left' || sidebarMode === 'both';
  const rightSidebarOpen = sidebarMode === 'right' || sidebarMode === 'both';
  const sidebarLayout = `${leftSidebarOpen ? 'left' : 'none'}-${rightSidebarOpen ? 'right' : 'none'}`;
  const shouldPulseAddButton = Boolean(selectedSegment && !pendingPoint && !addMode);

  const handleSelectSidebarMode = useCallback((mode: SidebarMode) => {
    setSidebarMode(mode);
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches) {
      setMobileSidebarVisible(true);
    }
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
    basemap,
    onBasemapChange: setBasemap,
    activeThresholds,
  };

  const leftSidebarProps = {
    selectedFaisceau,
    onFaisceauChange: handleFaisceauChange,
    faisceaux,
    showCorridors,
    onToggleCorridors: () => setShowCorridors((value) => !value),
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
      <div className="bg-white border-b-2 border-[#0a0a0a] px-4 py-2.5 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <Bike className="w-5 h-5 text-[#2E6A4A]" />
          <div className="min-w-0">
            <p className="text-[11px] text-[#5c5c5c] tracking-wide font-mono truncate">
              {BIKE_METRIC_BY_KEY[selectedMetric].label}
              {' · '}
              {filteredCibles.length} point{filteredCibles.length > 1 ? 's' : ''}
              {filteredObservations.length > 0 && <> · {filteredObservations.length} retour{filteredObservations.length > 1 ? 's' : ''}</>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
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

          <button
            onClick={() => setShowSurvey(true)}
            className="p-2 border-2 border-transparent hover:border-[#0a0a0a] transition-all"
            aria-label="Questionnaire"
            title="Questionnaire rapide"
          >
            <ClipboardCheck className="w-5 h-5 text-[#2E6A4A]" />
          </button>

          <button
            onClick={() => setShowHelp(true)}
            className="p-2 border-2 border-transparent hover:border-[#0a0a0a] transition-all"
            aria-label="Mode d'emploi"
            title="Mode d'emploi"
          >
            <HelpCircle className="w-5 h-5 text-[#2E6A4A]" />
          </button>

          <Button
            variant={addMode || shouldPulseAddButton ? 'primary' : 'outline'}
            size="sm"
            onClick={handleAddButtonClick}
            className={shouldPulseAddButton ? 'animate-pulse' : ''}
          >
            {addMode ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span className="hidden sm:inline">
              {addMode ? 'Annuler' : shouldPulseAddButton ? 'Commenter le troncon' : 'Ajouter'}
            </span>
          </Button>
        </div>
      </div>

      {/* Bandeau mode ajout */}
      {addMode && (
        <div className="bg-[#2E6A4A] text-[#D3E4D7] px-4 py-2 text-[11px] uppercase tracking-[0.15em] text-center shrink-0 z-10 border-b-2 border-[#0a0a0a]">
          Cliquez sur une ligne coloree pour valider un segment, ou ailleurs sur la carte pour un point libre
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
              cibles={filteredCibles}
              observations={filteredObservations}
              faisceaux={faisceaux}
              selectedCible={selectedCible}
              selectedSegment={selectedSegment}
              selectedMetric={selectedMetric}
              metricThresholds={activeThresholds}
              basemap={basemap}
              onCibleClick={handleCibleClick}
              onSegmentClick={handleSegmentClick}
              onHoverSegment={handleHoverSegment}
              addMode={addMode}
              onMapClick={handleMapClick}
              flyTo={flyTo}
              selectedFaisceau={selectedFaisceau}
              showCorridors={showCorridors}
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

      {/* Fil de discussion par cible */}
      {threadCible && !pendingPoint && (
        <Suspense fallback={null}>
          <CibleThread
            cible={threadCible}
            observations={threadObservations}
            onClose={() => { setThreadCible(null); setSelectedCible(null); }}
            onVote={handleVote}
            onDelete={handleDeleteObservation}
            onAddObservation={handleThreadAddObservation}
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
            cible={pendingPoint.cible}
            segment={pendingPoint.segment}
            onSubmit={handleSubmitObservation}
            onClose={() => { setPendingPoint(null); setSelectedCible(null); }}
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
                Cette interface permet de visualiser et valider l&apos;indice de cyclabilite sur <strong className="text-[#2E6A4A]">l&apos;ensemble du Grand Geneve</strong>. Toutes les consignes de contribution sont centralisees ici, et la sidebar a droite sert a lire l&apos;indice, changer le fond de carte et comparer les classes.
              </p>

              {/* Appel à l'action principal */}
              <div className="border-2 border-[#2E6A4A] bg-[#D3E4D7] p-4" style={{ boxShadow: '4px 4px 0 rgba(0,0,0,0.08)' }}>
                <h3 className="text-[11px] uppercase tracking-[0.12em] text-[#2E6A4A] mb-2">3 facons de contribuer</h3>
                <ol className="text-[12px] text-[#5c5c5c] space-y-1.5 list-decimal list-inside leading-relaxed">
                  <li><strong className="text-[#2E6A4A]">Repondre au questionnaire</strong> via l&apos;icone <ClipboardCheck className="w-3.5 h-3.5 inline text-[#2E6A4A] -mt-0.5" /> dans la barre superieure.</li>
                  <li><strong className="text-[#2E6A4A]">Commenter un point d&apos;attention</strong> en cliquant sur une pastille coloree deja presente sur la carte.</li>
                  <li><strong className="text-[#2E6A4A]">Ajouter une remontee libre</strong> avec <strong className="text-[#2E6A4A]">+ Ajouter</strong>, soit sur un segment pour valider l&apos;indice, soit ailleurs pour un point libre.</li>
                </ol>
              </div>

              {/* Corridors */}
              <div className="border-2 border-[#2E6A4A] bg-[#D3E4D7] p-4">
                <h3 className="text-[11px] uppercase tracking-[0.12em] text-[#2E6A4A] mb-2">Les corridors</h3>
                <ul className="text-[12px] text-[#5c5c5c] space-y-1 ml-4 list-disc">
                  <li><strong className="text-[#2E6A4A]">Saint-Julien – PLO – Genève</strong> – axe sud</li>
                  <li><strong className="text-[#2E6A4A]">Gaillard – Thonex – Eaux-Vives</strong> – axe est</li>
                </ul>
                <p className="text-[11px] text-[#999] mt-2">
                  La carte reste disponible à l'échelle du territoire complet, et le sélecteur de corridor sert à zoomer et à mettre en avant les deux axes transfrontaliers prioritaires.
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
      <Suspense fallback={null}>
        <SurveyModal
          open={showSurvey}
          onClose={() => setShowSurvey(false)}
          onSubmitted={() => {
            setShowSurvey(false);
            toast.success('Merci pour votre retour sur l\'indice');
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
