import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Flame, Plus, BarChart2, Trophy, Trash2, ChevronDown, Copy, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { crossfitService } from '../services/crossfit.service';
import { Card, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Loader } from '../components/common/Loader';
import { formatRelativeTime, formatDate, getLevelProgress } from '../utils/calculations';
import { CROSSFIT_WOD_TYPES, FEEDBACK_LABELS, FEEDBACK_COLORS } from '../utils/constants';
import type { CrossfitSession } from '../types/models';
import type { Feedback } from '../types/enums';

// ─── Types locaux ─────────────────────────────────────────────────────────────

type ActiveTab = 'sessions' | 'charts' | 'records';
type FeedbackFilter = 'all' | Feedback;

// ─── Recharts dark mode ───────────────────────────────────────────────────────

const CHART_GRID_PROPS = { strokeDasharray: '3 3' as string, stroke: '#1c1c1c' };
const CHART_AXIS_PROPS = { tick: { fill: '#6b6b6b', fontSize: 11 }, tickLine: false as const, axisLine: false as const };
const CHART_TOOLTIP_STYLE = {
  backgroundColor: '#0d0d0d',
  border: '1px solid #2a2a2a',
  borderRadius: '12px',
  fontSize: '12px',
  color: '#d4d4d4',
};

const SESSIONS_PER_PAGE = 10;

function wodLabel(type: string): string {
  return CROSSFIT_WOD_TYPES.find(w => w.id === type)?.label ?? type.toUpperCase();
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function CrossfitPage() {
  const { profile } = useAuth();

  const [allSessions, setAllSessions] = useState<CrossfitSession[]>([]);
  const [totalSessions, setTotalSessions] = useState(0);

  const [activeTab, setActiveTab] = useState<ActiveTab>('sessions');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackFilter, setFeedbackFilter] = useState<FeedbackFilter>('all');
  const [displayedCount, setDisplayedCount] = useState(SESSIONS_PER_PAGE);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; session: CrossfitSession | null }>({ open: false, session: null });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!profile) return;
    loadData();
  }, [profile]);

  async function loadData() {
    if (!profile) return;
    setLoading(true);
    setError(null);
    try {
      const [sess, count] = await Promise.all([
        crossfitService.getSessions(profile.id, 200, 0),
        crossfitService.getSessionsCount(profile.id),
      ]);
      setAllSessions(sess);
      setTotalSessions(count);
    } catch (e) {
      setError('Erreur lors du chargement des données');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const filteredSessions = useMemo(() => {
    return allSessions.filter(s => feedbackFilter === 'all' || s.feedback === feedbackFilter);
  }, [allSessions, feedbackFilter]);

  const displayedSessions = filteredSessions.slice(0, displayedCount);

  // Données graphique: nb séances par type de WOD
  const chartData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of allSessions) {
      counts[s.wod_type] = (counts[s.wod_type] ?? 0) + 1;
    }
    return CROSSFIT_WOD_TYPES.map(w => ({
      name: w.label,
      séances: counts[w.id] ?? 0,
    })).filter(d => d.séances > 0);
  }, [allSessions]);

  // Records: max weight per exercise
  const exerciseRecords = useMemo(() => {
    const records: Record<string, { maxWeight: number; date: string }> = {};
    for (const session of allSessions) {
      for (const ex of session.exercises) {
        if (!ex.weight || ex.weight <= 0) continue;
        if (!records[ex.name] || ex.weight > records[ex.name].maxWeight) {
          records[ex.name] = { maxWeight: ex.weight, date: session.date };
        }
      }
    }
    return records;
  }, [allSessions]);

  async function handleDelete() {
    if (!deleteModal.session) return;
    setDeleting(true);
    try {
      await crossfitService.deleteSession(deleteModal.session.id);
      setDeleteModal({ open: false, session: null });
      await loadData();
    } catch {
      setError('Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  }

  const groupedSessions = useMemo(() => {
    const groups: { month: string; items: typeof displayedSessions }[] = [];
    const idx: Record<string, number> = {};
    for (const s of displayedSessions) {
      const key = new Date(s.date)
        .toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
        .toUpperCase();
      if (idx[key] === undefined) { idx[key] = groups.length; groups.push({ month: key, items: [] }); }
      groups[idx[key]].items.push(s);
    }
    return groups;
  }, [displayedSessions]);

  if (loading) return <Loader fullScreen text="Chargement Crossfit..." />;

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'sessions', label: 'Séances', icon: <Flame className="w-4 h-4" /> },
    { id: 'charts', label: 'Graphiques', icon: <BarChart2 className="w-4 h-4" /> },
    { id: 'records', label: 'Records', icon: <Trophy className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-orange-950/60 via-[#0d0d0d] to-[#0a0a0a] border border-orange-900/20 p-6 -mx-4">
        <Flame className="absolute right-4 top-1/2 -translate-y-1/2 w-28 h-28 text-orange-900/10 pointer-events-none" />
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-400/50 mb-2"><strong>WOD</strong> & <em>entraînements fonctionnels</em></p>
        <h1 className="font-rajdhani text-5xl sm:text-6xl font-black uppercase tracking-tight text-white leading-none mb-3">
          CROSSFIT
        </h1>
        {(() => {
          const { level, current, needed, progress } = getLevelProgress(profile?.crossfit_xp ?? 0);
          return (
            <>
              <p className="text-xs text-[#6b6b6b] mb-3">Niveau {level} · {profile?.crossfit_xp ?? 0} XP</p>
              <div className="h-1 bg-white/5 overflow-hidden">
                <motion.div
                  className="h-full"
                  style={{ background: 'linear-gradient(to right, #7c2d12, #f97316)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress * 100}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
              <p className="text-[10px] text-[#3a3a3a] mt-1.5">{current} / {needed} XP → Niv. {level + 1}</p>
            </>
          );
        })()}
      </div>

      {/* CTA */}
      <Link to="/crossfit/new" className="-mx-4 block">
        <motion.div
          whileHover={{ backgroundColor: '#ea580c' }}
          className="w-full py-4 bg-orange-600 text-white font-black uppercase tracking-[0.15em] text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer font-rajdhani"
        >
          <Plus className="w-4 h-4" />
          NOUVELLE SÉANCE
        </motion.div>
      </Link>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
        <Card className="p-3 sm:p-4 text-center">
          <p className="text-xl sm:text-2xl font-rajdhani font-bold text-orange-400">{totalSessions}</p>
          <p className="text-xs text-[#6b6b6b] mt-0.5"><strong>Séances</strong></p>
        </Card>
        <Card className="p-3 sm:p-4 text-center">
          <p className="text-xl sm:text-2xl font-rajdhani font-bold text-orange-400">
            {allSessions.reduce((sum, s) => sum + s.exercises.length, 0)}
          </p>
          <p className="text-xs text-[#6b6b6b] mt-0.5"><strong>Exercices</strong></p>
        </Card>
        <Card className="p-3 sm:p-4 text-center">
          <p className="text-xl sm:text-2xl font-rajdhani font-bold text-orange-400">
            {Object.keys(exerciseRecords).length}
          </p>
          <p className="text-xs text-[#6b6b6b] mt-0.5"><strong>Records</strong></p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/5">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-orange-400 text-orange-400'
                : 'border-transparent text-[#6b6b6b] hover:text-[#d4d4d4]'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-950/30 border border-red-800/40 rounded-xl p-3 text-red-400 text-sm">{error}</div>
      )}

      {/* Tab: Séances */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {(['all', 'facile', 'difficile', 'mort'] as const).map(f => (
              <button
                key={f}
                onClick={() => { setFeedbackFilter(f); setDisplayedCount(SESSIONS_PER_PAGE); }}
                className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                  feedbackFilter === f
                    ? 'bg-orange-600/20 border-orange-500/40 text-orange-300'
                    : 'border-white/10 text-[#6b6b6b] hover:border-white/20'
                }`}
              >
                {f === 'all' ? 'Toutes' : FEEDBACK_LABELS[f]}
              </button>
            ))}
          </div>

          {displayedSessions.length === 0 ? (
            <Card className="p-8 text-center">
              <Flame className="w-10 h-10 text-[#2a2a2a] mx-auto mb-3" />
              <p className="text-[#6b6b6b]"><em>Aucune séance</em> enregistrée</p>
              <Link to="/crossfit/new" className="mt-3 inline-block">
                <Button size="sm" className="bg-orange-600 hover:bg-orange-500 text-white border-0">
                  <Plus className="w-4 h-4 mr-1" />
                  Première séance
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-6">
              {groupedSessions.map(({ month, items }) => (
                <div key={month} className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#3a3a3a]">{month}</span>
                    <div className="flex-1 h-px bg-white/5" />
                    <span className="text-[10px] text-[#2a2a2a]">{items.length} séance{items.length > 1 ? 's' : ''}</span>
                  </div>
                  {items.map(session => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      onDelete={() => setDeleteModal({ open: true, session })}
                    />
                  ))}
                </div>
              ))}
              {displayedCount < filteredSessions.length && (
                <button
                  onClick={() => setDisplayedCount(c => c + SESSIONS_PER_PAGE)}
                  className="w-full py-3 flex items-center justify-center gap-2 text-sm text-[#6b6b6b] hover:text-[#d4d4d4] border border-white/5 rounded-xl transition-colors"
                >
                  <ChevronDown className="w-4 h-4" />
                  Charger plus
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab: Graphiques */}
      {activeTab === 'charts' && (
        <Card className="p-4">
          <CardHeader title="Séances par type de WOD" />
          {chartData.length === 0 ? (
            <p className="text-[#6b6b6b] text-sm text-center py-8"><em>Pas encore</em> de données</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData}>
                <CartesianGrid {...CHART_GRID_PROPS} />
                <XAxis dataKey="name" {...CHART_AXIS_PROPS} />
                <YAxis {...CHART_AXIS_PROPS} allowDecimals={false} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Bar dataKey="séances" fill="#ea580c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      )}

      {/* Tab: Records */}
      {activeTab === 'records' && (
        <div className="space-y-3">
          {Object.keys(exerciseRecords).length === 0 ? (
            <Card className="p-8 text-center">
              <Trophy className="w-10 h-10 text-[#2a2a2a] mx-auto mb-3" />
              <p className="text-[#6b6b6b]"><em>Aucun record</em> à afficher</p>
            </Card>
          ) : (
            Object.entries(exerciseRecords)
              .sort((a, b) => b[1].maxWeight - a[1].maxWeight)
              .map(([name, record]) => (
                <Card key={name} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#f5f5f5]">{name}</p>
                    <p className="text-xs text-[#6b6b6b] mt-0.5">{formatDate(record.date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-rajdhani font-bold text-orange-400">{record.maxWeight}</p>
                    <p className="text-xs text-[#6b6b6b]"><strong>kg</strong> max</p>
                  </div>
                </Card>
              ))
          )}
        </div>
      )}

      {/* Modal suppression */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, session: null })}
        title="Supprimer la séance"
      >
        <p className="text-[#a3a3a3] text-sm mb-6">
          Supprimer la séance du {deleteModal.session ? formatDate(deleteModal.session.date) : ''} ?
          Cette action est irréversible.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={() => setDeleteModal({ open: false, session: null })}>
            Annuler
          </Button>
          <Button
            onClick={handleDelete}
            disabled={deleting}
            className="bg-red-600/20 border-red-600/40 text-red-400 hover:bg-red-600/30"
          >
            {deleting ? 'Suppression...' : 'Supprimer'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

// ─── SessionCard ──────────────────────────────────────────────────────────────

function SessionCard({ session, onDelete }: { session: CrossfitSession; onDelete: () => void }) {
  const navigate = useNavigate();
  const [showDetail, setShowDetail] = useState(false);

  function getResultSummary(): string {
    switch (session.wod_type) {
      case 'for_time': return session.result_time ? `${session.result_time}` : '';
      case 'amrap': return session.result_reps ? `${session.result_reps} reps` : '';
      case 'for_rounds': return session.result_rounds != null ? `${session.result_rounds} rounds` : '';
      case 'emom': return session.total_duration ? `${session.total_duration} min` : '';
      case 'benchmark': return session.benchmark_name ?? '';
      default: return '';
    }
  }

  const resultSummary = getResultSummary();

  return (
    <>
    <div className={`bg-[#111] border overflow-hidden transition-all ${
      session.feedback === 'mort' ? 'border-red-900/70' :
      session.feedback === 'difficile' ? 'border-amber-900/70' :
      session.feedback === 'facile' ? 'border-emerald-900/70' :
      'border-orange-900/20'
    }`}>
      {/* Header */}
      <div className="px-4 pt-3.5 pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-rajdhani font-black text-base text-white uppercase tracking-wide truncate">
              {session.name
                ? session.name.toUpperCase()
                : formatDate(session.date, { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()}
            </span>
            {session.feedback && (
              <span className={`text-sm font-bold font-rajdhani flex-shrink-0 ${FEEDBACK_COLORS[session.feedback]}`}>
                {FEEDBACK_LABELS[session.feedback]}
              </span>
            )}
          </div>
          <span className="text-xs text-[#3a3a3a] flex-shrink-0">{formatRelativeTime(session.date)}</span>
        </div>
      </div>

      {/* Metric blocks */}
      <div className="grid grid-cols-3 divide-x divide-white/5 border-t border-b border-white/5 bg-[#0d0d0d]">
        <div className="flex flex-col items-center py-3 px-2">
          <span className="font-rajdhani font-black text-xl text-orange-400 leading-none uppercase">{wodLabel(session.wod_type)}</span>
          <span className="text-[10px] text-orange-700 uppercase tracking-widest font-rajdhani mt-1">Type WOD</span>
        </div>
        <div className="flex flex-col items-center py-3 px-2">
          <span className="font-rajdhani font-black text-xl text-[#d4d4d4] leading-none">{session.exercises.length}</span>
          <span className="text-[10px] text-[#4a4a4a] uppercase tracking-widest font-rajdhani mt-1">Exercice{session.exercises.length > 1 ? 's' : ''}</span>
        </div>
        <div className="flex flex-col items-center py-3 px-2">
          <span className="font-rajdhani font-black text-xl text-orange-400 leading-none">{resultSummary || '—'}</span>
          <span className="text-[10px] text-[#4a4a4a] uppercase tracking-widest font-rajdhani mt-1">Résultat</span>
        </div>
      </div>

      {/* Exercise list */}
      {session.exercises.length > 0 && (
        <div className="px-4 py-3 space-y-2.5">
          {session.exercises.map((ex, i) => (
            <div key={i} className="flex items-center gap-3 min-w-0">
              <span className="font-rajdhani font-black text-orange-700 w-5 flex-shrink-0 text-sm">{String(i+1).padStart(2,'0')}</span>
              <span className="font-rajdhani font-bold text-[#e5e5e5] uppercase tracking-wide text-sm min-w-0 truncate">{ex.name}</span>
              {(ex.reps != null || ex.duration != null) && (
                <span className="font-rajdhani font-bold text-[#7a7a7a] text-sm flex-shrink-0">
                  {ex.reps != null ? `${ex.reps} reps` : `${ex.duration}s`}
                </span>
              )}
              {ex.weight != null && (
                <span className="font-rajdhani font-black text-orange-400 text-sm flex-shrink-0">{ex.weight} kg</span>
              )}
            </div>
          ))}
        </div>
      )}

      {session.notes && (
        <div className="px-4 pb-3 border-t border-white/5 pt-2">
          <p className="text-xs text-[#7a7a7a] italic">{session.notes}</p>
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center border-t border-white/5">
        <button
          onClick={() => setShowDetail(true)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-rajdhani font-bold uppercase tracking-wide text-[#5a5a5a] hover:text-[#e5e5e5] hover:bg-white/5 transition-all"
        >
          <Eye className="w-3.5 h-3.5" /> Voir
        </button>
        <div className="w-px h-5 bg-white/5" />
        <button
          onClick={() => navigate('/crossfit/new', { state: { copyFrom: session } })}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-rajdhani font-bold uppercase tracking-wide text-[#5a5a5a] hover:text-orange-400 hover:bg-white/5 transition-all"
        >
          <Copy className="w-3.5 h-3.5" /> Copier
        </button>
        <div className="w-px h-5 bg-white/5" />
        <button
          onClick={onDelete}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-rajdhani font-bold uppercase tracking-wide text-[#5a5a5a] hover:text-red-400 hover:bg-red-900/10 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" /> Suppr
        </button>
      </div>
    </div>

    {/* Modal détail séance */}
    <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Détails — Crossfit" size="md">
      <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
        {session.name && (
          <h3 className="font-rajdhani font-bold text-lg text-orange-400 tracking-wide uppercase border-b border-white/5 pb-2">
            {session.name}
          </h3>
        )}
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="text-[#a3a3a3]">{formatDate(session.date, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          <span className="text-xs px-2 py-0.5 bg-orange-950/40 border border-orange-900/40 text-orange-400 rounded font-bold font-rajdhani">
            {wodLabel(session.wod_type)}
          </span>
          {session.feedback && (
            <span className={`text-xs border px-2 py-0.5 font-rajdhani font-semibold uppercase ${
              session.feedback === 'facile' ? 'text-green-500 border-green-900/50' :
              session.feedback === 'difficile' ? 'text-orange-500 border-orange-900/50' :
              'text-red-500 border-red-900/50'
            }`}>
              {FEEDBACK_LABELS[session.feedback]}
            </span>
          )}
        </div>

        {/* WOD params */}
        <div className="grid grid-cols-2 gap-2">
          {session.total_duration != null && (
            <div className="border border-white/5 px-3 py-2">
              <p className="text-xs text-[#6b6b6b] uppercase tracking-wide"><strong>Durée totale</strong></p>
              <p className="text-sm font-rajdhani font-semibold text-[#e5e5e5]">{session.total_duration} min</p>
            </div>
          )}
          {session.round_duration != null && (
            <div className="border border-white/5 px-3 py-2">
              <p className="text-xs text-[#6b6b6b] uppercase tracking-wide"><strong>Durée</strong> / round</p>
              <p className="text-sm font-rajdhani font-semibold text-[#e5e5e5]">{session.round_duration}s</p>
            </div>
          )}
          {session.target_rounds != null && (
            <div className="border border-white/5 px-3 py-2">
              <p className="text-xs text-[#6b6b6b] uppercase tracking-wide">Rounds <em>cibles</em></p>
              <p className="text-sm font-rajdhani font-semibold text-[#e5e5e5]">{session.target_rounds}</p>
            </div>
          )}
          {session.result_rounds != null && (
            <div className="border border-orange-900/30 px-3 py-2">
              <p className="text-xs text-orange-400 uppercase tracking-wide">Rounds <strong>réalisés</strong></p>
              <p className="text-sm font-rajdhani font-bold text-orange-300">{session.result_rounds}</p>
            </div>
          )}
          {session.result_reps != null && (
            <div className="border border-orange-900/30 px-3 py-2">
              <p className="text-xs text-orange-400 uppercase tracking-wide"><strong>Reps</strong> totales</p>
              <p className="text-sm font-rajdhani font-bold text-orange-300">{session.result_reps}</p>
            </div>
          )}
          {session.result_time && (
            <div className="border border-orange-900/30 px-3 py-2">
              <p className="text-xs text-orange-400 uppercase tracking-wide">Temps</p>
              <p className="text-sm font-rajdhani font-bold text-orange-300">{session.result_time}</p>
            </div>
          )}
          {session.benchmark_name && (
            <div className="border border-orange-900/30 px-3 py-2 col-span-2">
              <p className="text-xs text-orange-400 uppercase tracking-wide">Benchmark</p>
              <p className="text-sm font-rajdhani font-bold text-orange-300">{session.benchmark_name}</p>
            </div>
          )}
        </div>

        {/* Exercices */}
        {session.exercises.length > 0 && (
          <div className="space-y-2">
            {session.exercises.map((ex, i) => (
              <div key={i} className="border border-orange-900/20 px-3 py-2 flex items-center justify-between gap-2">
                <span className="font-rajdhani font-semibold text-[#f5f5f5] text-sm uppercase tracking-wide">{ex.name}</span>
                <div className="flex items-center gap-2 flex-shrink-0 text-xs">
                  {ex.reps != null && <span className="text-[#d4d4d4]">{ex.reps} reps</span>}
                  {ex.duration != null && <span className="text-[#d4d4d4]">{ex.duration}s</span>}
                  {ex.weight != null && <span className="font-bold text-orange-400">{ex.weight} kg</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {session.notes && (
          <p className="text-sm text-[#a3a3a3] italic border-l-2 border-orange-800/50 pl-3">{session.notes}</p>
        )}
      </div>
    </Modal>
    </>
  );
}
