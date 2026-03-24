import type { BikeSegment } from '../types';
import {
  BIKE_CLASS_DEFINITIONS,
  getMetricValueByKey,
  type BikeMetricKey,
} from '../config/bikeMetrics';

interface HoveredSegmentCardProps {
  segment: BikeSegment | null;
  selectedMetric: BikeMetricKey;
  source: 'hover' | 'selected' | 'none';
  onMetricChange: (metric: BikeMetricKey) => void;
}

function formatScore(value: number | null | undefined) {
  return value == null || Number.isNaN(value) ? '0.00' : value.toFixed(2);
}

export function HoveredSegmentCard({
  segment,
  selectedMetric,
  source,
  onMetricChange,
}: HoveredSegmentCardProps) {
  const isCarreau = segment?.spatial_unit === 'carreau200';
  const statusLabel =
    source === 'selected'
      ? isCarreau
        ? 'Carreau survole'
        : 'Segment selectionne'
      : source === 'hover'
        ? isCarreau
          ? 'Carreau survole'
          : 'Segment survole'
        : 'Profil du segment';
  const identifierLabel = segment?.segment_id
    ? isCarreau
      ? 'maille 200 m'
      : segment.segment_id
    : null;
  const emptyStateLabel = 'Survolez la carte';

  const handleClassClick = (classKey: BikeMetricKey) => {
    onMetricChange(classKey === selectedMetric ? 'bike_index' : classKey);
  };

  return (
    <div className="border-2 border-[#0a0a0a] bg-white">
      <div className="p-4 border-b border-[#e0e0dc] bg-white">
        <div className="flex items-center justify-between gap-3 mb-2">
          <p className="text-[10px] uppercase tracking-[0.12em] text-[#2E6A4A]">{statusLabel}</p>
          {identifierLabel ? (
            <span className="text-[10px] text-[#999] font-mono">
              {identifierLabel}
            </span>
          ) : null}
        </div>
        <p className="text-[12px] text-[#0a0a0a] leading-relaxed">
          {segment?.faisceau_nom || emptyStateLabel}
        </p>
        <button
          type="button"
          onClick={() => onMetricChange('bike_index')}
          className={`w-full mt-3 border p-3 text-left transition-colors ${
            selectedMetric === 'bike_index'
              ? 'border-[#2E6A4A] bg-white'
              : 'border-[#d8d2ca] bg-white hover:border-[#2E6A4A]'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[9px] uppercase tracking-[0.1em] text-[#999] mb-1">Indice global</p>
              <p className="text-[18px] text-[#2E6A4A] font-mono">
                {formatScore(segment?.bike_index)}
              </p>
            </div>
            <span className="text-[10px] text-[#5c5c5c] leading-relaxed max-w-[110px]">
              Colorer la carte par l&apos;indice global
            </span>
          </div>
        </button>
      </div>

      <div className="p-3 space-y-1.5">
        <p className="text-[10px] uppercase tracking-[0.12em] text-[#5c5c5c]">
          Classes d&apos;attributs
        </p>
        {BIKE_CLASS_DEFINITIONS.map((bikeClass) => {
          const classValue = segment ? getMetricValueByKey(segment, bikeClass.key) : null;
          const isActive = bikeClass.key === selectedMetric;
          return (
            <div
              key={bikeClass.key}
              className={`overflow-hidden border transition-colors ${
                isActive ? 'border-[#2E6A4A] bg-[#D3E4D7]' : 'border-[#e0e0dc] bg-white'
              }`}
            >
              <div className="flex items-stretch">
                <button
                  type="button"
                  onClick={() => handleClassClick(bikeClass.key)}
                  className={`w-8 shrink-0 flex items-center justify-center transition-colors ${
                    isActive ? 'bg-[#2E6A4A]' : 'bg-white hover:bg-[#E5EEE6]'
                  }`}
                  title={`Colorer la carte par ${bikeClass.label}`}
                >
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ backgroundColor: isActive ? '#ffffff' : bikeClass.color }}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => handleClassClick(bikeClass.key)}
                  className="flex-1 px-2.5 py-2 text-left transition-colors hover:bg-[#E5EEE6]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] leading-tight text-[#0a0a0a]">{bikeClass.label}</p>
                      <p className="text-[8px] leading-tight text-[#5c5c5c] mt-0.5 line-clamp-2">{bikeClass.description}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] text-[#2E6A4A] font-mono">
                        {formatScore(classValue)}
                      </span>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
