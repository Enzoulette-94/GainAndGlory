import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Flame, Plus, BarChart2, Trophy, Trash2, ChevronDown, Copy } from 'lucide-react';
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
import { formatRelativeTime, formatDate } from '../utils/calculations';
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

  if (loading) return <Loader fullScreen text="Chargement Crossfit..." />;

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'sessions', label: 'Séances', icon: <Flame className="w-4 h-4" /> },
    { id: 'charts', label: 'Graphiques', icon: <BarChart2 className="w-4 h-4" /> },
    { id: 'records', label: 'Records', icon: <Trophy className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/10 rounded-xl">
            <Flame className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h1 className="font-rajdhani font-bold text-xl sm:text-2xl text-[#f5f5f5] uppercase tracking-wide">
              Crossfit
            </h1>
            <p className="text-xs text-[#6b6b6b]">WOD & entraînements fonctionnels</p>
          </div>
        </div>
        <Link to="/crossfit/new">
          <Button size="sm" className="bg-orange-600 hover:bg-orange-500 text-white border-0">
            <Plus className="w-4 h-4 mr-1" />
            Nouvelle séance
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Card className="p-3 sm:p-4 text-center">
          <p className="text-xl sm:text-2xl font-rajdhani font-bold text-orange-400">{totalSessions}</p>
          <p className="text-xs text-[#6b6b6b] mt-0.5">Séances</p>
        </Card>
        <Card className="p-3 sm:p-4 text-center">
          <p className="text-xl sm:text-2xl font-rajdhani font-bold text-orange-400">
            {allSessions.reduce((sum, s) => sum + s.exercises.length, 0)}
          </p>
          <p className="text-xs text-[#6b6b6b] mt-0.5">Exercices</p>
        </Card>
        <Card className="p-3 sm:p-4 text-center">
          <p className="text-xl sm:text-2xl font-rajdhani font-bold text-orange-400">
            {Object.keys(exerciseRecords).length}
          </p>
          <p className="text-xs text-[#6b6b6b] mt-0.5">Records</p>
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
              <p className="text-[#6b6b6b]">Aucune séance enregistrée</p>
              <Link to="/crossfit/new" className="mt-3 inline-block">
                <Button size="sm" className="bg-orange-600 hover:bg-orange-500 text-white border-0">
                  <Plus className="w-4 h-4 mr-1" />
                  Première séance
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-3">
              {displayedSessions.map(session => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onDelete={() => setDeleteModal({ open: true, session })}
                />
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
            <p className="text-[#6b6b6b] text-sm text-center py-8">Pas encore de données</p>
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
              <p className="text-[#6b6b6b]">Aucun record à afficher</p>
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
                    <p className="text-xs text-[#6b6b6b]">kg max</p>
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
  const [expanded, setExpanded] = useState(false);

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
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#111] border border-white/5 rounded-xl overflow-hidden"
    >
      <div
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-rajdhani font-bold text-orange-400 bg-orange-950/40 border border-orange-900/40 px-1.5 py-0.5 rounded">
                {wodLabel(session.wod_type)}
              </span>
              {session.name && (
                <p className="font-medium text-[#f5f5f5] text-sm">{session.name}</p>
              )}
              {session.feedback && (
                <span className={`text-xs font-medium ${FEEDBACK_COLORS[session.feedback]}`}>
                  {FEEDBACK_LABELS[session.feedback]}
                </span>
              )}
            </div>
            <p className="text-xs text-[#4a4a4a] mt-1">
              {formatRelativeTime(session.date)} · {session.exercises.length} exercice{session.exercises.length > 1 ? 's' : ''}
              {resultSummary ? ` · ${resultSummary}` : ''}
            </p>
          </div>
          <button
            onClick={e => { e.stopPropagation(); navigate('/crossfit/new', { state: { copyFrom: session } }); }}
            className="p-1.5 text-[#4a4a4a] hover:text-orange-400 transition-colors flex-shrink-0"
            title="Réutiliser cette séance"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 text-[#4a4a4a] hover:text-red-400 transition-colors flex-shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-white/5 px-4 pb-4 pt-3 space-y-2">
          {session.exercises.map((ex, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="text-[#d4d4d4] font-medium">{ex.name}</span>
              {ex.reps != null && <span className="text-[#6b6b6b]">{ex.reps} reps</span>}
              {ex.duration != null && <span className="text-[#6b6b6b]">{ex.duration}s</span>}
              {ex.weight != null && <span className="text-orange-400">{ex.weight} kg</span>}
              {ex.notes && <span className="text-[#4a4a4a] italic">· {ex.notes}</span>}
            </div>
          ))}
          {session.notes && (
            <p className="text-xs text-[#6b6b6b] italic border-t border-white/5 pt-2">{session.notes}</p>
          )}
          <div className="border-t border-white/5 pt-3">
            <button
              onClick={e => { e.stopPropagation(); navigate('/crossfit/new', { state: { copyFrom: session } }); }}
              className="flex items-center gap-1.5 text-xs text-[#6b6b6b] hover:text-orange-400 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              Réutiliser cette séance
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
