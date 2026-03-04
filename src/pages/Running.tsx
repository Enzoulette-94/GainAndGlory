import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  PersonStanding,
  Plus,
  MapPin,
  Clock,
  Trophy,
  BarChart2,
  List,
  ChevronDown,
  Activity,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { runningService } from '../services/running.service';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Loader } from '../components/common/Loader';
import {
  formatRelativeTime,
  formatDate,
  formatDistance,
  formatDuration,
  formatPace,
  getWeekStart,
} from '../utils/calculations';
import {
  RUN_TYPE_LABELS,
  FEEDBACK_LABELS,
  FEEDBACK_COLORS,
  RUNNING_RECORD_DISTANCES,
} from '../utils/constants';
import type { RunningSession } from '../types/models';
import type { Feedback, RunType } from '../types/enums';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'sorties' | 'graphiques' | 'records';
type RunTypeFilter = 'tous' | 'fractionne' | 'endurance' | 'tempo';
type PeriodFilter = 'semaine' | 'mois' | 'tout';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getWeekLabel(weekStart: Date): string {
  return weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

// ─── Custom Tooltip Allure ────────────────────────────────────────────────────

interface PaceTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: { date: string } }>;
}

function PaceTooltip({ active, payload }: PaceTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const raw = payload[0];
  return (
    <div className="bg-[#1c1c1c] border border-white/8 rounded px-3 py-2 text-xs shadow-lg">
      <p className="text-[#a3a3a3] mb-0.5">
        {formatDate(raw.payload.date, { day: 'numeric', month: 'short' })}
      </p>
      <p className="text-blue-500 font-semibold">{formatPace(raw.value)}</p>
    </div>
  );
}

// ─── Custom Tooltip Distance ──────────────────────────────────────────────────

interface DistTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function DistTooltip({ active, payload, label }: DistTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-[#1c1c1c] border border-white/8 rounded px-3 py-2 text-xs shadow-lg">
      <p className="text-[#a3a3a3] mb-0.5">{label}</p>
      <p className="text-blue-500 font-semibold">{payload[0].value.toFixed(1)} km</p>
    </div>
  );
}

// ─── Custom Tooltip FC ────────────────────────────────────────────────────────

interface HrTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: { date: string } }>;
}

function HrTooltip({ active, payload }: HrTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const raw = payload[0];
  return (
    <div className="bg-[#1c1c1c] border border-white/8 rounded px-3 py-2 text-xs shadow-lg">
      <p className="text-[#a3a3a3] mb-0.5">
        {formatDate(raw.payload.date, { day: 'numeric', month: 'short' })}
      </p>
      <p className="text-rose-400 font-semibold">{raw.value} bpm</p>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export function RunningPage() {
  const { profile } = useAuth();

  // Données
  const [allSessions, setAllSessions] = useState<RunningSession[]>([]);
  const [totalSessions, setTotalSessions] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);
  const [records, setRecords] = useState<Record<number, { duration: number; pace: number; date: string }>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Navigation
  const [activeTab, setActiveTab] = useState<Tab>('sorties');

  // Filtres onglet Sorties
  const [typeFilter, setTypeFilter] = useState<RunTypeFilter>('tous');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('tout');
  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => {
    if (!profile) return;
    const userId = profile.id;
    setLoading(true);
    setError(null);

    Promise.all([
      runningService.getSessions(userId, 50),
      runningService.getSessionsCount(userId),
      runningService.getTotalDistance(userId),
      runningService.getPersonalRecords(userId),
    ])
      .then(([recentSessions, count, distance, prs]) => {
        setAllSessions(recentSessions);
        setTotalSessions(count);
        setTotalDistance(distance);
        setRecords(prs);
      })
      .catch(() => setError('Impossible de charger les données.'))
      .finally(() => setLoading(false));
  }, [profile]);

  // ── Sorties filtrées ────────────────────────────────────────────────────────

  const filteredSessions = useMemo(() => {
    let result = [...allSessions];

    // Filtre type
    if (typeFilter !== 'tous') {
      result = result.filter((s) => s.run_type === typeFilter);
    }

    // Filtre période
    if (periodFilter !== 'tout') {
      const now = new Date();
      if (periodFilter === 'semaine') {
        const weekStart = getWeekStart(now);
        result = result.filter((s) => new Date(s.date) >= weekStart);
      } else if (periodFilter === 'mois') {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        result = result.filter((s) => new Date(s.date) >= monthStart);
      }
    }

    return result;
  }, [allSessions, typeFilter, periodFilter]);

  const visibleSessions = filteredSessions.slice(0, visibleCount);
  const hasMore = visibleCount < filteredSessions.length;

  // ── Données graphiques ──────────────────────────────────────────────────────

  const weeklyDistanceData = useMemo(() => {
    const weeks: Record<string, { label: string; distance: number }> = {};
    const now = new Date();

    // Générer les 8 dernières semaines (y compris la courante)
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      const ws = getWeekStart(d);
      const key = ws.toISOString().slice(0, 10);
      if (!weeks[key]) {
        weeks[key] = { label: getWeekLabel(ws), distance: 0 };
      }
    }

    allSessions.forEach((s) => {
      const ws = getWeekStart(new Date(s.date));
      const key = ws.toISOString().slice(0, 10);
      if (weeks[key]) {
        weeks[key].distance += s.distance;
      }
    });

    return Object.entries(weeks).map(([, v]) => v);
  }, [allSessions]);

  const paceEvolutionData = useMemo(() => {
    return allSessions
      .filter((s) => s.pace_min_per_km && s.pace_min_per_km > 0)
      .slice()
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((s) => ({ date: s.date, pace: s.pace_min_per_km as number }));
  }, [allSessions]);

  const hrEvolutionData = useMemo(() => {
    return allSessions
      .filter((s) => s.avg_heart_rate && s.avg_heart_rate > 0)
      .slice()
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((s) => ({ date: s.date, hr: s.avg_heart_rate as number }));
  }, [allSessions]);

  const hasHrData = hrEvolutionData.length > 0;

  // ── Formatage allure pour axe Y ─────────────────────────────────────────────

  const formatPaceAxis = (value: number) => {
    if (!value) return '';
    const minutes = Math.floor(value);
    const seconds = Math.round((value - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!profile) return null;

  // ── Onglets config ──────────────────────────────────────────────────────────

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'sorties', label: 'Sorties', icon: <List className="w-3.5 h-3.5" /> },
    { key: 'graphiques', label: 'Graphiques', icon: <BarChart2 className="w-3.5 h-3.5" /> },
    { key: 'records', label: 'Records', icon: <Trophy className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded bg-transparent border border-blue-900/40">
            <PersonStanding className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Running</h1>
            <p className="text-[#a3a3a3] text-sm mt-0.5">
              Niveau {profile.running_level} &middot; {profile.running_xp} XP
            </p>
          </div>
        </div>
        <Link to="/running/new">
          <Button
            icon={<Plus className="w-4 h-4" />}
            size="md"
            className="bg-transparent border border-blue-800/60 text-blue-500 hover:bg-blue-900/10 hover:border-blue-700"
          >
            Nouvelle course
          </Button>
        </Link>
      </motion.div>

      {/* ── Stats globales ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 gap-3"
      >
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-transparent">
              <PersonStanding className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-black text-blue-500">{totalSessions}</p>
              <p className="text-xs text-[#a3a3a3]">Sorties totales</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-transparent">
              <MapPin className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-black text-blue-500">
                {totalDistance >= 1000
                  ? `${(totalDistance / 1000).toFixed(1)}k`
                  : `${Math.round(totalDistance)}`}
                <span className="text-base ml-0.5">km</span>
              </p>
              <p className="text-xs text-[#a3a3a3]">Distance totale</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ── Onglets ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="flex gap-1 p-1 bg-[#111111] border border-white/5 rounded">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded text-xs font-semibold transition-all ${
                activeTab === tab.key
                  ? 'bg-blue-700 text-white shadow'
                  : 'text-[#a3a3a3] hover:text-[#e5e5e5] hover:bg-[#1c1c1c]'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </motion.div>

      {loading && <Loader text="Chargement des courses..." />}

      {error && (
        <Card className="p-4">
          <p className="text-sm text-red-400 text-center">{error}</p>
        </Card>
      )}

      {!loading && !error && (
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* ════════════════════════════════════════════════
              ONGLET SORTIES
          ════════════════════════════════════════════════ */}
          {activeTab === 'sorties' && (
            <div className="space-y-4">
              {/* Filtres */}
              <div className="flex flex-wrap gap-2">
                {/* Filtre type */}
                <div className="flex gap-1 flex-wrap">
                  {(
                    [
                      { key: 'tous', label: 'Tous' },
                      { key: 'fractionne', label: 'Fractionné' },
                      { key: 'endurance', label: 'Endurance' },
                      { key: 'tempo', label: 'Tempo' },
                    ] as { key: RunTypeFilter; label: string }[]
                  ).map((f) => (
                    <button
                      key={f.key}
                      onClick={() => {
                        setTypeFilter(f.key);
                        setVisibleCount(10);
                      }}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                        typeFilter === f.key
                          ? 'bg-blue-700 text-white'
                          : 'bg-[#1c1c1c] text-[#a3a3a3] hover:text-[#e5e5e5] border border-white/5'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Séparateur vertical */}
                <div className="w-px bg-slate-700/50 self-stretch" />

                {/* Filtre période */}
                <div className="flex gap-1 flex-wrap">
                  {(
                    [
                      { key: 'semaine', label: 'Cette semaine' },
                      { key: 'mois', label: 'Ce mois' },
                      { key: 'tout', label: 'Tout' },
                    ] as { key: PeriodFilter; label: string }[]
                  ).map((f) => (
                    <button
                      key={f.key}
                      onClick={() => {
                        setPeriodFilter(f.key);
                        setVisibleCount(10);
                      }}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                        periodFilter === f.key
                          ? 'bg-slate-600 text-white'
                          : 'bg-[#1c1c1c] text-[#a3a3a3] hover:text-[#e5e5e5] border border-white/5'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Résultats */}
              {filteredSessions.length === 0 ? (
                <Card className="p-8 text-center">
                  <PersonStanding className="w-12 h-12 mx-auto mb-3 text-[#4a4a4a]" />
                  <p className="text-[#a3a3a3] text-sm mb-4">
                    Aucune course pour ces filtres.
                  </p>
                  <Link to="/running/new">
                    <Button
                      icon={<Plus className="w-4 h-4" />}
                      className="bg-transparent border border-blue-800/60 text-blue-500 hover:bg-blue-900/10 hover:border-blue-700"
                    >
                      Première course
                    </Button>
                  </Link>
                </Card>
              ) : (
                <div className="space-y-3">
                  {visibleSessions.map((session, i) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.04 * i }}
                    >
                      <RunSessionCard session={session} />
                    </motion.div>
                  ))}

                  {/* Charger plus */}
                  {hasMore && (
                    <button
                      onClick={() => setVisibleCount((c) => c + 10)}
                      className="w-full flex items-center justify-center gap-2 py-3 text-sm text-[#a3a3a3] hover:text-blue-500 bg-[#0d0d0d]/40 border border-white/8/40 rounded transition-all hover:border-blue-700/30"
                    >
                      <ChevronDown className="w-4 h-4" />
                      Charger plus ({filteredSessions.length - visibleCount} restantes)
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════════════
              ONGLET GRAPHIQUES
          ════════════════════════════════════════════════ */}
          {activeTab === 'graphiques' && (
            <div className="space-y-5">
              {allSessions.length === 0 ? (
                <Card className="p-8 text-center">
                  <BarChart2 className="w-12 h-12 mx-auto mb-3 text-[#4a4a4a]" />
                  <p className="text-[#a3a3a3] text-sm">
                    Pas encore assez de données pour afficher les graphiques.
                  </p>
                </Card>
              ) : (
                <>
                  {/* Distance par semaine */}
                  <Card className="p-4">
                    <p className="text-sm font-semibold text-[#d4d4d4] mb-4">
                      Distance par semaine (km)
                    </p>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart
                        data={weeklyDistanceData}
                        margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#1e293b"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="label"
                          tick={{ fill: '#6b6b6b', fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: '#6b6b6b', fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v: number) => `${v}`}
                        />
                        <Tooltip content={<DistTooltip />} cursor={{ fill: '#1e293b' }} />
                        <Bar
                          dataKey="distance"
                          fill="#1d4ed8"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>

                  {/* Évolution de l'allure */}
                  {paceEvolutionData.length >= 2 && (
                    <Card className="p-4">
                      <p className="text-sm font-semibold text-[#d4d4d4] mb-1">
                        Évolution de l'allure moyenne
                      </p>
                      <p className="text-xs text-[#6b6b6b] mb-4">
                        Plus l'allure est basse, meilleure elle est
                      </p>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart
                          data={paceEvolutionData}
                          margin={{ top: 4, right: 4, left: -10, bottom: 0 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#1e293b"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="date"
                            tick={{ fill: '#6b6b6b', fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(d: string) =>
                              new Date(d).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                              })
                            }
                            interval="preserveStartEnd"
                          />
                          <YAxis
                            tick={{ fill: '#6b6b6b', fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={formatPaceAxis}
                            reversed
                          />
                          <Tooltip content={<PaceTooltip />} />
                          <Line
                            type="monotone"
                            dataKey="pace"
                            stroke="#1d4ed8"
                            strokeWidth={2}
                            dot={{ fill: '#1d4ed8', r: 3, strokeWidth: 0 }}
                            activeDot={{ r: 5, fill: '#60a5fa' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </Card>
                  )}

                  {/* FC moyenne */}
                  {hasHrData && hrEvolutionData.length >= 2 && (
                    <Card className="p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Activity className="w-4 h-4 text-rose-400" />
                        <p className="text-sm font-semibold text-[#d4d4d4]">
                          Fréquence cardiaque moyenne (bpm)
                        </p>
                      </div>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart
                          data={hrEvolutionData}
                          margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#1e293b"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="date"
                            tick={{ fill: '#6b6b6b', fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(d: string) =>
                              new Date(d).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                              })
                            }
                            interval="preserveStartEnd"
                          />
                          <YAxis
                            tick={{ fill: '#6b6b6b', fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip content={<HrTooltip />} />
                          <Line
                            type="monotone"
                            dataKey="hr"
                            stroke="#f43f5e"
                            strokeWidth={2}
                            dot={{ fill: '#f43f5e', r: 3, strokeWidth: 0 }}
                            activeDot={{ r: 5, fill: '#fb7185' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </Card>
                  )}
                </>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════════════
              ONGLET RECORDS
          ════════════════════════════════════════════════ */}
          {activeTab === 'records' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="w-4 h-4 text-blue-500" />
                <h2 className="text-sm font-semibold text-[#a3a3a3] uppercase tracking-wider">
                  Records personnels
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {RUNNING_RECORD_DISTANCES.map(({ label, km }) => {
                  const record = records[km];
                  return (
                    <RecordCard
                      key={km}
                      label={label}
                      km={km}
                      record={record ?? null}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

// ─── Carte session ────────────────────────────────────────────────────────────

function RunSessionCard({ session }: { session: RunningSession }) {
  const feedback = session.feedback as Feedback | null;
  const runType = session.run_type as RunType | null;
  const feedbackColor = feedback ? FEEDBACK_COLORS[feedback] : 'text-[#6b6b6b]';

  return (
    <div className="flex items-center gap-3 p-4 bg-[#111111] border border-white/5 rounded hover:border-white/10 hover:bg-[#1c1c1c] transition-all">
      <div className="p-2.5 bg-transparent border border-blue-900/40 rounded flex-shrink-0">
        <PersonStanding className="w-5 h-5 text-blue-500" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-semibold text-[#e5e5e5]">
            {formatDate(session.date, { weekday: 'short', day: 'numeric', month: 'short' })}
          </p>
          {runType && (
            <span className="text-xs px-2 py-0.5 bg-transparent border border-blue-900/40 text-blue-500 rounded-md">
              {RUN_TYPE_LABELS[runType]}
            </span>
          )}
          {feedback && (
            <span className={`text-xs ${feedbackColor}`}>
              {FEEDBACK_LABELS[feedback]}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-[#a3a3a3]">
          <span className="font-medium text-[#d4d4d4]">
            {formatDistance(session.distance)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDuration(session.duration)}
          </span>
          {session.pace_min_per_km && session.pace_min_per_km > 0 && (
            <span>{formatPace(session.pace_min_per_km)}</span>
          )}
        </div>
        {session.notes && (
          <p className="text-xs text-[#6b6b6b] mt-1 truncate">{session.notes}</p>
        )}
      </div>

      <span className="text-xs text-[#6b6b6b] flex-shrink-0">
        {formatRelativeTime(session.date)}
      </span>
    </div>
  );
}

// ─── Carte record ─────────────────────────────────────────────────────────────

interface RecordCardProps {
  label: string;
  km: number;
  record: { duration: number; pace: number; date: string } | null;
}

function RecordCard({ label, km, record }: RecordCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        {/* Infos gauche */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded bg-transparent border border-blue-900/40 flex-shrink-0">
            <Trophy className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">{label}</p>
            {record ? (
              <div className="mt-1 space-y-0.5">
                <p className="text-lg font-black text-blue-500">
                  {formatDuration(record.duration, true)}
                </p>
                <div className="flex items-center gap-2 text-xs text-[#a3a3a3]">
                  <span>{formatPace(record.pace)}</span>
                  <span className="text-[#4a4a4a]">&middot;</span>
                  <span>
                    {formatDate(record.date, {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[#6b6b6b] italic mt-1">Record non établi</p>
            )}
          </div>
        </div>

        {/* Bouton historique */}
        <Link
          to={`/running?distance=${km}`}
          className="flex-shrink-0 text-xs text-blue-500 hover:text-blue-500 bg-transparent hover:bg-blue-900/10 border border-blue-700/30 px-3 py-1.5 rounded-lg transition-all font-medium"
        >
          Historique
        </Link>
      </div>
    </Card>
  );
}
