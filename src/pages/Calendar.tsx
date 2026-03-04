import React, { useEffect, useState, useMemo } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Dumbbell, PersonStanding, Scale, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { workoutService } from '../services/workout.service';
import { runningService } from '../services/running.service';
import { weightService } from '../services/weight.service';
import { Card } from '../components/common/Card';
import { Modal } from '../components/common/Modal';
import {
  formatDate, formatDistance, formatDuration, formatPace, formatNumber,
} from '../utils/calculations';
import { FEEDBACK_LABELS, FEEDBACK_COLORS, RUN_TYPE_LABELS } from '../utils/constants';
import type { WorkoutSession, RunningSession, WeightEntry } from '../types/models';
import type { Feedback, RunType } from '../types/enums';

type DayActivity = {
  date: string; // YYYY-MM-DD
  hasWorkout: boolean;
  hasRun: boolean;
  hasWeight: boolean;
  workouts: WorkoutSession[];
  runs: RunningSession[];
  weights: WeightEntry[];
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
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<DayActivity | null>(null);

  useEffect(() => {
    if (!profile) return;
    setLoading(true);
    Promise.all([
      workoutService.getSessions(profile.id, 200),
      runningService.getSessions(profile.id, 200),
      weightService.getEntries(profile.id, 200),
    ]).then(([w, r, wt]) => {
      setWorkouts(w);
      setRuns(r);
      setWeights(wt);
    }).finally(() => setLoading(false));
  }, [profile]);

  // Construire la map date → activités
  const activityMap = useMemo(() => {
    const map = new Map<string, DayActivity>();

    const ensure = (d: string) => {
      if (!map.has(d)) {
        map.set(d, { date: d, hasWorkout: false, hasRun: false, hasWeight: false, workouts: [], runs: [], weights: [] });
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

    return map;
  }, [workouts, runs, weights]);

  // Jours du mois courant
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Lundi = 0, Dimanche = 6
    let startDow = firstDay.getDay() - 1;
    if (startDow === -1) startDow = 6;

    const days: (Date | null)[] = [];

    // Jours vides au début
    for (let i = 0; i < startDow; i++) days.push(null);

    // Jours du mois
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }

    // Compléter jusqu'à 42 (6 semaines)
    while (days.length % 7 !== 0) days.push(null);

    return days;
  }, [currentDate]);

  // Stats du mois
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
          <div className="p-2.5 rounded-2xl bg-red-500/20 border border-red-500/30">
            <CalendarDays className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Calendrier</h1>
            <p className="text-slate-400 text-sm mt-0.5">Historique de tes activités</p>
          </div>
        </div>
      </motion.div>

      {/* Navigation mois */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth}
              className="p-2 rounded-xl hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <h2 className="text-lg font-bold text-slate-100">
                {MONTHS_FR[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <button onClick={goToday}
                className="text-xs text-red-400 hover:text-red-300 transition-colors mt-0.5">
                Aujourd'hui
              </button>
            </div>
            <button onClick={nextMonth}
              className="p-2 rounded-xl hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* En-têtes jours */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS_FR.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-slate-500 py-1">{d}</div>
            ))}
          </div>

          {/* Grille */}
          {loading ? (
            <div className="h-48 flex items-center justify-center text-slate-500 text-sm">Chargement...</div>
          ) : (
            <div className="grid grid-cols-7 gap-0.5">
              {calendarDays.map((day, i) => {
                if (!day) return <div key={`empty-${i}`} />;

                const dateStr = toDateStr(day);
                const activity = activityMap.get(dateStr);
                const isToday = dateStr === todayStr;
                const isFuture = day > new Date();
                const hasActivity = !!(activity?.hasWorkout || activity?.hasRun || activity?.hasWeight);
                const isMixed = !!(activity?.hasWorkout && activity?.hasRun);

                return (
                  <button
                    key={dateStr}
                    onClick={() => activity && setSelectedDay(activity)}
                    className={`
                      relative aspect-square flex flex-col items-center justify-center rounded-xl
                      text-sm font-medium transition-all duration-150 p-1
                      ${isToday ? 'ring-2 ring-red-500' : ''}
                      ${hasActivity ? 'cursor-pointer hover:scale-105' : 'cursor-default'}
                      ${isFuture ? 'opacity-30' : ''}
                      ${isToday ? 'bg-red-900/40' : hasActivity ? 'bg-slate-800/60 hover:bg-slate-700/60' : ''}
                    `}
                  >
                    <span className={`text-xs sm:text-sm ${isToday ? 'text-red-300 font-bold' : 'text-slate-300'}`}>
                      {day.getDate()}
                    </span>
                    {activity && (
                      <div className="flex gap-0.5 mt-0.5">
                        {activity.hasWorkout && !isMixed && (
                          <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                        )}
                        {activity.hasRun && !isMixed && (
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        )}
                        {isMixed && (
                          <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                        )}
                        {activity.hasWeight && (
                          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Légende */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-slate-700/50">
            {[
              { color: 'bg-red-400', label: 'Musculation' },
              { color: 'bg-blue-400', label: 'Course' },
              { color: 'bg-green-400', label: 'Pesée' },
              { color: 'bg-red-400', label: 'Mixte' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${color}`} />
                <span className="text-xs text-slate-500">{label}</span>
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
          { value: monthStats.runDays, label: 'Sorties course', color: 'text-blue-400' },
          {
            value: monthStats.totalDist >= 100
              ? `${(monthStats.totalDist / 1000).toFixed(1)}k km`
              : `${monthStats.totalDist.toFixed(1)} km`,
            label: 'Distance totale', color: 'text-blue-400'
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
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </Card>
        ))}
      </motion.div>

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
                  <div className="p-1.5 rounded-lg bg-red-900/20">
                    <Dumbbell className="w-4 h-4 text-red-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-200">
                    Musculation ({selectedDay.workouts.length})
                  </h3>
                </div>
                <div className="space-y-2">
                  {selectedDay.workouts.map(w => {
                    const exCount = w.sets ? new Set(w.sets.map(s => s.exercise_id)).size : 0;
                    const fb = w.feedback as Feedback | null;
                    return (
                      <div key={w.id} className="p-3 bg-slate-800/60 border border-red-800/30 rounded-xl">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {w.total_tonnage && w.total_tonnage > 0 && (
                              <span className="font-semibold text-slate-200 text-sm">
                                {formatNumber(w.total_tonnage)} kg
                              </span>
                            )}
                            {exCount > 0 && <span className="text-xs text-slate-400">{exCount} exercice{exCount > 1 ? 's' : ''}</span>}
                          </div>
                          {fb && <span className={`text-xs ${FEEDBACK_COLORS[fb]}`}>{FEEDBACK_LABELS[fb]}</span>}
                        </div>
                        {w.notes && <p className="text-xs text-slate-500 mt-1">{w.notes}</p>}
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
                  <div className="p-1.5 rounded-lg bg-blue-900/20">
                    <PersonStanding className="w-4 h-4 text-blue-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-200">
                    Course ({selectedDay.runs.length})
                  </h3>
                </div>
                <div className="space-y-2">
                  {selectedDay.runs.map(r => {
                    const rt = r.run_type as RunType | null;
                    const fb = r.feedback as Feedback | null;
                    return (
                      <div key={r.id} className="p-3 bg-slate-800/60 border border-blue-700/30 rounded-xl">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-slate-200 text-sm">{formatDistance(r.distance)}</span>
                            <span className="text-xs text-slate-400">{formatDuration(r.duration)}</span>
                            {r.pace_min_per_km && r.pace_min_per_km > 0 && (
                              <span className="text-xs text-blue-400">{formatPace(r.pace_min_per_km)}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {rt && <span className="text-xs px-1.5 py-0.5 bg-blue-900/20 text-blue-300 rounded">{RUN_TYPE_LABELS[rt]}</span>}
                            {fb && <span className={`text-xs ${FEEDBACK_COLORS[fb]}`}>{FEEDBACK_LABELS[fb]}</span>}
                          </div>
                        </div>
                        {r.notes && <p className="text-xs text-slate-500 mt-1">{r.notes}</p>}
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
                  <div className="p-1.5 rounded-lg bg-green-900/20">
                    <Scale className="w-4 h-4 text-green-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-200">Pesée</h3>
                </div>
                <div className="space-y-2">
                  {selectedDay.weights.map(wt => (
                    <div key={wt.id} className="p-3 bg-slate-800/60 border border-green-700/30 rounded-xl">
                      <span className="font-bold text-green-400">{wt.weight.toFixed(1)} kg</span>
                      {wt.notes && <p className="text-xs text-slate-500 mt-1">{wt.notes}</p>}
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
