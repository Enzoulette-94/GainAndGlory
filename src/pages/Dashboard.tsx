import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell, PersonStanding, Scale, Flame, Trophy, ChevronRight, CalendarDays, Swords, Target, Zap, Activity, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { workoutService } from '../services/workout.service';
import { runningService } from '../services/running.service';
import { weightService } from '../services/weight.service';
import { calisthenicsService } from '../services/calisthenics.service';
import { goalsService } from '../services/goals.service';
import { supabase } from '../lib/supabase-client';
import { XPBar } from '../components/xp-system/XPBar';
import { getLevelTitle, formatWeight, formatDistance, formatDuration, formatRelativeTime, formatDate } from '../utils/calculations';
import { getDailyQuote } from '../data/motivationQuotes';
import { hybridService, hybridMusculationTonnage, hybridRunningDistance, hybridHasBlock } from '../services/hybrid.service';
import type { WorkoutSession, RunningSession, WeightEntry, PersonalGoal, CalisthenicsSession } from '../types/models';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

interface UpcomingEvent {
  id: string;
  title: string;
  event_date: string;
  type: string | null;
}

interface ActiveChallenge {
  id: string;
  title: string;
  type: 'distance' | 'tonnage' | 'sessions';
  target_value: number;
  unit: string;
  end_date: string;
  total_contribution: number;
}

export function DashboardPage() {
  const { profile } = useAuth();
  const [lastWorkout, setLastWorkout] = useState<WorkoutSession | null>(null);
  const [lastRun, setLastRun] = useState<RunningSession | null>(null);
  const [lastWeight, setLastWeight] = useState<WeightEntry | null>(null);
  const [lastCali, setLastCali] = useState<CalisthenicsSession | null>(null);
  const [weekStats, setWeekStats] = useState({ workouts: 0, runs: 0, distance: 0, tonnage: 0 });
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [activeChallenges, setActiveChallenges] = useState<ActiveChallenge[]>([]);
  const [personalGoals, setPersonalGoals] = useState<PersonalGoal[]>([]);

  useEffect(() => {
    if (!profile) return;
    const userId = profile.id;

    Promise.all([
      workoutService.getSessions(userId, 1),
      runningService.getSessions(userId, 1),
      weightService.getLatest(userId),
      calisthenicsService.getSessions(userId, 1),
    ]).then(([workouts, runs, weight, calis]) => {
      setLastWorkout(workouts[0] ?? null);
      setLastRun(runs[0] ?? null);
      setLastWeight(weight);
      setLastCali(calis[0] ?? null);
    });

    // Événements à venir
    const today = new Date().toISOString().split('T')[0];
    db.from('events')
      .select('id, title, event_date, type')
      .eq('user_id', userId)
      .gte('event_date', today)
      .order('event_date', { ascending: true })
      .limit(3)
      .then(({ data }: { data: UpcomingEvent[] | null }) => setUpcomingEvents(data ?? []));

    // Objectifs communs actifs
    db.from('community_challenges')
      .select('id, title, type, target_value, unit, end_date, participations:challenge_participations(contribution)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(3)
      .then(({ data }: { data: any[] | null }) => {
        const challenges = (data ?? []).map((c: any) => ({
          ...c,
          total_contribution: (c.participations ?? []).reduce((sum: number, p: any) => sum + (p.contribution ?? 0), 0),
        }));
        setActiveChallenges(challenges);
      });

    // Objectifs personnels actifs
    goalsService.getGoals(userId).then(goals => {
      setPersonalGoals(goals.filter(g => g.status === 'active').slice(0, 3));
    });

    // Stats semaine
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1);
    weekStart.setHours(0, 0, 0, 0);

    Promise.all([
      workoutService.getSessions(userId, 50),
      runningService.getSessions(userId, 50),
      hybridService.getSessions(userId, 50),
    ]).then(([workouts, runs, hybrids]) => {
      const weekWorkouts = workouts.filter(w => new Date(w.date) >= weekStart);
      const weekRuns = runs.filter(r => new Date(r.date) >= weekStart);
      const weekHybrids = hybrids.filter(h => new Date(h.date) >= weekStart);
      setWeekStats({
        workouts: weekWorkouts.length + weekHybrids.filter(h => hybridHasBlock(h.blocks, 'musculation')).length,
        runs: weekRuns.length + weekHybrids.filter(h => hybridHasBlock(h.blocks, 'running')).length,
        distance: weekRuns.reduce((sum, r) => sum + r.distance, 0)
                + weekHybrids.reduce((sum, h) => sum + hybridRunningDistance(h.blocks), 0),
        tonnage: weekWorkouts.reduce((sum, w) => sum + (w.total_tonnage ?? 0), 0)
               + weekHybrids.reduce((sum, h) => sum + hybridMusculationTonnage(h.blocks), 0),
      });
    });
  }, [profile]);

  if (!profile) return null;

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? 'Bonjour' : greetingHour < 18 ? 'Bon après-midi' : 'Bonsoir';

  return (
    <div className="space-y-6">

      {/* ── LIGNE 1 : Greeting | Actions rapides | XP Bars ── */}
      <section aria-label="Accueil et actions rapides">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:grid lg:grid-cols-[280px_1fr] gap-4"
      >
        {/* Greeting + Streak — order 1 sur mobile, colonne droite haut sur desktop */}
        <div className="order-1 lg:order-2 flex items-start justify-between">
          <div>
            <h1 className="font-rajdhani text-3xl font-bold tracking-wide uppercase text-[#c9a870]">
              {greeting}, {profile.username}
            </h1>
            <p className="text-[#a3a3a3] text-sm mt-0.5">
              {getLevelTitle(profile.global_level)} · Niveau {profile.global_level}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-black/50 border border-orange-900/50 px-3 py-2 flex-shrink-0">
            <span className="text-[11px] text-orange-500 uppercase tracking-wide font-rajdhani font-bold">Streak du moment</span>
            <Flame className="w-4 h-4 text-orange-600" />
            <span className="font-bold text-orange-500 font-rajdhani text-lg leading-none">{profile.current_streak}</span>
            <span className="text-xs text-orange-500">jours</span>
          </div>
        </div>

        {/* Actions rapides — order 2 sur mobile, colonne gauche sur desktop */}
        <div className="order-2 lg:order-1 lg:row-span-2 bg-[#0e0e0e] border border-white/5 p-4 flex flex-col gap-3">
          <h2 className="font-rajdhani text-xs font-bold text-[#8b6f47] uppercase tracking-widest">Nouvelle session</h2>

          {/* Bouton Hybride — featured, pleine largeur */}
          <Link
            to="/hybrid/new"
            className="group relative flex items-center justify-between border border-[#c9a870]/25 bg-[#c9a870]/5 hover:bg-[#c9a870]/12 hover:border-[#c9a870]/45 transition-all duration-200 px-4 py-3 overflow-hidden"
          >
            <div className="flex items-center gap-3">
              <Layers className="w-4 h-4 text-[#c9a870] flex-shrink-0" />
              <div>
                <span className="font-rajdhani font-black text-sm uppercase tracking-wide text-[#c9a870] block leading-tight">Hybride</span>
                <span className="text-[10px] text-[#7a6040] leading-tight">Combiner plusieurs activités</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500/70" />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500/70" />
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500/70" />
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500/70" />
            </div>
          </Link>

          {/* 4 disciplines en 2×2 */}
          <div className="grid grid-cols-2 gap-2 flex-1">
            <QuickAction
              to="/musculation/new"
              label="Muscu"
              accentColor="text-red-400"
              borderColor="border-red-900/50"
              bgFrom="bg-red-950/20"
              bgHover="hover:bg-red-900/30 hover:border-red-700/60"
            />
            <QuickAction
              to="/running/new"
              label="Course"
              accentColor="text-blue-400"
              borderColor="border-blue-900/50"
              bgFrom="bg-blue-950/20"
              bgHover="hover:bg-blue-900/30 hover:border-blue-700/60"
            />
            <QuickAction
              to="/crossfit/new"
              label="Crossfit"
              accentColor="text-orange-400"
              borderColor="border-orange-900/50"
              bgFrom="bg-orange-950/20"
              bgHover="hover:bg-orange-900/30 hover:border-orange-700/60"
            />
            <QuickAction
              to="/calisthenics/new"
              label="Cali"
              accentColor="text-violet-400"
              borderColor="border-violet-900/50"
              bgFrom="bg-violet-950/20"
              bgHover="hover:bg-violet-900/30 hover:border-violet-700/60"
            />
          </div>
        </div>

        {/* XP Bars — order 3 sur mobile, colonne droite bas sur desktop */}
        <div className="order-3 lg:order-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <XPBar profile={profile} discipline="musculation" />
          <XPBar profile={profile} discipline="running" />
          <XPBar profile={profile} discipline="calisthenics" />
          <XPBar profile={profile} discipline="crossfit" />
        </div>
      </motion.div>
      </section>

      {/* ── LIGNE 2 : Motivation du jour ── */}
      <section aria-label="Motivation du jour">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="p-4 bg-[#0e0e0e] border border-[#c9a870]/20 border-l-2 border-l-[#c9a870]/60"
      >
        <p className="font-rajdhani text-xs font-semibold text-[#8b6f47] uppercase tracking-wider mb-2">Motivation du jour</p>
        <p className="text-sm text-[#d4d4d4] italic leading-relaxed">"{getDailyQuote()}"</p>
      </motion.div>
      </section>

      {/* ── LIGNE 2b : Stats de la semaine ── */}
      <section aria-label="Stats de la semaine">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        <StatCard icon={<Dumbbell className="w-5 h-5" />} value={weekStats.workouts} label="Séances muscu" color="text-red-400" bg="bg-red-950/10 border-red-900/30" />
        <StatCard icon={<PersonStanding className="w-5 h-5" />} value={weekStats.runs} label="Sorties course" color="text-blue-400" bg="bg-blue-950/10 border-blue-900/30" />
        <StatCard icon={<Activity className="w-5 h-5" />} value={Math.round(weekStats.distance * 10) / 10} label="km cette semaine" color="text-green-400" bg="bg-green-950/10 border-green-900/30" />
        <StatCard icon={<Flame className="w-5 h-5" />} value={Math.round(weekStats.tonnage)} label="kg soulevés" color="text-orange-400" bg="bg-orange-950/10 border-orange-900/30" />
      </motion.div>
      </section>

      {/* ── LIGNE 3 : Événements à venir | Dernières activités ── */}
      <section aria-label="Événements et activités récentes">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Événements à venir */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-rajdhani text-sm font-semibold text-[#8b6f47] uppercase tracking-wider">Événements à venir</h2>
            <Link to="/events" className="text-xs text-[#c9a870]/70 hover:text-[#c9a870] flex items-center gap-1 transition-colors">
              Voir tout <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {upcomingEvents.length === 0 ? (
            <p className="text-xs text-[#6b6b6b] py-3"><em>Aucun événement</em> à venir</p>
          ) : (
            <div className="space-y-2">
              {upcomingEvents.map(event => {
                const daysLeft = Math.max(0, Math.ceil((new Date(event.event_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
                return (
                  <Link
                    key={event.id}
                    to="/events"
                    className="flex items-center gap-3 p-3 bg-[#111111] border-l-2 border-yellow-500/30 hover:border-yellow-500/70 hover:bg-[#1c1c1c] transition-all"
                  >
                    <CalendarDays className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#d4d4d4] truncate">{event.title}</p>
                      <p className="text-xs text-[#a3a3a3]">{formatDate(event.event_date)}</p>
                    </div>
                    <span className="text-xs font-rajdhani font-semibold text-yellow-500 flex-shrink-0">
                      {daysLeft === 0 ? "Aujourd'hui" : `J-${daysLeft}`}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Dernières activités */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-rajdhani text-sm font-semibold text-[#8b6f47] uppercase tracking-wider">Dernières activités</h2>
            <Link to="/calendar" className="text-xs text-[#c9a870]/70 hover:text-[#c9a870] flex items-center gap-1 transition-colors">
              Voir tout <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {lastWorkout && (
              <article>
                <ActivityPreview
                  icon={<Dumbbell className="w-4 h-4 text-red-400" />}
                  title="Séance musculation"
                  subtitle={lastWorkout.total_tonnage ? `${Math.round(lastWorkout.total_tonnage)} kg soulevés` : ''}
                  date={lastWorkout.date}
                  to="/musculation"
                />
              </article>
            )}
            {lastRun && (
              <article>
                <ActivityPreview
                  icon={<PersonStanding className="w-4 h-4 text-blue-500" />}
                  title={`Course · ${formatDistance(lastRun.distance)}`}
                  subtitle={formatDuration(lastRun.duration)}
                  date={lastRun.date}
                  to="/running"
                />
              </article>
            )}
            {lastWeight && (
              <article>
                <ActivityPreview
                  icon={<Scale className="w-4 h-4 text-green-600" />}
                  title={`Pesée · ${formatWeight(lastWeight.weight)}`}
                  subtitle={lastWeight.notes ?? ''}
                  date={lastWeight.date}
                  to="/weight"
                />
              </article>
            )}
            {lastCali && (
              <article>
                <ActivityPreview
                  icon={<Zap className="w-4 h-4 text-violet-400" />}
                  title={lastCali.name ?? 'Séance calisthénie'}
                  subtitle={`${lastCali.total_reps} reps`}
                  date={lastCali.date}
                  to="/calisthenics"
                />
              </article>
            )}
            {!lastWorkout && !lastRun && !lastWeight && !lastCali && (
              <div className="text-center py-8 text-[#6b6b6b]">
                <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Commence à <strong>enregistrer</strong> tes activités !</p>
                <Link to="/musculation/new" className="text-red-400 text-sm mt-2 inline-block hover:text-red-300 transition-colors">
                  Première séance →
                </Link>
              </div>
            )}
          </div>
        </div>
      </motion.div>
      </section>

      {/* ── LIGNE 5 : Objectifs communs | Objectifs personnels ── */}
      <section aria-label="Objectifs">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Objectifs communs */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-rajdhani text-sm font-semibold text-[#8b6f47] uppercase tracking-wider">Objectifs communs</h2>
            <Link to="/team-goals" className="text-xs text-[#c9a870]/70 hover:text-[#c9a870] flex items-center gap-1 transition-colors">
              Voir tout <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {activeChallenges.length === 0 ? (
            <p className="text-xs text-[#6b6b6b] py-3"><em>Aucun défi</em> en cours</p>
          ) : (
            <div className="space-y-2">
              {activeChallenges.map(c => {
                const pct = Math.min(100, Math.round((c.total_contribution / c.target_value) * 100));
                return (
                  <Link
                    key={c.id}
                    to="/team-goals"
                    className="block p-3 bg-[#111111] border-l-2 border-[#c9a870]/30 hover:border-[#c9a870]/70 hover:bg-[#1c1c1c] transition-all"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Swords className="w-4 h-4 text-[#c9a870] flex-shrink-0" />
                      <p className="text-sm font-medium text-[#d4d4d4] truncate flex-1">{c.title}</p>
                      <span className="text-xs font-rajdhani font-bold text-[#c9a870]">{pct}%</span>
                    </div>
                    <div className="w-full h-1 bg-white/5">
                      <div className="h-1 bg-[#8b6f47] transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-[#6b6b6b] mt-1">{c.total_contribution} / {c.target_value} {c.unit}</p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Objectifs personnels */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-rajdhani text-sm font-semibold text-[#8b6f47] uppercase tracking-wider">Objectifs personnels</h2>
            <Link to="/goals" className="text-xs text-[#c9a870]/70 hover:text-[#c9a870] flex items-center gap-1 transition-colors">
              Voir tout <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {personalGoals.length === 0 ? (
            <p className="text-xs text-[#6b6b6b] py-3"><em>Aucun objectif</em> actif</p>
          ) : (
            <div className="space-y-2">
              {personalGoals.map(goal => {
                const pct = goal.target_value && goal.target_value > 0
                  ? Math.min(100, Math.round(((goal.current_value ?? 0) / goal.target_value) * 100))
                  : 0;
                const accent =
                  goal.type === 'musculation'  ? { border: 'border-red-500/30',    hoverBorder: 'hover:border-red-500/70',    icon: 'text-red-400',    pct: 'text-red-400',    bar: 'bg-red-500' }
                  : goal.type === 'running'    ? { border: 'border-blue-500/30',   hoverBorder: 'hover:border-blue-500/70',   icon: 'text-blue-400',   pct: 'text-blue-400',   bar: 'bg-blue-500' }
                  : goal.type === 'calisthenics' ? { border: 'border-violet-500/30', hoverBorder: 'hover:border-violet-500/70', icon: 'text-violet-400', pct: 'text-violet-400', bar: 'bg-violet-500' }
                  : { border: 'border-[#c9a870]/30', hoverBorder: 'hover:border-[#c9a870]/70', icon: 'text-[#c9a870]', pct: 'text-[#c9a870]', bar: 'bg-[#8b6f47]' };
                return (
                  <Link
                    key={goal.id}
                    to="/goals"
                    className={`block p-3 bg-[#111111] border-l-2 ${accent.border} ${accent.hoverBorder} hover:bg-[#1c1c1c] transition-all`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Target className={`w-4 h-4 ${accent.icon} flex-shrink-0`} />
                      <p className="text-sm font-medium text-[#d4d4d4] truncate flex-1">{goal.title}</p>
                      <span className={`text-xs font-rajdhani font-bold ${accent.pct}`}>{pct}%</span>
                    </div>
                    <div className="w-full h-1 bg-white/5">
                      <div className={`h-1 ${accent.bar} transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                    {goal.target_value && (
                      <p className="text-xs text-[#6b6b6b] mt-1">{goal.current_value ?? 0} / {goal.target_value} {goal.unit ?? ''}</p>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
      </section>

    </div>
  );
}

function StatCard({ icon, value, label, color, bg }: {
  icon: React.ReactNode; value: string | number; label: string; color: string; bg: string;
}) {
  // On stocke la valeur affichée (commence à 0)
  const [displayed, setDisplayed] = useState(0);
  const target = typeof value === 'number' ? value : parseFloat(value) || 0;

  useEffect(() => {
    if (target === 0) return;

    // On incrémente progressivement jusqu'à la valeur cible
    const steps = 30;
    const increment = target / steps;
    let current = 0;

    const interval = setInterval(() => {
      current += increment;
      if (current >= target) {
        setDisplayed(target);
        clearInterval(interval);
      } else {
        setDisplayed(Math.round(current));
      }
    }, 30); // toutes les 30ms → animation de ~900ms au total

    return () => clearInterval(interval); // nettoyage si le composant disparaît
  }, [target]);

  return (
    <div className={`flex items-center gap-3 p-4 rounded border ${bg}`}>
      <div className={color}>{icon}</div>
      <div>
        <p className={`text-lg font-bold ${color}`}>
          {typeof value === 'number' ? displayed : value}
        </p>
        <p className="text-xs text-[#a3a3a3]">{label}</p>
      </div>
    </div>
  );
}

function QuickAction({ to, label, accentColor, borderColor, bgFrom, bgHover }: {
  to: string;
  label: string;
  accentColor: string;
  borderColor: string;
  bgFrom: string;
  bgHover: string;
}) {
  return (
    <Link
      to={to}
      className={`group relative flex items-center justify-center border ${borderColor} ${bgFrom} ${bgHover} transition-all duration-200 min-h-[72px] overflow-hidden`}
    >
      <span className={`font-rajdhani font-black text-base uppercase tracking-wide ${accentColor}`}>
        {label}
      </span>
      {/* Barre de couleur en bas */}
      <span className={`absolute bottom-0 left-0 w-0 h-[2px] ${accentColor.replace('text-', 'bg-')} group-hover:w-full transition-all duration-300`} />
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
