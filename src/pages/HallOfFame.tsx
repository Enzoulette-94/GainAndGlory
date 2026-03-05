import React, { useEffect, useState } from 'react';
import { Crown, Dumbbell, PersonStanding, Star, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase-client';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/common/Card';
import { Loader } from '../components/common/Loader';
import { formatDistance, formatNumber } from '../utils/calculations';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RankEntry {
  id: string;
  username: string;
  level: number;
  value: number;
  avatar_url: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rankColor(rank: number) {
  if (rank === 1) return { text: 'text-yellow-400', border: 'border-yellow-600/40', bg: 'bg-yellow-500/5' };
  if (rank === 2) return { text: 'text-[#d4d4d4]',  border: 'border-white/15',      bg: 'bg-white/3' };
  if (rank === 3) return { text: 'text-amber-600',   border: 'border-amber-700/40',  bg: 'bg-amber-600/5' };
  return           { text: 'text-[#6b6b6b]',         border: 'border-white/5',       bg: 'bg-transparent' };
}

function rankLabel(rank: number) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
}

// ─── Colonne de classement ────────────────────────────────────────────────────

interface LeaderboardColumnProps {
  title: string;
  icon: React.ReactNode;
  accentClass: string;
  entries: RankEntry[];
  loading: boolean;
  error: string | null;
  currentUserId: string | null;
  formatValue: (v: number) => string;
  valueLabel: string;
  emptyIcon: React.ReactNode;
}

function LeaderboardColumn({
  title, icon, accentClass, entries, loading, error,
  currentUserId, formatValue, valueLabel, emptyIcon,
}: LeaderboardColumnProps) {
  return (
    <Card className="flex flex-col overflow-hidden">
      {/* En-tête colonne */}
      <div className={`flex items-center gap-2 px-4 py-3 border-b border-white/5`}>
        <div className={`${accentClass}`}>{icon}</div>
        <h2 className={`font-rajdhani font-bold text-sm tracking-widest uppercase ${accentClass}`}>
          {title}
        </h2>
      </div>

      <div className="flex flex-col divide-y divide-white/5">
        {loading && (
          <div className="px-4 py-8 flex justify-center">
            <Loader text="" />
          </div>
        )}
        {!loading && error && (
          <p className="px-4 py-6 text-xs text-red-400 text-center">{error}</p>
        )}
        {!loading && !error && entries.length === 0 && (
          <div className="px-4 py-8 flex flex-col items-center gap-2 text-[#4a4a4a]">
            {emptyIcon}
            <p className="text-xs">Aucune donnée</p>
          </div>
        )}
        {!loading && !error && entries.map((entry, i) => {
          const rank = i + 1;
          const colors = rankColor(rank);
          const isMe = entry.id === currentUserId;
          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-3 px-4 py-3 ${colors.bg} ${
                isMe ? 'ring-1 ring-inset ring-[#c9a870]/30' : ''
              }`}
            >
              {/* Rang */}
              <span className={`w-6 text-center text-sm flex-shrink-0 ${rank <= 3 ? 'text-base' : `text-xs font-bold ${colors.text}`}`}>
                {rankLabel(rank)}
              </span>

              {/* Avatar */}
              <div className={`w-7 h-7 rounded-full flex-shrink-0 border overflow-hidden ${colors.border}`}>
                {entry.avatar_url
                  ? <img src={entry.avatar_url} alt={entry.username} className="w-full h-full object-cover" />
                  : <div className={`w-full h-full flex items-center justify-center text-xs font-black ${colors.bg}`}>
                      <span className={colors.text}>{entry.username.charAt(0).toUpperCase()}</span>
                    </div>
                }
              </div>

              {/* Nom + niveau */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${isMe ? 'text-[#c9a870]' : 'text-[#e5e5e5]'}`}>
                  {entry.username}
                  {isMe && <span className="ml-1.5 text-[10px] font-bold text-[#c9a870] border border-[#c9a870]/40 px-1 py-0.5">VOUS</span>}
                </p>
                <p className="text-xs text-[#6b6b6b]">Niv. {entry.level}</p>
              </div>

              {/* Valeur */}
              <div className="text-right flex-shrink-0">
                <p className={`text-sm font-bold ${rank === 1 ? colors.text : 'text-[#d4d4d4]'}`}>
                  {formatValue(entry.value)}
                </p>
                <p className="text-xs text-[#6b6b6b]">{valueLabel}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── Hooks de données ─────────────────────────────────────────────────────────

function useXPRanking() {
  const [entries, setEntries] = useState<RankEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('profiles')
      .select('id, username, total_xp, global_level, current_streak, avatar_url')
      .order('total_xp', { ascending: false })
      .limit(5)
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) { setError('Erreur chargement XP'); }
        else {
          setEntries((data ?? []).map((p: any) => ({
            id: p.id, username: p.username, level: p.global_level, value: p.total_xp, avatar_url: p.avatar_url ?? null,
          })));
        }
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return { entries, loading, error };
}

function useRunningRanking() {
  const [entries, setEntries] = useState<RankEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: sessions, error: err } = await supabase
          .from('running_sessions').select('user_id, distance');
        if (err) throw err;

        const totals: Record<string, number> = {};
        for (const r of (sessions ?? []) as { user_id: string; distance: number }[])
          totals[r.user_id] = (totals[r.user_id] ?? 0) + (r.distance ?? 0);

        const sorted = Object.entries(totals).sort(([, a], [, b]) => b - a).slice(0, 5);
        if (sorted.length === 0) { if (!cancelled) { setEntries([]); setLoading(false); } return; }

        const { data: profiles, error: err2 } = await supabase
          .from('profiles').select('id, username, global_level, avatar_url').in('id', sorted.map(([id]) => id));
        if (err2) throw err2;

        const map: Record<string, any> = {};
        for (const p of (profiles ?? []) as any[]) map[p.id] = p;

        if (!cancelled) {
          setEntries(sorted.filter(([id]) => map[id]).map(([id, v]) => ({
            id, username: map[id].username, level: map[id].global_level, value: v, avatar_url: map[id].avatar_url ?? null,
          })));
          setLoading(false);
        }
      } catch { if (!cancelled) { setError('Erreur chargement course'); setLoading(false); } }
    })();
    return () => { cancelled = true; };
  }, []);

  return { entries, loading, error };
}

function useMusculationRanking() {
  const [entries, setEntries] = useState<RankEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: sessions, error: err } = await supabase
          .from('workout_sessions').select('user_id, total_tonnage');
        if (err) throw err;

        const totals: Record<string, number> = {};
        for (const r of (sessions ?? []) as { user_id: string; total_tonnage: number | null }[])
          totals[r.user_id] = (totals[r.user_id] ?? 0) + (r.total_tonnage ?? 0);

        const sorted = Object.entries(totals).sort(([, a], [, b]) => b - a).slice(0, 5);
        if (sorted.length === 0) { if (!cancelled) { setEntries([]); setLoading(false); } return; }

        const { data: profiles, error: err2 } = await supabase
          .from('profiles').select('id, username, global_level, avatar_url').in('id', sorted.map(([id]) => id));
        if (err2) throw err2;

        const map: Record<string, any> = {};
        for (const p of (profiles ?? []) as any[]) map[p.id] = p;

        if (!cancelled) {
          setEntries(sorted.filter(([id]) => map[id]).map(([id, v]) => ({
            id, username: map[id].username, level: map[id].global_level, value: v, avatar_url: map[id].avatar_url ?? null,
          })));
          setLoading(false);
        }
      } catch { if (!cancelled) { setError('Erreur chargement muscu'); setLoading(false); } }
    })();
    return () => { cancelled = true; };
  }, []);

  return { entries, loading, error };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function HallOfFamePage() {
  const { profile } = useAuth();
  const currentUserId = profile?.id ?? null;

  const xp   = useXPRanking();
  const run  = useRunningRanking();
  const musc = useMusculationRanking();

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3">
        <div className="p-2.5 border border-yellow-700/50">
          <Crown className="w-6 h-6 text-yellow-400" />
        </div>
        <div>
          <h1 className="font-rajdhani text-3xl font-bold tracking-wide uppercase text-[#c9a870]">
            Hall of Fame
          </h1>
          <p className="text-[#a3a3a3] text-sm mt-0.5">Top 5 — XP · Course · Musculation</p>
        </div>
      </motion.div>

      {/* 3 colonnes */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <LeaderboardColumn
          title="Top XP"
          icon={<Star className="w-4 h-4" />}
          accentClass="text-yellow-400"
          entries={xp.entries}
          loading={xp.loading}
          error={xp.error}
          currentUserId={currentUserId}
          formatValue={v => `${formatNumber(v)} XP`}
          valueLabel="XP total"
          emptyIcon={<Star className="w-8 h-8" />}
        />

        <LeaderboardColumn
          title="Top Course"
          icon={<PersonStanding className="w-4 h-4" />}
          accentClass="text-blue-400"
          entries={run.entries}
          loading={run.loading}
          error={run.error}
          currentUserId={currentUserId}
          formatValue={v => formatDistance(v)}
          valueLabel="distance totale"
          emptyIcon={<PersonStanding className="w-8 h-8" />}
        />

        <LeaderboardColumn
          title="Top Muscu"
          icon={<Dumbbell className="w-4 h-4" />}
          accentClass="text-red-400"
          entries={musc.entries}
          loading={musc.loading}
          error={musc.error}
          currentUserId={currentUserId}
          formatValue={v => `${formatNumber(Math.round(v))} kg`}
          valueLabel="tonnage total"
          emptyIcon={<Dumbbell className="w-8 h-8" />}
        />
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        className="text-center text-xs text-[#4a4a4a] pb-2"
      >
        Classements mis à jour en temps réel · Top 5 joueurs
      </motion.p>
    </div>
  );
}
