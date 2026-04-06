import React, { useState, useRef, useEffect } from 'react';
import { LayoutTemplate, ChevronDown } from 'lucide-react';
import type { CircuitWizardConfig } from './CircuitWizard';

export interface CircuitTemplate extends CircuitWizardConfig {
  name: string;
  description: string;
}

export const CIRCUIT_TEMPLATES: CircuitTemplate[] = [
  {
    name: 'Push / Pull',
    description: '4 exos · 3 rounds · 60s repos',
    exerciseCount: 4,
    rounds: 3,
    restBetweenRounds: 60,
  },
  {
    name: 'Corps entier',
    description: '6 exos · 3 rounds · 60s repos',
    exerciseCount: 6,
    rounds: 3,
    restBetweenRounds: 60,
  },
  {
    name: 'Upper Body',
    description: '4 exos · 4 rounds · 45s repos',
    exerciseCount: 4,
    rounds: 4,
    restBetweenRounds: 45,
  },
  {
    name: 'Core Blast',
    description: '5 exos · 3 rounds · 30s repos',
    exerciseCount: 5,
    rounds: 3,
    restBetweenRounds: 30,
  },
];

interface CircuitTemplatesProps {
  theme?: 'red' | 'violet' | 'orange';
  onSelect: (template: CircuitTemplate) => void;
}

const THEME_BTN: Record<string, string> = {
  red: 'border-red-900/50 text-red-400 hover:border-red-700/60 hover:bg-red-950/20',
  violet: 'border-violet-900/50 text-violet-400 hover:border-violet-700/60 hover:bg-violet-950/20',
  orange: 'border-orange-900/50 text-orange-400 hover:border-orange-700/60 hover:bg-orange-950/20',
};

const THEME_ITEM: Record<string, string> = {
  red: 'hover:bg-red-950/20',
  violet: 'hover:bg-violet-950/20',
  orange: 'hover:bg-orange-950/20',
};

export function CircuitTemplates({ theme = 'red', onSelect }: CircuitTemplatesProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        data-testid="circuit-templates-btn"
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${THEME_BTN[theme]}`}
      >
        <LayoutTemplate className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Templates</span>
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          data-testid="circuit-templates-dropdown"
          className="absolute bottom-full mb-2 right-0 w-60 bg-[#111] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-40"
        >
          <div className="px-3 py-2 border-b border-white/5">
            <span className="text-xs text-[#6b6b6b] font-medium uppercase tracking-wider">Templates</span>
          </div>
          <div className="p-1.5 space-y-0.5">
            {CIRCUIT_TEMPLATES.map(tpl => (
              <button
                key={tpl.name}
                type="button"
                data-testid={`template-${tpl.name}`}
                onClick={() => { onSelect(tpl); setOpen(false); }}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${THEME_ITEM[theme]}`}
              >
                <div className="text-sm font-medium text-[#d4d4d4]">{tpl.name}</div>
                <div className="text-xs text-[#6b6b6b] mt-0.5">{tpl.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
