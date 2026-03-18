import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Zap, Plus, Trash2, X, Pencil } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { calisthenicsService } from '../services/calisthenics.service';
import { xpService } from '../services/xp.service';
import { Card, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input, Textarea } from '../components/common/Input';
import { Loader } from '../components/common/Loader';
import { Modal } from '../components/common/Modal';
import { CalisthenicsPickerContent } from '../components/forms/ExercisePicker';
import { CALISTHENICS_SKILLS, FEEDBACK_LABELS } from '../utils/constants';
import { profileRecordsService } from '../services/profile-records.service';
import { feedService } from '../services/feed.service';
import { badgesService } from '../services/badges.service';
import { BadgeUnlockModal } from '../components/xp-system/BadgeUnlockModal';
import type { CaliExercise, CaliSet, ProfileSkill, CalisthenicsSession as CalisthenicsSessionModel, UserBadge } from '../types/models';
import type { Feedback } from '../types/enums';

// ─── Types locaux ─────────────────────────────────────────────────────────────

interface ExerciseBlock {
  id: string;
  name: string;
  set_type: 'reps' | 'timed';
  sets: { reps: string; hold_seconds: string }[];
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function CalisthenicsSessionPage() {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const copyFrom = (location.state as { copyFrom?: CalisthenicsSessionModel } | null)?.copyFrom;

  const [name, setName] = useState(copyFrom?.name ?? '');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [feedback, setFeedback] = useState<Feedback | ''>('');
  const [notes, setNotes] = useState('');
  const [exercises, setExercises] = useState<ExerciseBlock[]>(() => {
    if (copyFrom?.exercises && copyFrom.exercises.length > 0) {
      return copyFrom.exercises.map(ex => ({
        id: Math.random().toString(36).slice(2),
        name: ex.name,
        set_type: ex.set_type,
        sets: ex.sets.map(s => ({
          reps: s.reps != null ? String(s.reps) : '',
          hold_seconds: s.hold_seconds != null ? String(s.hold_seconds) : '',
        })),
      }));
    }
    return [];
  });
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [unlockedSkills, setUnlockedSkills] = useState<ProfileSkill[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [badgeQueue, setBadgeQueue] = useState<UserBadge[]>([]);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTargetId, setPickerTargetId] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      calisthenicsService.getUnlockedSkills(profile.id).then(setUnlockedSkills).catch(() => {});
    }
  }, [profile]);

  function addExercise() {
    setExercises(prev => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2),
        name: '',
        set_type: 'reps',
        sets: [{ reps: '', hold_seconds: '' }],
      },
    ]);
  }

  function removeExercise(id: string) {
    setExercises(prev => prev.filter(e => e.id !== id));
  }

  function updateExercise(id: string, field: keyof ExerciseBlock, value: unknown) {
    setExercises(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  }

  function addSet(exerciseId: string) {
    setExercises(prev => prev.map(e =>
      e.id === exerciseId
        ? { ...e, sets: [...e.sets, { reps: '', hold_seconds: '' }] }
        : e
    ));
  }

  function removeSet(exerciseId: string, setIndex: number) {
    setExercises(prev => prev.map(e =>
      e.id === exerciseId
        ? { ...e, sets: e.sets.filter((_, i) => i !== setIndex) }
        : e
    ));
  }

  function updateSet(exerciseId: string, setIndex: number, field: 'reps' | 'hold_seconds', value: string) {
    setExercises(prev => prev.map(e =>
      e.id === exerciseId
        ? {
            ...e,
            sets: e.sets.map((s, i) => i === setIndex ? { ...s, [field]: value } : s),
          }
        : e
    ));
  }

  function toggleSkill(skillCode: string) {
    setSelectedSkills(prev =>
      prev.includes(skillCode) ? prev.filter(c => c !== skillCode) : [...prev, skillCode]
    );
  }

  async function handleSave() {
    if (!profile) return;
    if (exercises.length === 0) {
      setError('Ajoutez au moins un exercice');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const caliExercises: CaliExercise[] = exercises
        .filter(e => e.name.trim())
        .map(e => ({
          name: e.name.trim(),
          set_type: e.set_type,
          sets: e.sets.map(s => ({
            reps: e.set_type === 'reps' ? (parseInt(s.reps) || null) : null,
            hold_seconds: e.set_type === 'timed' ? (parseInt(s.hold_seconds) || null) : null,
          })) as CaliSet[],
        }));

      if (caliExercises.length === 0) {
        setError('Nommez au moins un exercice');
        setSaving(false);
        return;
      }

      await calisthenicsService.createSession({
        userId: profile.id,
        name: name.trim() || undefined,
        date: new Date(date).toISOString(),
        feedback: feedback || undefined,
        notes: notes.trim() || undefined,
        exercises: caliExercises,
        skillsUnlocked: selectedSkills,
      });

      await xpService.awardXP(profile.id, 'CALISTHENICS_SESSION', 'calisthenics');
      await refreshProfile();

      const totalReps = caliExercises.reduce((sum, ex) => sum + ex.sets.reduce((s, r) => s + (r.reps ?? 0), 0), 0);
      const feedExercises = caliExercises.map(ex => ({
        name: ex.name,
        sets: ex.sets.length,
        reps: ex.set_type === 'reps'
          ? ex.sets.reduce((s, r) => s + (r.reps ?? 0), 0)
          : 0,
        hold_seconds: ex.set_type === 'timed'
          ? ex.sets.reduce((s, r) => s + (r.hold_seconds ?? 0), 0)
          : undefined,
        set_type: ex.set_type,
      }));
      await feedService.publishCalisthenics(
        profile.id,
        caliExercises.length,
        totalReps,
        feedback || undefined,
        undefined,
        name.trim() || undefined,
        selectedSkills,
        feedExercises,
      );

      // Auto-détection des records par exercice
      for (const ex of caliExercises) {
        if (ex.set_type === 'reps') {
          const maxReps = Math.max(...ex.sets.map(s => s.reps ?? 0));
          if (maxReps > 0) {
            await profileRecordsService.upsertRecord(
              profile.id, ex.name, maxReps, 'reps', 'calisthenics', false,
            );
          }
        } else {
          // timed : meilleur hold = plus long
          const maxSeconds = Math.max(...ex.sets.map(s => s.hold_seconds ?? 0));
          if (maxSeconds > 0) {
            await profileRecordsService.upsertRecord(
              profile.id, ex.name, maxSeconds, 's', 'calisthenics', false,
            );
          }
        }
      }

      // Check badges after session
      try {
        const newBadges = await badgesService.checkAndUnlockBadges(profile.id, {
          globalLevel: profile.global_level,
          currentStreak: profile.current_streak,
        });
        if (newBadges.length > 0) {
          setBadgeQueue(newBadges);
          return; // Le navigate sera déclenché par onClose du modal
        }
      } catch { /* ignore */ }

      navigate('/calisthenics');
    } catch (e) {
      console.error(e);
      setError('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  }

  // Skills non encore débloqués (à afficher)
  const availableSkills = CALISTHENICS_SKILLS.filter(
    s => !unlockedSkills.some(u => u.skill_code === s.code)
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-violet-500/10 rounded-xl">
          <Zap className="w-6 h-6 text-violet-400" />
        </div>
        <div>
          <h1 className="font-rajdhani font-bold text-xl sm:text-2xl text-[#f5f5f5] uppercase tracking-wide">
            Nouvelle séance
          </h1>
          <p className="text-xs text-[#6b6b6b]">Calisthénie</p>
        </div>
      </div>

      {copyFrom && (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-transparent border border-violet-900/30 rounded text-xs text-violet-300">
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
            placeholder="Ex: Upper body"
          />
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
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
            <Button size="sm" onClick={addExercise} className="bg-violet-600 hover:bg-violet-500 text-white border-0">
              <Plus className="w-4 h-4 mr-1" />
              Ajouter un exercice
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {exercises.map((ex, exIdx) => (
              <ExerciseBlockComponent
                key={ex.id}
                exercise={ex}
                index={exIdx}
                onUpdate={(field, value) => updateExercise(ex.id, field, value)}
                onRemove={() => removeExercise(ex.id)}
                onAddSet={() => addSet(ex.id)}
                onRemoveSet={setIdx => removeSet(ex.id, setIdx)}
                onUpdateSet={(setIdx, field, value) => updateSet(ex.id, setIdx, field, value)}
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
                  ? 'bg-violet-600/20 border-violet-500/40 text-violet-300'
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
        <Button variant="ghost" className="flex-1" onClick={() => navigate('/calisthenics')}>
          Annuler
        </Button>
        <Button
          className="flex-1 bg-violet-600 hover:bg-violet-500 text-white border-0"
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
          <CalisthenicsPickerContent
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
            if (next.length === 0) navigate('/calisthenics');
            return next;
          });
        }}
      />
    </div>
  );
}

// ─── ExerciseBlockComponent ───────────────────────────────────────────────────

interface ExerciseBlockProps {
  exercise: ExerciseBlock;
  index: number;
  onUpdate: (field: keyof ExerciseBlock, value: unknown) => void;
  onRemove: () => void;
  onAddSet: () => void;
  onRemoveSet: (idx: number) => void;
  onUpdateSet: (idx: number, field: 'reps' | 'hold_seconds', value: string) => void;
  onOpenPicker: () => void;
}

function ExerciseBlockComponent({ exercise, index, onUpdate, onRemove, onAddSet, onRemoveSet, onUpdateSet, onOpenPicker }: ExerciseBlockProps) {
  return (
    <div className="bg-[#0d0d0d] border border-white/5 rounded-xl p-3 space-y-3">
      {/* Header exercice */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-rajdhani font-bold text-violet-400 w-5">{index + 1}</span>
        <div className="flex-1">
          {exercise.name ? (
            <button
              type="button"
              onClick={onOpenPicker}
              className="w-full text-left px-3 py-1.5 bg-[#1a1a1a] border border-violet-500/30 rounded-lg text-sm text-[#f5f5f5] hover:border-violet-400/50 transition-colors"
            >
              {exercise.name}
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenPicker}
              className="w-full text-left px-3 py-1.5 bg-[#1a1a1a] border border-white/10 rounded-lg text-sm text-[#4a4a4a] hover:border-violet-500/30 hover:text-[#a3a3a3] transition-colors"
            >
              Sélectionner un exercice...
            </button>
          )}
        </div>
        {/* Toggle reps/timed */}
        <div className="flex rounded-lg overflow-hidden border border-white/10">
          <button
            onClick={() => onUpdate('set_type', 'reps')}
            className={`px-2 py-1.5 text-xs font-medium transition-colors ${
              exercise.set_type === 'reps' ? 'bg-violet-600/30 text-violet-300' : 'text-[#6b6b6b] hover:text-[#d4d4d4]'
            }`}
          >
            Reps
          </button>
          <button
            onClick={() => onUpdate('set_type', 'timed')}
            className={`px-2 py-1.5 text-xs font-medium transition-colors ${
              exercise.set_type === 'timed' ? 'bg-violet-600/30 text-violet-300' : 'text-[#6b6b6b] hover:text-[#d4d4d4]'
            }`}
          >
            Temps
          </button>
        </div>
        <button onClick={onRemove} className="p-1.5 text-[#4a4a4a] hover:text-red-400 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Sets */}
      <div className="space-y-2 pl-7">
        {exercise.sets.map((set, setIdx) => (
          <div key={setIdx} className="flex items-center gap-2">
            <span className="text-xs text-[#4a4a4a] w-12">Série {setIdx + 1}</span>
            {exercise.set_type === 'reps' ? (
              <input
                type="number"
                min="1"
                value={set.reps}
                onChange={e => onUpdateSet(setIdx, 'reps', e.target.value)}
                placeholder="Reps"
                className="w-20 bg-[#1a1a1a] border border-white/10 rounded-lg px-2 py-1 text-sm text-[#f5f5f5] placeholder-[#4a4a4a] focus:outline-none focus:border-violet-500/50 text-center"
              />
            ) : (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="1"
                  value={set.hold_seconds}
                  onChange={e => onUpdateSet(setIdx, 'hold_seconds', e.target.value)}
                  placeholder="Sec"
                  className="w-20 bg-[#1a1a1a] border border-white/10 rounded-lg px-2 py-1 text-sm text-[#f5f5f5] placeholder-[#4a4a4a] focus:outline-none focus:border-violet-500/50 text-center"
                />
                <span className="text-xs text-[#4a4a4a]">s</span>
              </div>
            )}
            {exercise.sets.length > 1 && (
              <button onClick={() => onRemoveSet(setIdx)} className="p-1 text-[#4a4a4a] hover:text-red-400 transition-colors">
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={onAddSet}
          className="flex items-center gap-1 text-xs text-[#6b6b6b] hover:text-violet-400 transition-colors mt-1"
        >
          <Plus className="w-3 h-3" />
          Ajouter une série
        </button>
      </div>
    </div>
  );
}
