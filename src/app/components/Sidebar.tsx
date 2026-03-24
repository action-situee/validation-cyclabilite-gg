import React from 'react';
import { Bike } from 'lucide-react';
import type { BikeSegment } from '../types';
import { HoveredSegmentCard } from './HoveredSegmentCard';
import { buildQuantileLegendBins, VALUE_THRESHOLDS, type BikeMetricKey } from '../config/bikeMetrics';
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
  const safeThresholds = activeThresholds.length > 0 ? activeThresholds : [...VALUE_THRESHOLDS];
  const legendBins = buildQuantileLegendBins(safeThresholds);

  return (
    <div className={`w-[360px] bg-[rgba(229,238,230,0.82)] backdrop-blur-[2px] border-l-2 border-[#0a0a0a] flex flex-col h-full overflow-hidden ${className}`}>
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

      <div className="flex-1 overflow-y-auto bg-[rgba(229,238,230,0.66)]">
        <div className="p-4 border-b-2 border-[#0a0a0a] bg-[rgba(229,238,230,0.66)] space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[10px] uppercase tracking-[0.15em] text-[#2E6A4A] mb-1">
                Indice & projection
              </h2>
              <p className="text-[10px] text-[#5c5c5c] leading-relaxed">
                Lisez l&apos;indice, comparez les classes et contribuez dans le panneau de gauche.
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

        <div className="p-4 bg-[rgba(229,238,230,0.66)]">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h3 className="text-[10px] uppercase tracking-[0.15em] text-[#5c5c5c]">
              Legende quantile
            </h3>
            <InfoTip text="Les couleurs utilisent les seuils quantiles publies pour toute la distribution territoriale. La legende reprend exactement les classes appliquees sur la carte." />
          </div>
          <div className="mb-3 inline-flex items-center gap-2 border border-[#c9d0cc] bg-white px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-[#2E6A4A]">
            <span className="inline-block h-2 w-2 rounded-full bg-[#2E6A4A]" />
            Mode quantile
          </div>
          <div className="grid grid-cols-1 gap-1.5">
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
