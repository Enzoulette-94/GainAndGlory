import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Flame, Plus, Trash2, X, Pencil } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { crossfitService } from '../services/crossfit.service';
import { xpService } from '../services/xp.service';
import { feedService } from '../services/feed.service';
import { profileRecordsService } from '../services/profile-records.service';
import { badgesService } from '../services/badges.service';
import { BadgeUnlockModal } from '../components/xp-system/BadgeUnlockModal';
import { Card, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input, Textarea } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { CrossfitExercisePickerContent } from '../components/forms/CrossfitExercisePicker';
import { CROSSFIT_WOD_TYPES, FEEDBACK_LABELS } from '../utils/constants';
import type { CrossfitSession as CrossfitSessionModel, CrossfitExercise, UserBadge } from '../types/models';
import type { CrossfitWodType } from '../types/enums';
import type { Feedback } from '../types/enums';

// ─── Types locaux ─────────────────────────────────────────────────────────────

interface ExerciseBlock {
  id: string;
  name: string;
  reps: string;
  weight: string;
  duration: string;
  inputType: 'reps' | 'duration';
  notes: string;
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function CrossfitSessionPage() {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const copyFrom = (location.state as { copyFrom?: CrossfitSessionModel } | null)?.copyFrom;

  const [step, setStep] = useState<1 | 2>(copyFrom ? 2 : 1);
  const [wodType, setWodType] = useState<CrossfitWodType | ''>(copyFrom?.wod_type ?? '');

  // WOD params
  const [name, setName] = useState(copyFrom?.name ?? '');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [totalDuration, setTotalDuration] = useState(copyFrom?.total_duration?.toString() ?? '');
  const [roundDuration, setRoundDuration] = useState(copyFrom?.round_duration?.toString() ?? '');
  const [targetRounds, setTargetRounds] = useState(copyFrom?.target_rounds?.toString() ?? '');
  const [resultTime, setResultTime] = useState('');
  const [resultReps, setResultReps] = useState('');
  const [resultRounds, setResultRounds] = useState('');
  const [benchmarkName, setBenchmarkName] = useState(copyFrom?.benchmark_name ?? '');

  // Exercises
  const [exercises, setExercises] = useState<ExerciseBlock[]>(() => {
    if (copyFrom?.exercises && copyFrom.exercises.length > 0) {
      return copyFrom.exercises.map(ex => ({
        id: Math.random().toString(36).slice(2),
        name: ex.name,
        reps: ex.reps != null ? String(ex.reps) : '',
        weight: ex.weight != null ? String(ex.weight) : '',
        duration: ex.duration != null ? String(ex.duration) : '',
        inputType: ex.reps != null ? 'reps' : 'duration',
        notes: ex.notes ?? '',
      }));
    }
    return [];
  });

  const [feedback, setFeedback] = useState<Feedback | ''>('');
  const [notes, setNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [badgeQueue, setBadgeQueue] = useState<UserBadge[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTargetId, setPickerTargetId] = useState<string | null>(null);

  function addExercise() {
    setExercises(prev => [
      ...prev,
      { id: Math.random().toString(36).slice(2), name: '', reps: '', weight: '', duration: '', inputType: 'reps', notes: '' },
    ]);
  }

  function removeExercise(id: string) {
    setExercises(prev => prev.filter(e => e.id !== id));
  }

  function updateExercise(id: string, field: keyof ExerciseBlock, value: string) {
    setExercises(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  }

  function handleWodSelect(type: CrossfitWodType) {
    setWodType(type);
    setStep(2);
  }

  async function handleSave() {
    if (!profile) return;
    if (!wodType) { setError('Sélectionne un type de WOD'); return; }
    const validExercises = exercises.filter(e => e.name.trim());
    if (validExercises.length === 0) { setError('Ajoutez au moins un exercice'); return; }

    setSaving(true);
    setError(null);

    try {
      const crossfitExercises: CrossfitExercise[] = validExercises.map(e => ({
        name: e.name.trim(),
        reps: e.inputType === 'reps' ? (parseInt(e.reps) || null) : null,
        weight: e.weight ? (parseFloat(e.weight) || null) : null,
        duration: e.inputType === 'duration' ? (parseInt(e.duration) || null) : null,
        notes: e.notes.trim() || null,
      }));

      const session = await crossfitService.createSession({
        userId: profile.id,
        date: new Date(date).toISOString(),
        name: name.trim() || undefined,
        wod_type: wodType as CrossfitWodType,
        total_duration: totalDuration ? parseInt(totalDuration) : null,
        round_duration: roundDuration ? parseInt(roundDuration) : null,
        target_rounds: targetRounds ? parseInt(targetRounds) : null,
        result_time: resultTime.trim() || null,
        result_reps: resultReps ? parseInt(resultReps) : null,
        result_rounds: resultRounds ? parseInt(resultRounds) : null,
        benchmark_name: benchmarkName.trim() || null,
        exercises: crossfitExercises,
        feedback: feedback || undefined,
        notes: notes.trim() || undefined,
      });

      await xpService.awardXP(profile.id, 'CROSSFIT_SESSION', 'crossfit');
      await refreshProfile();

      // Determine result value and unit for feed
      let resultValue: string | number | null = null;
      let resultUnit: string | null = null;
      if (wodType === 'for_time') { resultValue = resultTime || null; resultUnit = 'min:sec'; }
      else if (wodType === 'amrap') { resultValue = resultReps ? parseInt(resultReps) : null; resultUnit = 'reps'; }
      else if (wodType === 'for_rounds') { resultValue = resultRounds ? parseInt(resultRounds) : null; resultUnit = 'rounds'; }
      else if (wodType === 'emom') { resultValue = totalDuration ? parseInt(totalDuration) : null; resultUnit = 'min'; }
      else if (wodType === 'benchmark') { resultValue = benchmarkName || null; resultUnit = null; }

      await feedService.publishCrossfit(
        profile.id,
        wodType,
        resultValue,
        resultUnit,
        feedback || undefined,
        session.id,
        name.trim() || undefined,
        crossfitExercises.map(e => ({ name: e.name })),
      );

      // Auto-upsert records for exercises with weight
      for (const ex of crossfitExercises) {
        if (ex.weight && ex.weight > 0) {
          await profileRecordsService.upsertRecord(
            profile.id, ex.name, ex.weight, 'kg', 'crossfit', false,
          );
        }
      }

      // Check badges after session
      try {
        const totalSessions = await crossfitService.getSessionsCount(profile.id).catch(() => 0);
        const newBadges = await badgesService.checkAndUnlockBadges(profile.id, {
          globalLevel: profile.global_level,
          currentStreak: profile.current_streak,
          totalSessions,
        });
        if (newBadges.length > 0) {
          setBadgeQueue(newBadges);
          return; // Le navigate sera déclenché par onClose du modal
        }
      } catch { /* ignore */ }

      navigate('/crossfit');
    } catch (e) {
      console.error(e);
      setError('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  }

  // ── Step 1: WOD type selection ─────────────────────────────────────────────

  if (step === 1) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-24">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/10 rounded-xl">
            <Flame className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h1 className="font-rajdhani font-bold text-xl sm:text-2xl text-[#f5f5f5] uppercase tracking-wide">
              Nouvelle séance
            </h1>
            <p className="text-xs text-[#6b6b6b]">Crossfit — choix du WOD</p>
          </div>
        </div>

        <Card className="p-4 space-y-4">
          <CardHeader title="Type de WOD" />
          <div className="space-y-2">
            {CROSSFIT_WOD_TYPES.map(wod => (
              <button
                key={wod.id}
                onClick={() => handleWodSelect(wod.id as CrossfitWodType)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors text-left ${
                  wodType === wod.id
                    ? 'bg-orange-600/20 border-orange-500/40 text-orange-300'
                    : 'border-white/10 text-[#a3a3a3] hover:border-orange-500/30 hover:text-[#f5f5f5]'
                }`}
              >
                <div>
                  <p className="font-rajdhani font-bold text-sm tracking-wide">{wod.label}</p>
                  <p className="text-xs text-[#6b6b6b] mt-0.5">{wod.description}</p>
                </div>
                <span className="text-[#4a4a4a] text-sm">›</span>
              </button>
            ))}
          </div>
        </Card>

        <Button variant="ghost" className="w-full" onClick={() => navigate('/crossfit')}>
          Annuler
        </Button>
      </div>
    );
  }

  // ── Step 2: Exercises form ─────────────────────────────────────────────────

  const selectedWod = CROSSFIT_WOD_TYPES.find(w => w.id === wodType);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-orange-500/10 rounded-xl">
          <Flame className="w-6 h-6 text-orange-400" />
        </div>
        <div>
          <h1 className="font-rajdhani font-bold text-xl sm:text-2xl text-[#f5f5f5] uppercase tracking-wide">
            Nouvelle séance
          </h1>
          <p className="text-xs text-[#6b6b6b]">
            Crossfit — {selectedWod?.label}
            {' · '}
            <button onClick={() => setStep(1)} className="text-orange-400 hover:text-orange-300 transition-colors">
              Changer
            </button>
          </p>
        </div>
      </div>

      {copyFrom && (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-transparent border border-orange-900/30 rounded text-xs text-orange-300">
          <Pencil className="w-3.5 h-3.5 flex-shrink-0" />
          <span>
            Séance copiée depuis «{copyFrom.name ?? new Date(copyFrom.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}» — modifie à ta guise puis enregistre.
          </span>
        </div>
      )}

      {error && (
        <div className="bg-red-950/30 border border-red-800/40 rounded-xl p-3 text-red-400 text-sm">{error}</div>
      )}

      {/* Infos générales */}
      <Card className="p-4 space-y-4">
        <CardHeader title="Informations" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Nom (optionnel)"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ex: Fran, Murph..."
          />
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>
      </Card>

      {/* Paramètres WOD */}
      <Card className="p-4 space-y-4">
        <CardHeader title={`Paramètres ${selectedWod?.label}`} />
        <div className="grid grid-cols-2 gap-3">
          {(wodType === 'emom' || wodType === 'amrap' || wodType === 'for_rounds') && (
            <Input
              label="Durée totale (min)"
              type="number"
              value={totalDuration}
              onChange={e => setTotalDuration(e.target.value)}
              placeholder="Ex: 20"
            />
          )}
          {wodType === 'emom' && (
            <Input
              label="Durée par round (sec)"
              type="number"
              value={roundDuration}
              onChange={e => setRoundDuration(e.target.value)}
              placeholder="Ex: 60"
            />
          )}
          {wodType === 'amrap' && (
            <Input
              label="Résultat (reps)"
              type="number"
              value={resultReps}
              onChange={e => setResultReps(e.target.value)}
              placeholder="Total reps"
            />
          )}
          {wodType === 'for_rounds' && (
            <>
              <Input
                label="Rounds cibles"
                type="number"
                value={targetRounds}
                onChange={e => setTargetRounds(e.target.value)}
                placeholder="Ex: 5"
              />
              <Input
                label="Rounds réalisés"
                type="number"
                value={resultRounds}
                onChange={e => setResultRounds(e.target.value)}
                placeholder="Ex: 4"
              />
            </>
          )}
          {wodType === 'for_time' && (
            <Input
              label="Temps réalisé (mm:ss)"
              value={resultTime}
              onChange={e => setResultTime(e.target.value)}
              placeholder="Ex: 12:34"
            />
          )}
          {wodType === 'benchmark' && (
            <div className="col-span-2">
              <Input
                label="Nom du benchmark"
                value={benchmarkName}
                onChange={e => setBenchmarkName(e.target.value)}
                placeholder="Ex: Fran, Murph, Cindy..."
              />
            </div>
          )}
        </div>
      </Card>

      {/* Exercices */}
      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <CardHeader title="Exercices" />
          <Button size="sm" variant="ghost" onClick={addExercise}>
            <Plus className="w-4 h-4 mr-1" />
            Ajouter
          </Button>
        </div>

        {exercises.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-[#4a4a4a] text-sm mb-3">Aucun exercice ajouté</p>
            <Button size="sm" onClick={addExercise} className="bg-orange-600 hover:bg-orange-500 text-white border-0">
              <Plus className="w-4 h-4 mr-1" />
              Ajouter un exercice
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {exercises.map((ex, idx) => (
              <CrossfitExerciseBlock
                key={ex.id}
                exercise={ex}
                index={idx}
                onUpdate={(field, value) => updateExercise(ex.id, field, value)}
                onRemove={() => removeExercise(ex.id)}
                onOpenPicker={() => { setPickerTargetId(ex.id); setPickerOpen(true); }}
              />
            ))}
          </div>
        )}
      </Card>

      {/* Feedback */}
      <Card className="p-4 space-y-3">
        <CardHeader title="Ressenti" />
        <div className="flex gap-2">
          {(['facile', 'difficile', 'mort'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFeedback(fb => fb === f ? '' : f)}
              className={`flex-1 py-2 text-sm font-medium rounded-xl border transition-colors ${
                feedback === f
                  ? 'bg-orange-600/20 border-orange-500/40 text-orange-300'
                  : 'border-white/10 text-[#6b6b6b] hover:border-white/20'
              }`}
            >
              {FEEDBACK_LABELS[f]}
            </button>
          ))}
        </div>
      </Card>

      {/* Notes */}
      <Card className="p-4 space-y-3">
        <CardHeader title="Notes" />
        <Textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Remarques, sensations, objectifs..."
          rows={3}
        />
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="ghost" className="flex-1" onClick={() => navigate('/crossfit')}>
          Annuler
        </Button>
        <Button
          className="flex-1 bg-orange-600 hover:bg-orange-500 text-white border-0"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </div>

      {/* Exercise Picker Modal */}
      <Modal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Choisir un exercice"
        size="md"
      >
        <div className="p-4">
          <CrossfitExercisePickerContent
            selected={exercises.find(e => e.id === pickerTargetId)?.name ?? ''}
            onSelect={name => {
              if (pickerTargetId) updateExercise(pickerTargetId, 'name', name);
              setPickerOpen(false);
            }}
          />
        </div>
      </Modal>

      <BadgeUnlockModal
        badge={badgeQueue[0] ?? null}
        onClose={() => {
          setBadgeQueue(prev => {
            const next = prev.slice(1);
            if (next.length === 0) navigate('/crossfit');
            return next;
          });
        }}
      />
    </div>
  );
}

// ─── CrossfitExerciseBlock ────────────────────────────────────────────────────

interface ExerciseBlockProps {
  exercise: ExerciseBlock;
  index: number;
  onUpdate: (field: keyof ExerciseBlock, value: string) => void;
  onRemove: () => void;
  onOpenPicker: () => void;
}

function CrossfitExerciseBlock({ exercise, index, onUpdate, onRemove, onOpenPicker }: ExerciseBlockProps) {
  return (
    <div className="bg-[#0d0d0d] border border-white/5 rounded-xl p-3 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-rajdhani font-bold text-orange-400 w-5">{index + 1}</span>
        <div className="flex-1">
          {exercise.name ? (
            <button
              type="button"
              onClick={onOpenPicker}
              className="w-full text-left px-3 py-1.5 bg-[#1a1a1a] border border-orange-500/30 rounded-lg text-sm text-[#f5f5f5] hover:border-orange-400/50 transition-colors"
            >
              {exercise.name}
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenPicker}
              className="w-full text-left px-3 py-1.5 bg-[#1a1a1a] border border-white/10 rounded-lg text-sm text-[#4a4a4a] hover:border-orange-500/30 hover:text-[#a3a3a3] transition-colors"
            >
              Sélectionner un exercice...
            </button>
          )}
        </div>
        {/* Toggle reps/duration */}
        <div className="flex rounded-lg overflow-hidden border border-white/10">
          <button
            onClick={() => onUpdate('inputType', 'reps')}
            className={`px-2 py-1.5 text-xs font-medium transition-colors ${
              exercise.inputType === 'reps' ? 'bg-orange-600/30 text-orange-300' : 'text-[#6b6b6b] hover:text-[#d4d4d4]'
            }`}
          >
            Reps
          </button>
          <button
            onClick={() => onUpdate('inputType', 'duration')}
            className={`px-2 py-1.5 text-xs font-medium transition-colors ${
              exercise.inputType === 'duration' ? 'bg-orange-600/30 text-orange-300' : 'text-[#6b6b6b] hover:text-[#d4d4d4]'
            }`}
          >
            Temps
          </button>
        </div>
        <button onClick={onRemove} className="p-1.5 text-[#4a4a4a] hover:text-red-400 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-2 pl-7 flex-wrap">
        {exercise.inputType === 'reps' ? (
          <input
            type="number"
            min="1"
            value={exercise.reps}
            onChange={e => onUpdate('reps', e.target.value)}
            placeholder="Reps"
            className="w-20 bg-[#1a1a1a] border border-white/10 rounded-lg px-2 py-1 text-sm text-[#f5f5f5] placeholder-[#4a4a4a] focus:outline-none focus:border-orange-500/50 text-center"
          />
        ) : (
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="1"
              value={exercise.duration}
              onChange={e => onUpdate('duration', e.target.value)}
              placeholder="Sec"
              className="w-20 bg-[#1a1a1a] border border-white/10 rounded-lg px-2 py-1 text-sm text-[#f5f5f5] placeholder-[#4a4a4a] focus:outline-none focus:border-orange-500/50 text-center"
            />
            <span className="text-xs text-[#4a4a4a]">s</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <input
            type="number"
            min="0"
            step="0.5"
            value={exercise.weight}
            onChange={e => onUpdate('weight', e.target.value)}
            placeholder="kg"
            className="w-20 bg-[#1a1a1a] border border-white/10 rounded-lg px-2 py-1 text-sm text-[#f5f5f5] placeholder-[#4a4a4a] focus:outline-none focus:border-orange-500/50 text-center"
          />
          <span className="text-xs text-[#4a4a4a]">kg</span>
        </div>
        <input
          type="text"
          value={exercise.notes}
          onChange={e => onUpdate('notes', e.target.value)}
          placeholder="Notes optionnelles..."
          className="flex-1 min-w-32 bg-[#1a1a1a] border border-white/10 rounded-lg px-2 py-1 text-sm text-[#f5f5f5] placeholder-[#4a4a4a] focus:outline-none focus:border-orange-500/50"
        />
      </div>
    </div>
  );
}
