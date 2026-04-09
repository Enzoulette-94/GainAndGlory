import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Plus, BarChart2, Trophy, Trash2, Copy, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { calisthenicsService } from '../services/calisthenics.service';
import { Card, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Loader } from '../components/common/Loader';
import { formatRelativeTime, formatDate, getLevelProgress, getWeekStart } from '../utils/calculations';
import { FEEDBACK_LABELS, FEEDBACK_COLORS } from '../utils/constants';
import type { CalisthenicsSession } from '../types/models';

// ─── Types locaux ─────────────────────────────────────────────────────────────

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

// ─── Composant principal ──────────────────────────────────────────────────────

export function CalisthenicsPage() {
  const { profile } = useAuth();

  const [allSessions, setAllSessions] = useState<CalisthenicsSession[]>([]);
  const [totalSessions, setTotalSessions] = useState(0);
  const [totalReps, setTotalReps] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      const [sess, count, reps] = await Promise.all([
        calisthenicsService.getSessions(profile.id, 200, 0),
        calisthenicsService.getSessionsCount(profile.id),
        calisthenicsService.getTotalReps(profile.id),
      ]);
      setAllSessions(sess);
      setTotalSessions(count);
      setTotalReps(reps);
    } catch (e) {
      setError('Erreur lors du chargement des données');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

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

  const weeklySessionsData = useMemo(() => {
    const weeks: Record<string, { label: string; count: number }> = {};
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      const ws = getWeekStart(d);
      const key = ws.toISOString().slice(0, 10);
      if (!weeks[key]) weeks[key] = { label: ws.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }), count: 0 };
    }
    allSessions.forEach((s) => {
      const ws = getWeekStart(new Date(s.date));
      const key = ws.toISOString().slice(0, 10);
      if (weeks[key]) weeks[key].count += 1;
    });
    return Object.entries(weeks).map(([, v]) => v);
  }, [allSessions]);

  const recentSessions = allSessions.slice(0, 7);

  const groupedSessions = useMemo(() => {
    const groups: { month: string; items: typeof recentSessions }[] = [];
    const idx: Record<string, number> = {};
    for (const s of recentSessions) {
      const key = new Date(s.date)
        .toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
        .toUpperCase();
      if (idx[key] === undefined) { idx[key] = groups.length; groups.push({ month: key, items: [] }); }
      groups[idx[key]].items.push(s);
    }
    return groups;
  }, [recentSessions]);

  if (loading) return <Loader fullScreen text="Chargement calisthénie..." />;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-violet-950/60 via-[#0d0d0d] to-[#0a0a0a] border border-violet-900/20 p-6 -mx-4">
        <Zap className="absolute right-4 top-1/2 -translate-y-1/2 w-28 h-28 text-violet-900/10 pointer-events-none" />
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-400/50 mb-2"><strong>Force</strong> au <em>poids de corps</em></p>
        <h1 className="font-rajdhani text-5xl sm:text-6xl font-black uppercase tracking-tight text-white leading-none mb-3">
          CALISTHÉNIE
        </h1>
        {(() => {
          const { level, current, needed, progress } = getLevelProgress(profile?.calisthenics_xp ?? 0);
          return (
            <>
              <p className="text-xs text-[#6b6b6b] mb-3">Niveau {level} · {profile?.calisthenics_xp ?? 0} XP</p>
              <div className="h-1 bg-white/5 overflow-hidden">
                <motion.div
                  className="h-full"
                  style={{ background: 'linear-gradient(to right, #3b0764, #a855f7)' }}
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
      <Link to="/calisthenics/new" className="-mx-4 block">
        <motion.div
          whileHover={{ backgroundColor: '#7c3aed' }}
          className="w-full py-4 bg-violet-600 text-white font-black uppercase tracking-[0.15em] text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer font-rajdhani"
        >
          <Plus className="w-4 h-4" />
          NOUVELLE SÉANCE
        </motion.div>
      </Link>

      {/* Stats */}
      <Card className="p-3 sm:p-4 text-center">
        <p className="text-xl sm:text-2xl font-rajdhani font-bold text-violet-400">{totalSessions}</p>
        <p className="text-xs text-[#6b6b6b] mt-0.5"><strong>Séances</strong></p>
      </Card>

      {error && (
        <div className="bg-red-950/30 border border-red-800/40 rounded-xl p-3 text-red-400 text-sm">{error}</div>
      )}

      {/* Section Graphiques */}
      <div className="flex items-center gap-3 -mx-4 px-4 py-3 bg-white/[0.02] border-t border-b border-white/8">
        <div className="w-1 h-6 bg-violet-600 flex-shrink-0" />
        <h2 className="font-rajdhani font-black text-lg uppercase tracking-[0.12em] text-white">Graphiques</h2>
      </div>

      {/* Graphiques côte à côte */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card className="p-3">
          <p className="text-xs font-semibold text-[#e5e5e5] mb-3">Reps / séance (30 dernières)</p>
          {chartData.length === 0 ? (
            <p className="text-[#6b6b6b] text-xs text-center py-6">Pas de données</p>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={chartData}>
                <CartesianGrid {...CHART_GRID_PROPS} />
                <XAxis dataKey="date" {...CHART_AXIS_PROPS} tick={{ fill: '#6b6b6b', fontSize: 9 }} interval="preserveStartEnd" />
                <YAxis {...CHART_AXIS_PROPS} tick={{ fill: '#6b6b6b', fontSize: 9 }} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Line type="monotone" dataKey="reps" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6', r: 3 }} activeDot={{ r: 5 }} name="Reps" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-3">
          <p className="text-xs font-semibold text-[#e5e5e5] mb-3">Séances / semaine</p>
          {weeklySessionsData.every((d) => d.count === 0) ? (
            <p className="text-xs text-[#6b6b6b] text-center py-6">Pas de données</p>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={weeklySessionsData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid {...CHART_GRID_PROPS} />
                <XAxis dataKey="label" {...CHART_AXIS_PROPS} tick={{ fill: '#6b6b6b', fontSize: 9 }} interval="preserveStartEnd" />
                <YAxis {...CHART_AXIS_PROPS} tick={{ fill: '#6b6b6b', fontSize: 9 }} allowDecimals={false} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} cursor={{ fill: '#1a1a1a' }} formatter={(v: number | undefined) => [`${v ?? 0}`, 'Séances'] as [string, string]} />
                <Bar dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Section Séances récentes */}
      <div className="flex items-center gap-3 -mx-4 px-4 py-3 bg-white/[0.02] border-t border-b border-white/8">
        <div className="w-1 h-6 bg-violet-600 flex-shrink-0" />
        <h2 className="font-rajdhani font-black text-lg uppercase tracking-[0.12em] text-white">Séances récentes</h2>
      </div>

      {allSessions.length === 0 ? (
        <Card className="p-8 text-center">
          <Zap className="w-10 h-10 text-[#2a2a2a] mx-auto mb-3" />
          <p className="text-[#6b6b6b]"><em>Aucune séance</em> enregistrée</p>
          <Link to="/calisthenics/new" className="mt-3 inline-block">
            <Button size="sm" className="bg-violet-600 hover:bg-violet-500 text-white border-0">
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
        </div>
      )}

      {/* Section Records */}
      <div className="flex items-center gap-3 -mx-4 px-4 py-3 bg-white/[0.02] border-t border-b border-white/8">
        <div className="w-1 h-6 bg-violet-600 flex-shrink-0" />
        <h2 className="font-rajdhani font-black text-lg uppercase tracking-[0.12em] text-white">Records</h2>
      </div>

      <div className="space-y-3">
        {Object.keys(exerciseRecords).length === 0 ? (
          <Card className="p-8 text-center">
            <Trophy className="w-10 h-10 text-[#2a2a2a] mx-auto mb-3" />
            <p className="text-[#6b6b6b]"><em>Aucun record</em> à afficher</p>
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
                  <p className="text-xs text-[#6b6b6b]"><strong>reps</strong> max</p>
                </div>
              </Card>
            ))
        )}
      </div>

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
  const navigate = useNavigate();
  const [showDetail, setShowDetail] = useState(false);

  return (
    <>
    <div className={`bg-[#111] border overflow-hidden transition-all ${
      session.feedback === 'mort' ? 'border-red-900/70' :
      session.feedback === 'difficile' ? 'border-amber-900/70' :
      session.feedback === 'facile' ? 'border-emerald-900/70' :
      'border-white/5'
    }`}>
      {/* Header */}
      <div className="px-4 pt-3.5 pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-rajdhani font-black text-base text-white uppercase tracking-wide truncate">
              {session.name ?? formatDate(session.date, { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()}
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
          <span className="font-rajdhani font-black text-xl text-violet-400 leading-none">{session.total_reps}</span>
          <span className="text-[10px] text-violet-700 uppercase tracking-widest font-rajdhani mt-1">Reps</span>
        </div>
        <div className="flex flex-col items-center py-3 px-2">
          <span className="font-rajdhani font-black text-xl text-[#d4d4d4] leading-none">{session.exercises.length}</span>
          <span className="text-[10px] text-[#4a4a4a] uppercase tracking-widest font-rajdhani mt-1">Exercice{session.exercises.length > 1 ? 's' : ''}</span>
        </div>
        <div className="flex flex-col items-center py-3 px-2">
          <span className={`font-rajdhani font-black text-xl leading-none ${session.skills_unlocked.length > 0 ? 'text-violet-400' : 'text-[#d4d4d4]'}`}>
            {session.skills_unlocked.length > 0 ? session.skills_unlocked.length : session.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)}
          </span>
          <span className="text-[10px] text-[#4a4a4a] uppercase tracking-widest font-rajdhani mt-1">
            {session.skills_unlocked.length > 0 ? `Skill${session.skills_unlocked.length > 1 ? 's' : ''}` : 'Séries'}
          </span>
        </div>
      </div>

      {/* Exercise list */}
      {session.exercises.length > 0 && (
        <div className="px-4 py-3 space-y-2.5">
          {session.exercises.map((ex, i) => {
            const totalReps = ex.sets.reduce((sum, s) => sum + (s.reps ?? 0), 0);
            const avgHold = ex.sets.reduce((sum, s) => sum + (s.hold_seconds ?? 0), 0) / ex.sets.length;
            const isTimed = ex.set_type === 'timed';
            return (
              <div key={i} className="flex items-center gap-3 min-w-0">
                <span className="font-rajdhani font-black text-violet-700 w-5 flex-shrink-0 text-sm">{String(i+1).padStart(2,'0')}</span>
                <span className="font-rajdhani font-bold text-[#e5e5e5] uppercase tracking-wide text-sm min-w-0 truncate">{ex.name}</span>
                <span className="font-rajdhani font-bold text-[#7a7a7a] text-sm flex-shrink-0">{ex.sets.length} sér.</span>
                <span className="font-rajdhani font-black text-violet-400 text-sm flex-shrink-0">
                  {isTimed ? `${Math.round(avgHold)}s` : `${totalReps} reps`}
                </span>
              </div>
            );
          })}
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
          onClick={() => navigate('/calisthenics/new', { state: { copyFrom: session } })}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-rajdhani font-bold uppercase tracking-wide text-[#5a5a5a] hover:text-violet-400 hover:bg-white/5 transition-all"
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
    <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Détails — Calisthénie" size="md">
      <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
        {session.name && (
          <h3 className="font-rajdhani font-bold text-lg text-violet-300 tracking-wide uppercase border-b border-white/5 pb-2">
            {session.name}
          </h3>
        )}
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="text-[#a3a3a3]">{formatDate(session.date, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
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

        <div className="space-y-2">
          {session.exercises.map((ex, i) => (
            <div key={i} className="border border-violet-900/30">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-violet-900/30 bg-violet-900/10">
                <Zap className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                <span className="font-rajdhani font-semibold text-[#f5f5f5] text-sm tracking-wide uppercase">{ex.name}</span>
              </div>
              <div className="divide-y divide-white/5">
                {ex.sets.map((set, j) => (
                  <div key={j} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span className="text-[#6b6b6b] w-14">Série {j + 1}</span>
                    {ex.set_type === 'reps' ? (
                      <span className="text-[#d4d4d4]">{set.reps} reps</span>
                    ) : (
                      <span className="text-[#d4d4d4]">{set.hold_seconds}s</span>
                    )}
                    <span className="text-xs text-violet-400 font-rajdhani font-semibold uppercase">
                      {ex.set_type === 'timed' ? 'Maintien' : 'Répétitions'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {session.skills_unlocked.length > 0 && (
          <div className="border border-violet-900/30 px-3 py-2">
            <p className="text-xs text-violet-400 font-rajdhani font-semibold uppercase mb-1"><strong>Skills</strong> débloqués</p>
            <div className="flex flex-wrap gap-1">
              {session.skills_unlocked.map((s, i) => (
                <span key={i} className="text-xs bg-violet-900/20 text-violet-300 px-2 py-0.5 rounded">{s}</span>
              ))}
            </div>
          </div>
        )}

        {session.notes && (
          <p className="text-sm text-[#a3a3a3] italic border-l-2 border-violet-800/50 pl-3">{session.notes}</p>
        )}
      </div>
    </Modal>
    </>
  );
}
