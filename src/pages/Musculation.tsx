import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell, Plus, BarChart2, Weight, TrendingUp, Trophy, ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { workoutService } from '../services/workout.service';
import { Card, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Loader } from '../components/common/Loader';
import {
  formatRelativeTime,
  formatDate,
  formatNumber,
  getWeekStart,
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
  stroke: '#1e293b',
};

const CHART_AXIS_PROPS = {
  tick: { fill: '#64748b', fontSize: 11 },
  tickLine: false as const,
  axisLine: false as const,
};

const CHART_TOOLTIP_STYLE = {
  backgroundColor: '#0f172a',
  border: '1px solid #334155',
  borderRadius: '12px',
  fontSize: '12px',
  color: '#f1f5f9',
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
  useEffect(() => {
    if (!profile) return;

    const userId = profile.id;
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
        // Les 50 premières servent aux graphiques
        setChartSessions(allSessions);
        // Les 10 premières pour l'affichage initial séances
        setSessions(allSessions.slice(0, SESSIONS_PER_PAGE));
        setTotalSessions(count);
        setTotalTonnage(tonnage);
        setExercises(exList);
        setPersonalRecords(prs);
      })
      .catch(() => setError('Impossible de charger les données.'))
      .finally(() => setLoading(false));
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

  if (!profile) return null;

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-red-900/20 border border-red-800/30">
            <Dumbbell className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Musculation</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Niveau {profile.musculation_level} &middot; {profile.musculation_xp} XP
            </p>
          </div>
        </div>
        <Link to="/musculation/new">
          <Button icon={<Plus className="w-4 h-4" />} size="md">
            Nouvelle séance
          </Button>
        </Link>
      </motion.div>

      {/* ── Stats globales ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 gap-3"
      >
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-900/20">
              <BarChart2 className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-black text-red-400">{totalSessions}</p>
              <p className="text-xs text-slate-400">Séances totales</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-500/15">
              <Weight className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-black text-red-400">
                {totalTonnage >= 1000
                  ? `${formatNumber(totalTonnage / 1000, 1)}t`
                  : `${formatNumber(totalTonnage)}kg`}
              </p>
              <p className="text-xs text-slate-400">Tonnage total</p>
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
        <div className="flex gap-1 p-1 bg-slate-800/60 rounded-2xl border border-slate-700/50">
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
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                activeTab === tab.key
                  ? 'bg-red-800 text-white shadow-lg shadow-red-900/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.icon}
              {tab.label}
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
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        feedbackFilter === f.value
                          ? 'bg-red-900/20 border border-red-800/40 text-red-300'
                          : 'bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-slate-200 hover:border-slate-600'
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
                    className="w-full bg-slate-800/60 border border-slate-700/50 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-red-800/60 focus:ring-1 focus:ring-red-800/30 appearance-none cursor-pointer"
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
                  <Dumbbell className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                  <p className="text-slate-400 text-sm mb-4">
                    Aucune séance ne correspond aux filtres.
                  </p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {paginatedSessions.map((session, i) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * Math.min(i, 5) }}
                    >
                      <SessionCard session={session} />
                    </motion.div>
                  ))}

                  {/* Bouton "Charger plus" */}
                  {displayedCount < filteredSessions.length && (
                    <button
                      onClick={() => setDisplayedCount((c) => c + SESSIONS_PER_PAGE)}
                      className="w-full py-3 rounded-2xl bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-slate-200 hover:border-slate-600 text-sm font-medium transition-all"
                    >
                      Charger plus ({filteredSessions.length - displayedCount} restantes)
                    </button>
                  )}
                </div>
              )}

              {/* CTA si aucune séance du tout */}
              {chartSessions.length === 0 && (
                <Card className="p-8 text-center">
                  <Dumbbell className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                  <p className="text-slate-400 text-sm mb-4">
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
                  <div className="p-1.5 rounded-lg bg-red-900/20">
                    <BarChart2 className="w-4 h-4 text-red-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-200">Tonnage par semaine</h3>
                </div>

                {weeklyTonnageData.every((d) => d.tonnage === 0) ? (
                  <p className="text-xs text-slate-500 text-center py-6">
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
                        cursor={{ fill: '#1e293b' }}
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
                  <div className="p-1.5 rounded-lg bg-red-500/15">
                    <TrendingUp className="w-4 h-4 text-red-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-200">Évolution d&apos;exercice</h3>
                </div>

                {/* Select exercice */}
                <select
                  value={selectedExerciseId}
                  onChange={(e) => setSelectedExerciseId(e.target.value)}
                  className="w-full bg-slate-800/60 border border-slate-700/50 text-slate-300 text-xs rounded-xl px-3 py-2 mb-4 focus:outline-none focus:border-red-500/60 focus:ring-1 focus:ring-red-500/30 appearance-none cursor-pointer"
                >
                  <option value="">Choisir un exercice...</option>
                  {usedExercises.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name}
                    </option>
                  ))}
                </select>

                {!selectedExerciseId ? (
                  <p className="text-xs text-slate-500 text-center py-6">
                    Sélectionnez un exercice pour voir sa progression.
                  </p>
                ) : exerciseEvolutionData.length < 2 ? (
                  <p className="text-xs text-slate-500 text-center py-6">
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
                  <Trophy className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                  <p className="text-slate-400 text-sm">
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

// ─── SessionCard ─────────────────────────────────────────────────────────────

function SessionCard({ session }: { session: WorkoutSession }) {
  const setsCount = session.sets?.length ?? 0;
  const exerciseCount = session.sets
    ? new Set(session.sets.map((s) => s.exercise_id)).size
    : 0;

  const feedback = session.feedback as Feedback | null;
  const feedbackLabel = feedback ? FEEDBACK_LABELS[feedback] : null;
  const feedbackColor = feedback ? FEEDBACK_COLORS[feedback] : 'text-slate-500';

  return (
    <div className="flex items-center gap-3 p-4 bg-slate-900/80 border border-slate-700/50 rounded-2xl hover:border-slate-600 hover:bg-slate-800/60 transition-all">
      <div className="p-2.5 bg-red-900/20 border border-red-800/30 rounded-xl flex-shrink-0">
        <Dumbbell className="w-5 h-5 text-red-400" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-semibold text-slate-200">
            {formatDate(session.date, { weekday: 'short', day: 'numeric', month: 'short' })}
          </p>
          {feedbackLabel && (
            <span className={`text-xs ${feedbackColor}`}>{feedbackLabel}</span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          {session.total_tonnage != null && session.total_tonnage > 0 && (
            <span className="font-medium text-slate-300">
              {formatNumber(session.total_tonnage)} kg
            </span>
          )}
          {exerciseCount > 0 && (
            <span>{exerciseCount} exercice{exerciseCount > 1 ? 's' : ''}</span>
          )}
          {setsCount > 0 && (
            <span>{setsCount} série{setsCount > 1 ? 's' : ''}</span>
          )}
        </div>
        {session.notes && (
          <p className="text-xs text-slate-500 mt-1 truncate">{session.notes}</p>
        )}
      </div>

      <span className="text-xs text-slate-500 flex-shrink-0">
        {formatRelativeTime(session.date)}
      </span>
    </div>
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
    <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl overflow-hidden">
      {/* Header accordion */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-red-500/15">
            <Trophy className="w-3.5 h-3.5 text-red-400" />
          </div>
          <span className="text-sm font-semibold text-slate-200">
            {MUSCLE_GROUP_LABELS[muscleGroup]}
          </span>
          <span className="text-xs text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-full">
            {records.length}
          </span>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-slate-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-500" />
        )}
      </button>

      {/* Corps accordion */}
      {open && (
        <div className="px-4 pb-3 space-y-2">
          <div className="h-px bg-slate-700/50 mb-3" />
          {records.map((record, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2 px-3 bg-slate-800/40 rounded-xl"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-200 truncate">
                  {record.exerciseName}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {formatDate(record.date, { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                <span className="text-sm font-black text-red-400">
                  {record.weight} kg
                </span>
                <span className="text-xs text-slate-500">
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
