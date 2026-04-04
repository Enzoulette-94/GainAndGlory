import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Zap, Pencil } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { calisthenicsService } from '../services/calisthenics.service';
import { xpService } from '../services/xp.service';
import { Card, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input, Textarea } from '../components/common/Input';
import { CaliBlockForm, flattenToCaliExercises } from '../components/forms/CaliBlockForm';
import type { CaliBlockFormData, SessionItem } from '../components/forms/CaliBlockForm';
import { CALISTHENICS_SKILLS, FEEDBACK_LABELS } from '../utils/constants';
import { profileRecordsService } from '../services/profile-records.service';
import { feedService } from '../services/feed.service';
import { badgesService } from '../services/badges.service';
import { notificationService } from '../services/notification.service';
import { BadgeUnlockModal } from '../components/xp-system/BadgeUnlockModal';
import { LevelUpModal } from '../components/xp-system/LevelUpModal';
import type { ProfileSkill, CalisthenicsSession as CalisthenicsSessionModel, UserBadge } from '../types/models';
import type { Feedback } from '../types/enums';

export type { CaliSetRow, ExerciseItem, RestItem, CircuitItem, SessionItem } from '../components/forms/CaliBlockForm';

function buildInitialItems(copyFrom: CalisthenicsSessionModel | null | undefined): SessionItem[] | undefined {
  if (!copyFrom?.exercises || copyFrom.exercises.length === 0) return undefined;
  return copyFrom.exercises.map(ex => ({
    itemType: 'exercise' as const,
    id: Math.random().toString(36).slice(2),
    name: ex.name,
    set_type: ex.set_type,
    has_weight: ex.sets.some(s => s.weight_kg != null && s.weight_kg > 0),
    sets: ex.sets.map(s => ({
      reps: s.reps != null ? String(s.reps) : '',
      hold_seconds: s.hold_seconds != null ? String(s.hold_seconds) : '',
      weight_kg: s.weight_kg != null ? String(s.weight_kg) : '',
    })),
  }));
}

export function CalisthenicsSessionPage() {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const copyFrom = (location.state as { copyFrom?: CalisthenicsSessionModel } | null)?.copyFrom;

  const [name, setName] = useState(copyFrom?.name ?? '');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [feedback, setFeedback] = useState<Feedback | ''>('');
  const [notes, setNotes] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [unlockedSkills, setUnlockedSkills] = useState<ProfileSkill[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [badgeQueue, setBadgeQueue] = useState<UserBadge[]>([]);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpLevel, setLevelUpLevel] = useState(0);

  const formDataRef = useRef<CaliBlockFormData | null>(null);
  const initialItems = buildInitialItems(copyFrom);

  useEffect(() => {
    if (profile) {
      calisthenicsService.getUnlockedSkills(profile.id).then(setUnlockedSkills).catch(() => {});
    }
  }, [profile]);

  function toggleSkill(skillCode: string) {
    setSelectedSkills(prev => prev.includes(skillCode) ? prev.filter(c => c !== skillCode) : [...prev, skillCode]);
  }

  async function handleSave() {
    if (!profile) return;

    const formData = formDataRef.current;
    if (!formData || formData.items.length === 0) { setError('Ajoutez au moins un exercice'); return; }

    setSaving(true);
    setError(null);

    try {
      const caliExercises = flattenToCaliExercises(formData.items);
      if (caliExercises.length === 0) { setError('Nommez au moins un exercice'); setSaving(false); return; }

      await calisthenicsService.createSession({
        userId: profile.id,
        name: name.trim() || undefined,
        date: new Date(date).toISOString(),
        feedback: feedback || undefined,
        notes: notes.trim() || undefined,
        exercises: caliExercises,
        skillsUnlocked: selectedSkills,
      });

      const xpResult = await xpService.awardXP(profile.id, 'CALISTHENICS_SESSION', 'calisthenics');
      await refreshProfile();

      const totalReps = caliExercises.reduce((sum, ex) => sum + ex.sets.reduce((s, r) => s + (r.reps ?? 0), 0), 0);
      const feedExercises = caliExercises.map(ex => ({
        name: ex.name,
        sets: ex.sets.length,
        reps: ex.set_type === 'reps' ? ex.sets.reduce((s, r) => s + (r.reps ?? 0), 0) : 0,
        hold_seconds: ex.set_type === 'timed' ? ex.sets.reduce((s, r) => s + (r.hold_seconds ?? 0), 0) : undefined,
        set_type: ex.set_type,
      }));
      await feedService.publishCalisthenics(
        profile.id, caliExercises.length, totalReps, feedback || undefined, undefined,
        name.trim() || undefined, selectedSkills, feedExercises,
      );

      notificationService.broadcastToAll(profile.id, 'new_session', {
        message: `⚡ ${profile.username} vient de terminer une séance de calisthénie !`,
        discipline: 'calisthenics',
      });

      for (const ex of caliExercises) {
        if (ex.set_type === 'reps') {
          const maxReps = Math.max(...ex.sets.map(s => s.reps ?? 0));
          if (maxReps > 0) {
            const hasWeight = ex.sets.some(s => s.weight_kg != null && s.weight_kg > 0);
            if (hasWeight) {
              const best = ex.sets.filter(s => (s.reps ?? 0) > 0 && (s.weight_kg ?? 0) > 0).sort((a, b) => (b.reps ?? 0) - (a.reps ?? 0))[0];
              if (best) await profileRecordsService.upsertRecord(profile.id, ex.name, best.reps!, `reps — ${best.weight_kg} kg lestés`, 'calisthenics', false);
            } else {
              await profileRecordsService.upsertRecord(profile.id, ex.name, maxReps, 'reps', 'calisthenics', false);
            }
          }
        } else {
          const maxSec = Math.max(...ex.sets.map(s => s.hold_seconds ?? 0));
          if (maxSec > 0) await profileRecordsService.upsertRecord(profile.id, ex.name, maxSec, 's', 'calisthenics', false);
        }
      }

      try {
        const totalSessions = await calisthenicsService.getSessionsCount(profile.id).catch(() => 0);
        const newBadges = await badgesService.checkAndUnlockBadges(profile.id, {
          globalLevel: profile.global_level, currentStreak: profile.current_streak, totalSessions,
        });
        if (newBadges.length > 0) setBadgeQueue(newBadges);
      } catch { /* ignore */ }

      if (xpResult.leveledUp && xpResult.newLevel) { setLevelUpLevel(xpResult.newLevel); setShowLevelUp(true); return; }
      if (badgeQueue.length > 0) return;
      navigate('/calisthenics');
    } catch (e) {
      console.error(e);
      setError('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  }

  const availableSkills = CALISTHENICS_SKILLS.filter(s => !unlockedSkills.some(u => u.skill_code === s.code));

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-violet-500/10 rounded-xl">
          <Zap className="w-6 h-6 text-violet-400" />
        </div>
        <div>
          <h1 className="font-rajdhani font-bold text-xl sm:text-2xl text-[#f5f5f5] uppercase tracking-wide">Nouvelle séance</h1>
          <p className="text-xs text-[#6b6b6b]">Calisthénie</p>
        </div>
      </div>

      {copyFrom && (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-transparent border border-violet-900/30 rounded text-xs text-violet-300">
          <Pencil className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Séance copiée depuis «{copyFrom.name ?? new Date(copyFrom.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}» — modifie à ta guise puis enregistre.</span>
        </div>
      )}

      {error && <div className="bg-red-950/30 border border-red-800/40 rounded-xl p-3 text-red-400 text-sm">{error}</div>}

      {/* Infos */}
      <Card className="p-4 space-y-4">
        <CardHeader title="Informations" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Nom (optionnel)" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Upper body" />
          <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
      </Card>

      {/* Exercices / Circuits */}
      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <CardHeader title="Exercices" />
        </div>
        <CaliBlockForm
          onChange={data => { formDataRef.current = data; }}
          initialItems={initialItems}
        />
      </Card>

      {/* Feedback */}
      <Card className="p-4 space-y-3">
        <CardHeader title="Ressenti" />
        <div className="flex gap-2">
          {(['facile', 'difficile', 'mort'] as const).map(f => (
            <button key={f} onClick={() => setFeedback(fb => fb === f ? '' : f)}
              className={`flex-1 py-2 text-sm font-medium rounded-xl border transition-colors ${feedback === f ? 'bg-violet-600/20 border-violet-500/40 text-violet-300' : 'border-white/10 text-[#6b6b6b] hover:border-white/20'}`}
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

      {/* Skills */}
      {availableSkills.length > 0 && (
        <Card className="p-4 space-y-3">
          <CardHeader title="Skills débloqués" />
          <div className="flex flex-wrap gap-2">
            {availableSkills.map(s => (
              <button key={s.code}
                onClick={() => toggleSkill(s.code)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${selectedSkills.includes(s.code) ? 'bg-violet-600/20 border-violet-500/40 text-violet-300' : 'border-white/10 text-[#6b6b6b] hover:border-white/20'}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="ghost" className="flex-1" onClick={() => navigate('/calisthenics')}>Annuler</Button>
        <Button className="flex-1 bg-violet-600 hover:bg-violet-500 text-white border-0" onClick={handleSave} disabled={saving}>
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </div>

      <LevelUpModal isOpen={showLevelUp} level={levelUpLevel} discipline="calisthenics" onClose={() => { setShowLevelUp(false); if (badgeQueue.length === 0) navigate('/calisthenics'); }} />
      <BadgeUnlockModal badge={badgeQueue[0] ?? null} onClose={() => {
        setBadgeQueue(prev => { const next = prev.slice(1); if (next.length === 0) navigate('/calisthenics'); return next; });
      }} />
    </div>
  );
}
