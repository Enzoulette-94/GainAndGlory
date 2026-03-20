import React, { useEffect, useState, useMemo } from 'react';
import {
  CalendarDays, ChevronLeft, ChevronRight,
  Dumbbell, PersonStanding, Scale, Target, Swords, Flag, Zap, Flame,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { workoutService } from '../services/workout.service';
import { runningService } from '../services/running.service';
import { weightService } from '../services/weight.service';
import { goalsService } from '../services/goals.service';
import { calisthenicsService } from '../services/calisthenics.service';
import { crossfitService } from '../services/crossfit.service';
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
  weight:       { label: 'Pesée',       color: 'bg-emerald-500',dim: 'bg-emerald-900/40',text: 'text-emerald-400',border: 'border-emerald-800/40',accentBg: 'bg-gradient-to-r from-emerald-950/60 to-[#0d0d0d]',accentBorder: 'border-l-emerald-700',icon: Scale,           iconColor: 'text-emerald-400'},
  goal:         { label: 'Objectif',    color: 'bg-[#c9a870]',  dim: 'bg-[#c9a870]/20',  text: 'text-[#c9a870]',  border: 'border-[#c9a870]/30',  accentBg: 'bg-gradient-to-r from-[#2a1f0a]/80 to-[#0d0d0d]',  accentBorder: 'border-l-[#c9a870]',  icon: Target,          iconColor: 'text-[#c9a870]'  },
  challenge:    { label: 'Défi équipe', color: 'bg-pink-500',   dim: 'bg-pink-900/40',   text: 'text-pink-400',   border: 'border-pink-800/40',   accentBg: 'bg-gradient-to-r from-pink-950/60 to-[#0d0d0d]',   accentBorder: 'border-l-pink-700',   icon: Swords,          iconColor: 'text-pink-400'   },
  event:        { label: 'Événement',   color: 'bg-amber-500',  dim: 'bg-amber-900/40',  text: 'text-amber-400',  border: 'border-amber-800/40',  accentBg: 'bg-gradient-to-r from-amber-950/60 to-[#0d0d0d]',  accentBorder: 'border-l-amber-700',  icon: Flag,            iconColor: 'text-amber-400'  },
} as const;

type ActivityKey = keyof typeof ACTIVITY_CONFIG;
const ACTIVITY_ORDER: ActivityKey[] = ['workout', 'run', 'calisthenics', 'crossfit', 'weight', 'goal', 'challenge', 'event'];

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
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [goals, setGoals] = useState<PersonalGoal[]>([]);
  const [challenges, setChallenges] = useState<ChallengeItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<DayActivity | null>(null);

  useEffect(() => {
    if (!profile) return;
    setLoading(true);
    Promise.all([
      workoutService.getSessions(profile.id, 300),
      runningService.getSessions(profile.id, 300),
      calisthenicsService.getSessions(profile.id, 300),
      crossfitService.getSessions(profile.id, 300),
      weightService.getEntries(profile.id, 300),
      goalsService.getGoals(profile.id),
      db.from('community_challenges').select('id,title,start_date,end_date,type').in('status', ['active', 'pending']).then(({ data }: { data: ChallengeItem[] | null }) => data ?? []),
      db.from('events').select('id,title,event_date,type,description').order('event_date', { ascending: true }).then(({ data }: { data: EventItem[] | null }) => data ?? []),
    ]).then(([w, r, c, cf, wt, g, ch, ev]) => {
      setWorkouts(w as WorkoutSession[]);
      setRuns(r as RunningSession[]);
      setCalis(c as any[]);
      setCrossfits(cf as any[]);
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
      if (!map.has(d)) map.set(d, { date: d, types: new Set(), workouts: [], runs: [], calis: [], crossfits: [], weights: [], goalDeadlines: [], challengeEvents: [], events: [] });
      return map.get(d)!;
    };

    for (const w of workouts)   { const a = ensure(getDatePart(w.date));       a.types.add('workout');      a.workouts.push(w); }
    for (const r of runs)       { const a = ensure(getDatePart(r.date));       a.types.add('run');          a.runs.push(r); }
    for (const c of calis)      { const a = ensure(getDatePart(c.date));       a.types.add('calisthenics'); a.calis.push(c); }
    for (const cf of crossfits) { const a = ensure(getDatePart(cf.date));      a.types.add('crossfit');     a.crossfits.push(cf); }
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
  }, [workouts, runs, calis, crossfits, weights, goals, challenges, events]);

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
    let workoutDays = 0, runDays = 0, caliDays = 0, crossfitDays = 0;
    let totalDist = 0, totalTonnage = 0;
    for (const [dateStr, a] of activityMap) {
      const d = new Date(dateStr);
      if (d.getFullYear() !== year || d.getMonth() !== month) continue;
      if (a.types.has('workout'))      { workoutDays++;  totalTonnage += a.workouts.reduce((s, w) => s + (w.total_tonnage ?? 0), 0); }
      if (a.types.has('run'))          { runDays++;      totalDist    += a.runs.reduce((s, r) => s + r.distance, 0); }
      if (a.types.has('calisthenics')) caliDays++;
      if (a.types.has('crossfit'))     crossfitDays++;
    }
    return { workoutDays, runDays, caliDays, crossfitDays, totalDist, totalTonnage };
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
  const totalMonthActivities = monthStats.workoutDays + monthStats.runDays + monthStats.caliDays + monthStats.crossfitDays;

  if (!profile) return null;

  return (
    <div className="space-y-4">

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <CalendarDays className="w-5 h-5 text-[#c9a870]" />
        <h1 className="font-rajdhani font-bold text-xl text-[#f5f5f5] tracking-wide uppercase">Calendrier</h1>
        <span className="ml-auto text-xs text-[#6b6b6b] font-rajdhani">{totalMonthActivities} séance{totalMonthActivities > 1 ? 's' : ''} ce mois</span>
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
              const sportTypes  = activeTypes.filter(k => ['workout','run','calisthenics','crossfit','weight'].includes(k));
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
