import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Dumbbell, Timer, Route, Flame, Trophy, ArrowLeft, PersonStanding } from 'lucide-react';
import { motion } from 'framer-motion';
import { workoutService } from '../services/workout.service';
import { runningService } from '../services/running.service';
import { badgesService } from '../services/badges.service';
import { profileService } from '../services/profile.service';
import { profileRecordsService } from '../services/profile-records.service';
import { getLevelProgress, getLevelTitle, formatDate, formatDistance } from '../utils/calculations';
import { BADGE_RARITY_CONFIG } from '../utils/constants';
import { Card } from '../components/common/Card';
import { ProgressBar } from '../components/common/ProgressBar';
import { Loader } from '../components/common/Loader';
import type { Profile, UserBadge, ProfileRecord } from '../types/models';

// ─── helpers ────────────────────────────────────────────────────────────────

function getInitials(username: string): string {
  return username.slice(0, 2).toUpperCase();
}

// ─── sub-components ──────────────────────────────────────────────────────────

interface XPRowProps { label: string; xp: number; color: string; delay?: number; }

function XPRow({ label, xp, color, delay = 0 }: XPRowProps) {
  const { level, current, needed } = getLevelProgress(xp);
  const progress = needed > 0 ? Math.min((current / needed) * 100, 100) : 100;
  return (
    <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }} className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[#d4d4d4] font-medium">Niveau {level}</span>
        <span className="text-[#6b6b6b]">{current.toLocaleString('fr-FR')} / {needed.toLocaleString('fr-FR')} XP</span>
      </div>
      <ProgressBar value={progress} color={color} height="sm" />
      <p className="text-xs text-[#6b6b6b]">{label}</p>
    </motion.div>
  );
}

// ─── main component ──────────────────────────────────────────────────────────

export function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<{ muscuCount: number; runCount: number; totalDistance: number } | null>(null);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [records, setRecords] = useState<ProfileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const loadAll = useCallback(async (uid: string) => {
    try {
      const p = await profileService.getProfile(uid);
      if (!p) { setNotFound(true); return; }
      setProfile(p);
      const [muscuCount, runCount, totalDistance, userBadges, userRecords] = await Promise.all([
        workoutService.getSessionsCount(uid),
        runningService.getSessionsCount(uid),
        runningService.getTotalDistance(uid),
        badgesService.getUserBadges(uid),
        profileRecordsService.getRecords(uid),
      ]);
      setStats({ muscuCount, runCount, totalDistance });
      setBadges(userBadges);
      setRecords(userRecords);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId) loadAll(userId);
  }, [userId, loadAll]);

  if (loading) return <Loader text="Chargement du profil…" />;

  if (notFound || !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-[#6b6b6b] text-sm">Profil introuvable.</p>
        <button onClick={() => navigate(-1)} className="text-xs text-[#c9a870] hover:underline">← Retour</button>
      </div>
    );
  }

  const levelTitle = getLevelTitle(profile.global_level);
  const memberSince = formatDate(profile.created_at, { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6 pb-6">

      {/* ── BACK + HEADER ─────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs text-[#6b6b6b] hover:text-[#d4d4d4] transition-colors mb-3">
          <ArrowLeft className="w-3.5 h-3.5" /> Retour
        </button>
        <Card className="p-6">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="flex-shrink-0 w-[72px] h-[72px] rounded-full overflow-hidden border-2 border-[#c9a870]/40 bg-[#1c1c1c] flex items-center justify-center">
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                : <span className="text-[#c9a870] font-bold text-2xl">{getInitials(profile.username)}</span>
              }
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-black text-white truncate">{profile.username}</h1>
              <span className="inline-block mt-1 px-2.5 py-0.5 text-xs font-semibold text-[#c9a870] border border-[#c9a870]/30">
                {levelTitle}
              </span>
              <p className="text-xs text-[#6b6b6b] mt-2">Membre depuis {memberSince}</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ── XP BARS ──────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="p-5 space-y-5">
          <h2 className="text-sm font-semibold text-[#d4d4d4] uppercase tracking-wider">Progression</h2>
          <XPRow label={`Global · ${profile.total_xp.toLocaleString('fr-FR')} XP total`} xp={profile.total_xp} color="bg-red-500" delay={0.12} />
          <XPRow label={`Musculation · ${profile.musculation_xp.toLocaleString('fr-FR')} XP total`} xp={profile.musculation_xp} color="bg-red-800" delay={0.18} />
          <XPRow label={`Course · ${profile.running_xp.toLocaleString('fr-FR')} XP total`} xp={profile.running_xp} color="bg-blue-700" delay={0.24} />
        </Card>
      </motion.div>

      {/* ── STATS ────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h2 className="text-sm font-semibold text-[#d4d4d4] uppercase tracking-wider mb-3">Statistiques</h2>
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 flex flex-col gap-2">
            <Dumbbell className="w-4 h-4 text-red-400" />
            <p className="text-2xl font-black text-white">{stats?.muscuCount ?? 0}</p>
            <p className="text-xs text-[#a3a3a3]">Séances muscu</p>
          </Card>
          <Card className="p-4 flex flex-col gap-2">
            <Timer className="w-4 h-4 text-blue-500" />
            <p className="text-2xl font-black text-white">{stats?.runCount ?? 0}</p>
            <p className="text-xs text-[#a3a3a3]">Séances course</p>
          </Card>
          <Card className="p-4 flex flex-col gap-2">
            <Route className="w-4 h-4 text-blue-500" />
            <p className="text-2xl font-black text-white">{stats ? formatDistance(stats.totalDistance) : '0 km'}</p>
            <p className="text-xs text-[#a3a3a3]">Distance totale</p>
          </Card>
          <Card className="p-4 flex flex-col gap-2">
            <Flame className="w-4 h-4 text-orange-600" />
            <p className="text-2xl font-black text-white">{profile.current_streak}</p>
            <p className="text-xs text-[#a3a3a3]">Jours consécutifs</p>
            <p className="text-xs text-[#4a4a4a]">Record : {profile.longest_streak} jours</p>
          </Card>
        </div>
      </motion.div>

      {/* ── PERFORMANCES ─────────────────────────────────────────────── */}
      {records.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="space-y-4">
          <h2 className="text-sm font-semibold text-[#d4d4d4] uppercase tracking-wider">Meilleures performances</h2>

          {/* Musculation */}
          {records.filter(r => (r.category ?? 'musculation') === 'musculation').length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Dumbbell className="w-3.5 h-3.5 text-[#c9a870]" />
                <span className="text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider">Musculation</span>
              </div>
              <div className="space-y-1.5">
                {records.filter(r => (r.category ?? 'musculation') === 'musculation').map((r, i) => (
                  <motion.div key={r.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.27 + i * 0.04 }}
                    className="flex items-center gap-2 px-3 py-2.5 bg-[#111111] border border-white/5 border-l-2 border-l-[#c9a870]/40"
                  >
                    <Trophy className="w-3.5 h-3.5 text-[#c9a870] flex-shrink-0" />
                    <span className="text-sm font-medium text-[#d4d4d4]">{r.title}</span>
                    <span className="text-[#6b6b6b] text-xs">•</span>
                    <span className="text-sm font-bold text-[#c9a870]">
                      {r.value}<span className="text-xs font-normal text-[#6b6b6b] ml-1">{r.unit}</span>
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Course */}
          {records.filter(r => r.category === 'course').length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <PersonStanding className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider">Course</span>
              </div>
              <div className="space-y-1.5">
                {records.filter(r => r.category === 'course').map((r, i) => (
                  <motion.div key={r.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.27 + i * 0.04 }}
                    className="flex items-center gap-2 px-3 py-2.5 bg-[#111111] border border-white/5 border-l-2 border-l-blue-800/50"
                  >
                    <PersonStanding className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                    <span className="text-sm font-medium text-[#d4d4d4]">{r.title}</span>
                    <span className="text-[#6b6b6b] text-xs">•</span>
                    <span className="text-sm font-bold text-blue-400">{r.value}</span>
                    <span className="text-xs text-[#6b6b6b]">{r.unit}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ── BADGES ───────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <h2 className="text-sm font-semibold text-[#d4d4d4] uppercase tracking-wider mb-3">
          Badges débloqués ({badges.length})
        </h2>
        {badges.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-[#6b6b6b] text-sm">Aucun badge encore…</p>
          </Card>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {badges.map((ub) => {
              const badge = ub.badge;
              if (!badge) return null;
              const rarityKey = badge.rarity as keyof typeof BADGE_RARITY_CONFIG;
              const config = BADGE_RARITY_CONFIG[rarityKey] ?? BADGE_RARITY_CONFIG.common;
              return (
                <div
                  key={ub.id}
                  title={badge.description ?? badge.name}
                  className="rounded border px-3 py-2 text-center cursor-default select-none"
                  style={{ backgroundColor: config.bg, borderColor: config.color + '40' }}
                >
                  <p className="text-xs font-semibold truncate" style={{ color: config.color }}>{badge.name}</p>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

    </div>
  );
}
