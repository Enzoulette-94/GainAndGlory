import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PersonStanding } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase-client';
import { runningService } from '../services/running.service';
import { xpService } from '../services/xp.service';
import { feedService } from '../services/feed.service';
import { Button } from '../components/common/Button';
import { Input, Textarea, Select } from '../components/common/Input';
import { Card } from '../components/common/Card';
import { RunBlockForm } from '../components/forms/RunBlockForm';
import type { RunBlockFormData } from '../components/forms/RunBlockForm';
import {
  FEEDBACK_LABELS,
  XP_REWARDS,
} from '../utils/constants';
import type { Shoe } from '../types/models';
import type { Feedback } from '../types/enums';
import { profileRecordsService } from '../services/profile-records.service';
import { notificationService } from '../services/notification.service';
import { badgesService } from '../services/badges.service';
import { BadgeUnlockModal } from '../components/xp-system/BadgeUnlockModal';
import { LevelUpModal } from '../components/xp-system/LevelUpModal';
import type { UserBadge } from '../types/models';

function toLocalDatetimeValue(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export function RunSessionPage() {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [date, setDate] = useState(toLocalDatetimeValue());
  const [sessionName, setSessionName] = useState('');
  const [feedback, setFeedback] = useState<Feedback | ''>('');
  const [notes, setNotes] = useState('');
  const [shoeId, setShoeId] = useState('');
  const [shoes, setShoes] = useState<Shoe[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [badgeQueue, setBadgeQueue] = useState<UserBadge[]>([]);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpLevel, setLevelUpLevel] = useState(0);

  const formDataRef = useRef<RunBlockFormData | null>(null);

  useEffect(() => {
    if (!profile) return;
    runningService.getShoes(profile.id).then(setShoes).catch(() => {});
  }, [profile]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;

    const formData = formDataRef.current;
    if (!formData) { setError('Remplis les champs de course.'); return; }

    const { distance, durationSeconds, runType, runLocation, pace, elevationGain, elevationLoss, avgHeartRate, maxHeartRate, weatherTemp, weatherCondition } = formData;

    if (distance <= 0) {
      setError('La distance doit être supérieure à 0.');
      return;
    }
    if (durationSeconds <= 0) {
      setError('La durée doit être supérieure à 0.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('[RunSession] user at insert time:', user);

      const session = await runningService.createSession({
        user_id: profile.id,
        date: new Date(date).toISOString(),
        name: sessionName.trim() || undefined,
        distance,
        duration: durationSeconds,
        run_type: runType || undefined,
        run_location: runLocation || undefined,
        elevation_gain: elevationGain,
        elevation_loss: elevationLoss,
        avg_heart_rate: avgHeartRate,
        max_heart_rate: maxHeartRate,
        weather_temp: weatherTemp,
        weather_condition: weatherCondition || undefined,
        shoe_id: shoeId || undefined,
        feedback: feedback || undefined,
        notes: notes.trim() || undefined,
      });

      // Auto-détection des records par distance fixe (±3%)
      const TARGET_DISTANCES = [
        { label: '1 km', km: 1 },
        { label: '5 km', km: 5 },
        { label: '10 km', km: 10 },
        { label: 'Semi-marathon', km: 21.0975 },
        { label: 'Marathon', km: 42.195 },
      ];
      for (const target of TARGET_DISTANCES) {
        if (Math.abs(distance - target.km) <= target.km * 0.03) {
          await profileRecordsService.upsertRecord(
            profile.id, target.label, durationSeconds, 's', 'course', true,
          );
        }
      }

      let xpResult: { leveledUp: boolean; newLevel?: number } = { leveledUp: false };
      try {
        xpResult = await xpService.awardXP(profile.id, 'RUNNING_SESSION', 'running');
      } catch (e) { console.error('[RunSession] XP award failed:', e); }

      await refreshProfile();

      try {
        await feedService.publishRun(
          profile.id,
          distance,
          durationSeconds,
          pace,
          runType || undefined,
          session.id,
          sessionName.trim() || undefined,
          feedback || undefined,
        );
      } catch (e) { console.error('[RunSession] Feed publish failed:', e); }

      try {
        notificationService.broadcastToAll(profile.id, 'new_session', {
          message: `🏃 ${profile.username} vient de terminer une séance de course !`,
          discipline: 'running',
          session_id: session.id,
        });
      } catch { /* ignore */ }

      try {
        const [totalSessions, totalKm] = await Promise.all([
          runningService.getSessionsCount(profile.id).catch(() => 0),
          runningService.getTotalDistance(profile.id).catch(() => 0),
        ]);
        const newBadges = await badgesService.checkAndUnlockBadges(profile.id, {
          globalLevel: profile.global_level,
          runningLevel: profile.running_level,
          currentStreak: profile.current_streak,
          totalSessions,
          totalKm,
        });
        if (newBadges.length > 0) setBadgeQueue(newBadges);
      } catch { /* ignore */ }

      if (xpResult.leveledUp && xpResult.newLevel) {
        setLevelUpLevel(xpResult.newLevel);
        setShowLevelUp(true);
        return;
      }
      if (badgeQueue.length > 0) return;
      navigate('/running');
    } catch (e) {
      console.error('[RunSession] Session creation failed:', JSON.stringify(e, null, 2));
      setError('Erreur lors de l\'enregistrement. Réessaie.');
      setSaving(false);
    }
  }

  if (!profile) return null;

  const shoeOptions = shoes.filter(s => s.is_active).map(s => ({
    value: s.id,
    label: `${s.brand ? s.brand + ' ' : ''}${s.model} (${Math.round(s.total_km)} km)`,
  }));

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="p-2.5 rounded bg-transparent border border-blue-900/40">
          <PersonStanding className="w-6 h-6 text-blue-500" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Nouvelle course</h1>
          <p className="text-[#a3a3a3] text-sm mt-0.5">Running</p>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Date + Nom */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-4 space-y-3">
            <Input
              label="Titre de la course (optionnel)"
              placeholder="ex. Morning Run, Trail des crêtes, Sortie longue..."
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

        {/* Run form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <RunBlockForm onChange={data => { formDataRef.current = data; }} />
        </motion.div>

        {/* Chaussures */}
        {shoeOptions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-4">
              <Select
                label="Chaussures"
                value={shoeId}
                onChange={e => setShoeId(e.target.value)}
                options={shoeOptions}
                placeholder="Sélectionner des chaussures..."
              />
            </Card>
          </motion.div>
        )}

        {/* Feedback */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
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
          transition={{ delay: 0.35 }}
        >
          <Card className="p-4">
            <Textarea
              label="Notes (optionnel)"
              placeholder="Ressenti, itinéraire, conditions..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
            />
          </Card>
        </motion.div>

        {/* XP info */}
        <div className="flex items-center gap-2 px-1">
          <div className="p-1 rounded-lg bg-transparent">
            <span className="text-xs text-red-400 font-bold">+{XP_REWARDS.RUNNING_SESSION} XP</span>
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
          transition={{ delay: 0.4 }}
          className="pb-6"
        >
          <Button
            type="submit"
            size="lg"
            loading={saving}
            className="w-full bg-transparent border border-blue-800/60 text-blue-500 hover:bg-blue-900/10 hover:border-blue-700"
            icon={<PersonStanding className="w-5 h-5" />}
          >
            {saving ? 'Enregistrement...' : 'Enregistrer la course'}
          </Button>
        </motion.div>
      </form>

      <LevelUpModal
        isOpen={showLevelUp}
        level={levelUpLevel}
        discipline="running"
        onClose={() => {
          setShowLevelUp(false);
          if (badgeQueue.length === 0) navigate('/running');
        }}
      />
      <BadgeUnlockModal
        badge={badgeQueue[0] ?? null}
        onClose={() => {
          setBadgeQueue(prev => {
            const next = prev.slice(1);
            if (next.length === 0) navigate('/running');
            return next;
          });
        }}
      />
    </div>
  );
}
