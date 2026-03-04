import React, { useEffect, useState, useMemo } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Dumbbell, PersonStanding, Scale, Target, Swords, Flag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { workoutService } from '../services/workout.service';
import { runningService } from '../services/running.service';
import { weightService } from '../services/weight.service';
import { goalsService } from '../services/goals.service';
import { supabase } from '../lib/supabase-client';
import { Card } from '../components/common/Card';
import { Modal } from '../components/common/Modal';
import {
  formatDate, formatDistance, formatDuration, formatPace, formatNumber,
} from '../utils/calculations';
import { FEEDBACK_LABELS, FEEDBACK_COLORS, RUN_TYPE_LABELS } from '../utils/constants';
import type { WorkoutSession, RunningSession, WeightEntry, PersonalGoal } from '../types/models';
import type { Feedback, RunType } from '../types/enums';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

interface ChallengeItem {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  type: string;
}

type DayActivity = {
  date: string;
  hasWorkout: boolean;
  hasRun: boolean;
  hasWeight: boolean;
  hasGoalDeadline: boolean;
  hasChallengeEvent: boolean;
  workouts: WorkoutSession[];
  runs: RunningSession[];
  weights: WeightEntry[];
  goalDeadlines: PersonalGoal[];
  challengeEvents: { challenge: ChallengeItem; kind: 'start' | 'end' | 'active' }[];
};

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

function toDateStr(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getActivityDateStr(dateStr: string): string {
  return dateStr.split('T')[0];
}

export function CalendarPage() {
  const { profile } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [runs, setRuns] = useState<RunningSession[]>([]);
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [goals, setGoals] = useState<PersonalGoal[]>([]);
  const [challenges, setChallenges] = useState<ChallengeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<DayActivity | null>(null);

  useEffect(() => {
    if (!profile) return;
    setLoading(true);
    Promise.all([
      workoutService.getSessions(profile.id, 200),
      runningService.getSessions(profile.id, 200),
      weightService.getEntries(profile.id, 200),
      goalsService.getGoals(profile.id),
      db.from('community_challenges')
        .select('id, title, start_date, end_date, type')
        .in('status', ['active', 'pending'])
        .then(({ data }: { data: ChallengeItem[] | null }) => data ?? []),
    ]).then(([w, r, wt, g, c]) => {
      setWorkouts(w);
      setRuns(r);
      setWeights(wt);
      setGoals((g as PersonalGoal[]).filter(g => g.status === 'active' && g.deadline));
      setChallenges(c as ChallengeItem[]);
    }).finally(() => setLoading(false));
  }, [profile]);

  const activityMap = useMemo(() => {
    const map = new Map<string, DayActivity>();

    const ensure = (d: string): DayActivity => {
      if (!map.has(d)) {
        map.set(d, {
          date: d,
          hasWorkout: false, hasRun: false, hasWeight: false,
          hasGoalDeadline: false, hasChallengeEvent: false,
          workouts: [], runs: [], weights: [],
          goalDeadlines: [], challengeEvents: [],
        });
      }
      return map.get(d)!;
    };

    for (const w of workouts) {
      const d = getActivityDateStr(w.date);
      const a = ensure(d);
      a.hasWorkout = true;
      a.workouts.push(w);
    }
    for (const r of runs) {
      const d = getActivityDateStr(r.date);
      const a = ensure(d);
      a.hasRun = true;
      a.runs.push(r);
    }
    for (const wt of weights) {
      const d = wt.date.split('T')[0];
      const a = ensure(d);
      a.hasWeight = true;
      a.weights.push(wt);
    }

    // Objectifs : deadline
    for (const g of goals) {
      if (!g.deadline) continue;
      const d = g.deadline.split('T')[0];
      const a = ensure(d);
      a.hasGoalDeadline = true;
      a.goalDeadlines.push(g);
    }

    // Défis : start_date, end_date, et jours intermédiaires (hasChallengeEvent)
    for (const c of challenges) {
      const start = c.start_date.split('T')[0];
      const end = c.end_date.split('T')[0];
      const startDate = new Date(start);
      const endDate = new Date(end);

      // Marquer start
      const aStart = ensure(start);
      aStart.hasChallengeEvent = true;
      aStart.challengeEvents.push({ challenge: c, kind: 'start' });

      // Marquer end
      const aEnd = ensure(end);
      aEnd.hasChallengeEvent = true;
      // Avoid double-adding if same day
      if (!aEnd.challengeEvents.find(e => e.challenge.id === c.id)) {
        aEnd.challengeEvents.push({ challenge: c, kind: 'end' });
      }

      // Jours intermédiaires (juste le flag, pas d'event détaillé)
      const cur = new Date(startDate);
      cur.setDate(cur.getDate() + 1);
      while (cur < endDate) {
        const dStr = toDateStr(cur);
        const a = ensure(dStr);
        a.hasChallengeEvent = true;
        if (!a.challengeEvents.find(e => e.challenge.id === c.id)) {
          a.challengeEvents.push({ challenge: c, kind: 'active' });
        }
        cur.setDate(cur.getDate() + 1);
      }
    }

    return map;
  }, [workouts, runs, weights, goals, challenges]);

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let startDow = firstDay.getDay() - 1;
    if (startDow === -1) startDow = 6;

    const days: (Date | null)[] = [];
    for (let i = 0; i < startDow; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d));
    while (days.length % 7 !== 0) days.push(null);

    return days;
  }, [currentDate]);

  const monthStats = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    let workoutDays = 0, runDays = 0, totalDist = 0, totalTonnage = 0;

    for (const [dateStr, activity] of activityMap) {
      const d = new Date(dateStr);
      if (d.getFullYear() !== year || d.getMonth() !== month) continue;
      if (activity.hasWorkout) workoutDays++;
      if (activity.hasRun) {
        runDays++;
        totalDist += activity.runs.reduce((s, r) => s + r.distance, 0);
      }
      totalTonnage += activity.workouts.reduce((s, w) => s + (w.total_tonnage ?? 0), 0);
    }

    return { workoutDays, runDays, totalDist, totalTonnage };
  }, [activityMap, currentDate]);

  // Objectifs avec deadline ce mois
  const monthGoals = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return goals.filter(g => {
      if (!g.deadline) return false;
      const d = new Date(g.deadline);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }, [goals, currentDate]);

  // Défis actifs ce mois
  const monthChallenges = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const lastOfMonth = new Date(year, month + 1, 0);
    return challenges.filter(c => {
      const start = new Date(c.start_date);
      const end = new Date(c.end_date);
      return start <= lastOfMonth && end >= firstOfMonth;
    });
  }, [challenges, currentDate]);

  const prevMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const todayStr = toDateStr(new Date());

  if (!profile) return null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 border border-[#c9a870]/30">
            <CalendarDays className="w-6 h-6 text-[#c9a870]" />
          </div>
          <div>
            <h1 className="font-rajdhani text-3xl font-bold tracking-wide uppercase text-[#c9a870]">Calendrier</h1>
            <p className="text-[#a3a3a3] text-sm mt-0.5">Activités, objectifs et défis</p>
          </div>
        </div>
      </motion.div>

      {/* Navigation mois */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth}
              className="p-2 hover:bg-white/5 text-[#a3a3a3] hover:text-[#e5e5e5] transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <h2 className="font-rajdhani text-lg font-bold text-[#f5f5f5] uppercase tracking-wide">
                {MONTHS_FR[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <button onClick={goToday}
                className="text-xs text-[#c9a870]/70 hover:text-[#c9a870] transition-colors mt-0.5">
                Aujourd'hui
              </button>
            </div>
            <button onClick={nextMonth}
              className="p-2 hover:bg-white/5 text-[#a3a3a3] hover:text-[#e5e5e5] transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* En-têtes jours */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS_FR.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-[#6b6b6b] py-1">{d}</div>
            ))}
          </div>

          {/* Grille */}
          {loading ? (
            <div className="h-48 flex items-center justify-center text-[#6b6b6b] text-sm">Chargement...</div>
          ) : (
            <div className="grid grid-cols-7 gap-0.5">
              {calendarDays.map((day, i) => {
                if (!day) return <div key={`empty-${i}`} />;

                const dateStr = toDateStr(day);
                const activity = activityMap.get(dateStr);
                const isToday = dateStr === todayStr;
                const isFuture = day > new Date();
                const hasActivity = !!(activity?.hasWorkout || activity?.hasRun || activity?.hasWeight);
                const hasGoal = !!activity?.hasGoalDeadline;
                const hasChallenge = !!activity?.hasChallengeEvent;
                const isClickable = !!(hasActivity || hasGoal || hasChallenge);

                return (
                  <button
                    key={dateStr}
                    onClick={() => activity && setSelectedDay(activity)}
                    className={`
                      relative aspect-square flex flex-col items-center justify-center
                      text-sm font-medium transition-all duration-150 p-1
                      ${isToday ? 'ring-1 ring-[#c9a870]' : ''}
                      ${isClickable ? 'cursor-pointer hover:scale-105' : 'cursor-default'}
                      ${isFuture && !hasGoal && !hasChallenge ? 'opacity-30' : ''}
                      ${isToday ? 'bg-[#c9a870]/10' : hasActivity ? 'bg-[#1c1c1c] hover:bg-white/5' : ''}
                    `}
                  >
                    <span className={`text-xs sm:text-sm ${isToday ? 'text-[#c9a870] font-bold' : 'text-[#d4d4d4]'}`}>
                      {day.getDate()}
                    </span>
                    <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                      {activity?.hasWorkout && <div className="w-1.5 h-1.5 rounded-full bg-red-400" />}
                      {activity?.hasRun && <div className="w-1.5 h-1.5 rounded-full bg-blue-700" />}
                      {activity?.hasWeight && <div className="w-1.5 h-1.5 rounded-full bg-green-700" />}
                      {hasGoal && <div className="w-1.5 h-1.5 rounded-full bg-[#c9a870]" />}
                      {hasChallenge && !hasGoal && <div className="w-1.5 h-1.5 rounded-full bg-pink-600" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Légende */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-white/5">
            {[
              { color: 'bg-red-400', label: 'Muscu' },
              { color: 'bg-blue-700', label: 'Course' },
              { color: 'bg-green-700', label: 'Pesée' },
              { color: 'bg-[#c9a870]', label: 'Objectif' },
              { color: 'bg-pink-600', label: 'Défi équipe' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${color}`} />
                <span className="text-xs text-[#6b6b6b]">{label}</span>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Stats du mois */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {[
          { value: monthStats.workoutDays, label: 'Séances muscu', color: 'text-red-400' },
          { value: monthStats.runDays, label: 'Sorties course', color: 'text-blue-500' },
          {
            value: monthStats.totalDist >= 100
              ? `${(monthStats.totalDist / 1000).toFixed(1)}k km`
              : `${monthStats.totalDist.toFixed(1)} km`,
            label: 'Distance totale', color: 'text-blue-500'
          },
          {
            value: monthStats.totalTonnage >= 1000
              ? `${(monthStats.totalTonnage / 1000).toFixed(1)}t`
              : `${Math.round(monthStats.totalTonnage)}kg`,
            label: 'Tonnage', color: 'text-red-400'
          },
        ].map(({ value, label, color }) => (
          <Card key={label} className="p-3 text-center">
            <p className={`text-xl font-black ${color}`}>{value}</p>
            <p className="text-xs text-[#6b6b6b] mt-0.5">{label}</p>
          </Card>
        ))}
      </motion.div>

      {/* Objectifs personnels ce mois */}
      {monthGoals.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-rajdhani text-sm font-semibold text-[#8b6f47] uppercase tracking-wider">
              Objectifs ce mois
            </h2>
            <Link to="/goals" className="text-xs text-[#c9a870]/70 hover:text-[#c9a870] transition-colors">
              Voir tout →
            </Link>
          </div>
          <div className="space-y-2">
            {monthGoals.map(g => {
              const pct = g.target_value && g.target_value > 0
                ? Math.min(100, Math.round(((g.current_value ?? 0) / g.target_value) * 100))
                : 0;
              const daysLeft = g.deadline
                ? Math.max(0, Math.ceil((new Date(g.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                : null;
              const typeColor = g.type === 'musculation' ? 'border-red-800/50' : g.type === 'running' ? 'border-blue-800/50' : 'border-green-800/50';
              const barColor = g.type === 'musculation' ? 'bg-red-800' : g.type === 'running' ? 'bg-blue-800' : 'bg-green-800';
              return (
                <div key={g.id} className={`p-3 bg-[#111111] border-l-2 ${typeColor}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-[#c9a870] flex-shrink-0" />
                    <p className="text-sm font-medium text-[#d4d4d4] flex-1 truncate">{g.title}</p>
                    {daysLeft !== null && (
                      <span className={`text-xs font-rajdhani font-bold flex-shrink-0 ${daysLeft <= 3 ? 'text-red-400' : 'text-[#c9a870]'}`}>
                        {daysLeft === 0 ? "Aujourd'hui" : `J-${daysLeft}`}
                      </span>
                    )}
                  </div>
                  <div className="w-full h-1 bg-white/5">
                    <div className={`h-1 ${barColor}`} style={{ width: `${pct}%` }} />
                  </div>
                  {g.target_value && (
                    <p className="text-xs text-[#6b6b6b] mt-1">{g.current_value ?? 0} / {g.target_value} {g.unit ?? ''}</p>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Défis d'équipe ce mois */}
      {monthChallenges.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-rajdhani text-sm font-semibold text-[#8b6f47] uppercase tracking-wider">
              Défis d'équipe ce mois
            </h2>
            <Link to="/team-goals" className="text-xs text-[#c9a870]/70 hover:text-[#c9a870] transition-colors">
              Voir tout →
            </Link>
          </div>
          <div className="space-y-2">
            {monthChallenges.map(c => {
              const daysLeft = Math.max(0, Math.ceil((new Date(c.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
              return (
                <div key={c.id} className="p-3 bg-[#111111] border-l-2 border-pink-800/60">
                  <div className="flex items-center gap-2">
                    <Swords className="w-4 h-4 text-pink-500 flex-shrink-0" />
                    <p className="text-sm font-medium text-[#d4d4d4] flex-1 truncate">{c.title}</p>
                    <span className="text-xs font-rajdhani font-bold text-pink-500 flex-shrink-0">
                      {daysLeft === 0 ? 'Dernier jour' : `J-${daysLeft}`}
                    </span>
                  </div>
                  <p className="text-xs text-[#6b6b6b] mt-1 ml-6">
                    {formatDate(c.start_date)} → {formatDate(c.end_date)}
                  </p>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Modal détail du jour */}
      <Modal isOpen={!!selectedDay} onClose={() => setSelectedDay(null)}
        title={selectedDay ? formatDate(selectedDay.date, { weekday: 'long', day: 'numeric', month: 'long' }) : ''}
        size="lg"
      >
        {selectedDay && (
          <div className="p-5 space-y-4">
            {/* Séances muscu */}
            {selectedDay.workouts.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Dumbbell className="w-4 h-4 text-red-400" />
                  <h3 className="text-sm font-semibold text-[#e5e5e5]">Musculation ({selectedDay.workouts.length})</h3>
                </div>
                <div className="space-y-2">
                  {selectedDay.workouts.map(w => {
                    const exCount = w.sets ? new Set(w.sets.map(s => s.exercise_id)).size : 0;
                    const fb = w.feedback as Feedback | null;
                    return (
                      <div key={w.id} className="p-3 bg-[#1c1c1c] border border-red-800/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {w.total_tonnage && w.total_tonnage > 0 && (
                              <span className="font-semibold text-[#e5e5e5] text-sm">{formatNumber(w.total_tonnage)} kg</span>
                            )}
                            {exCount > 0 && <span className="text-xs text-[#a3a3a3]">{exCount} exercice{exCount > 1 ? 's' : ''}</span>}
                          </div>
                          {fb && <span className={`text-xs ${FEEDBACK_COLORS[fb]}`}>{FEEDBACK_LABELS[fb]}</span>}
                        </div>
                        {w.notes && <p className="text-xs text-[#6b6b6b] mt-1">{w.notes}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Courses */}
            {selectedDay.runs.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <PersonStanding className="w-4 h-4 text-blue-500" />
                  <h3 className="text-sm font-semibold text-[#e5e5e5]">Course ({selectedDay.runs.length})</h3>
                </div>
                <div className="space-y-2">
                  {selectedDay.runs.map(r => {
                    const rt = r.run_type as RunType | null;
                    const fb = r.feedback as Feedback | null;
                    return (
                      <div key={r.id} className="p-3 bg-[#1c1c1c] border border-blue-700/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-[#e5e5e5] text-sm">{formatDistance(r.distance)}</span>
                            <span className="text-xs text-[#a3a3a3]">{formatDuration(r.duration)}</span>
                            {r.pace_min_per_km && r.pace_min_per_km > 0 && (
                              <span className="text-xs text-blue-500">{formatPace(r.pace_min_per_km)}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {rt && <span className="text-xs px-1.5 py-0.5 bg-transparent text-blue-500">{RUN_TYPE_LABELS[rt]}</span>}
                            {fb && <span className={`text-xs ${FEEDBACK_COLORS[fb]}`}>{FEEDBACK_LABELS[fb]}</span>}
                          </div>
                        </div>
                        {r.notes && <p className="text-xs text-[#6b6b6b] mt-1">{r.notes}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pesées */}
            {selectedDay.weights.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Scale className="w-4 h-4 text-green-600" />
                  <h3 className="text-sm font-semibold text-[#e5e5e5]">Pesée</h3>
                </div>
                <div className="space-y-2">
                  {selectedDay.weights.map(wt => (
                    <div key={wt.id} className="p-3 bg-[#1c1c1c] border border-green-700/30">
                      <span className="font-bold text-green-600">{wt.weight.toFixed(1)} kg</span>
                      {wt.notes && <p className="text-xs text-[#6b6b6b] mt-1">{wt.notes}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Deadlines objectifs */}
            {selectedDay.goalDeadlines.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4 text-[#c9a870]" />
                  <h3 className="text-sm font-semibold text-[#e5e5e5]">Objectifs — deadline</h3>
                </div>
                <div className="space-y-2">
                  {selectedDay.goalDeadlines.map(g => {
                    const pct = g.target_value && g.target_value > 0
                      ? Math.min(100, Math.round(((g.current_value ?? 0) / g.target_value) * 100))
                      : 0;
                    return (
                      <div key={g.id} className="p-3 bg-[#1c1c1c] border border-[#c9a870]/20">
                        <p className="text-sm font-medium text-[#d4d4d4]">{g.title}</p>
                        {g.target_value && (
                          <p className="text-xs text-[#a3a3a3] mt-1">{g.current_value ?? 0} / {g.target_value} {g.unit ?? ''} · {pct}%</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Défis d'équipe */}
            {selectedDay.challengeEvents.filter(e => e.kind !== 'active').length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Swords className="w-4 h-4 text-pink-500" />
                  <h3 className="text-sm font-semibold text-[#e5e5e5]">Défis d'équipe</h3>
                </div>
                <div className="space-y-2">
                  {selectedDay.challengeEvents.filter(e => e.kind !== 'active').map(({ challenge, kind }) => (
                    <div key={challenge.id} className="p-3 bg-[#1c1c1c] border border-pink-800/30">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-[#d4d4d4]">{challenge.title}</p>
                        <span className={`text-xs font-rajdhani font-bold px-2 py-0.5 border ${kind === 'start' ? 'text-green-500 border-green-800/50' : 'text-red-400 border-red-800/50'}`}>
                          {kind === 'start' ? 'DÉBUT' : 'FIN'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </Modal>
    </div>
  );
}
