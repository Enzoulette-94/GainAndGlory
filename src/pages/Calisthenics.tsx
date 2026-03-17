import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Plus, BarChart2, Trophy, Grid, Trash2, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { calisthenicsService } from '../services/calisthenics.service';
import { Card, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Loader } from '../components/common/Loader';
import { formatRelativeTime, formatDate } from '../utils/calculations';
import { FEEDBACK_LABELS, FEEDBACK_COLORS, CALISTHENICS_SKILLS } from '../utils/constants';
import type { CalisthenicsSession, ProfileSkill } from '../types/models';
import type { Feedback } from '../types/enums';

// ─── Types locaux ─────────────────────────────────────────────────────────────

type ActiveTab = 'sessions' | 'charts' | 'records' | 'skills';
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

// ─── Composant principal ──────────────────────────────────────────────────────

export function CalisthenicsPage() {
  const { profile } = useAuth();

  const [sessions, setSessions] = useState<CalisthenicsSession[]>([]);
  const [allSessions, setAllSessions] = useState<CalisthenicsSession[]>([]);
  const [totalSessions, setTotalSessions] = useState(0);
  const [totalReps, setTotalReps] = useState(0);
  const [unlockedSkills, setUnlockedSkills] = useState<ProfileSkill[]>([]);

  const [activeTab, setActiveTab] = useState<ActiveTab>('sessions');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackFilter, setFeedbackFilter] = useState<FeedbackFilter>('all');
  const [displayedCount, setDisplayedCount] = useState(SESSIONS_PER_PAGE);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; session: CalisthenicsSession | null }>({ open: false, session: null });
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
      const [sess, count, reps, skills] = await Promise.all([
        calisthenicsService.getSessions(profile.id, 200, 0),
        calisthenicsService.getSessionsCount(profile.id),
        calisthenicsService.getTotalReps(profile.id),
        calisthenicsService.getUnlockedSkills(profile.id),
      ]);
      setAllSessions(sess);
      setSessions(sess.slice(0, SESSIONS_PER_PAGE));
      setTotalSessions(count);
      setTotalReps(reps);
      setUnlockedSkills(skills);
    } catch (e) {
      setError('Erreur lors du chargement des données');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // Filtrage sessions
  const filteredSessions = useMemo(() => {
    return allSessions.filter(s => feedbackFilter === 'all' || s.feedback === feedbackFilter);
  }, [allSessions, feedbackFilter]);

  const displayedSessions = filteredSessions.slice(0, displayedCount);

  // Données graphique
  const chartData = useMemo(() => {
    return [...allSessions].reverse().slice(-30).map(s => ({
      date: formatDate(s.date).slice(0, 5),
      reps: s.total_reps,
    }));
  }, [allSessions]);

  // Records par exercice
  const exerciseRecords = useMemo(() => {
    const records: Record<string, { maxReps: number; date: string }> = {};
    for (const session of allSessions) {
      for (const ex of session.exercises) {
        if (ex.set_type !== 'reps') continue;
        const maxRepsInSession = Math.max(...ex.sets.map(s => s.reps ?? 0));
        if (!records[ex.name] || maxRepsInSession > records[ex.name].maxReps) {
          records[ex.name] = { maxReps: maxRepsInSession, date: session.date };
        }
      }
    }
    return records;
  }, [allSessions]);

  async function handleDelete() {
    if (!deleteModal.session) return;
    setDeleting(true);
    try {
      await calisthenicsService.deleteSession(deleteModal.session.id);
      setDeleteModal({ open: false, session: null });
      await loadData();
    } catch {
      setError('Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <Loader fullScreen text="Chargement calisthénie..." />;

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'sessions', label: 'Séances', icon: <Zap className="w-4 h-4" /> },
    { id: 'charts', label: 'Graphiques', icon: <BarChart2 className="w-4 h-4" /> },
    { id: 'records', label: 'Records', icon: <Trophy className="w-4 h-4" /> },
    { id: 'skills', label: 'Skills', icon: <Grid className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-500/10 rounded-xl">
            <Zap className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <h1 className="font-rajdhani font-bold text-xl sm:text-2xl text-[#f5f5f5] uppercase tracking-wide">
              Calisthénie
            </h1>
            <p className="text-xs text-[#6b6b6b]">Force au poids de corps</p>
          </div>
        </div>
        <Link to="/calisthenics/new">
          <Button size="sm" className="bg-violet-600 hover:bg-violet-500 text-white border-0">
            <Plus className="w-4 h-4 mr-1" />
            Nouvelle séance
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Card className="p-3 sm:p-4 text-center">
          <p className="text-xl sm:text-2xl font-rajdhani font-bold text-violet-400">{totalSessions}</p>
          <p className="text-xs text-[#6b6b6b] mt-0.5">Séances</p>
        </Card>
        <Card className="p-3 sm:p-4 text-center">
          <p className="text-xl sm:text-2xl font-rajdhani font-bold text-violet-400">{totalReps.toLocaleString('fr-FR')}</p>
          <p className="text-xs text-[#6b6b6b] mt-0.5">Reps</p>
        </Card>
        <Card className="p-3 sm:p-4 text-center">
          <p className="text-xl sm:text-2xl font-rajdhani font-bold text-violet-400">
            {unlockedSkills.length}/{CALISTHENICS_SKILLS.length}
          </p>
          <p className="text-xs text-[#6b6b6b] mt-0.5">Skills</p>
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
                ? 'border-violet-400 text-violet-400'
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
          {/* Filtre feedback */}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'facile', 'difficile', 'mort'] as const).map(f => (
              <button
                key={f}
                onClick={() => { setFeedbackFilter(f); setDisplayedCount(SESSIONS_PER_PAGE); }}
                className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                  feedbackFilter === f
                    ? 'bg-violet-600/20 border-violet-500/40 text-violet-300'
                    : 'border-white/10 text-[#6b6b6b] hover:border-white/20'
                }`}
              >
                {f === 'all' ? 'Toutes' : FEEDBACK_LABELS[f]}
              </button>
            ))}
          </div>

          {displayedSessions.length === 0 ? (
            <Card className="p-8 text-center">
              <Zap className="w-10 h-10 text-[#2a2a2a] mx-auto mb-3" />
              <p className="text-[#6b6b6b]">Aucune séance enregistrée</p>
              <Link to="/calisthenics/new" className="mt-3 inline-block">
                <Button size="sm" className="bg-violet-600 hover:bg-violet-500 text-white border-0">
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
          <CardHeader title="Reps par séance (30 dernières)" />
          {chartData.length === 0 ? (
            <p className="text-[#6b6b6b] text-sm text-center py-8">Pas encore de données</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData}>
                <CartesianGrid {...CHART_GRID_PROPS} />
                <XAxis dataKey="date" {...CHART_AXIS_PROPS} />
                <YAxis {...CHART_AXIS_PROPS} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Line type="monotone" dataKey="reps" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6', r: 3 }} activeDot={{ r: 5 }} name="Reps" />
              </LineChart>
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
              .sort((a, b) => b[1].maxReps - a[1].maxReps)
              .map(([name, record]) => (
                <Card key={name} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#f5f5f5]">{name}</p>
                    <p className="text-xs text-[#6b6b6b] mt-0.5">{formatDate(record.date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-rajdhani font-bold text-violet-400">{record.maxReps}</p>
                    <p className="text-xs text-[#6b6b6b]">reps max</p>
                  </div>
                </Card>
              ))
          )}
        </div>
      )}

      {/* Tab: Skills */}
      {activeTab === 'skills' && (
        <div className="grid grid-cols-2 gap-3">
          {CALISTHENICS_SKILLS.map(skill => {
            const unlockedSkill = unlockedSkills.find(s => s.skill_code === skill.code);
            const isUnlocked = !!unlockedSkill;
            return (
              <Card
                key={skill.code}
                className={`p-4 border transition-colors ${
                  isUnlocked
                    ? 'border-violet-500/40 bg-violet-950/20'
                    : 'border-white/5 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isUnlocked ? 'text-violet-300' : 'text-[#6b6b6b]'}`}>
                      {skill.label}
                    </p>
                    <p className="text-xs text-[#4a4a4a] mt-0.5 line-clamp-2">{skill.description}</p>
                  </div>
                  <span className={`ml-2 flex-shrink-0 text-xs font-rajdhani font-bold px-1.5 py-0.5 rounded ${isUnlocked ? 'bg-violet-900/50 text-violet-300' : 'bg-[#1a1a1a] text-[#4a4a4a]'}`}>
                    +{skill.xp} XP
                  </span>
                </div>
                {isUnlocked && (
                  <p className="text-xs text-[#6b6b6b] mt-2">
                    Débloqué le {formatDate(unlockedSkill.unlocked_at)}
                  </p>
                )}
                {!isUnlocked && (
                  <p className="text-xs text-[#3a3a3a] mt-2">Non débloqué</p>
                )}
              </Card>
            );
          })}
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

function SessionCard({ session, onDelete }: { session: CalisthenicsSession; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);

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
              <p className="font-medium text-[#f5f5f5] text-sm">
                {session.name ?? 'Séance calisthénie'}
              </p>
              {session.feedback && (
                <span className={`text-xs font-medium ${FEEDBACK_COLORS[session.feedback]}`}>
                  {FEEDBACK_LABELS[session.feedback]}
                </span>
              )}
              {session.skills_unlocked.length > 0 && (
                <span className="text-xs bg-violet-900/40 text-violet-300 px-1.5 py-0.5 rounded">
                  {session.skills_unlocked.length} skill{session.skills_unlocked.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-xs text-[#4a4a4a] mt-1">
              {formatRelativeTime(session.date)} · {session.exercises.length} exercice{session.exercises.length > 1 ? 's' : ''} · {session.total_reps} reps
            </p>
          </div>
          <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 text-[#4a4a4a] hover:text-red-400 transition-colors flex-shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-white/5 px-4 pb-4 pt-3 space-y-3">
          {session.exercises.map((ex, i) => (
            <div key={i}>
              <p className="text-xs font-medium text-[#d4d4d4] mb-1">{ex.name}</p>
              <div className="flex flex-wrap gap-1.5">
                {ex.sets.map((set, j) => (
                  <span key={j} className="text-xs bg-[#1a1a1a] text-[#6b6b6b] px-2 py-0.5 rounded">
                    {ex.set_type === 'reps' ? `${set.reps} reps` : `${set.hold_seconds}s`}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {session.notes && (
            <p className="text-xs text-[#6b6b6b] italic border-t border-white/5 pt-2">{session.notes}</p>
          )}
        </div>
      )}
    </motion.div>
  );
}
