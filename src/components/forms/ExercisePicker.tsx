import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { MUSCLE_GROUP_DISPLAY, DEFAULT_EXERCISES, CALISTHENICS_GROUPS, RUNNING_RACE_DISTANCES } from '../../utils/constants';

// ─── Musculation Picker ────────────────────────────────────────────────────────

interface MusculationPickerContentProps {
  selected: string;
  onSelect: (name: string) => void;
}

export function MusculationPickerContent({ selected, onSelect }: MusculationPickerContentProps) {
  const [step, setStep] = useState<'group' | 'exercises'>('group');
  const [groupId, setGroupId] = useState<string | null>(null);

  const groupExercises = groupId
    ? DEFAULT_EXERCISES.filter(e => e.muscle_group === groupId)
    : [];

  if (step === 'group') {
    return (
      <div className="grid grid-cols-2 gap-2">
        {MUSCLE_GROUP_DISPLAY.map(g => (
          <button
            key={g.id}
            type="button"
            onClick={() => { setGroupId(g.id); setStep('exercises'); }}
            className="flex items-center gap-3 p-3 bg-[#1c1c1c] border border-white/8 rounded hover:border-red-500/50 hover:bg-[#242424] transition-all text-left"
          >
            <span className="text-sm font-medium text-[#d4d4d4]">{g.label}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => { setStep('group'); setGroupId(null); }}
        className="flex items-center gap-1.5 text-sm text-[#a3a3a3] hover:text-[#d4d4d4] transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Retour
      </button>
      <div className="space-y-1">
        {groupExercises.length === 0 ? (
          <p className="text-sm text-[#6b6b6b] py-3 text-center">Aucun exercice</p>
        ) : (
          groupExercises.map(ex => (
            <button
              key={ex.name}
              type="button"
              onClick={() => onSelect(ex.name)}
              className={`w-full text-left px-3 py-2.5 rounded text-sm transition-colors ${
                selected === ex.name
                  ? 'bg-red-700/30 text-red-300'
                  : 'hover:bg-[#242424] text-[#d4d4d4] hover:text-white'
              }`}
            >
              {ex.name}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Calisthenics Picker ───────────────────────────────────────────────────────

interface CalisthenicsPickerContentProps {
  selected: string;
  onSelect: (name: string) => void;
}

export function CalisthenicsPickerContent({ selected, onSelect }: CalisthenicsPickerContentProps) {
  const [step, setStep] = useState<'group' | 'exercises'>('group');
  const [groupId, setGroupId] = useState<string | null>(null);

  const group = CALISTHENICS_GROUPS.find(g => g.id === groupId);

  if (step === 'group') {
    return (
      <div className="grid grid-cols-2 gap-2">
        {CALISTHENICS_GROUPS.map(g => (
          <button
            key={g.id}
            type="button"
            onClick={() => { setGroupId(g.id); setStep('exercises'); }}
            className="flex items-center gap-2 p-3 bg-[#1c1c1c] border border-white/8 rounded hover:border-violet-500/50 hover:bg-[#242424] transition-all text-left"
          >
            <span className="text-sm font-medium text-[#d4d4d4] leading-tight">{g.label}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => { setStep('group'); setGroupId(null); }}
        className="flex items-center gap-1.5 text-sm text-[#a3a3a3] hover:text-[#d4d4d4] transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Retour
      </button>
      <div className="space-y-1">
        {group?.exercises.map(name => (
          <button
            key={name}
            type="button"
            onClick={() => onSelect(name)}
            className={`w-full text-left px-3 py-2.5 rounded text-sm transition-colors ${
              selected === name
                ? 'bg-violet-700/30 text-violet-300'
                : 'hover:bg-[#242424] text-[#d4d4d4] hover:text-white'
            }`}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Running Race Picker ───────────────────────────────────────────────────────

interface RunningRacePickerProps {
  value: string;
  onChange: (title: string, km: number) => void;
}

export function RunningRacePicker({ value, onChange }: RunningRacePickerProps) {
  return (
    <div>
      <p className="text-xs text-[#a3a3a3] uppercase tracking-wide font-medium mb-2">Épreuve</p>
      <div className="grid grid-cols-2 gap-2">
        {RUNNING_RACE_DISTANCES.map(race => (
          <button
            key={race.title}
            type="button"
            onClick={() => onChange(race.title, race.km)}
            className={`py-2.5 px-3 rounded text-sm font-medium border transition-all ${
              value === race.title
                ? 'bg-blue-700/30 border-blue-500/50 text-blue-300'
                : 'bg-[#1c1c1c] border-white/10 text-[#a3a3a3] hover:border-blue-500/30 hover:text-[#e5e5e5]'
            }`}
          >
            {race.label}
          </button>
        ))}
      </div>
    </div>
  );
}
