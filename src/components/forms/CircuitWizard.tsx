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

const THEME_STEP: Record<string, string> = {
  red: 'bg-red-500',
  violet: 'bg-violet-500',
  orange: 'bg-orange-500',
};

const THEME_ACTIVE: Record<string, string> = {
  red: 'bg-red-600/30 border-red-500/60 text-red-300',
  violet: 'bg-violet-600/30 border-violet-500/60 text-violet-300',
  orange: 'bg-orange-600/30 border-orange-500/60 text-orange-300',
};

interface StepDef {
  title: string;
  subtitle: string;
  options: number[];
  key: keyof CircuitWizardConfig;
  suffix: string;
}

const STEPS: StepDef[] = [
  {
    title: "Combien d'exercices ?",
    subtitle: 'Exercices différents dans le circuit',
    options: [2, 3, 4, 5, 6],
    key: 'exerciseCount',
    suffix: '',
  },
  {
    title: 'Combien de rounds ?',
    subtitle: 'Le circuit sera répété X fois',
    options: [2, 3, 4, 5],
    key: 'rounds',
    suffix: '',
  },
  {
    title: 'Repos entre les rounds ?',
    subtitle: 'Récupération entre chaque round',
    options: [30, 45, 60, 90],
    key: 'restBetweenRounds',
    suffix: 's',
  },
];

export function CircuitWizard({ theme = 'red', onConfirm, onCancel }: CircuitWizardProps) {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<CircuitWizardConfig>({
    exerciseCount: 3,
    rounds: 3,
    restBetweenRounds: 60,
  });

  const current = STEPS[step - 1];
  const stepBg = THEME_STEP[theme];
  const activeCls = THEME_ACTIVE[theme];

  function handleSelect(val: number) {
    const newConfig = { ...config, [current.key]: val };
    setConfig(newConfig);
    if (step === 3) {
      onConfirm(newConfig);
    } else {
      setStep(s => s + 1);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="w-full max-w-sm bg-[#111] border border-white/10 rounded-2xl p-5 space-y-5 shadow-2xl">
        {/* Progress bar */}
        <div className="flex items-center gap-2">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${s <= step ? stepBg : 'bg-white/10'}`}
            />
          ))}
          <span className="text-xs text-[#6b6b6b] pl-1 flex-shrink-0">{step}/3</span>
        </div>

        {/* Title */}
        <div>
          <h3 className="text-base font-bold text-[#f5f5f5]">{current.title}</h3>
          <p className="text-xs text-[#6b6b6b] mt-0.5">{current.subtitle}</p>
        </div>

        {/* Options */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {current.options.map(opt => (
            <button
              key={opt}
              type="button"
              data-testid={`wizard-option-${opt}`}
              onClick={() => handleSelect(opt)}
              className={`py-3.5 rounded-xl border text-sm font-bold transition-all active:scale-95 ${
                config[current.key] === opt
                  ? activeCls
                  : 'bg-[#1a1a1a] border-white/10 text-[#a3a3a3] hover:border-white/20 hover:text-[#d4d4d4]'
              }`}
            >
              {opt}{current.suffix}
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex gap-2">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-[#6b6b6b] hover:text-[#d4d4d4] transition-colors"
            >
              ← Retour
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-[#6b6b6b] hover:text-[#d4d4d4] transition-colors"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
