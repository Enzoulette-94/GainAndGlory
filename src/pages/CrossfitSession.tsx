import React, { useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Flame, Pencil } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { crossfitService } from '../services/crossfit.service';
import { xpService } from '../services/xp.service';
import { feedService } from '../services/feed.service';
import { profileRecordsService } from '../services/profile-records.service';
import { badgesService } from '../services/badges.service';
import { BadgeUnlockModal } from '../components/xp-system/BadgeUnlockModal';
import { LevelUpModal } from '../components/xp-system/LevelUpModal';
import { Card, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input, Textarea } from '../components/common/Input';
import { CrossfitBlockForm, flattenCrossfitExercises } from '../components/forms/CrossfitBlockForm';
import type { CrossfitBlockFormData, SessionItem } from '../components/forms/CrossfitBlockForm';
import { FEEDBACK_LABELS } from '../utils/constants';
import { notificationService } from '../services/notification.service';
import type { CrossfitSession as CrossfitSessionModel, UserBadge } from '../types/models';
import type { CrossfitWodType } from '../types/enums';
import type { Feedback } from '../types/enums';

export type { ExerciseItem, RestItem, CircuitItem, SessionItem } from '../components/forms/CrossfitBlockForm';

function buildInitialItems(copyFrom: CrossfitSessionModel | null | undefined): SessionItem[] | undefined {
  if (!copyFrom?.exercises || copyFrom.exercises.length === 0) return undefined;
  return copyFrom.exercises.map(ex => ({
    itemType: 'exercise' as const,
    id: Math.random().toString(36).slice(2),
    name: ex.name,
    reps: ex.reps != null ? String(ex.reps) : '',
    weight: ex.weight != null ? String(ex.weight) : '',
    duration: ex.duration != null ? String(ex.duration) : '',
    inputType: ex.reps != null ? 'reps' : 'duration',
    notes: ex.notes ?? '',
  }));
}

export function CrossfitSessionPage() {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const copyFrom = (location.state as { copyFrom?: CrossfitSessionModel } | null)?.copyFrom;

  const [name, setName] = useState(copyFrom?.name ?? '');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [feedback, setFeedback] = useState<Feedback | ''>('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [badgeQueue, setBadgeQueue] = useState<UserBadge[]>([]);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpLevel, setLevelUpLevel] = useState(0);

  const formDataRef = useRef<CrossfitBlockFormData | null>(null);
  const initialItems = buildInitialItems(copyFrom);
  const initialWodType = copyFrom?.wod_type ?? '';

  async function handleSave() {
    if (!profile) return;

    const formData = formDataRef.current;
    if (!formData) { setError('Sélectionne un type de WOD'); return; }
    if (!formData.wodType) { setError('Sélectionne un type de WOD'); return; }

    const crossfitExercises = flattenCrossfitExercises(formData.items);
    if (crossfitExercises.length === 0) { setError('Ajoutez au moins un exercice'); return; }

    setSaving(true);
    setError(null);

    try {
      const session = await crossfitService.createSession({
        userId: profile.id,
        date: new Date(date).toISOString(),
        name: name.trim() || undefined,
        wod_type: formData.wodType as CrossfitWodType,
        total_duration: formData.totalDuration ? parseInt(formData.totalDuration) : null,
        round_duration: formData.roundDuration ? parseInt(formData.roundDuration) : null,
        target_rounds: formData.targetRounds ? parseInt(formData.targetRounds) : null,
        result_time: formData.resultTime.trim() || null,
        result_reps: formData.resultReps ? parseInt(formData.resultReps) : null,
        result_rounds: formData.resultRounds ? parseInt(formData.resultRounds) : null,
        benchmark_name: formData.benchmarkName.trim() || null,
        exercises: crossfitExercises,
        feedback: feedback || undefined,
        notes: notes.trim() || undefined,
      });

      const xpResult = await xpService.awardXP(profile.id, 'CROSSFIT_SESSION', 'crossfit');
      await refreshProfile();

      const wodType = formData.wodType as CrossfitWodType;
      let resultValue: string | number | null = null;
      let resultUnit: string | null = null;
      if (wodType === 'for_time') { resultValue = formData.resultTime || null; resultUnit = 'min:sec'; }
      else if (wodType === 'amrap') { resultValue = formData.resultReps ? parseInt(formData.resultReps) : null; resultUnit = 'reps'; }
      else if (wodType === 'for_rounds') { resultValue = formData.resultRounds ? parseInt(formData.resultRounds) : null; resultUnit = 'rounds'; }
      else if (wodType === 'emom') { resultValue = formData.totalDuration ? parseInt(formData.totalDuration) : null; resultUnit = 'min'; }
      else if (wodType === 'benchmark') { resultValue = formData.benchmarkName || null; resultUnit = null; }

      await feedService.publishCrossfit(
        profile.id, wodType, resultValue, resultUnit, feedback || undefined,
        session.id, name.trim() || undefined, crossfitExercises.map(e => ({ name: e.name })),
      );

      notificationService.broadcastToAll(profile.id, 'new_session', {
        message: `🔥 ${profile.username} vient de terminer un WOD Crossfit !`,
        discipline: 'crossfit', session_id: session.id,
      });

      for (const ex of crossfitExercises) {
        if (ex.weight && ex.weight > 0) {
          await profileRecordsService.upsertRecord(profile.id, ex.name, ex.weight, 'kg', 'crossfit', false);
        }
      }

      try {
        const totalSessions = await crossfitService.getSessionsCount(profile.id).catch(() => 0);
        const newBadges = await badgesService.checkAndUnlockBadges(profile.id, {
          globalLevel: profile.global_level, currentStreak: profile.current_streak, totalSessions,
        });
        if (newBadges.length > 0) setBadgeQueue(newBadges);
      } catch { /* ignore */ }

      if (xpResult.leveledUp && xpResult.newLevel) { setLevelUpLevel(xpResult.newLevel); setShowLevelUp(true); return; }
      if (badgeQueue.length > 0) return;
      navigate('/crossfit');
    } catch (e) {
      console.error(e);
      setError('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-24">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-orange-500/10 rounded-xl"><Flame className="w-6 h-6 text-orange-400" /></div>
        <div>
          <h1 className="font-rajdhani font-bold text-xl sm:text-2xl text-[#f5f5f5] uppercase tracking-wide">Nouvelle séance</h1>
          <p className="text-xs text-[#6b6b6b]">Crossfit</p>
        </div>
      </div>

      {copyFrom && (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-transparent border border-orange-900/30 rounded text-xs text-orange-300">
          <Pencil className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Séance copiée depuis «{copyFrom.name ?? new Date(copyFrom.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}» — modifie à ta guise puis enregistre.</span>
        </div>
      )}

      {error && <div className="bg-red-950/30 border border-red-800/40 rounded-xl p-3 text-red-400 text-sm">{error}</div>}

      {/* Infos */}
      <Card className="p-4 space-y-4">
        <CardHeader title="Informations" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Nom (optionnel)" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Fran, Murph..." />
          <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
      </Card>

      {/* WOD form (type selector + params + exercises) */}
      <CrossfitBlockForm
        onChange={data => { formDataRef.current = data; }}
        initialWodType={initialWodType as CrossfitWodType | ''}
        initialItems={initialItems}
      />

      {/* Feedback */}
      <Card className="p-4 space-y-3">
        <CardHeader title="Ressenti" />
        <div className="flex gap-2">
          {(['facile', 'difficile', 'mort'] as const).map(f => (
            <button key={f} onClick={() => setFeedback(fb => fb === f ? '' : f)}
              className={`flex-1 py-2 text-sm font-medium rounded-xl border transition-colors ${feedback === f ? 'bg-orange-600/20 border-orange-500/40 text-orange-300' : 'border-white/10 text-[#6b6b6b] hover:border-white/20'}`}
            >
              {FEEDBACK_LABELS[f]}
            </button>
          ))}
        </div>
      </Card>

      {/* Notes */}
      <Card className="p-4 space-y-3">
        <CardHeader title="Notes" />
        <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Remarques, sensations, objectifs..." rows={3} />
      </Card>

      <div className="flex gap-3">
        <Button variant="ghost" className="flex-1" onClick={() => navigate('/crossfit')}>Annuler</Button>
        <Button className="flex-1 bg-orange-600 hover:bg-orange-500 text-white border-0" onClick={handleSave} disabled={saving}>
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </div>

      <LevelUpModal isOpen={showLevelUp} level={levelUpLevel} discipline="crossfit" onClose={() => { setShowLevelUp(false); if (badgeQueue.length === 0) navigate('/crossfit'); }} />
      <BadgeUnlockModal badge={badgeQueue[0] ?? null} onClose={() => {
        setBadgeQueue(prev => { const next = prev.slice(1); if (next.length === 0) navigate('/crossfit'); return next; });
      }} />
    </div>
  );
}
