import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Users, Plus, Zap, Target, Trophy, Calendar, MessageCircle, Star, Dumbbell, PersonStanding, Send, X, ChevronRight, Flame, Wind, Thermometer, Footprints, TrendingUp, Bookmark, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase-client';
import { workoutService } from '../services/workout.service';
import { calisthenicsService } from '../services/calisthenics.service';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Textarea } from '../components/common/Input';
import { Select } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { ProgressBar } from '../components/common/ProgressBar';
import { Loader } from '../components/common/Loader';
import { formatDate, formatRelativeTime, formatDistance, formatDuration, formatPace, getStatusTitle } from '../utils/calculations';
import { feedService } from '../services/feed.service';
import { savedSessionsService } from '../services/saved-sessions.service';
import type { ActivityFeedItem, ActivityComment } from '../types/models';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface CommunityChallenge {
  id: string;
  created_by: string;
  title: string;
  description: string | null;
  type: 'distance' | 'tonnage' | 'sessions';
  target_value: number;
  unit: string;
  start_date: string;
  end_date: string;
  is_flash: boolean;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  created_at: string;
  creator?: { username: string };
  participations?: {
    user_id: string;
    contribution: number;
    completed: boolean;
    user?: { username: string };
  }[];
  total_contribution?: number;
}

type Tab = 'feed' | 'active' | 'mine' | 'create';

// ─────────────────────────────────────────────
// Helpers (challenges)
// ─────────────────────────────────────────────

function daysRemaining(endDate: string): number {
  const end = new Date(endDate).getTime();
  const now = Date.now();
  return Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
}

function typeLabel(type: CommunityChallenge['type']): string {
  switch (type) {
    case 'distance': return 'Distance';
    case 'tonnage': return 'Tonnage';
    case 'sessions': return 'Séances';
  }
}

function typeBadgeClass(type: CommunityChallenge['type']): string {
  switch (type) {
    case 'distance': return 'bg-transparent text-blue-500 border-blue-800/50';
    case 'tonnage': return 'bg-transparent text-red-300 border-red-500/30';
    case 'sessions': return 'bg-transparent text-green-500 border-green-800/50';
  }
}

function typeProgressColor(type: CommunityChallenge['type']): string {
  switch (type) {
    case 'distance': return 'bg-blue-800';
    case 'tonnage': return 'bg-red-500';
    case 'sessions': return 'bg-green-800';
  }
}

function unitForType(type: string): string {
  switch (type) {
    case 'distance': return 'km';
    case 'tonnage': return 'kg';
    case 'sessions': return 'séances';
    default: return '';
  }
}

function calcTotal(challenge: CommunityChallenge): number {
  if (challenge.total_contribution !== undefined) return challenge.total_contribution;
  return (challenge.participations ?? []).reduce((sum, p) => sum + (p.contribution ?? 0), 0);
}

// ─────────────────────────────────────────────
// Session Detail Modal
// ─────────────────────────────────────────────

function SessionDetailModal({ item, onClose }: { item: ActivityFeedItem; onClose: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfCustomName, setPdfCustomName] = useState('');
  const c = item.content as any;
  const isWorkout = item.type === 'workout';
  const isCalisthenics = item.type === 'calisthenics';

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        if (isWorkout) {
          let query = supabase
            .from('workout_sessions')
            .select('*, sets:workout_sets(*, exercise:exercises(*))')
            .eq('user_id', item.user_id);
          if (c.session_id) {
            query = query.eq('id', c.session_id);
          } else {
            // fallback: séance la plus proche du created_at
            const ts = new Date(item.created_at);
            const from = new Date(ts.getTime() - 5 * 60000).toISOString();
            const to   = new Date(ts.getTime() + 5 * 60000).toISOString();
            query = query.gte('date', from).lte('date', to).order('date', { ascending: false }).limit(1);
          }
          const { data: res } = await query.maybeSingle();
          setData(res);
        } else if (isCalisthenics) {
          let query = supabase
            .from('calisthenics_sessions')
            .select('*')
            .eq('user_id', item.user_id);
          if (c.session_id) {
            query = query.eq('id', c.session_id);
          } else {
            const ts = new Date(item.created_at);
            const from = new Date(ts.getTime() - 5 * 60000).toISOString();
            const to   = new Date(ts.getTime() + 5 * 60000).toISOString();
            query = query.gte('date', from).lte('date', to).order('date', { ascending: false }).limit(1);
          }
          const { data: res } = await query.maybeSingle();
          setData(res);
        } else {
          let query = supabase
            .from('running_sessions')
            .select('*, shoe:shoes(*)')
            .eq('user_id', item.user_id);
          if (c.session_id) {
            query = query.eq('id', c.session_id);
          } else {
            const ts = new Date(item.created_at);
            const from = new Date(ts.getTime() - 5 * 60000).toISOString();
            const to   = new Date(ts.getTime() + 5 * 60000).toISOString();
            query = query.gte('date', from).lte('date', to).order('date', { ascending: false }).limit(1);
          }
          const { data: res } = await query.maybeSingle();
          setData(res);
        }
      } catch { setData(null); }
      finally { setLoading(false); }
    })();
  }, [item, isWorkout, isCalisthenics, c.session_id]);

  const feedbackLabel = (fb: string | null) => {
    if (fb === 'facile') return { label: 'Facile', color: 'text-green-500 border-green-900/50' };
    if (fb === 'difficile') return { label: 'Difficile', color: 'text-orange-500 border-orange-900/50' };
    if (fb === 'mort') return { label: 'Épuisé', color: 'text-red-500 border-red-900/50' };
    return null;
  };

  const runTypeLabel = (t: string | null) => {
    if (t === 'fractionne') return 'Fractionné';
    if (t === 'endurance') return 'Endurance';
    if (t === 'tempo') return 'Tempo';
    return t;
  };

  const weatherLabel = (w: string | null) => {
    if (w === 'ensoleille') return '☀️ Ensoleillé';
    if (w === 'nuageux') return '☁️ Nuageux';
    if (w === 'pluie') return '🌧️ Pluie';
    if (w === 'vent') return '💨 Vent';
    if (w === 'neige') return '❄️ Neige';
    return w;
  };

  // Regrouper les sets par exercice
  const groupedSets = React.useMemo(() => {
    if (!data?.sets) return [];
    const map: Record<string, { name: string; muscleGroup: string; sets: any[] }> = {};
    for (const s of data.sets) {
      const id = s.exercise_id;
      if (!map[id]) map[id] = { name: s.exercise?.name ?? '—', muscleGroup: s.exercise?.muscle_group ?? '', sets: [] };
      map[id].sets.push(s);
    }
    return Object.values(map).map(g => ({ ...g, sets: g.sets.sort((a: any, b: any) => a.set_number - b.set_number) }));
  }, [data]);

  const title = isWorkout ? 'Détails — Séance muscu' : isCalisthenics ? 'Détails — Calisthénie' : 'Détails — Course';

  const username = item.user?.username ?? 'Utilisateur';
  const sessionName = data?.name ?? c.name ?? title;

  async function buildPDF() {
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const L = 15, R = 195;
    let y = 20;
    const nl = (n = 6) => { y += n; if (y > 275) { pdf.addPage(); y = 20; } };
    const line = () => { pdf.setDrawColor(180, 180, 180); pdf.line(L, y, R, y); nl(5); };

    // En-tête
    pdf.setFillColor(30, 30, 30);
    pdf.rect(0, 0, 210, 14, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(201, 168, 112);
    pdf.text('GAIN & GLORY', L, 9);
    pdf.setFontSize(9);
    pdf.setTextColor(150, 150, 150);
    pdf.text('Séance de musculation', R, 9, { align: 'right' });
    y = 22;

    // Titre
    const sName = pdfCustomName.trim() || data?.name || c.name || '';
    if (sName) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.setTextColor(20, 20, 20);
      pdf.text(sName.toUpperCase(), L, y);
      nl(8);
    }

    // Méta
    const dateStr = formatDate(data?.date ?? item.created_at, { day: 'numeric', month: 'long', year: 'numeric' });
    const fbMap: Record<string, string> = { facile: 'Facile', difficile: 'Difficile', mort: 'Épuisé' };
    const fbLabel = fbMap[data?.feedback ?? c.feedback ?? ''] ?? '';
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(60, 60, 60);
    pdf.text(`${dateStr}   ·   ${username}`, L, y);
    if (fbLabel) { pdf.setTextColor(160, 120, 60); pdf.text(fbLabel.toUpperCase(), R, y, { align: 'right' }); }
    nl(4);
    if (data?.total_tonnage) {
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10); pdf.setTextColor(160, 120, 60);
      pdf.text(`Tonnage total : ${data.total_tonnage.toLocaleString('fr-FR')} kg`, L, y); nl(4);
    }
    line();

    // Exercices DB
    if (groupedSets.length > 0) {
      for (const group of groupedSets) {
        pdf.setFillColor(40, 40, 40); pdf.rect(L, y - 4, R - L, 7, 'F');
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); pdf.setTextColor(220, 220, 220);
        pdf.text(group.name.toUpperCase(), L + 2, y);
        if (group.muscleGroup) {
          pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(160, 160, 160);
          pdf.text(group.muscleGroup, R - 2, y, { align: 'right' });
        }
        nl(7);
        for (const s of group.sets) {
          pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10);
          pdf.setTextColor(100, 100, 100); pdf.text(`Série ${s.set_number}`, L + 4, y);
          pdf.setTextColor(30, 30, 30); pdf.text(`${s.reps} reps`, 80, y);
          pdf.setFont('helvetica', 'bold'); pdf.setTextColor(160, 120, 60); pdf.text(`${s.weight} kg`, 120, y);
          pdf.setFont('helvetica', 'normal'); pdf.setTextColor(120, 120, 120);
          pdf.text(`${(s.reps * s.weight).toLocaleString('fr-FR')} kg total`, 155, y); nl(6);
        }
        nl(2);
      }
    } else {
      // Fallback JSONB
      const exList = (c.exercises ?? []) as { name: string; sets: number; reps: number; maxWeight?: number }[];
      for (const ex of exList) {
        pdf.setFillColor(40, 40, 40); pdf.rect(L, y - 4, R - L, 7, 'F');
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); pdf.setTextColor(220, 220, 220);
        pdf.text(ex.name.toUpperCase(), L + 2, y); nl(8);
        const rps = ex.sets > 0 ? Math.round(ex.reps / ex.sets) : ex.reps;
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10); pdf.setTextColor(30, 30, 30);
        pdf.text(`${ex.sets} séries × ${rps} reps`, L + 4, y);
        if (ex.maxWeight && ex.maxWeight > 0) {
          pdf.setFont('helvetica', 'bold'); pdf.setTextColor(160, 120, 60);
          pdf.text(`${ex.maxWeight} kg`, 120, y);
        }
        nl(7);
      }
    }

    // Notes
    if (data?.notes) {
      nl(2); line();
      pdf.setFont('helvetica', 'italic'); pdf.setFontSize(10); pdf.setTextColor(100, 100, 100);
      for (const l of pdf.splitTextToSize(data.notes, R - L) as string[]) { pdf.text(l, L, y); nl(5); }
    }

    // Pied de page
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(150, 150, 150);
    pdf.text('Généré par Gain & Glory', L, 290);
    pdf.text(new Date().toLocaleDateString('fr-FR'), R, 290, { align: 'right' });

    return pdf;
  }

  async function previewPDF() {
    setExporting(true);
    try {
      const pdf = await buildPDF();
      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      setPdfBlobUrl(url);
    } catch (err) {
      console.error('[PDF] erreur:', err);
    } finally {
      setExporting(false);
    }
  }

  async function savePDF() {
    setExporting(true);
    try {
      const pdf = await buildPDF();
      const sName = pdfCustomName.trim() || data?.name || c.name || 'seance';
      const filename = `${username}_${sName}.pdf`.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
      pdf.save(filename);
      setPdfBlobUrl(null);
    } catch (err) {
      console.error('[PDF] erreur:', err);
    } finally {
      setExporting(false);
    }
  }

  return (
    <Modal isOpen onClose={onClose} title={title} size="md">
      <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
        {loading && <Loader text="Chargement de la séance..." />}

        {/* ── MUSCU — données complètes depuis la DB ── */}
        {!loading && data && isWorkout && (
          <>
            {data.name && (
              <h3 className="font-rajdhani font-bold text-lg text-[#f5f5f5] tracking-wide uppercase border-b border-white/5 pb-2">
                {data.name}
              </h3>
            )}
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="text-[#a3a3a3]">{formatDate(data.date, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              {data.total_tonnage != null && (
                <span className="font-rajdhani font-bold text-[#c9a870]">
                  {data.total_tonnage.toLocaleString('fr-FR')} kg soulevés
                </span>
              )}
              {(() => { const fb = feedbackLabel(data.feedback); return fb ? (
                <span className={`text-xs border px-2 py-0.5 font-rajdhani font-semibold uppercase ${fb.color}`}>{fb.label}</span>
              ) : null; })()}
            </div>
            {data.notes && <p className="text-sm text-[#a3a3a3] italic border-l-2 border-[#c9a870]/30 pl-3">{data.notes}</p>}

            {groupedSets.length === 0 && <p className="text-sm text-[#6b6b6b]">Aucun exercice enregistré.</p>}
            <div className="space-y-4">
              {groupedSets.map((group, gi) => (
                <div key={gi} className="border border-white/5">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 bg-white/2">
                    <Dumbbell className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                    <span className="font-rajdhani font-semibold text-[#f5f5f5] text-sm tracking-wide uppercase">{group.name}</span>
                    <span className="text-xs text-[#6b6b6b] ml-auto">{group.muscleGroup}</span>
                  </div>
                  <div className="divide-y divide-white/5">
                    {group.sets.map((s: any, si: number) => (
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
          </>
        )}

        {/* ── MUSCU — fallback sur le contenu JSONB du feed ── */}
        {!loading && !data && isWorkout && (() => {
          const exList = (c.exercises ?? []) as { name: string; sets: number; reps: number; maxWeight?: number }[];
          const repsPerSet = (ex: { sets: number; reps: number }) => ex.sets > 0 ? Math.round(ex.reps / ex.sets) : ex.reps;
          return (
            <>
              {c.name && (
                <h3 className="font-rajdhani font-bold text-lg text-[#f5f5f5] tracking-wide uppercase border-b border-white/5 pb-2">
                  {c.name}
                </h3>
              )}
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="text-[#a3a3a3]">{formatDate(item.created_at, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                {(() => { const fb = feedbackLabel(c.feedback); return fb ? (
                  <span className={`text-xs border px-2 py-0.5 font-rajdhani font-semibold uppercase ${fb.color}`}>{fb.label}</span>
                ) : null; })()}
              </div>
              {exList.length === 0 && <p className="text-sm text-[#6b6b6b]">Aucun exercice enregistré.</p>}
              <div className="space-y-2">
                {exList.map((ex, i) => (
                  <div key={i} className="border border-white/5">
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 bg-white/2">
                      <Dumbbell className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                      <span className="font-rajdhani font-semibold text-[#f5f5f5] text-sm tracking-wide uppercase">{ex.name}</span>
                    </div>
                    <div className="flex items-center justify-between px-3 py-2 text-sm">
                      <span className="text-[#d4d4d4]">{ex.sets} séries × {repsPerSet(ex)} reps</span>
                      {ex.maxWeight != null && ex.maxWeight > 0 && (
                        <span className="font-rajdhani font-bold text-[#c9a870]">{ex.maxWeight} kg</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          );
        })()}

        {/* ── COURSE ── */}
        {!loading && data && !isWorkout && !isCalisthenics && (
          <>
            {data.name && (
              <h3 className="font-rajdhani font-bold text-lg text-blue-400 tracking-wide uppercase border-b border-white/5 pb-2">
                {data.name}
              </h3>
            )}
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="text-[#a3a3a3]">{formatDate(data.date, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              {data.run_type && (
                <span className="text-xs border border-blue-800/50 text-blue-400 px-2 py-0.5 font-rajdhani font-semibold uppercase">
                  {runTypeLabel(data.run_type)}
                </span>
              )}
              {(() => { const fb = feedbackLabel(data.feedback); return fb ? (
                <span className={`text-xs border px-2 py-0.5 font-rajdhani font-semibold uppercase ${fb.color}`}>{fb.label}</span>
              ) : null; })()}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: <Footprints className="w-4 h-4 text-blue-400" />, label: 'Distance', value: formatDistance(data.distance) },
                { icon: <Star className="w-4 h-4 text-[#c9a870]" />, label: 'Durée', value: formatDuration(data.duration) },
                { icon: <TrendingUp className="w-4 h-4 text-green-500" />, label: 'Allure', value: data.pace_min_per_km ? formatPace(data.pace_min_per_km) : '—' },
                { icon: <Flame className="w-4 h-4 text-red-400" />, label: 'FC moy.', value: data.avg_heart_rate ? `${data.avg_heart_rate} bpm` : '—' },
                { icon: <Flame className="w-4 h-4 text-red-600" />, label: 'FC max.', value: data.max_heart_rate ? `${data.max_heart_rate} bpm` : '—' },
                { icon: <Wind className="w-4 h-4 text-[#a3a3a3]" />, label: 'Dénivelé +', value: data.elevation_gain != null ? `${data.elevation_gain} m` : '—' },
                { icon: <Wind className="w-4 h-4 text-[#6b6b6b]" />, label: 'Dénivelé −', value: data.elevation_loss != null ? `${data.elevation_loss} m` : '—' },
                { icon: <Thermometer className="w-4 h-4 text-orange-400" />, label: 'Météo', value: data.weather_temp != null ? `${data.weather_temp}°C${data.weather_condition ? ` · ${weatherLabel(data.weather_condition)}` : ''}` : weatherLabel(data.weather_condition) ?? '—' },
              ].map((stat, i) => (
                <div key={i} className="flex items-center gap-2 border border-white/5 px-3 py-2">
                  {stat.icon}
                  <div>
                    <p className="text-xs text-[#6b6b6b] uppercase tracking-wide">{stat.label}</p>
                    <p className="text-sm font-rajdhani font-semibold text-[#e5e5e5]">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {data.shoe && (
              <div className="flex items-center gap-2 text-sm text-[#a3a3a3] border border-white/5 px-3 py-2">
                <PersonStanding className="w-4 h-4 text-[#c9a870]" />
                <span>Chaussure : <span className="text-[#e5e5e5] font-medium">{[data.shoe.brand, data.shoe.model].filter(Boolean).join(' ')}</span></span>
              </div>
            )}
            {data.notes && <p className="text-sm text-[#a3a3a3] italic border-l-2 border-blue-800/50 pl-3">{data.notes}</p>}
          </>
        )}

        {/* ── CALISTHÉNIE ── */}
        {!loading && isCalisthenics && (() => {
          const exList = ((data?.exercises ?? c.exercises ?? []) as { name: string; sets: number; reps?: number; hold_seconds?: number; set_type?: string }[]);
          return (
            <>
              {(data?.name ?? c.name) && (
                <h3 className="font-rajdhani font-bold text-lg text-violet-300 tracking-wide uppercase border-b border-white/5 pb-2">
                  {data?.name ?? c.name}
                </h3>
              )}
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="text-[#a3a3a3]">{formatDate(data?.date ?? item.created_at, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                {(() => { const fb = feedbackLabel(data?.feedback ?? c.feedback); return fb ? (
                  <span className={`text-xs border px-2 py-0.5 font-rajdhani font-semibold uppercase ${fb.color}`}>{fb.label}</span>
                ) : null; })()}
              </div>

              {exList.length === 0 && <p className="text-sm text-[#6b6b6b]">Aucun exercice enregistré.</p>}
              <div className="space-y-2">
                {exList.map((ex, i) => {
                  const isTimed = ex.set_type === 'timed' || (ex.hold_seconds != null && ex.reps == null);
                  return (
                    <div key={i} className="border border-violet-900/30">
                      <div className="flex items-center gap-2 px-3 py-2 border-b border-violet-900/30 bg-violet-900/10">
                        <Zap className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                        <span className="font-rajdhani font-semibold text-[#f5f5f5] text-sm tracking-wide uppercase">{ex.name}</span>
                      </div>
                      <div className="flex items-center justify-between px-3 py-2 text-sm">
                        <span className="text-[#d4d4d4]">
                          {ex.sets} {ex.sets === 1 ? 'série' : 'séries'}
                          {isTimed && ex.hold_seconds != null && ex.hold_seconds > 0
                            ? ` · ${ex.hold_seconds}s`
                            : ex.reps != null && ex.reps > 0
                              ? ` × ${ex.sets > 0 ? Math.round(ex.reps / ex.sets) : ex.reps} reps`
                              : ''}
                        </span>
                        {isTimed
                          ? <span className="text-xs text-violet-400 font-rajdhani font-semibold uppercase">Maintien</span>
                          : <span className="text-xs text-violet-400 font-rajdhani font-semibold uppercase">Répétitions</span>
                        }
                      </div>
                    </div>
                  );
                })}
              </div>

              {(data?.notes ?? c.notes) && (
                <p className="text-sm text-[#a3a3a3] italic border-l-2 border-violet-800/50 pl-3">{data?.notes ?? c.notes}</p>
              )}
            </>
          );
        })()}
      </div>

      {/* Bouton PDF — affiché uniquement pour muscu (DB ou fallback) */}
      {!loading && isWorkout && (
        <div className="px-5 pb-5 pt-3 border-t border-white/5 space-y-3">
          <div>
            <label className="block text-[10px] text-[#6b6b6b] uppercase tracking-wide font-rajdhani mb-1">Titre du PDF (optionnel)</label>
            <input
              type="text"
              value={pdfCustomName}
              onChange={e => setPdfCustomName(e.target.value)}
              placeholder={data?.name ?? c.name ?? 'ex. Push Day — Semaine 12'}
              className="w-full bg-[#1a1a1a] border border-white/10 text-[#f5f5f5] text-sm px-3 py-2 placeholder-[#4a4a4a] focus:outline-none focus:border-[#c9a870]/50 font-rajdhani"
            />
          </div>
          <button
            onClick={previewPDF}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-[#c9a870]/10 border border-[#c9a870]/40 text-[#c9a870] text-sm font-rajdhani font-bold uppercase tracking-wide hover:bg-[#c9a870]/20 hover:border-[#c9a870]/70 transition-all disabled:opacity-50"
          >
            {exporting ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                Génération...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v13m0 0l-4-4m4 4l4-4M2 17v3a2 2 0 002 2h16a2 2 0 002-2v-3"/></svg>
                Aperçu PDF
              </>
            )}
          </button>
        </div>
      )}

      {/* Modal aperçu PDF */}
      {pdfBlobUrl && (
        <div className="fixed inset-0 z-[200] flex flex-col bg-black/90">
          <div className="flex items-center justify-between px-4 py-3 bg-[#111] border-b border-white/10 flex-shrink-0">
            <span className="font-rajdhani font-bold text-[#c9a870] uppercase tracking-wide text-sm">Aperçu PDF</span>
            <div className="flex items-center gap-3">
              <button
                onClick={savePDF}
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-1.5 bg-[#c9a870]/15 border border-[#c9a870]/50 text-[#c9a870] text-xs font-rajdhani font-bold uppercase tracking-wide hover:bg-[#c9a870]/25 transition-all disabled:opacity-50"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v13m0 0l-4-4m4 4l4-4M2 17v3a2 2 0 002 2h16a2 2 0 002-2v-3"/></svg>
                Télécharger
              </button>
              <button
                onClick={() => { URL.revokeObjectURL(pdfBlobUrl); setPdfBlobUrl(null); }}
                className="text-[#6b6b6b] hover:text-[#f5f5f5] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <iframe src={pdfBlobUrl} className="flex-1 w-full" title="Aperçu PDF" />
        </div>
      )}
    </Modal>
  );
}

// ─────────────────────────────────────────────
// Feed item card
// ─────────────────────────────────────────────

interface FeedItemCardProps {
  item: ActivityFeedItem;
  currentUserId: string | undefined;
  onLike: (itemId: string) => void;
  onCommentAdded: (itemId: string, comment: ActivityComment) => void;
  onCommentDeleted: (itemId: string, commentId: string) => void;
}

function FeedItemCard({ item, currentUserId, onLike, onCommentAdded, onCommentDeleted }: FeedItemCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showDetail, setShowDetail] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const canShowDetail = item.type === 'workout' || item.type === 'run' || item.type === 'calisthenics' || item.type === 'crossfit';
  const canCopy = item.type === 'workout' || item.type === 'calisthenics' || item.type === 'crossfit';
  const canSave = item.type === 'workout' || item.type === 'run' || item.type === 'calisthenics';
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveCustomName, setSaveCustomName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copying, setCopying] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { profile } = useAuth();
  const navigate = useNavigate();

  async function handleCopySession() {
    if (copying) return;
    setCopying(true);
    const c = item.content as any;
    try {
      if (item.type === 'workout' && c.session_id) {
        const session = await workoutService.getSession(c.session_id);
        if (session) {
          navigate('/musculation/new', { state: { copyFrom: session } });
          return;
        }
      }
      if (item.type === 'calisthenics') {
        const exercises = (c.exercises ?? []).map((ex: any) => ({
          name: ex.name,
          set_type: ex.set_type ?? 'reps',
          sets: Array.from({ length: ex.sets || 1 }, () => ({
            reps: ex.reps ? Math.round(ex.reps / (ex.sets || 1)) : null,
            hold_seconds: ex.hold_seconds ? Math.round(ex.hold_seconds / (ex.sets || 1)) : null,
          })),
        }));
        const fakeSession = { name: c.name ?? null, date: item.created_at, exercises };
        navigate('/calisthenics/new', { state: { copyFrom: fakeSession } });
        return;
      }
      if (item.type === 'crossfit') {
        const exercises = (c.exercises ?? []).map((ex: any) => ({
          name: ex.name,
          reps: null,
          weight: null,
          duration: null,
          notes: null,
        }));
        const fakeCrossfit = {
          name: c.name ?? null,
          date: item.created_at,
          wod_type: c.wod_type ?? 'emom',
          exercises,
          benchmark_name: null,
          total_duration: null,
          round_duration: null,
          target_rounds: null,
        };
        navigate('/crossfit/new', { state: { copyFrom: fakeCrossfit } });
        return;
      }
      // Fallback for workout without session_id
      navigate('/musculation/new');
    } finally {
      setCopying(false);
    }
  }

  const username = item.user?.username ?? 'Inconnu';
  const level = item.user?.global_level ?? 1;
  const initials = username.slice(0, 2).toUpperCase();
  const likes = item.likes ?? [];
  const comments = item.comments ?? [];
  const hasLiked = currentUserId ? likes.some(l => l.user_id === currentUserId) : false;
  const myInitials = profile?.username ? profile.username.slice(0, 2).toUpperCase() : '?';

  async function handleSaveSession() {
    if (!currentUserId || !profile) return;
    setSaving(true);
    try {
      const c = item.content as any;
      const exercises = c.exercises ?? (item.type === 'run' ? [{ distance: c.distance, duration: c.duration }] : []);
      await savedSessionsService.saveSession({
        userId: currentUserId,
        sourceUserId: item.user_id,
        sourceUsername: username,
        type: item.type as 'workout' | 'run' | 'calisthenics',
        customName: saveCustomName.trim() || undefined,
        originalName: c.name ?? undefined,
        exercises,
      });
      setSaved(true);
      setShowSaveModal(false);
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  }

  async function handleSendComment() {
    if (!commentText.trim() || !currentUserId) return;
    setSendingComment(true);
    try {
      const newComment = await feedService.addComment(item.id, currentUserId, commentText.trim());
      setCommentText('');
      onCommentAdded(item.id, newComment as ActivityComment);
    } catch {
      // silently fail
    } finally {
      setSendingComment(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    setDeletingCommentId(commentId);
    try {
      await feedService.deleteComment(commentId);
      onCommentDeleted(item.id, commentId);
    } catch {
      // silently fail
    } finally {
      setDeletingCommentId(null);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendComment();
    }
  }

  // Config par type d'activité
  const typeConfig = (() => {
    const c = item.content as any;
    switch (c.type ?? item.type) {
      case 'workout': return {
        label: (c as any).name ? (c as any).name.toUpperCase() : 'SÉANCE MUSCU',
        borderColor: 'border-l-red-800/70',
        labelColor: 'text-red-400',
        bgGradient: 'bg-gradient-to-br from-red-950/30 via-[#111] to-[#111]',
        bannerBg: 'bg-red-900/50 border-y border-red-700/50',
        headerGradient: 'linear-gradient(to right, #2d0a0a, #111111)',
        accentColor: '#f87171',
        icon: '🏋️',
        stats: `${c.sets_count} séries`,
        feedback: c.feedback ?? null,
      };
      case 'run': return {
        label: (c as any).name ? (c as any).name.toUpperCase() : 'COURSE',
        borderColor: 'border-l-blue-800/70',
        labelColor: 'text-blue-500',
        bgGradient: 'bg-gradient-to-br from-blue-950/30 via-[#111] to-[#111]',
        bannerBg: 'bg-blue-900/50 border-y border-blue-700/50',
        headerGradient: 'linear-gradient(to right, #0a1628, #111111)',
        accentColor: '#60a5fa',
        icon: '🏃',
        stats: `${formatDistance(c.distance)} · ${formatDuration(c.duration)}`,
        feedback: (c as any).feedback ?? null,
      };
      case 'calisthenics': return {
        label: 'CALISTHÉNIE',
        borderColor: 'border-l-violet-800/70',
        labelColor: 'text-violet-400',
        bgGradient: 'bg-gradient-to-br from-violet-950/30 via-[#111] to-[#111]',
        bannerBg: 'bg-violet-900/50 border-y border-violet-700/50',
        headerGradient: 'linear-gradient(to right, #1a0a2e, #111111)',
        accentColor: '#a78bfa',
        icon: '⚡',
        stats: `${c.exercises_count} exercices · ${c.total_reps} reps`,
        feedback: c.feedback ?? null,
      };
      case 'crossfit': return {
        label: (c as any).name ? (c as any).name.toUpperCase() : 'CROSSFIT',
        borderColor: 'border-l-orange-800/70',
        labelColor: 'text-orange-400',
        bgGradient: 'bg-gradient-to-br from-orange-950/30 via-[#111] to-[#111]',
        bannerBg: 'bg-orange-900/50 border-y border-orange-700/50',
        headerGradient: 'linear-gradient(to right, #2d1000, #111111)',
        accentColor: '#fb923c',
        icon: '🔥',
        stats: c.wod_type ? `${(c.wod_type as string).toUpperCase()} · ${c.result_value ?? ''} ${c.result_unit ?? ''}`.trim() : 'CROSSFIT',
        feedback: c.feedback ?? null,
      };
      case 'badge': {
        const rarityColors: Record<string, { accent: string; gradient: string }> = {
          common:    { accent: '#94a3b8', gradient: 'linear-gradient(to right, #1e293b, #111111)' },
          uncommon:  { accent: '#94a3b8', gradient: 'linear-gradient(to right, #1e293b, #111111)' },
          rare:      { accent: '#60a5fa', gradient: 'linear-gradient(to right, #0a1628, #111111)' },
          epic:      { accent: '#a78bfa', gradient: 'linear-gradient(to right, #1a0a2e, #111111)' },
          legendary: { accent: '#fbbf24', gradient: 'linear-gradient(to right, #1a1200, #111111)' },
        };
        const rc = rarityColors[c.badge_rarity ?? 'common'] ?? rarityColors.common;
        return {
          label: 'BADGE DÉBLOQUÉ',
          borderColor: 'border-l-[#c9a870]/60',
          labelColor: 'text-[#c9a870]',
          bgGradient: '',
          bannerBg: '',
          headerGradient: rc.gradient,
          accentColor: rc.accent,
          icon: '🏅',
          stats: null,
          feedback: null,
        };
      }
      case 'level_up': return {
        label: `NIVEAU ${c.level} ATTEINT`,
        borderColor: 'border-l-[#c9a870]/60',
        labelColor: 'text-[#c9a870]',
        bgGradient: 'bg-gradient-to-br from-[#c9a870]/10 via-[#111] to-[#111]',
        bannerBg: 'bg-[#c9a870]/20 border-y border-[#c9a870]/40',
        headerGradient: 'linear-gradient(to right, #1a1a1a, #111111)',
        accentColor: '#c9a870',
        icon: '⚡',
        stats: null,
        subLabel: `Statut débloqué : ${getStatusTitle(c.level)}`,
        subLabelColor: 'text-[#c9a870]',
        feedback: null,
      };
      case 'record': return {
        label: 'NOUVEAU RECORD',
        borderColor: 'border-l-orange-800/70',
        labelColor: 'text-orange-600',
        bgGradient: 'bg-gradient-to-br from-orange-950/30 via-[#111] to-[#111]',
        bannerBg: 'bg-orange-900/50 border-y border-orange-700/50',
        headerGradient: 'linear-gradient(to right, #1a1a1a, #111111)',
        accentColor: '#c9a870',
        icon: '🏆',
        stats: c.discipline,
        feedback: null,
      };
      case 'challenge_completed': return {
        label: 'DÉFI COMPLÉTÉ',
        borderColor: 'border-l-pink-800/70',
        labelColor: 'text-pink-600',
        bgGradient: 'bg-gradient-to-br from-pink-950/25 via-[#111] to-[#111]',
        bannerBg: 'bg-pink-900/40 border-y border-pink-700/40',
        headerGradient: 'linear-gradient(to right, #1a1a1a, #111111)',
        accentColor: '#c9a870',
        icon: '🎯',
        stats: c.challenge_title,
        feedback: null,
      };
      case 'personal_record': return {
        label: '⚡ RECORD ALL TIME',
        borderColor: 'border-l-[#c9a870]',
        labelColor: 'text-[#c9a870]',
        bgGradient: 'bg-gradient-to-br from-[#1a1400] via-[#0f0e00] to-[#0a0a0a]',
        bannerBg: 'bg-[#c9a870]/20 border-y border-[#c9a870]/40',
        headerGradient: 'linear-gradient(135deg, #2a1e00 0%, #1a1200 60%, #0f0a00 100%)',
        accentColor: '#c9a870',
        icon: '🏆',
        stats: c.title ? `${c.title} — ${c.value} ${c.unit}` : null,
        feedback: null,
      };
      default: return null;
    }
  })();

  if (!typeConfig) return null;

  const c_content = item.content as any;
  const isMonster = (c_content.tonnage != null && c_content.tonnage > 10000)
    || (c_content.distance != null && c_content.distance > 20)
    || item.type === 'record'
    || item.type === 'personal_record';

  const statusTitle = getStatusTitle(level);

  const REACTIONS = [
    { emoji: '🔥', label: 'Feu', bg: 'bg-red-900/40' },
    { emoji: '💪', label: 'Force', bg: 'bg-orange-900/40' },
    { emoji: '🫡', label: 'Respect', bg: 'bg-blue-900/40' },
    { emoji: '😤', label: 'Motivé', bg: 'bg-purple-900/40' },
  ];
  const storageKey = `reaction_${item.id}_${currentUserId}`;
  const lsGet = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
  const lsSet = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch {} };
  const lsRemove = (k: string) => { try { localStorage.removeItem(k); } catch {} };
  const savedReaction = currentUserId ? (lsGet(storageKey) ?? '🔥') : '🔥';

  function handleReaction(emoji: string) {
    if (!currentUserId) return;
    if (hasLiked && savedReaction === emoji) {
      lsRemove(storageKey);
    } else if (!hasLiked) {
      lsSet(storageKey, emoji);
    } else {
      lsSet(storageKey, emoji);
      return;
    }
    onLike(item.id);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`relative overflow-hidden ${item.type === 'personal_record' ? 'border border-[#c9a870]/70 bg-[#150f00]' : 'border border-white/5 bg-[#0d0d0d]'}`}
    >
      {/* ═══ IDENTITY BANNER ═══ */}
      <div className="flex items-center gap-3 px-4 py-3" style={{ background: (typeConfig as any).headerGradient ?? 'linear-gradient(to right,#1a1a1a,#111111)' }}>
        {/* Avatar 40px */}
        <Link to={`/profil/${item.user_id}`} className="flex-shrink-0 w-10 h-10 border-2 border-white/20 overflow-hidden bg-[#1c1c1c] flex items-center justify-center hover:border-white/40 transition-colors">
          {item.user?.avatar_url ? (
            <img src={item.user.avatar_url} alt={username} className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-bold font-rajdhani" style={{ color: typeConfig.accentColor }}>{initials}</span>
          )}
        </Link>
        {/* Identity text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link to={`/profil/${item.user_id}`} className="font-rajdhani font-black text-xl text-white uppercase tracking-wide hover:opacity-80 transition-opacity leading-none">
              {username}
            </Link>
            <span className="text-xs font-rajdhani font-bold border px-1.5 py-0.5 leading-none" style={{ color: typeConfig.accentColor, borderColor: typeConfig.accentColor + '50' }}>
              NIV. {level}
            </span>
            {statusTitle && (
              <span className="text-xs font-rajdhani uppercase tracking-wide hidden sm:block" style={{ color: typeConfig.accentColor, opacity: 0.7 }}>
                {statusTitle}
              </span>
            )}
            {isMonster && (
              <motion.div
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
                className="ml-auto flex-shrink-0 flex items-center gap-1 border border-[#c9a870]/60 px-1.5 py-0.5 text-[10px] font-rajdhani font-bold text-[#c9a870] uppercase tracking-wide bg-[#111]/80"
              >
                🔥 MONSTRE
              </motion.div>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-[10px] font-rajdhani font-bold uppercase tracking-widest" style={{ color: typeConfig.accentColor, opacity: 0.6 }}>
              {typeConfig.label}
            </span>
            <span className="text-[#4a4a4a] text-xs">·</span>
            <span className="text-[10px] text-[#5a5a5a]">{formatRelativeTime(item.created_at)}</span>
            {typeConfig.feedback && (
              <>
                <span className="text-[#4a4a4a] text-xs">·</span>
                <span className="text-[10px] border px-1.5 py-0.5 uppercase tracking-wide font-rajdhani text-[#6b6b6b] border-white/10">
                  {typeConfig.feedback}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ═══ CONTENT ═══ */}
      <div className="min-w-0">

      {/* ── Metric blocks ── */}
      {item.type === 'workout' && (() => {
        const tonnage = c_content.tonnage ?? 0;
        const exCount = c_content.exercises_count ?? (c_content.exercises?.length ?? 0);
        const setsCount = c_content.sets_count ?? 0;
        return (
          <div className="grid grid-cols-3 divide-x divide-white/5 border-b border-white/5 bg-[#0d0d0d]">
            <div className="flex flex-col items-center py-3 px-2">
              <span className="font-rajdhani font-black text-xl text-red-400 leading-none">{tonnage > 0 ? tonnage.toLocaleString('fr-FR') : '—'}</span>
              <span className="text-[10px] text-red-700 uppercase tracking-widest font-rajdhani mt-1">{tonnage > 0 ? 'kg soulevés' : 'Tonnage'}</span>
            </div>
            <div className="flex flex-col items-center py-3 px-2">
              <span className="font-rajdhani font-black text-xl text-[#d4d4d4] leading-none">{exCount}</span>
              <span className="text-[10px] text-[#4a4a4a] uppercase tracking-widest font-rajdhani mt-1">Exercice{exCount > 1 ? 's' : ''}</span>
            </div>
            <div className="flex flex-col items-center py-3 px-2">
              <span className="font-rajdhani font-black text-xl text-[#d4d4d4] leading-none">{setsCount}</span>
              <span className="text-[10px] text-[#4a4a4a] uppercase tracking-widest font-rajdhani mt-1">Série{setsCount > 1 ? 's' : ''}</span>
            </div>
          </div>
        );
      })()}

      {item.type === 'run' && (() => {
        const r = c_content;
        return (
          <div className="grid grid-cols-3 divide-x divide-white/5 border-b border-white/5 bg-[#0d0d0d]">
            <div className="flex flex-col items-center py-3 px-2">
              <span className="font-rajdhani font-black text-xl text-blue-400 leading-none">{formatDistance(r.distance)}</span>
              <span className="text-[10px] text-blue-700 uppercase tracking-widest font-rajdhani mt-1">Distance</span>
            </div>
            <div className="flex flex-col items-center py-3 px-2">
              <span className="font-rajdhani font-black text-xl text-[#d4d4d4] leading-none">{formatDuration(r.duration)}</span>
              <span className="text-[10px] text-[#4a4a4a] uppercase tracking-widest font-rajdhani mt-1">Durée</span>
            </div>
            <div className="flex flex-col items-center py-3 px-2">
              <span className="font-rajdhani font-black text-xl text-[#d4d4d4] leading-none">{r.pace && r.pace > 0 ? formatPace(r.pace) : '—'}</span>
              <span className="text-[10px] text-[#4a4a4a] uppercase tracking-widest font-rajdhani mt-1">Allure</span>
            </div>
          </div>
        );
      })()}

      {item.type === 'calisthenics' && (() => {
        const c = c_content;
        const totalReps = c.total_reps ?? 0;
        const exCount = c.exercises_count ?? (c.exercises?.length ?? 0);
        const skillsCount = c.skills_unlocked?.length ?? 0;
        const setsTotal = c.exercises?.reduce((s: number, ex: any) => s + (ex.sets ?? 0), 0) ?? 0;
        return (
          <div className="grid grid-cols-3 divide-x divide-white/5 border-b border-white/5 bg-[#0d0d0d]">
            <div className="flex flex-col items-center py-3 px-2">
              <span className="font-rajdhani font-black text-xl text-violet-400 leading-none">{totalReps}</span>
              <span className="text-[10px] text-violet-700 uppercase tracking-widest font-rajdhani mt-1">Reps</span>
            </div>
            <div className="flex flex-col items-center py-3 px-2">
              <span className="font-rajdhani font-black text-xl text-[#d4d4d4] leading-none">{exCount}</span>
              <span className="text-[10px] text-[#4a4a4a] uppercase tracking-widest font-rajdhani mt-1">Exercice{exCount > 1 ? 's' : ''}</span>
            </div>
            <div className="flex flex-col items-center py-3 px-2">
              <span className={`font-rajdhani font-black text-xl leading-none ${skillsCount > 0 ? 'text-violet-400' : 'text-[#d4d4d4]'}`}>{skillsCount > 0 ? skillsCount : setsTotal}</span>
              <span className="text-[10px] text-[#4a4a4a] uppercase tracking-widest font-rajdhani mt-1">{skillsCount > 0 ? `Skill${skillsCount > 1 ? 's' : ''}` : 'Séries'}</span>
            </div>
          </div>
        );
      })()}

      {item.type === 'crossfit' && (() => {
        const c = c_content;
        const wodType = c.wod_type?.toUpperCase() ?? 'WOD';
        const exCount = c.exercises?.length ?? 0;
        const result = c.result_value ? `${c.result_value} ${c.result_unit ?? ''}`.trim() : '—';
        return (
          <div className="grid grid-cols-3 divide-x divide-white/5 border-b border-white/5 bg-[#0d0d0d]">
            <div className="flex flex-col items-center py-3 px-2">
              <span className="font-rajdhani font-black text-xl text-orange-400 leading-none uppercase">{wodType}</span>
              <span className="text-[10px] text-orange-700 uppercase tracking-widest font-rajdhani mt-1">Type WOD</span>
            </div>
            <div className="flex flex-col items-center py-3 px-2">
              <span className="font-rajdhani font-black text-xl text-[#d4d4d4] leading-none">{exCount}</span>
              <span className="text-[10px] text-[#4a4a4a] uppercase tracking-widest font-rajdhani mt-1">Exercice{exCount > 1 ? 's' : ''}</span>
            </div>
            <div className="flex flex-col items-center py-3 px-2">
              <span className="font-rajdhani font-black text-xl text-orange-400 leading-none">{result}</span>
              <span className="text-[10px] text-[#4a4a4a] uppercase tracking-widest font-rajdhani mt-1">Résultat</span>
            </div>
          </div>
        );
      })()}

      {/* ── Exercise lists ── */}
      {item.type === 'workout' && (() => {
        const exList = (c_content.exercises ?? []) as { name: string; sets: number; reps: number; maxWeight?: number }[];
        if (exList.length === 0) return null;
        const repsPerSet = (ex: { sets: number; reps: number }) => ex.sets > 0 ? Math.round(ex.reps / ex.sets) : ex.reps;
        return (
          <div className="px-4 py-3 space-y-2.5">
            {exList.map((ex, i) => (
              <div key={i} className="flex items-center gap-3 min-w-0">
                <span className="font-rajdhani font-black text-red-700 w-5 flex-shrink-0 text-sm">{String(i+1).padStart(2,'0')}</span>
                <span className="font-rajdhani font-bold text-[#e5e5e5] uppercase tracking-wide text-sm min-w-0 truncate">{ex.name}</span>
                <span className="font-rajdhani font-bold text-[#7a7a7a] text-sm flex-shrink-0">{ex.sets > 1 ? `${ex.sets}×${repsPerSet(ex)}` : `${repsPerSet(ex)} reps`}</span>
                {ex.maxWeight != null && ex.maxWeight > 0 && (
                  <span className="font-rajdhani font-black text-[#c9a870] text-sm flex-shrink-0">{ex.maxWeight} kg</span>
                )}
              </div>
            ))}
          </div>
        );
      })()}

      {item.type === 'calisthenics' && (() => {
        const c = c_content;
        const exList: { name: string; sets: number; reps: number; hold_seconds?: number; set_type?: string }[] =
          Array.isArray(c.exercises) && c.exercises.length > 0 ? c.exercises : [];
        if (exList.length === 0) return null;
        const repsPerSet = (ex: { sets: number; reps: number }) => ex.sets > 0 ? Math.round(ex.reps / ex.sets) : ex.reps;
        return (
          <div className="px-4 py-3 space-y-2.5">
            {exList.map((ex, i) => (
              <div key={i} className="flex items-center gap-3 min-w-0">
                <span className="font-rajdhani font-black text-violet-700 w-5 flex-shrink-0 text-sm">{String(i+1).padStart(2,'0')}</span>
                <span className="font-rajdhani font-bold text-[#e5e5e5] uppercase tracking-wide text-sm min-w-0 truncate">{ex.name}</span>
                <span className="font-rajdhani font-bold text-[#7a7a7a] text-sm flex-shrink-0">{ex.sets} sér.</span>
                <span className="font-rajdhani font-black text-violet-400 text-sm flex-shrink-0">
                  {ex.set_type === 'timed' && ex.hold_seconds ? `${Math.round(ex.hold_seconds / (ex.sets || 1))}s` : `${repsPerSet(ex)} reps`}
                </span>
              </div>
            ))}
          </div>
        );
      })()}

      {item.type === 'crossfit' && (() => {
        const exList = (c_content.exercises ?? []) as { name: string; reps?: number; duration?: number; weight?: number }[];
        if (exList.length === 0) return null;
        return (
          <div className="px-4 py-3 space-y-2.5">
            {exList.map((ex, i) => (
              <div key={i} className="flex items-center gap-3 min-w-0">
                <span className="font-rajdhani font-black text-orange-700 w-5 flex-shrink-0 text-sm">{String(i+1).padStart(2,'0')}</span>
                <span className="font-rajdhani font-bold text-[#e5e5e5] uppercase tracking-wide text-sm min-w-0 truncate">{ex.name}</span>
                {(ex.reps != null || ex.duration != null) && (
                  <span className="font-rajdhani font-bold text-[#7a7a7a] text-sm flex-shrink-0">{ex.reps != null ? `${ex.reps} reps` : `${ex.duration}s`}</span>
                )}
                {ex.weight != null && (
                  <span className="font-rajdhani font-black text-orange-400 text-sm flex-shrink-0">{ex.weight} kg</span>
                )}
              </div>
            ))}
          </div>
        );
      })()}

      {/* Badge card */}
      {item.type === 'badge' && (
        <div className="px-4 py-4 flex items-center gap-4 border-b border-white/5">
          <div
            className="flex-shrink-0 w-12 h-12 flex items-center justify-center border-2"
            style={{ borderColor: typeConfig.accentColor + '60', backgroundColor: typeConfig.accentColor + '15' }}
          >
            <span className="text-2xl">🏅</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-rajdhani font-black text-base text-white uppercase tracking-wide leading-none">
                {c_content.badge_name ?? 'Badge'}
              </span>
              <span
                className="text-[10px] font-rajdhani font-bold border px-1.5 py-0.5 uppercase tracking-wide flex-shrink-0"
                style={{ color: typeConfig.accentColor, borderColor: typeConfig.accentColor + '50' }}
              >
                {c_content.badge_rarity ?? 'commun'}
              </span>
              <span
                className="ml-auto font-rajdhani font-black text-sm flex-shrink-0"
                style={{ color: typeConfig.accentColor }}
              >
                + {c_content.badge_xp ?? 50} XP
              </span>
            </div>
            {c_content.badge_description && (
              <p className="text-xs text-[#6b6b6b] mt-1 italic leading-relaxed truncate">
                "{c_content.badge_description}"
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Personal Record — bloc grandiose ── */}
      {item.type === 'personal_record' && c_content.title && (
        <div className="relative overflow-hidden">
          {/* Ligne dorée top */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9a870]/60 to-transparent" />
          {/* Glow pulsant en fond */}
          <motion.div
            animate={{ opacity: [0.08, 0.22, 0.08] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 50%, #e8c060 0%, #c9a870 30%, transparent 70%)' }}
          />
          {/* Shimmer diagonal qui balaie */}
          <motion.div
            animate={{ x: ['-120%', '220%'] }}
            transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 1.5, ease: 'easeInOut' }}
            className="absolute inset-y-0 w-1/3 pointer-events-none"
            style={{ background: 'linear-gradient(105deg, transparent 0%, rgba(232,192,96,0.25) 50%, transparent 100%)', skewX: '-15deg' }}
          />
          {/* Trophée watermark */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-[0.05] pointer-events-none select-none">
            <Trophy className="w-24 h-24 text-[#c9a870]" />
          </div>
          <div className="relative px-5 py-5 flex flex-col items-center text-center gap-2">
            <span className="text-3xl">🏆</span>
            <div>
              <p
                className="font-rajdhani font-black uppercase tracking-wide leading-tight"
                style={{
                  fontSize: 'clamp(1.2rem, 4vw, 1.8rem)',
                  background: 'linear-gradient(180deg, #f5d990 0%, #c9a870 50%, #8b6f47 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {c_content.title}
              </p>
              <div className="flex items-center justify-center gap-2 mt-1">
                <div className="h-px w-8 bg-[#c9a870]/30" />
                <p className="font-rajdhani font-black text-2xl text-[#c9a870] leading-none">
                  {c_content.value} <span className="text-sm text-[#8b6f47] font-semibold">{c_content.unit}</span>
                </p>
                <div className="h-px w-8 bg-[#c9a870]/30" />
              </div>
            </div>
            <span className="text-[10px] text-[#5a4a20] uppercase tracking-[0.3em] font-rajdhani font-bold">
              Nouveau record personnel
            </span>
          </div>
          {/* Ligne dorée bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9a870]/30 to-transparent" />
        </div>
      )}

      {/* Autres types */}
      {item.type !== 'workout' && item.type !== 'run' && item.type !== 'calisthenics' && item.type !== 'crossfit' && item.type !== 'badge' && item.type !== 'personal_record' && typeConfig.stats && (
        <div className="px-4 py-3">
          <span className="text-xs text-[#a3a3a3]">{typeConfig.stats}</span>
        </div>
      )}

      {/* Voir la séance */}
      {canShowDetail && (
        <div className="px-4 pb-3">
          <button
            onClick={() => setShowDetail(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#c9a870]/10 border border-[#c9a870]/40 text-[#c9a870] text-xs font-rajdhani font-bold uppercase tracking-wide hover:bg-[#c9a870]/20 hover:border-[#c9a870]/70 transition-all"
          >
            <ChevronRight className="w-3.5 h-3.5" />
            Voir la séance
          </button>
        </div>
      )}

      <div className="px-3 pt-3 pb-3 space-y-2 border-t border-white/5">


      {/* Dernier commentaire inline */}
      {comments.length > 0 && !showComments && (
        <button
          onClick={() => setShowComments(true)}
          className="w-full text-left flex items-center gap-2 py-1 hover:bg-white/3 transition-colors"
        >
          <div className="flex-shrink-0 w-6 h-6 bg-slate-700/80 border border-white/10 flex items-center justify-center">
            <span className="text-xs font-bold text-[#d4d4d4]">
              {(comments[comments.length - 1].user?.username ?? '?').slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1 flex items-baseline gap-1.5">
            <span className="text-xs font-semibold text-[#a3a3a3] flex-shrink-0">
              {comments[comments.length - 1].user?.username ?? 'Inconnu'}
            </span>
            <span className="text-xs text-[#6b6b6b] truncate">
              {comments[comments.length - 1].content.slice(0, 80)}
            </span>
          </div>
          {comments.length > 1 && (
            <span className="text-[10px] text-[#4a4a4a] flex-shrink-0">+{comments.length - 1}</span>
          )}
        </button>
      )}

      {/* Footer : réactions + commentaires */}
      <div className="flex items-center gap-3 pt-1 border-t border-white/5 flex-wrap">
        {/* Reaction dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowReactionPicker(p => !p)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-rajdhani font-bold uppercase tracking-wide border transition-all ${
              hasLiked
                ? 'border-[#c9a870]/50 text-[#c9a870] bg-[#c9a870]/10'
                : 'border-white/10 text-[#5a5a5a] hover:border-white/20 hover:text-[#a3a3a3]'
            }`}
          >
            <span>{hasLiked ? savedReaction : '＋'}</span>
            <span>{hasLiked ? likes.length : 'Réagir'}</span>
            {!hasLiked && <span className="text-[10px] opacity-60">▾</span>}
          </button>

          {showReactionPicker && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowReactionPicker(false)} />
              <div className="absolute bottom-full left-0 mb-1 z-50 flex gap-1 bg-[#1a1a1a] border border-white/10 p-1.5">
                {REACTIONS.map(r => (
                  <button
                    key={r.emoji}
                    onClick={() => { handleReaction(r.emoji); setShowReactionPicker(false); }}
                    className={`text-lg px-1.5 py-0.5 transition-colors hover:bg-white/10 ${
                      hasLiked && savedReaction === r.emoji ? 'bg-white/15' : ''
                    }`}
                    title={r.label}
                  >
                    {r.emoji}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        {hasLiked && likes.length > 0 && (
          <span className="text-xs text-[#4a4a4a]">{likes.length}</span>
        )}

        {canSave && currentUserId && (
          <button
            onClick={() => { setSaveCustomName(''); setShowSaveModal(true); }}
            title="Enregistrer cette séance"
            className={`flex items-center gap-1 text-xs transition-colors ${saved ? 'text-[#c9a870]' : 'text-[#6b6b6b] hover:text-[#c9a870]'}`}
          >
            <Bookmark className="w-3.5 h-3.5" fill={saved ? 'currentColor' : 'none'} />
          </button>
        )}

        {canCopy && currentUserId && (
          <button
            onClick={handleCopySession}
            disabled={copying}
            title="Réutiliser cette séance"
            className="flex items-center gap-1 text-xs text-[#6b6b6b] hover:text-[#a3a3a3] transition-colors disabled:opacity-40"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          onClick={() => {
            setShowComments(prev => !prev);
            if (!showComments) setTimeout(() => inputRef.current?.focus(), 100);
          }}
          className="flex items-center gap-1.5 text-xs text-[#4a4a4a] hover:text-[#a3a3a3] transition-colors ml-auto"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>{comments.length}</span>
        </button>
      </div>

      {/* Modal enregistrer séance */}
      {showSaveModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowSaveModal(false)} />
          <div className="relative bg-[#111] border border-white/10 w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-rajdhani font-bold text-[#f5f5f5] uppercase tracking-wide text-sm">Enregistrer la séance</span>
              <button onClick={() => setShowSaveModal(false)} className="text-[#6b6b6b] hover:text-[#f5f5f5] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-[10px] text-[#6b6b6b] uppercase tracking-wide font-rajdhani mb-1">Titre (optionnel)</label>
              <input
                type="text"
                autoFocus
                value={saveCustomName}
                onChange={e => setSaveCustomName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSaveSession()}
                placeholder={(item.content as any).name ?? `Séance de ${username}`}
                className="w-full bg-[#1a1a1a] border border-white/10 text-[#f5f5f5] text-sm px-3 py-2 placeholder-[#4a4a4a] focus:outline-none focus:border-[#c9a870]/50 font-rajdhani"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveSession}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-[#c9a870]/10 border border-[#c9a870]/40 text-[#c9a870] text-sm font-rajdhani font-bold uppercase tracking-wide hover:bg-[#c9a870]/20 transition-all disabled:opacity-50"
              >
                <Bookmark className="w-3.5 h-3.5" />
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 border border-white/10 text-[#6b6b6b] text-sm font-rajdhani hover:bg-white/5 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick reply bar — toujours visible quand les commentaires sont fermés */}
      {currentUserId && !showComments && (
        <button
          onClick={() => { setShowComments(true); setTimeout(() => inputRef.current?.focus(), 100); }}
          className="w-full flex items-center gap-2.5 bg-[#1a1a1a] border-t border-white/8 px-3 py-2.5 hover:bg-white/3 transition-colors group"
        >
          <div className="flex-shrink-0 w-7 h-7 bg-[#252525] border border-white/10 flex items-center justify-center">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={myInitials} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[10px] font-bold font-rajdhani text-[#c9a870]">{myInitials}</span>
            )}
          </div>
          <span className="text-xs text-[#4a4a4a] group-hover:text-[#6b6b6b] transition-colors">
            Dis quelque chose…
          </span>
        </button>
      )}

        {/* Comments section */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-2 space-y-2">
                {/* Existing comments */}
                {comments.length > 0 && (
                  <div className="space-y-2">
                    {comments.map(comment => (
                      <div key={comment.id} className="flex items-start gap-2 group">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-700/80 border border-white/10/50 flex items-center justify-center mt-0.5">
                          <span className="text-xs font-bold text-[#d4d4d4]">
                            {(comment.user?.username ?? '?').slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-[#d4d4d4]">
                              {comment.user?.username ?? 'Inconnu'}
                            </span>
                            <span className="text-xs text-[#4a4a4a]">
                              {formatRelativeTime(comment.created_at)}
                            </span>
                          </div>
                          <p className="text-xs text-[#a3a3a3] mt-0.5 break-words">{comment.content}</p>
                        </div>
                        {currentUserId && comment.user_id === currentUserId && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            disabled={deletingCommentId === comment.id}
                            className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-[#4a4a4a] hover:text-red-400"
                            aria-label="Supprimer le commentaire"
                          >
                            {deletingCommentId === comment.id ? (
                              <span className="text-xs">...</span>
                            ) : (
                              <X className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Add comment input */}
                {currentUserId && (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      ref={inputRef}
                      type="text"
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Donne de la force à ton gars ou détruit le…"
                      className="flex-1 bg-[#1c1c1c] border border-white/8/60 rounded px-3 py-2 text-xs text-[#e5e5e5] placeholder-slate-600 focus:outline-none focus:border-[#c9a870]/40 transition-colors"
                    />
                    <button
                      onClick={handleSendComment}
                      disabled={sendingComment || !commentText.trim()}
                      className="flex-shrink-0 p-2 rounded bg-transparent border border-red-800/50 text-red-400 hover:bg-transparent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      aria-label="Envoyer le commentaire"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      {showDetail && canShowDetail && (
        <SessionDetailModal item={item} onClose={() => setShowDetail(false)} />
      )}
      </div>{/* fin px-3 */}
      </div>{/* fin min-w-0 CONTENT */}
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Feed tab
// ─────────────────────────────────────────────

const FEED_PAGE_SIZE = 10;

interface FeedTabProps {
  currentUserId: string | undefined;
}

function FeedTab({ currentUserId }: FeedTabProps) {
  const [items, setItems] = useState<ActivityFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const offset = useRef(0);

  const fetchFeed = useCallback(async (reset = false) => {
    if (reset) {
      setLoading(true);
      offset.current = 0;
    } else {
      setLoadingMore(true);
    }
    setError('');

    try {
      const data = await feedService.getFeed(FEED_PAGE_SIZE, offset.current);
      if (reset) {
        setItems(data);
      } else {
        setItems(prev => [...prev, ...data]);
      }
      setHasMore(data.length === FEED_PAGE_SIZE);
      offset.current += data.length;
    } catch {
      setError('Impossible de charger le feed.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed(true);
  }, [fetchFeed]);

  function handleLike(itemId: string) {
    if (!currentUserId) return;

    // Optimistic update
    setItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const likes = item.likes ?? [];
      const hasLiked = likes.some(l => l.user_id === currentUserId);
      const newLikes = hasLiked
        ? likes.filter(l => l.user_id !== currentUserId)
        : [...likes, { id: `optimistic-${Date.now()}`, activity_id: itemId, user_id: currentUserId, created_at: new Date().toISOString() }];
      return { ...item, likes: newLikes };
    }));

    // API call (fire-and-forget)
    feedService.toggleLike(itemId, currentUserId).catch(() => {
      // Revert on failure
      fetchFeed(true);
    });
  }

  function handleCommentAdded(itemId: string, comment: ActivityComment) {
    setItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      return { ...item, comments: [...(item.comments ?? []), comment] };
    }));
  }

  function handleCommentDeleted(itemId: string, commentId: string) {
    setItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      return { ...item, comments: (item.comments ?? []).filter(c => c.id !== commentId) };
    }));
  }

  const storyUsers = useMemo(() => {
    const seen = new Set<string>();
    return items
      .filter(i => i.user && !seen.has(i.user_id) && !!seen.add(i.user_id))
      .slice(0, 12);
  }, [items]);

  const groupedByDay = useMemo(() => {
    const groups: { dateKey: string; label: string; items: typeof items }[] = [];
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const seen = new Map<string, number>();
    for (const item of items) {
      const dateKey = new Date(item.created_at).toDateString();
      if (!seen.has(dateKey)) {
        seen.set(dateKey, groups.length);
        let label: string;
        if (dateKey === today) label = 'Aujourd\'hui';
        else if (dateKey === yesterday) label = 'Hier';
        else label = new Date(item.created_at).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
        groups.push({ dateKey, label, items: [] });
      }
      groups[seen.get(dateKey)!].items.push(item);
    }
    return groups;
  }, [items]);

  if (loading) return <Loader text="Chargement du feed..." />;

  if (error) {
    return (
      <Card className="p-6 text-center">
        <p className="text-sm text-red-400">{error}</p>
        <Button variant="ghost" size="sm" onClick={() => fetchFeed(true)} className="mt-3">
          Réessayer
        </Button>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="p-10 text-center">
        <MessageCircle className="w-12 h-12 mx-auto mb-3 text-[#4a4a4a]" />
        <p className="text-[#a3a3a3] font-medium">Le feed est vide pour l'instant.</p>
        <p className="text-[#6b6b6b] text-sm mt-1">Les activités de la communauté apparaîtront ici.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stories horizontales */}
      {storyUsers.length > 0 && (
        <div className="overflow-x-auto pb-1 -mx-1 px-1">
          <div className="flex gap-3 w-max">
            {storyUsers.map(item => {
              const uname = item.user?.username ?? 'Inconnu';
              const initials = uname.slice(0, 2).toUpperCase();
              return (
                <Link
                  key={item.user_id}
                  to={`/profil/${item.user_id}`}
                  className="flex flex-col items-center gap-1 flex-shrink-0 hover:opacity-80 transition-opacity"
                >
                  <div className="w-10 h-10 border-2 border-[#c9a870]/50 overflow-hidden bg-[#1c1c1c] flex items-center justify-center">
                    {item.user?.avatar_url ? (
                      <img src={item.user.avatar_url} alt={uname} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold font-rajdhani text-[#c9a870]">{initials}</span>
                    )}
                  </div>
                  <span className="text-[10px] text-[#6b6b6b] max-w-[40px] truncate text-center">{uname}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {groupedByDay.map(group => (
        <div key={group.dateKey} className="space-y-3">
          {/* Séparateur de date */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-xs font-rajdhani font-bold uppercase tracking-widest text-[#c9a870] border border-[#c9a870]/25 bg-[#c9a870]/5 px-3 py-1">
              {group.label}
            </span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          {/* Items du jour */}
          <div className="space-y-3">
            {group.items.map(item => (
              <FeedItemCard
                key={item.id}
                item={item}
                currentUserId={currentUserId}
                onLike={handleLike}
                onCommentAdded={handleCommentAdded}
                onCommentDeleted={handleCommentDeleted}
              />
            ))}
          </div>
        </div>
      ))}

      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="ghost"
            size="sm"
            loading={loadingMore}
            onClick={() => fetchFeed(false)}
          >
            Charger plus
          </Button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Challenge card
// ─────────────────────────────────────────────

interface ChallengeCardProps {
  challenge: CommunityChallenge;
  userId: string | undefined;
  onJoin: (id: string) => Promise<void>;
  onContribute: (challenge: CommunityChallenge) => void;
  joiningId: string | null;
  showMyContribution?: boolean;
}

function ChallengeCard({
  challenge,
  userId,
  onJoin,
  onContribute,
  joiningId,
  showMyContribution = false,
}: ChallengeCardProps) {
  const total = calcTotal(challenge);
  const progress = Math.min((total / challenge.target_value) * 100, 100);
  const participants = (challenge.participations ?? []).length;
  const days = daysRemaining(challenge.end_date);
  const isParticipant = (challenge.participations ?? []).some(p => p.user_id === userId);
  const myContribution = (challenge.participations ?? []).find(p => p.user_id === userId)?.contribution ?? 0;
  const isJoining = joiningId === challenge.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span
              className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${typeBadgeClass(challenge.type)}`}
            >
              {challenge.type === 'distance' && <Target className="w-3 h-3" />}
              {challenge.type === 'tonnage' && <Trophy className="w-3 h-3" />}
              {challenge.type === 'sessions' && <Calendar className="w-3 h-3" />}
              {typeLabel(challenge.type)}
            </span>
            {challenge.is_flash && (
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border bg-transparent text-amber-500 border-amber-700/50">
                <Zap className="w-3 h-3" />
                FLASH
              </span>
            )}
          </div>
          {challenge.creator && (
            <span className="text-xs text-[#6b6b6b] whitespace-nowrap">
              par {challenge.creator.username}
            </span>
          )}
        </div>

        {/* Title & description */}
        <div>
          <h3 className="font-semibold text-[#f5f5f5] text-base leading-snug">{challenge.title}</h3>
          {challenge.description && (
            <p className="text-sm text-[#a3a3a3] mt-1 leading-relaxed">{challenge.description}</p>
          )}
        </div>

        {/* Progress */}
        <div className="space-y-1.5">
          <ProgressBar
            value={progress}
            color={typeProgressColor(challenge.type)}
            height="sm"
          />
          <div className="flex justify-between items-center text-xs text-[#a3a3a3]">
            <span>
              {total.toLocaleString('fr-FR')} / {challenge.target_value.toLocaleString('fr-FR')} {challenge.unit}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Footer meta */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#6b6b6b]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {participants} participant{participants !== 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Fin : {formatDate(challenge.end_date, { day: 'numeric', month: 'short' })}
            </span>
            {days > 0 ? (
              <span className="text-amber-400 font-medium">{days}j restant{days !== 1 ? 's' : ''}</span>
            ) : (
              <span className="text-red-400 font-medium">Terminé</span>
            )}
          </div>
        </div>

        {/* My contribution (mine tab) */}
        {showMyContribution && isParticipant && (
          <div className="rounded bg-[#1c1c1c] border border-white/5 px-3 py-2 text-sm text-[#d4d4d4]">
            Ma contribution :{' '}
            <span className="font-semibold text-red-300">
              {myContribution.toLocaleString('fr-FR')} {challenge.unit}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end">
          {!isParticipant ? (
            <Button
              size="sm"
              variant="outline"
              icon={<Plus className="w-3.5 h-3.5" />}
              loading={isJoining}
              onClick={() => onJoin(challenge.id)}
              disabled={days === 0}
            >
              Rejoindre
            </Button>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => onContribute(challenge)}
              disabled={days === 0}
            >
              + Ajouter
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Contribution modal
// ─────────────────────────────────────────────

interface ContributeModalProps {
  challenge: CommunityChallenge | null;
  userId: string | undefined;
  onClose: () => void;
  onSaved: () => void;
}

function ContributeModal({ challenge, userId, onClose, onSaved }: ContributeModalProps) {
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (challenge) {
      setValue('');
      setError('');
    }
  }, [challenge]);

  if (!challenge) return null;

  const myContribution = (challenge.participations ?? []).find(p => p.user_id === userId)?.contribution ?? 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!challenge || !userId) return;

    const added = parseFloat(value);
    if (isNaN(added) || added <= 0) {
      setError('Valeur invalide.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const newValue = myContribution + added;
      const { error: supaErr } = await supabase
        .from('challenge_participations')
        .update({ contribution: newValue })
        .eq('challenge_id', challenge.id)
        .eq('user_id', userId);

      if (supaErr) throw supaErr;

      onSaved();
      onClose();
    } catch {
      setError('Erreur lors de la mise à jour. Réessaie.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen={!!challenge} onClose={onClose} title="Ajouter une contribution" size="sm">
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <p className="text-sm text-[#a3a3a3]">
          Défi :{' '}
          <span className="font-medium text-[#e5e5e5]">{challenge.title}</span>
        </p>
        <p className="text-xs text-[#6b6b6b]">
          Ta contribution actuelle :{' '}
          <span className="text-[#d4d4d4] font-medium">
            {myContribution.toLocaleString('fr-FR')} {challenge.unit}
          </span>
        </p>

        <Input
          label={`Quantité à ajouter (${challenge.unit})`}
          type="number"
          min="0"
          step="any"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder={`ex. 5`}
          error={error}
          autoFocus
        />

        {value && !isNaN(parseFloat(value)) && parseFloat(value) > 0 && (
          <p className="text-xs text-[#6b6b6b]">
            Nouveau total :{' '}
            <span className="text-red-300 font-semibold">
              {(myContribution + parseFloat(value)).toLocaleString('fr-FR')} {challenge.unit}
            </span>
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
            Annuler
          </Button>
          <Button type="submit" loading={saving} className="flex-1">
            Confirmer
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// Create form
// ─────────────────────────────────────────────

interface CreateFormProps {
  userId: string;
  onCreated: () => void;
}

interface CreateFormState {
  title: string;
  description: string;
  type: 'distance' | 'tonnage' | 'sessions';
  target_value: string;
  start_date: string;
  end_date: string;
}

function CreateForm({ userId, onCreated }: CreateFormProps) {
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState<CreateFormState>({
    title: '',
    description: '',
    type: 'distance',
    target_value: '',
    start_date: today,
    end_date: '',
  });

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof CreateFormState, string>>>({});
  const [success, setSuccess] = useState(false);

  function set<K extends keyof CreateFormState>(key: K, value: CreateFormState[K]) {
    setForm(f => ({ ...f, [key]: value }));
    setErrors(e => ({ ...e, [key]: undefined }));
    setSuccess(false);
  }

  function validate(): boolean {
    const e: Partial<Record<keyof CreateFormState, string>> = {};
    if (!form.title.trim()) e.title = 'Le titre est obligatoire.';
    const target = parseFloat(form.target_value);
    if (isNaN(target) || target <= 0) e.target_value = 'Objectif invalide.';
    if (!form.start_date) e.start_date = 'Date de début obligatoire.';
    if (!form.end_date) e.end_date = 'Date de fin obligatoire.';
    if (form.start_date && form.end_date && form.end_date <= form.start_date) {
      e.end_date = 'La date de fin doit être après la date de début.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setSuccess(false);

    try {
      const { error } = await supabase.from('community_challenges').insert({
        created_by: userId,
        title: form.title.trim(),
        description: form.description.trim() || null,
        type: form.type,
        target_value: parseFloat(form.target_value),
        unit: unitForType(form.type),
        start_date: form.start_date,
        end_date: form.end_date,
        is_flash: false,
        status: 'active',
      });

      if (error) throw error;

      setForm({
        title: '',
        description: '',
        type: 'distance',
        target_value: '',
        start_date: today,
        end_date: '',
      });
      setSuccess(true);
      onCreated();
    } catch {
      setErrors({ title: 'Erreur lors de la création. Réessaie.' });
    } finally {
      setSaving(false);
    }
  }

  const typeOptions = [
    { value: 'distance', label: 'Distance (km)' },
    { value: 'tonnage', label: 'Tonnage (kg)' },
    { value: 'sessions', label: 'Séances' },
  ];

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-5">
        <div className="p-2 rounded bg-transparent border border-red-800/50">
          <Plus className="w-4 h-4 text-red-400" />
        </div>
        <h2 className="font-semibold text-[#f5f5f5]">Proposer un défi</h2>
      </div>

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded bg-transparent border border-green-900/40 px-4 py-3 text-sm text-green-500"
        >
          Defi cree avec succes ! Il est maintenant actif.
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Titre du défi"
          placeholder="ex. 500 km collectifs en janvier"
          value={form.title}
          onChange={e => set('title', e.target.value)}
          error={errors.title}
        />

        <Textarea
          label="Description (optionnel)"
          placeholder="Décris le défi, les règles, l'objectif..."
          value={form.description}
          onChange={e => set('description', e.target.value)}
          rows={3}
        />

        <Select
          label="Type de défi"
          options={typeOptions}
          value={form.type}
          onChange={e => set('type', e.target.value as CreateFormState['type'])}
          error={errors.type}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label={`Objectif (${unitForType(form.type)})`}
            type="number"
            min="1"
            step="any"
            placeholder="ex. 500"
            value={form.target_value}
            onChange={e => set('target_value', e.target.value)}
            error={errors.target_value}
          />
          <div className="flex items-end pb-0.5">
            <span className="text-sm text-[#a3a3a3] bg-[#1c1c1c] border border-white/8 rounded px-4 py-2.5 w-full">
              {unitForType(form.type)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Date de début"
            type="date"
            value={form.start_date}
            onChange={e => set('start_date', e.target.value)}
            error={errors.start_date}
          />
          <Input
            label="Date de fin"
            type="date"
            value={form.end_date}
            onChange={e => set('end_date', e.target.value)}
            error={errors.end_date}
          />
        </div>

        <div className="pt-1">
          <Button
            type="submit"
            loading={saving}
            icon={<Plus className="w-4 h-4" />}
            className="w-full"
          >
            Proposer le défi
          </Button>
        </div>
      </form>
    </Card>
  );
}

// ─────────────────────────────────────────────
// Main page — Les Monstres (feed only)
// ─────────────────────────────────────────────

export function CommunityPage() {
  const { profile } = useAuth();

  return (
    <div className="space-y-6">
      {/* Header — vitrine guerriers */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden -mx-4 px-6 py-8 sm:mx-0 sm:px-8"
        style={{ background: 'linear-gradient(135deg, #080808 0%, #0f0f0a 50%, #080808 100%)' }}
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9a870]/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9a870]/20 to-transparent" />

        {/* Watermark */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-[0.04] pointer-events-none select-none">
          <Users className="w-44 h-44 text-[#c9a870]" />
        </div>

        <div className="relative flex flex-col items-center text-center gap-3">
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
            className="flex items-center justify-center w-14 h-14 border-2 border-[#c9a870]/40 bg-[#c9a870]/5"
          >
            <Users className="w-7 h-7 text-[#c9a870]" />
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
              Les Monstres
            </h1>
            <div className="flex items-center justify-center gap-3 mt-2">
              <div className="h-px flex-1 max-w-[60px] bg-gradient-to-r from-transparent to-[#c9a870]/40" />
              <p className="text-[10px] text-[#8b6f47] uppercase tracking-[0.3em] font-rajdhani font-bold">
                Ce que font les autres guerriers
              </p>
              <div className="h-px flex-1 max-w-[60px] bg-gradient-to-l from-transparent to-[#c9a870]/40" />
            </div>
          </motion.div>

        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <FeedTab currentUserId={profile?.id} />
      </motion.div>
    </div>
  );
}
