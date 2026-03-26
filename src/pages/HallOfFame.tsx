import React, { useEffect, useState, useMemo } from 'react';
import { Crown, Dumbbell, PersonStanding, Star, Trophy, Zap, Plus, X, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase-client';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/common/Card';
import { Loader } from '../components/common/Loader';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { profileRecordsService } from '../services/profile-records.service';
import { feedService } from '../services/feed.service';
import { formatDistance, formatNumber, formatDuration } from '../utils/calculations';
import { MusculationPickerContent, CalisthenicsPickerContent, RunningRacePicker } from '../components/forms/ExercisePicker';
import { CrossfitExercisePickerContent } from '../components/forms/CrossfitExercisePicker';

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
  category: 'musculation' | 'course' | 'calisthenics' | 'crossfit';
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
    if (parts.length === 3)
      return (parseFloat(parts[0]) || 0) * 3600 + (parseFloat(parts[1]) || 0) * 60 + (parseFloat(parts[2]) || 0);
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

      <ol className="flex flex-col divide-y divide-white/5" role="list">
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
            <li key={entry.id} className="list-none">
            <motion.div
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
            </li>
          );
        })}
      </ol>
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
    (supabase as any).rpc('get_running_leaderboard').then(({ data, error: err }: any) => {
      if (cancelled) return;
      if (err) { setError('Erreur chargement course'); }
      else {
        setEntries((data ?? []).map((r: any) => ({
          id: r.user_id, username: r.username, level: r.global_level,
          value: r.total_distance, avatar_url: r.avatar_url ?? null,
        })));
      }
      setLoading(false);
    });
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
    (supabase as any).rpc('get_workout_leaderboard').then(({ data, error: err }: any) => {
      if (cancelled) return;
      if (err) { setError('Erreur chargement muscu'); }
      else {
        setEntries((data ?? []).map((r: any) => ({
          id: r.user_id, username: r.username, level: r.global_level,
          value: r.total_tonnage, avatar_url: r.avatar_url ?? null,
        })));
      }
      setLoading(false);
    });
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
            {group.category === 'course' ? '↓ meilleur temps' : '↑ meilleur record'}
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
                  {group.category === 'course'
                    ? formatDuration(entry.numericValue, true)
                    : entry.value}
                </p>
                <p className="text-xs text-[#6b6b6b]">
                  {group.category === 'course' ? 'temps' : group.unit}
                </p>
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
        const { data: records, error: err } = await (supabase as any)
          .from('profile_records')
          .select('id, user_id, title, value, unit, category, profiles!inner(username, global_level, avatar_url)')
          .order('title');
        if (err) throw err;

        const groupMap: Record<string, { title: string; unit: string; category: 'musculation' | 'course' | 'calisthenics' | 'crossfit'; entries: RecordEntry[] }> = {};

        for (const rec of (records ?? []) as any[]) {
          const cat: 'musculation' | 'course' | 'calisthenics' | 'crossfit' =
            rec.category === 'course' ? 'course'
            : rec.category === 'calisthenics' ? 'calisthenics'
            : rec.category === 'crossfit' ? 'crossfit'
            : 'musculation';
          const key = `${cat}::${rec.title.trim().toLowerCase()}`;
          if (!groupMap[key]) {
            groupMap[key] = { title: rec.title.trim(), unit: rec.unit, category: cat, entries: [] };
          }

          const prof = rec.profiles;
          if (!prof?.username) continue;

          const numericValue = parseRecordValue(String(rec.value));
          const ascending = cat === 'course';
          const existing = groupMap[key].entries.find(e => e.user_id === rec.user_id);

          if (existing) {
            if (ascending ? numericValue < existing.numericValue : numericValue > existing.numericValue) {
              existing.value = String(rec.value);
              existing.numericValue = numericValue;
            }
          } else {
            groupMap[key].entries.push({
              recordId: rec.id,
              user_id: rec.user_id,
              username: prof.username,
              level: prof.global_level,
              avatar_url: prof.avatar_url ?? null,
              value: String(rec.value),
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

// ─── Confetti PR ──────────────────────────────────────────────────────────────

function PRConfetti({ active }: { active: boolean }) {
  const COLORS = ['#c9a870', '#f59e0b', '#fcd34d', '#fbbf24', '#ffffff', '#d97706'];
  const particles = useMemo(() =>
    Array.from({ length: 50 }, (_, i) => ({
      left: Math.random() * 100,
      rotate: Math.random() * 720 - 360,
      x: (Math.random() - 0.5) * 300,
      duration: 1.8 + Math.random() * 1.8,
      delay: Math.random() * 0.6,
      color: COLORS[i % COLORS.length],
      size: 4 + Math.random() * 7,
    })),
  []);

  if (!active) return null;
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-[300]">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-sm"
          style={{ backgroundColor: p.color, left: `${p.left}%`, top: '-20px', width: p.size, height: p.size }}
          animate={{ y: ['0vh', '110vh'], rotate: [0, p.rotate], x: [0, p.x] }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
        />
      ))}
    </div>
  );
}

// ─── Bandeau PR ───────────────────────────────────────────────────────────────

function PRBanner({ onOpen }: { onOpen: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      onClick={onOpen}
      className="relative overflow-hidden border border-yellow-600/50 cursor-pointer group"
    >
      {/* Fond doré */}
      <div className="absolute inset-0 bg-gradient-to-r from-yellow-950/60 via-[#1a1200]/50 to-yellow-950/60" />

      {/* Shimmer animé */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/10 to-transparent"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
      />

      {/* Couronnes décoratives */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-8 pointer-events-none">
        <Crown className="w-20 h-20 text-yellow-400" />
      </div>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-8 pointer-events-none scale-x-[-1]">
        <Crown className="w-20 h-20 text-yellow-400" />
      </div>

      {/* Contenu */}
      <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4 px-8 py-6">
        <div className="flex items-center gap-5">
          <motion.div
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="flex-shrink-0"
          >
            <Trophy className="w-12 h-12 text-yellow-400 drop-shadow-lg" />
          </motion.div>
          <div className="text-center sm:text-left">
            <p className="font-rajdhani font-black text-xl sm:text-2xl uppercase tracking-widest text-yellow-400 leading-tight">
              Enregistrer un Record Personnel
            </p>
            <p className="text-sm text-[#a3a3a3] mt-1">
              Tu viens de battre un record ? Immortalise-le et entre dans la légende.
            </p>
          </div>
        </div>
        <div className="flex-shrink-0">
          <div className="flex items-center gap-2 px-6 py-3 border border-yellow-500/60 bg-yellow-500/10 text-yellow-300 font-rajdhani font-bold text-sm uppercase tracking-wider group-hover:bg-yellow-500/20 group-hover:border-yellow-400/70 transition-all">
            <Plus className="w-4 h-4" />
            Nouveau PR
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Modal PR ──────────────────────────────────────────────────────────────────

interface PRModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}

function PRModal({ isOpen, onClose, onSuccess, userId }: PRModalProps) {
  const [category, setCategory] = useState<'musculation' | 'course' | 'calisthenics' | 'crossfit'>('musculation');
  const [title, setTitle] = useState('');
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState<'kg' | 'reps' | 's' | 'kg lestés'>('kg');
  const [distance, setDistance] = useState('');
  const [caliWeightKg, setCaliWeightKg] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function reset() {
    setCategory('musculation'); setTitle(''); setValue('');
    setUnit('kg'); setDistance(''); setCaliWeightKg(''); setError(null); setSuccess(false);
  }

  function handleClose() { reset(); onClose(); }

  async function handleSubmit() {
    if (!title.trim()) { setError('Le nom de l\'exercice est requis.'); return; }
    if (!value.trim()) { setError('La valeur est requise.'); return; }
    if (category === 'course' && !distance.trim()) { setError('La distance est requise.'); return; }
    const num = parseFloat(value.replace(',', '.'));
    if (isNaN(num) || num <= 0) { setError('Valeur numérique invalide.'); return; }

    const weightNum = caliWeightKg.trim() ? parseFloat(caliWeightKg.replace(',', '.')) : 0;
    const caliUnit = category === 'calisthenics' && unit === 'reps' && weightNum > 0
      ? `reps — ${weightNum} kg lestés`
      : unit;
    const finalUnit = category === 'course' ? `${distance.trim()} km` : caliUnit;
    const ascending = category === 'course';

    setSaving(true); setError(null);
    try {
      await profileRecordsService.upsertRecord(userId, title.trim(), num, finalUnit, category, ascending);
      await feedService.publishPersonalRecord(userId, title.trim(), value.trim(), finalUnit, category);
      setSuccess(true);
      onSuccess();
      setTimeout(() => { handleClose(); }, 2800);
    } catch {
      setError('Erreur lors de l\'enregistrement. Réessaie.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="" size="md">
      <AnimatePresence mode="wait">
        {success ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 flex flex-col items-center text-center gap-4"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.6 }}
            >
              <Trophy className="w-16 h-16 text-yellow-400" />
            </motion.div>
            <p className="font-rajdhani font-black text-2xl uppercase tracking-widest text-yellow-400">
              LÉGENDE !
            </p>
            <p className="text-[#a3a3a3] text-sm">
              Ton record a été enregistré et publié dans le feed. Continue comme ça.
            </p>
          </motion.div>
        ) : (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-5 space-y-4">
            {/* En-tête festif */}
            <div className="flex items-center gap-3 pb-3 border-b border-yellow-600/20">
              <Trophy className="w-6 h-6 text-yellow-400 flex-shrink-0" />
              <div>
                <p className="font-rajdhani font-black text-lg uppercase tracking-widest text-yellow-400">
                  Nouveau Record Personnel
                </p>
                <p className="text-xs text-[#6b6b6b]">Publié dans le <strong>feed</strong> · Mis à jour dans ton <em>profil</em></p>
              </div>
            </div>

            {/* Sélecteur catégorie */}
            <div className="flex rounded overflow-hidden border border-white/10">
              {([
                { id: 'musculation', label: 'Muscu', icon: <Dumbbell className="w-3.5 h-3.5" />, active: 'bg-yellow-500/15 text-yellow-400' },
                { id: 'course', label: 'Course', icon: <PersonStanding className="w-3.5 h-3.5" />, active: 'bg-blue-500/15 text-blue-400' },
                { id: 'calisthenics', label: 'Cali', icon: <Zap className="w-3.5 h-3.5" />, active: 'bg-violet-500/15 text-violet-400' },
                { id: 'crossfit', label: 'Crossfit', icon: <Flame className="w-3.5 h-3.5" />, active: 'bg-orange-500/15 text-orange-400' },
              ] as const).map((cat, idx) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => { setCategory(cat.id); setUnit(cat.id === 'calisthenics' ? 'reps' : 'kg'); setCaliWeightKg(''); setError(null); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${idx > 0 ? 'border-l border-white/10' : ''} ${category === cat.id ? cat.active : 'text-[#6b6b6b] hover:text-[#d4d4d4]'}`}
                >
                  {cat.icon}
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Champs muscu */}
            {category === 'musculation' && (
              <>
                <div>
                  <p className="text-xs text-[#a3a3a3] uppercase tracking-wide font-medium mb-2">Exercice</p>
                  {title && <p className="text-sm font-semibold text-yellow-400 mb-2">{title}</p>}
                  <MusculationPickerContent selected={title} onSelect={t => { setTitle(t); setError(null); }} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Valeur" value={value} onChange={e => { setValue(e.target.value); setError(null); }} placeholder="ex: 120" maxLength={10} />
                  <div>
                    <p className="text-xs text-[#a3a3a3] uppercase tracking-wide font-medium mb-1.5">Unité</p>
                    <div className="flex rounded overflow-hidden border border-white/10 h-10">
                      {(['kg', 'reps'] as const).map((u, i) => (
                        <button key={u} type="button" onClick={() => setUnit(u)}
                          className={`flex-1 text-sm font-medium transition-colors ${i > 0 ? 'border-l border-white/10' : ''} ${unit === u ? 'bg-yellow-500/15 text-yellow-400' : 'text-[#6b6b6b] hover:text-[#d4d4d4]'}`}>
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Champs course */}
            {category === 'course' && (
              <>
                <RunningRacePicker
                  value={title}
                  onChange={(t, km) => { setTitle(t); setDistance(String(km)); setError(null); }}
                />
                <Input label="Durée" value={value} onChange={e => { setValue(e.target.value); setError(null); }} placeholder="ex: 22:30 ou 1:45:00" maxLength={20} />
              </>
            )}

            {/* Champs cali */}
            {category === 'calisthenics' && (
              <>
                <div>
                  <p className="text-xs text-[#a3a3a3] uppercase tracking-wide font-medium mb-2">Exercice</p>
                  {title && <p className="text-sm font-semibold text-violet-400 mb-2">{title}</p>}
                  <CalisthenicsPickerContent selected={title} onSelect={t => { setTitle(t); setError(null); }} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Valeur" value={value} onChange={e => { setValue(e.target.value); setError(null); }} placeholder="ex: 25 ou 60" maxLength={10} />
                  <div>
                    <p className="text-xs text-[#a3a3a3] uppercase tracking-wide font-medium mb-1.5">Unité</p>
                    <div className="flex rounded overflow-hidden border border-white/10 h-10">
                      {(['reps', 's', 'kg lestés'] as const).map((u, i) => (
                        <button key={u} type="button" onClick={() => { setUnit(u); if (u !== 'reps') setCaliWeightKg(''); }}
                          className={`flex-1 text-xs font-medium transition-colors ${i > 0 ? 'border-l border-white/10' : ''} ${unit === u ? 'bg-violet-500/15 text-violet-400' : 'text-[#6b6b6b] hover:text-[#d4d4d4]'}`}>
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Poids lesté optionnel quand unit = reps */}
                {unit === 'reps' && (
                  <div>
                    <p className="text-xs text-[#a3a3a3] uppercase tracking-wide font-medium mb-1.5">
                      Poids lesté <span className="normal-case text-[#5a5a5a]">(optionnel)</span>
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={caliWeightKg}
                        onChange={e => setCaliWeightKg(e.target.value)}
                        placeholder="ex: 10"
                        className="w-24 bg-[#1a1a1a] border border-violet-500/30 rounded px-3 py-2 text-sm text-violet-300 placeholder-[#4a4a4a] focus:outline-none focus:border-violet-400/60"
                      />
                      <span className="text-sm text-violet-400/60">kg lestés</span>
                      {caliWeightKg && value && (
                        <span className="text-xs text-[#6b6b6b] ml-auto">
                          → {value} reps — {caliWeightKg} kg lestés
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Champs crossfit */}
            {category === 'crossfit' && (
              <>
                <div>
                  <p className="text-xs text-[#a3a3a3] uppercase tracking-wide font-medium mb-2">Exercice</p>
                  {title && <p className="text-sm font-semibold text-orange-400 mb-2">{title}</p>}
                  <CrossfitExercisePickerContent selected={title} onSelect={t => { setTitle(t); setError(null); }} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Valeur" value={value} onChange={e => { setValue(e.target.value); setError(null); }} placeholder="ex: 100 ou 20" maxLength={10} />
                  <div>
                    <p className="text-xs text-[#a3a3a3] uppercase tracking-wide font-medium mb-1.5">Unité</p>
                    <div className="flex rounded overflow-hidden border border-white/10 h-10">
                      {(['kg', 'reps'] as const).map((u, i) => (
                        <button key={u} type="button" onClick={() => setUnit(u)}
                          className={`flex-1 text-sm font-medium transition-colors ${i > 0 ? 'border-l border-white/10' : ''} ${unit === u ? 'bg-orange-500/15 text-orange-400' : 'text-[#6b6b6b] hover:text-[#d4d4d4]'}`}>
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {error && <p className="text-xs text-red-400">{error}</p>}

            <div className="flex gap-3 pt-1">
              <Button variant="ghost" className="flex-1" onClick={handleClose} disabled={saving}>Annuler</Button>
              <Button
                loading={saving}
                className="flex-1 bg-yellow-600/20 border-yellow-600/50 text-yellow-300 hover:bg-yellow-600/30 hover:border-yellow-500/70"
                onClick={handleSubmit}
              >
                <Trophy className="w-4 h-4" />
                Enregistrer mon PR
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function HallOfFamePage() {
  const { profile } = useAuth();
  const currentUserId = profile?.id ?? null;

  const [prModalOpen, setPrModalOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const xp      = useXPRanking();
  const run     = useRunningRanking();
  const musc    = useMusculationRanking();
  const records = useRecordsRanking();

  function handlePRSuccess() {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3500);
  }

  return (
    <div className="space-y-6">
      <PRConfetti active={showConfetti} />
      <PRModal
        isOpen={prModalOpen}
        onClose={() => setPrModalOpen(false)}
        onSuccess={handlePRSuccess}
        userId={profile?.id ?? ''}
      />

      {/* Header — vitrine trophée */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden -mx-4 px-6 py-8 sm:mx-0 sm:px-8"
        style={{ background: 'linear-gradient(135deg, #0a0700 0%, #111005 40%, #0a0700 100%)' }}
      >
        {/* Bordures dorées */}
        <div className="absolute inset-0 border-y border-[#c9a870]/20 pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9a870]/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9a870]/30 to-transparent" />

        {/* Trophées décoratifs en arrière-plan */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-[0.04] pointer-events-none select-none">
          <Trophy className="w-40 h-40 text-[#c9a870]" />
        </div>
        <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none select-none">
          <Crown className="w-24 h-24 text-[#c9a870]" />
        </div>

        {/* Contenu */}
        <div className="relative flex flex-col items-center text-center gap-3">
          {/* Couronne */}
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
            className="flex items-center justify-center w-14 h-14 border-2 border-[#c9a870]/40 bg-[#c9a870]/5"
          >
            <Crown className="w-7 h-7 text-[#c9a870]" />
          </motion.div>

          {/* Titre */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h1
              className="font-rajdhani font-black uppercase leading-none tracking-[0.25em]"
              style={{
                fontSize: 'clamp(2rem, 8vw, 4rem)',
                background: 'linear-gradient(180deg, #f5d990 0%, #c9a870 45%, #8b6f47 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textShadow: 'none',
              }}
            >
              Hall of Fame
            </h1>
            <div className="flex items-center justify-center gap-3 mt-2">
              <div className="h-px flex-1 max-w-[60px] bg-gradient-to-r from-transparent to-[#c9a870]/40" />
              <p className="text-[10px] text-[#8b6f47] uppercase tracking-[0.3em] font-rajdhani font-bold">
                Les légendes de la troupe
              </p>
              <div className="h-px flex-1 max-w-[60px] bg-gradient-to-l from-transparent to-[#c9a870]/40" />
            </div>
          </motion.div>

          {/* Stats rapides */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="flex items-center gap-4 text-[10px] text-[#5a5a5a] uppercase tracking-widest font-rajdhani"
          >
            <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-600/60" /> XP</span>
            <span className="text-[#3a3a3a]">·</span>
            <span className="flex items-center gap-1"><Dumbbell className="w-3 h-3 text-red-700/60" /> Musculation</span>
            <span className="text-[#3a3a3a]">·</span>
            <span className="flex items-center gap-1"><PersonStanding className="w-3 h-3 text-blue-700/60" /> Course</span>
            <span className="text-[#3a3a3a]">·</span>
            <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-violet-700/60" /> Calisthénie</span>
            <span className="text-[#3a3a3a]">·</span>
            <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-700/60" /> Crossfit</span>
          </motion.div>
        </div>
      </motion.div>

      {/* Navigation ancres */}
      <nav aria-label="Navigation intra-page" className="flex items-center gap-3 flex-wrap text-xs font-rajdhani font-bold uppercase tracking-widest">
        <a href="#classements" className="text-[#c9a870]/70 hover:text-[#c9a870] transition-colors">Classements</a>
        <span className="text-[#3a3a3a]">·</span>
        <a href="#records" className="text-[#c9a870]/70 hover:text-[#c9a870] transition-colors">Records</a>
      </nav>

      {/* Bandeau PR */}
      <PRBanner onOpen={() => setPrModalOpen(true)} />

      {/* 3 colonnes */}
      <section id="classements" aria-label="Classements">
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
      </section>

      {/* Records personnels */}
      {!records.loading && !records.error && records.groups.length > 0 && (
        <section id="records" aria-label="Records personnels">
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
                Classements par exercice · tous les joueurs
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

          {/* Calisthénie */}
          {records.groups.filter(g => g.category === 'calisthenics').length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-violet-400" />
                <h3 className="font-rajdhani font-bold text-sm tracking-widest uppercase text-violet-400">Calisthénie</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {records.groups.filter(g => g.category === 'calisthenics').map(group => (
                  <RecordGroupCard key={`cali-${group.title}`} group={group} currentUserId={currentUserId} />
                ))}
              </div>
            </div>
          )}

          {/* Crossfit */}
          {records.groups.filter(g => g.category === 'crossfit').length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Flame className="w-4 h-4 text-orange-400" />
                <h3 className="font-rajdhani font-bold text-sm tracking-widest uppercase text-orange-400">Crossfit</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {records.groups.filter(g => g.category === 'crossfit').map(group => (
                  <RecordGroupCard key={`crossfit-${group.title}`} group={group} currentUserId={currentUserId} />
                ))}
              </div>
            </div>
          )}
        </motion.div>
        </section>
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
