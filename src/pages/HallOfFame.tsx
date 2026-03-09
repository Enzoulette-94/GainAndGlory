import React, { useEffect, useState } from 'react';
import { Crown, Dumbbell, PersonStanding, Star, Flame, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
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

interface RecordEntry {
  recordId: string;
  user_id: string;
  username: string;
  level: number;
  avatar_url: string | null;
  value: string;
  numericValue: number;
}

interface RecordGroup {
  title: string;
  unit: string;
  category: 'musculation' | 'course';
  ascending: boolean;
  entries: RecordEntry[];
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

function parseRecordValue(value: string): number {
  const trimmed = value.trim();
  if (trimmed.includes(':')) {
    const parts = trimmed.split(':');
    if (parts.length === 2)
      return (parseFloat(parts[0]) || 0) * 60 + (parseFloat(parts[1]) || 0);
  }
  return parseFloat(trimmed.replace(',', '.').replace(/[^\d.]/g, '')) || 0;
}

function isAscendingUnit(unit: string): boolean {
  const u = unit.toLowerCase().trim();
  return u.includes('min') || u === 's' || u === 'sec' || u.includes('seconde');
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
              } ${!isMe ? 'cursor-pointer hover:bg-white/5 transition-colors' : ''}`}
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
                {isMe ? (
                  <p className="text-sm font-semibold truncate text-[#c9a870]">
                    {entry.username}
                    <span className="ml-1.5 text-[10px] font-bold text-[#c9a870] border border-[#c9a870]/40 px-1 py-0.5">VOUS</span>
                  </p>
                ) : (
                  <Link to={`/profil/${entry.id}`} className="text-sm font-semibold truncate text-[#e5e5e5] hover:text-[#c9a870] transition-colors">
                    {entry.username}
                  </Link>
                )}
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
          .from('workout_sessions_with_tonnage').select('user_id, total_tonnage');
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

// ─── Carte record par exercice ────────────────────────────────────────────────

function RecordGroupCard({ group, currentUserId }: { group: RecordGroup; currentUserId: string | null }) {
  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div>
          <h3 className="font-rajdhani font-bold text-sm tracking-widest uppercase text-[#c9a870]">
            {group.title}
          </h3>
          <p className="text-xs text-[#6b6b6b]">
            {group.unit} · {group.ascending ? '↓ meilleur temps' : '↑ meilleure charge'}
          </p>
        </div>
        <Trophy className="w-4 h-4 text-[#c9a870]/30" />
      </div>

      <div className="flex flex-col divide-y divide-white/5">
        {group.entries.map((entry, i) => {
          const rank = i + 1;
          const colors = rankColor(rank);
          const isMe = entry.user_id === currentUserId;
          return (
            <div
              key={entry.user_id}
              className={`flex items-center gap-3 px-4 py-3 ${colors.bg} ${isMe ? 'ring-1 ring-inset ring-[#c9a870]/30' : ''}`}
            >
              <span className={`w-6 text-center flex-shrink-0 ${rank <= 3 ? 'text-base' : `text-xs font-bold ${colors.text}`}`}>
                {rankLabel(rank)}
              </span>

              <div className={`w-6 h-6 rounded-full flex-shrink-0 border overflow-hidden ${colors.border}`}>
                {entry.avatar_url
                  ? <img src={entry.avatar_url} alt={entry.username} className="w-full h-full object-cover" />
                  : <div className={`w-full h-full flex items-center justify-center text-[10px] font-black ${colors.bg}`}>
                      <span className={colors.text}>{entry.username.charAt(0).toUpperCase()}</span>
                    </div>
                }
              </div>

              <div className="flex-1 min-w-0">
                {isMe ? (
                  <p className="text-sm font-semibold truncate text-[#c9a870]">
                    {entry.username}
                    <span className="ml-1.5 text-[10px] font-bold text-[#c9a870] border border-[#c9a870]/40 px-1 py-0.5">VOUS</span>
                  </p>
                ) : (
                  <Link to={`/profil/${entry.user_id}`} className="text-sm font-semibold truncate text-[#e5e5e5] hover:text-[#c9a870] transition-colors">
                    {entry.username}
                  </Link>
                )}
                <p className="text-xs text-[#6b6b6b]">Niv. {entry.level}</p>
              </div>

              <div className="text-right flex-shrink-0">
                <p className={`text-sm font-bold ${rank === 1 ? colors.text : 'text-[#d4d4d4]'}`}>
                  {entry.value}
                </p>
                <p className="text-xs text-[#6b6b6b]">{group.unit}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── Hook records ──────────────────────────────────────────────────────────────

function useRecordsRanking() {
  const [groups, setGroups] = useState<RecordGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: profiles, error: err1 } = await (supabase as any)
          .from('profiles')
          .select('id, username, global_level, avatar_url, share_performances')
          .eq('share_performances', true);
        if (err1) throw err1;

        const profileMap: Record<string, any> = {};
        for (const p of (profiles ?? []) as any[]) profileMap[p.id] = p;

        const userIds = Object.keys(profileMap);
        if (userIds.length === 0) {
          if (!cancelled) { setGroups([]); setLoading(false); }
          return;
        }

        const { data: records, error: err2 } = await (supabase as any)
          .from('profile_records')
          .select('id, user_id, title, value, unit')
          .in('user_id', userIds);
        if (err2) throw err2;

        const groupMap: Record<string, { title: string; unit: string; category: 'musculation' | 'course'; entries: RecordEntry[] }> = {};
        for (const rec of (records ?? []) as any[]) {
          const cat: 'musculation' | 'course' = rec.category === 'course' ? 'course' : 'musculation';
          const key = `${cat}::${rec.title.trim().toLowerCase()}`;
          if (!groupMap[key]) {
            groupMap[key] = { title: rec.title.trim(), unit: rec.unit, category: cat, entries: [] };
          }
          const profile = profileMap[rec.user_id];
          if (!profile) continue;

          const numericValue = parseRecordValue(rec.value);
          const ascending = cat === 'course';
          const existing = groupMap[key].entries.find(e => e.user_id === rec.user_id);

          if (existing) {
            if (ascending ? numericValue < existing.numericValue : numericValue > existing.numericValue) {
              existing.value = rec.value;
              existing.numericValue = numericValue;
            }
          } else {
            groupMap[key].entries.push({
              recordId: rec.id,
              user_id: rec.user_id,
              username: profile.username,
              level: profile.global_level,
              avatar_url: profile.avatar_url ?? null,
              value: rec.value,
              numericValue,
            });
          }
        }

        const result: RecordGroup[] = Object.values(groupMap).map(group => {
          const ascending = group.category === 'course';
          const sorted = [...group.entries]
            .sort((a, b) => ascending ? a.numericValue - b.numericValue : b.numericValue - a.numericValue)
            .slice(0, 5);
          return { title: group.title, unit: group.unit, category: group.category, ascending, entries: sorted };
        });

        result.sort((a, b) => b.entries.length - a.entries.length || a.title.localeCompare(b.title));

        if (!cancelled) { setGroups(result); setLoading(false); }
      } catch {
        if (!cancelled) { setError('Erreur chargement records'); setLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { groups, loading, error };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function HallOfFamePage() {
  const { profile } = useAuth();
  const currentUserId = profile?.id ?? null;

  const xp      = useXPRanking();
  const run     = useRunningRanking();
  const musc    = useMusculationRanking();
  const records = useRecordsRanking();

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

      {/* Records personnels */}
      {!records.loading && !records.error && records.groups.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
          className="space-y-6"
        >
          {/* Section header */}
          <div className="flex items-center gap-3">
            <div className="p-2 border border-[#c9a870]/30">
              <Trophy className="w-5 h-5 text-[#c9a870]" />
            </div>
            <div>
              <h2 className="font-rajdhani text-xl font-bold tracking-wide uppercase text-[#c9a870]">
                Records Personnels
              </h2>
              <p className="text-[#a3a3a3] text-xs">
                Classements par exercice · profils publics uniquement
              </p>
            </div>
          </div>

          {/* Musculation */}
          {records.groups.filter(g => g.category === 'musculation').length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Dumbbell className="w-4 h-4 text-[#c9a870]" />
                <h3 className="font-rajdhani font-bold text-sm tracking-widest uppercase text-[#c9a870]">Musculation</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {records.groups.filter(g => g.category === 'musculation').map(group => (
                  <RecordGroupCard key={`muscu-${group.title}`} group={group} currentUserId={currentUserId} />
                ))}
              </div>
            </div>
          )}

          {/* Course */}
          {records.groups.filter(g => g.category === 'course').length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <PersonStanding className="w-4 h-4 text-blue-400" />
                <h3 className="font-rajdhani font-bold text-sm tracking-widest uppercase text-blue-400">Course</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {records.groups.filter(g => g.category === 'course').map(group => (
                  <RecordGroupCard key={`course-${group.title}`} group={group} currentUserId={currentUserId} />
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
      {records.loading && (
        <div className="flex justify-center py-4">
          <Loader text="" />
        </div>
      )}

      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        className="text-center text-xs text-[#4a4a4a] pb-2"
      >
        Classements mis à jour en temps réel · Top 5 joueurs
      </motion.p>
    </div>
  );
}
