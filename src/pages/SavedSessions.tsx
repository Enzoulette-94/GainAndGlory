import React, { useState, useEffect } from 'react';
import { Bookmark, Dumbbell, PersonStanding, Zap, Flame, Trash2, ChevronDown, ChevronUp, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { savedSessionsService, type SavedSession } from '../services/saved-sessions.service';
import { workoutService } from '../services/workout.service';
import { Card } from '../components/common/Card';
import { Loader } from '../components/common/Loader';
import { formatDate } from '../utils/calculations';

type Tab = 'workout' | 'run' | 'calisthenics' | 'crossfit';

const TABS: { id: Tab; label: string; icon: React.ReactNode; color: string; border: string }[] = [
  { id: 'workout',      label: 'Musculation', icon: <Dumbbell className="w-4 h-4" />,        color: 'text-red-400',    border: 'border-red-700/50'    },
  { id: 'run',          label: 'Course',      icon: <PersonStanding className="w-4 h-4" />,   color: 'text-blue-400',   border: 'border-blue-700/50'   },
  { id: 'calisthenics', label: 'Calisthénie', icon: <Zap className="w-4 h-4" />,              color: 'text-violet-400', border: 'border-violet-700/50' },
  { id: 'crossfit',     label: 'Crossfit',    icon: <Flame className="w-4 h-4" />,            color: 'text-orange-400', border: 'border-orange-700/50' },
];

const TYPE_CONFIG = {
  workout: {
    label: 'SÉANCE MUSCU',
    borderColor: 'border-l-red-800/70',
    bgGradient: 'bg-gradient-to-br from-red-950/30 via-[#111] to-[#111]',
    accentClass: 'text-red-400',
    dimClass: 'text-red-700',
    borderClass: 'border-red-700/50',
    rowBorder: 'border-white/5',
    rowBg: 'bg-white/[0.02]',
    icon: '💪',
  },
  run: {
    label: 'COURSE',
    borderColor: 'border-l-blue-800/70',
    bgGradient: 'bg-gradient-to-br from-blue-950/30 via-[#111] to-[#111]',
    accentClass: 'text-blue-400',
    dimClass: 'text-blue-700',
    borderClass: 'border-blue-700/50',
    rowBorder: 'border-white/5',
    rowBg: 'bg-white/[0.02]',
    icon: '🏃',
  },
  calisthenics: {
    label: 'CALISTHÉNIE',
    borderColor: 'border-l-violet-800/70',
    bgGradient: 'bg-gradient-to-br from-violet-950/30 via-[#111] to-[#111]',
    accentClass: 'text-violet-400',
    dimClass: 'text-violet-700',
    borderClass: 'border-violet-700/50',
    rowBorder: 'border-violet-900/30',
    rowBg: 'bg-violet-900/10',
    icon: '⚡',
  },
  crossfit: {
    label: 'CROSSFIT',
    borderColor: 'border-l-orange-800/70',
    bgGradient: 'bg-gradient-to-br from-orange-950/30 via-[#111] to-[#111]',
    accentClass: 'text-orange-400',
    dimClass: 'text-orange-700',
    borderClass: 'border-orange-700/50',
    rowBorder: 'border-white/5',
    rowBg: 'bg-white/[0.02]',
    icon: '🔥',
  },
} as const;

function fmtDuration(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${m} min`;
}

function fmtPace(distKm: number, durSec: number) {
  if (!distKm || !durSec) return '—';
  const p = durSec / 60 / distKm;
  return `${Math.floor(p)}:${String(Math.round((p % 1) * 60)).padStart(2, '0')}/km`;
}

function SessionCard({ session, onDelete }: { session: SavedSession; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [copying, setCopying] = useState(false);
  const navigate = useNavigate();

  const cfg = TYPE_CONFIG[session.type];
  const name = session.custom_name ?? session.original_name ?? null;

  // Compute metrics per type
  let m1Label = '', m1Value = '—';
  let m2Label = 'EXERCICES', m2Value = String(session.exercises.length);
  let m3Label = '', m3Value = '—';

  if (session.type === 'workout') {
    const tonnage = session.exercises.reduce((s, ex) => s + (ex.maxWeight ?? 0) * (ex.reps || 0), 0);
    m1Label = 'TONNAGE'; m1Value = tonnage > 0 ? `${Math.round(tonnage)} kg` : '—';
    m3Label = 'SÉRIES';  m3Value = String(session.exercises.reduce((s, ex) => s + (ex.sets || 0), 0));
  } else if (session.type === 'run') {
    const ex = session.exercises[0];
    m1Label = 'DISTANCE'; m1Value = ex?.distance != null ? `${ex.distance} km` : '—';
    m2Label = 'DURÉE';    m2Value = ex?.duration != null ? fmtDuration(ex.duration) : '—';
    m3Label = 'ALLURE';   m3Value = (ex?.distance && ex?.duration) ? fmtPace(ex.distance, ex.duration) : '—';
  } else if (session.type === 'calisthenics') {
    const totalReps = session.exercises.reduce((s, ex) => s + (ex.reps || 0), 0);
    m1Label = 'REPS TOTAL'; m1Value = totalReps > 0 ? String(totalReps) : '—';
    m3Label = 'SÉRIES';     m3Value = String(session.exercises.reduce((s, ex) => s + (ex.sets || 0), 0));
  } else if (session.type === 'crossfit') {
    const maxW = Math.max(...session.exercises.map(ex => ex.maxWeight ?? 0), 0);
    const totalReps = session.exercises.reduce((s, ex) => s + (ex.reps || 0), 0);
    m1Label = 'CHARGE MAX';  m1Value = maxW > 0 ? `${maxW} kg` : '—';
    m3Label = 'TOTAL REPS';  m3Value = totalReps > 0 ? String(totalReps) : '—';
  }

  async function handleCopy() {
    if (copying) return;
    setCopying(true);
    try {
      if (session.type === 'calisthenics') {
        const exercises = session.exercises.map(ex => ({
          name: ex.name,
          set_type: 'reps' as const,
          sets: Array.from({ length: ex.sets || 1 }, () => ({
            reps: ex.sets > 0 ? Math.round(ex.reps / ex.sets) : ex.reps,
            hold_seconds: null,
          })),
        }));
        navigate('/calisthenics/new', { state: { copyFrom: { name: session.custom_name ?? session.original_name ?? null, date: new Date().toISOString(), exercises } } });
      } else if (session.type === 'crossfit') {
        navigate('/crossfit/new', {
          state: {
            copyFrom: {
              name: session.custom_name ?? session.original_name ?? null,
              wod_type: 'for_time' as const,
              total_duration: null, round_duration: null, target_rounds: null,
              result_time: null, result_reps: null, result_rounds: null,
              benchmark_name: null,
              exercises: session.exercises.map(ex => ({
                name: ex.name,
                reps: ex.reps || null,
                weight: ex.maxWeight ?? null,
                duration: null,
                notes: null,
              })),
            },
          },
        });
      } else if (session.type === 'workout') {
        const allExercises = await workoutService.getExercises();
        const sets = session.exercises.flatMap((ex, ei) => {
          const found = allExercises.find(e => e.name === ex.name);
          if (!found) return [];
          return Array.from({ length: ex.sets || 1 }, (_, i) => ({
            id: Math.random().toString(36).slice(2),
            exercise_id: found.id,
            exercise: found,
            set_number: i + 1,
            reps: ex.sets > 0 ? Math.round(ex.reps / ex.sets) : ex.reps,
            weight: ex.maxWeight ?? 0,
            rest_time: null,
          }));
        });
        navigate('/musculation/new', { state: { copyFrom: { name: session.custom_name ?? session.original_name ?? null, sets } } });
      }
    } finally {
      setCopying(false);
    }
  }

  const visibleExercises = expanded ? session.exercises : session.exercises.slice(0, 3);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`border-l-4 ${cfg.borderColor} ${cfg.bgGradient} border border-white/5 border-l-0`}
    >
      {/* Bandeau type */}
      <div className={`px-4 py-2 border-b border-white/5 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <span className="text-sm">{cfg.icon}</span>
          <span className={`text-[10px] font-rajdhani font-bold tracking-widest uppercase ${cfg.accentClass}`}>
            {cfg.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              className="text-[#4a4a4a] hover:text-red-400 transition-colors p-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <button
                onClick={onDelete}
                className="text-xs font-rajdhani font-bold text-red-400 border border-red-700/50 px-2 py-0.5 hover:bg-red-900/20 transition-colors"
              >
                Oui
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="text-xs font-rajdhani font-bold text-[#6b6b6b] border border-white/10 px-2 py-0.5 hover:bg-white/5 transition-colors"
              >
                Non
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Titre + date */}
      <div className="px-4 pt-3 pb-2">
        {name && (
          <p className="font-rajdhani font-bold text-[#f5f5f5] text-base tracking-wide uppercase leading-tight">
            {name}
          </p>
        )}
        <p className="text-[10px] text-[#6b6b6b] mt-0.5">
          {session.source_username && (
            <span className="text-[#a3a3a3]">enregistré depuis {session.source_username} · </span>
          )}
          {formatDate(session.saved_at, { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </div>

      {/* Métriques */}
      <div className="grid grid-cols-3 gap-px border-t border-b border-white/5 mx-0">
        {[
          { label: m1Label, value: m1Value },
          { label: m2Label, value: m2Value },
          { label: m3Label, value: m3Value },
        ].map((m, i) => (
          <div key={i} className="px-3 py-2.5 text-center">
            <p className={`font-rajdhani font-bold text-base leading-none truncate ${cfg.accentClass}`}>{m.value}</p>
            <p className="text-[9px] text-[#6b6b6b] uppercase tracking-widest mt-0.5 truncate">{m.label || '\u00A0'}</p>
          </div>
        ))}
      </div>

      {/* Exercices */}
      <AnimatePresence initial={false}>
        <div className="divide-y divide-white/5">
          {visibleExercises.map((ex, i) => (
            <motion.div
              key={i}
              initial={expanded && i >= 3 ? { opacity: 0, height: 0 } : false}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`flex items-baseline gap-2 px-4 py-2 ${cfg.rowBg}`}
            >
              <span className={`text-[10px] font-rajdhani font-bold w-4 text-right flex-shrink-0 ${cfg.dimClass}`}>
                {i + 1}
              </span>
              <span className="text-xs text-[#d4d4d4] font-medium flex-1 min-w-0 truncate">{ex.name}</span>
              <span className={`text-xs font-rajdhani font-bold flex-shrink-0 ${cfg.accentClass}`}>
                {session.type === 'workout' && (
                  <>
                    {ex.sets > 1
                      ? `${ex.sets}×${Math.round(ex.reps / ex.sets)}`
                      : `${ex.reps} reps`}
                    {ex.maxWeight != null && ex.maxWeight > 0 && (
                      <span className="text-[#c9a870] ml-1">{ex.maxWeight} kg</span>
                    )}
                  </>
                )}
                {session.type === 'calisthenics' && ex.reps > 0 && `${ex.reps} reps`}
                {session.type === 'crossfit' && (
                  <>
                    {ex.reps > 0 && `${ex.reps} reps`}
                    {ex.maxWeight != null && ex.maxWeight > 0 && (
                      <span className="text-orange-400 ml-1">{ex.maxWeight} kg</span>
                    )}
                  </>
                )}
                {session.type === 'run' && ex.distance != null && `${ex.distance} km`}
              </span>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>

      {!expanded && session.exercises.length > 3 && session.type !== 'run' && (
        <p className="text-[10px] text-[#4a4a4a] font-rajdhani px-4 py-1.5">
          +{session.exercises.length - 3} exercice{session.exercises.length - 3 > 1 ? 's' : ''}…
        </p>
      )}

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-white/5 flex items-center gap-3">
        {session.type !== 'run' && session.exercises.length > 3 && (
          <button
            onClick={() => setExpanded(v => !v)}
            className={`flex items-center gap-1 text-[10px] font-rajdhani font-bold tracking-widest uppercase transition-colors ${cfg.accentClass} opacity-60 hover:opacity-100`}
          >
            {expanded
              ? <><ChevronUp className="w-3 h-3" /> RÉDUIRE</>
              : <><ChevronDown className="w-3 h-3" /> VOIR DÉTAILS</>
            }
          </button>
        )}
        {session.type !== 'run' && (
          <button
            onClick={handleCopy}
            disabled={copying}
            className={`flex items-center gap-1 text-[10px] font-rajdhani font-bold tracking-widest uppercase transition-colors ${cfg.accentClass} opacity-60 hover:opacity-100 disabled:opacity-30 ml-auto`}
          >
            <Copy className="w-3 h-3" />
            {copying ? 'COPIE...' : 'RÉUTILISER'}
          </button>
        )}
      </div>
    </motion.div>
  );
}

export function SavedSessionsPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('workout');

  useEffect(() => {
    if (!user) return;
    savedSessionsService.getSessions(user.id)
      .then(setSessions)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const filtered = sessions.filter(s => s.type === tab);

  async function handleDelete(id: string) {
    await savedSessionsService.deleteSession(id).catch(() => {});
    setSessions(prev => prev.filter(s => s.id !== id));
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Bookmark className="w-5 h-5 text-[#c9a870]" />
        <h1 className="font-rajdhani font-bold text-xl text-[#f5f5f5] tracking-wide uppercase">Séances enregistrées</h1>
        <span className="ml-auto text-xs text-[#6b6b6b] font-rajdhani">{sessions.length} séance{sessions.length > 1 ? 's' : ''}</span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-2 sm:px-4 py-2.5 text-xs sm:text-sm font-rajdhani font-semibold uppercase tracking-wide border-b-2 transition-colors -mb-px flex-1 justify-center sm:flex-none sm:justify-start ${
              tab === t.id
                ? `${t.color} border-current`
                : 'text-[#6b6b6b] border-transparent hover:text-[#a3a3a3]'
            }`}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
            <span className="sm:hidden text-[9px]">{t.label.slice(0, 4)}</span>
            <span className="text-[9px] sm:text-[10px] font-normal opacity-60">
              {sessions.filter(s => s.type === t.id).length}
            </span>
          </button>
        ))}
      </div>

      {/* Contenu */}
      {loading ? (
        <Loader text="Chargement..." />
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <div className={`mx-auto mb-3 ${TABS.find(t => t.id === tab)!.color} opacity-30`}>
            {TABS.find(t => t.id === tab)!.icon}
          </div>
          <p className="text-sm text-[#6b6b6b]">Aucune séance {TABS.find(t => t.id === tab)!.label.toLowerCase()} enregistrée.</p>
          <p className="text-xs text-[#4a4a4a] mt-1">Explore le <strong>feed Community</strong> et enregistre les séances qui t'<em>inspirent</em>.</p>
        </Card>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-2">
            {filtered.map(s => (
              <SessionCard key={s.id} session={s} onDelete={() => handleDelete(s.id)} />
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
