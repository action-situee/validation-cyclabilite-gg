import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

interface InfoTipProps {
  text: string;
  align?: 'left' | 'right';
}

type TooltipPosition = {
  left: number;
  top: number;
};

const TOOLTIP_WIDTH = 224;
const VIEWPORT_MARGIN = 8;
const GAP = 8;

export function InfoTip({ text, align = 'right' }: InfoTipProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<TooltipPosition>({ left: 0, top: 0 });
  const [placement, setPlacement] = useState<'top' | 'bottom'>('top');

  useLayoutEffect(() => {
    if (!open || !triggerRef.current || typeof window === 'undefined') return;

    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const preferredLeft = align === 'left' ? rect.left : rect.right - TOOLTIP_WIDTH;
      const left = Math.min(
        Math.max(VIEWPORT_MARGIN, preferredLeft),
        viewportWidth - TOOLTIP_WIDTH - VIEWPORT_MARGIN,
      );

      const showBelow = rect.top < 72;
      const nextPlacement = showBelow ? 'bottom' : 'top';
      const top = nextPlacement === 'bottom'
        ? Math.min(rect.bottom + GAP, viewportHeight - VIEWPORT_MARGIN)
        : Math.max(VIEWPORT_MARGIN, rect.top - GAP);

      setPlacement(nextPlacement);
      setPosition({ left, top });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [align, open]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!triggerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((previous) => !previous)}
        className="relative inline-flex ml-1 shrink-0"
        aria-label="Afficher l'aide"
        aria-expanded={open}
      >
        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-[#c7cdc9] bg-white text-[10px] font-semibold leading-none text-[#7a847e] hover:border-[#2E6A4A] hover:text-[#2E6A4A] transition-colors cursor-help">
          i
        </span>
      </button>

      {open && (
        <span
          className="fixed z-[80] w-56 px-2.5 py-2 bg-[#2E6A4A] text-[#D3E4D7] text-[10px] leading-snug border border-[#0a0a0a] pointer-events-none"
          style={{
            left: position.left,
            top: position.top,
            transform: placement === 'top' ? 'translateY(-100%)' : 'none',
            boxShadow: '3px 3px 0 rgba(0,0,0,0.15)',
          }}
          role="tooltip"
        >
          {text}
        </span>
      )}
    </>
  );
}
