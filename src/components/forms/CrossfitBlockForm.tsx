import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Plus, X, Copy, RotateCcw } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Card, CardHeader } from '../common/Card';
import { CrossfitExercisePickerContent } from './CrossfitExercisePicker';
import { CROSSFIT_WOD_TYPES } from '../../utils/constants';
import type { CrossfitExercise } from '../../types/models';
import type { CrossfitWodType } from '../../types/enums';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExerciseItem {
  itemType: 'exercise';
  id: string;
  name: string;
  reps: string;
  weight: string;
  duration: string;
  inputType: 'reps' | 'duration';
  notes: string;
}

export interface RestItem {
  itemType: 'rest';
  id: string;
  duration: number;
}

export interface CircuitItem {
  itemType: 'circuit';
  id: string;
  name: string;
  rounds: number;
  restBetweenRounds: number;
  exercises: (Omit<ExerciseItem, 'itemType'> | Omit<RestItem, 'itemType'>)[];
}

export type SessionItem = ExerciseItem | RestItem | CircuitItem;

export interface CrossfitBlockFormData {
  wodType: CrossfitWodType | '';
  items: SessionItem[];
  totalDuration: string;
  roundDuration: string;
  targetRounds: string;
  resultTime: string;
  resultReps: string;
  resultRounds: string;
  benchmarkName: string;
}

// ─── Export flatten helper ────────────────────────────────────────────────────

export function flattenCrossfitExercises(items: SessionItem[]): CrossfitExercise[] {
  const result: CrossfitExercise[] = [];
  for (const item of items) {
    if (item.itemType === 'exercise' && item.name.trim()) {
      result.push({
        name: item.name.trim(),
        reps: item.inputType === 'reps' ? (parseInt(item.reps) || null) : null,
        weight: item.weight ? (parseFloat(item.weight) || null) : null,
        duration: item.inputType === 'duration' ? (parseInt(item.duration) || null) : null,
        notes: item.notes.trim() || null,
      });
    } else if (item.itemType === 'circuit') {
      for (let r = 0; r < item.rounds; r++) {
        for (const ex of item.exercises) {
          if ('name' in ex && (ex as any).name?.trim()) {
            const e = ex as Omit<ExerciseItem, 'itemType'>;
            result.push({
              name: e.name.trim(),
              reps: e.inputType === 'reps' ? (parseInt(e.reps) || null) : null,
              weight: e.weight ? (parseFloat(e.weight) || null) : null,
              duration: e.inputType === 'duration' ? (parseInt(e.duration) || null) : null,
              notes: e.notes?.trim() || null,
            });
          }
        }
      }
    }
  }
  return result;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function defaultExercise(): ExerciseItem {
  return { itemType: 'exercise', id: Math.random().toString(36).slice(2), name: '', reps: '', weight: '', duration: '', inputType: 'reps', notes: '' };
}

// ─── CrossfitBlockForm ────────────────────────────────────────────────────────

interface CrossfitBlockFormProps {
  onChange: (data: CrossfitBlockFormData) => void;
  initialWodType?: CrossfitWodType | '';
  initialItems?: SessionItem[];
}

export function CrossfitBlockForm({ onChange, initialWodType = '', initialItems }: CrossfitBlockFormProps) {
  const [wodType, setWodType] = useState<CrossfitWodType | ''>(initialWodType);
  const [items, setItems] = useState<SessionItem[]>(initialItems ?? []);
  const [totalDuration, setTotalDuration] = useState('');
  const [roundDuration, setRoundDuration] = useState('');
  const [targetRounds, setTargetRounds] = useState('');
  const [resultTime, setResultTime] = useState('');
  const [resultReps, setResultReps] = useState('');
  const [resultRounds, setResultRounds] = useState('');
  const [benchmarkName, setBenchmarkName] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<{ itemId: string; circuitExId?: string } | null>(null);

  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; });

  useEffect(() => {
    onChangeRef.current({ wodType, items, totalDuration, roundDuration, targetRounds, resultTime, resultReps, resultRounds, benchmarkName });
  }, [wodType, items, totalDuration, roundDuration, targetRounds, resultTime, resultReps, resultRounds, benchmarkName]);

  // ── Item management ──────────────────────────────────────────────────────────

  function addExercise() {
    setItems(prev => [...prev, defaultExercise()]);
  }

  function addRest() {
    setItems(prev => [...prev, { itemType: 'rest', id: Math.random().toString(36).slice(2), duration: 30 }]);
  }

  function addCircuit() {
    const ex = { id: Math.random().toString(36).slice(2), name: '', reps: '', weight: '', duration: '', inputType: 'reps' as const, notes: '' };
    setItems(prev => [...prev, {
      itemType: 'circuit', id: Math.random().toString(36).slice(2),
      name: 'Circuit', rounds: 3, restBetweenRounds: 60, exercises: [ex],
    }]);
  }

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const duplicateItem = useCallback((id: string) => {
    setItems(prev => {
      const idx = prev.findIndex(i => i.id === id);
      if (idx === -1) return prev;
      const clone: SessionItem = JSON.parse(JSON.stringify(prev[idx]));
      clone.id = Math.random().toString(36).slice(2);
      if (clone.itemType === 'circuit') {
        clone.exercises = clone.exercises.map((ex: any) => ({ ...ex, id: Math.random().toString(36).slice(2) }));
      }
      const next = [...prev];
      next.splice(idx + 1, 0, clone);
      return next;
    });
  }, []);

  const updateItem = useCallback((id: string, patch: Record<string, unknown>) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i));
  }, []);

  // ── Circuit management ──────────────────────────────────────────────────────

  const updateCircuit = useCallback((id: string, patch: Partial<Pick<CircuitItem, 'name' | 'rounds' | 'restBetweenRounds'>>) => {
    setItems(prev => prev.map(i => i.id === id && i.itemType === 'circuit' ? { ...i, ...patch } : i));
  }, []);

  const addExerciseToCircuit = useCallback((circuitId: string) => {
    const newEx = { id: Math.random().toString(36).slice(2), name: '', reps: '', weight: '', duration: '', inputType: 'reps' as const, notes: '' };
    setItems(prev => prev.map(i => {
      if (i.id !== circuitId || i.itemType !== 'circuit') return i;
      return { ...i, exercises: [...i.exercises, newEx] };
    }));
    setPickerTarget({ itemId: circuitId, circuitExId: newEx.id });
    setPickerOpen(true);
  }, []);

  function addRestToCircuit(circuitId: string) {
    setItems(prev => prev.map(i => {
      if (i.id !== circuitId || i.itemType !== 'circuit') return i;
      return { ...i, exercises: [...i.exercises, { id: Math.random().toString(36).slice(2), itemType: 'rest', duration: 30 }] };
    }));
  }

  const removeFromCircuit = useCallback((circuitId: string, exId: string) => {
    setItems(prev => prev.map(i => {
      if (i.id !== circuitId || i.itemType !== 'circuit' || i.exercises.length <= 1) return i;
      return { ...i, exercises: i.exercises.filter(e => e.id !== exId) };
    }));
  }, []);

  const duplicateInCircuit = useCallback((circuitId: string, exId: string) => {
    setItems(prev => prev.map(i => {
      if (i.id !== circuitId || i.itemType !== 'circuit') return i;
      const idx = i.exercises.findIndex(e => e.id === exId);
      if (idx === -1) return i;
      const clone = { ...JSON.parse(JSON.stringify(i.exercises[idx])), id: Math.random().toString(36).slice(2) };
      const next = [...i.exercises];
      next.splice(idx + 1, 0, clone);
      return { ...i, exercises: next };
    }));
  }, []);

  const updateCircuitItem = useCallback((circuitId: string, exId: string, patch: Record<string, unknown>) => {
    setItems(prev => prev.map(i => {
      if (i.id !== circuitId || i.itemType !== 'circuit') return i;
      return { ...i, exercises: i.exercises.map(e => e.id === exId ? { ...e, ...patch } : e) };
    }));
  }, []);

  const selectedWod = CROSSFIT_WOD_TYPES.find(w => w.id === wodType);

  return (
    <>
      <div className="space-y-4">
        {/* WOD Type selector */}
        <Card className="p-4 space-y-3">
          <CardHeader title="Type de WOD" />
          <div className="space-y-2">
            {CROSSFIT_WOD_TYPES.map(wod => (
              <button key={wod.id} type="button" onClick={() => setWodType(wod.id as CrossfitWodType)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors text-left ${wodType === wod.id ? 'bg-orange-600/20 border-orange-500/40 text-orange-300' : 'border-white/10 text-[#a3a3a3] hover:border-orange-500/30 hover:text-[#f5f5f5]'}`}
              >
                <div>
                  <p className="font-rajdhani font-bold text-sm tracking-wide">{wod.label}</p>
                  <p className="text-xs text-[#6b6b6b] mt-0.5">{wod.description}</p>
                </div>
                {wodType === wod.id && <span className="text-orange-400 text-sm">✓</span>}
              </button>
            ))}
          </div>
        </Card>

        {/* WOD params (shown when a type is selected) */}
        {wodType && (
          <Card className="p-4 space-y-4">
            <CardHeader title={`Paramètres ${selectedWod?.label}`} />
            <div className="grid grid-cols-2 gap-3">
              {(wodType === 'emom' || wodType === 'amrap' || wodType === 'for_rounds') && (
                <Input label="Durée totale (min)" type="number" value={totalDuration} onChange={e => setTotalDuration(e.target.value)} placeholder="Ex: 20" />
              )}
              {wodType === 'emom' && <Input label="Durée par round (sec)" type="number" value={roundDuration} onChange={e => setRoundDuration(e.target.value)} placeholder="Ex: 60" />}
              {wodType === 'amrap' && <Input label="Résultat (reps)" type="number" value={resultReps} onChange={e => setResultReps(e.target.value)} placeholder="Total reps" />}
              {wodType === 'for_rounds' && <>
                <Input label="Rounds cibles" type="number" value={targetRounds} onChange={e => setTargetRounds(e.target.value)} placeholder="Ex: 5" />
                <Input label="Rounds réalisés" type="number" value={resultRounds} onChange={e => setResultRounds(e.target.value)} placeholder="Ex: 4" />
              </>}
              {wodType === 'for_time' && <Input label="Temps réalisé (mm:ss)" value={resultTime} onChange={e => setResultTime(e.target.value)} placeholder="Ex: 12:34" />}
              {wodType === 'benchmark' && <div className="col-span-2"><Input label="Nom du benchmark" value={benchmarkName} onChange={e => setBenchmarkName(e.target.value)} placeholder="Ex: Fran, Murph, Cindy..." /></div>}
            </div>
          </Card>
        )}

        {/* Exercices */}
        <Card className="p-4 space-y-4">
          <CardHeader title="Exercices" />
          {items.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-[#4a4a4a] text-sm mb-3">Aucun exercice ajouté</p>
              <Button size="sm" onClick={addExercise} className="bg-orange-600 hover:bg-orange-500 text-white border-0">
                <Plus className="w-4 h-4 mr-1" />Ajouter un exercice
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, idx) => {
                if (item.itemType === 'exercise') {
                  return (
                    <CrossfitExerciseBlock
                      key={item.id}
                      exercise={item}
                      index={idx}
                      onUpdate={(field, value) => updateItem(item.id, { [field]: value })}
                      onRemove={() => removeItem(item.id)}
                      onDuplicate={() => duplicateItem(item.id)}
                      onOpenPicker={() => { setPickerTarget({ itemId: item.id }); setPickerOpen(true); }}
                    />
                  );
                }

                if (item.itemType === 'rest') {
                  return (
                    <div key={item.id} className="flex items-center gap-3 px-3 py-2 bg-[#0d0d0d] border border-white/5 rounded-xl">
                      <span className="text-xs text-[#6b6b6b]">Repos</span>
                      <input type="number" min={5} max={600} step={5} value={item.duration}
                        onChange={e => updateItem(item.id, { duration: parseInt(e.target.value) || 30 })}
                        className="w-16 bg-[#1a1a1a] border border-white/10 rounded px-2 py-1 text-sm text-orange-300 text-center outline-none focus:border-orange-500/50"
                      />
                      <span className="text-xs text-[#6b6b6b]">s</span>
                      <button onClick={() => duplicateItem(item.id)} className="ml-auto p-1 text-[#4a4a4a] hover:text-orange-300 transition-colors" title="Dupliquer"><Copy className="w-3.5 h-3.5" /></button>
                      <button onClick={() => removeItem(item.id)} className="p-1 text-[#4a4a4a] hover:text-red-400 transition-colors"><X className="w-4 h-4" /></button>
                    </div>
                  );
                }

                // Circuit
                return (
                  <div key={item.id} className="bg-orange-950/15 border border-orange-900/40 rounded-xl p-3 space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <RotateCcw className="w-4 h-4 text-orange-400 flex-shrink-0" />
                      <input type="text" value={item.name} onChange={e => updateCircuit(item.id, { name: e.target.value })}
                        className="flex-1 min-w-0 bg-transparent text-sm font-bold text-orange-300 outline-none border-b border-orange-800/40 focus:border-orange-500 pb-0.5"
                        placeholder="Nom du circuit"
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-[#6b6b6b]">×</span>
                        <input type="number" min={1} max={20} value={item.rounds}
                          onChange={e => updateCircuit(item.id, { rounds: parseInt(e.target.value) || 1 })}
                          className="w-10 bg-[#1a1a1a] border border-white/10 rounded text-xs text-[#f5f5f5] text-center outline-none py-1"
                        />
                        <span className="text-xs text-[#6b6b6b]">rounds</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <input type="number" min={0} max={600} step={15} value={item.restBetweenRounds}
                          onChange={e => updateCircuit(item.id, { restBetweenRounds: parseInt(e.target.value) || 0 })}
                          className="w-14 bg-[#1a1a1a] border border-white/10 rounded text-xs text-[#f5f5f5] text-center outline-none py-1"
                        />
                        <span className="text-xs text-[#6b6b6b]">s repos</span>
                      </div>
                      <button onClick={() => duplicateItem(item.id)} className="p-1.5 text-[#4a4a4a] hover:text-orange-300 transition-colors" title="Dupliquer le circuit"><Copy className="w-3.5 h-3.5" /></button>
                      <button onClick={() => removeItem(item.id)} className="p-1.5 text-[#4a4a4a] hover:text-red-400 transition-colors"><X className="w-4 h-4" /></button>
                    </div>

                    <div className="space-y-2 pl-2 border-l-2 border-orange-900/40">
                      {item.exercises.map((ex, exIdx) => {
                        if ('itemType' in ex && ex.itemType === 'rest') {
                          return (
                            <div key={ex.id} className="flex items-center gap-3 px-2 py-1">
                              <span className="text-xs text-[#6b6b6b]">Repos</span>
                              <input type="number" min={5} max={300} step={5} value={(ex as any).duration}
                                onChange={e => updateCircuitItem(item.id, ex.id, { duration: parseInt(e.target.value) || 30 })}
                                className="w-14 bg-[#1a1a1a] border border-white/10 rounded px-2 py-1 text-xs text-orange-300 text-center outline-none"
                              />
                              <span className="text-xs text-[#6b6b6b]">s</span>
                              <button onClick={() => duplicateInCircuit(item.id, ex.id)} className="ml-auto p-1 text-[#4a4a4a] hover:text-orange-300 transition-colors"><Copy className="w-3 h-3" /></button>
                              <button onClick={() => removeFromCircuit(item.id, ex.id)} className="p-1 text-[#4a4a4a] hover:text-red-400 transition-colors"><X className="w-3.5 h-3.5" /></button>
                            </div>
                          );
                        }
                        const e = ex as Omit<ExerciseItem, 'itemType'>;
                        return (
                          <CrossfitExerciseBlock
                            key={e.id}
                            exercise={{ ...e, itemType: 'exercise' }}
                            index={exIdx}
                            compact
                            onUpdate={(field, value) => updateCircuitItem(item.id, e.id, { [field]: value })}
                            onRemove={() => removeFromCircuit(item.id, e.id)}
                            onDuplicate={() => duplicateInCircuit(item.id, e.id)}
                            onOpenPicker={() => { setPickerTarget({ itemId: item.id, circuitExId: e.id }); setPickerOpen(true); }}
                          />
                        );
                      })}
                      <div className="flex gap-3 pt-1">
                        <button onClick={() => addExerciseToCircuit(item.id)} className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 transition-colors">
                          <Plus className="w-3.5 h-3.5" />Ajouter exercice
                        </button>
                        <button onClick={() => addRestToCircuit(item.id)} className="flex items-center gap-1 text-xs text-[#6b6b6b] hover:text-orange-300 transition-colors">
                          <Plus className="w-3.5 h-3.5" />Ajouter repos
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="ghost" onClick={addExercise} className="flex-1 border border-white/10 hover:border-orange-500/40">
              <Plus className="w-4 h-4 mr-1" />Exercice
            </Button>
            <Button size="sm" variant="ghost" onClick={addRest} className="flex-1 border border-white/10 hover:border-orange-500/40">
              <Plus className="w-4 h-4 mr-1" />Repos
            </Button>
            <Button size="sm" variant="ghost" onClick={addCircuit} className="flex-1 border border-orange-900/50 text-orange-400 hover:border-orange-700/60">
              <RotateCcw className="w-4 h-4 mr-1" />Circuit
            </Button>
          </div>
        </Card>
      </div>

      <Modal isOpen={pickerOpen} onClose={() => setPickerOpen(false)} title="Choisir un exercice" size="md">
        <div className="p-4">
          <CrossfitExercisePickerContent
            selected={(() => {
              if (!pickerTarget) return '';
              const item = items.find(i => i.id === pickerTarget.itemId);
              if (!item) return '';
              if (item.itemType === 'exercise') return item.name;
              if (item.itemType === 'circuit' && pickerTarget.circuitExId) {
                const ex = item.exercises.find(e => e.id === pickerTarget.circuitExId);
                return (ex as any)?.name ?? '';
              }
              return '';
            })()}
            onSelect={n => {
              if (!pickerTarget) return;
              if (pickerTarget.circuitExId) {
                updateCircuitItem(pickerTarget.itemId, pickerTarget.circuitExId, { name: n });
              } else {
                updateItem(pickerTarget.itemId, { name: n });
              }
              setPickerOpen(false);
            }}
          />
        </div>
      </Modal>
    </>
  );
}

// ─── CrossfitExerciseBlock ────────────────────────────────────────────────────

export interface CrossfitExerciseBlockProps {
  exercise: ExerciseItem;
  index: number;
  compact?: boolean;
  onUpdate: (field: keyof ExerciseItem, value: string) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onOpenPicker: () => void;
}

export function CrossfitExerciseBlock({ exercise, index, compact, onUpdate, onRemove, onDuplicate, onOpenPicker }: CrossfitExerciseBlockProps) {
  const cls = compact
    ? 'bg-[#0d0d0d]/60 border border-white/5 rounded-lg p-2.5 space-y-2'
    : 'bg-[#0d0d0d] border border-white/5 rounded-xl p-3 space-y-3';
  return (
    <div className={cls}>
      <div className="flex items-center gap-2">
        <span className="text-xs font-rajdhani font-bold text-orange-400 w-5">{index + 1}</span>
        <div className="flex-1">
          {exercise.name ? (
            <button type="button" onClick={onOpenPicker} className="w-full text-left px-3 py-1.5 bg-[#1a1a1a] border border-orange-500/30 rounded-lg text-sm text-[#f5f5f5] hover:border-orange-400/50 transition-colors">
              {exercise.name}
            </button>
          ) : (
            <button type="button" onClick={onOpenPicker} className="w-full text-left px-3 py-1.5 bg-[#1a1a1a] border border-white/10 rounded-lg text-sm text-[#4a4a4a] hover:border-orange-500/30 hover:text-[#a3a3a3] transition-colors">
              Exercice...
            </button>
          )}
        </div>
        <div className="flex rounded-lg overflow-hidden border border-white/10">
          <button onClick={() => onUpdate('inputType', 'reps')} className={`px-2 py-1.5 text-xs font-medium transition-colors ${exercise.inputType === 'reps' ? 'bg-orange-600/30 text-orange-300' : 'text-[#6b6b6b] hover:text-[#d4d4d4]'}`}>Reps</button>
          <button onClick={() => onUpdate('inputType', 'duration')} className={`px-2 py-1.5 text-xs font-medium transition-colors ${exercise.inputType === 'duration' ? 'bg-orange-600/30 text-orange-300' : 'text-[#6b6b6b] hover:text-[#d4d4d4]'}`}>Temps</button>
        </div>
        <button onClick={onDuplicate} className="p-1.5 text-[#4a4a4a] hover:text-orange-300 transition-colors" title="Dupliquer"><Copy className="w-3.5 h-3.5" /></button>
        <button onClick={onRemove} className="p-1.5 text-[#4a4a4a] hover:text-red-400 transition-colors"><X className="w-4 h-4" /></button>
      </div>

      <div className="flex gap-2 pl-7 flex-wrap">
        {exercise.inputType === 'reps' ? (
          <input type="number" min="1" value={exercise.reps} onChange={e => onUpdate('reps', e.target.value)} placeholder="Reps"
            className="w-20 bg-[#1a1a1a] border border-white/10 rounded-lg px-2 py-1 text-sm text-[#f5f5f5] placeholder-[#4a4a4a] focus:outline-none focus:border-orange-500/50 text-center" />
        ) : (
          <div className="flex items-center gap-1">
            <input type="number" min="1" value={exercise.duration} onChange={e => onUpdate('duration', e.target.value)} placeholder="Sec"
              className="w-20 bg-[#1a1a1a] border border-white/10 rounded-lg px-2 py-1 text-sm text-[#f5f5f5] placeholder-[#4a4a4a] focus:outline-none focus:border-orange-500/50 text-center" />
            <span className="text-xs text-[#4a4a4a]">s</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <input type="number" min="0" step="0.5" value={exercise.weight} onChange={e => onUpdate('weight', e.target.value)} placeholder="kg"
            className="w-20 bg-[#1a1a1a] border border-white/10 rounded-lg px-2 py-1 text-sm text-[#f5f5f5] placeholder-[#4a4a4a] focus:outline-none focus:border-orange-500/50 text-center" />
          <span className="text-xs text-[#4a4a4a]">kg</span>
        </div>
        <input type="text" value={exercise.notes} onChange={e => onUpdate('notes', e.target.value)} placeholder="Notes optionnelles..."
          className="flex-1 min-w-32 bg-[#1a1a1a] border border-white/10 rounded-lg px-2 py-1 text-sm text-[#f5f5f5] placeholder-[#4a4a4a] focus:outline-none focus:border-orange-500/50" />
      </div>
    </div>
  );
}
