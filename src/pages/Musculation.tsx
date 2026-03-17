import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dumbbell, Plus, BarChart2, Weight, TrendingUp, Trophy, ChevronDown, ChevronUp, Pencil, Trash2, Search, X, Copy, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { workoutService } from '../services/workout.service';
import { Card, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input, Textarea } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { Loader } from '../components/common/Loader';
import {
  formatRelativeTime,
  formatDate,
  formatNumber,
  getWeekStart,
  getLevelProgress,
} from '../utils/calculations';
import { FEEDBACK_LABELS, FEEDBACK_COLORS, MUSCLE_GROUP_LABELS } from '../utils/constants';
import type { WorkoutSession, Exercise } from '../types/models';
import type { Feedback, MuscleGroup } from '../types/enums';

// ─── Types locaux ────────────────────────────────────────────────────────────

type ActiveTab = 'sessions' | 'charts' | 'records';
type FeedbackFilter = 'all' | Feedback;

// ─── Constantes Recharts (dark mode) ────────────────────────────────────────

const CHART_GRID_PROPS = {
  strokeDasharray: '3 3' as string,
  stroke: '#1c1c1c',
};

const CHART_AXIS_PROPS = {
  tick: { fill: '#6b6b6b', fontSize: 11 },
  tickLine: false as const,
  axisLine: false as const,
};

const CHART_TOOLTIP_STYLE = {
  backgroundColor: '#0d0d0d',
  border: '1px solid #2a2a2a',
  borderRadius: '12px',
  fontSize: '12px',
  color: '#d4d4d4',
};

const SESSIONS_PER_PAGE = 10;
const CHART_SESSIONS_LIMIT = 50;

// ─── Composant principal ─────────────────────────────────────────────────────

export function MusculationPage() {
  const { profile } = useAuth();

  // Données
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [chartSessions, setChartSessions] = useState<WorkoutSession[]>([]);
  const [totalSessions, setTotalSessions] = useState(0);
  const [totalTonnage, setTotalTonnage] = useState(0);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [personalRecords, setPersonalRecords] = useState<
    Record<string, { weight: number; reps: number; date: string; sessionId: string }>
  >({});

  // UI state
  const [activeTab, setActiveTab] = useState<ActiveTab>('sessions');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtres onglet Séances
  const [feedbackFilter, setFeedbackFilter] = useState<FeedbackFilter>('all');
  const [muscleGroupFilter, setMuscleGroupFilter] = useState<string>('all');
  const [displayedCount, setDisplayedCount] = useState(SESSIONS_PER_PAGE);

  // Filtre onglet Graphiques
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');

  // ── Chargement initial ──────────────────────────────────────────────────────
  function loadData(userId: string) {
    setLoading(true);
    setError(null);

    Promise.all([
      workoutService.getSessions(userId, CHART_SESSIONS_LIMIT),
      workoutService.getSessionsCount(userId),
      workoutService.getTotalTonnage(userId),
      workoutService.getExercises(),
      workoutService.getPersonalRecords(userId),
    ])
      .then(([allSessions, count, tonnage, exList, prs]) => {
        setChartSessions(allSessions);
        setSessions(allSessions.slice(0, SESSIONS_PER_PAGE));
        setTotalSessions(count);
        setTotalTonnage(tonnage);
        setExercises(exList);
        setPersonalRecords(prs);
      })
      .catch(() => setError('Impossible de charger les données.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!profile) return;
    loadData(profile.id);
  }, [profile]);

  // ── Sessions filtrées ───────────────────────────────────────────────────────
  const filteredSessions = useMemo(() => {
    return chartSessions.filter((s) => {
      // Filtre feedback
      if (feedbackFilter !== 'all' && s.feedback !== feedbackFilter) return false;

      // Filtre groupe musculaire : on vérifie si au moins un set correspond
      if (muscleGroupFilter !== 'all') {
        const hasMuscle = s.sets?.some(
          (set) => set.exercise?.muscle_group === muscleGroupFilter
        );
        if (!hasMuscle) return false;
      }

      return true;
    });
  }, [chartSessions, feedbackFilter, muscleGroupFilter]);

  const paginatedSessions = useMemo(
    () => filteredSessions.slice(0, displayedCount),
    [filteredSessions, displayedCount]
  );

  // ── Données graphique tonnage par semaine ───────────────────────────────────
  const weeklyTonnageData = useMemo(() => {
    if (chartSessions.length === 0) return [];

    const now = new Date();
    const weeks: { weekStart: Date; label: string; tonnage: number }[] = [];

    for (let i = 7; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      const weekStart = getWeekStart(d);
      const label = weekStart.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      weeks.push({ weekStart, label, tonnage: 0 });
    }

    for (const session of chartSessions) {
      const sessionDate = new Date(session.date);
      const sessionWeekStart = getWeekStart(sessionDate).getTime();

      for (const week of weeks) {
        if (week.weekStart.getTime() === sessionWeekStart) {
          week.tonnage += session.total_tonnage ?? 0;
          break;
        }
      }
    }

    return weeks.map((w, i) => ({
      name: i === 7 ? 'Cette sem.' : w.label,
      tonnage: Math.round(w.tonnage),
    }));
  }, [chartSessions]);

  // ── Données graphique évolution exercice ───────────────────────────────────
  const exerciseEvolutionData = useMemo(() => {
    if (!selectedExerciseId) return [];

    const points: { date: string; charge: number }[] = [];

    for (const session of [...chartSessions].reverse()) {
      if (!session.sets) continue;
      const relevantSets = session.sets.filter(
        (s) => s.exercise_id === selectedExerciseId
      );
      if (relevantSets.length === 0) continue;

      const maxWeight = Math.max(...relevantSets.map((s) => s.weight));
      const label = new Date(session.date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
      });
      points.push({ date: label, charge: maxWeight });
    }

    return points;
  }, [chartSessions, selectedExerciseId]);

  // ── Exercices utilisés par l'user (pour le select du graphique) ────────────
  const usedExercises = useMemo(() => {
    const usedIds = new Set<string>();
    for (const s of chartSessions) {
      s.sets?.forEach((set) => usedIds.add(set.exercise_id));
    }
    return exercises.filter((e) => usedIds.has(e.id));
  }, [chartSessions, exercises]);

  // ── Groupes musculaires présents dans les séances (pour le select filtre) ──
  const availableMuscleGroups = useMemo(() => {
    const groups = new Set<string>();
    for (const s of chartSessions) {
      s.sets?.forEach((set) => {
        if (set.exercise?.muscle_group) groups.add(set.exercise.muscle_group);
      });
    }
    return Array.from(groups) as MuscleGroup[];
  }, [chartSessions]);

  // ── Records groupés par groupe musculaire ──────────────────────────────────
  const recordsByMuscleGroup = useMemo(() => {
    const result: Record<string, { exerciseName: string; weight: number; reps: number; date: string }[]> = {};

    for (const [exerciseId, record] of Object.entries(personalRecords)) {
      const exercise = exercises.find((e) => e.id === exerciseId);
      if (!exercise) continue;

      const group = exercise.muscle_group;
      if (!result[group]) result[group] = [];

      result[group].push({
        exerciseName: exercise.name,
        weight: record.weight,
        reps: record.reps,
        date: record.date,
      });
    }

    // Trier chaque groupe par poids décroissant
    for (const group of Object.keys(result)) {
      result[group].sort((a, b) => b.weight - a.weight);
    }

    return result;
  }, [personalRecords, exercises]);

  const groupedSessions = useMemo(() => {
    const groups: { month: string; items: typeof paginatedSessions }[] = [];
    const idx: Record<string, number> = {};
    for (const s of paginatedSessions) {
      const key = new Date(s.date)
        .toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
        .toUpperCase();
      if (idx[key] === undefined) { idx[key] = groups.length; groups.push({ month: key, items: [] }); }
      groups[idx[key]].items.push(s);
    }
    return groups;
  }, [paginatedSessions]);

  if (!profile) return null;

  return (
    <div className="space-y-6">
      {/* ── Banner hero ──────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative overflow-hidden bg-gradient-to-br from-red-950/60 via-[#0d0d0d] to-[#0a0a0a] border border-red-900/20 p-6 -mx-4 sm:mx-0"
      >
        <Dumbbell className="absolute right-4 top-1/2 -translate-y-1/2 w-28 h-28 text-red-900/10 pointer-events-none" />
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-400/50 mb-2">Musculation</p>
        <h1 className="text-5xl sm:text-6xl font-black uppercase tracking-tight text-white leading-none mb-3">
          MUSCU
        </h1>
        {(() => {
          const { level, current, needed, progress } = getLevelProgress(profile.musculation_xp);
          return (
            <>
              <p className="text-xs text-[#6b6b6b] mb-3">Niveau {level} · {profile.musculation_xp} XP</p>
              <div className="h-1 bg-white/5 overflow-hidden">
                <motion.div
                  className="h-full"
                  style={{ background: 'linear-gradient(to right, #7f1d1d, #ef4444)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress * 100}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
              <p className="text-[10px] text-[#3a3a3a] mt-1.5">{current} / {needed} XP → Niv. {level + 1}</p>
            </>
          );
        })()}
      </motion.div>

      {/* ── CTA Nouvelle séance ───────────────────────────────────────────────── */}
      <Link to="/musculation/new" className="-mx-4 sm:mx-0 block">
        <motion.div
          whileHover={{ backgroundColor: '#b91c1c' }}
          className="w-full py-4 bg-red-700 text-white font-black uppercase tracking-[0.15em] text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          NOUVELLE SÉANCE
        </motion.div>
      </Link>

      {/* ── Stats globales ───────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 gap-3"
      >
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-transparent">
              <BarChart2 className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-black text-red-400">{totalSessions}</p>
              <p className="text-xs text-[#a3a3a3]">Séances totales</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-transparent">
              <Weight className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-black text-red-400">
                {totalTonnage >= 1000
                  ? `${formatNumber(totalTonnage / 1000, 1)}t`
                  : `${formatNumber(totalTonnage)}kg`}
              </p>
              <p className="text-xs text-[#a3a3a3]">Tonnage total</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ── Onglets ────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="flex gap-1 p-1 bg-[#0d0d0d] border border-white/5">
          {(
            [
              { key: 'sessions', label: 'Séances', icon: <Dumbbell className="w-3.5 h-3.5" /> },
              { key: 'charts', label: 'Graphiques', icon: <TrendingUp className="w-3.5 h-3.5" /> },
              { key: 'records', label: 'Records', icon: <Trophy className="w-3.5 h-3.5" /> },
            ] as { key: ActiveTab; label: string; icon: React.ReactNode }[]
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 sm:px-3 rounded text-xs font-semibold transition-all ${
                activeTab === tab.key
                  ? 'bg-[#7f1d1d] text-white border-l-2 border-[#c9a870]/40'
                  : 'text-[#6b6b6b] hover:text-[#d4d4d4]'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── Contenu des onglets ─────────────────────────────────────────────── */}

      {loading && <Loader text="Chargement des séances..." />}

      {error && (
        <Card className="p-4">
          <p className="text-sm text-red-400 text-center">{error}</p>
        </Card>
      )}

      {!loading && !error && (
        <>
          {/* ══ Onglet Séances ════════════════════════════════════════════════ */}
          {activeTab === 'sessions' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              {/* Filtres */}
              <div className="space-y-3">
                {/* Filtre feedback */}
                <div className="flex gap-2 flex-wrap">
                  {(
                    [
                      { value: 'all', label: 'Tous' },
                      { value: 'facile', label: FEEDBACK_LABELS.facile },
                      { value: 'difficile', label: FEEDBACK_LABELS.difficile },
                      { value: 'mort', label: FEEDBACK_LABELS.mort },
                    ] as { value: FeedbackFilter; label: string }[]
                  ).map((f) => (
                    <button
                      key={f.value}
                      onClick={() => {
                        setFeedbackFilter(f.value);
                        setDisplayedCount(SESSIONS_PER_PAGE);
                      }}
                      className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                        feedbackFilter === f.value
                          ? 'bg-[#c9a870]/10 border border-[#c9a870]/30 text-[#c9a870]'
                          : 'bg-[#1c1c1c] border border-white/5 text-[#6b6b6b] hover:text-[#d4d4d4] hover:border-white/10'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Filtre groupe musculaire */}
                {availableMuscleGroups.length > 0 && (
                  <select
                    value={muscleGroupFilter}
                    onChange={(e) => {
                      setMuscleGroupFilter(e.target.value);
                      setDisplayedCount(SESSIONS_PER_PAGE);
                    }}
                    className="w-full w-full bg-[#111111] border border-white/8 text-[#d4d4d4] text-xs px-3 py-2.5 focus:outline-none focus:border-[#c9a870]/40 appearance-none cursor-pointer"
                  >
                    <option value="all">Tous les groupes musculaires</option>
                    {availableMuscleGroups.map((mg) => (
                      <option key={mg} value={mg}>
                        {MUSCLE_GROUP_LABELS[mg]}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Liste des séances */}
              {filteredSessions.length === 0 ? (
                <Card className="p-8 text-center">
                  <Dumbbell className="w-12 h-12 mx-auto mb-3 text-[#4a4a4a]" />
                  <p className="text-[#a3a3a3] text-sm mb-4">
                    Aucune séance ne correspond aux filtres.
                  </p>
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
                      {items.map((session) => (
                        <SessionCard
                          key={session.id}
                          session={session}
                          allExercises={exercises}
                          onUpdated={() => profile && loadData(profile.id)}
                          onDeleted={() => profile && loadData(profile.id)}
                        />
                      ))}
                    </div>
                  ))}

                  {/* Bouton "Charger plus" */}
                  {displayedCount < filteredSessions.length && (
                    <button
                      onClick={() => setDisplayedCount((c) => c + SESSIONS_PER_PAGE)}
                      className="w-full py-3 rounded bg-[#1c1c1c] border border-white/5 text-[#6b6b6b] hover:text-[#d4d4d4] hover:border-white/10 text-sm font-medium transition-all"
                    >
                      Charger plus ({filteredSessions.length - displayedCount} restantes)
                    </button>
                  )}
                </div>
              )}

              {/* CTA si aucune séance du tout */}
              {chartSessions.length === 0 && (
                <Card className="p-8 text-center">
                  <Dumbbell className="w-12 h-12 mx-auto mb-3 text-[#4a4a4a]" />
                  <p className="text-[#a3a3a3] text-sm mb-4">
                    Aucune séance enregistrée pour l&apos;instant.
                  </p>
                  <Link to="/musculation/new">
                    <Button icon={<Plus className="w-4 h-4" />}>
                      Première séance
                    </Button>
                  </Link>
                </Card>
              )}
            </motion.div>
          )}

          {/* ══ Onglet Graphiques ════════════════════════════════════════════ */}
          {activeTab === 'charts' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-5"
            >
              {/* Tonnage par semaine */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 rounded-lg bg-transparent">
                    <BarChart2 className="w-4 h-4 text-red-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#e5e5e5]">Tonnage par semaine</h3>
                </div>

                {weeklyTonnageData.every((d) => d.tonnage === 0) ? (
                  <p className="text-xs text-[#6b6b6b] text-center py-6">
                    Pas assez de données pour afficher ce graphique.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={weeklyTonnageData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <CartesianGrid {...CHART_GRID_PROPS} />
                      <XAxis dataKey="name" {...CHART_AXIS_PROPS} />
                      <YAxis
                        {...CHART_AXIS_PROPS}
                        tickFormatter={(v: number) =>
                          v >= 1000 ? `${(v / 1000).toFixed(1)}t` : `${v}`
                        }
                      />
                      <Tooltip
                        contentStyle={CHART_TOOLTIP_STYLE}
                        cursor={{ fill: '#1a1a1a' }}
                        formatter={(value: number | undefined) => [`${formatNumber(value ?? 0)} kg`, 'Tonnage'] as [string, string]}
                      />
                      <Bar dataKey="tonnage" fill="#991b1b" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>

              {/* Évolution d'exercice */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 rounded-lg bg-transparent">
                    <TrendingUp className="w-4 h-4 text-red-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#e5e5e5]">Évolution d&apos;exercice</h3>
                </div>

                {/* Select exercice */}
                <select
                  value={selectedExerciseId}
                  onChange={(e) => setSelectedExerciseId(e.target.value)}
                  className="w-full bg-[#1c1c1c] border border-white/5 text-[#d4d4d4] text-xs rounded px-3 py-2 mb-4 focus:outline-none focus:border-[#c9a870]/40 focus:ring-1 focus:ring-[#c9a870]/20 appearance-none cursor-pointer"
                >
                  <option value="">Choisir un exercice...</option>
                  {usedExercises.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name}
                    </option>
                  ))}
                </select>

                {!selectedExerciseId ? (
                  <p className="text-xs text-[#6b6b6b] text-center py-6">
                    Sélectionnez un exercice pour voir sa progression.
                  </p>
                ) : exerciseEvolutionData.length < 2 ? (
                  <p className="text-xs text-[#6b6b6b] text-center py-6">
                    Pas assez de données pour cet exercice (minimum 2 séances).
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={exerciseEvolutionData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <CartesianGrid {...CHART_GRID_PROPS} />
                      <XAxis dataKey="date" {...CHART_AXIS_PROPS} />
                      <YAxis
                        {...CHART_AXIS_PROPS}
                        tickFormatter={(v: number) => `${v}kg`}
                      />
                      <Tooltip
                        contentStyle={CHART_TOOLTIP_STYLE}
                        formatter={(value: number | undefined) => [`${value ?? 0} kg`, 'Charge max'] as [string, string]}
                      />
                      <Line
                        type="monotone"
                        dataKey="charge"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        dot={{ fill: '#8b5cf6', r: 3, strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: '#a78bfa' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Card>
            </motion.div>
          )}

          {/* ══ Onglet Records ════════════════════════════════════════════════ */}
          {activeTab === 'records' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-3"
            >
              {Object.keys(recordsByMuscleGroup).length === 0 ? (
                <Card className="p-8 text-center">
                  <Trophy className="w-12 h-12 mx-auto mb-3 text-[#4a4a4a]" />
                  <p className="text-[#a3a3a3] text-sm">
                    Aucun record personnel enregistré pour l&apos;instant.
                  </p>
                </Card>
              ) : (
                (Object.keys(MUSCLE_GROUP_LABELS) as MuscleGroup[])
                  .filter((mg) => recordsByMuscleGroup[mg]?.length > 0)
                  .map((mg) => (
                    <MuscleGroupAccordion
                      key={mg}
                      muscleGroup={mg}
                      records={recordsByMuscleGroup[mg]}
                    />
                  ))
              )}
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Types éditeur exercices ──────────────────────────────────────────────────

interface EditSetRow {
  reps: number;
  weight: number;
  rest_time: number | null;
}

interface EditExerciseBlock {
  localId: string;
  exercise: Exercise | null;
  searchQuery: string;
  showDropdown: boolean;
  sets: EditSetRow[];
}

function defaultEditSet(): EditSetRow {
  return { reps: 10, weight: 0, rest_time: null };
}

function defaultEditBlock(): EditExerciseBlock {
  return {
    localId: Math.random().toString(36).slice(2),
    exercise: null,
    searchQuery: '',
    showDropdown: false,
    sets: [defaultEditSet()],
  };
}

// ─── SessionCard ─────────────────────────────────────────────────────────────

function SessionCard({
  session,
  allExercises,
  onUpdated,
  onDeleted,
}: {
  session: WorkoutSession;
  allExercises: Exercise[];
  onUpdated: () => void;
  onDeleted: () => void;
}) {
  const navigate = useNavigate();
  const setsCount = session.sets?.length ?? 0;
  const exerciseCount = session.sets
    ? new Set(session.sets.map((s) => s.exercise_id)).size
    : 0;

  const feedback = session.feedback as Feedback | null;
  const feedbackLabel = feedback ? FEEDBACK_LABELS[feedback] : null;
  const feedbackColor = feedback ? FEEDBACK_COLORS[feedback] : 'text-[#6b6b6b]';

  // ── Detail state ─────────────────────────────────────────────────────────────
  const [showDetail, setShowDetail] = useState(false);

  // ── Edit state ──────────────────────────────────────────────────────────────
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editFeedback, setEditFeedback] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editBlocks, setEditBlocks] = useState<EditExerciseBlock[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── Delete state ────────────────────────────────────────────────────────────
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ── Tonnage preview ─────────────────────────────────────────────────────────
  const editTonnage = useMemo(() => {
    return editBlocks.reduce((sum, b) => sum + b.sets.reduce((s2, s) => s2 + s.reps * s.weight, 0), 0);
  }, [editBlocks]);

  // ── Autocomplete helper ─────────────────────────────────────────────────────
  function filteredExercises(query: string) {
    if (!query.trim()) return allExercises.slice(0, 8);
    const q = query.toLowerCase();
    return allExercises
      .filter(e => e.name.toLowerCase().includes(q) || MUSCLE_GROUP_LABELS[e.muscle_group]?.toLowerCase().includes(q))
      .slice(0, 8);
  }

  // ── Open edit ───────────────────────────────────────────────────────────────
  function openEdit() {
    setEditName(session.name ?? '');
    setEditDate(session.date.slice(0, 10));
    setEditFeedback(session.feedback ?? '');
    setEditNotes(session.notes ?? '');
    setSaveError(null);

    // Grouper les sets existants par exercice
    if (session.sets && session.sets.length > 0) {
      const grouped: Map<string, EditExerciseBlock> = new Map();
      for (const set of session.sets) {
        if (!set.exercise_id) continue;
        if (!grouped.has(set.exercise_id)) {
          grouped.set(set.exercise_id, {
            localId: Math.random().toString(36).slice(2),
            exercise: set.exercise ?? null,
            searchQuery: set.exercise?.name ?? '',
            showDropdown: false,
            sets: [],
          });
        }
        grouped.get(set.exercise_id)!.sets.push({
          reps: set.reps,
          weight: set.weight,
          rest_time: set.rest_time,
        });
      }
      setEditBlocks(Array.from(grouped.values()));
    } else {
      setEditBlocks([defaultEditBlock()]);
    }

    setShowEdit(true);
  }

  // ── Exercise block helpers ──────────────────────────────────────────────────
  function updateBlock(localId: string, patch: Partial<EditExerciseBlock>) {
    setEditBlocks(prev => prev.map(b => b.localId === localId ? { ...b, ...patch } : b));
  }

  function removeBlock(localId: string) {
    setEditBlocks(prev => prev.filter(b => b.localId !== localId));
  }

  function updateEditSet(localId: string, idx: number, patch: Partial<EditSetRow>) {
    setEditBlocks(prev => prev.map(b => {
      if (b.localId !== localId) return b;
      return { ...b, sets: b.sets.map((s, i) => i === idx ? { ...s, ...patch } : s) };
    }));
  }

  function addEditSet(localId: string) {
    setEditBlocks(prev => prev.map(b => {
      if (b.localId !== localId) return b;
      const last = b.sets[b.sets.length - 1] ?? defaultEditSet();
      return { ...b, sets: [...b.sets, { ...last }] };
    }));
  }

  function removeEditSet(localId: string, idx: number) {
    setEditBlocks(prev => prev.map(b => {
      if (b.localId !== localId || b.sets.length <= 1) return b;
      return { ...b, sets: b.sets.filter((_, i) => i !== idx) };
    }));
  }

  // ── Save ────────────────────────────────────────────────────────────────────
  async function handleSave() {
    const validBlocks = editBlocks.filter(b => b.exercise !== null);
    if (validBlocks.length === 0) {
      setSaveError('Ajoute au moins un exercice.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      // Sauvegarder les métadonnées
      await workoutService.updateSession(session.id, {
        name: editName.trim() || null,
        date: editDate,
        feedback: editFeedback || null,
        notes: editNotes.trim() || null,
      });

      // Remplacer les séries
      const sets = validBlocks.flatMap((b, _) =>
        b.sets.map((s, si) => ({
          exercise_id: b.exercise!.id,
          set_number: si + 1,
          reps: s.reps,
          weight: s.weight,
          rest_time: s.rest_time,
        }))
      );
      await workoutService.replaceSets(session.id, sets);

      setShowEdit(false);
      onUpdated();
    } catch {
      setSaveError('Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  }

  // ── Delete ──────────────────────────────────────────────────────────────────
  async function handleDelete() {
    setDeleting(true);
    try {
      await workoutService.deleteSession(session.id);
      setShowDelete(false);
      onDeleted();
    } catch {
      setDeleting(false);
    }
  }

  const exerciseRows = useMemo(() => {
    const map: Record<string, { name: string; group: string; sets: { reps: number; weight: number }[] }> = {};
    for (const s of (session.sets ?? [])) {
      const id = s.exercise_id ?? s.exercise?.name ?? String(Math.random());
      if (!map[id]) map[id] = { name: s.exercise?.name ?? '—', group: s.exercise?.muscle_group ?? '', sets: [] };
      map[id].sets.push({ reps: s.reps, weight: s.weight });
    }
    return Object.values(map);
  }, [session.sets]);

  return (
    <>
      <div className={`bg-[#111111] border overflow-hidden transition-all ${
        feedback === 'mort' ? 'border-red-900/70' :
        feedback === 'difficile' ? 'border-amber-900/70' :
        feedback === 'facile' ? 'border-emerald-900/70' :
        'border-white/5'
      }`}>
        {/* Header + content */}
        <div className="flex">
          <div className="flex-1 min-w-0 px-4 pt-3.5 pb-3">
            {/* Ligne 1: date + feedback + relative time */}
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-rajdhani font-black text-base text-white uppercase tracking-wide">
                  {formatDate(session.date, { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()}
                </span>
                {session.name && (
                  <span className="text-xs text-[#6b6b6b] truncate hidden sm:block">{session.name}</span>
                )}
                {feedbackLabel && (
                  <span className={`text-sm font-bold font-rajdhani flex-shrink-0 ${feedbackColor}`}>{feedbackLabel}</span>
                )}
              </div>
              <span className="text-xs text-[#3a3a3a] flex-shrink-0">{formatRelativeTime(session.date)}</span>
            </div>

            {/* Stats line */}
            <div className="flex items-center gap-2 font-rajdhani font-bold text-xs uppercase tracking-widest mb-3">
              {session.total_tonnage != null && session.total_tonnage > 0 && (
                <>
                  <span className="text-red-400">{formatNumber(session.total_tonnage)} KG</span>
                  <span className="text-[#2a2a2a]">·</span>
                </>
              )}
              <span className="text-[#5a5a5a]">{exerciseCount} EX</span>
              <span className="text-[#2a2a2a]">·</span>
              <span className="text-[#5a5a5a]">{setsCount} SÉRIES</span>
            </div>

            {/* Divider */}
            <div className="border-t border-white/5 mb-3" />

            {/* Exercise list */}
            {exerciseRows.length > 0 ? (
              <div className="space-y-1.5">
                {exerciseRows.map((ex, i) => {
                  const avgReps = ex.sets.length > 0 ? Math.round(ex.sets.reduce((s, r) => s + r.reps, 0) / ex.sets.length) : 0;
                  const maxWeight = Math.max(...ex.sets.map(s => s.weight));
                  return (
                    <div key={i} className="flex items-start gap-2 min-w-0">
                      <span className="font-rajdhani font-black text-red-700 w-5 flex-shrink-0 text-xs mt-0.5">{String(i+1).padStart(2,'0')}</span>
                      <div className="flex-1 min-w-0">
                        <span className="font-rajdhani font-semibold text-[#d4d4d4] uppercase tracking-wide text-xs">{ex.name}</span>
                        <span className="text-[#5a5a5a] text-xs font-rajdhani ml-2">{ex.sets.length}×{avgReps}</span>
                        {maxWeight > 0 && (
                          <span className="font-rajdhani font-bold text-[#c9a870] text-xs ml-2">{maxWeight} kg</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-[#4a4a4a]">Aucun exercice</p>
            )}

            {session.notes && (
              <p className="text-xs text-[#4a4a4a] italic mt-2 border-t border-white/5 pt-2 truncate">{session.notes}</p>
            )}
          </div>
        </div>

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
            onClick={() => navigate('/musculation/new', { state: { copyFrom: session } })}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-rajdhani font-bold uppercase tracking-wide text-[#5a5a5a] hover:text-red-400 hover:bg-white/5 transition-all"
          >
            <Copy className="w-3.5 h-3.5" /> Copier
          </button>
          <div className="w-px h-5 bg-white/5" />
          <button
            onClick={openEdit}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-rajdhani font-bold uppercase tracking-wide text-[#5a5a5a] hover:text-[#e5e5e5] hover:bg-white/5 transition-all"
          >
            <Pencil className="w-3.5 h-3.5" /> Modif
          </button>
          <div className="w-px h-5 bg-white/5" />
          <button
            onClick={() => setShowDelete(true)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-rajdhani font-bold uppercase tracking-wide text-[#5a5a5a] hover:text-red-400 hover:bg-red-900/10 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" /> Suppr
          </button>
        </div>
      </div>

      {/* ── Modal détail séance ─────────────────────────────────────────────────── */}
      {(() => {
        type SetItem = NonNullable<typeof session.sets>[number];
        const grouped: Record<string, { name: string; muscleGroup: string; sets: SetItem[] }> = {};
        for (const s of (session.sets ?? [])) {
          const id = s.exercise_id;
          if (!grouped[id]) grouped[id] = { name: s.exercise?.name ?? '—', muscleGroup: s.exercise?.muscle_group ?? '', sets: [] };
          grouped[id].sets.push(s);
        }
        const groups = Object.values(grouped).map(g => ({ ...g, sets: g.sets.sort((a, b) => a.set_number - b.set_number) }));
        return (
          <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Détails — Séance muscu" size="md">
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {session.name && (
                <h3 className="font-rajdhani font-bold text-lg text-[#f5f5f5] tracking-wide uppercase border-b border-white/5 pb-2">
                  {session.name}
                </h3>
              )}
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="text-[#a3a3a3]">{formatDate(session.date, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                {session.total_tonnage != null && session.total_tonnage > 0 && (
                  <span className="font-rajdhani font-bold text-[#c9a870]">{session.total_tonnage.toLocaleString('fr-FR')} kg soulevés</span>
                )}
                {feedbackLabel && (
                  <span className={`text-xs border px-2 py-0.5 font-rajdhani font-semibold uppercase ${feedbackColor}`}>{feedbackLabel}</span>
                )}
              </div>

              {session.notes && (
                <p className="text-sm text-[#a3a3a3] italic border-l-2 border-[#c9a870]/30 pl-3">{session.notes}</p>
              )}

              {groups.length === 0 && <p className="text-sm text-[#6b6b6b]">Aucun exercice enregistré.</p>}
              <div className="space-y-3">
                {groups.map((group, gi) => (
                  <div key={gi} className="border border-white/5">
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 bg-white/2">
                      <Dumbbell className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                      <span className="font-rajdhani font-semibold text-[#f5f5f5] text-sm tracking-wide uppercase">{group.name}</span>
                      <span className="text-xs text-[#6b6b6b] ml-auto">{MUSCLE_GROUP_LABELS[group.muscleGroup as keyof typeof MUSCLE_GROUP_LABELS] ?? group.muscleGroup}</span>
                    </div>
                    <div className="divide-y divide-white/5">
                      {(group.sets as any[]).map((s, si) => (
                        <div key={si} className="flex items-center justify-between px-3 py-2 text-sm">
                          <span className="text-[#6b6b6b] w-14">Série {s.set_number}</span>
                          <span className="text-[#d4d4d4]">{s.reps} reps</span>
                          <span className="font-rajdhani font-bold text-[#c9a870]">{s.weight} kg</span>
                          <span className="text-[#4a4a4a] text-xs">{(s.reps * s.weight).toLocaleString('fr-FR')} kg</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* ── Modal édition ─────────────────────────────────────────────────── */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Modifier la séance" size="xl">
        <div className="p-5 space-y-5">
          {/* Métadonnées */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Input
                label="Titre (optionnel)"
                placeholder="Ex: Push day, Legs..."
                value={editName}
                onChange={e => setEditName(e.target.value)}
              />
            </div>
            <Input
              label="Date"
              type="date"
              value={editDate}
              onChange={e => setEditDate(e.target.value)}
            />
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Ressenti</label>
              <select
                value={editFeedback}
                onChange={e => setEditFeedback(e.target.value)}
                className="w-full bg-[#111111] border border-white/8 text-[#d4d4d4] text-sm px-3 py-2.5 focus:outline-none focus:border-[#c9a870]/40 appearance-none cursor-pointer"
              >
                <option value="">— Aucun —</option>
                <option value="facile">{FEEDBACK_LABELS.facile}</option>
                <option value="difficile">{FEEDBACK_LABELS.difficile}</option>
                <option value="mort">{FEEDBACK_LABELS.mort}</option>
              </select>
            </div>
            <div className="col-span-2">
              <Textarea
                label="Notes (optionnel)"
                placeholder="Remarques..."
                value={editNotes}
                onChange={e => setEditNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          {/* Séparateur */}
          <div className="h-px bg-white/5" />

          {/* Exercices */}
          <div>
            <p className="text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider mb-3">Exercices</p>

            <AnimatePresence>
              {editBlocks.map((block, bIdx) => (
                <motion.div
                  key={block.localId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="mb-3 p-3 bg-[#161616] border border-white/5 rounded"
                >
                  {/* Sélecteur exercice */}
                  <div className="flex items-start gap-2 mb-3">
                    <div className="flex-1 relative">
                      <label className="text-xs text-[#6b6b6b] mb-1 block">Exercice {bIdx + 1}</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6b6b6b]" />
                        <input
                          type="text"
                          placeholder="Rechercher..."
                          value={block.searchQuery}
                          onChange={e => updateBlock(block.localId, {
                            searchQuery: e.target.value,
                            showDropdown: true,
                            exercise: e.target.value !== block.exercise?.name ? null : block.exercise,
                          })}
                          onFocus={() => updateBlock(block.localId, { showDropdown: true })}
                          className="w-full bg-[#1c1c1c] border border-white/8 pl-9 pr-9 py-2 text-sm text-[#f5f5f5] placeholder-[#4a4a4a] outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-all"
                        />
                        {block.exercise && (
                          <button
                            type="button"
                            onClick={() => updateBlock(block.localId, { exercise: null, searchQuery: '', showDropdown: true })}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b6b6b] hover:text-[#d4d4d4]"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Dropdown */}
                      {block.showDropdown && !block.exercise && (
                        <div className="absolute z-30 w-full mt-1 bg-[#1c1c1c] border border-white/8 rounded shadow-xl overflow-hidden">
                          {filteredExercises(block.searchQuery).length === 0 ? (
                            <p className="px-4 py-3 text-sm text-[#a3a3a3]">Aucun résultat</p>
                          ) : (
                            filteredExercises(block.searchQuery).map(ex => (
                              <button
                                key={ex.id}
                                type="button"
                                onMouseDown={() => updateBlock(block.localId, {
                                  exercise: ex,
                                  searchQuery: ex.name,
                                  showDropdown: false,
                                })}
                                className="w-full px-4 py-2.5 text-left hover:bg-[#2a2a2a] transition-colors flex items-center justify-between"
                              >
                                <span className="text-sm text-[#e5e5e5]">{ex.name}</span>
                                <span className="text-xs text-[#6b6b6b]">{MUSCLE_GROUP_LABELS[ex.muscle_group]}</span>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeBlock(block.localId)}
                      className="mt-5 p-1.5 rounded text-[#6b6b6b] hover:text-red-400 hover:bg-red-900/10 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Tag groupe musculaire */}
                  {block.exercise && (
                    <span className="text-xs px-2 py-0.5 bg-transparent border border-red-800/40 text-red-300 mb-2 inline-block">
                      {MUSCLE_GROUP_LABELS[block.exercise.muscle_group]}
                    </span>
                  )}

                  {/* Tableau séries */}
                  <div className="space-y-1.5">
                    <div className="grid grid-cols-[24px_1fr_1fr_1fr_24px] gap-2 px-1">
                      <span className="text-xs text-[#4a4a4a] text-center">#</span>
                      <span className="text-xs text-[#4a4a4a] text-center">Reps</span>
                      <span className="text-xs text-[#4a4a4a] text-center">kg</span>
                      <span className="text-xs text-[#4a4a4a] text-center">Repos(s)</span>
                      <span />
                    </div>

                    {block.sets.map((set, si) => (
                      <div key={si} className="grid grid-cols-[24px_1fr_1fr_1fr_24px] gap-2 items-center">
                        <span className="text-xs text-[#4a4a4a] text-center font-mono">{si + 1}</span>
                        <input
                          type="number" min={1} max={999}
                          value={set.reps}
                          onChange={e => updateEditSet(block.localId, si, { reps: parseInt(e.target.value) || 0 })}
                          className="w-full bg-[#0d0d0d] border border-white/8 px-2 py-1.5 text-sm text-[#f5f5f5] text-center outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-all"
                        />
                        <input
                          type="number" min={0} max={9999} step={0.5}
                          value={set.weight}
                          onChange={e => updateEditSet(block.localId, si, { weight: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-[#0d0d0d] border border-white/8 px-2 py-1.5 text-sm text-[#f5f5f5] text-center outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-all"
                        />
                        <input
                          type="number" min={0} max={600} step={5}
                          placeholder="—"
                          value={set.rest_time ?? ''}
                          onChange={e => updateEditSet(block.localId, si, { rest_time: e.target.value ? parseInt(e.target.value) : null })}
                          className="w-full bg-[#0d0d0d] border border-white/8 px-2 py-1.5 text-sm text-[#f5f5f5] text-center outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-all placeholder-[#2a2a2a]"
                        />
                        <button
                          type="button"
                          onClick={() => removeEditSet(block.localId, si)}
                          disabled={block.sets.length <= 1}
                          className="p-1 text-[#4a4a4a] hover:text-red-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => addEditSet(block.localId)}
                      className="w-full py-1.5 mt-1 text-xs text-[#6b6b6b] hover:text-[#d4d4d4] border border-dashed border-white/8 hover:border-red-500/40 transition-all rounded"
                    >
                      + Ajouter série
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <button
              type="button"
              onClick={() => setEditBlocks(prev => [...prev, defaultEditBlock()])}
              className="w-full py-2 text-xs text-[#6b6b6b] hover:text-[#d4d4d4] border border-dashed border-white/8 hover:border-white/20 transition-all rounded"
            >
              + Ajouter exercice
            </button>
          </div>

          {/* Tonnage preview */}
          {editTonnage > 0 && (
            <div className="flex items-center justify-between px-3 py-2 bg-transparent border border-red-900/30 rounded">
              <span className="text-xs text-red-300">Tonnage total</span>
              <span className="text-sm font-black text-red-400">{formatNumber(editTonnage)} kg</span>
            </div>
          )}

          {saveError && <p className="text-sm text-red-400">{saveError}</p>}

          <div className="flex gap-3 pt-1">
            <Button variant="secondary" onClick={() => setShowEdit(false)} className="flex-1">Annuler</Button>
            <Button loading={saving} onClick={handleSave} className="flex-1">
              {saving ? 'Sauvegarde...' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Modal suppression ──────────────────────────────────────────────── */}
      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Supprimer la séance" size="sm">
        <div className="p-5 space-y-4">
          <p className="text-sm text-[#a3a3a3]">
            Cette action est irréversible. La séance et toutes ses séries seront supprimées.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowDelete(false)} className="flex-1">Annuler</Button>
            <Button
              loading={deleting}
              onClick={handleDelete}
              className="flex-1 bg-transparent border border-red-800/60 text-red-400 hover:bg-red-900/10 hover:border-red-700"
            >
              {deleting ? 'Suppression...' : 'Supprimer'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

// ─── MuscleGroupAccordion ─────────────────────────────────────────────────────

interface RecordEntry {
  exerciseName: string;
  weight: number;
  reps: number;
  date: string;
}

function MuscleGroupAccordion({
  muscleGroup,
  records,
}: {
  muscleGroup: MuscleGroup;
  records: RecordEntry[];
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="bg-[#111111] border border-white/5 rounded overflow-hidden">
      {/* Header accordion */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#181818] transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-transparent">
            <Trophy className="w-3.5 h-3.5 text-red-400" />
          </div>
          <span className="text-sm font-semibold text-[#e5e5e5]">
            {MUSCLE_GROUP_LABELS[muscleGroup]}
          </span>
          <span className="text-xs text-[#6b6b6b] bg-white/5 px-2 py-0.5">
            {records.length}
          </span>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-[#6b6b6b]" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#6b6b6b]" />
        )}
      </button>

      {/* Corps accordion */}
      {open && (
        <div className="px-4 pb-3 space-y-2">
          <div className="h-px bg-slate-700/50 mb-3" />
          {records.map((record, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2 px-3 bg-[#181818] rounded"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-[#e5e5e5] truncate">
                  {record.exerciseName}
                </p>
                <p className="text-xs text-[#6b6b6b] mt-0.5">
                  {formatDate(record.date, { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                <span className="text-sm font-black text-red-400">
                  {record.weight} kg
                </span>
                <span className="text-xs text-[#6b6b6b]">
                  &times; {record.reps}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
