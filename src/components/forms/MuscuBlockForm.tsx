import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Plus, Trash2, X, Pencil, Copy, RotateCcw, ChevronLeft, GripVertical, CheckCircle2, History, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { workoutService } from '../../services/workout.service';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { Modal } from '../common/Modal';
import { calcTonnage } from '../../utils/calculations';
import { MUSCLE_GROUP_LABELS, MUSCLE_GROUP_DISPLAY } from '../../utils/constants';
import { CircuitWizard } from './CircuitWizard';
import { CircuitTemplates } from './CircuitTemplates';
import type { CircuitWizardConfig } from './CircuitWizard';
import type { CircuitTemplate } from './CircuitTemplates';
import type { Exercise, WorkoutSession } from '../../types/models';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SetRow {
  reps: number;
  weight: number;
  weightRaw: string;
  rest_time: number | null;
}

export interface ExerciseBlock {
  itemType: 'exercise';
  id: string;
  exercise: Exercise | null;
  sets: SetRow[];
}

export interface CircuitBlock {
  itemType: 'circuit';
  id: string;
  name: string;
  rounds: number;
  restBetweenRounds: number;
  exercises: Omit<ExerciseBlock, 'itemType'>[];
}

export type SessionItem = ExerciseBlock | CircuitBlock;

export interface MuscuBlockFormData {
  items: SessionItem[];
  totalTonnage: number;
}

// ─── Export flatten helper ────────────────────────────────────────────────────

export function buildMuscuSets(items: SessionItem[]): {
  exercise_id: string;
  set_number: number;
  reps: number;
  weight: number;
  rest_time?: number;
}[] {
  const sets: { exercise_id: string; set_number: number; reps: number; weight: number; rest_time?: number }[] = [];
  for (const item of items) {
    if (item.itemType === 'exercise') {
      if (!item.exercise) continue;
      item.sets.forEach((s, idx) => {
        sets.push({
          exercise_id: item.exercise!.id,
          set_number: idx + 1,
          reps: s.reps,
          weight: s.weight,
          rest_time: s.rest_time ?? undefined,
        });
      });
    } else {
      for (let r = 0; r < item.rounds; r++) {
        for (const ex of item.exercises) {
          if (!ex.exercise) continue;
          ex.sets.forEach((s, idx) => {
            sets.push({
              exercise_id: ex.exercise!.id,
              set_number: r * ex.sets.length + idx + 1,
              reps: s.reps,
              weight: s.weight,
              rest_time: s.rest_time ?? undefined,
            });
          });
        }
      }
    }
  }
  return sets;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function defaultSet(): SetRow {
  return { reps: 10, weight: 0, weightRaw: '', rest_time: null };
}

function defaultExerciseBlock(): ExerciseBlock {
  return {
    itemType: 'exercise',
    id: Math.random().toString(36).slice(2),
    exercise: null,
    sets: [defaultSet()],
  };
}

function createCircuitBlock(config: CircuitWizardConfig): CircuitBlock {
  return {
    itemType: 'circuit',
    id: Math.random().toString(36).slice(2),
    name: 'Circuit',
    rounds: config.rounds,
    restBetweenRounds: config.restBetweenRounds,
    exercises: Array.from({ length: config.exerciseCount }, () => ({
      id: Math.random().toString(36).slice(2),
      exercise: null,
      sets: [defaultSet()],
    })),
  };
}

// ─── SortableExerciseItem ─────────────────────────────────────────────────────

function SortableExerciseItem({ id, children }: { id: string; children: React.ReactNode }) {
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
        className="mt-3.5 p-1 text-[#3a3a3a] hover:text-[#6b6b6b] cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
        aria-label="Réordonner"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-3.5 h-3.5" />
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
        <Clock className="w-3 h-3" />
        ~{estMinutes} min
      </span>
    </div>
  );
}

// ─── MuscuBlockForm ───────────────────────────────────────────────────────────

interface MuscuBlockFormProps {
  onChange: (data: MuscuBlockFormData) => void;
  initialItems?: SessionItem[];
  userId?: string;
}

export function MuscuBlockForm({ onChange, initialItems, userId }: MuscuBlockFormProps) {
  const [items, setItems] = useState<SessionItem[]>(initialItems ?? [defaultExerciseBlock()]);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<{ itemId: string; circuitExId?: string } | null>(null);
  const [pickerStep, setPickerStep] = useState<'group' | 'exercises'>('group');
  const [pickerGroup, setPickerGroup] = useState<string | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historySessions, setHistorySessions] = useState<WorkoutSession[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; });

  useEffect(() => {
    workoutService
      .getExercises()
      .then(setAllExercises)
      .catch(() => {})
      .finally(() => setLoadingExercises(false));
  }, []);

  const totalTonnage = useMemo(() => {
    const allSets: SetRow[] = [];
    for (const item of items) {
      if (item.itemType === 'exercise') {
        allSets.push(...item.sets);
      } else {
        for (let r = 0; r < item.rounds; r++) {
          for (const ex of item.exercises) allSets.push(...ex.sets);
        }
      }
    }
    return calcTonnage(allSets);
  }, [items]);

  useEffect(() => {
    onChangeRef.current({ items, totalTonnage });
  }, [items, totalTonnage]);

  // ── Picker ───────────────────────────────────────────────────────────────────

  const openPicker = useCallback((itemId: string, circuitExId?: string) => {
    setPickerTarget({ itemId, circuitExId });
    setPickerStep('group');
    setPickerGroup(null);
    setPickerOpen(true);
  }, []);

  const closePicker = useCallback(() => {
    setPickerOpen(false);
    setPickerTarget(null);
  }, []);

  // ── Item management ──────────────────────────────────────────────────────────

  function addExercise() {
    const block = defaultExerciseBlock();
    setItems(prev => [...prev, block]);
    openPicker(block.id);
  }

  function addCircuitFromConfig(config: CircuitWizardConfig) {
    setShowWizard(false);
    setItems(prev => [...prev, createCircuitBlock(config)]);
  }

  function addCircuitFromTemplate(tpl: CircuitTemplate) {
    setItems(prev => [...prev, createCircuitBlock(tpl)]);
  }

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const duplicateItem = useCallback((id: string) => {
    setItems(prev => {
      const idx = prev.findIndex(i => i.id === id);
      if (idx === -1) return prev;
      const original = prev[idx];
      const clone: SessionItem = JSON.parse(JSON.stringify(original));
      clone.id = Math.random().toString(36).slice(2);
      if (clone.itemType === 'circuit') {
        clone.exercises = clone.exercises.map(ex => ({
          ...ex,
          id: Math.random().toString(36).slice(2),
        }));
      }
      const next = [...prev];
      next.splice(idx + 1, 0, clone);
      return next;
    });
  }, []);

  const updateExercise = useCallback((id: string, patch: Partial<Omit<ExerciseBlock, 'itemType'>>) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id && item.itemType === 'exercise' ? { ...item, ...patch } : item
      )
    );
  }, []);

  const updateSet = useCallback((exId: string, setIdx: number, patch: Partial<SetRow>) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== exId || item.itemType !== 'exercise') return item;
        const sets = item.sets.map((s, i) => (i === setIdx ? { ...s, ...patch } : s));
        return { ...item, sets };
      })
    );
  }, []);

  const addSet = useCallback((exId: string) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== exId || item.itemType !== 'exercise') return item;
        const lastSet = item.sets[item.sets.length - 1] ?? defaultSet();
        return { ...item, sets: [...item.sets, { ...lastSet }] };
      })
    );
  }, []);

  const removeSet = useCallback((exId: string, setIdx: number) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== exId || item.itemType !== 'exercise') return item;
        if (item.sets.length <= 1) return item;
        return { ...item, sets: item.sets.filter((_, i) => i !== setIdx) };
      })
    );
  }, []);

  const duplicateSet = useCallback((exId: string, setIdx: number) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== exId || item.itemType !== 'exercise') return item;
        const clone = { ...item.sets[setIdx] };
        const sets = [...item.sets];
        sets.splice(setIdx + 1, 0, clone);
        return { ...item, sets };
      })
    );
  }, []);

  // ── Circuit management ────────────────────────────────────────────────────────

  const updateCircuit = useCallback((id: string, patch: Partial<Omit<CircuitBlock, 'itemType' | 'id' | 'exercises'>>) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id && item.itemType === 'circuit' ? { ...item, ...patch } : item
      )
    );
  }, []);

  const addExerciseToCircuit = useCallback((circuitId: string) => {
    const newEx = { id: Math.random().toString(36).slice(2), exercise: null, sets: [defaultSet()] };
    setItems(prev =>
      prev.map(item => {
        if (item.id !== circuitId || item.itemType !== 'circuit') return item;
        return { ...item, exercises: [...item.exercises, newEx] };
      })
    );
    openPicker(circuitId, newEx.id);
  }, [openPicker]);

  const removeExerciseFromCircuit = useCallback((circuitId: string, exId: string) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== circuitId || item.itemType !== 'circuit') return item;
        if (item.exercises.length <= 1) return item;
        return { ...item, exercises: item.exercises.filter(e => e.id !== exId) };
      })
    );
  }, []);

  const duplicateExerciseInCircuit = useCallback((circuitId: string, exId: string) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== circuitId || item.itemType !== 'circuit') return item;
        const idx = item.exercises.findIndex(e => e.id === exId);
        if (idx === -1) return item;
        const clone = { ...JSON.parse(JSON.stringify(item.exercises[idx])), id: Math.random().toString(36).slice(2) };
        return { ...item, exercises: [...item.exercises, clone] };
      })
    );
  }, []);

  const reorderCircuitExercises = useCallback((circuitId: string, fromIdx: number, toIdx: number) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== circuitId || item.itemType !== 'circuit') return item;
        return { ...item, exercises: arrayMove(item.exercises, fromIdx, toIdx) };
      })
    );
  }, []);

  const updateCircuitExercise = useCallback((circuitId: string, exId: string, patch: Partial<{ exercise: Exercise | null; sets: SetRow[] }>) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== circuitId || item.itemType !== 'circuit') return item;
        return {
          ...item,
          exercises: item.exercises.map(e => e.id === exId ? { ...e, ...patch } : e),
        };
      })
    );
  }, []);

  const updateCircuitSet = useCallback((circuitId: string, exId: string, setIdx: number, patch: Partial<SetRow>) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== circuitId || item.itemType !== 'circuit') return item;
        return {
          ...item,
          exercises: item.exercises.map(e => {
            if (e.id !== exId) return e;
            return { ...e, sets: e.sets.map((s, i) => (i === setIdx ? { ...s, ...patch } : s)) };
          }),
        };
      })
    );
  }, []);

  const addCircuitSet = useCallback((circuitId: string, exId: string) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== circuitId || item.itemType !== 'circuit') return item;
        return {
          ...item,
          exercises: item.exercises.map(e => {
            if (e.id !== exId) return e;
            const lastSet = e.sets[e.sets.length - 1] ?? defaultSet();
            return { ...e, sets: [...e.sets, { ...lastSet }] };
          }),
        };
      })
    );
  }, []);

  const removeCircuitSet = useCallback((circuitId: string, exId: string, setIdx: number) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== circuitId || item.itemType !== 'circuit') return item;
        return {
          ...item,
          exercises: item.exercises.map(e => {
            if (e.id !== exId || e.sets.length <= 1) return e;
            return { ...e, sets: e.sets.filter((_, i) => i !== setIdx) };
          }),
        };
      })
    );
  }, []);

  // ── Copy from history ─────────────────────────────────────────────────────────

  async function openHistoryModal() {
    setShowHistoryModal(true);
    if (historySessions.length > 0 || !userId) return;
    setLoadingHistory(true);
    try {
      const sessions = await workoutService.getSessions(userId, 5);
      setHistorySessions(sessions.filter(s => s.sets && s.sets.length > 0));
    } catch { /* ignore */ }
    finally { setLoadingHistory(false); }
  }

  function loadSessionAsCircuit(session: WorkoutSession) {
    if (!session.sets) return;
    const seen = new Set<string>();
    const uniqueExercises: Exercise[] = [];
    for (const set of session.sets) {
      if (set.exercise && !seen.has(set.exercise.id)) {
        seen.add(set.exercise.id);
        uniqueExercises.push(set.exercise);
        if (uniqueExercises.length >= 6) break;
      }
    }
    if (uniqueExercises.length === 0) return;
    const circuit: CircuitBlock = {
      itemType: 'circuit',
      id: Math.random().toString(36).slice(2),
      name: session.name ?? 'Circuit',
      rounds: 3,
      restBetweenRounds: 60,
      exercises: uniqueExercises.map(ex => ({
        id: Math.random().toString(36).slice(2),
        exercise: ex,
        sets: [defaultSet()],
      })),
    };
    setItems(prev => [...prev, circuit]);
    setShowHistoryModal(false);
  }

  function selectExercise(exercise: Exercise) {
    if (!pickerTarget) return;
    if (pickerTarget.circuitExId) {
      updateCircuitExercise(pickerTarget.itemId, pickerTarget.circuitExId, { exercise });
    } else {
      updateExercise(pickerTarget.itemId, { exercise });
    }
    closePicker();
  }

  const groupExercises = pickerGroup
    ? allExercises.filter(e => e.muscle_group === pickerGroup)
    : [];

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#a3a3a3] uppercase tracking-wider">Exercices</h2>
          {loadingExercises && <span className="text-xs text-[#6b6b6b]">Chargement...</span>}
        </div>

        <AnimatePresence>
          {items.map((item) => {
            if (item.itemType === 'exercise') {
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.2 }}
                >
                  <ExerciseBlockCard
                    block={item}
                    onOpenPicker={() => openPicker(item.id)}
                    onRemove={() => removeItem(item.id)}
                    onDuplicate={() => duplicateItem(item.id)}
                    onUpdateSet={(si, patch) => updateSet(item.id, si, patch)}
                    onAddSet={() => addSet(item.id)}
                    onRemoveSet={(si) => removeSet(item.id, si)}
                    onDuplicateSet={(si) => duplicateSet(item.id, si)}
                  />
                </motion.div>
              );
            }

            // ── Circuit ──
            const filledCount = item.exercises.filter(ex => ex.exercise !== null).length;
            const isComplete = filledCount === item.exercises.length && item.exercises.length > 0;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.2 }}
              >
                <Card
                  className={`p-4 space-y-4 transition-colors duration-300 ${
                    isComplete
                      ? 'border-green-500/40 bg-green-950/10'
                      : 'border-red-900/40 bg-red-950/10'
                  }`}
                >
                  {/* Header ligne 1 */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      {isComplete
                        ? <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                        : <RotateCcw className="w-4 h-4 text-red-400 flex-shrink-0" />
                      }
                      <input
                        type="text"
                        value={item.name}
                        onChange={e => updateCircuit(item.id, { name: e.target.value })}
                        className={`flex-1 min-w-0 bg-transparent text-sm font-bold outline-none border-b pb-0.5 transition-colors ${
                          isComplete
                            ? 'text-green-300 border-green-800/40 focus:border-green-500'
                            : 'text-red-300 border-red-800/40 focus:border-red-500'
                        }`}
                        placeholder="Nom du circuit"
                      />
                      <CircuitProgressBadge
                        filled={filledCount}
                        total={item.exercises.length}
                        rounds={item.rounds}
                      />
                      <button
                        type="button"
                        onClick={() => duplicateItem(item.id)}
                        className="p-1.5 rounded text-[#6b6b6b] hover:text-red-300 transition-colors flex-shrink-0"
                        title="Dupliquer le circuit"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="p-1.5 rounded text-[#6b6b6b] hover:text-red-400 transition-colors flex-shrink-0"
                        title="Supprimer le circuit"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Header ligne 2 : rounds + repos */}
                    <div className="flex items-center gap-3 pl-6">
                      <div className="flex items-center gap-1">
                        <label className="text-xs text-[#6b6b6b]">×</label>
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={item.rounds}
                          onChange={e => updateCircuit(item.id, { rounds: parseInt(e.target.value) || 1 })}
                          className="w-10 bg-[#1c1c1c] border border-white/8 rounded text-xs text-[#f5f5f5] text-center outline-none focus:ring-1 focus:ring-red-500 py-1"
                          title="Nombre de rounds"
                        />
                        <label className="text-xs text-[#6b6b6b]">rounds</label>
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={0}
                          max={600}
                          step={15}
                          value={item.restBetweenRounds}
                          onChange={e => updateCircuit(item.id, { restBetweenRounds: parseInt(e.target.value) || 0 })}
                          className="w-14 bg-[#1c1c1c] border border-white/8 rounded text-xs text-[#f5f5f5] text-center outline-none focus:ring-1 focus:ring-red-500 py-1"
                          title="Repos entre rounds (s)"
                        />
                        <label className="text-xs text-[#6b6b6b]">s repos</label>
                      </div>
                    </div>
                  </div>

                  {/* Exercises list with DnD */}
                  <div className={`space-y-3 pl-2 border-l-2 transition-colors ${isComplete ? 'border-green-900/40' : 'border-red-900/40'}`}>
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
                        {item.exercises.map((ex, exIdx) => (
                          <SortableExerciseItem key={ex.id} id={ex.id}>
                            <ExerciseBlockCard
                              block={{ ...ex, itemType: 'exercise' }}
                              indexOverride={exIdx}
                              onOpenPicker={() => openPicker(item.id, ex.id)}
                              onRemove={() => removeExerciseFromCircuit(item.id, ex.id)}
                              onDuplicate={() => duplicateExerciseInCircuit(item.id, ex.id)}
                              onUpdateSet={(si, patch) => updateCircuitSet(item.id, ex.id, si, patch)}
                              onAddSet={() => addCircuitSet(item.id, ex.id)}
                              onRemoveSet={(si) => removeCircuitSet(item.id, ex.id, si)}
                              onDuplicateSet={() => {/* not needed inside circuit */}}
                              compact
                            />
                          </SortableExerciseItem>
                        ))}
                      </SortableContext>
                    </DndContext>

                    <button
                      type="button"
                      onClick={() => addExerciseToCircuit(item.id)}
                      className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 transition-colors py-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Ajouter exercice dans le circuit
                    </button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              icon={<Plus className="w-4 h-4" />}
              onClick={addExercise}
              className="flex-1"
            >
              Ajouter exercice
            </Button>
            <Button
              type="button"
              variant="outline"
              icon={<RotateCcw className="w-4 h-4" />}
              onClick={() => setShowWizard(true)}
              className="flex-1 border-red-900/50 text-red-400 hover:border-red-700/60"
            >
              Créer un circuit
            </Button>
          </div>

          {/* Circuit helpers */}
          <div className="flex items-center gap-2 flex-wrap">
            <CircuitTemplates theme="red" onSelect={addCircuitFromTemplate} />
            {userId && (
              <button
                type="button"
                onClick={openHistoryModal}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 text-xs text-[#6b6b6b] hover:text-[#d4d4d4] hover:border-white/20 transition-all"
              >
                <History className="w-3.5 h-3.5" />
                Reprendre un circuit
              </button>
            )}
          </div>
        </div>

        {totalTonnage > 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="p-4 bg-transparent border-red-900/40">
              <div className="flex items-center justify-between">
                <span className="text-sm text-red-300">Tonnage total</span>
                <span className="text-xl font-black text-red-400">{totalTonnage.toLocaleString('fr-FR')} kg</span>
              </div>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Wizard */}
      {showWizard && (
        <CircuitWizard
          theme="red"
          onConfirm={addCircuitFromConfig}
          onCancel={() => setShowWizard(false)}
        />
      )}

      {/* History modal */}
      <Modal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        title="Reprendre un circuit"
        size="md"
      >
        <div className="p-4 space-y-2">
          {loadingHistory && <p className="text-sm text-[#6b6b6b] text-center py-4">Chargement...</p>}
          {!loadingHistory && historySessions.length === 0 && (
            <p className="text-sm text-[#6b6b6b] text-center py-4">Aucune séance précédente trouvée</p>
          )}
          {historySessions.map(session => {
            const uniqueExercises = [...new Map(
              (session.sets ?? [])
                .filter(s => s.exercise)
                .map(s => [s.exercise!.id, s.exercise!])
            ).values()].slice(0, 6);
            return (
              <button
                key={session.id}
                type="button"
                onClick={() => loadSessionAsCircuit(session)}
                className="w-full text-left p-3 bg-[#1c1c1c] border border-white/8 rounded-lg hover:border-red-500/40 hover:bg-[#242424] transition-all"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-[#d4d4d4]">
                    {session.name ?? new Date(session.date).toLocaleDateString('fr-FR')}
                  </span>
                  <span className="text-xs text-[#6b6b6b]">{uniqueExercises.length} exercices</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {uniqueExercises.slice(0, 4).map(ex => (
                    <span key={ex.id} className="text-xs px-1.5 py-0.5 bg-white/5 rounded text-[#6b6b6b]">
                      {ex.name}
                    </span>
                  ))}
                  {uniqueExercises.length > 4 && (
                    <span className="text-xs text-[#4a4a4a]">+{uniqueExercises.length - 4}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </Modal>

      {/* Exercise picker */}
      <Modal
        isOpen={pickerOpen}
        onClose={closePicker}
        title={pickerStep === 'group' ? 'Groupe musculaire' : 'Choisir un exercice'}
        size="md"
      >
        <div className="p-4 space-y-3">
          {pickerStep === 'group' && (
            <div className="grid grid-cols-2 gap-2">
              {MUSCLE_GROUP_DISPLAY.map(group => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => { setPickerGroup(group.id); setPickerStep('exercises'); }}
                  className="flex items-center gap-3 p-3 bg-[#1c1c1c] border border-white/8 rounded hover:border-red-500/50 hover:bg-[#242424] transition-all text-left"
                >
                  <span className="text-sm font-medium text-[#d4d4d4]">{group.label}</span>
                </button>
              ))}
            </div>
          )}
          {pickerStep === 'exercises' && (
            <>
              <button
                type="button"
                onClick={() => setPickerStep('group')}
                className="flex items-center gap-1.5 text-sm text-[#a3a3a3] hover:text-[#d4d4d4] transition-colors mb-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Retour
              </button>
              <div className="space-y-1">
                {groupExercises.length === 0 ? (
                  <p className="text-sm text-[#6b6b6b] py-4 text-center">Aucun exercice dans ce groupe</p>
                ) : (
                  groupExercises.map(exercise => (
                    <button
                      key={exercise.id}
                      type="button"
                      onClick={() => selectExercise(exercise)}
                      className="w-full text-left px-3 py-2.5 rounded hover:bg-[#242424] text-sm text-[#d4d4d4] hover:text-white transition-colors"
                    >
                      {exercise.name}
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}

// ─── ExerciseBlockCard ────────────────────────────────────────────────────────

export interface ExerciseBlockCardProps {
  block: ExerciseBlock;
  indexOverride?: number;
  compact?: boolean;
  onOpenPicker: () => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onUpdateSet: (idx: number, patch: Partial<SetRow>) => void;
  onAddSet: () => void;
  onRemoveSet: (idx: number) => void;
  onDuplicateSet: (idx: number) => void;
}

export function ExerciseBlockCard({
  block,
  indexOverride,
  compact,
  onOpenPicker,
  onRemove,
  onDuplicate,
  onUpdateSet,
  onAddSet,
  onRemoveSet,
  onDuplicateSet,
}: ExerciseBlockCardProps) {
  const Wrapper = compact
    ? ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={className}>{children}</div>
    : ({ children, className }: { children: React.ReactNode; className?: string }) => <Card className={className}>{children}</Card>;

  return (
    <Wrapper className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          {indexOverride !== undefined && (
            <span className="text-xs text-[#6b6b6b] block mb-0.5">Exercice {indexOverride + 1}</span>
          )}
          {block.exercise ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-white">{block.exercise.name}</span>
              <span className="text-xs px-2 py-0.5 bg-transparent border border-red-800/40 text-red-300 rounded-lg">
                {MUSCLE_GROUP_LABELS[block.exercise.muscle_group]}
              </span>
              <button
                type="button"
                onClick={onOpenPicker}
                className="p-1 rounded text-[#6b6b6b] hover:text-[#e5e5e5] transition-colors"
                title="Changer l'exercice"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenPicker}
              className="w-full text-left px-3 py-2.5 bg-[#1c1c1c] border border-dashed border-white/15 rounded text-sm text-[#6b6b6b] hover:border-red-500/50 hover:text-[#a3a3a3] transition-all"
            >
              Exercice...
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onDuplicate}
          className="mt-1 p-2 rounded text-[#6b6b6b] hover:text-red-300 hover:bg-transparent transition-all"
          title="Dupliquer l'exercice"
        >
          <Copy className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="mt-1 p-2 rounded text-[#6b6b6b] hover:text-red-400 hover:bg-transparent transition-all"
          title="Supprimer l'exercice"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-[24px_1fr_1fr_1fr_24px_24px] sm:grid-cols-[32px_1fr_1fr_1fr_32px_32px] gap-1 sm:gap-2 px-1">
          <span className="text-xs text-[#6b6b6b] text-center">#</span>
          <span className="text-xs text-[#6b6b6b] text-center">Reps</span>
          <span className="text-xs text-[#6b6b6b] text-center">Poids</span>
          <span className="text-xs text-[#6b6b6b] text-center">Repos</span>
          <span />
          <span />
        </div>

        {block.sets.map((set, setIdx) => (
          <div
            key={setIdx}
            className="grid grid-cols-[24px_1fr_1fr_1fr_24px_24px] sm:grid-cols-[32px_1fr_1fr_1fr_32px_32px] gap-1 sm:gap-2 items-center"
          >
            <span className="text-xs text-[#6b6b6b] text-center font-mono">{setIdx + 1}</span>
            <input
              type="number"
              min={1}
              max={999}
              value={set.reps}
              onChange={e => onUpdateSet(setIdx, { reps: parseInt(e.target.value) || 0 })}
              className="w-full bg-[#1c1c1c] border border-white/8 rounded-lg px-2 py-2 text-sm text-[#f5f5f5] text-center outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
            />
            <input
              type="text"
              inputMode="decimal"
              value={set.weightRaw}
              onChange={e => {
                const raw = e.target.value.replace(',', '.');
                const parsed = parseFloat(raw);
                onUpdateSet(setIdx, { weightRaw: e.target.value, weight: isNaN(parsed) ? 0 : parsed });
              }}
              className="w-full bg-[#1c1c1c] border border-white/8 rounded-lg px-2 py-2 text-sm text-[#f5f5f5] text-center outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
            />
            <input
              type="number"
              min={0}
              max={600}
              step={5}
              placeholder="—"
              value={set.rest_time ?? ''}
              onChange={e => onUpdateSet(setIdx, { rest_time: e.target.value ? parseInt(e.target.value) : null })}
              className="w-full bg-[#1c1c1c] border border-white/8 rounded-lg px-2 py-2 text-sm text-[#f5f5f5] text-center outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all placeholder-slate-600"
            />
            <button
              type="button"
              onClick={() => onDuplicateSet(setIdx)}
              className="p-1 rounded-lg text-[#4a4a4a] hover:text-red-300 transition-all"
              title="Dupliquer la série"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onRemoveSet(setIdx)}
              disabled={block.sets.length <= 1}
              className="p-1 rounded-lg text-[#4a4a4a] hover:text-red-400 hover:bg-transparent transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          icon={<Plus className="w-3.5 h-3.5" />}
          onClick={onAddSet}
          className="w-full mt-1 border border-dashed border-white/8 hover:border-red-500/50"
        >
          Ajouter série
        </Button>
      </div>
    </Wrapper>
  );
}
