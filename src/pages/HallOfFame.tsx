import React, { useEffect, useState, useCallback } from 'react';
import { Crown, Flame, Dumbbell, PersonStanding, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase-client';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/common/Card';
import { Loader } from '../components/common/Loader';
import { formatDistance, formatNumber } from '../utils/calculations';

// ─── Types locaux ─────────────────────────────────────────────────────────────

type TabKey = 'top_xp' | 'top_running' | 'top_musculation';

interface XPEntry {
  id: string;
  username: string;
  total_xp: number;
  global_level: number;
  current_streak: number;
}

interface RunEntry {
  id: string;
  username: string;
  global_level: number;
  total_distance: number;
}

interface MusculationEntry {
  id: string;
  username: string;
  global_level: number;
  total_tonnage: number;
}

// ─── Helpers médailles ────────────────────────────────────────────────────────

function getMedalColor(rank: number): string {
  if (rank === 1) return 'text-yellow-400';
  if (rank === 2) return 'text-[#d4d4d4]';
  if (rank === 3) return 'text-amber-600';
  return 'text-[#6b6b6b]';
}

function getMedalBg(rank: number): string {
  if (rank === 1) return 'bg-transparent border-yellow-700/40';
  if (rank === 2) return 'bg-slate-400/10 border-slate-400/30';
  if (rank === 3) return 'bg-amber-600/10 border-amber-600/30';
  return 'bg-[#1c1c1c] border-white/8/40';
}

function getMedalLabel(rank: number): string {
  if (rank === 1) return '#1';
  if (rank === 2) return '#2';
  if (rank === 3) return '#3';
  return `#${rank}`;
}

// ─── Composant : Top 3 en podium ──────────────────────────────────────────────

interface PodiumCardProps {
  rank: number;
  username: string;
  level: number;
  value: React.ReactNode;
  valueLabel: string;
  isCurrentUser: boolean;
}

function PodiumCard({ rank, username, level, value, valueLabel, isCurrentUser }: PodiumCardProps) {
  const medalColor = getMedalColor(rank);
  const borderClass =
    rank === 1
      ? 'border-yellow-500/40 bg-yellow-500/5'
      : rank === 2
      ? 'border-slate-400/30 bg-slate-400/5'
      : 'border-amber-600/30 bg-amber-600/5';

  return (
    <div
      className={`relative flex flex-col items-center p-4 rounded border ${borderClass} ${
        isCurrentUser ? 'ring-2 ring-red-500/50' : ''
      }`}
    >
      {isCurrentUser && (
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-red-600 text-white px-2 py-0.5 rounded-full whitespace-nowrap">
          Vous
        </span>
      )}

      {/* Médaille */}
      <div
        className={`w-9 h-9 flex items-center justify-center rounded-full border ${getMedalBg(rank)} mb-2`}
      >
        <span className={`text-sm font-black ${medalColor}`}>{getMedalLabel(rank)}</span>
      </div>

      {/* Avatar initiale */}
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-black mb-2 ${
          rank === 1
            ? 'bg-transparent text-yellow-500'
            : rank === 2
            ? 'bg-slate-400/20 text-[#d4d4d4]'
            : 'bg-amber-600/20 text-amber-400'
        }`}
      >
        {username.charAt(0).toUpperCase()}
      </div>

      <p className="text-sm font-bold text-[#e5e5e5] truncate max-w-full">{username}</p>
      <p className="text-xs text-[#6b6b6b] mb-2">Niv. {level}</p>

      <p className={`text-base font-black ${medalColor}`}>{value}</p>
      <p className="text-xs text-[#6b6b6b]">{valueLabel}</p>
    </div>
  );
}

// ─── Composant : Ligne de classement (rang 4+) ────────────────────────────────

interface RankRowProps {
  rank: number;
  username: string;
  level: number;
  value: React.ReactNode;
  extra?: React.ReactNode;
  isCurrentUser: boolean;
  delay: number;
}

function RankRow({ rank, username, level, value, extra, isCurrentUser, delay }: RankRowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className={`flex items-center gap-3 px-4 py-3 rounded border transition-all ${
        isCurrentUser
          ? 'bg-transparent border-red-800/40 ring-1 ring-red-500/20'
          : 'bg-[#111111] border-white/8/40 hover:border-white/10/60 hover:bg-[#181818]'
      }`}
    >
      {/* Rang */}
      <span className="w-7 text-xs font-bold text-[#6b6b6b] text-center flex-shrink-0">
        {getMedalLabel(rank)}
      </span>

      {/* Initiale */}
      <div className="w-8 h-8 rounded-full bg-slate-700/60 flex items-center justify-center text-xs font-bold text-[#a3a3a3] flex-shrink-0">
        {username.charAt(0).toUpperCase()}
      </div>

      {/* Nom + niveau */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${isCurrentUser ? 'text-red-300' : 'text-[#e5e5e5]'}`}>
          {username}
          {isCurrentUser && (
            <span className="ml-2 text-[10px] font-bold bg-transparent text-red-300 px-1.5 py-0.5 rounded-md">
              Vous
            </span>
          )}
        </p>
        <p className="text-xs text-[#6b6b6b]">Niv. {level}</p>
      </div>

      {/* Valeur principale */}
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold text-[#e5e5e5]">{value}</p>
        {extra && <p className="text-xs text-[#6b6b6b]">{extra}</p>}
      </div>
    </motion.div>
  );
}

// ─── Onglet Top XP ────────────────────────────────────────────────────────────

interface TopXPTabProps {
  currentUserId: string | null;
}

function TopXPTab({ currentUserId }: TopXPTabProps) {
  const [entries, setEntries] = useState<XPEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    supabase
      .from('profiles')
      .select('id, username, total_xp, global_level, current_streak')
      .order('total_xp', { ascending: false })
      .limit(50)
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) {
          setError('Impossible de charger le classement XP.');
        } else {
          setEntries((data as XPEntry[]) ?? []);
        }
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  if (loading) return <Loader text="Chargement du classement..." />;
  if (error) {
    return (
      <Card className="p-6 text-center">
        <p className="text-sm text-red-400">{error}</p>
      </Card>
    );
  }
  if (entries.length === 0) {
    return (
      <Card className="p-10 text-center">
        <Crown className="w-12 h-12 mx-auto mb-3 text-[#4a4a4a]" />
        <p className="text-sm text-[#6b6b6b]">Aucun joueur dans le classement pour l'instant.</p>
      </Card>
    );
  }

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="space-y-4">
      {/* Podium */}
      <div className={`grid gap-3 ${top3.length === 1 ? 'grid-cols-1' : top3.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {top3.map((entry, i) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <PodiumCard
              rank={i + 1}
              username={entry.username}
              level={entry.global_level}
              value={<>{formatNumber(entry.total_xp)} <span className="text-xs font-semibold">XP</span></>}
              valueLabel="XP total"
              isCurrentUser={entry.id === currentUserId}
            />
          </motion.div>
        ))}
      </div>

      {/* Reste du classement */}
      {rest.length > 0 && (
        <div className="space-y-2">
          {rest.map((entry, i) => (
            <RankRow
              key={entry.id}
              rank={i + 4}
              username={entry.username}
              level={entry.global_level}
              value={`${formatNumber(entry.total_xp)} XP`}
              extra={
                entry.current_streak > 0
                  ? `${entry.current_streak}j de streak`
                  : undefined
              }
              isCurrentUser={entry.id === currentUserId}
              delay={0.04 * i}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Onglet Top Course ────────────────────────────────────────────────────────

interface TopRunningTabProps {
  currentUserId: string | null;
}

function TopRunningTab({ currentUserId }: TopRunningTabProps) {
  const [entries, setEntries] = useState<RunEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        // 1. Charger toutes les sessions de course (distance + user_id)
        const { data: sessions, error: sessErr } = await supabase
          .from('running_sessions')
          .select('user_id, distance');

        if (sessErr) throw sessErr;

        if (!sessions || sessions.length === 0) {
          if (!cancelled) { setEntries([]); setLoading(false); }
          return;
        }

        // 2. Grouper par user_id côté JS
        const totals: Record<string, number> = {};
        for (const row of sessions as { user_id: string; distance: number }[]) {
          totals[row.user_id] = (totals[row.user_id] ?? 0) + (row.distance ?? 0);
        }

        // 3. Trier et garder top 50
        const sorted = Object.entries(totals)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 50);

        if (sorted.length === 0) {
          if (!cancelled) { setEntries([]); setLoading(false); }
          return;
        }

        // 4. Charger les profils correspondants
        const userIds = sorted.map(([id]) => id);
        const { data: profiles, error: profErr } = await supabase
          .from('profiles')
          .select('id, username, global_level')
          .in('id', userIds);

        if (profErr) throw profErr;

        const profileMap: Record<string, { username: string; global_level: number }> = {};
        for (const p of (profiles as { id: string; username: string; global_level: number }[]) ?? []) {
          profileMap[p.id] = { username: p.username, global_level: p.global_level };
        }

        // 5. Assembler les entrées (ignorer les IDs sans profil)
        const result: RunEntry[] = sorted
          .filter(([id]) => profileMap[id])
          .map(([id, dist]) => ({
            id,
            username: profileMap[id].username,
            global_level: profileMap[id].global_level,
            total_distance: dist,
          }));

        if (!cancelled) { setEntries(result); setLoading(false); }
      } catch {
        if (!cancelled) { setError('Impossible de charger le classement course.'); setLoading(false); }
      }
    })();

    return () => { cancelled = true; };
  }, []);

  if (loading) return <Loader text="Calcul des distances..." />;
  if (error) {
    return (
      <Card className="p-6 text-center">
        <p className="text-sm text-red-400">{error}</p>
      </Card>
    );
  }
  if (entries.length === 0) {
    return (
      <Card className="p-10 text-center">
        <PersonStanding className="w-12 h-12 mx-auto mb-3 text-[#4a4a4a]" />
        <p className="text-sm text-[#6b6b6b]">Aucune course enregistrée pour le moment.</p>
      </Card>
    );
  }

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="space-y-4">
      <div className={`grid gap-3 ${top3.length === 1 ? 'grid-cols-1' : top3.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {top3.map((entry, i) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <PodiumCard
              rank={i + 1}
              username={entry.username}
              level={entry.global_level}
              value={formatDistance(entry.total_distance)}
              valueLabel="distance totale"
              isCurrentUser={entry.id === currentUserId}
            />
          </motion.div>
        ))}
      </div>

      {rest.length > 0 && (
        <div className="space-y-2">
          {rest.map((entry, i) => (
            <RankRow
              key={entry.id}
              rank={i + 4}
              username={entry.username}
              level={entry.global_level}
              value={formatDistance(entry.total_distance)}
              isCurrentUser={entry.id === currentUserId}
              delay={0.04 * i}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Onglet Top Musculation ───────────────────────────────────────────────────

interface TopMusculationTabProps {
  currentUserId: string | null;
}

function TopMusculationTab({ currentUserId }: TopMusculationTabProps) {
  const [entries, setEntries] = useState<MusculationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        // 1. Charger toutes les sessions muscu (tonnage + user_id)
        const { data: sessions, error: sessErr } = await supabase
          .from('workout_sessions')
          .select('user_id, total_tonnage');

        if (sessErr) throw sessErr;

        if (!sessions || sessions.length === 0) {
          if (!cancelled) { setEntries([]); setLoading(false); }
          return;
        }

        // 2. Grouper par user_id côté JS
        const totals: Record<string, number> = {};
        for (const row of sessions as { user_id: string; total_tonnage: number | null }[]) {
          totals[row.user_id] = (totals[row.user_id] ?? 0) + (row.total_tonnage ?? 0);
        }

        // 3. Trier et garder top 50
        const sorted = Object.entries(totals)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 50);

        if (sorted.length === 0) {
          if (!cancelled) { setEntries([]); setLoading(false); }
          return;
        }

        // 4. Charger les profils correspondants
        const userIds = sorted.map(([id]) => id);
        const { data: profiles, error: profErr } = await supabase
          .from('profiles')
          .select('id, username, global_level')
          .in('id', userIds);

        if (profErr) throw profErr;

        const profileMap: Record<string, { username: string; global_level: number }> = {};
        for (const p of (profiles as { id: string; username: string; global_level: number }[]) ?? []) {
          profileMap[p.id] = { username: p.username, global_level: p.global_level };
        }

        // 5. Assembler les entrées
        const result: MusculationEntry[] = sorted
          .filter(([id]) => profileMap[id])
          .map(([id, tonnage]) => ({
            id,
            username: profileMap[id].username,
            global_level: profileMap[id].global_level,
            total_tonnage: tonnage,
          }));

        if (!cancelled) { setEntries(result); setLoading(false); }
      } catch {
        if (!cancelled) { setError('Impossible de charger le classement musculation.'); setLoading(false); }
      }
    })();

    return () => { cancelled = true; };
  }, []);

  if (loading) return <Loader text="Calcul des tonnages..." />;
  if (error) {
    return (
      <Card className="p-6 text-center">
        <p className="text-sm text-red-400">{error}</p>
      </Card>
    );
  }
  if (entries.length === 0) {
    return (
      <Card className="p-10 text-center">
        <Dumbbell className="w-12 h-12 mx-auto mb-3 text-[#4a4a4a]" />
        <p className="text-sm text-[#6b6b6b]">Aucune séance enregistrée pour le moment.</p>
      </Card>
    );
  }

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  /** Formater le tonnage : "12 450 kg" */
  const formatTonnage = (kg: number): string =>
    `${formatNumber(Math.round(kg))} kg`;

  return (
    <div className="space-y-4">
      <div className={`grid gap-3 ${top3.length === 1 ? 'grid-cols-1' : top3.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {top3.map((entry, i) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <PodiumCard
              rank={i + 1}
              username={entry.username}
              level={entry.global_level}
              value={formatTonnage(entry.total_tonnage)}
              valueLabel="tonnage total"
              isCurrentUser={entry.id === currentUserId}
            />
          </motion.div>
        ))}
      </div>

      {rest.length > 0 && (
        <div className="space-y-2">
          {rest.map((entry, i) => (
            <RankRow
              key={entry.id}
              rank={i + 4}
              username={entry.username}
              level={entry.global_level}
              value={formatTonnage(entry.total_tonnage)}
              isCurrentUser={entry.id === currentUserId}
              delay={0.04 * i}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'top_xp',          label: 'Top XP',     icon: <Star className="w-3.5 h-3.5" /> },
  { key: 'top_running',     label: 'Top Course',  icon: <PersonStanding className="w-3.5 h-3.5" /> },
  { key: 'top_musculation', label: 'Top Muscu',   icon: <Dumbbell className="w-3.5 h-3.5" /> },
];

// Track which tabs have already been mounted so we don't re-fetch on re-select
const loadedTabs = new Set<TabKey>();

export function HallOfFamePage() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('top_xp');
  // Keep track of which tabs have been activated (for lazy mounting)
  const [mountedTabs, setMountedTabs] = useState<Set<TabKey>>(() => new Set<TabKey>(['top_xp']));

  const handleTabChange = useCallback((tab: TabKey) => {
    setActiveTab(tab);
    setMountedTabs((prev) => {
      if (prev.has(tab)) return prev;
      const next = new Set(prev);
      next.add(tab);
      return next;
    });
  }, []);

  const currentUserId = profile?.id ?? null;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="p-2.5 rounded bg-transparent border border-yellow-700/50">
          <Crown className="w-6 h-6 text-yellow-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">Hall of Fame</h1>
          <p className="text-[#a3a3a3] text-sm mt-0.5">Classements et légendes</p>
        </div>
      </motion.div>

      {/* ── Onglets ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        <div className="flex gap-1 p-1 bg-[#111111] border border-white/5 rounded">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded text-xs font-semibold transition-all ${
                activeTab === tab.key
                  ? 'bg-transparent text-yellow-500 border border-yellow-500/30 shadow'
                  : 'text-[#a3a3a3] hover:text-[#e5e5e5] hover:bg-[#1c1c1c]'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[1] ?? tab.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── Contenu ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          {/* Lazy mount : monter chaque onglet une seule fois, cacher les autres */}
          <div className={activeTab === 'top_xp' ? 'block' : 'hidden'}>
            {mountedTabs.has('top_xp') && (
              <TopXPTab currentUserId={currentUserId} />
            )}
          </div>

          <div className={activeTab === 'top_running' ? 'block' : 'hidden'}>
            {mountedTabs.has('top_running') && (
              <TopRunningTab currentUserId={currentUserId} />
            )}
          </div>

          <div className={activeTab === 'top_musculation' ? 'block' : 'hidden'}>
            {mountedTabs.has('top_musculation') && (
              <TopMusculationTab currentUserId={currentUserId} />
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── Note de bas de page ── */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center text-xs text-[#4a4a4a] pb-2"
      >
        Classements mis a jour en temps reel - Top 50 joueurs
      </motion.p>
    </div>
  );
}
