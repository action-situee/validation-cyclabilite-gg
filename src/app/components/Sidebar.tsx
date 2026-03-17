import React from 'react';
import { Bike, ChevronDown } from 'lucide-react';
import type { BikeSegment } from '../types';
import { HoveredSegmentCard } from './HoveredSegmentCard';
import type { BikeMetricKey } from '../config/bikeMetrics';
import { BASEMAP_OPTIONS, type BasemapMode } from '../config/basemaps';
import { InfoTip } from './InfoTip';

interface SidebarProps {
  className?: string;
  selectedMetric: BikeMetricKey;
  onMetricChange: (metric: BikeMetricKey) => void;
  hoveredSegment: BikeSegment | null;
  hoveredSegmentSource: 'hover' | 'selected' | 'none';
  basemap: BasemapMode;
  onBasemapChange: (basemap: BasemapMode) => void;
  activeThresholds: number[];
}

export function Sidebar({
  className = '',
  selectedMetric,
  onMetricChange,
  hoveredSegment,
  hoveredSegmentSource,
  basemap,
  onBasemapChange,
  activeThresholds,
}: SidebarProps) {
  const formatThreshold = (value: number) => {
    if (value < 0.001) return value.toFixed(4);
    if (value < 0.01) return value.toFixed(3);
    return value.toFixed(2);
  };

  return (
    <div className={`w-[360px] bg-white border-l-2 border-[#0a0a0a] flex flex-col h-full overflow-hidden ${className}`}>
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

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 border-b-2 border-[#0a0a0a] bg-[#E5EEE6] space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[10px] uppercase tracking-[0.15em] text-[#2E6A4A] mb-1">
                Indice & projection
              </h2>
              <p className="text-[10px] text-[#5c5c5c] leading-relaxed">
                Les consignes de contribution sont dans le bouton <strong className="text-[#2E6A4A]">i</strong> en haut.
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

          <div className="space-y-3">
            <div>
              <label className="block text-[10px] uppercase tracking-[0.12em] text-[#5c5c5c] mb-2">
                Fond de carte
              </label>
              <div className="relative">
                <select
                  value={basemap}
                  onChange={(e) => onBasemapChange(e.target.value as BasemapMode)}
                  className="w-full px-3 py-2 pr-9 border-2 border-[#0a0a0a] bg-white text-[13px] focus:outline-none focus:border-[#2E6A4A] transition-colors appearance-none"
                >
                  {BASEMAP_OPTIONS.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5c5c5c] pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-[#E5EEE6]">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h3 className="text-[10px] uppercase tracking-[0.15em] text-[#5c5c5c]">
              Legende quantiles
            </h3>
            <InfoTip text="Les couleurs sont calculees en quantiles sur tout le territoire du Grand Geneve, pas uniquement sur la vue courante." />
          </div>
          <div className="flex items-center gap-1 mb-3">
            <span className="w-5 h-2 bg-[#B00020]" />
            <span className="w-5 h-2 bg-[#D02F1E]" />
            <span className="w-5 h-2 bg-[#E24F24]" />
            <span className="w-5 h-2 bg-[#FFD98A]" />
            <span className="w-5 h-2 bg-[#F1F5A0]" />
            <span className="w-5 h-2 bg-[#DDF4A3]" />
            <span className="w-5 h-2 bg-[#C8EE9A]" />
            <span className="w-5 h-2 bg-[#A6E083]" />
            <span className="w-5 h-2 bg-[#7FCB62]" />
            <span className="w-5 h-2 bg-[#38A74A]" />
            <span className="w-5 h-2 bg-[#007A35]" />
          </div>
          <p className="text-[10px] text-[#5c5c5c] leading-relaxed">
            Seuils actifs: <span className="font-mono">{activeThresholds.map((value) => formatThreshold(value)).join(' · ')}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
