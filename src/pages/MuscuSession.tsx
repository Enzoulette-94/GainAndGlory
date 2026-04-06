import React, { useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Dumbbell, Pencil } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { workoutService } from '../services/workout.service';
import { xpService } from '../services/xp.service';
import { feedService } from '../services/feed.service';
import { Button } from '../components/common/Button';
import { Input, Textarea } from '../components/common/Input';
import { Card } from '../components/common/Card';
import { MuscuBlockForm, buildMuscuSets } from '../components/forms/MuscuBlockForm';
import type { MuscuBlockFormData, SessionItem } from '../components/forms/MuscuBlockForm';
import { formatDate, formatNumber } from '../utils/calculations';
import { FEEDBACK_LABELS, XP_REWARDS } from '../utils/constants';
import type { WorkoutSession } from '../types/models';
import type { Feedback } from '../types/enums';
import { profileRecordsService } from '../services/profile-records.service';
import { notificationService } from '../services/notification.service';
import { badgesService } from '../services/badges.service';
import { BadgeUnlockModal } from '../components/xp-system/BadgeUnlockModal';
import { LevelUpModal } from '../components/xp-system/LevelUpModal';
import type { UserBadge } from '../types/models';

export type { SetRow, ExerciseBlock, CircuitBlock, SessionItem } from '../components/forms/MuscuBlockForm';

function toLocalDatetimeValue(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function buildInitialItems(copyFrom: WorkoutSession | null): SessionItem[] | undefined {
  if (!copyFrom?.sets || copyFrom.sets.length === 0) return undefined;
  const grouped = new Map<string, { id: string; exercise: any; sets: any[] }>();
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
  const blocks = Array.from(grouped.values()).map(b => ({ ...b, itemType: 'exercise' as const }));
  return blocks.length > 0 ? blocks : undefined;
}

export function MuscuSessionPage() {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const copyFrom = (location.state as { copyFrom?: WorkoutSession } | null)?.copyFrom ?? null;

  const [date, setDate] = useState(toLocalDatetimeValue());
  const [sessionName, setSessionName] = useState(copyFrom?.name ?? '');
  const [feedback, setFeedback] = useState<Feedback | ''>('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [badgeQueue, setBadgeQueue] = useState<UserBadge[]>([]);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpLevel, setLevelUpLevel] = useState(0);

  const formDataRef = useRef<MuscuBlockFormData | null>(null);
  const initialItems = buildInitialItems(copyFrom);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;

    const formData = formDataRef.current;
    if (!formData) { setError('Ajoute au moins un exercice.'); return; }

    const sets = buildMuscuSets(formData.items);
    if (sets.length === 0) {
      setError('Ajoute au moins un exercice.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const session = await workoutService.createSession({
        user_id: profile.id,
        date: new Date(date).toISOString(),
        name: sessionName.trim() || undefined,
        feedback: feedback || undefined,
        notes: notes.trim() || undefined,
        sets,
      });

      // Records par exercice
      const items = formData.items;
      const allExBlocks: { exercise: any; sets: any[] }[] = [];
      for (const item of items) {
        if (item.itemType === 'exercise' && item.exercise) {
          allExBlocks.push({ exercise: item.exercise, sets: item.sets });
        } else if (item.itemType === 'circuit') {
          for (const ex of item.exercises) {
            if (ex.exercise) allExBlocks.push({ exercise: ex.exercise, sets: ex.sets });
          }
        }
      }

      for (const { exercise, sets: exSets } of allExBlocks) {
        const maxWeight = Math.max(...exSets.map((s: any) => s.weight || 0));
        if (maxWeight > 0) {
          await profileRecordsService.upsertRecord(
            profile.id, exercise.name, maxWeight, 'kg', 'musculation', false,
          );
        }
      }

      const xpResult = await xpService.awardXP(profile.id, 'WORKOUT_SESSION', 'musculation');
      await refreshProfile();

      const exercisesSummary = allExBlocks.map(({ exercise, sets: exSets }) => ({
        name: exercise.name,
        sets: exSets.length,
        reps: exSets.reduce((sum: number, s: any) => sum + (s.reps || 0), 0),
        maxWeight: Math.max(...exSets.map((s: any) => s.weight || 0)),
      }));

      await feedService.publishWorkout(
        profile.id,
        formData.totalTonnage,
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
    } catch {
      setError('Erreur lors de l\'enregistrement. Réessaie.');
      setSaving(false);
    }
  }

  if (!profile) return null;

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
        {/* Date + Nom */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
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

        {/* Exercices + Circuits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <MuscuBlockForm
            onChange={data => { formDataRef.current = data; }}
            initialItems={initialItems}
            userId={profile?.id}
          />
        </motion.div>

        {/* Feedback */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="p-4 space-y-3">
            <label className="text-sm font-semibold text-[#d4d4d4]">Comment tu t'es senti ?</label>
            <div className="flex gap-3">
              {(Object.entries(FEEDBACK_LABELS) as [Feedback, string][]).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFeedback(prev => (prev === value ? '' : value))}
                  className={`
                    flex-1 py-2.5 px-3 rounded text-sm font-medium border transition-all
                    ${feedback === value
                      ? 'bg-red-700 border-red-500 text-white'
                      : 'bg-[#1c1c1c] border-white/8 text-[#a3a3a3] hover:border-white/10 hover:text-[#e5e5e5]'
                    }
                  `}
                >
                  {label}
                </button>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Notes */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
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
          <span className="text-xs text-red-400 font-bold">+{XP_REWARDS.WORKOUT_SESSION} XP</span>
          <span className="text-xs text-[#6b6b6b]">seront gagnés à l'enregistrement</span>
        </div>

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
