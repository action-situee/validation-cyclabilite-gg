import { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import type { BikeSegment } from '../types';
import {
  BIKE_CLASS_BY_KEY,
  BIKE_CLASS_DEFINITIONS,
  VALUE_THRESHOLDS,
  getMetricValueByKey,
  getPaletteColor,
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
  const [expandedClassKey, setExpandedClassKey] = useState<BikeMetricKey | null>(
    selectedMetric === 'bike_index' ? null : selectedMetric,
  );
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
    : 'en attente';
  const emptyStateLabel = isCarreau
    ? 'Survolez un carreau ou un segment pour lire son profil et choisir la classe affichee sur la carte.'
    : 'Survolez un segment pour lire son profil et choisir la classe affichee sur la carte.';

  useEffect(() => {
    setExpandedClassKey(selectedMetric === 'bike_index' ? null : selectedMetric);
  }, [selectedMetric]);

  const handleClassClick = (classKey: BikeMetricKey) => {
    if (selectedMetric === classKey) {
      onMetricChange('bike_index');
      return;
    }

    onMetricChange(classKey);
    setExpandedClassKey(classKey);
  };

  const renderAttributes = (classKey: BikeMetricKey) => {
    const bikeClass = BIKE_CLASS_BY_KEY[classKey];

    return (
      <div className="p-2 space-y-1.5 bg-[#F3F4F6] border-t border-[#e0e0dc]">
        {bikeClass.attributes.map((attribute) => {
          const rawValue = segment?.[attribute.technicalName as keyof BikeSegment];
          const value = typeof rawValue === 'number' ? rawValue : Number(rawValue ?? NaN);
          const safeValue = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
          return (
            <div key={attribute.technicalName} className="bg-white border border-[#e0e0dc] px-2 py-1.5">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[9px] text-[#0a0a0a] leading-tight">{attribute.name}</span>
                <span className="text-[9px] text-[#5c5c5c] font-mono">
                  {formatScore(Number.isFinite(value) ? value : null)}
                </span>
              </div>
              <div className="h-1 bg-[#ece9e4] overflow-hidden">
                <div
                  className="h-full"
                  style={{
                    width: `${safeValue * 100}%`,
                    backgroundColor: getPaletteColor(safeValue, VALUE_THRESHOLDS),
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="border-2 border-[#0a0a0a] bg-white">
      <div className="p-4 border-b border-[#e0e0dc] bg-[#E5EEE6]">
        <div className="flex items-center justify-between gap-3 mb-2">
          <p className="text-[10px] uppercase tracking-[0.12em] text-[#2E6A4A]">{statusLabel}</p>
          <span className="text-[10px] text-[#999] font-mono">
            {identifierLabel}
          </span>
        </div>
        <p className="text-[12px] text-[#0a0a0a] leading-relaxed">
          {segment?.corridor_name || emptyStateLabel}
        </p>
        <button
          type="button"
          onClick={() => onMetricChange('bike_index')}
          className={`w-full mt-3 border p-3 text-left transition-colors ${
            selectedMetric === 'bike_index'
              ? 'border-[#2E6A4A] bg-[#D3E4D7]'
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
          const isExpanded = expandedClassKey === bikeClass.key;
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
                  onClick={() => {
                    if (isActive) {
                      onMetricChange('bike_index');
                      return;
                    }
                    handleClassClick(bikeClass.key);
                  }}
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
                      <ChevronRight
                        className={`w-3 h-3 text-[#999] transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      />
                    </div>
                  </div>
                </button>
              </div>
              {isExpanded && renderAttributes(bikeClass.key)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
