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
  Pencil,
  Trash2,
  Eye,
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
import { Input, Textarea } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { Loader } from '../components/common/Loader';
import {
  formatRelativeTime,
  formatDate,
  formatDistance,
  formatDuration,
  formatPace,
  getWeekStart,
  getLevelProgress,
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
    <div className="bg-[#1c1c1c] border border-white/5 rounded px-3 py-2 text-xs shadow-lg">
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
    <div className="bg-[#1c1c1c] border border-white/5 rounded px-3 py-2 text-xs shadow-lg">
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
    <div className="bg-[#1c1c1c] border border-white/5 rounded px-3 py-2 text-xs shadow-lg">
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

  function loadData(userId: string) {
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
  }

  useEffect(() => {
    if (!profile) return;
    loadData(profile.id);
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

  const groupedSessions = useMemo(() => {
    const groups: { month: string; items: typeof visibleSessions }[] = [];
    const idx: Record<string, number> = {};
    for (const s of visibleSessions) {
      const key = new Date(s.date)
        .toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
        .toUpperCase();
      if (idx[key] === undefined) { idx[key] = groups.length; groups.push({ month: key, items: [] }); }
      groups[idx[key]].items.push(s);
    }
    return groups;
  }, [visibleSessions]);

  if (!profile) return null;

  // ── Onglets config ──────────────────────────────────────────────────────────

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'sorties', label: 'Sorties', icon: <List className="w-3.5 h-3.5" /> },
    { key: 'graphiques', label: 'Graphiques', icon: <BarChart2 className="w-3.5 h-3.5" /> },
    { key: 'records', label: 'Records', icon: <Trophy className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-6">
      {/* ── Banner hero ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative overflow-hidden bg-gradient-to-br from-blue-950/60 via-[#0d0d0d] to-[#0a0a0a] border border-blue-900/20 p-6 -mx-4 sm:mx-0"
      >
        <PersonStanding className="absolute right-4 top-1/2 -translate-y-1/2 w-28 h-28 text-blue-900/10 pointer-events-none" />
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400/50 mb-2"><strong>Course à pied</strong></p>
        <h1 className="text-5xl sm:text-6xl font-black uppercase tracking-tight text-white leading-none mb-3">
          RUNNING
        </h1>
        {(() => {
          const { level, current, needed, progress } = getLevelProgress(profile.running_xp);
          return (
            <>
              <p className="text-xs text-[#6b6b6b] mb-3">Niveau {level} · {profile.running_xp} XP</p>
              <div className="h-1 bg-white/5 overflow-hidden">
                <motion.div
                  className="h-full"
                  style={{ background: 'linear-gradient(to right, #1e3a5f, #3b82f6)' }}
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

      {/* ── CTA ── */}
      <Link to="/running/new" className="-mx-4 sm:mx-0 block">
        <motion.div
          whileHover={{ backgroundColor: '#1d4ed8' }}
          className="w-full py-4 bg-blue-700 text-white font-black uppercase tracking-[0.15em] text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          NOUVELLE COURSE
        </motion.div>
      </Link>

      {/* ── Stats globales ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
      >
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-transparent">
              <PersonStanding className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-blue-500">{totalSessions}</p>
              <p className="text-xs text-[#a3a3a3]"><strong>Sorties</strong> totales</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-transparent">
              <MapPin className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-blue-500">
                {totalDistance >= 1000
                  ? `${(totalDistance / 1000).toFixed(1)}k`
                  : `${Math.round(totalDistance)}`}
                <span className="text-base ml-0.5">km</span>
              </p>
              <p className="text-xs text-[#a3a3a3]"><strong>Distance</strong> totale</p>
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
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 sm:px-3 rounded text-xs font-semibold transition-all ${
                activeTab === tab.key
                  ? 'bg-blue-700 text-white shadow'
                  : 'text-[#a3a3a3] hover:text-[#e5e5e5] hover:bg-[#1c1c1c]'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
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
              <div className="flex gap-2">
                <select
                  value={typeFilter}
                  onChange={e => { setTypeFilter(e.target.value as RunTypeFilter); setVisibleCount(10); }}
                  className="flex-1 bg-[#111] border border-white/10 text-[#d4d4d4] text-xs px-3 py-2 font-rajdhani font-semibold uppercase tracking-wide focus:outline-none focus:border-blue-700/60"
                >
                  <option value="tous">Tous les types</option>
                  <option value="fractionne">Fractionné</option>
                  <option value="endurance">Endurance</option>
                  <option value="tempo">Tempo</option>
                </select>
                <select
                  value={periodFilter}
                  onChange={e => { setPeriodFilter(e.target.value as PeriodFilter); setVisibleCount(10); }}
                  className="flex-1 bg-[#111] border border-white/10 text-[#d4d4d4] text-xs px-3 py-2 font-rajdhani font-semibold uppercase tracking-wide focus:outline-none focus:border-blue-700/60"
                >
                  <option value="tout">Toute la période</option>
                  <option value="semaine">Cette semaine</option>
                  <option value="mois">Ce mois</option>
                </select>
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
                <div className="space-y-6">
                  {groupedSessions.map(({ month, items }) => (
                    <div key={month} className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#3a3a3a]">{month}</span>
                        <div className="flex-1 h-px bg-white/5" />
                        <span className="text-[10px] text-[#2a2a2a]">{items.length} sortie{items.length > 1 ? 's' : ''}</span>
                      </div>
                      {items.map(session => (
                        <RunSessionCard
                          key={session.id}
                          session={session}
                          onUpdated={() => profile && loadData(profile.id)}
                          onDeleted={() => profile && loadData(profile.id)}
                        />
                      ))}
                    </div>
                  ))}

                  {/* Charger plus */}
                  {hasMore && (
                    <button
                      onClick={() => setVisibleCount((c) => c + 10)}
                      className="w-full flex items-center justify-center gap-2 py-3 text-sm text-[#a3a3a3] hover:text-blue-500 bg-[#0d0d0d]/40 border border-white/5 rounded transition-all hover:border-blue-700/30"
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

function RunSessionCard({
  session,
  onUpdated,
  onDeleted,
}: {
  session: RunningSession;
  onUpdated: () => void;
  onDeleted: () => void;
}) {
  const feedback = session.feedback as Feedback | null;
  const runType = session.run_type as RunType | null;
  const feedbackColor = feedback ? FEEDBACK_COLORS[feedback] : 'text-[#6b6b6b]';

  // Edit state
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editDistance, setEditDistance] = useState('');
  const [editDuration, setEditDuration] = useState('');
  const [editRunType, setEditRunType] = useState('');
  const [editFeedback, setEditFeedback] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Detail state
  const [showDetail, setShowDetail] = useState(false);

  // Delete state
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function openEdit() {
    setEditName((session as RunningSession & { name?: string | null }).name ?? '');
    setEditDate(session.date.slice(0, 10));
    setEditDistance(String(session.distance));
    setEditDuration(String(session.duration));
    setEditRunType(session.run_type ?? '');
    setEditFeedback(session.feedback ?? '');
    setEditNotes(session.notes ?? '');
    setSaveError(null);
    setShowEdit(true);
  }

  async function handleSave() {
    const dist = parseFloat(editDistance);
    const dur = parseInt(editDuration, 10);
    if (isNaN(dist) || dist <= 0 || isNaN(dur) || dur <= 0) {
      setSaveError('Distance et durée doivent être valides.');
      return;
    }
    const pace_min_per_km = dur / dist;
    setSaving(true);
    setSaveError(null);
    try {
      await runningService.updateSession(session.id, {
        name: editName.trim() || null,
        date: editDate,
        distance: dist,
        duration: dur,
        run_type: editRunType || null,
        feedback: editFeedback || null,
        notes: editNotes.trim() || null,
        pace_min_per_km,
      });
      setShowEdit(false);
      onUpdated();
    } catch {
      setSaveError('Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await runningService.deleteSession(session.id);
      setShowDelete(false);
      onDeleted();
    } catch {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className={`bg-[#111111] border overflow-hidden transition-all ${
        feedback === 'mort' ? 'border-red-900/70' :
        feedback === 'difficile' ? 'border-amber-900/70' :
        feedback === 'facile' ? 'border-emerald-900/70' :
        'border-white/5'
      }`}>
        {/* Header */}
        <div className="px-4 pt-3.5 pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <span className="font-rajdhani font-black text-base text-white uppercase tracking-wide truncate">
                {((session as any).name
                  ? (session as any).name
                  : formatDate(session.date, { weekday: 'short', day: 'numeric', month: 'short' })
                ).toUpperCase()}
              </span>
              {runType && (
                <span className="text-xs px-1.5 py-0.5 bg-blue-950/40 border border-blue-900/30 text-blue-400 flex-shrink-0 font-rajdhani font-bold uppercase">
                  {RUN_TYPE_LABELS[runType]}
                </span>
              )}
              {feedback && (
                <span className={`text-sm font-bold font-rajdhani flex-shrink-0 ${feedbackColor}`}>{FEEDBACK_LABELS[feedback]}</span>
              )}
            </div>
            <span className="text-xs text-[#3a3a3a] flex-shrink-0">{formatRelativeTime(session.date)}</span>
          </div>
        </div>

        {/* Metric blocks */}
        <div className="grid grid-cols-3 divide-x divide-white/5 border-t border-b border-white/5 bg-[#0d0d0d]">
          <div className="flex flex-col items-center py-3 px-2">
            <span className="font-rajdhani font-black text-xl text-blue-400 leading-none">{formatDistance(session.distance)}</span>
            <span className="text-[10px] text-blue-700 uppercase tracking-widest font-rajdhani mt-1">Distance</span>
          </div>
          <div className="flex flex-col items-center py-3 px-2">
            <span className="font-rajdhani font-black text-xl text-[#d4d4d4] leading-none">{formatDuration(session.duration)}</span>
            <span className="text-[10px] text-[#4a4a4a] uppercase tracking-widest font-rajdhani mt-1">Durée</span>
          </div>
          <div className="flex flex-col items-center py-3 px-2">
            <span className="font-rajdhani font-black text-xl text-[#d4d4d4] leading-none">
              {session.pace_min_per_km && session.pace_min_per_km > 0 ? formatPace(session.pace_min_per_km) : '—'}
            </span>
            <span className="text-[10px] text-[#4a4a4a] uppercase tracking-widest font-rajdhani mt-1">Allure</span>
          </div>
        </div>

        {/* Optional extras */}
        {(session.avg_heart_rate || session.elevation_gain != null) && (
          <div className="px-4 py-3 space-y-2.5">
            {[
              session.avg_heart_rate ? { num: '01', label: 'FC MOY', value: `${session.avg_heart_rate} bpm`, color: 'text-[#e5e5e5]' } : null,
              session.elevation_gain != null ? { num: session.avg_heart_rate ? '02' : '01', label: 'DÉNIVELÉ +', value: `${session.elevation_gain} m`, color: 'text-[#e5e5e5]' } : null,
            ].filter(Boolean).map((item: any, i) => (
              <div key={i} className="flex items-center gap-3 min-w-0">
                <span className="font-rajdhani font-black text-blue-700 w-5 flex-shrink-0 text-sm">{item.num}</span>
                <span className="font-rajdhani font-bold text-[#7a7a7a] uppercase tracking-wide text-sm min-w-0 truncate">{item.label}</span>
                <span className={`font-rajdhani font-black text-sm flex-shrink-0 ${item.color}`}>{item.value}</span>
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

      {/* Modal détail séance */}
      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Détails — Course" size="md">
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {(session as any).name && (
            <h3 className="font-rajdhani font-bold text-lg text-blue-400 tracking-wide uppercase border-b border-white/5 pb-2">
              {(session as any).name}
            </h3>
          )}
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="text-[#a3a3a3]">{formatDate(session.date, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            {session.run_type && (
              <span className="text-xs border border-blue-800/50 text-blue-400 px-2 py-0.5 font-rajdhani font-semibold uppercase">
                {RUN_TYPE_LABELS[session.run_type as RunType]}
              </span>
            )}
            {session.feedback && (
              <span className={`text-xs border px-2 py-0.5 font-rajdhani font-semibold uppercase ${
                session.feedback === 'facile' ? 'text-green-500 border-green-900/50' :
                session.feedback === 'difficile' ? 'text-orange-500 border-orange-900/50' :
                'text-red-500 border-red-900/50'
              }`}>
                {FEEDBACK_LABELS[session.feedback as Feedback]}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Distance', value: formatDistance(session.distance) },
              { label: 'Durée', value: formatDuration(session.duration) },
              { label: 'Allure', value: session.pace_min_per_km ? formatPace(session.pace_min_per_km) : '—' },
              session.avg_heart_rate ? { label: 'FC moy.', value: `${session.avg_heart_rate} bpm` } : null,
              session.max_heart_rate ? { label: 'FC max.', value: `${session.max_heart_rate} bpm` } : null,
              session.elevation_gain != null ? { label: 'Dénivelé +', value: `${session.elevation_gain} m` } : null,
              session.elevation_loss != null ? { label: 'Dénivelé −', value: `${session.elevation_loss} m` } : null,
              session.weather_temp != null ? { label: 'Météo', value: `${session.weather_temp}°C` } : null,
            ].filter(Boolean).map((stat: any, i) => (
              <div key={i} className="border border-white/5 px-3 py-2">
                <p className="text-xs text-[#6b6b6b] uppercase tracking-wide">{stat.label}</p>
                <p className="text-sm font-rajdhani font-semibold text-[#e5e5e5]">{stat.value}</p>
              </div>
            ))}
          </div>

          {session.notes && (
            <p className="text-sm text-[#a3a3a3] italic border-l-2 border-blue-800/50 pl-3">{session.notes}</p>
          )}
        </div>
      </Modal>

      {/* Modal édition */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Modifier la course" size="sm">
        <div className="p-5 space-y-4">
          <Input
            label="Titre (optionnel)"
            placeholder="Ex: Trail du matin, 10K du parc..."
            value={editName}
            onChange={e => setEditName(e.target.value)}
          />
          <Input
            label="Date"
            type="date"
            value={editDate}
            onChange={e => setEditDate(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Distance (km)"
              type="number"
              step="0.01"
              min="0"
              value={editDistance}
              onChange={e => setEditDistance(e.target.value)}
            />
            <Input
              label="Durée (min)"
              type="number"
              min="1"
              value={editDuration}
              onChange={e => setEditDuration(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Type de course</label>
            <select
              value={editRunType}
              onChange={e => setEditRunType(e.target.value)}
              className="w-full bg-[#111111] border border-white/5 text-[#d4d4d4] text-sm px-3 py-2.5 focus:outline-none focus:border-blue-500/40 appearance-none cursor-pointer"
            >
              <option value="">— Aucun —</option>
              <option value="endurance">{RUN_TYPE_LABELS.endurance}</option>
              <option value="fractionne">{RUN_TYPE_LABELS.fractionne}</option>
              <option value="tempo">{RUN_TYPE_LABELS.tempo}</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Ressenti</label>
            <select
              value={editFeedback}
              onChange={e => setEditFeedback(e.target.value)}
              className="w-full bg-[#111111] border border-white/5 text-[#d4d4d4] text-sm px-3 py-2.5 focus:outline-none focus:border-blue-500/40 appearance-none cursor-pointer"
            >
              <option value="">— Aucun —</option>
              <option value="facile">{FEEDBACK_LABELS.facile}</option>
              <option value="difficile">{FEEDBACK_LABELS.difficile}</option>
              <option value="mort">{FEEDBACK_LABELS.mort}</option>
            </select>
          </div>
          <Textarea
            label="Notes (optionnel)"
            placeholder="Remarques..."
            value={editNotes}
            onChange={e => setEditNotes(e.target.value)}
            rows={2}
          />
          {saveError && <p className="text-sm text-red-400">{saveError}</p>}
          <div className="flex gap-3 pt-1">
            <Button variant="secondary" onClick={() => setShowEdit(false)} className="flex-1">Annuler</Button>
            <Button
              loading={saving}
              onClick={handleSave}
              className="flex-1 bg-transparent border border-blue-800/60 text-blue-500 hover:bg-blue-900/10 hover:border-blue-700"
            >
              {saving ? 'Sauvegarde...' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal suppression */}
      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Supprimer la course" size="sm">
        <div className="p-5 space-y-4">
          <p className="text-sm text-[#a3a3a3]">
            Cette action est irréversible. La course sera définitivement supprimée.
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
              <p className="text-sm text-[#6b6b6b] italic mt-1"><em>Record non établi</em></p>
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
