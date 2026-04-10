import React, { useEffect, useState, useMemo } from 'react';
import {
  CalendarDays, ChevronLeft, ChevronRight,
  Dumbbell, PersonStanding, Scale, Target, Swords, Flag, Zap, Flame, Layers,
} from 'lucide-react';
import { Input, Select, Textarea } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { workoutService } from '../services/workout.service';
import { runningService } from '../services/running.service';
import { weightService } from '../services/weight.service';
import { goalsService } from '../services/goals.service';
import { calisthenicsService } from '../services/calisthenics.service';
import { crossfitService } from '../services/crossfit.service';
import { hybridService } from '../services/hybrid.service';
import { supabase } from '../lib/supabase-client';
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
  id: string; title: string; start_date: string; end_date: string; type: string;
}
interface EventItem {
  id: string; title: string; event_date: string; type: string | null; description: string | null;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  course: 'Course', competition: 'Compétition', trail: 'Trail', triathlon: 'Triathlon', autre: 'Autre',
};

// ── Code couleur unifié avec le reste du site ──────────────────────────────
const ACTIVITY_CONFIG = {
  workout:      { label: 'Muscu',       color: 'bg-red-500',    dim: 'bg-red-900/40',    text: 'text-red-400',    border: 'border-red-800/40',    accentBg: 'bg-gradient-to-r from-red-950/60 to-[#0d0d0d]',    accentBorder: 'border-l-red-700',    icon: Dumbbell,        iconColor: 'text-red-400'    },
  run:          { label: 'Course',      color: 'bg-blue-500',   dim: 'bg-blue-900/40',   text: 'text-blue-400',   border: 'border-blue-800/40',   accentBg: 'bg-gradient-to-r from-blue-950/60 to-[#0d0d0d]',   accentBorder: 'border-l-blue-700',   icon: PersonStanding,  iconColor: 'text-blue-400'   },
  calisthenics: { label: 'Calisthénie', color: 'bg-violet-500', dim: 'bg-violet-900/40', text: 'text-violet-400', border: 'border-violet-800/40', accentBg: 'bg-gradient-to-r from-violet-950/60 to-[#0d0d0d]', accentBorder: 'border-l-violet-700', icon: Zap,             iconColor: 'text-violet-400' },
  crossfit:     { label: 'Crossfit',    color: 'bg-orange-500', dim: 'bg-orange-900/40', text: 'text-orange-400', border: 'border-orange-800/40', accentBg: 'bg-gradient-to-r from-orange-950/60 to-[#0d0d0d]', accentBorder: 'border-l-orange-700', icon: Flame,           iconColor: 'text-orange-400' },
  hybrid:       { label: 'Hybride',     color: 'bg-teal-500',   dim: 'bg-teal-900/40',   text: 'text-teal-400',   border: 'border-teal-800/40',   accentBg: 'bg-gradient-to-r from-teal-950/60 to-[#0d0d0d]',   accentBorder: 'border-l-teal-700',   icon: Layers,          iconColor: 'text-teal-400'   },
  weight:       { label: 'Pesée',       color: 'bg-emerald-500',dim: 'bg-emerald-900/40',text: 'text-emerald-400',border: 'border-emerald-800/40',accentBg: 'bg-gradient-to-r from-emerald-950/60 to-[#0d0d0d]',accentBorder: 'border-l-emerald-700',icon: Scale,           iconColor: 'text-emerald-400'},
  goal:         { label: 'Objectif',    color: 'bg-[#c9a870]',  dim: 'bg-[#c9a870]/20',  text: 'text-[#c9a870]',  border: 'border-[#c9a870]/30',  accentBg: 'bg-gradient-to-r from-[#2a1f0a]/80 to-[#0d0d0d]',  accentBorder: 'border-l-[#c9a870]',  icon: Target,          iconColor: 'text-[#c9a870]'  },
  challenge:    { label: 'Défi équipe', color: 'bg-pink-500',   dim: 'bg-pink-900/40',   text: 'text-pink-400',   border: 'border-pink-800/40',   accentBg: 'bg-gradient-to-r from-pink-950/60 to-[#0d0d0d]',   accentBorder: 'border-l-pink-700',   icon: Swords,          iconColor: 'text-pink-400'   },
  event:        { label: 'Événement',   color: 'bg-amber-500',  dim: 'bg-amber-900/40',  text: 'text-amber-400',  border: 'border-amber-800/40',  accentBg: 'bg-gradient-to-r from-amber-950/60 to-[#0d0d0d]',  accentBorder: 'border-l-amber-700',  icon: Flag,            iconColor: 'text-amber-400'  },
} as const;

type ActivityKey = keyof typeof ACTIVITY_CONFIG;
const ACTIVITY_ORDER: ActivityKey[] = ['workout', 'run', 'calisthenics', 'crossfit', 'hybrid', 'weight', 'goal', 'challenge', 'event'];

// ── Types ──────────────────────────────────────────────────────────────────
type DayActivity = {
  date: string;
  types: Set<ActivityKey>;
  workouts: WorkoutSession[];
  runs: RunningSession[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  calis: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  crossfits: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  hybrids: any[];
  weights: WeightEntry[];
  goalDeadlines: PersonalGoal[];
  challengeEvents: { challenge: ChallengeItem; kind: 'start' | 'end' }[];
  events: EventItem[];
};

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

function toDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function getDatePart(s: string) { return s.split('T')[0]; }

// ── Composant principal ────────────────────────────────────────────────────
export function CalendarPage() {
  const { profile } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [runs, setRuns] = useState<RunningSession[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [calis, setCalis] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [crossfits, setCrossfits] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [hybrids, setHybrids] = useState<any[]>([]);
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [goals, setGoals] = useState<PersonalGoal[]>([]);
  const [challenges, setChallenges] = useState<ChallengeItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<DayActivity | null>(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setLoading(true);
    Promise.all([
      workoutService.getSessions(profile.id, 300),
      runningService.getSessions(profile.id, 300),
      calisthenicsService.getSessions(profile.id, 300),
      crossfitService.getSessions(profile.id, 300),
      hybridService.getSessions(profile.id, 300),
      weightService.getEntries(profile.id, 300),
      goalsService.getGoals(profile.id),
      db.from('community_challenges').select('id,title,start_date,end_date,type,participations:challenge_participations(user_id)').in('status', ['active', 'pending']).then(({ data }: { data: (ChallengeItem & { participations?: { user_id: string }[] })[] | null }) => (data ?? []).filter(c => (c.participations ?? []).some((p: { user_id: string }) => p.user_id === profile.id))),
      db.from('events').select('id,title,event_date,type,description').order('event_date', { ascending: true }).then(({ data }: { data: EventItem[] | null }) => data ?? []),
    ]).then(([w, r, c, cf, hy, wt, g, ch, ev]) => {
      setWorkouts(w as WorkoutSession[]);
      setRuns(r as RunningSession[]);
      setCalis(c as any[]);
      setCrossfits(cf as any[]);
      setHybrids(hy as any[]);
      setWeights(wt as WeightEntry[]);
      setGoals((g as PersonalGoal[]).filter(g => g.status === 'active' && g.deadline));
      setChallenges(ch as ChallengeItem[]);
      setEvents(ev as EventItem[]);
    }).finally(() => setLoading(false));
  }, [profile]);

  // ── Construction de la map des activités par jour ────────────────────────
  const activityMap = useMemo(() => {
    const map = new Map<string, DayActivity>();
    const ensure = (d: string): DayActivity => {
      if (!map.has(d)) map.set(d, { date: d, types: new Set(), workouts: [], runs: [], calis: [], crossfits: [], hybrids: [], weights: [], goalDeadlines: [], challengeEvents: [], events: [] });
      return map.get(d)!;
    };

    for (const w of workouts)   { const a = ensure(getDatePart(w.date));       a.types.add('workout');      a.workouts.push(w); }
    for (const r of runs)       { const a = ensure(getDatePart(r.date));       a.types.add('run');          a.runs.push(r); }
    for (const c of calis)      { const a = ensure(getDatePart(c.date));       a.types.add('calisthenics'); a.calis.push(c); }
    for (const cf of crossfits) { const a = ensure(getDatePart(cf.date));      a.types.add('crossfit');     a.crossfits.push(cf); }
    for (const hy of hybrids)  { const a = ensure(getDatePart(hy.date));      a.types.add('hybrid');       a.hybrids.push(hy); }
    for (const wt of weights)   { const a = ensure(getDatePart(wt.date));      a.types.add('weight');       a.weights.push(wt); }
    for (const g of goals) {
      if (!g.deadline) continue;
      const a = ensure(getDatePart(g.deadline));
      a.types.add('goal');
      a.goalDeadlines.push(g);
    }
    for (const c of challenges) {
      const a = ensure(getDatePart(c.end_date));
      a.types.add('challenge');
      if (!a.challengeEvents.find(e => e.challenge.id === c.id)) a.challengeEvents.push({ challenge: c, kind: 'end' });
    }
    for (const ev of events) {
      const a = ensure(getDatePart(ev.event_date));
      a.types.add('event');
      a.events.push(ev);
    }
    return map;
  }, [workouts, runs, calis, crossfits, hybrids, weights, goals, challenges, events]);

  // ── Jours du mois ────────────────────────────────────────────────────────
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    let startDow = new Date(year, month, 1).getDay() - 1;
    if (startDow === -1) startDow = 6;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const days: (Date | null)[] = [];
    for (let i = 0; i < startDow; i++) days.push(null);
    for (let d = 1; d <= lastDay; d++) days.push(new Date(year, month, d));
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [currentDate]);

  // ── Stats du mois ────────────────────────────────────────────────────────
  const monthStats = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    let workoutDays = 0, runDays = 0, caliDays = 0, crossfitDays = 0, hybridDays = 0;
    let totalDist = 0, totalTonnage = 0;
    for (const [dateStr, a] of activityMap) {
      const d = new Date(dateStr);
      if (d.getFullYear() !== year || d.getMonth() !== month) continue;
      if (a.types.has('workout'))      { workoutDays++;  totalTonnage += a.workouts.reduce((s, w) => s + (w.total_tonnage ?? 0), 0); }
      if (a.types.has('run'))          { runDays++;      totalDist    += a.runs.reduce((s, r) => s + r.distance, 0); }
      if (a.types.has('calisthenics')) caliDays++;
      if (a.types.has('crossfit'))     crossfitDays++;
      if (a.types.has('hybrid'))       hybridDays++;
    }
    return { workoutDays, runDays, caliDays, crossfitDays, hybridDays, totalDist, totalTonnage };
  }, [activityMap, currentDate]);

  // ── Items ce mois (objectifs, défis, events) ─────────────────────────────
  const monthItems = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    return {
      goals: goals.filter(g => { if (!g.deadline) return false; const d = new Date(g.deadline); return d.getFullYear() === year && d.getMonth() === month; }),
      challenges: challenges.filter(c => new Date(c.start_date) <= last && new Date(c.end_date) >= first),
      events: events.filter(ev => { const d = new Date(ev.event_date); return d.getFullYear() === year && d.getMonth() === month; }),
    };
  }, [goals, challenges, events, currentDate]);

  const prevMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  const goToday   = () => setCurrentDate(new Date());
  const todayStr  = toDateStr(new Date());
  const totalMonthActivities = monthStats.workoutDays + monthStats.runDays + monthStats.caliDays + monthStats.crossfitDays + monthStats.hybridDays;

  async function reloadData() {
    if (!profile) return;
    const [newGoals, newEvents] = await Promise.all([
      goalsService.getGoals(profile.id),
      db.from('events').select('id,title,event_date,type,description').order('event_date', { ascending: true }).then(({ data }: any) => data ?? []),
    ]);
    setGoals((newGoals as PersonalGoal[]).filter(g => g.status === 'active' && g.deadline));
    setEvents(newEvents);
  }

  const allEvents = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return [...events]
      .filter(ev => ev.event_date >= today)
      .sort((a, b) => a.event_date.localeCompare(b.event_date));
  }, [events]);

  if (!profile) return null;

  return (
    <div className="space-y-4">

      {/* ── Header ────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden -mx-4 px-6 py-8 sm:mx-0 sm:px-8"
        style={{ background: 'linear-gradient(135deg, #080808 0%, #0e0a00 50%, #080808 100%)' }}
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9a870]/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9a870]/20 to-transparent" />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-[0.04] pointer-events-none select-none">
          <CalendarDays className="w-44 h-44 text-[#c9a870]" />
        </div>

        <div className="relative flex flex-col items-center text-center gap-3">
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
            className="flex items-center justify-center w-14 h-14 border-2 border-[#c9a870]/40 bg-[#c9a870]/5"
          >
            <CalendarDays className="w-7 h-7 text-[#c9a870]" />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h1
              className="font-rajdhani font-black uppercase leading-none tracking-[0.25em]"
              style={{
                fontSize: 'clamp(1.8rem, 7vw, 3.5rem)',
                background: 'linear-gradient(180deg, #f5d990 0%, #c9a870 45%, #8b6f47 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Calendrier
            </h1>
            <div className="flex items-center justify-center gap-3 mt-2">
              <div className="h-px flex-1 max-w-[60px] bg-gradient-to-r from-transparent to-[#c9a870]/40" />
              <p className="text-[10px] text-[#8b6f47] uppercase tracking-[0.3em] font-rajdhani font-bold">
                {totalMonthActivities} séance{totalMonthActivities > 1 ? 's' : ''} ce mois
              </p>
              <div className="h-px flex-1 max-w-[60px] bg-gradient-to-l from-transparent to-[#c9a870]/40" />
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* ── Boutons d'action rapide ────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2">
        <button onClick={() => setShowGoalModal(true)} className="flex items-center justify-center gap-1.5 px-2 py-2 border border-[#c9a870]/30 bg-[#c9a870]/5 text-[#c9a870] text-xs font-rajdhani font-bold uppercase tracking-wide hover:bg-[#c9a870]/10 transition-colors">
          <Target className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">+ Objectif perso</span>
        </button>
        <button onClick={() => setShowChallengeModal(true)} className="flex items-center justify-center gap-1.5 px-2 py-2 border border-pink-800/40 bg-pink-950/10 text-pink-400 text-xs font-rajdhani font-bold uppercase tracking-wide hover:bg-pink-900/20 transition-colors">
          <Swords className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">+ Équipe</span>
        </button>
        <button onClick={() => setShowEventModal(true)} className="flex items-center justify-center gap-1.5 px-2 py-2 border border-amber-800/40 bg-amber-950/10 text-amber-400 text-xs font-rajdhani font-bold uppercase tracking-wide hover:bg-amber-900/20 transition-colors">
          <Flag className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">+ Événement</span>
        </button>
      </div>

      {/* ── Séparateur Échéances ── */}
      <div className="relative flex items-center gap-4 py-2">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#c9a870]/40 to-[#c9a870]/60" />
        <div className="flex items-center gap-2 px-4 py-1.5 border border-[#c9a870]/30 bg-[#c9a870]/5">
          <Target className="w-3.5 h-3.5 text-[#c9a870]" />
          <span className="text-xs font-rajdhani font-black uppercase tracking-[0.3em] text-[#c9a870]">Échéances</span>
        </div>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent via-[#c9a870]/40 to-[#c9a870]/60" />
      </div>

      {/* ── À venir ───────────────────────────────────────────────────── */}
      {(() => {
        const DAYS_LONG = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
        const upcoming: { date: string; label: string; sub?: string; type: ActivityKey; daysLeft: number }[] = [
          ...monthItems.events.map(ev => ({
            date: ev.event_date,
            label: ev.title,
            sub: ev.type ? (EVENT_TYPE_LABELS[ev.type] ?? ev.type) : undefined,
            type: 'event' as ActivityKey,
            daysLeft: Math.max(0, Math.ceil((new Date(ev.event_date).getTime() - Date.now()) / 86400000)),
          })),
          ...monthItems.goals.map(g => ({
            date: g.deadline!,
            label: g.title,
            sub: g.target_value ? `${g.current_value ?? 0} / ${g.target_value} ${g.unit ?? ''}` : undefined,
            type: 'goal' as ActivityKey,
            daysLeft: Math.max(0, Math.ceil((new Date(g.deadline!).getTime() - Date.now()) / 86400000)),
          })),
          ...monthItems.challenges.map(c => ({
            date: c.end_date,
            label: c.title,
            sub: 'Fin du défi',
            type: 'challenge' as ActivityKey,
            daysLeft: Math.max(0, Math.ceil((new Date(c.end_date).getTime() - Date.now()) / 86400000)),
          })),
        ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        if (upcoming.length === 0) return null;

        return (
          <div className="space-y-2">
            <p className="text-[10px] font-rajdhani font-bold uppercase tracking-widest text-[#4a4a4a]">
              À venir — {upcoming.length} échéance{upcoming.length > 1 ? 's' : ''}
            </p>
            {upcoming.map((item, i) => {
              const cfg = ACTIVITY_CONFIG[item.type];
              const Icon = cfg.icon;
              const d = new Date(item.date);
              const dayName  = DAYS_LONG[d.getDay()];
              const fullDate = `${dayName} ${d.getDate()} ${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`;
              const urgent   = item.daysLeft <= 7;

              return (
                <div key={i} className={`relative overflow-hidden border-l-4 ${cfg.accentBorder} ${cfg.accentBg} border border-white/5`}>
                  {/* Contenu */}
                  <div className="flex items-center gap-4 px-4 py-4">
                    {/* Icône catégorie */}
                    <div className={`flex-shrink-0 w-10 h-10 flex items-center justify-center border ${cfg.border} ${cfg.dim}`}>
                      <Icon className={`w-5 h-5 ${cfg.iconColor}`} />
                    </div>

                    {/* Titre + date */}
                    <div className="flex-1 min-w-0">
                      <p className="font-rajdhani font-black text-base text-[#f5f5f5] uppercase tracking-wide leading-tight truncate">
                        {item.label}
                      </p>
                      <p className={`text-xs mt-0.5 ${cfg.text} opacity-70`}>{fullDate}</p>
                      {item.sub && <p className="text-[10px] text-[#4a4a4a] mt-0.5">{item.sub}</p>}
                    </div>

                    {/* Countdown — gros et impactant */}
                    <div className="flex-shrink-0 text-right">
                      <p className={`font-rajdhani font-black text-3xl leading-none ${urgent ? 'text-red-400' : cfg.text}`}>
                        {item.daysLeft === 0 ? 'Auj.' : `J-${item.daysLeft}`}
                      </p>
                      <p className="text-[9px] text-[#3a3a3a] uppercase tracking-widest mt-0.5">
                        {cfg.label}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* ── Code couleur ──────────────────────────────────────────────── */}
      <div className="bg-[#0d0d0d] border border-white/5 px-4 py-3">
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {ACTIVITY_ORDER.map(k => {
            const cfg = ACTIVITY_CONFIG[k];
            const Icon = cfg.icon;
            return (
              <div key={k} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 ${cfg.color} flex-shrink-0`} />
                <Icon className={`w-3 h-3 ${cfg.iconColor} flex-shrink-0`} />
                <span className="text-[10px] text-[#5a5a5a] font-rajdhani font-semibold tracking-wide uppercase">{cfg.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Séparateur Calendrier ── */}
      <div className="relative flex items-center gap-4 py-2">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#c9a870]/40 to-[#c9a870]/60" />
        <div className="flex items-center gap-2 px-4 py-1.5 border border-[#c9a870]/30 bg-[#c9a870]/5">
          <CalendarDays className="w-3.5 h-3.5 text-[#c9a870]" />
          <span className="text-xs font-rajdhani font-black uppercase tracking-[0.3em] text-[#c9a870]">Calendrier</span>
        </div>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent via-[#c9a870]/40 to-[#c9a870]/60" />
      </div>

      {/* ── Calendrier ────────────────────────────────────────────────── */}
      <div className="bg-[#0d0d0d] border border-white/5">

        {/* Navigation mois */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <button onClick={prevMonth} className="p-1.5 text-[#6b6b6b] hover:text-[#d4d4d4] transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h2 className="font-rajdhani font-bold text-base text-[#f5f5f5] uppercase tracking-widest">
              {MONTHS_FR[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button onClick={goToday} className="text-sm font-rajdhani font-bold text-[#c9a870] hover:text-[#e5c99a] transition-colors tracking-wide mt-1 block uppercase">
              {(() => {
                const now = new Date();
                const days = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
                return `${days[now.getDay()]} ${now.getDate()} ${MONTHS_FR[now.getMonth()].toLowerCase()} ${now.getFullYear()}`;
              })()}
            </button>
          </div>
          <button onClick={nextMonth} className="p-1.5 text-[#6b6b6b] hover:text-[#d4d4d4] transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* En-têtes jours */}
        <div className="grid grid-cols-7 border-b border-white/5">
          {DAYS_FR.map((d, i) => (
            <div key={d} className={`text-center text-[10px] font-bold uppercase tracking-widest py-2 ${i >= 5 ? 'text-[#4a4a4a]' : 'text-[#5a5a5a]'}`}>{d}</div>
          ))}
        </div>

        {/* Grille */}
        {loading ? (
          <div className="h-48 flex items-center justify-center text-[#4a4a4a] text-sm font-rajdhani tracking-wider">CHARGEMENT...</div>
        ) : (
          <div className="grid grid-cols-7">
            {calendarDays.map((day, i) => {
              if (!day) return <div key={`e-${i}`} className="border-r border-b border-white/[0.03] h-[72px]" />;

              const dateStr   = toDateStr(day);
              const activity  = activityMap.get(dateStr);
              const isToday   = dateStr === todayStr;
              const isFuture  = day > new Date();
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;
              const activeTypes = activity ? ACTIVITY_ORDER.filter(k => activity.types.has(k)) : [];
              const isClickable = activeTypes.length > 0;
              const sportTypes  = activeTypes.filter(k => ['workout','run','calisthenics','crossfit','hybrid','weight'].includes(k));
              const markerTypes = activeTypes.filter(k => ['goal','challenge','event'].includes(k));

              return (
                <button
                  key={dateStr}
                  onClick={() => isClickable && activity && setSelectedDay(activity)}
                  disabled={!isClickable}
                  className={`
                    relative border-r border-b border-white/[0.03] h-[72px] flex flex-col p-1.5
                    transition-colors duration-100
                    ${isToday ? 'bg-[#c9a870]/10 ring-1 ring-inset ring-[#c9a870]/30' : isWeekend ? 'bg-white/[0.01]' : ''}
                    ${isClickable ? 'hover:bg-white/5 cursor-pointer' : 'cursor-default'}
                    ${isFuture && !isClickable ? 'opacity-20' : ''}
                  `}
                >
                  {/* Numéro du jour */}
                  <div className="flex flex-col leading-none overflow-hidden">
                    <span className={`
                      text-[11px] font-rajdhani font-bold leading-none
                      ${isToday ? 'text-[#c9a870]' : isWeekend ? 'text-[#3a3a3a]' : 'text-[#6b6b6b]'}
                    `}>
                      {day.getDate()}
                    </span>
                    {isToday && (
                      <span className="text-[8px] font-rajdhani font-black text-red-400 uppercase tracking-tight leading-none mt-0.5 block overflow-hidden whitespace-nowrap w-full">
                        Aujourd'hui
                      </span>
                    )}
                  </div>

                  {/* Icônes sport + marqueurs — centre */}
                  {activeTypes.length > 0 && (
                    <div className="flex flex-wrap gap-[3px] mt-1 flex-1">
                      {activeTypes.map(k => {
                        const Icon = ACTIVITY_CONFIG[k].icon;
                        return (
                          <div key={k} className={`w-5 h-5 flex items-center justify-center ${ACTIVITY_CONFIG[k].dim} rounded-sm`}>
                            <Icon className={`w-3 h-3 ${ACTIVITY_CONFIG[k].iconColor}`} />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Strips couleur en bas */}
                  {activeTypes.length > 0 && (
                    <div className="flex w-full h-1.5 mt-auto -mx-1.5 -mb-1.5">
                      {activeTypes.map(k => (
                        <div key={k} className={`flex-1 ${ACTIVITY_CONFIG[k].color}`} />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

      </div>

      {/* ── Stats du mois ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { value: monthStats.workoutDays,  label: 'Muscu',      color: 'text-red-400',    cfg: ACTIVITY_CONFIG.workout      },
          { value: monthStats.runDays,      label: 'Course',     color: 'text-blue-400',   cfg: ACTIVITY_CONFIG.run          },
          { value: monthStats.caliDays,     label: 'Calisthénie',color: 'text-violet-400', cfg: ACTIVITY_CONFIG.calisthenics },
          { value: monthStats.crossfitDays, label: 'Crossfit',   color: 'text-orange-400', cfg: ACTIVITY_CONFIG.crossfit     },
          { value: monthStats.hybridDays,   label: 'Hybride',    color: 'text-teal-400',   cfg: ACTIVITY_CONFIG.hybrid       },
        ].map(({ value, label, color, cfg }) => {
          const Icon = cfg.icon;
          return (
            <div key={label} className={`bg-[#0d0d0d] border border-white/5 p-3 flex items-center gap-2.5`}>
              <Icon className={`w-4 h-4 ${color} flex-shrink-0`} />
              <div>
                <p className={`font-rajdhani font-bold text-lg leading-none ${color}`}>{value}</p>
                <p className="text-[9px] text-[#4a4a4a] uppercase tracking-widest mt-0.5">{label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Liens rapides ─────────────────────────────────────────────── */}
      {(monthItems.goals.length > 0 || monthItems.challenges.length > 0 || monthItems.events.length > 0) && (
        <div className="flex gap-3">
          {monthItems.goals.length > 0 && <Link to="/goals" className="text-[10px] text-[#4a4a4a] hover:text-[#c9a870] transition-colors font-rajdhani">Voir objectifs →</Link>}
          {monthItems.challenges.length > 0 && <Link to="/team-goals" className="text-[10px] text-[#4a4a4a] hover:text-pink-400 transition-colors font-rajdhani">Voir défis →</Link>}
          {monthItems.events.length > 0 && <Link to="/events" className="text-[10px] text-[#4a4a4a] hover:text-amber-400 transition-colors font-rajdhani">Voir événements →</Link>}
        </div>
      )}

      {/* ── Séparateur Événements ── */}
      <div className="relative flex items-center gap-4 py-2">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-800/40 to-amber-700/60" />
        <div className="flex items-center gap-2 px-4 py-1.5 border border-amber-800/40 bg-amber-950/10">
          <Flag className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-xs font-rajdhani font-black uppercase tracking-[0.3em] text-amber-500">Événements à venir</span>
        </div>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent via-amber-800/40 to-amber-700/60" />
      </div>

      {/* ── Événements à venir ────────────────────────────────────────── */}
      <div className="space-y-2">
        {allEvents.length === 0 ? (
          <div className="text-center py-6 border border-white/5 bg-[#0d0d0d]">
            <p className="text-xs text-[#4a4a4a]">Aucun événement à venir.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allEvents.map((ev) => {
              const d = new Date(ev.event_date);
              const daysLeft = Math.max(0, Math.ceil((d.getTime() - Date.now()) / 86400000));
              const urgent = daysLeft <= 7;
              return (
                <div key={ev.id} className={`flex items-center justify-between px-4 py-4 border-l-4 ${urgent ? 'border-l-red-500 border border-red-500/20 bg-red-950/15' : 'border-l-amber-500 border border-amber-700/25 bg-amber-950/10'}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <Flag className={`w-4 h-4 shrink-0 ${urgent ? 'text-red-400' : 'text-amber-400'}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-rajdhani font-bold text-white uppercase tracking-wide truncate">{ev.title}</p>
                      <p className={`text-xs font-medium mt-0.5 ${urgent ? 'text-red-400' : 'text-amber-500'}`}>{formatDate(ev.event_date)}{ev.type ? ` · ${ev.type}` : ''}</p>
                    </div>
                  </div>
                  <div className={`shrink-0 ml-4 flex flex-col items-center justify-center px-3 py-1.5 border ${urgent ? 'border-red-500/40 bg-red-950/30' : 'border-amber-600/40 bg-amber-950/20'}`}>
                    <span className={`font-rajdhani font-black text-2xl leading-none ${urgent ? 'text-red-400' : 'text-amber-400'}`}>
                      {daysLeft === 0 ? 'AUJ.' : `J-${daysLeft}`}
                    </span>
                    {daysLeft > 0 && <span className={`text-[9px] font-rajdhani font-bold uppercase tracking-widest ${urgent ? 'text-red-600' : 'text-amber-700'}`}>jours</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modal détail du jour ───────────────────────────────────────── */}
      <Modal
        isOpen={!!selectedDay}
        onClose={() => setSelectedDay(null)}
        title={selectedDay ? formatDate(selectedDay.date, { weekday: 'long', day: 'numeric', month: 'long' }) : ''}
        size="lg"
      >
        {selectedDay && (
          <div className="p-4 space-y-4">

            {/* Types actifs — pills */}
            <div className="flex flex-wrap gap-1.5">
              {ACTIVITY_ORDER.filter(k => selectedDay.types.has(k)).map(k => {
                const cfg = ACTIVITY_CONFIG[k];
                const Icon = cfg.icon;
                return (
                  <span key={k} className={`flex items-center gap-1 text-[10px] font-rajdhani font-bold uppercase tracking-wide px-2 py-1 border ${cfg.border} ${cfg.text}`}>
                    <Icon className="w-3 h-3" /> {cfg.label}
                  </span>
                );
              })}
            </div>

            {/* Musculation */}
            {selectedDay.workouts.length > 0 && (
              <Section icon={<Dumbbell className="w-4 h-4 text-red-400" />} title={`Musculation · ${selectedDay.workouts.length}`}>
                {selectedDay.workouts.map(w => {
                  const exCount = w.sets ? new Set(w.sets.map(s => s.exercise_id)).size : 0;
                  const fb = w.feedback as Feedback | null;
                  return (
                    <div key={w.id} className="p-2.5 bg-[#111] border border-red-900/30">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-sm">
                          {w.total_tonnage && w.total_tonnage > 0 && <span className="font-bold text-[#e5e5e5]">{formatNumber(w.total_tonnage)} kg</span>}
                          {exCount > 0 && <span className="text-[#6b6b6b] text-xs">{exCount} ex.</span>}
                        </div>
                        {fb && <span className={`text-xs ${FEEDBACK_COLORS[fb]}`}>{FEEDBACK_LABELS[fb]}</span>}
                      </div>
                      {w.notes && <p className="text-xs text-[#5a5a5a] mt-1">{w.notes}</p>}
                    </div>
                  );
                })}
              </Section>
            )}

            {/* Course */}
            {selectedDay.runs.length > 0 && (
              <Section icon={<PersonStanding className="w-4 h-4 text-blue-400" />} title={`Course · ${selectedDay.runs.length}`}>
                {selectedDay.runs.map(r => {
                  const rt = r.run_type as RunType | null;
                  const fb = r.feedback as Feedback | null;
                  return (
                    <div key={r.id} className="p-2.5 bg-[#111] border border-blue-900/30">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-bold text-[#e5e5e5]">{formatDistance(r.distance)}</span>
                          <span className="text-[#6b6b6b] text-xs">{formatDuration(r.duration)}</span>
                          {r.pace_min_per_km && r.pace_min_per_km > 0 && <span className="text-blue-400 text-xs">{formatPace(r.pace_min_per_km)}</span>}
                        </div>
                        <div className="flex items-center gap-1">
                          {rt && <span className="text-[10px] text-blue-500">{RUN_TYPE_LABELS[rt]}</span>}
                          {fb && <span className={`text-xs ${FEEDBACK_COLORS[fb]}`}>{FEEDBACK_LABELS[fb]}</span>}
                        </div>
                      </div>
                      {r.notes && <p className="text-xs text-[#5a5a5a] mt-1">{r.notes}</p>}
                    </div>
                  );
                })}
              </Section>
            )}

            {/* Calisthénie */}
            {selectedDay.calis.length > 0 && (
              <Section icon={<Zap className="w-4 h-4 text-violet-400" />} title={`Calisthénie · ${selectedDay.calis.length}`}>
                {selectedDay.calis.map((c: any) => (
                  <div key={c.id} className="p-2.5 bg-[#111] border border-violet-900/30">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-[#e5e5e5]">{c.name ?? 'Séance'}</span>
                      {c.feedback && <span className={`text-xs ${FEEDBACK_COLORS[c.feedback as Feedback]}`}>{FEEDBACK_LABELS[c.feedback as Feedback]}</span>}
                    </div>
                    {c.exercises?.length > 0 && <p className="text-xs text-[#5a5a5a] mt-0.5">{c.exercises.length} exercice{c.exercises.length > 1 ? 's' : ''}</p>}
                  </div>
                ))}
              </Section>
            )}

            {/* Crossfit */}
            {selectedDay.crossfits.length > 0 && (
              <Section icon={<Flame className="w-4 h-4 text-orange-400" />} title={`Crossfit · ${selectedDay.crossfits.length}`}>
                {selectedDay.crossfits.map((cf: any) => (
                  <div key={cf.id} className="p-2.5 bg-[#111] border border-orange-900/30">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-[#e5e5e5]">{cf.name ?? cf.wod_type?.toUpperCase() ?? 'WOD'}</span>
                      {cf.feedback && <span className={`text-xs ${FEEDBACK_COLORS[cf.feedback as Feedback]}`}>{FEEDBACK_LABELS[cf.feedback as Feedback]}</span>}
                    </div>
                    {cf.exercises?.length > 0 && <p className="text-xs text-[#5a5a5a] mt-0.5">{cf.exercises.length} exercice{cf.exercises.length > 1 ? 's' : ''}</p>}
                  </div>
                ))}
              </Section>
            )}

            {/* Hybride */}
            {selectedDay.hybrids.length > 0 && (
              <Section icon={<Layers className="w-4 h-4 text-teal-400" />} title={`Hybride · ${selectedDay.hybrids.length}`}>
                {selectedDay.hybrids.map((h: any) => (
                  <div key={h.id} className="p-2.5 bg-[#111] border border-teal-900/30">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-[#e5e5e5]">{h.name ?? 'Séance hybride'}</span>
                      {h.feedback && <span className={`text-xs ${FEEDBACK_COLORS[h.feedback as Feedback]}`}>{FEEDBACK_LABELS[h.feedback as Feedback]}</span>}
                    </div>
                    {h.blocks?.length > 0 && <p className="text-xs text-[#5a5a5a] mt-0.5">{h.blocks.map((b: any) => b.blockType).join(' + ')}</p>}
                    {h.notes && <p className="text-xs text-[#5a5a5a] mt-1">{h.notes}</p>}
                  </div>
                ))}
              </Section>
            )}

            {/* Pesée */}
            {selectedDay.weights.length > 0 && (
              <Section icon={<Scale className="w-4 h-4 text-emerald-400" />} title="Pesée">
                {selectedDay.weights.map(wt => (
                  <div key={wt.id} className="p-2.5 bg-[#111] border border-emerald-900/30">
                    <span className="font-bold text-emerald-400">{wt.weight.toFixed(1)} kg</span>
                    {wt.notes && <p className="text-xs text-[#5a5a5a] mt-1">{wt.notes}</p>}
                  </div>
                ))}
              </Section>
            )}

            {/* Objectifs deadline */}
            {selectedDay.goalDeadlines.length > 0 && (
              <Section icon={<Target className="w-4 h-4 text-[#c9a870]" />} title="Deadline objectif">
                {selectedDay.goalDeadlines.map(g => {
                  const pct = g.target_value ? Math.min(100, Math.round(((g.current_value ?? 0) / g.target_value) * 100)) : 0;
                  return (
                    <div key={g.id} className="p-2.5 bg-[#111] border border-[#c9a870]/20">
                      <p className="text-sm font-medium text-[#d4d4d4]">{g.title}</p>
                      {g.target_value && <p className="text-xs text-[#6b6b6b] mt-0.5">{g.current_value ?? 0} / {g.target_value} {g.unit ?? ''} · {pct}%</p>}
                    </div>
                  );
                })}
              </Section>
            )}

            {/* Défis */}
            {selectedDay.challengeEvents.length > 0 && (
              <Section icon={<Swords className="w-4 h-4 text-pink-400" />} title="Défi équipe — fin">
                {selectedDay.challengeEvents.map(({ challenge }) => (
                  <div key={challenge.id} className="p-2.5 bg-[#111] border border-pink-900/30">
                    <p className="text-sm font-medium text-[#d4d4d4]">{challenge.title}</p>
                  </div>
                ))}
              </Section>
            )}

            {/* Événements */}
            {selectedDay.events.length > 0 && (
              <Section icon={<Flag className="w-4 h-4 text-amber-400" />} title={`Événement · ${selectedDay.events.length}`}>
                {selectedDay.events.map(ev => (
                  <div key={ev.id} className="p-2.5 bg-[#111] border border-amber-900/30">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-[#d4d4d4]">{ev.title}</p>
                      {ev.type && <span className="text-[10px] text-amber-400">{EVENT_TYPE_LABELS[ev.type] ?? ev.type}</span>}
                    </div>
                    {ev.description && <p className="text-xs text-[#5a5a5a] mt-1">{ev.description}</p>}
                  </div>
                ))}
              </Section>
            )}

          </div>
        )}
      </Modal>

      {/* ── Modal nouvel objectif perso ────────────────────────────────── */}
      <GoalModal
        isOpen={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        profileId={profile.id}
        onSaved={reloadData}
      />

      {/* ── Modal nouvel objectif équipe ───────────────────────────────── */}
      <ChallengeModal
        isOpen={showChallengeModal}
        onClose={() => setShowChallengeModal(false)}
        profileId={profile.id}
        onSaved={reloadData}
      />

      {/* ── Modal nouvel événement ─────────────────────────────────────── */}
      <EventModal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        onSaved={reloadData}
        userId={profile?.id ?? ''}
      />

    </div>
  );
}

// ── Helper component ────────────────────────────────────────────────────────
function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-rajdhani font-bold text-[#a3a3a3] uppercase tracking-wide">{title}</span>
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

// ── Modal objectif perso ─────────────────────────────────────────────────────
function GoalModal({ isOpen, onClose, profileId, onSaved }: {
  isOpen: boolean; onClose: () => void; profileId: string; onSaved: () => void;
}) {
  const [type, setType] = useState('musculation');
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function reset() { setType('musculation'); setTitle(''); setDeadline(''); setTargetValue(''); setUnit(''); setError(''); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('Le titre est obligatoire.'); return; }
    setSaving(true); setError('');
    try {
      await goalsService.createGoal({
        user_id: profileId,
        type,
        title: title.trim(),
        deadline: deadline || undefined,
        target_value: targetValue ? parseFloat(targetValue) : undefined,
        unit: unit.trim() || undefined,
      });
      await onSaved();
      reset();
      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'Erreur lors de la création.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={() => { reset(); onClose(); }} title="Nouvel objectif perso">
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <Select
          label="Type"
          value={type}
          onChange={e => setType(e.target.value)}
          options={[
            { value: 'musculation', label: 'Musculation' },
            { value: 'running', label: 'Course' },
            { value: 'weight', label: 'Poids' },
            { value: 'calisthenics', label: 'Calisthénie' },
          ]}
        />
        <Input
          label="Titre"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Ex : Courir 10 km"
          required
        />
        <Input
          label="Date limite"
          type="date"
          value={deadline}
          onChange={e => setDeadline(e.target.value)}
        />
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              label="Valeur cible"
              type="number"
              value={targetValue}
              onChange={e => setTargetValue(e.target.value)}
              placeholder="Ex : 10"
              min="0"
              step="any"
            />
          </div>
          <div className="flex-1">
            <Input
              label="Unité"
              value={unit}
              onChange={e => setUnit(e.target.value)}
              placeholder="Ex : km, kg, reps"
            />
          </div>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex gap-2 justify-end pt-1">
          <Button type="button" variant="ghost" size="sm" onClick={() => { reset(); onClose(); }}>Annuler</Button>
          <Button type="submit" size="sm" loading={saving}>Créer</Button>
        </div>
      </form>
    </Modal>
  );
}

// ── Modal objectif équipe ────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dbLocal = supabase as any;

function ChallengeModal({ isOpen, onClose, profileId, onSaved }: {
  isOpen: boolean; onClose: () => void; profileId: string; onSaved: () => void;
}) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('distance');
  const [targetValue, setTargetValue] = useState('');
  const [endDate, setEndDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function reset() { setTitle(''); setType('distance'); setTargetValue(''); setEndDate(''); setError(''); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('Le titre est obligatoire.'); return; }
    if (!targetValue || isNaN(parseFloat(targetValue))) { setError('La valeur cible est obligatoire.'); return; }
    if (!endDate) { setError('La date de fin est obligatoire.'); return; }
    setSaving(true); setError('');
    try {
      const unitMap: Record<string, string> = { distance: 'km', tonnage: 'kg', repetitions: 'reps', sessions: 'séances' };
      const { error: insertErr } = await dbLocal.from('community_challenges').insert({
        created_by: profileId,
        title: title.trim(),
        type,
        target_value: parseFloat(targetValue),
        unit: unitMap[type] ?? 'séances',
        start_date: new Date().toISOString().split('T')[0],
        end_date: endDate,
        is_flash: false,
        status: 'active',
      });
      if (insertErr) throw insertErr;
      await onSaved();
      reset();
      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'Erreur lors de la création.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={() => { reset(); onClose(); }} title="Nouvel objectif d'équipe">
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <Input
          label="Titre"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Ex : 500 km en équipe"
          required
        />
        <Select
          label="Type"
          value={type}
          onChange={e => setType(e.target.value)}
          options={[
            { value: 'distance', label: 'Distance (km)' },
            { value: 'tonnage', label: 'Tonnage (kg)' },
            { value: 'sessions', label: 'Séances' },
            { value: 'repetitions', label: 'Répétitions' },
          ]}
        />
        <Input
          label="Valeur cible"
          type="number"
          value={targetValue}
          onChange={e => setTargetValue(e.target.value)}
          placeholder="Ex : 500"
          min="0"
          step="any"
          required
        />
        <Input
          label="Date de fin"
          type="date"
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
          required
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex gap-2 justify-end pt-1">
          <Button type="button" variant="ghost" size="sm" onClick={() => { reset(); onClose(); }}>Annuler</Button>
          <Button type="submit" size="sm" loading={saving}>Créer</Button>
        </div>
      </form>
    </Modal>
  );
}

// ── Modal nouvel événement ───────────────────────────────────────────────────
function EventModal({ isOpen, onClose, onSaved, userId }: {
  isOpen: boolean; onClose: () => void; onSaved: () => void; userId: string;
}) {
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function reset() { setTitle(''); setEventType(''); setDate(''); setDescription(''); setError(''); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('Le titre est obligatoire.'); return; }
    if (!date) { setError('La date est obligatoire.'); return; }
    setSaving(true); setError('');
    try {
      const { error: insertErr } = await dbLocal.from('events').insert({
        user_id: userId,
        title: title.trim(),
        event_date: date,
        type: eventType || null,
        description: description.trim() || null,
      });
      if (insertErr) throw insertErr;
      await onSaved();
      reset();
      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'Erreur lors de la création.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={() => { reset(); onClose(); }} title="Nouvel événement">
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <Input
          label="Titre"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Ex : Semi-marathon de Paris"
          required
        />
        <Select
          label="Type"
          value={eventType}
          onChange={e => setEventType(e.target.value)}
          placeholder="— Sélectionner —"
          options={[
            { value: 'course', label: 'Course' },
            { value: 'competition', label: 'Compétition' },
            { value: 'trail', label: 'Trail' },
            { value: 'triathlon', label: 'Triathlon' },
            { value: 'autre', label: 'Autre' },
          ]}
        />
        <Input
          label="Date"
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          required
        />
        <Textarea
          label="Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Optionnel"
          rows={2}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex gap-2 justify-end pt-1">
          <Button type="button" variant="ghost" size="sm" onClick={() => { reset(); onClose(); }}>Annuler</Button>
          <Button type="submit" size="sm" loading={saving}>Créer</Button>
        </div>
      </form>
    </Modal>
  );
}
