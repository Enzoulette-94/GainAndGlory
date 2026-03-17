import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft } from 'lucide-react';
import { CROSSFIT_GROUPS } from '../../utils/constants';

interface CrossfitExercisePickerProps {
  selected: string;
  onSelect: (name: string) => void;
}

export function CrossfitExercisePickerContent({ selected, onSelect }: CrossfitExercisePickerProps) {
  const [search, setSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return CROSSFIT_GROUPS;
    const q = search.toLowerCase();
    return CROSSFIT_GROUPS
      .map(g => ({
        ...g,
        exercises: g.exercises.filter((e: string) => e.toLowerCase().includes(q)),
      }))
      .filter(g => g.exercises.length > 0);
  }, [search]);

  const currentGroup = activeGroup
    ? CROSSFIT_GROUPS.find(g => g.id === activeGroup)
    : null;

  const groupExercises = useMemo(() => {
    if (!currentGroup) return [];
    if (!search.trim()) return [...currentGroup.exercises];
    const q = search.toLowerCase();
    return currentGroup.exercises.filter((e: string) => e.toLowerCase().includes(q));
  }, [currentGroup, search]);

  // Search mode: show all matching exercises flat
  if (search.trim()) {
    return (
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b6b6b]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un exercice..."
            className="w-full pl-9 pr-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-lg text-sm text-[#f5f5f5] placeholder-[#4a4a4a] focus:outline-none focus:border-orange-500/50"
            autoFocus
          />
        </div>
        <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
          {filteredGroups.map(g => (
            <div key={g.id}>
              <p className="text-xs font-bold text-[#6b6b6b] uppercase tracking-wider mb-2">
                {g.emoji} {g.label}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {g.exercises.map((ex: string) => (
                  <button
                    key={ex}
                    onClick={() => onSelect(ex)}
                    className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                      selected === ex
                        ? 'bg-orange-600/20 border-orange-500/40 text-orange-300'
                        : 'border-white/10 text-[#a3a3a3] hover:border-orange-500/30 hover:text-[#f5f5f5]'
                    }`}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {filteredGroups.length === 0 && (
            <p className="text-center text-[#4a4a4a] text-sm py-4">Aucun exercice trouvé</p>
          )}
        </div>
      </div>
    );
  }

  // Group detail view
  if (activeGroup && currentGroup) {
    return (
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b6b6b]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un exercice..."
            className="w-full pl-9 pr-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-lg text-sm text-[#f5f5f5] placeholder-[#4a4a4a] focus:outline-none focus:border-orange-500/50"
          />
        </div>
        <button
          onClick={() => setActiveGroup(null)}
          className="flex items-center gap-1 text-xs text-[#6b6b6b] hover:text-[#d4d4d4] transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Retour aux catégories
        </button>
        <p className="text-sm font-semibold text-[#d4d4d4]">
          {currentGroup.emoji} {currentGroup.label}
        </p>
        <div className="flex flex-wrap gap-1.5 max-h-80 overflow-y-auto pr-1">
          {groupExercises.map((ex: string) => (
            <button
              key={ex}
              onClick={() => onSelect(ex)}
              className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                selected === ex
                  ? 'bg-orange-600/20 border-orange-500/40 text-orange-300'
                  : 'border-white/10 text-[#a3a3a3] hover:border-orange-500/30 hover:text-[#f5f5f5]'
              }`}
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Category list view
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b6b6b]" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un exercice..."
          className="w-full pl-9 pr-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-lg text-sm text-[#f5f5f5] placeholder-[#4a4a4a] focus:outline-none focus:border-orange-500/50"
          autoFocus
        />
      </div>
      <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
        {CROSSFIT_GROUPS.map(g => (
          <button
            key={g.id}
            onClick={() => setActiveGroup(g.id)}
            className="w-full flex items-center justify-between px-3 py-2.5 bg-[#1a1a1a] border border-white/5 rounded-lg hover:border-orange-500/30 hover:bg-orange-950/20 transition-colors text-left"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base">{g.emoji}</span>
              <div>
                <p className="text-sm font-medium text-[#d4d4d4]">{g.label}</p>
                <p className="text-xs text-[#4a4a4a]">{g.exercises.length} exercices</p>
              </div>
            </div>
            <span className="text-[#4a4a4a] text-xs">›</span>
          </button>
        ))}
      </div>
    </div>
  );
}
