import React, { useState } from 'react';

export interface CircuitWizardConfig {
  exerciseCount: number;
  rounds: number;
  restBetweenRounds: number;
}

interface CircuitWizardProps {
  theme?: 'red' | 'violet' | 'orange';
  onConfirm: (config: CircuitWizardConfig) => void;
  onCancel: () => void;
}

const THEME_BTN: Record<string, string> = {
  red: 'bg-red-600 hover:bg-red-500 text-white',
  violet: 'bg-violet-600 hover:bg-violet-500 text-white',
  orange: 'bg-orange-600 hover:bg-orange-500 text-white',
};

export function CircuitWizard({ theme = 'red', onConfirm, onCancel }: CircuitWizardProps) {
  const [exerciseCount, setExerciseCount] = useState('3');
  const [rounds, setRounds] = useState('3');
  const [rest, setRest] = useState('60');

  function handleConfirm() {
    const ex = Math.max(1, parseInt(exerciseCount) || 1);
    const r = Math.max(1, parseInt(rounds) || 1);
    const s = Math.max(0, parseInt(rest) || 0);
    onConfirm({ exerciseCount: ex, rounds: r, restBetweenRounds: s });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="w-full max-w-sm bg-[#111] border border-white/10 rounded-2xl p-5 space-y-5 shadow-2xl">
        <h3 className="text-base font-bold text-[#f5f5f5]">Créer un circuit</h3>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-[#6b6b6b] mb-1.5 block">Exercices</label>
            <input
              type="text"
              inputMode="numeric"
              value={exerciseCount}
              onChange={e => setExerciseCount(e.target.value.replace(/\D/g, ''))}
              data-testid="wizard-input-exercises"
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-sm text-[#f5f5f5] text-center outline-none focus:border-white/20 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs text-[#6b6b6b] mb-1.5 block">Rounds</label>
            <input
              type="text"
              inputMode="numeric"
              value={rounds}
              onChange={e => setRounds(e.target.value.replace(/\D/g, ''))}
              data-testid="wizard-input-rounds"
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-sm text-[#f5f5f5] text-center outline-none focus:border-white/20 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs text-[#6b6b6b] mb-1.5 block">Repos entre les rounds (secondes)</label>
            <input
              type="text"
              inputMode="numeric"
              value={rest}
              onChange={e => setRest(e.target.value.replace(/\D/g, ''))}
              data-testid="wizard-input-rest"
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-sm text-[#f5f5f5] text-center outline-none focus:border-white/20 transition-colors"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-[#6b6b6b] hover:text-[#d4d4d4] transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            data-testid="wizard-confirm"
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${THEME_BTN[theme]}`}
          >
            Créer
          </button>
        </div>
      </div>
    </div>
  );
}
