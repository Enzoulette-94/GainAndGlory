import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Dumbbell,
  Plus,
  Trash2,
  X,
  Pencil,
  ChevronLeft,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { workoutService } from '../services/workout.service';
import { xpService } from '../services/xp.service';
import { feedService } from '../services/feed.service';
import { Button } from '../components/common/Button';
import { Input, Textarea } from '../components/common/Input';
import { Card } from '../components/common/Card';
import { Modal } from '../components/common/Modal';
import { calcTonnage, formatNumber, formatDate } from '../utils/calculations';
import { FEEDBACK_LABELS, MUSCLE_GROUP_LABELS, MUSCLE_GROUP_DISPLAY, XP_REWARDS } from '../utils/constants';
import type { Exercise, WorkoutSession } from '../types/models';
import type { Feedback } from '../types/enums';
import { profileRecordsService } from '../services/profile-records.service';
import { notificationService } from '../services/notification.service';
import { badgesService } from '../services/badges.service';
import { BadgeUnlockModal } from '../components/xp-system/BadgeUnlockModal';
import { LevelUpModal } from '../components/xp-system/LevelUpModal';
import type { UserBadge } from '../types/models';

interface SetRow {
  reps: number;
  weight: number;
  weightRaw: string;
  rest_time: number | null;
}

interface ExerciseBlock {
  id: string;
  exercise: Exercise | null;
  sets: SetRow[];
}

function defaultSet(): SetRow {
  return { reps: 10, weight: 0, weightRaw: '', rest_time: null };
}

function defaultExerciseBlock(): ExerciseBlock {
  return {
    id: Math.random().toString(36).slice(2),
    exercise: null,
    sets: [defaultSet()],
  };
}

function toLocalDatetimeValue(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export function MuscuSessionPage() {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const copyFrom = (location.state as { copyFrom?: WorkoutSession } | null)?.copyFrom ?? null;

  const [date, setDate] = useState(toLocalDatetimeValue());
  const [sessionName, setSessionName] = useState(copyFrom?.name ?? '');
  const [exercises, setExercises] = useState<ExerciseBlock[]>(() => {
    if (copyFrom?.sets && copyFrom.sets.length > 0) {
      const grouped = new Map<string, ExerciseBlock>();
      for (const set of copyFrom.sets) {
        if (!set.exercise_id) continue;
        if (!grouped.has(set.exercise_id)) {
          grouped.set(set.exercise_id, {
            id: Math.random().toString(36).slice(2),
            exercise: set.exercise ?? null,
            sets: [],
          });
        }
        grouped.get(set.exercise_id)!.sets.push({
          reps: set.reps,
          weight: set.weight,
          weightRaw: String(set.weight),
          rest_time: set.rest_time ?? null,
        });
      }
      const blocks = Array.from(grouped.values());
      return blocks.length > 0 ? blocks : [defaultExerciseBlock()];
    }
    return [defaultExerciseBlock()];
  });
  const [feedback, setFeedback] = useState<Feedback | ''>('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [badgeQueue, setBadgeQueue] = useState<UserBadge[]>([]);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpLevel, setLevelUpLevel] = useState(0);

  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(true);

  // Picker modal state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTargetId, setPickerTargetId] = useState<string | null>(null);
  const [pickerStep, setPickerStep] = useState<'group' | 'exercises'>('group');
  const [pickerGroup, setPickerGroup] = useState<string | null>(null);

  useEffect(() => {
    workoutService
      .getExercises()
      .then(setAllExercises)
      .catch(() => {})
      .finally(() => setLoadingExercises(false));
  }, []);

  // Tonnage total en temps réel
  const totalTonnage = useMemo(() => {
    const allSets = exercises.flatMap(ex => ex.sets);
    return calcTonnage(allSets);
  }, [exercises]);

  // --- Helpers exercices ---
  function updateExercise(id: string, patch: Partial<ExerciseBlock>) {
    setExercises(prev =>
      prev.map(ex => (ex.id === id ? { ...ex, ...patch } : ex))
    );
  }

  function removeExercise(id: string) {
    setExercises(prev => prev.filter(ex => ex.id !== id));
  }

  function addExercise() {
    const block = defaultExerciseBlock();
    setExercises(prev => [...prev, block]);
    openPicker(block.id);
  }

  // --- Picker modal helpers ---
  function openPicker(targetId: string) {
    setPickerTargetId(targetId);
    setPickerStep('group');
    setPickerGroup(null);
    setPickerOpen(true);
  }

  function closePicker() {
    setPickerOpen(false);
    setPickerTargetId(null);
  }

  function selectExercise(targetId: string, exercise: Exercise) {
    updateExercise(targetId, { exercise });
    closePicker();
  }

  // --- Helpers séries ---
  function updateSet(exId: string, setIdx: number, patch: Partial<SetRow>) {
    setExercises(prev =>
      prev.map(ex => {
        if (ex.id !== exId) return ex;
        const sets = ex.sets.map((s, i) => (i === setIdx ? { ...s, ...patch } : s));
        return { ...ex, sets };
      })
    );
  }

  function addSet(exId: string) {
    setExercises(prev =>
      prev.map(ex => {
        if (ex.id !== exId) return ex;
        const lastSet = ex.sets[ex.sets.length - 1] ?? defaultSet();
        return { ...ex, sets: [...ex.sets, { ...lastSet }] };
      })
    );
  }

  function removeSet(exId: string, setIdx: number) {
    setExercises(prev =>
      prev.map(ex => {
        if (ex.id !== exId) return ex;
        if (ex.sets.length <= 1) return ex;
        return { ...ex, sets: ex.sets.filter((_, i) => i !== setIdx) };
      })
    );
  }

  // --- Soumission ---
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;

    const validExercises = exercises.filter(ex => ex.exercise !== null);
    if (validExercises.length === 0) {
      setError('Ajoute au moins un exercice.');
      return;
    }

    const sets = validExercises
      .filter(ex => ex.exercise !== null)
      .flatMap((ex, _exIdx) =>
        ex.sets.map((s, setIdx) => ({
          exercise_id: ex.exercise!.id,
          set_number: setIdx + 1,
          reps: s.reps,
          weight: s.weight,
          rest_time: s.rest_time ?? undefined,
        }))
      );

    setSaving(true);
    setError(null);

    try {
      const session = await workoutService.createSession({
        user_id: profile.id,
        date: new Date(date).toISOString(),
        name: sessionName.trim() || undefined,
        feedback: feedback || undefined,
        notes: notes.trim() || undefined,
        sets: sets.length > 0 ? sets : validExercises.flatMap((ex, _exIdx) =>
          ex.sets.map((s, setIdx) => ({
            exercise_id: ex.exercise?.id ?? '',
            set_number: setIdx + 1,
            reps: s.reps,
            weight: s.weight,
            rest_time: s.rest_time ?? undefined,
          }))
        ),
      });

      // Auto-détection des records par exercice (max poids) — skippé pour les "Autre"
      for (const ex of validExercises) {
        if (!ex.exercise) continue;
        const maxWeight = Math.max(...ex.sets.map(s => s.weight || 0));
        if (maxWeight > 0) {
          await profileRecordsService.upsertRecord(
            profile.id, ex.exercise.name, maxWeight, 'kg', 'musculation', false,
          );
        }
      }

      const xpResult = await xpService.awardXP(profile.id, 'WORKOUT_SESSION', 'musculation');
      await refreshProfile();

      const exercisesSummary = validExercises
        .filter(ex => ex.exercise !== null)
        .map(ex => ({
          name: ex.exercise!.name,
          sets: ex.sets.length,
          reps: ex.sets.reduce((sum, s) => sum + (s.reps || 0), 0),
          maxWeight: Math.max(...ex.sets.map(s => s.weight || 0)),
        }));

      await feedService.publishWorkout(
        profile.id,
        totalTonnage,
        sets.length,
        feedback || undefined,
        session.id,
        sessionName.trim() || undefined,
        exercisesSummary,
      );

      notificationService.broadcastToAll(profile.id, 'new_session', {
        message: `💪 ${profile.username} vient de terminer une séance de musculation !`,
        discipline: 'musculation',
        session_id: session.id,
      });

      // Check badges after session
      try {
        const totalSessions = await workoutService.getSessionsCount(profile.id).catch(() => 0);
        const newBadges = await badgesService.checkAndUnlockBadges(profile.id, {
          globalLevel: profile.global_level,
          musculationLevel: profile.musculation_level,
          currentStreak: profile.current_streak,
          totalSessions,
        });
        if (newBadges.length > 0) setBadgeQueue(newBadges);
      } catch { /* ignore */ }

      if (xpResult.leveledUp && xpResult.newLevel) {
        setLevelUpLevel(xpResult.newLevel);
        setShowLevelUp(true);
        return;
      }
      if (badgeQueue.length > 0) return;
      navigate('/musculation');
    } catch (err) {
      setError('Erreur lors de l\'enregistrement. Réessaie.');
      setSaving(false);
    }
  }

  if (!profile) return null;

  const groupExercises = pickerGroup
    ? allExercises.filter(e => e.muscle_group === pickerGroup)
    : [];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="p-2.5 rounded bg-transparent border border-red-900/40">
          <Dumbbell className="w-6 h-6 text-red-400" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Nouvelle séance</h1>
          <p className="text-[#a3a3a3] text-sm mt-0.5">Musculation</p>
        </div>
      </motion.div>

      {/* Bandeau copie */}
      {copyFrom && (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-transparent border border-red-900/30 rounded text-xs text-red-300">
          <Pencil className="w-3.5 h-3.5 flex-shrink-0" />
          <span>
            Séance copiée depuis &laquo;{copyFrom.name ?? formatDate(copyFrom.date, { weekday: 'short', day: 'numeric', month: 'short' })}&raquo; — modifie à ta guise puis enregistre.
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Date */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-4 space-y-3">
            <Input
              label="Titre de la séance (optionnel)"
              placeholder="ex. Chest Day, Push Day, Leg Killer..."
              value={sessionName}
              onChange={e => setSessionName(e.target.value)}
            />
            <Input
              label="Date et heure"
              type="datetime-local"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
            />
          </Card>
        </motion.div>

        {/* Exercices */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#a3a3a3] uppercase tracking-wider">
              Exercices
            </h2>
            {loadingExercises && (
              <span className="text-xs text-[#6b6b6b]">Chargement...</span>
            )}
          </div>

          <AnimatePresence>
            {exercises.map((ex, exIdx) => (
              <motion.div
                key={ex.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="p-4 space-y-4">
                  {/* En-tête bloc exercice */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="text-sm font-medium text-[#d4d4d4] mb-1 block">
                        Exercice {exIdx + 1}
                      </label>
                      {ex.exercise ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">
                            {ex.exercise.name}
                          </span>
                          <span className="text-xs px-2 py-0.5 bg-transparent border border-red-800/40 text-red-300 rounded-lg">
                            {MUSCLE_GROUP_LABELS[ex.exercise.muscle_group]}
                          </span>
                          <button
                            type="button"
                            onClick={() => openPicker(ex.id)}
                            className="p-1 rounded text-[#6b6b6b] hover:text-[#e5e5e5] transition-colors"
                            title="Changer l'exercice"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openPicker(ex.id)}
                          className="w-full text-left px-3 py-2.5 bg-[#1c1c1c] border border-dashed border-white/15 rounded text-sm text-[#6b6b6b] hover:border-red-500/50 hover:text-[#a3a3a3] transition-all"
                        >
                          Sélectionner un exercice...
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeExercise(ex.id)}
                      className="mt-6 p-2 rounded text-[#6b6b6b] hover:text-red-400 hover:bg-transparent transition-all"
                      title="Supprimer l'exercice"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Tableau des séries */}
                  <div className="space-y-2">
                    {/* En-têtes */}
                    <div className="grid grid-cols-[24px_1fr_1fr_1fr_24px] sm:grid-cols-[32px_1fr_1fr_1fr_32px] gap-1 sm:gap-2 px-1">
                      <span className="text-xs text-[#6b6b6b] text-center">#</span>
                      <span className="text-xs text-[#6b6b6b] text-center">Reps</span>
                      <span className="text-xs text-[#6b6b6b] text-center">Poids</span>
                      <span className="text-xs text-[#6b6b6b] text-center">Repos</span>
                      <span />
                    </div>

                    {ex.sets.map((set, setIdx) => (
                      <div
                        key={setIdx}
                        className="grid grid-cols-[24px_1fr_1fr_1fr_24px] sm:grid-cols-[32px_1fr_1fr_1fr_32px] gap-1 sm:gap-2 items-center"
                      >
                        <span className="text-xs text-[#6b6b6b] text-center font-mono">
                          {setIdx + 1}
                        </span>
                        <input
                          type="number"
                          min={1}
                          max={999}
                          value={set.reps}
                          onChange={e =>
                            updateSet(ex.id, setIdx, {
                              reps: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full bg-[#1c1c1c] border border-white/8 rounded-lg px-2 py-2 text-sm text-[#f5f5f5] text-center outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                        />
                        <input
                          type="text"
                          inputMode="decimal"
                          value={set.weightRaw}
                          onChange={e => {
                            const raw = e.target.value.replace(',', '.');
                            const parsed = parseFloat(raw);
                            updateSet(ex.id, setIdx, {
                              weightRaw: e.target.value,
                              weight: isNaN(parsed) ? 0 : parsed,
                            });
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
                          onChange={e =>
                            updateSet(ex.id, setIdx, {
                              rest_time: e.target.value
                                ? parseInt(e.target.value)
                                : null,
                            })
                          }
                          className="w-full bg-[#1c1c1c] border border-white/8 rounded-lg px-2 py-2 text-sm text-[#f5f5f5] text-center outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all placeholder-slate-600"
                        />
                        <button
                          type="button"
                          onClick={() => removeSet(ex.id, setIdx)}
                          disabled={ex.sets.length <= 1}
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
                      onClick={() => addSet(ex.id)}
                      className="w-full mt-1 border border-dashed border-white/8 hover:border-red-500/50"
                    >
                      Ajouter série
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          <Button
            type="button"
            variant="outline"
            icon={<Plus className="w-4 h-4" />}
            onClick={addExercise}
            className="w-full"
          >
            Ajouter exercice
          </Button>
        </motion.div>

        {/* Tonnage en temps réel */}
        {totalTonnage > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="p-4 bg-transparent border-red-900/40">
              <div className="flex items-center justify-between">
                <span className="text-sm text-red-300">Tonnage total</span>
                <span className="text-xl font-black text-red-400">
                  {formatNumber(totalTonnage)} kg
                </span>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Feedback */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-4 space-y-3">
            <label className="text-sm font-semibold text-[#d4d4d4]">
              Comment tu t'es senti ?
            </label>
            <div className="flex gap-3">
              {(Object.entries(FEEDBACK_LABELS) as [Feedback, string][]).map(
                ([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFeedback(prev => (prev === value ? '' : value))}
                    className={`
                      flex-1 py-2.5 px-3 rounded text-sm font-medium border transition-all
                      ${
                        feedback === value
                          ? 'bg-red-700 border-red-500 text-white'
                          : 'bg-[#1c1c1c] border-white/8 text-[#a3a3a3] hover:border-white/10 hover:text-[#e5e5e5]'
                      }
                    `}
                  >
                    {label}
                  </button>
                )
              )}
            </div>
          </Card>
        </motion.div>

        {/* Notes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="p-4">
            <Textarea
              label="Notes (optionnel)"
              placeholder="Remarques sur ta séance..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
            />
          </Card>
        </motion.div>

        {/* XP info */}
        <div className="flex items-center gap-2 px-1">
          <div className="p-1 rounded-lg bg-transparent">
            <span className="text-xs text-red-400 font-bold">+{XP_REWARDS.WORKOUT_SESSION} XP</span>
          </div>
          <span className="text-xs text-[#6b6b6b]">seront gagnés à l'enregistrement</span>
        </div>

        {/* Erreur */}
        {error && (
          <Card className="p-3 bg-transparent border-red-500/25">
            <p className="text-sm text-red-400 text-center">{error}</p>
          </Card>
        )}

        {/* Submit */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="pb-6"
        >
          <Button
            type="submit"
            size="lg"
            loading={saving}
            className="w-full"
            icon={<Dumbbell className="w-5 h-5" />}
          >
            {saving ? 'Enregistrement...' : 'Enregistrer la séance'}
          </Button>
        </motion.div>
      </form>

      {/* Exercise Picker Modal */}
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
                  onClick={() => {
                    setPickerGroup(group.id);
                    setPickerStep('exercises');
                  }}
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
                      onClick={() => pickerTargetId && selectExercise(pickerTargetId, exercise)}
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

      <LevelUpModal
        isOpen={showLevelUp}
        level={levelUpLevel}
        discipline="musculation"
        onClose={() => {
          setShowLevelUp(false);
          if (badgeQueue.length === 0) navigate('/musculation');
        }}
      />
      <BadgeUnlockModal
        badge={badgeQueue[0] ?? null}
        onClose={() => {
          setBadgeQueue(prev => {
            const next = prev.slice(1);
            if (next.length === 0) navigate('/musculation');
            return next;
          });
        }}
      />
    </div>
  );
}
