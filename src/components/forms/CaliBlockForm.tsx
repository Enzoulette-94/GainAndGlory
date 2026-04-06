import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Plus, Trash2, X, Copy, RotateCcw, GripVertical, CheckCircle2, Clock } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { CalisthenicsPickerContent } from './ExercisePicker';
import { CircuitWizard } from './CircuitWizard';
import { CircuitTemplates } from './CircuitTemplates';
import type { CircuitWizardConfig } from './CircuitWizard';
import type { CircuitTemplate } from './CircuitTemplates';
import type { CaliExercise, CaliSet } from '../../types/models';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CaliSetRow {
  reps: string;
  hold_seconds: string;
  weight_kg: string;
}

export interface ExerciseItem {
  itemType: 'exercise';
  id: string;
  name: string;
  set_type: 'reps' | 'timed';
  has_weight: boolean;
  sets: CaliSetRow[];
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

export interface CaliBlockFormData {
  items: SessionItem[];
}

// ─── Export flatten helper ────────────────────────────────────────────────────

export function flattenToCaliExercises(items: SessionItem[]): CaliExercise[] {
  const result: CaliExercise[] = [];
  for (const item of items) {
    if (item.itemType === 'exercise' && item.name.trim()) {
      result.push({
        name: item.name.trim(),
        set_type: item.set_type,
        sets: item.sets.map(s => ({
          reps: item.set_type === 'reps' ? (parseInt(s.reps) || null) : null,
          hold_seconds: item.set_type === 'timed' ? (parseInt(s.hold_seconds) || null) : null,
          weight_kg: item.has_weight ? (parseFloat(s.weight_kg) || null) : null,
        })) as CaliSet[],
      });
    } else if (item.itemType === 'circuit') {
      for (let r = 0; r < item.rounds; r++) {
        for (const ex of item.exercises) {
          if ('name' in ex && (ex as any).name?.trim()) {
            const e = ex as Omit<ExerciseItem, 'itemType'>;
            result.push({
              name: e.name.trim(),
              set_type: e.set_type,
              sets: e.sets.map(s => ({
                reps: e.set_type === 'reps' ? (parseInt(s.reps) || null) : null,
                hold_seconds: e.set_type === 'timed' ? (parseInt(s.hold_seconds) || null) : null,
                weight_kg: e.has_weight ? (parseFloat(s.weight_kg) || null) : null,
              })) as CaliSet[],
            });
          }
        }
      }
    }
  }
  return result;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function newExerciseSlot(): Omit<ExerciseItem, 'itemType'> {
  return {
    id: Math.random().toString(36).slice(2),
    name: '',
    set_type: 'reps',
    has_weight: false,
    sets: [{ reps: '', hold_seconds: '', weight_kg: '' }],
  };
}

function createCircuitFromConfig(config: CircuitWizardConfig): CircuitItem {
  return {
    itemType: 'circuit',
    id: Math.random().toString(36).slice(2),
    name: 'Circuit',
    rounds: config.rounds,
    restBetweenRounds: config.restBetweenRounds,
    exercises: Array.from({ length: config.exerciseCount }, newExerciseSlot),
  };
}

// ─── SortableExerciseItem ─────────────────────────────────────────────────────

function SortableCaliItem({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  };
  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-1.5">
      <button
        type="button"
        className="mt-3 p-1 text-[#3a3a3a] hover:text-[#6b6b6b] cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
        aria-label="Réordonner"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-3 h-3" />
      </button>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

// ─── CircuitProgressBadge ─────────────────────────────────────────────────────

function CircuitProgressBadge({ filled, total, rounds }: { filled: number; total: number; rounds: number }) {
  const isComplete = filled === total && total > 0;
  const estMinutes = Math.max(1, Math.round((rounds * total * 30) / 60));
  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <span className={`text-xs font-medium ${isComplete ? 'text-green-400' : 'text-[#6b6b6b]'}`}>
        {filled}/{total} ex.
      </span>
      <span className="flex items-center gap-1 text-xs text-[#4a4a4a]">
        <Clock className="w-3 h-3" />~{estMinutes} min
      </span>
    </div>
  );
}

// ─── CaliBlockForm ────────────────────────────────────────────────────────────

interface CaliBlockFormProps {
  onChange: (data: CaliBlockFormData) => void;
  initialItems?: SessionItem[];
}

export function CaliBlockForm({ onChange, initialItems }: CaliBlockFormProps) {
  const [items, setItems] = useState<SessionItem[]>(initialItems ?? []);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<{ itemId: string; circuitExId?: string } | null>(null);
  const [showWizard, setShowWizard] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; });

  useEffect(() => {
    onChangeRef.current({ items });
  }, [items]);

  // ── Top-level items ───────────────────────────────────────────────────────

  function addExercise() {
    const newItem: ExerciseItem = { itemType: 'exercise', ...newExerciseSlot() };
    setItems(prev => [...prev, newItem]);
  }

  function addRest() {
    setItems(prev => [...prev, { itemType: 'rest', id: Math.random().toString(36).slice(2), duration: 30 }]);
  }

  function addCircuitFromConfig(config: CircuitWizardConfig) {
    setShowWizard(false);
    setItems(prev => [...prev, createCircuitFromConfig(config)]);
  }

  function addCircuitFromTemplate(tpl: CircuitTemplate) {
    setItems(prev => [...prev, createCircuitFromConfig(tpl)]);
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

  const updateExerciseItem = useCallback((id: string, patch: Partial<Omit<ExerciseItem, 'itemType' | 'id'>>) => {
    setItems(prev => prev.map(i => i.id === id && i.itemType === 'exercise' ? { ...i, ...patch } : i));
  }, []);

  const updateRestItem = useCallback((id: string, duration: number) => {
    setItems(prev => prev.map(i => i.id === id && i.itemType === 'rest' ? { ...i, duration } : i));
  }, []);

  const addSetToItem = useCallback((id: string) => {
    setItems(prev => prev.map(i => {
      if (i.id !== id || i.itemType !== 'exercise') return i;
      return { ...i, sets: [...i.sets, { reps: '', hold_seconds: '', weight_kg: '' }] };
    }));
  }, []);

  const removeSetFromItem = useCallback((id: string, setIdx: number) => {
    setItems(prev => prev.map(i => {
      if (i.id !== id || i.itemType !== 'exercise' || i.sets.length <= 1) return i;
      return { ...i, sets: i.sets.filter((_, k) => k !== setIdx) };
    }));
  }, []);

  const duplicateSetInItem = useCallback((id: string, setIdx: number) => {
    setItems(prev => prev.map(i => {
      if (i.id !== id || i.itemType !== 'exercise') return i;
      const clone = { ...i.sets[setIdx] };
      const sets = [...i.sets];
      sets.splice(setIdx + 1, 0, clone);
      return { ...i, sets };
    }));
  }, []);

  const updateSetInItem = useCallback((id: string, setIdx: number, field: keyof CaliSetRow, value: string) => {
    setItems(prev => prev.map(i => {
      if (i.id !== id || i.itemType !== 'exercise') return i;
      return { ...i, sets: i.sets.map((s, k) => k === setIdx ? { ...s, [field]: value } : s) };
    }));
  }, []);

  // ── Circuit management ──────────────────────────────────────────────────────

  const updateCircuit = useCallback((id: string, patch: Partial<Pick<CircuitItem, 'name' | 'rounds' | 'restBetweenRounds'>>) => {
    setItems(prev => prev.map(i => i.id === id && i.itemType === 'circuit' ? { ...i, ...patch } : i));
  }, []);

  const addExerciseToCircuit = useCallback((circuitId: string) => {
    const newEx = newExerciseSlot();
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
      return { ...i, exercises: [...i.exercises, clone] };
    }));
  }, []);

  const reorderCircuitExercises = useCallback((circuitId: string, fromIdx: number, toIdx: number) => {
    setItems(prev => prev.map(i => {
      if (i.id !== circuitId || i.itemType !== 'circuit') return i;
      return { ...i, exercises: arrayMove(i.exercises, fromIdx, toIdx) };
    }));
  }, []);

  const updateCircuitExercise = useCallback((circuitId: string, exId: string, patch: Record<string, unknown>) => {
    setItems(prev => prev.map(i => {
      if (i.id !== circuitId || i.itemType !== 'circuit') return i;
      return { ...i, exercises: i.exercises.map(e => e.id === exId ? { ...e, ...patch } : e) };
    }));
  }, []);

  const updateCircuitRest = useCallback((circuitId: string, exId: string, duration: number) => {
    setItems(prev => prev.map(i => {
      if (i.id !== circuitId || i.itemType !== 'circuit') return i;
      return { ...i, exercises: i.exercises.map(e => e.id === exId ? { ...e, duration } : e) };
    }));
  }, []);

  return (
    <>
      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-[#4a4a4a] text-sm mb-3">Aucun exercice ajouté</p>
            <Button size="sm" onClick={addExercise} className="bg-violet-600 hover:bg-violet-500 text-white border-0">
              <Plus className="w-4 h-4 mr-1" />Ajouter un exercice
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, idx) => {
              if (item.itemType === 'exercise') {
                return (
                  <CaliExerciseBlock
                    key={item.id}
                    exercise={item}
                    index={idx}
                    onUpdate={(field, value) => updateExerciseItem(item.id, { [field]: value } as any)}
                    onRemove={() => removeItem(item.id)}
                    onDuplicate={() => duplicateItem(item.id)}
                    onAddSet={() => addSetToItem(item.id)}
                    onRemoveSet={si => removeSetFromItem(item.id, si)}
                    onDuplicateSet={si => duplicateSetInItem(item.id, si)}
                    onUpdateSet={(si, f, v) => updateSetInItem(item.id, si, f, v)}
                    onOpenPicker={() => { setPickerTarget({ itemId: item.id }); setPickerOpen(true); }}
                  />
                );
              }

              if (item.itemType === 'rest') {
                return (
                  <div key={item.id} className="flex items-center gap-3 px-3 py-2 bg-[#0d0d0d] border border-white/5 rounded-xl">
                    <span className="text-xs text-[#6b6b6b]">Repos</span>
                    <input
                      type="number" min={5} max={600} step={5}
                      value={item.duration}
                      onChange={e => updateRestItem(item.id, parseInt(e.target.value) || 30)}
                      className="w-16 bg-[#1a1a1a] border border-white/10 rounded px-2 py-1 text-sm text-violet-300 text-center outline-none focus:border-violet-500/50"
                    />
                    <span className="text-xs text-[#6b6b6b]">s</span>
                    <button onClick={() => duplicateItem(item.id)} className="ml-auto p-1 text-[#4a4a4a] hover:text-violet-300 transition-colors">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => removeItem(item.id)} className="p-1 text-[#4a4a4a] hover:text-red-400 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              }

              // ── Circuit ──
              const exerciseItems = item.exercises.filter(e => !('itemType' in e) || (e as any).itemType !== 'rest');
              const filledCount = exerciseItems.filter(e => 'name' in e && (e as any).name?.trim()).length;
              const isComplete = filledCount === exerciseItems.length && exerciseItems.length > 0;

              return (
                <div
                  key={item.id}
                  className={`border rounded-xl p-3 space-y-3 transition-colors duration-300 ${
                    isComplete
                      ? 'bg-green-950/10 border-green-500/40'
                      : 'bg-violet-950/15 border-violet-900/40'
                  }`}
                >
                  {/* Header */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      {isComplete
                        ? <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                        : <RotateCcw className="w-4 h-4 text-violet-400 flex-shrink-0" />
                      }
                      <input
                        type="text"
                        value={item.name}
                        onChange={e => updateCircuit(item.id, { name: e.target.value })}
                        className={`flex-1 min-w-0 bg-transparent text-sm font-bold outline-none border-b pb-0.5 transition-colors ${
                          isComplete
                            ? 'text-green-300 border-green-800/40 focus:border-green-500'
                            : 'text-violet-300 border-violet-800/40 focus:border-violet-500'
                        }`}
                        placeholder="Nom du circuit"
                      />
                      <CircuitProgressBadge
                        filled={filledCount}
                        total={exerciseItems.length}
                        rounds={item.rounds}
                      />
                      <button onClick={() => duplicateItem(item.id)} className="p-1.5 text-[#4a4a4a] hover:text-violet-300 transition-colors flex-shrink-0">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => removeItem(item.id)} className="p-1.5 text-[#4a4a4a] hover:text-red-400 transition-colors flex-shrink-0">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Rounds + repos */}
                    <div className="flex items-center gap-3 pl-6 flex-wrap">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-[#6b6b6b]">×</span>
                        <input
                          type="number" min={1} max={20} value={item.rounds}
                          onChange={e => updateCircuit(item.id, { rounds: parseInt(e.target.value) || 1 })}
                          className="w-10 bg-[#1a1a1a] border border-white/10 rounded text-xs text-[#f5f5f5] text-center outline-none py-1"
                        />
                        <span className="text-xs text-[#6b6b6b]">rounds</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="number" min={0} max={600} step={15} value={item.restBetweenRounds}
                          onChange={e => updateCircuit(item.id, { restBetweenRounds: parseInt(e.target.value) || 0 })}
                          className="w-14 bg-[#1a1a1a] border border-white/10 rounded text-xs text-[#f5f5f5] text-center outline-none py-1"
                        />
                        <span className="text-xs text-[#6b6b6b]">s repos</span>
                      </div>
                    </div>
                  </div>

                  {/* Exercises with DnD */}
                  <div className={`space-y-2 pl-2 border-l-2 transition-colors ${isComplete ? 'border-green-900/40' : 'border-violet-900/40'}`}>
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={(event: DragEndEvent) => {
                        const { active, over } = event;
                        if (!over || active.id === over.id) return;
                        const fromIdx = item.exercises.findIndex(e => e.id === active.id);
                        const toIdx = item.exercises.findIndex(e => e.id === over.id);
                        if (fromIdx !== -1 && toIdx !== -1) {
                          reorderCircuitExercises(item.id, fromIdx, toIdx);
                        }
                      }}
                    >
                      <SortableContext
                        items={item.exercises.map(e => e.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {item.exercises.map((ex, exIdx) => {
                          if ('itemType' in ex && ex.itemType === 'rest') {
                            return (
                              <SortableCaliItem key={ex.id} id={ex.id}>
                                <div className="flex items-center gap-3 px-2 py-1">
                                  <span className="text-xs text-[#6b6b6b]">Repos</span>
                                  <input
                                    type="number" min={5} max={300} step={5}
                                    value={(ex as any).duration}
                                    onChange={e => updateCircuitRest(item.id, ex.id, parseInt(e.target.value) || 30)}
                                    className="w-14 bg-[#1a1a1a] border border-white/10 rounded px-2 py-1 text-xs text-violet-300 text-center outline-none"
                                  />
                                  <span className="text-xs text-[#6b6b6b]">s</span>
                                  <button onClick={() => duplicateInCircuit(item.id, ex.id)} className="ml-auto p-1 text-[#4a4a4a] hover:text-violet-300 transition-colors"><Copy className="w-3 h-3" /></button>
                                  <button onClick={() => removeFromCircuit(item.id, ex.id)} className="p-1 text-[#4a4a4a] hover:text-red-400 transition-colors"><X className="w-3.5 h-3.5" /></button>
                                </div>
                              </SortableCaliItem>
                            );
                          }
                          const e = ex as Omit<ExerciseItem, 'itemType'>;
                          return (
                            <SortableCaliItem key={e.id} id={e.id}>
                              <CaliExerciseBlock
                                exercise={{ ...e, itemType: 'exercise' }}
                                index={exIdx}
                                compact
                                onUpdate={(field, value) => updateCircuitExercise(item.id, e.id, { [field]: value })}
                                onRemove={() => removeFromCircuit(item.id, e.id)}
                                onDuplicate={() => duplicateInCircuit(item.id, e.id)}
                                onAddSet={() => updateCircuitExercise(item.id, e.id, { sets: [...e.sets, { reps: '', hold_seconds: '', weight_kg: '' }] })}
                                onRemoveSet={si => {
                                  if (e.sets.length <= 1) return;
                                  updateCircuitExercise(item.id, e.id, { sets: e.sets.filter((_, k) => k !== si) });
                                }}
                                onDuplicateSet={si => {
                                  const sets = [...e.sets];
                                  sets.splice(si + 1, 0, { ...e.sets[si] });
                                  updateCircuitExercise(item.id, e.id, { sets });
                                }}
                                onUpdateSet={(si, f, v) => {
                                  const sets = e.sets.map((s, k) => k === si ? { ...s, [f]: v } : s);
                                  updateCircuitExercise(item.id, e.id, { sets });
                                }}
                                onOpenPicker={() => { setPickerTarget({ itemId: item.id, circuitExId: e.id }); setPickerOpen(true); }}
                              />
                            </SortableCaliItem>
                          );
                        })}
                      </SortableContext>
                    </DndContext>

                    <div className="flex gap-3 pt-1">
                      <button
                        onClick={() => addExerciseToCircuit(item.id)}
                        className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />Ajouter exercice
                      </button>
                      <button
                        onClick={() => addRestToCircuit(item.id)}
                        className="flex items-center gap-1 text-xs text-[#6b6b6b] hover:text-violet-300 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />Ajouter repos
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="ghost" onClick={addExercise} className="flex-1 border border-white/10 hover:border-violet-500/40">
              <Plus className="w-4 h-4 mr-1" />Exercice
            </Button>
            <Button size="sm" variant="ghost" onClick={addRest} className="flex-1 border border-white/10 hover:border-violet-500/40">
              <Plus className="w-4 h-4 mr-1" />Repos
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowWizard(true)} className="flex-1 border border-violet-900/50 text-violet-400 hover:border-violet-700/60">
              <RotateCcw className="w-4 h-4 mr-1" />Circuit
            </Button>
          </div>
          <div className="flex items-center">
            <CircuitTemplates theme="violet" onSelect={addCircuitFromTemplate} />
          </div>
        </div>
      </div>

      {/* Wizard */}
      {showWizard && (
        <CircuitWizard
          theme="violet"
          onConfirm={addCircuitFromConfig}
          onCancel={() => setShowWizard(false)}
        />
      )}

      {/* Exercise picker */}
      <Modal isOpen={pickerOpen} onClose={() => setPickerOpen(false)} title="Choisir un exercice" size="md">
        <div className="p-4">
          <CalisthenicsPickerContent
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
                updateCircuitExercise(pickerTarget.itemId, pickerTarget.circuitExId, { name: n });
              } else {
                updateExerciseItem(pickerTarget.itemId, { name: n });
              }
              setPickerOpen(false);
            }}
          />
        </div>
      </Modal>
    </>
  );
}

// ─── CaliExerciseBlock ────────────────────────────────────────────────────────

export interface CaliExerciseBlockProps {
  exercise: ExerciseItem;
  index: number;
  compact?: boolean;
  onUpdate: (field: string, value: unknown) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onAddSet: () => void;
  onRemoveSet: (idx: number) => void;
  onDuplicateSet: (idx: number) => void;
  onUpdateSet: (idx: number, field: keyof CaliSetRow, value: string) => void;
  onOpenPicker: () => void;
}

export function CaliExerciseBlock({ exercise, index, compact, onUpdate, onRemove, onDuplicate, onAddSet, onRemoveSet, onDuplicateSet, onUpdateSet, onOpenPicker }: CaliExerciseBlockProps) {
  const cls = compact
    ? 'bg-[#0d0d0d]/60 border border-white/5 rounded-lg p-2.5 space-y-2'
    : 'bg-[#0d0d0d] border border-white/5 rounded-xl p-3 space-y-3';

  return (
    <div className={cls}>
      <div className="flex items-center gap-2">
        <span className="text-xs font-rajdhani font-bold text-violet-400 w-5">{index + 1}</span>
        <div className="flex-1 min-w-0">
          {exercise.name ? (
            <button type="button" onClick={onOpenPicker} className="w-full text-left px-3 py-1.5 bg-[#1a1a1a] border border-violet-500/30 rounded-lg text-sm text-[#f5f5f5] hover:border-violet-400/50 transition-colors truncate">
              {exercise.name}
            </button>
          ) : (
            <button type="button" onClick={onOpenPicker} className="w-full text-left px-3 py-1.5 bg-[#1a1a1a] border border-white/10 rounded-lg text-sm text-[#4a4a4a] hover:border-violet-500/30 hover:text-[#a3a3a3] transition-colors">
              Exercice...
            </button>
          )}
        </div>
        <div className="flex rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
          <button onClick={() => onUpdate('set_type', 'reps')} className={`px-2 py-1.5 text-xs font-medium transition-colors ${exercise.set_type === 'reps' ? 'bg-violet-600/30 text-violet-300' : 'text-[#6b6b6b] hover:text-[#d4d4d4]'}`}>Reps</button>
          <button onClick={() => onUpdate('set_type', 'timed')} className={`px-2 py-1.5 text-xs font-medium transition-colors ${exercise.set_type === 'timed' ? 'bg-violet-600/30 text-violet-300' : 'text-[#6b6b6b] hover:text-[#d4d4d4]'}`}>Temps</button>
        </div>
        <button onClick={() => onUpdate('has_weight', !exercise.has_weight)} title="Lester" className={`px-2 py-1.5 text-xs font-medium rounded-lg border transition-colors flex-shrink-0 ${exercise.has_weight ? 'border-violet-500/50 bg-violet-600/20 text-violet-300' : 'border-white/10 text-[#4a4a4a] hover:text-[#a3a3a3] hover:border-white/20'}`}>+kg</button>
        <button onClick={onDuplicate} className="p-1.5 text-[#4a4a4a] hover:text-violet-300 transition-colors flex-shrink-0"><Copy className="w-3.5 h-3.5" /></button>
        <button onClick={onRemove} className="p-1.5 text-[#4a4a4a] hover:text-red-400 transition-colors flex-shrink-0"><X className="w-4 h-4" /></button>
      </div>

      <div className="space-y-1.5 pl-7">
        {exercise.sets.map((set, si) => (
          <div key={si} className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-[#4a4a4a] w-12">Série {si + 1}</span>
            {exercise.set_type === 'reps' ? (
              <input type="number" min="1" value={set.reps} onChange={e => onUpdateSet(si, 'reps', e.target.value)} placeholder="Reps"
                className="w-20 bg-[#1a1a1a] border border-white/10 rounded-lg px-2 py-1 text-sm text-[#f5f5f5] placeholder-[#4a4a4a] focus:outline-none focus:border-violet-500/50 text-center" />
            ) : (
              <div className="flex items-center gap-1">
                <input type="number" min="1" value={set.hold_seconds} onChange={e => onUpdateSet(si, 'hold_seconds', e.target.value)} placeholder="Sec"
                  className="w-20 bg-[#1a1a1a] border border-white/10 rounded-lg px-2 py-1 text-sm text-[#f5f5f5] placeholder-[#4a4a4a] focus:outline-none focus:border-violet-500/50 text-center" />
                <span className="text-xs text-[#4a4a4a]">s</span>
              </div>
            )}
            {exercise.has_weight && (
              <div className="flex items-center gap-1">
                <input type="number" min="0" step="0.5" value={set.weight_kg} onChange={e => onUpdateSet(si, 'weight_kg', e.target.value)} placeholder="kg"
                  className="w-16 bg-[#1a1a1a] border border-violet-500/30 rounded-lg px-2 py-1 text-sm text-violet-300 placeholder-[#4a4a4a] focus:outline-none focus:border-violet-400/60 text-center" />
                <span className="text-xs text-violet-400/60">kg</span>
              </div>
            )}
            <button onClick={() => onDuplicateSet(si)} className="p-1 text-[#4a4a4a] hover:text-violet-300 transition-colors"><Copy className="w-3 h-3" /></button>
            {exercise.sets.length > 1 && (
              <button onClick={() => onRemoveSet(si)} className="p-1 text-[#4a4a4a] hover:text-red-400 transition-colors"><Trash2 className="w-3 h-3" /></button>
            )}
          </div>
        ))}
        <button onClick={onAddSet} className="flex items-center gap-1 text-xs text-[#6b6b6b] hover:text-violet-400 transition-colors mt-1">
          <Plus className="w-3 h-3" />Ajouter une série
        </button>
      </div>
    </div>
  );
}
