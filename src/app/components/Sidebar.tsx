import React from 'react';
import { Bike } from 'lucide-react';
import type { BikeSegment } from '../types';
import { HoveredSegmentCard } from './HoveredSegmentCard';
import { VALUE_PALETTE, VALUE_THRESHOLDS, type BikeMetricKey } from '../config/bikeMetrics';
import { InfoTip } from './InfoTip';

interface SidebarProps {
  className?: string;
  selectedMetric: BikeMetricKey;
  onMetricChange: (metric: BikeMetricKey) => void;
  hoveredSegment: BikeSegment | null;
  hoveredSegmentSource: 'hover' | 'selected' | 'none';
  activeThresholds: number[];
}

export function Sidebar({
  className = '',
  selectedMetric,
  onMetricChange,
  hoveredSegment,
  hoveredSegmentSource,
  activeThresholds,
}: SidebarProps) {
  const formatThreshold = (value: number) => {
    if (value < 0.001) return value.toFixed(4);
    if (value < 0.01) return value.toFixed(3);
    return value.toFixed(2);
  };

  const safeThresholds = activeThresholds.length > 0 ? activeThresholds : [...VALUE_THRESHOLDS];
  const legendBins = VALUE_PALETTE.map((color, index) => {
    if (index === 0) {
      return {
        color,
        label: `< ${formatThreshold(safeThresholds[0])}`,
      };
    }

    if (index === VALUE_PALETTE.length - 1) {
      return {
        color,
        label: `>= ${formatThreshold(safeThresholds[safeThresholds.length - 1])}`,
      };
    }

    return {
      color,
      label: `${formatThreshold(safeThresholds[index - 1])} - ${formatThreshold(safeThresholds[index])}`,
    };
  });

  return (
    <div className={`w-[360px] bg-[#E5EEE6] border-l-2 border-[#0a0a0a] flex flex-col h-full overflow-hidden ${className}`}>
      <div className="p-5 border-b-2 border-[#0a0a0a] bg-[#2E6A4A]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 border-2 border-[#D3E4D7] flex items-center justify-center">
            <Bike className="w-5 h-5 text-[#D3E4D7]" />
          </div>
          <div>
            <h1 className="text-[#D3E4D7] text-sm uppercase tracking-[0.15em]">Cyclabilite</h1>
            <p className="text-[#8AA894] text-[10px] uppercase tracking-[0.1em]">Indice & projection</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-[#E5EEE6]">
        <div className="p-4 border-b-2 border-[#0a0a0a] bg-[#E5EEE6] space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[10px] uppercase tracking-[0.15em] text-[#2E6A4A] mb-1">
                Indice & projection
              </h2>
              <p className="text-[10px] text-[#5c5c5c] leading-relaxed">
                Les consignes de contribution sont dans le bouton <strong className="text-[#2E6A4A]">?</strong> en haut.
              </p>
            </div>
            <InfoTip text="Ce panneau regroupe la lecture de l'indice, le fond de carte et la legende quantile." />
          </div>

          <HoveredSegmentCard
            segment={hoveredSegment}
            selectedMetric={selectedMetric}
            source={hoveredSegmentSource}
            onMetricChange={onMetricChange}
          />
        </div>

        <div className="p-4 bg-[#E5EEE6]">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h3 className="text-[10px] uppercase tracking-[0.15em] text-[#5c5c5c]">
              Legende quantiles
            </h3>
            <InfoTip text="Les couleurs sont calculees en quantiles sur tout le territoire du Grand Geneve, pas uniquement sur la vue courante." />
          </div>
          <div className="space-y-1.5">
            {legendBins.map((bin) => (
              <div key={`${bin.color}-${bin.label}`} className="flex items-center gap-2">
                <span
                  className="w-6 h-2.5 shrink-0 border border-black/10"
                  style={{ backgroundColor: bin.color }}
                />
                <span className="text-[10px] text-[#5c5c5c] font-mono leading-none">
                  {bin.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
