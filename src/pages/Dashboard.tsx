import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell, PersonStanding, Scale, Flame, Trophy, Plus, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { workoutService } from '../services/workout.service';
import { runningService } from '../services/running.service';
import { weightService } from '../services/weight.service';
import { XPBar } from '../components/xp-system/XPBar';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { getLevelTitle, formatWeight, formatDistance, formatDuration, formatRelativeTime } from '../utils/calculations';
import type { WorkoutSession, RunningSession, WeightEntry } from '../types/models';

export function DashboardPage() {
  const { profile } = useAuth();
  const [lastWorkout, setLastWorkout] = useState<WorkoutSession | null>(null);
  const [lastRun, setLastRun] = useState<RunningSession | null>(null);
  const [lastWeight, setLastWeight] = useState<WeightEntry | null>(null);
  const [weekStats, setWeekStats] = useState({ workouts: 0, runs: 0, distance: 0, tonnage: 0 });

  useEffect(() => {
    if (!profile) return;
    const userId = profile.id;

    Promise.all([
      workoutService.getSessions(userId, 1),
      runningService.getSessions(userId, 1),
      weightService.getLatest(userId),
    ]).then(([workouts, runs, weight]) => {
      setLastWorkout(workouts[0] ?? null);
      setLastRun(runs[0] ?? null);
      setLastWeight(weight);
    });

    // Stats semaine
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1);
    weekStart.setHours(0, 0, 0, 0);

    Promise.all([
      workoutService.getSessions(userId, 50),
      runningService.getSessions(userId, 50),
    ]).then(([workouts, runs]) => {
      const weekWorkouts = workouts.filter(w => new Date(w.date) >= weekStart);
      const weekRuns = runs.filter(r => new Date(r.date) >= weekStart);
      setWeekStats({
        workouts: weekWorkouts.length,
        runs: weekRuns.length,
        distance: weekRuns.reduce((sum, r) => sum + r.distance, 0),
        tonnage: weekWorkouts.reduce((sum, w) => sum + (w.total_tonnage ?? 0), 0),
      });
    });
  }, [profile]);

  if (!profile) return null;

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? 'Bonjour' : greetingHour < 18 ? 'Bon après-midi' : 'Bonsoir';

  return (
    <div className="space-y-6">
      {/* Hero bandeau spartiate */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden -mx-4 -mt-6 px-6 py-8 mb-2"
      >
        {/* Image de fond subtile */}
        <div className="absolute inset-0 z-0">
          <img
            src="/spartan.avif"
            alt=""
            className="w-full h-full object-cover object-[center_20%]"
          />
          <div className="absolute inset-0 bg-black/82" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60" />
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
        </div>

        {/* Contenu */}
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="font-rajdhani text-3xl font-bold tracking-wide uppercase text-[#c9a870]">
              {greeting}, {profile.username}
            </h1>
            <p className="text-[#a3a3a3] text-sm mt-1 font-inter">
              {getLevelTitle(profile.global_level)} · Niveau {profile.global_level}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-black/50 border border-orange-900/50 px-3 py-2 backdrop-blur-sm">
            <Flame className="w-5 h-5 text-orange-600" />
            <span className="font-bold text-orange-500 font-rajdhani text-lg">{profile.current_streak}</span>
            <span className="text-xs text-orange-500">jours</span>
          </div>
        </div>
      </motion.div>

      {/* XP Bars */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-3"
      >
        <XPBar profile={profile} discipline="global" />
        <XPBar profile={profile} discipline="musculation" />
        <XPBar profile={profile} discipline="running" />
      </motion.div>

      {/* Stats semaine */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="font-rajdhani text-sm font-semibold text-[#8b6f47] uppercase tracking-wider mb-3">Cette semaine</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={<Dumbbell className="w-5 h-5" />} value={weekStats.workouts} label="Séances muscu" color="text-red-400" bg="bg-transparent border-red-900/50" />
          <StatCard icon={<PersonStanding className="w-5 h-5" />} value={weekStats.runs} label="Courses" color="text-blue-500" bg="bg-transparent border-blue-900/50" />
          <StatCard icon={<span className="text-base">🏃</span>} value={formatDistance(weekStats.distance)} label="Distance" color="text-blue-500" bg="bg-transparent border-blue-900/50" />
          <StatCard icon={<span className="text-base">🏋️</span>} value={`${Math.round(weekStats.tonnage)}kg`} label="Tonnage" color="text-red-400" bg="bg-transparent border-red-900/50" />
        </div>
      </motion.div>

      {/* Actions rapides */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="font-rajdhani text-sm font-semibold text-[#8b6f47] uppercase tracking-wider mb-3">Actions rapides</h2>
        <div className="grid grid-cols-3 gap-3">
          <QuickAction to="/musculation/new" icon={<Dumbbell className="w-6 h-6" />} label="Séance muscu" color="text-red-500 border-red-900/60 hover:border-red-700/70 hover:bg-red-900/10" />
          <QuickAction to="/running/new" icon={<PersonStanding className="w-6 h-6" />} label="Nouvelle course" color="text-blue-500 border-blue-900/60 hover:border-blue-700/70 hover:bg-blue-900/10" />
          <QuickAction to="/weight" icon={<Scale className="w-6 h-6" />} label="Peser" color="text-green-600 border-green-900/60 hover:border-green-700/70 hover:bg-green-900/10" />
        </div>
      </motion.div>

      {/* Dernières activités */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-rajdhani text-sm font-semibold text-[#8b6f47] uppercase tracking-wider">Dernières activités</h2>
          <Link to="/calendar" className="text-xs text-[#c9a870]/70 hover:text-[#c9a870] flex items-center gap-1 transition-colors">
            Voir tout <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="space-y-3">
          {lastWorkout && (
            <ActivityPreview
              icon={<Dumbbell className="w-4 h-4 text-red-400" />}
              title="Séance musculation"
              subtitle={`${lastWorkout.total_tonnage ? Math.round(lastWorkout.total_tonnage) + ' kg soulevés' : ''}`}
              date={lastWorkout.date}
              to="/musculation"
            />
          )}
          {lastRun && (
            <ActivityPreview
              icon={<PersonStanding className="w-4 h-4 text-blue-500" />}
              title={`Course · ${formatDistance(lastRun.distance)}`}
              subtitle={formatDuration(lastRun.duration)}
              date={lastRun.date}
              to="/running"
            />
          )}
          {lastWeight && (
            <ActivityPreview
              icon={<Scale className="w-4 h-4 text-green-600" />}
              title={`Pesée · ${formatWeight(lastWeight.weight)}`}
              subtitle={lastWeight.notes ?? ''}
              date={lastWeight.date}
              to="/weight"
            />
          )}
          {!lastWorkout && !lastRun && !lastWeight && (
            <div className="text-center py-8 text-[#6b6b6b]">
              <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Commence à enregistrer tes activités !</p>
              <Link to="/musculation/new" className="text-red-400 text-sm mt-2 inline-block hover:text-red-300 transition-colors">
                Première séance →
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function StatCard({ icon, value, label, color, bg }: {
  icon: React.ReactNode; value: string | number; label: string; color: string; bg: string;
}) {
  return (
    <div className={`flex items-center gap-3 p-4 rounded border ${bg}`}>
      <div className={color}>{icon}</div>
      <div>
        <p className={`text-lg font-bold ${color}`}>{value}</p>
        <p className="text-xs text-[#a3a3a3]">{label}</p>
      </div>
    </div>
  );
}

function QuickAction({ to, icon, label, color }: {
  to: string; icon: React.ReactNode; label: string; color: string;
}) {
  return (
    <Link
      to={to}
      className={`flex flex-col items-center gap-2 p-4 bg-transparent border transition-colors text-center ${color}`}
    >
      <div>{icon}</div>
      <span className="text-xs font-rajdhani font-semibold tracking-wide">{label}</span>
    </Link>
  );
}

function ActivityPreview({ icon, title, subtitle, date, to }: {
  icon: React.ReactNode; title: string; subtitle: string; date: string; to: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 p-4 bg-[#111111] border-l-2 border-[#c9a870]/20 hover:border-[#c9a870]/60 hover:bg-[#1c1c1c] transition-all"
    >
      <div className="p-2 bg-[#1c1c1c]">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#d4d4d4] truncate">{title}</p>
        {subtitle && <p className="text-xs text-[#a3a3a3] truncate">{subtitle}</p>}
      </div>
      <span className="text-xs text-[#6b6b6b] flex-shrink-0">{formatRelativeTime(date)}</span>
    </Link>
  );
}
